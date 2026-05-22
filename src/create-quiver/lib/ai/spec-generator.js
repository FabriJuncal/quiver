const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { parseJsonWithComments } = require('../json');
const {
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
} = require('./spec-templates');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function readSourceText(inputPath, repoRoot) {
  if (!inputPath) {
    throw new Error(formatError('missing approved input file for spec generation'));
  }

  const resolved = path.resolve(repoRoot, inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(formatError(`missing approved input file: ${inputPath}`));
  }

  return fs.readFileSync(resolved, 'utf8');
}

function parseApprovedManifest(sourceText, options = {}) {
  const normalizedText = normalizeApprovedSource(sourceText);

  if (!normalizedText) {
    return {
      sourceText: '',
      source: {},
    };
  }

  try {
    const parsed = parseJsonWithComments(normalizedText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        sourceText: normalizedText,
        source: parsed,
      };
    }
  } catch {
    // Fall back to the markdown parser below.
  }

  const titleMatch = normalizedText.match(/^#\s+(.+)$/m);
  const objective = extractSectionText(normalizedText, ['Objective', 'Objetivo']);
  const scope = {
    included: extractNestedSectionBullets(normalizedText, ['Scope', 'Alcance'], ['Included', 'Incluido', 'Incluidos', 'Incluye', 'Entra en alcance']),
    excluded: extractNestedSectionBullets(normalizedText, ['Scope', 'Alcance'], ['Excluded', 'Excluido', 'Excluidos', 'No incluido', 'No incluidos', 'Fuera de alcance']),
  };
  const acceptance = extractSectionBullets(normalizedText, ['Acceptance Criteria', 'Criterios de aceptacion', 'Criterios de aceptación']);
  const risks = extractSectionBullets(normalizedText, ['Risks', 'Riesgos']);
  const assumptions = extractSectionBullets(normalizedText, ['Assumptions', 'Suposiciones', 'Supuestos']);

  return {
    sourceText: normalizedText,
    source: {
      title: titleMatch ? titleMatch[1].trim() : options.fallbackTitle || '',
      objective: objective || '',
      scope,
      acceptance,
      risks,
      assumptions,
    },
  };
}

function extractSectionText(text, headings) {
  const lines = String(text || '').split(/\r?\n/);
  const normalizedHeadings = new Set(headings.map((heading) => normalizeHeading(heading)));
  let capture = false;
  const sectionLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      const heading = normalizeHeading(headingMatch[1]);
      if (normalizedHeadings.has(heading)) {
        capture = true;
        continue;
      }
      if (capture) {
        break;
      }
    }

    if (capture) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n').trim();
}

function normalizeHeading(heading) {
  return String(heading || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function extractSectionBullets(text, headings) {
  const section = extractSectionText(text, headings);
  if (!section) {
    return [];
  }

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function extractNestedSectionBullets(text, sectionHeadings, nestedHeadings) {
  const section = extractSectionText(text, sectionHeadings);
  if (!section) {
    return [];
  }

  const nested = new Set(nestedHeadings.map((heading) => normalizeHeading(heading)));
  let capture = false;
  const bullets = [];

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      capture = nested.has(normalizeHeading(headingMatch[1]));
      continue;
    }

    if (capture && /^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, '').trim());
    }
  }

  return bullets.filter(Boolean);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeTextFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

function validateGeneratedSliceJson(filePath, expectedSliceId) {
  const parsed = parseJsonWithComments(fs.readFileSync(filePath, 'utf8'));

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(formatError(`invalid slice.json payload at ${filePath}`));
  }

  if (expectedSliceId && parsed.slice_id !== expectedSliceId) {
    throw new Error(formatError(`slice.json id mismatch at ${filePath}: expected ${expectedSliceId}, got ${parsed.slice_id}`));
  }

  if (!parsed.git || typeof parsed.git !== 'object') {
    throw new Error(formatError(`slice.json missing git block at ${filePath}`));
  }

  if (!Array.isArray(parsed.files)) {
    throw new Error(formatError(`slice.json files must be an array at ${filePath}`));
  }

  if (!Array.isArray(parsed.expected_read_paths)) {
    throw new Error(formatError(`slice.json expected_read_paths must be an array at ${filePath}`));
  }

  if (!Array.isArray(parsed.allowed_write_paths)) {
    throw new Error(formatError(`slice.json allowed_write_paths must be an array at ${filePath}`));
  }

  if (!Array.isArray(parsed.depends_on)) {
    throw new Error(formatError(`slice.json depends_on must be an array at ${filePath}`));
  }

  if (!Array.isArray(parsed.validation_hints)) {
    throw new Error(formatError(`slice.json validation_hints must be an array at ${filePath}`));
  }

  return parsed;
}

function buildSpecGenerationManifest({ inputText, inputPath, repoRoot, specSlug }) {
  const { sourceText, source } = parseApprovedManifest(inputText, {
    fallbackTitle: specSlug ? specSlug.replace(/-/g, ' ') : path.basename(inputPath || 'generated-spec.md', path.extname(inputPath || '.md')),
  });

  const manifest = buildManifest({
    ...source,
    sourcePath: path.relative(repoRoot, path.resolve(repoRoot, inputPath)).split(path.sep).join('/'),
    sourceText,
  }, { specSlug });

  if (!manifest.slug) {
    throw new Error(formatError('unable to derive a spec slug from the approved input'));
  }

  return manifest;
}

function validateSpecCollision(specDir) {
  if (fs.existsSync(specDir)) {
    throw new Error(formatError(`spec directory already exists: ${path.relative(process.cwd(), specDir)}`));
  }
}

function renderSpecTree(manifest, specDir) {
  const files = [];
  const sliceDirs = [];

  writeTextFile(path.join(specDir, 'SPEC.md'), buildSpecMarkdown(manifest));
  files.push('SPEC.md');
  writeTextFile(path.join(specDir, 'STATUS.md'), buildStatusMarkdown(manifest));
  files.push('STATUS.md');
  writeTextFile(path.join(specDir, 'EVIDENCE_REPORT.md'), buildEvidenceMarkdown(manifest));
  files.push('EVIDENCE_REPORT.md');
  writeTextFile(path.join(specDir, 'EXECUTION_PLAN.md'), buildExecutionPlanMarkdown(manifest));
  files.push('EXECUTION_PLAN.md');
  writeTextFile(path.join(specDir, 'pr.md'), buildPrMarkdown(manifest));
  files.push('pr.md');

  for (let index = 0; index < manifest.slices.length; index += 1) {
    const slice = manifest.slices[index];
    const sliceDir = path.join(specDir, 'slices', slice.slice_id);
    ensureDir(sliceDir);
    writeTextFile(path.join(sliceDir, 'slice.json'), `${JSON.stringify(buildSliceJson(manifest, slice, index), null, 2)}\n`);
    writeTextFile(path.join(sliceDir, 'EXECUTION_BRIEF.md'), buildExecutionBrief(manifest, slice));
    writeTextFile(path.join(sliceDir, 'CLOSURE_BRIEF.md'), buildClosureBrief(manifest, slice));
    validateGeneratedSliceJson(path.join(sliceDir, 'slice.json'), slice.slice_id);
    files.push(path.relative(specDir, path.join(sliceDir, 'slice.json')).split(path.sep).join('/'));
    files.push(path.relative(specDir, path.join(sliceDir, 'EXECUTION_BRIEF.md')).split(path.sep).join('/'));
    files.push(path.relative(specDir, path.join(sliceDir, 'CLOSURE_BRIEF.md')).split(path.sep).join('/'));
    sliceDirs.push(sliceDir);
  }

  return {
    files,
    sliceDirs,
  };
}

function generateSpecArtifacts(repoRoot, options = {}) {
  const inputPath = options.input;
  const inputText = readSourceText(inputPath, repoRoot);
  const manifest = buildSpecGenerationManifest({
    inputPath,
    inputText,
    repoRoot,
    specSlug: options.specSlug,
  });

  const specDir = path.join(repoRoot, 'specs', slugify(manifest.slug));
  validateSpecCollision(specDir);

  const parentDir = path.dirname(specDir);
  ensureDir(parentDir);
  const tempDir = fs.mkdtempSync(path.join(parentDir, `.${manifest.slug}-build-`));

  try {
    const renderResult = renderSpecTree(manifest, tempDir);
    for (const slice of manifest.slices) {
      validateGeneratedSliceJson(path.join(tempDir, 'slices', slice.slice_id, 'slice.json'), slice.slice_id);
    }
    fs.renameSync(tempDir, specDir);
    return {
      manifest,
      specDir,
      files: renderResult.files.map((file) => path.join(specDir, file)),
    };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function describeSpecGeneration(manifest, repoRoot) {
  const specDir = path.join(repoRoot, 'specs', slugify(manifest.slug));
  const files = [
    'SPEC.md',
    'STATUS.md',
    'EVIDENCE_REPORT.md',
    'EXECUTION_PLAN.md',
    'pr.md',
    ...manifest.slices.flatMap((slice) => [
      `slices/${slice.slice_id}/slice.json`,
      `slices/${slice.slice_id}/EXECUTION_BRIEF.md`,
      `slices/${slice.slice_id}/CLOSURE_BRIEF.md`,
    ]),
  ];

  return {
    specDir,
    files,
    manifest,
  };
}

module.exports = {
  buildSpecGenerationManifest,
  describeSpecGeneration,
  generateSpecArtifacts,
  parseApprovedManifest,
  readSourceText,
  validateGeneratedSliceJson,
};
