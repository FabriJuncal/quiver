#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const matrixPath = path.join(root, 'tests/fixtures/validation-errors/matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const requiredStates = [
  'new',
  'existing',
  'old-quiver',
  'monorepo',
  'no-git',
  'dirty-git',
  'no-gh',
  'paths-with-spaces',
  'docs-contradiction',
  'missing-agent-profile',
  'pixel-quiver-completed-specs',
  'multiple-specs',
  'stale-docs',
];

const actual = new Set((matrix.states || []).map((state) => state.id));
const missing = requiredStates.filter((state) => !actual.has(state));

if (missing.length > 0) {
  console.error(`Missing validation fixture states: ${missing.join(', ')}`);
  process.exit(1);
}

for (const state of matrix.states) {
  if (!state.purpose || !state.expected) {
    console.error(`Fixture state '${state.id}' must include purpose and expected.`);
    process.exit(1);
  }
  if (!Array.isArray(state.covered_by) || state.covered_by.length === 0) {
    console.error(`Fixture state '${state.id}' must include covered_by evidence.`);
    process.exit(1);
  }
  for (const relativePath of state.covered_by) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      console.error(`Fixture state '${state.id}' references missing coverage file: ${relativePath}`);
      process.exit(1);
    }
  }
}

console.log(`Doctor fixture matrix passed (${matrix.states.length} states)`);
