const path = require('node:path');

const SPEC_FOUNDATION_SLICE_ID = 'slice-00-spec-foundation';

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'generated-spec';
}

function titleizeFromSlug(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function bullets(items, fallback = '- n/a') {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) {
    return [fallback];
  }
  return list.map((item) => `- ${item}`);
}

function normalizeStringArray(items) {
  return Array.isArray(items) ? items.map((item) => String(item).trim()).filter(Boolean) : [];
}

function resolveExpectedReadPaths(manifest, slice) {
  const explicit = normalizeStringArray(slice.expected_read_paths);
  if (explicit.length > 0) {
    return explicit;
  }

  if (slice.slice_id === SPEC_FOUNDATION_SLICE_ID) {
    return [manifest.sourcePath];
  }

  return [
    manifest.sourcePath,
    `specs/${manifest.slug}/SPEC.md`,
    `specs/${manifest.slug}/slices/${slice.slice_id}/slice.json`,
    `specs/${manifest.slug}/slices/${slice.slice_id}/EXECUTION_BRIEF.md`,
  ];
}

function resolveAllowedWritePaths(slice) {
  const explicit = normalizeStringArray(slice.allowed_write_paths);
  if (explicit.length > 0) {
    return explicit;
  }

  return normalizeStringArray(slice.files);
}

function resolveValidationHints(slice) {
  const explicit = normalizeStringArray(slice.validation_hints);
  if (explicit.length > 0) {
    return explicit;
  }

  return normalizeStringArray(slice.tests);
}

function displayStatus(status, defaultStatus = 'draft') {
  const normalized = String(status || defaultStatus).trim().toLowerCase();
  if (normalized === 'completed') {
    return 'Completed';
  }
  if (normalized === 'ready') {
    return 'Ready';
  }
  if (normalized === 'blocked') {
    return 'Blocked';
  }
  return 'Draft';
}

function section(lines, heading, bodyLines) {
  lines.push(heading, '', ...bodyLines, '');
}

function renderScope(scope = {}) {
  const lines = [];
  section(lines, '### Included', bullets(scope.included, '- n/a'));
  section(lines, '### Excluded', bullets(scope.excluded, '- n/a'));
  return lines;
}

function renderSliceTableRows(manifest) {
  return manifest.slices.map((slice, index) => {
    const sliceLink = `./slices/${slice.slice_id}/slice.json`;
    const status = displayStatus(slice.status, index === 0 ? 'ready' : 'draft');
    return `| ${String(index).padStart(2, '0')} | ${slice.title} | ${status} | [${slice.slice_id}](${sliceLink}) |`;
  });
}

function renderStatusRows(manifest) {
  return manifest.slices.map((slice, index) => {
    const status = displayStatus(slice.status, index === 0 ? 'ready' : 'draft');
    return `| ${slice.slice_id} | ${slice.title} | ${status} | - | ${slice.estimated_hours || 0} | - |`;
  });
}

function renderEvidenceRows(manifest) {
  return manifest.slices.map((slice, index) => {
    const status = displayStatus(slice.status, index === 0 ? 'ready' : 'draft');
    const evidence = index === 0
      ? 'Spec foundation generated and JSON validation completed.'
      : 'Pending implementation.';
    return `| ${slice.slice_id} | ${slice.acceptance.length || 0} | ${status} | ${evidence} |`;
  });
}

function renderParallelGroups(manifest) {
  const groups = manifest.executionGroups.filter((group) => group.length > 1);
  if (groups.length === 0) {
    return ['- No parallel groups in the first generated draft.'];
  }

  return groups.map((group, index) => {
    const refs = group.map((slice) => slice.slice_id).join(', ');
    return `- Group ${index + 1} after ${group[0].depends_on.join(', ') || 'slice-00-spec-foundation'}: ${refs}`;
  });
}

function renderExecutionOrder(manifest) {
  return manifest.executionOrder.map((slice, index) => {
    const deps = slice.depends_on.length > 0 ? slice.depends_on.join(', ') : 'none';
    return `${index + 1}. \`${slice.slice_id}\` - depends on ${deps}`;
  });
}

function buildSpecMarkdown(manifest) {
  const lines = [
    `# ${manifest.title}`,
    '',
    `**Date:** ${manifest.date}`,
    `**Status:** ${manifest.status}`,
    '',
    '## Objective',
    '',
    manifest.objective,
    '',
    '## Approved Input',
    '',
    `Approved source: \`${manifest.sourcePath}\``,
    '',
    '## Scope',
    '',
    ...renderScope(manifest.scope),
    '## Acceptance Criteria',
    '',
    ...bullets(manifest.acceptance, '- All generated files parse and the spec is safe to review.'),
    '',
    '## Slices',
    '',
    '| Slice | Title | Status | Spec |',
    '|-------|-------|--------|------|',
    `| 00 | ${manifest.slices[0].title} | ${displayStatus(manifest.slices[0].status, 'ready')} | [${manifest.slices[0].slice_id}](./slices/${manifest.slices[0].slice_id}/slice.json) |`,
    ...renderSliceTableRows(manifest).slice(1),
    '',
    '## Definition of Done',
    '',
    '- `slice-00` exists and every later slice depends on it directly or indirectly.',
    '- Every slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.',
    '- `pr.md` exists for the spec.',
    '- All generated `slice.json` files parse successfully.',
    '',
    '## Risks',
    '',
    ...bullets(manifest.risks, '- The first version can only use the approved input source and a safe fallback layout.'),
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildStatusMarkdown(manifest) {
  const lines = [
    `# ${manifest.title} Spec Status`,
    '',
    `**Spec:** ${manifest.slug}`,
    `**Last updated:** ${manifest.date}`,
    '',
    '## Spec Status',
    '',
    '| Slice | Title | Status | PR | Estimated hours | Actual hours |',
    '|-------|--------|--------|----|-----------------|--------------|',
    ...renderStatusRows(manifest),
    '',
    '## Progress',
    '',
    `- Completed slices: ${manifest.slices.filter((slice) => slice.status === 'completed').length} / ${manifest.slices.length}`,
    `- Estimated hours: ${manifest.slices.reduce((sum, slice) => sum + Number(slice.estimated_hours || 0), 0)}`,
    '- Actual hours: 0',
    '',
    '## Blockers',
    '',
    '| Slice | Blocker | Since | Action needed |',
    '|-------|---------|-------|---------------|',
    '| - | - | - | - |',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildEvidenceMarkdown(manifest) {
  const lines = [
    `# ${manifest.title} Evidence Report`,
    '',
    `**Spec:** ${manifest.slug}`,
    `**Last updated:** ${manifest.date}`,
    `**Status:** In progress`,
    '',
    '## Summary',
    '',
    '| Slice | Acceptance criteria | Status | Evidence |',
    '|-------|---------------------|--------|----------|',
    ...renderEvidenceRows(manifest),
    '',
    '## Evidence by Slice',
    '',
    '- Record command, exit code, and the first relevant success or failure signal for each slice.',
    '- Keep long logs in artifacts or separate files when needed.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildExecutionPlanMarkdown(manifest) {
  const lines = [
    `# Execution Plan - ${manifest.title}`,
    '',
    '## Rule',
    '',
    '`slice-00` is mandatory and must be committed first. It establishes the spec foundation in the repo.',
    '',
    '## Sequential Foundation',
    '',
    ...renderExecutionOrder(manifest),
    '',
    '## Parallelizable Work',
    '',
    ...renderParallelGroups(manifest),
    '',
    '## Final Integration',
    '',
    'Keep later slices integrated in dependency order and only merge parallel work after its prerequisites are committed.',
    '',
    '## Suggested Commit Order',
    '',
    ...manifest.executionOrder.map((slice) => `- ${slice.slice_id}`),
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildPrMarkdown(manifest) {
  const files = [
    `specs/${manifest.slug}/SPEC.md`,
    `specs/${manifest.slug}/STATUS.md`,
    `specs/${manifest.slug}/EVIDENCE_REPORT.md`,
    `specs/${manifest.slug}/EXECUTION_PLAN.md`,
    `specs/${manifest.slug}/pr.md`,
    `specs/${manifest.slug}/slices/**`,
  ];

  const lines = [
    `# PR - ${manifest.ticket} - ${manifest.title}`,
    '',
    '## Title',
    '',
    `${manifest.title} spec generation`,
    '',
    '## Summary',
    '',
    'Generate the spec foundation, slice-00, implementation slices, execution plan, and PR body from the approved planning input.',
    '',
    '## Scope',
    '',
    '- `SPEC.md`',
    '- `STATUS.md`',
    '- `EVIDENCE_REPORT.md`',
    '- `EXECUTION_PLAN.md`',
    '- `pr.md`',
    '- `slice-00` and later slices with execution and closure briefs',
    '',
    '## Files',
    '',
    ...files.map((file) => `- \`${file}\``),
    '',
    '## How to Test (DETAILED - REQUIRED)',
    '',
    '### Required Environment',
    '',
    '- Node.js',
    '- Git',
    '',
    '### Worktree Access',
    '',
    '```bash',
    `cd <repo-root>`,
    `npx create-quiver spec create --input <approved-input> --spec ${manifest.slug}`,
    '```',
    '',
    '### Run the Project',
    '',
    '```bash',
    'git diff --check',
    'find specs/' + manifest.slug + " -name 'slice.json' -print -exec node -e \"JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))\" {} \\;",
    '```',
    '',
    '### Use Cases',
    '',
    '#### Case 1: Generate a new spec pack',
    '',
    '**Prerequisite:** approved input is available.',
    '',
    '1. Run `spec create`.',
    '2. Inspect the generated spec directory.',
    '',
    '**Expected result:** all generated files exist and every JSON file parses.',
    '',
    '### Technical Verification',
    '',
    '```bash',
    'git diff --check',
    '```',
    '',
    '## Evidence',
    '',
    '- Spec, status, evidence, execution plan, and slice briefs are present.',
    '- Every generated `slice.json` parses successfully.',
    '',
    '## Rollback',
    '',
    '1. `git revert <commit-hash>`',
    '2. Re-run the JSON validation command.',
    '3. Confirm the spec directory is back to the previous state.',
    '',
    '## Risks / Notes',
    '',
    '- The first version uses the approved input as the source of truth and fails safely on existing spec directories.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildSliceJson(manifest, slice, index) {
  const isFoundation = index === 0;
  const dependsOn = isFoundation ? [] : Array.from(new Set(['slice-00-spec-foundation', ...(slice.depends_on || [])]));
  const branchSlug = slice.git?.branch_slug || slugify(slice.slice_id);
  const ticket = slice.ticket || manifest.ticket;
  const expectedReadPaths = resolveExpectedReadPaths(manifest, slice);
  const allowedWritePaths = resolveAllowedWritePaths(slice);
  const validationHints = resolveValidationHints(slice);

  return {
    slice_id: slice.slice_id,
    ticket,
    type: slice.type || (isFoundation ? 'docs' : 'feature'),
    title: slice.title,
    objective: slice.objective,
    description: slice.description,
    git: {
      branch_type: slice.git?.branch_type || 'feature',
      base_branch: slice.git?.base_branch || 'main',
      branch_slug: branchSlug,
      branch_name: slice.git?.branch_name || `feature/${ticket}-${branchSlug}`,
    },
    must: Array.isArray(slice.must) ? slice.must : [],
    not_included: Array.isArray(slice.not_included) ? slice.not_included : [],
    acceptance: Array.isArray(slice.acceptance) ? slice.acceptance : [],
    files: Array.isArray(slice.files) ? slice.files : [],
    expected_read_paths: expectedReadPaths,
    allowed_write_paths: allowedWritePaths,
    depends_on: dependsOn,
    parallel_safe: slice.parallel_safe || (isFoundation ? 'never' : 'after_dependencies'),
    parallel_safe_reason: slice.parallel_safe_reason || (isFoundation
      ? 'slice-00 is the mandatory documentation foundation and must land before every implementation slice.'
      : 'Can run after slice-00 and the approved input has been staged.'),
    tests: Array.isArray(slice.tests) ? slice.tests : [],
    validation_hints: validationHints,
    documentation: [
      `specs/${manifest.slug}/slices/${slice.slice_id}/EXECUTION_BRIEF.md`,
      `specs/${manifest.slug}/slices/${slice.slice_id}/CLOSURE_BRIEF.md`,
    ],
    assumptions: Array.isArray(slice.assumptions) ? slice.assumptions : [],
    estimated_hours: Number.isFinite(Number(slice.estimated_hours)) ? Number(slice.estimated_hours) : 0,
    actual_hours: 0,
    status: slice.status || (isFoundation ? 'ready' : 'draft'),
    blocked_reason: slice.blocked_reason ?? null,
    ready_at: slice.ready_at ?? null,
    started_at: slice.started_at ?? null,
    completed_at: slice.completed_at ?? null,
  };
}

function buildExecutionBrief(manifest, slice) {
  const expectedReadPaths = resolveExpectedReadPaths(manifest, slice);
  const allowedWritePaths = resolveAllowedWritePaths(slice);
  const validationHints = resolveValidationHints(slice);
  const lines = [
    `# EXECUTION BRIEF - ${slice.slice_id}`,
    '',
    `**Spec:** ${manifest.slug}`,
    `**Slice:** ${slice.slice_id}`,
    `**Tipo:** ${slice.type}`,
    '',
    '## Contexto',
    '',
    slice.description,
    '',
    '## Objetivo',
    '',
    slice.objective,
    '',
    '## Alcance',
    '',
    ...bullets(slice.must, '- No declared requirements.'),
    '',
    '## Criterios de aceptacion',
    '',
    ...bullets(slice.acceptance, '- No declared acceptance criteria.'),
    '',
    '## Plan tecnico resumido',
    '',
    `Follow the approved input staged in \`${manifest.sourcePath}\` and keep the slice inside its declared files.`,
    '',
    '## Expected read paths',
    '',
    ...bullets(expectedReadPaths, '- No explicit read paths declared.'),
    '',
    '## Allowed write paths',
    '',
    ...bullets(allowedWritePaths, '- No explicit write paths declared.'),
    '',
    '## Validation hints',
    '',
    ...bullets(validationHints, '- No explicit validation commands declared.'),
    '',
    '## Pasos sugeridos de ejecucion',
    '',
    '1. Read only the expected paths unless a blocker requires more context.',
    '2. Implement only the declared allowed write paths.',
    '3. Run the declared validation commands or document why they are not available.',
    '',
    '## Restricciones',
    '',
    ...bullets(slice.not_included, '- No explicit exclusions were declared.'),
    '',
    '## Riesgos',
    '',
    '- The slice can drift if the implementation expands beyond the approved files or acceptance criteria.',
    '',
    '## Checklist de finalizacion',
    '',
    '- [ ] Validations pass.',
    '- [ ] JSON parses.',
    '- [ ] The work stays inside scope.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildClosureBrief(manifest, slice) {
  const lines = [
    `# CLOSURE BRIEF - ${slice.slice_id}`,
    '',
    '## Resumen de lo realizado',
    '',
    'Pendiente de completar al cerrar la slice.',
    '',
    '## Validacion contra criterios de aceptacion',
    '',
    ...bullets(slice.acceptance.map((item) => `[ ] ${item}`), '- [ ] Validations pending.'),
    '',
    '## Cambios relevantes',
    '',
    'Pendiente.',
    '',
    '## Pendientes',
    '',
    'Pendiente.',
    '',
    '## Riesgos remanentes',
    '',
    'Pendiente.',
    '',
    '## Recomendaciones futuras',
    '',
    `Continue with the next dependent slice after reviewing \`${manifest.sourcePath}\`.`,
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function normalizeSliceName(sliceId) {
  return String(sliceId || '').trim() || SPEC_FOUNDATION_SLICE_ID;
}

function dependencySliceId(dependency) {
  const value = String(dependency || '').trim();
  if (!value) {
    return '';
  }

  const slashIndex = value.lastIndexOf('/');
  return slashIndex === -1 ? value : value.slice(slashIndex + 1);
}

function buildDefaultImplementationSlice(manifest) {
  const title = `${manifest.title} implementation`;
  return {
    slice_id: 'slice-01-implementation',
    ticket: manifest.ticket,
    type: 'feature',
    title,
    objective: manifest.objective,
    description: `Implement the approved plan captured in ${manifest.sourcePath}.`,
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: 'implementation',
      branch_name: `feature/${manifest.ticket}-implementation`,
    },
    must: manifest.acceptance.length > 0 ? manifest.acceptance.slice(0, 3) : ['Implement the approved plan.'],
    not_included: manifest.scope.excluded.length > 0 ? manifest.scope.excluded.slice() : ['No provider execution or PR opening.'],
    acceptance: manifest.acceptance.length > 0 ? manifest.acceptance.slice() : ['The approved plan can be implemented safely.'],
    files: [],
    depends_on: [SPEC_FOUNDATION_SLICE_ID],
    parallel_safe: 'after_dependencies',
    parallel_safe_reason: 'Can run after slice-00 and the approved input has been staged.',
    tests: [],
    assumptions: manifest.assumptions.slice(),
    estimated_hours: 4,
    status: 'draft',
  };
}

function buildManifest(source, options = {}) {
  const sourcePath = options.sourcePath || source.sourcePath || 'approved-input.md';
  const date = currentDate();
  const specSource = source.spec && typeof source.spec === 'object' ? source.spec : source;
  const rawSlug = options.specSlug || specSource.slug || specSource.spec_slug || specSource.specSlug || specSource.title || path.basename(sourcePath, path.extname(sourcePath));
  const slug = slugify(rawSlug);
  const title = String(specSource.title || source.title || titleizeFromSlug(slug) || 'Generated spec').trim();
  const ticket = String(specSource.ticket || source.ticket || slug.toUpperCase().slice(0, 12) || 'SPEC-01').trim();
  const objective = String(specSource.objective || source.objective || 'Generate the approved spec artifacts from the staged plan input.').trim();
  const scope = {
    included: Array.isArray(specSource.scope?.included) ? specSource.scope.included.slice() : Array.isArray(source.scope?.included) ? source.scope.included.slice() : [],
    excluded: Array.isArray(specSource.scope?.excluded) ? specSource.scope.excluded.slice() : Array.isArray(source.scope?.excluded) ? source.scope.excluded.slice() : [],
  };
  const acceptance = Array.isArray(specSource.acceptance) ? specSource.acceptance.slice() : Array.isArray(source.acceptance) ? source.acceptance.slice() : [];
  const risks = Array.isArray(specSource.risks) ? specSource.risks.slice() : Array.isArray(source.risks) ? source.risks.slice() : [];
  const assumptions = Array.isArray(specSource.assumptions) ? specSource.assumptions.slice() : Array.isArray(source.assumptions) ? source.assumptions.slice() : [];

  const rawSlices = Array.isArray(specSource.slices) ? specSource.slices : Array.isArray(source.slices) ? source.slices : [];
  if (rawSlices.length === 0) {
    throw new Error('approved technical plan must include a structured slices array. Expected JSON: { "spec": { "slices": [{ "slice_id": "slice-01-name", "title": "...", "objective": "...", "files": [] }] } }');
  }

  const normalizedSlices = rawSlices.map((slice) => normalizeImplementationSlice(slice, ticket));

  const slices = [
    {
      slice_id: SPEC_FOUNDATION_SLICE_ID,
      ticket: `${ticket}-00`,
      type: 'docs',
      title: 'Spec foundation',
      objective: 'Create the spec foundation and generated PR materials.',
      description: `Document the approved AI planning output from ${sourcePath}.`,
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'spec-foundation',
        branch_name: `feature/${ticket}-spec-foundation`,
      },
      must: [
        'Create SPEC.md with the approved requirements and plan.',
        'Create STATUS.md and EVIDENCE_REPORT.md.',
        'Create EXECUTION_PLAN.md and pr.md.',
        'Create slice.json, EXECUTION_BRIEF.md, and CLOSURE_BRIEF.md for every slice.',
      ],
      not_included: [
        'Provider execution.',
        'Automatic commits.',
      ],
      acceptance: [
        'The spec directory exists.',
        'Every generated JSON file parses successfully.',
        'pr.md always exists.',
      ],
      files: [
        `specs/${slug}/SPEC.md`,
        `specs/${slug}/STATUS.md`,
        `specs/${slug}/EVIDENCE_REPORT.md`,
        `specs/${slug}/EXECUTION_PLAN.md`,
        `specs/${slug}/pr.md`,
        `specs/${slug}/slices/**`,
      ],
      depends_on: [],
      parallel_safe: 'never',
      parallel_safe_reason: 'slice-00 is the mandatory documentation foundation and must land before every implementation slice.',
      tests: ['git diff --check'],
      assumptions,
      estimated_hours: 1.5,
      status: 'ready',
    },
    ...normalizedSlices,
  ].map((slice, index) => normalizeSliceManifest(slice, index, ticket));

  validateSliceManifestGraph(slices);

  const executionOrder = orderSlices(slices);
  const executionGroups = buildExecutionGroups(slices);

  return {
    slug,
    title,
    ticket,
    date,
    status: 'Active',
    sourcePath,
    sourceText: source.sourceText || '',
    objective,
    scope,
    acceptance,
    risks,
    assumptions,
    slices,
    executionOrder,
    executionGroups,
  };
}

function normalizeImplementationSlice(slice, fallbackTicket) {
  return normalizeSliceManifest({
    ...slice,
    type: slice.type || 'feature',
  }, 1, fallbackTicket);
}

function normalizeSliceManifest(slice, index, fallbackTicket) {
  const sliceId = normalizeSliceName(slice.slice_id || slice.sliceId || (index === 0 ? SPEC_FOUNDATION_SLICE_ID : `slice-${String(index).padStart(2, '0')}-implementation`));
  const title = String(slice.title || (index === 0 ? 'Spec foundation' : titleizeFromSlug(sliceId))).trim();
  const ticket = String(slice.ticket || fallbackTicket).trim();
  const objective = String(slice.objective || '').trim() || (index === 0
    ? 'Create the spec foundation and generated PR materials.'
    : 'Implement the approved plan.');
  const description = String(slice.description || '').trim() || (index === 0
    ? 'Document the approved planning input.'
    : `Implement the approved plan captured in the spec source.`);
  const dependsOn = Array.isArray(slice.depends_on) ? slice.depends_on.map(dependencySliceId).filter(Boolean) : [];
  const explicitAllowedWritePaths = normalizeStringArray(slice.allowed_write_paths || slice.allowedWritePaths || slice.write_paths);
  const declaredFiles = normalizeStringArray(slice.files);
  const files = declaredFiles.length > 0 ? declaredFiles : explicitAllowedWritePaths;
  const must = normalizeStringArray(slice.must);
  const notIncluded = normalizeStringArray(slice.not_included);
  const acceptance = normalizeStringArray(slice.acceptance);
  const tests = normalizeStringArray(slice.tests);
  const assumptions = normalizeStringArray(slice.assumptions);
  const expectedReadPaths = normalizeStringArray(slice.expected_read_paths || slice.expectedReadPaths || slice.read_paths || slice.reads);
  const allowedWritePaths = explicitAllowedWritePaths;
  const validationHints = normalizeStringArray(slice.validation_hints || slice.validationHints);
  const normalizedDependsOn = index === 0
    ? dependsOn
    : Array.from(new Set([SPEC_FOUNDATION_SLICE_ID, ...dependsOn]));

  return {
    slice_id: sliceId,
    ticket,
    type: slice.type || (index === 0 ? 'docs' : 'feature'),
    title,
    objective,
    description,
    git: {
      branch_type: slice.git?.branch_type || 'feature',
      base_branch: slice.git?.base_branch || 'main',
      branch_slug: String(slice.git?.branch_slug || slugify(sliceId)).trim(),
      branch_name: String(slice.git?.branch_name || `feature/${ticket}-${slugify(sliceId)}`).trim(),
    },
    must,
    not_included: notIncluded,
    acceptance,
    files,
    expected_read_paths: expectedReadPaths,
    allowed_write_paths: allowedWritePaths,
    depends_on: normalizedDependsOn,
    parallel_safe: slice.parallel_safe,
    parallel_safe_reason: slice.parallel_safe_reason,
    tests,
    validation_hints: validationHints,
    assumptions,
    estimated_hours: Number.isFinite(Number(slice.estimated_hours)) ? Number(slice.estimated_hours) : 0,
    status: slice.status || (index === 0 ? 'ready' : 'draft'),
    blocked_reason: slice.blocked_reason ?? null,
    ready_at: slice.ready_at ?? null,
    started_at: slice.started_at ?? null,
    completed_at: slice.completed_at ?? null,
  };
}

function validateSliceManifestGraph(slices) {
  const ids = new Set();

  for (const slice of slices) {
    if (!String(slice.slice_id || '').startsWith('slice-')) {
      throw new Error(`invalid slice_id '${slice.slice_id}'. Slice ids must start with 'slice-'.`);
    }

    if (ids.has(slice.slice_id)) {
      throw new Error(`duplicate slice_id '${slice.slice_id}' in approved technical plan.`);
    }

    ids.add(slice.slice_id);
  }

  for (const slice of slices) {
    for (const dependency of slice.depends_on || []) {
      if (!ids.has(dependency)) {
        throw new Error(`slice '${slice.slice_id}' depends on missing slice '${dependency}'.`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(sliceId) {
    if (visited.has(sliceId)) {
      return;
    }

    if (visiting.has(sliceId)) {
      const start = stack.indexOf(sliceId);
      const cycle = start === -1 ? [sliceId] : [...stack.slice(start), sliceId];
      throw new Error(`approved technical plan contains a dependency cycle: ${cycle.join(' -> ')}.`);
    }

    visiting.add(sliceId);
    stack.push(sliceId);
    const slice = slices.find((item) => item.slice_id === sliceId);
    for (const dependency of slice?.depends_on || []) {
      visit(dependency);
    }
    stack.pop();
    visiting.delete(sliceId);
    visited.add(sliceId);
  }

  for (const slice of slices) {
    visit(slice.slice_id);
  }
}

function orderSlices(slices) {
  const ordered = [];
  const remaining = new Map(slices.map((slice) => [slice.slice_id, slice]));
  const resolved = new Set();

  while (remaining.size > 0) {
    let progress = false;
    for (const [sliceId, slice] of remaining) {
      const deps = Array.isArray(slice.depends_on) ? slice.depends_on : [];
      if (deps.every((dep) => resolved.has(dep) || dep === sliceId)) {
        ordered.push(slice);
        remaining.delete(sliceId);
        resolved.add(sliceId);
        progress = true;
      }
    }

    if (!progress) {
      ordered.push(...remaining.values());
      break;
    }
  }

  return ordered;
}

function buildExecutionGroups(slices) {
  const remaining = new Map(slices.map((slice) => [slice.slice_id, slice]));
  const completed = new Set();
  const groups = [];

  while (remaining.size > 0) {
    const ready = Array.from(remaining.values()).filter((slice) => {
      const deps = Array.isArray(slice.depends_on) ? slice.depends_on : [];
      return deps.every((dep) => completed.has(dep) || dep === slice.slice_id);
    });

    if (ready.length === 0) {
      groups.push(Array.from(remaining.values()));
      break;
    }

    groups.push(ready);
    for (const slice of ready) {
      completed.add(slice.slice_id);
      remaining.delete(slice.slice_id);
    }
  }

  return groups;
}

function normalizeApprovedSource(text) {
  return String(text || '').trim();
}

module.exports = {
  SPEC_FOUNDATION_SLICE_ID,
  buildClosureBrief,
  buildEvidenceMarkdown,
  buildExecutionBrief,
  buildExecutionPlanMarkdown,
  buildManifest,
  buildPrMarkdown,
  buildSliceJson,
  buildSpecMarkdown,
  buildStatusMarkdown,
  normalizeApprovedSource,
  slugify,
  titleizeFromSlug,
};
