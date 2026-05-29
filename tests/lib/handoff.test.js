const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { checkHandoff } = require('../../src/create-quiver/lib/handoff');

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function makeProject(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-handoff-'));

  for (const [relativePath, text] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), text);
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('check-handoff keeps validating the legacy spec handoff contract', () => {
  const project = makeProject({
    'specs/spec-a/HANDOFF.md': [
      '# Handoff',
      '',
      '## Background',
      'Context.',
      '## What you will change',
      'Changes.',
      '## Validation checklist',
      '- [ ] Test.',
      '## Out of scope',
      'Nothing else.',
      '## Expected deliverable',
      'A patch.',
      '## Constraints',
      'Stay scoped.',
      '',
    ].join('\n'),
  });

  try {
    const resolved = checkHandoff('specs/spec-a/HANDOFF.md', project.root);
    assert.equal(resolved.kind, 'handoff');
    assert.equal(resolved.label, 'Handoff');
  } finally {
    project.cleanup();
  }
});

test('check-handoff validates per-slice execution briefs', () => {
  const project = makeProject({
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': [
      '# EXECUTION BRIEF - slice-01-alpha',
      '',
      '## Context',
      'Context.',
      '## Objective',
      'Objective.',
      '## Acceptance Criteria',
      '- Criteria.',
      '## Completion Checklist',
      '- [ ] Done.',
      '',
    ].join('\n'),
  });

  try {
    const resolved = checkHandoff('specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md', project.root);
    assert.equal(resolved.kind, 'execution-brief');
    assert.equal(resolved.label, 'Execution brief');
  } finally {
    project.cleanup();
  }
});

test('check-handoff validates per-slice closure briefs', () => {
  const project = makeProject({
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': [
      '# CLOSURE BRIEF - slice-01-alpha',
      '',
      '## Summary of Work',
      'Completed.',
      '## Validation Against Acceptance Criteria',
      '- [x] Criteria.',
      '',
    ].join('\n'),
  });

  try {
    const resolved = checkHandoff('specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md', project.root);
    assert.equal(resolved.kind, 'closure-brief');
    assert.equal(resolved.label, 'Closure brief');
  } finally {
    project.cleanup();
  }
});

test('check-handoff rejects incomplete per-slice execution briefs with an actionable error', () => {
  const project = makeProject({
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': [
      '# EXECUTION BRIEF - slice-01-alpha',
      '',
      '## Context',
      'Context.',
      '',
    ].join('\n'),
  });

  try {
    assert.throws(
      () => checkHandoff('specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md', project.root),
      (error) => {
        const message = String(error.message || error);
        return message.includes('execution brief')
          && message.includes('objective')
          && message.includes('acceptance criteria')
          && message.includes('Accepted headings/aliases:')
          && message.includes('## Objective')
          && message.includes('## Objetivo')
          && message.includes('Minimal template:');
      },
    );
  } finally {
    project.cleanup();
  }
});

test('check-handoff renders Spanish missing-section guidance when requested', () => {
  const project = makeProject({
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': [
      '# EXECUTION BRIEF - slice-01-alpha',
      '',
      '## Context',
      'Context.',
      '',
    ].join('\n'),
  });

  try {
    assert.throws(
      () => checkHandoff('specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md', project.root, { language: 'es' }),
      (error) => {
        const message = String(error.message || error);
        return message.includes('execution brief no tiene las secciones requeridas')
          && message.includes('objective')
          && message.includes('Headings/alias aceptados:')
          && message.includes('## Objective')
          && message.includes('Template minimo:');
      },
    );
  } finally {
    project.cleanup();
  }
});
