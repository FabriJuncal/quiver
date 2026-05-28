const fs = require('node:fs');
const path = require('node:path');

const { checkHandoff } = require('../lib/handoff');
const { openEditor } = require('../lib/cli/editor');
const { selectOption } = require('../lib/cli/selectors');
const { createUx } = require('../lib/cli/ux');
const { parseJsonWithComments } = require('../lib/json');
const { assertPathInsideRoot, validateProjectRelativePaths } = require('../lib/paths');
const { buildApprovalCandidateReport, formatReviewSummary } = require('../lib/ai/approval-candidates');
const { resolveReviewedTechnicalPlanInput } = require('../lib/ai/plan-review');
const {
  buildSpecGenerationManifest,
  describeSpecGeneration,
  generateSpecArtifacts,
} = require('../lib/ai/spec-generator');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function readInputText(repoRoot, inputPath) {
  const resolved = path.resolve(repoRoot, inputPath || '');
  if (!inputPath || !fs.existsSync(resolved)) {
    throw new Error(formatError(`missing reviewed and approved plan input: ${inputPath || '<default>'}`));
  }
  return fs.readFileSync(resolved, 'utf8');
}

function resolveSpecDir(repoRoot, specInput) {
  const value = String(specInput || '').trim();
  if (!value) {
    throw new Error(formatError('missing spec directory. Use: npx create-quiver spec validate specs/<spec-slug>'));
  }

  const candidates = [
    path.resolve(repoRoot, value),
    path.resolve(repoRoot, 'specs', value),
    path.resolve(repoRoot, 'specs-fix', value),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      assertPathInsideRoot(repoRoot, candidate, 'spec path');
      return candidate;
    }
  }

  throw new Error(formatError(`spec directory not found: ${value}`));
}

function findSliceJsonFiles(specDir) {
  const slicesRoot = path.join(specDir, 'slices');
  const files = [];
  if (!fs.existsSync(slicesRoot)) {
    return files;
  }

  const stack = [slicesRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name === 'slice.json') {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function shortSliceId(sliceId) {
  const match = String(sliceId || '').match(/^(slice-\d+)/);
  return match ? match[1] : String(sliceId || '');
}

function normalizeDependency(specSlug, sliceId, dep) {
  const value = String(dep || '').trim();
  if (!value) {
    return '';
  }
  if (value.includes('/')) {
    return value;
  }
  return `${specSlug}/${value}`;
}

function detectCycle(nodes) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(ref) {
    if (visiting.has(ref)) {
      const start = stack.indexOf(ref);
      return [...stack.slice(start), ref];
    }
    if (visited.has(ref)) {
      return null;
    }

    visiting.add(ref);
    stack.push(ref);
    const node = nodes.get(ref);
    for (const dep of node?.deps || []) {
      if (!nodes.has(dep)) {
        continue;
      }
      const cycle = visit(dep);
      if (cycle) {
        return cycle;
      }
    }
    stack.pop();
    visiting.delete(ref);
    visited.add(ref);
    return null;
  }

  for (const ref of nodes.keys()) {
    const cycle = visit(ref);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}

function missingGitFields(git) {
  const data = git && typeof git === 'object' ? git : {};
  return ['branch_type', 'base_branch', 'branch_slug', 'branch_name']
    .filter((field) => !String(data[field] || '').trim());
}

function buildSpecValidationReport(repoRoot, specInput, options = {}) {
  const strict = options.strict === true;
  const specDir = resolveSpecDir(repoRoot, specInput);
  const relativeSpecDir = toRelativePosix(repoRoot, specDir);
  const specSlug = path.basename(specDir);
  const errors = [];
  const warnings = [];
  const checked = [];
  const docs = ['SPEC.md', 'STATUS.md', 'EVIDENCE_REPORT.md'];
  const docText = {};

  for (const doc of docs) {
    const filePath = path.join(specDir, doc);
    if (!fs.existsSync(filePath)) {
      errors.push(`missing required spec document: ${relativeSpecDir}/${doc}`);
      continue;
    }
    docText[doc] = fs.readFileSync(filePath, 'utf8');
    checked.push(`${relativeSpecDir}/${doc}`);
  }

  const sliceFiles = findSliceJsonFiles(specDir);
  if (sliceFiles.length === 0) {
    errors.push(`spec has no slices: ${relativeSpecDir}/slices`);
  }

  const nodes = new Map();
  const seenSliceIds = new Set();

  for (const sliceFile of sliceFiles) {
    const relativeSliceFile = toRelativePosix(repoRoot, sliceFile);
    checked.push(relativeSliceFile);

    let json;
    try {
      json = parseJsonWithComments(fs.readFileSync(sliceFile, 'utf8'));
    } catch (error) {
      errors.push(`invalid JSON in ${relativeSliceFile}: ${error.message}`);
      continue;
    }

    const sliceId = String(json.slice_id || '').trim();
    const expectedSliceId = path.basename(path.dirname(sliceFile));
    if (!sliceId) {
      errors.push(`${relativeSliceFile} is missing slice_id`);
      continue;
    }
    if (sliceId !== expectedSliceId) {
      errors.push(`${relativeSliceFile} slice_id must match directory name (${expectedSliceId})`);
    }
    if (seenSliceIds.has(sliceId)) {
      errors.push(`duplicate slice_id in spec: ${sliceId}`);
    }
    seenSliceIds.add(sliceId);

    const writeScope = Array.isArray(json.allowed_write_paths) && json.allowed_write_paths.length > 0
      ? json.allowed_write_paths
      : json.files;
    if (!Array.isArray(writeScope) || writeScope.length === 0) {
      errors.push(`${relativeSliceFile} must declare files or allowed_write_paths`);
    }
    const missingGit = missingGitFields(json.git);
    if (missingGit.length > 0) {
      errors.push(`${relativeSliceFile} must declare git.branch_type, git.base_branch, git.branch_slug, and git.branch_name for local execution (missing: ${missingGit.join(', ')}).`);
    }
    try {
      validateProjectRelativePaths(writeScope, `${relativeSliceFile} write scope`);
      validateProjectRelativePaths(json.expected_read_paths, `${relativeSliceFile} expected_read_paths`);
    } catch (error) {
      errors.push(error.message);
    }

    for (const briefName of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
      const briefRel = toRelativePosix(repoRoot, path.join(path.dirname(sliceFile), briefName));
      try {
        checkHandoff(briefRel, repoRoot);
        checked.push(briefRel);
      } catch (error) {
        errors.push(error.message);
      }
    }

    const ref = `${specSlug}/${sliceId}`;
    const deps = (Array.isArray(json.depends_on) ? json.depends_on : [])
      .map((dep) => normalizeDependency(specSlug, sliceId, dep))
      .filter(Boolean);
    nodes.set(ref, { deps, json, ref, sliceId });

    const statusNeedle = shortSliceId(sliceId);
    if (docText['STATUS.md'] && !docText['STATUS.md'].includes(sliceId) && !docText['STATUS.md'].includes(statusNeedle)) {
      warnings.push(`STATUS.md does not reference ${sliceId}`);
    }

    if (String(json.status || '').trim() === 'completed') {
      if (!json.completed_at) {
        warnings.push(`${relativeSliceFile} is completed but missing completed_at`);
      }
      if (docText['EVIDENCE_REPORT.md'] && !docText['EVIDENCE_REPORT.md'].includes(sliceId) && !docText['EVIDENCE_REPORT.md'].includes(statusNeedle)) {
        warnings.push(`EVIDENCE_REPORT.md does not reference completed slice ${sliceId}`);
      }
    }
  }

  for (const [ref, node] of nodes.entries()) {
    for (const dep of node.deps) {
      if (dep.startsWith(`${specSlug}/`) && !nodes.has(dep)) {
        errors.push(`${ref} depends on missing slice ${dep}`);
      }
    }
  }

  const cycle = detectCycle(nodes);
  if (cycle) {
    errors.push(`dependency cycle detected: ${cycle.join(' -> ')}`);
  }

  if (strict && warnings.length > 0) {
    errors.push(...warnings.map((warning) => `strict warning: ${warning}`));
  }

  return {
    ok: errors.length === 0,
    specDir: relativeSpecDir,
    checked,
    errors,
    warnings,
    slices: sliceFiles.length,
    strict,
  };
}

function formatSpecValidationReport(report) {
  const lines = [
    'Quiver spec validation',
    `Spec: ${report.specDir}`,
    `Slices: ${report.slices}`,
    `Strict: ${report.strict ? 'yes' : 'no'}`,
  ];

  if (report.checked.length > 0) {
    lines.push('Checked files:');
    for (const file of report.checked) {
      lines.push(`- ${file}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }

  lines.push(report.ok ? 'PASS: spec validation passed.' : 'FAIL: spec validation failed.');
  return `${lines.join('\n')}\n`;
}

function runValidateSpec(repoRoot, specInput, options = {}) {
  const report = buildSpecValidationReport(repoRoot, specInput, options);
  process.stdout.write(formatSpecValidationReport(report));

  if (!report.ok) {
    const error = new Error(formatError(`spec validate failed for ${report.specDir}`));
    error.code = 'SPEC_VALIDATE_FAILED';
    error.details = report;
    throw error;
  }

  return report;
}

function buildSpecCreatePreview(repoRoot, options = {}) {
  const resolved = resolveReviewedTechnicalPlanInput(repoRoot, options.input || undefined);
  const inputPath = resolved.inputPath;
  const inputText = readInputText(repoRoot, inputPath);
  const manifest = buildSpecGenerationManifest({
    inputPath,
    inputText,
    repoRoot,
    specSlug: options.specSlug,
  });
  const preview = describeSpecGeneration(manifest, repoRoot);
  const relativeSpecDir = toRelativePosix(repoRoot, preview.specDir);

  if (fs.existsSync(preview.specDir)) {
    throw new Error(formatError(`spec directory already exists: ${relativeSpecDir}`));
  }

  return {
    inputPath,
    manifest,
    preview,
    relativeSpecDir,
  };
}

function formatNextCommands(specDir) {
  return [
    'Next safe commands:',
    `- npx create-quiver spec start ${specDir}`,
    `- npx create-quiver spec status ${specDir}`,
    '- npx create-quiver next',
    '- npx create-quiver ai execute-plan --dry-run --commit',
  ];
}

function formatSpecCreateDryRun(preview) {
  const lines = [
    'Quiver spec create dry-run',
    `Spec slug: ${preview.manifest.slug}`,
    `Title: ${preview.manifest.title}`,
    `Input file: ${preview.inputPath}`,
    `Target: ${preview.relativeSpecDir}`,
    `Planned files: ${preview.preview.files.length}`,
  ];

  for (const file of preview.preview.files) {
    lines.push(`- ${file}`);
  }

  if (preview.reviewRequested) {
    lines.push('Review requested: yes (dry-run preview only; no editor opened and no files written).');
  }

  lines.push(...formatNextCommands(preview.relativeSpecDir));
  lines.push('No files will be written in dry-run mode.');
  return `${lines.join('\n')}\n`;
}

function formatSpecCreateResult(result, repoRoot) {
  const relativeSpecDir = toRelativePosix(repoRoot, result.specDir);
  const lines = [
    'Quiver spec created',
    `Spec slug: ${result.manifest.slug}`,
    `Target: ${relativeSpecDir}`,
    `Files written: ${result.files.length}`,
  ];

  for (const filePath of result.files) {
    lines.push(`- ${toRelativePosix(repoRoot, filePath)}`);
  }

  lines.push(...formatNextCommands(relativeSpecDir));
  return `${lines.join('\n')}\n`;
}

function createSpecReviewFile(preview, options = {}) {
  const os = require('node:os');
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-create-review-'));
  const reviewPath = path.join(reviewDir, 'spec-create-preview.md');
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, formatSpecCreateDryRun({ ...preview, reviewRequested: false }));
  return reviewPath;
}

const SPEC_METHODOLOGY_OPTIONS = Object.freeze([
  {
    label: 'WDD + SDD',
    value: 'wdd-sdd',
    hint: 'Workflow Driven Development + Spec Driven Development',
    default: true,
  },
]);

async function resolveInteractiveSpecCreateOptions(repoRoot, preview, options = {}) {
  if (options.interactive !== true) {
    return options;
  }

  const ux = options.ux || createUx({
    interactive: true,
    promptConfirm: options.promptConfirm,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });

  if (!ux.mode.usePrompts) {
    throw new Error(formatError('spec create --interactive requires an interactive TTY. Use --input, --spec, --review, and --dry-run for non-interactive automation.'));
  }

  const selectorOptions = {
    env: options.env,
    input: options.inputStream,
    interactive: true,
    noColor: options.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    stderrIsTTY: options.stderrIsTTY,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
  };
  const technicalPlanCandidates = buildApprovalCandidateReport(repoRoot, 'technical-plan');
  const approvedVersion = technicalPlanCandidates.approved?.version
    ? `v${technicalPlanCandidates.approved.version}`
    : 'approved';
  const reviewSummary = formatReviewSummary(technicalPlanCandidates.review);
  const selectedMethodology = await selectOption('¿Qué metodología aplica esta spec?', SPEC_METHODOLOGY_OPTIONS, {
    ...selectorOptions,
    defaultValue: 'wdd-sdd',
    flag: '--methodology',
    name: 'methodology',
    value: options.methodology || '',
  });
  const selectedInput = await selectOption('¿Qué plan aprobado querés usar?', [
    {
      label: preview.inputPath,
      value: preview.inputPath,
      hint: ['Plan técnico revisado y aprobado', approvedVersion, reviewSummary].filter(Boolean).join(', '),
      default: true,
    },
  ], {
    ...selectorOptions,
    defaultValue: preview.inputPath,
    flag: '--input',
    name: 'approved technical plan input',
    value: options.input || '',
  });
  const selectedReview = await selectOption('¿Cómo querés revisar antes de escribir?', [
    {
      label: 'Crear despues de confirmar',
      value: 'direct',
      hint: 'Muestra resumen y pide aprobacion final',
      default: options.review !== true,
    },
    {
      label: 'Abrir preview de review',
      value: 'review',
      hint: 'Usa $VISUAL o $EDITOR antes de escribir',
      default: options.review === true,
    },
  ], {
    ...selectorOptions,
    defaultValue: options.review === true ? 'review' : 'direct',
    flag: '--review',
    name: 'spec create review mode',
  });

  ux.summary([
    { label: 'Spec', value: preview.manifest.slug },
    { label: 'Metodologia', value: selectedMethodology.label },
    { label: 'Input', value: selectedInput.value },
    { label: 'Plan tecnico', value: ['aprobado', approvedVersion, reviewSummary].filter(Boolean).join(', ') },
    { label: 'Target', value: preview.relativeSpecDir },
    { label: 'Archivos planificados', value: preview.preview.files.length },
    { label: 'Revision', value: selectedReview.value === 'review' ? 'abrir preview' : 'confirmacion directa' },
  ], { title: 'Spec create' });

  return {
    ...options,
    input: selectedInput.value,
    methodology: selectedMethodology.value,
    review: selectedReview.value === 'review',
    ux,
  };
}

async function confirmSpecCreate(message, options = {}) {
  if (options.interactive !== true) {
    return;
  }

  const ux = options.ux || createUx({
    interactive: true,
    promptConfirm: options.promptConfirm,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });
  const confirmed = await ux.promptConfirm(message, { initialValue: false });
  if (!confirmed) {
    throw new Error(formatError('spec create interactive approval declined. No files were written.'));
  }
}

async function reviewSpecCreatePreview(repoRoot, preview, options = {}) {
  if (options.review !== true) {
    return '';
  }

  const reviewPath = createSpecReviewFile(preview, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw new Error(formatError(`spec create --review requires an interactive terminal or an injected editor runner.\nReview artifact: ${reviewPath}`));
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw new Error(formatError(`${editorResult?.reason || 'spec create review was canceled.'}\nReview artifact: ${reviewPath}`));
  }

  return reviewPath;
}

async function runCreateSpec(repoRoot, options = {}) {
  const preview = buildSpecCreatePreview(repoRoot, options);
  const resolvedOptions = await resolveInteractiveSpecCreateOptions(repoRoot, preview, options);

  if (resolvedOptions.dryRun) {
    process.stdout.write(formatSpecCreateDryRun({ ...preview, reviewRequested: resolvedOptions.review === true }));
    return {
      task: 'spec-create',
      dryRun: true,
      manifest: preview.manifest,
      specDir: preview.relativeSpecDir,
      files: preview.preview.files,
    };
  }

  const reviewPath = await reviewSpecCreatePreview(repoRoot, preview, resolvedOptions);
  await confirmSpecCreate(`Create spec '${preview.manifest.slug}'?`, resolvedOptions);

  const result = generateSpecArtifacts(repoRoot, {
    input: resolvedOptions.input || preview.inputPath,
    specSlug: resolvedOptions.specSlug,
  });
  process.stdout.write(formatSpecCreateResult(result, repoRoot));

  return {
    task: 'spec-create',
    dryRun: false,
    specSlug: result.manifest.slug,
    specDir: toRelativePosix(repoRoot, result.specDir),
    files: result.files.map((filePath) => toRelativePosix(repoRoot, filePath)),
    manifest: result.manifest,
    reviewPath,
  };
}

module.exports = {
  buildSpecValidationReport,
  buildSpecCreatePreview,
  formatSpecCreateDryRun,
  formatSpecCreateResult,
  formatSpecValidationReport,
  runCreateSpec,
  runValidateSpec,
};
