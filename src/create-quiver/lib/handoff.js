const fs = require('fs');
const path = require('path');

const REQUIRED_HEADINGS = [
  '## Background',
  '## What you will change',
  '## Validation checklist',
  '## Out of scope',
  '## Expected deliverable',
  '## Constraints',
];

const HANDOFF_TEMPLATE_PATH = path.resolve(__dirname, '..', '..', '..', 'specs', '[project-name]', 'HANDOFF.md.template');

function normalizePosixPath(filePath, pathLib = path) {
  return filePath.split(pathLib.sep).join('/');
}

function resolveHandoffPath(repoRoot, handoffInput, pathLib = path) {
  const absolutePath = pathLib.resolve(repoRoot, handoffInput);
  const relativePath = normalizePosixPath(pathLib.relative(repoRoot, absolutePath), pathLib);

  if (relativePath.startsWith('..') || pathLib.isAbsolute(relativePath)) {
    throw new Error(`create-quiver: handoff must live at specs/<spec-slug>/HANDOFF.md (got ${normalizePosixPath(handoffInput, pathLib)})`);
  }

  const match = relativePath.match(/^specs\/([^/]+)\/HANDOFF\.md$/);
  if (!match) {
    throw new Error(`create-quiver: handoff must live at specs/<spec-slug>/HANDOFF.md (got ${relativePath})`);
  }

  return {
    absolutePath,
    relativePath,
    specSlug: match[1],
  };
}

function readHandoffSections(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/\s+$/, ''));
}

function validateHandoffSections(text) {
  const sections = new Set(readHandoffSections(text));
  return REQUIRED_HEADINGS.filter((heading) => !sections.has(heading));
}

function checkHandoff(handoffInput, repoRoot = process.cwd()) {
  const resolved = resolveHandoffPath(repoRoot, handoffInput);

  if (!fs.existsSync(resolved.absolutePath)) {
    throw new Error(`create-quiver: missing handoff file: ${resolved.relativePath}`);
  }

  const text = fs.readFileSync(resolved.absolutePath, 'utf8');
  const missingSections = validateHandoffSections(text);
  if (missingSections.length > 0) {
    throw new Error(`create-quiver: handoff is missing required sections: ${missingSections.join(', ')}`);
  }

  return resolved;
}

function scaffoldHandoff(specSlug, repoRoot = process.cwd()) {
  const trimmedSlug = String(specSlug || '').trim();
  if (!trimmedSlug) {
    throw new Error('create-quiver: missing handoff slug. Use: npx create-quiver new-handoff <spec-slug>');
  }

  if (!fs.existsSync(HANDOFF_TEMPLATE_PATH)) {
    throw new Error('create-quiver: missing handoff template at specs/[project-name]/HANDOFF.md.template');
  }

  const resolved = resolveHandoffPath(repoRoot, path.join('specs', trimmedSlug, 'HANDOFF.md'));
  if (fs.existsSync(resolved.absolutePath)) {
    throw new Error(`create-quiver: handoff already exists at ${resolved.relativePath}`);
  }

  const templateText = fs.readFileSync(HANDOFF_TEMPLATE_PATH, 'utf8');
  const projectName = trimmedSlug.replace(/-/g, ' ');
  const currentDate = new Date().toISOString().slice(0, 10);
  const renderedText = templateText
    .replace(/{{PROJECT_NAME}}/g, projectName)
    .replace(/{{PROJECT_SLUG}}/g, trimmedSlug)
    .replace(/{{FECHA}}/g, currentDate);

  fs.mkdirSync(path.dirname(resolved.absolutePath), { recursive: true });
  fs.writeFileSync(resolved.absolutePath, renderedText);

  return checkHandoff(resolved.relativePath, repoRoot);
}

module.exports = {
  REQUIRED_HEADINGS,
  checkHandoff,
  readHandoffSections,
  scaffoldHandoff,
  resolveHandoffPath,
  validateHandoffSections,
};
