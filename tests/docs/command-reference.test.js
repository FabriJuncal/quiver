const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  assertGeneratedGroupsMatchRuntimeHelp,
  loadCommandHelpGroups,
  replaceGeneratedBlock,
  runCommandReferenceCheck,
  runRuntimeHelp,
  START_MARKER,
  END_MARKER,
} = require('../../scripts/ci/check-command-reference');

const repoRoot = path.resolve(__dirname, '..', '..');

test('generated command metadata is present in runtime help', () => {
  const groups = loadCommandHelpGroups(repoRoot);
  const commands = groups.flatMap((group) => group.commands.map(([command]) => command));
  const runtimeHelp = runRuntimeHelp(repoRoot);

  assert.ok(groups.length >= 7);
  assert.ok(commands.includes('init'));
  assert.ok(commands.includes('ai execute-plan'));
  assert.ok(commands.includes('slice start|check|pr|scope|cleanup|refresh-active'));
  assert.doesNotThrow(() => assertGeneratedGroupsMatchRuntimeHelp(groups, runtimeHelp));
});

test('docs command reference generated block is synchronized', () => {
  const report = runCommandReferenceCheck({ repoRoot });

  assert.equal(report.ok, true, report.reason || 'command reference drift detected');
  assert.ok(report.commandCount > 40);
});

test('generated block replacement preserves manual content outside markers', () => {
  const original = [
    '# Manual intro',
    '',
    START_MARKER,
    'old generated content',
    END_MARKER,
    '',
    '## Manual section',
  ].join('\n');
  const generatedBlock = [START_MARKER, 'new generated content', END_MARKER].join('\n');

  const updated = replaceGeneratedBlock(original, generatedBlock);

  assert.equal(
    updated,
    ['# Manual intro', '', START_MARKER, 'new generated content', END_MARKER, '', '## Manual section'].join('\n'),
  );
});
