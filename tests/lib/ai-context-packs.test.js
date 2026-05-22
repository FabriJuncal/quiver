const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildContextPackMetadata,
  getDefaultContextPack,
  getPreparedContextDocPaths,
  resolveContextPack,
  selectSafePaths,
} = require('../../src/create-quiver/lib/ai/context-packs');
const { PROMPT_INJECTION_GUARD_TEXT } = require('../../src/create-quiver/lib/ai/prompts');

test('planner defaults to the planning pack and exposes structured metadata', () => {
  const metadata = buildContextPackMetadata({
    role: 'planner',
    paths: [
      'docs/AI_CONTEXT.md',
      'specs/quiver-v20-ai-cli-orchestration/SPEC.md',
      'docs/project map/PROJECT MAP.md',
    ],
  });

  assert.equal(metadata.role, 'planner');
  assert.equal(metadata.packName, 'planning');
  assert.equal(metadata.isDefault, true);
  assert.equal(metadata.tokenBudgetHint, 8000);
  assert.ok(metadata.prompt.includes(PROMPT_INJECTION_GUARD_TEXT));
  assert.ok(metadata.includedPaths.includes('docs/AI_CONTEXT.md'));
});

test('executor defaults to slice and never full', () => {
  const resolved = resolveContextPack({ role: 'executor' });

  assert.equal(resolved.packName, 'slice');
  assert.equal(getDefaultContextPack('executor'), 'slice');
  assert.throws(() => resolveContextPack({ role: 'executor', packName: 'full' }), /executor context cannot use the full pack/);
});

test('context pack selection preserves POSIX, Windows, and spaced paths', () => {
  const result = selectSafePaths([
    'specs/quiver-v20-ai-cli-orchestration/slices/slice-02/hand off.md',
    'C:\\Repo With Spaces\\docs\\AI_CONTEXT.md',
    '.quiver/scans/PROJECT_SCAN.json',
    '/Users/test/project/.env.local',
    'C:\\Users\\test\\project\\node_modules\\pkg\\index.js',
    '/Users/test/project/.quiver/state.json',
  ], { role: 'planner', packName: 'planning' });

  assert.deepEqual(result.included, [
    'specs/quiver-v20-ai-cli-orchestration/slices/slice-02/hand off.md',
    'C:/Repo With Spaces/docs/AI_CONTEXT.md',
    '.quiver/scans/PROJECT_SCAN.json',
  ]);
  assert.equal(result.excluded.length, 3);
  assert.equal(result.excluded[0].reason, 'env-file');
  assert.match(result.excluded[1].reason, /unsafe-segment:node_modules/);
  assert.match(result.excluded[2].reason, /unsafe-segment:\.quiver/);
});

test('planner can request the full pack explicitly while executor cannot', () => {
  const planner = resolveContextPack({ role: 'planner', packName: 'full' });
  assert.equal(planner.packName, 'full');
  assert.equal(planner.pack.tokenBudgetHint, 14000);

  assert.throws(() => resolveContextPack({ role: 'executor', packName: 'full' }));
});

test('prepare-context only targets approved docs and never product code', () => {
  const paths = getPreparedContextDocPaths();

  assert.deepEqual(paths, [
    'docs/AI_CONTEXT.md',
    'docs/AI_ONBOARDING_PROMPT.md',
    'docs/CONTEXTO.md',
    'docs/STATUS.md',
    'docs/DECISIONS.md',
  ]);
  assert.ok(paths.every((item) => item.startsWith('docs/')));
  assert.ok(!paths.some((item) => item.startsWith('src/')));
});
