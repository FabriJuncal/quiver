const assert = require('node:assert/strict');
const test = require('node:test');

const { createUx, resolveUxMode } = require('../../src/create-quiver/lib/cli/ux');

test('resolveUxMode disables decoration, prompts, and spinners for machine modes', () => {
  const json = resolveUxMode({ json: true }, {}, {
    input: { isTTY: true },
    output: { isTTY: true },
    error: { isTTY: true },
  });
  const ci = resolveUxMode({}, { CI: 'true' }, {
    input: { isTTY: true },
    output: { isTTY: true },
    error: { isTTY: true },
  });
  const pipe = resolveUxMode({}, {}, {
    input: { isTTY: true },
    output: { isTTY: false },
    error: { isTTY: false },
  });

  for (const mode of [json, ci, pipe]) {
    assert.equal(mode.decoration, false);
    assert.equal(mode.usePrompts, false);
    assert.equal(mode.useSpinners, false);
  }
  assert.equal(json.json, true);
  assert.equal(ci.ci, true);
  assert.equal(pipe.isTTY.stdout, false);
});

test('resolveUxMode enables prompts only for explicit interactive TTY use', () => {
  const nonInteractive = resolveUxMode({}, {}, {
    input: { isTTY: true },
    output: { isTTY: true },
    error: { isTTY: true },
  });
  const interactive = resolveUxMode({ interactive: true }, {}, {
    input: { isTTY: true },
    output: { isTTY: true },
    error: { isTTY: true },
  });

  assert.equal(nonInteractive.usePrompts, false);
  assert.equal(nonInteractive.useSpinners, true);
  assert.equal(interactive.usePrompts, true);
  assert.equal(interactive.useSpinners, true);
});

test('withSpinner uses clack spinner only in human TTY mode', async () => {
  const events = [];
  const ux = createUx({
    stdoutIsTTY: true,
    stdinIsTTY: true,
    stderrIsTTY: true,
    prompts: {
      spinner() {
        return {
          start(message) {
            events.push(['start', message]);
          },
          stop(message, code) {
            events.push(['stop', message, code]);
          },
        };
      },
    },
    write: (text) => events.push(['write', text]),
  });

  const result = await ux.withSpinner('Preparing context', async () => 'done', {
    successMessage: 'Context ready',
  });

  assert.equal(result, 'done');
  assert.deepEqual(events, [
    ['start', 'Preparing context'],
    ['stop', 'Context ready', undefined],
  ]);
});

test('withSpinner prints plain text without symbols for no-TTY mode', async () => {
  let output = '';
  const ux = createUx({
    stdoutIsTTY: false,
    stdinIsTTY: false,
    stderrIsTTY: false,
    write: (text) => {
      output += text;
    },
  });

  await ux.withSpinner('Preparing context', async () => 'done');

  assert.equal(output, 'Preparing context\n');
});

test('JSON mode suppresses UX text output', async () => {
  let output = '';
  const ux = createUx({
    json: true,
    stdoutIsTTY: true,
    stdinIsTTY: true,
    stderrIsTTY: true,
    write: (text) => {
      output += text;
    },
  });

  ux.heading('Planner mode');
  ux.writeStatus('success', 'Done');
  await ux.withSpinner('Preparing context', async () => 'done');

  assert.equal(output, '');
});

test('promptConfirm requires explicit interactive TTY mode', async () => {
  const ux = createUx({
    interactive: false,
    stdoutIsTTY: true,
    stdinIsTTY: true,
    stderrIsTTY: true,
    promptConfirm: async () => true,
  });

  await assert.rejects(
    ux.promptConfirm('Apply changes?'),
    /interactive confirmation requires an interactive TTY/,
  );
});

test('promptConfirm uses injected confirmation in interactive TTY mode', async () => {
  const ux = createUx({
    interactive: true,
    stdoutIsTTY: true,
    stdinIsTTY: true,
    stderrIsTTY: true,
    promptConfirm: async (message, options) => {
      assert.equal(message, 'Apply changes?');
      assert.equal(options.initialValue, true);
      return true;
    },
  });

  assert.equal(await ux.promptConfirm('Apply changes?', { initialValue: true }), true);
});
