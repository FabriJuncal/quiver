const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeSelectorOptions,
  selectOption,
} = require('../../src/create-quiver/lib/cli/selectors');

test('normalizeSelectorOptions keeps labels human-friendly and values stable', () => {
  assert.deepEqual(normalizeSelectorOptions([
    { id: 'gpt-55', label: 'GPT 5.5', hint: 'default', default: true },
    'wdd-sdd',
  ]), [
    {
      label: 'GPT 5.5',
      value: 'gpt-55',
      hint: 'default',
      default: true,
      raw: { id: 'gpt-55', label: 'GPT 5.5', hint: 'default', default: true },
    },
    {
      label: 'wdd-sdd',
      value: 'wdd-sdd',
      hint: '',
      default: false,
    },
  ]);
});

test('selectOption returns explicit non-interactive choice', async () => {
  const selected = await selectOption('Planner?', [
    { value: 'gpt-55', label: 'GPT 5.5' },
    { value: 'opus-47', label: 'OPUS 4.7' },
  ], {
    value: 'opus-47',
    interactive: false,
    stdoutIsTTY: false,
    stdinIsTTY: false,
  });

  assert.equal(selected.value, 'opus-47');
});

test('selectOption uses default without prompting in no-TTY mode', async () => {
  const selected = await selectOption('Planner?', [
    { value: 'gpt-55', label: 'GPT 5.5', default: true },
    { value: 'opus-47', label: 'OPUS 4.7' },
  ], {
    interactive: false,
    stdoutIsTTY: false,
    stdinIsTTY: false,
  });

  assert.equal(selected.value, 'gpt-55');
});

test('selectOption fails actionably when no default is available outside interactive mode', async () => {
  await assert.rejects(
    selectOption('Planner?', [
      { value: 'gpt-55', label: 'GPT 5.5' },
      { value: 'opus-47', label: 'OPUS 4.7' },
    ], {
      name: 'Planner selection',
      flag: '--planner',
      interactive: false,
      stdoutIsTTY: false,
      stdinIsTTY: false,
    }),
    /Planner selection requires an explicit choice[\s\S]*Use --planner <value> or rerun with --interactive/,
  );
});

test('selectOption uses injected prompt selector only in interactive TTY mode', async () => {
  const selected = await selectOption('Planner?', [
    { value: 'gpt-55', label: 'GPT 5.5' },
    { value: 'opus-47', label: 'OPUS 4.7' },
  ], {
    interactive: true,
    stdoutIsTTY: true,
    stdinIsTTY: true,
    env: { LANG: 'en_US.UTF-8' },
    promptSelect: async (message, options) => {
      assert.equal(message, 'Planner?');
      assert.equal(options.length, 2);
      return 'opus-47';
    },
  });

  assert.equal(selected.value, 'opus-47');
});
