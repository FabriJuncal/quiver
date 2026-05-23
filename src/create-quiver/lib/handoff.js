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

const EXECUTION_BRIEF_REQUIRED_HEADINGS = [
  {
    label: 'context',
    alternatives: ['## Context', '## Contexto'],
  },
  {
    label: 'objective',
    alternatives: ['## Objective', '## Objetivo'],
  },
  {
    label: 'acceptance criteria',
    alternatives: ['## Acceptance Criteria', '## Criterios de aceptacion', '## Criterios de aceptación'],
  },
  {
    label: 'completion checklist',
    alternatives: ['## Completion Checklist', '## Checklist de finalizacion', '## Checklist de finalización'],
  },
];

const CLOSURE_BRIEF_REQUIRED_HEADINGS = [
  {
    label: 'summary',
    alternatives: ['## Summary', '## Summary of Work', '## Resumen de lo realizado'],
  },
  {
    label: 'validation',
    alternatives: ['## Validation', '## Validation Against Acceptance Criteria', '## Validacion contra criterios de aceptacion', '## Validación contra criterios de aceptación'],
  },
];

const HANDOFF_TEMPLATE_PATH = path.resolve(__dirname, '..', '..', '..', 'specs', '[project-name]', 'HANDOFF.md.template');

function normalizePosixPath(filePath, pathLib = path) {
  return filePath.split(pathLib.sep).join('/');
}

function resolveHandoffPath(repoRoot, handoffInput, pathLib = path) {
  const absolutePath = pathLib.resolve(repoRoot, handoffInput);
  const relativePath = normalizePosixPath(pathLib.relative(repoRoot, absolutePath), pathLib);

  if (relativePath.startsWith('..') || pathLib.isAbsolute(relativePath)) {
    throw new Error(`create-quiver: handoff or brief must live under specs/<spec-slug>/ (got ${normalizePosixPath(handoffInput, pathLib)})`);
  }

  const handoffMatch = relativePath.match(/^(specs|specs-fix)\/([^/]+)\/HANDOFF\.md$/);
  if (handoffMatch) {
    return {
      absolutePath,
      relativePath,
      specFamily: handoffMatch[1],
      specSlug: handoffMatch[2],
      kind: 'handoff',
      label: 'Handoff',
    };
  }

  const briefMatch = relativePath.match(/^(specs|specs-fix)\/([^/]+)\/slices\/([^/]+)\/(EXECUTION_BRIEF|CLOSURE_BRIEF)\.md$/);
  if (briefMatch) {
    const briefName = briefMatch[4];
    return {
      absolutePath,
      relativePath,
      specFamily: briefMatch[1],
      specSlug: briefMatch[2],
      sliceId: briefMatch[3],
      kind: briefName === 'EXECUTION_BRIEF' ? 'execution-brief' : 'closure-brief',
      label: briefName === 'EXECUTION_BRIEF' ? 'Execution brief' : 'Closure brief',
    };
  }

  throw new Error(`create-quiver: handoff or brief must live at specs/<spec-slug>/HANDOFF.md or specs/<spec-slug>/slices/<slice-id>/EXECUTION_BRIEF.md|CLOSURE_BRIEF.md (got ${relativePath})`);
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

function normalizeHeading(heading) {
  return String(heading || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function validateBriefSections(text, kind) {
  const sections = new Set(readHandoffSections(text).map(normalizeHeading));
  const requiredGroups = kind === 'closure-brief' ? CLOSURE_BRIEF_REQUIRED_HEADINGS : EXECUTION_BRIEF_REQUIRED_HEADINGS;

  return requiredGroups
    .filter((group) => !group.alternatives.some((heading) => sections.has(normalizeHeading(heading))))
    .map((group) => group.label);
}

function checkHandoff(handoffInput, repoRoot = process.cwd()) {
  const resolved = resolveHandoffPath(repoRoot, handoffInput);

  if (!fs.existsSync(resolved.absolutePath)) {
    throw new Error(`create-quiver: missing ${resolved.label.toLowerCase()} file: ${resolved.relativePath}`);
  }

  const text = fs.readFileSync(resolved.absolutePath, 'utf8');
  const missingSections = resolved.kind === 'handoff'
    ? validateHandoffSections(text)
    : validateBriefSections(text, resolved.kind);
  if (missingSections.length > 0) {
    throw new Error(`create-quiver: ${resolved.label.toLowerCase()} is missing required sections: ${missingSections.join(', ')}`);
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
  CLOSURE_BRIEF_REQUIRED_HEADINGS,
  EXECUTION_BRIEF_REQUIRED_HEADINGS,
  REQUIRED_HEADINGS,
  checkHandoff,
  readHandoffSections,
  scaffoldHandoff,
  resolveHandoffPath,
  validateBriefSections,
  validateHandoffSections,
};
