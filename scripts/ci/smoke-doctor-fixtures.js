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
}

console.log(`Doctor fixture matrix passed (${matrix.states.length} states)`);
