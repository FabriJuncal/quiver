const assert = require('node:assert/strict');
const test = require('node:test');

const {
  SUPPORTED_PROVIDERS,
  ProviderRunnerError,
  assertSupportedProvider,
  buildProviderModelArgs,
  buildProviderInvocation,
  extractProviderErrorCause,
  getProviderDefinition,
  resolveProviderModelSelection,
  runProvider,
} = require('../../src/create-quiver/lib/ai/providers');
const { preflightProvider } = require('../../src/create-quiver/lib/ai/preflight');

test('assertSupportedProvider rejects unknown providers with a clear list', () => {
  assert.throws(
    () => assertSupportedProvider('unknown'),
    (error) => error instanceof ProviderRunnerError
      && error.code === 'UNSUPPORTED_PROVIDER'
      && error.message.includes('codex')
      && error.message.includes('claude')
      && error.message.includes('gemini'),
  );
  assert.deepEqual(SUPPORTED_PROVIDERS, ['codex', 'claude', 'gemini']);
});

test('buildProviderInvocation keeps command arguments separate from the prompt', () => {
  const invocation = buildProviderInvocation('claude', {
    prompt: 'hello world',
    args: ['--flag', 'value with spaces'],
    cwd: '/tmp/work tree',
    timeoutMs: 1234,
  });

  assert.equal(invocation.provider, 'claude');
  assert.equal(invocation.command, 'claude');
  assert.deepEqual(invocation.args, ['-p', '--flag', 'value with spaces']);
  assert.equal(invocation.cwd, '/tmp/work tree');
  assert.equal(invocation.timeoutMs, 1234);
  assert.equal(invocation.promptLength, Buffer.byteLength('hello world', 'utf8'));
  assert.equal(invocation.modelSelection.model, '');
});

test('buildProviderInvocation adds model args when provider supports model selection', () => {
  const invocation = buildProviderInvocation('codex', {
    prompt: 'hello',
    model: 'gpt-5.5',
    enforceModelSelection: true,
  });

  assert.equal(invocation.provider, 'codex');
  assert.deepEqual(invocation.args, ['exec', '--model', 'gpt-5.5']);
  assert.deepEqual(invocation.modelSelection, {
    model: 'gpt-5.5',
    supported: true,
    enforced: true,
    args: ['--model', 'gpt-5.5'],
    reason: 'model argument supported',
  });
});

test('buildProviderInvocation normalizes known display model aliases by default', () => {
  const invocation = buildProviderInvocation('codex', {
    prompt: 'hello',
    model: 'GPT 5.5',
    enforceModelSelection: true,
  });

  assert.deepEqual(invocation.args, ['exec', '--model', 'gpt-5.5']);
  assert.equal(invocation.modelSelection.model, 'gpt-5.5');
  assert.equal(invocation.modelSelection.input, 'GPT 5.5');
  assert.match(invocation.modelSelection.reason, /model alias normalized/);
});

test('buildProviderInvocation can block profile display aliases before provider execution', () => {
  assert.throws(
    () => buildProviderInvocation('codex', {
      prompt: 'hello',
      model: 'GPT 5.5',
      blockModelAlias: true,
      enforceModelSelection: true,
    }),
    (error) => error instanceof ProviderRunnerError
      && error.code === 'DISPLAY_MODEL_ALIAS'
      && error.message.includes("Use 'gpt-5.5'")
      && error.details.suggestedModel === 'gpt-5.5',
  );
});

test('resolveProviderModelSelection preserves custom models', () => {
  const selection = resolveProviderModelSelection('codex', 'gpt-custom');

  assert.equal(selection.model, 'gpt-custom');
  assert.equal(selection.modelSource, 'custom');
  assert.equal(selection.aliasNormalized, false);
});

test('buildProviderModelArgs blocks unsupported enforced model selection', () => {
  const provider = getProviderDefinition('gemini');
  const originalSupports = provider.supportsModelSelection;
  const originalBuilder = provider.modelArgBuilder;

  provider.supportsModelSelection = false;
  provider.modelArgBuilder = undefined;

  try {
    assert.throws(
      () => buildProviderModelArgs('gemini', 'gemini-pro', { enforce: true }),
      (error) => error instanceof ProviderRunnerError
        && error.code === 'UNSUPPORTED_PROVIDER_MODEL_SELECTION'
        && error.message.includes('gemini-pro')
        && error.details.nextSteps.length > 0,
    );

    const relaxed = buildProviderModelArgs('gemini', 'gemini-pro', { enforce: false });
    assert.equal(relaxed.model, 'gemini-pro');
    assert.equal(relaxed.supported, false);
    assert.equal(relaxed.enforced, false);
    assert.deepEqual(relaxed.args, []);
  } finally {
    provider.supportsModelSelection = originalSupports;
    provider.modelArgBuilder = originalBuilder;
  }
});

test('preflightProvider reports a missing CLI with an install hint', () => {
  assert.throws(
    () => preflightProvider('codex', {
      probe() {
        const error = new Error('not found');
        error.code = 'ENOENT';
        return { error };
      },
    }),
    (error) => error instanceof ProviderRunnerError
      && error.code === 'MISSING_PROVIDER_CLI'
      && error.message.includes('codex')
      && error.message.includes('Install the Codex CLI'),
  );
});

test('runProvider dry-run returns a structured plan without invoking spawn', async () => {
  let spawnCalled = false;
  const result = await runProvider('gemini', {
    dryRun: true,
    prompt: 'dry run prompt',
    spawn() {
      spawnCalled = true;
      throw new Error('should not run');
    },
  });

  assert.equal(spawnCalled, false);
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.provider, 'gemini');
  assert.equal(result.command, 'gemini');
  assert.deepEqual(result.args, ['--prompt', '']);
  assert.equal(result.modelSelection.model, '');
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, '');
});

test('runProvider dry-run exposes selected provider model without auth preflight', async () => {
  let spawnCalled = false;
  const result = await runProvider('claude', {
    dryRun: true,
    prompt: 'dry run prompt',
    model: 'opus-4.7',
    enforceModelSelection: true,
    spawn() {
      spawnCalled = true;
      throw new Error('should not run');
    },
  });

  assert.equal(spawnCalled, false);
  assert.equal(result.ok, true);
  assert.equal(result.provider, 'claude');
  assert.deepEqual(result.args, ['-p', '--model', 'claude-opus-4-7']);
  assert.deepEqual(result.modelSelection, {
    model: 'claude-opus-4-7',
    supported: true,
    enforced: true,
    args: ['--model', 'claude-opus-4-7'],
    reason: 'model alias normalized from opus-4.7',
    input: 'opus-4.7',
    displayName: 'Claude Opus 4.7',
    modelSource: 'catalog',
  });
});

test('runProvider dry-run shows normalized technical model ids', async () => {
  const result = await runProvider('codex', {
    dryRun: true,
    prompt: 'dry run prompt',
    model: 'GPT 5.5',
    enforceModelSelection: true,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.args, ['exec', '--model', 'gpt-5.5']);
  assert.equal(result.modelSelection.model, 'gpt-5.5');
});

test('runProvider uses an argument array and writes the prompt through stdin', async () => {
  const events = [];

  const result = await runProvider('codex', {
    prompt: 'line 1\nline 2',
    spawn(command, args, options) {
      events.push({ command, args, options });
      const listeners = {};
      const child = {
        stdout: {
          setEncoding() {},
          on(event, handler) {
            listeners[`stdout:${event}`] = handler;
          },
        },
        stderr: {
          setEncoding() {},
          on(event, handler) {
            listeners[`stderr:${event}`] = handler;
          },
        },
        stdin: {
          ended: false,
          end(data) {
            events.push({ stdin: data });
            this.ended = true;
          },
        },
        on(event, handler) {
          listeners[event] = handler;
          if (event === 'close') {
            process.nextTick(() => handler(0, null));
          }
        },
      };
      return child;
    },
    probe() {
      return { status: 0, stdout: 'codex 1.0.0', stderr: '' };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(events[0].command, 'codex');
  assert.deepEqual(events[0].args, ['exec']);
  assert.equal(events[0].options.shell, false);
  assert.deepEqual(events.filter((event) => Object.prototype.hasOwnProperty.call(event, 'stdin')).map((event) => event.stdin), ['line 1\nline 2']);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, '');
});

test('runProvider redacts likely secrets from stdout, stderr, and serialized errors', async () => {
  const result = await runProvider('codex', {
    prompt: 'secret scan',
    spawn() {
      const listeners = {};
      const child = {
        stdout: {
          setEncoding() {},
          on(event, handler) {
            listeners[`stdout:${event}`] = handler;
          },
        },
        stderr: {
          setEncoding() {},
          on(event, handler) {
            listeners[`stderr:${event}`] = handler;
          },
        },
        stdin: {
          end() {},
        },
        on(event, handler) {
          listeners[event] = handler;
          if (event === 'error') {
            process.nextTick(() => {
              listeners['stdout:data']('token=abc123\n');
              listeners['stderr:data']('authorization: bearer secret-value\n');
              const error = new Error('password=hunter2');
              error.code = 'EFAIL';
              handler(error);
            });
          }
        },
      };
      return child;
    },
    probe() {
      return { status: 0, stdout: 'codex 1.0.0', stderr: '' };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.stdout, 'token=[REDACTED]\n');
  assert.equal(result.stderr, 'authorization: bearer [REDACTED]\n');
  assert.equal(result.error.message, 'password=[REDACTED]');
});

test('runProvider times out and terminates a hung provider', async () => {
  const events = [];

  const result = await runProvider('codex', {
    prompt: 'hang',
    timeoutMs: 5,
    spawn() {
      const listeners = {};
      return {
        stdout: {
          setEncoding() {},
          on() {},
        },
        stderr: {
          setEncoding() {},
          on() {},
        },
        stdin: {
          end() {},
        },
        kill(signal) {
          events.push({ kill: signal });
        },
        on(event, handler) {
          listeners[event] = handler;
        },
      };
    },
    probe() {
      return { status: 0, stdout: 'codex 1.0.0', stderr: '' };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, null);
  assert.equal(result.signal, 'SIGTERM');
  assert.equal(result.error.code, 'PROVIDER_TIMEOUT');
  assert.deepEqual(events, [{ kill: 'SIGTERM' }]);
});

test('runProvider returns structured metadata when preflight fails', async () => {
  const result = await runProvider('claude', {
    prompt: 'hello',
    probe() {
      const error = new Error('not found');
      error.code = 'ENOENT';
      return { error };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, null);
  assert.equal(result.error.code, 'MISSING_PROVIDER_CLI');
  assert.equal(result.preflight, null);
});

test('runProvider prioritizes invalid model errors over secondary provider noise', async () => {
  const result = await runProvider('codex', {
    prompt: 'bad model',
    model: 'gpt-missing',
    spawn() {
      const listeners = {};
      const child = {
        stdout: {
          setEncoding() {},
          on() {},
        },
        stderr: {
          setEncoding() {},
          on(event, handler) {
            listeners[`stderr:${event}`] = handler;
          },
        },
        stdin: {
          end() {},
        },
        on(event, handler) {
          listeners[event] = handler;
          if (event === 'close') {
            process.nextTick(() => {
              listeners['stderr:data']("MCP warning: tool failed\nThe 'gpt-missing' model is not supported when using Codex with this account.\n");
              handler(1, null);
            });
          }
        },
      };
      return child;
    },
    probe() {
      return { status: 0, stdout: 'codex 1.0.0', stderr: '' };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_PROVIDER_MODEL');
  assert.match(result.error.message, /gpt-missing/);
  assert.match(result.error.message, /rejected model/);
});

test('extractProviderErrorCause redacts secrets from surfaced errors', () => {
  const cause = extractProviderErrorCause({
    provider: 'codex',
    stderr: "The 'sk-1234567890abcdef' model is not supported\n",
  });

  assert.equal(cause.code, 'INVALID_PROVIDER_MODEL');
  assert.doesNotMatch(cause.message, /sk-1234567890abcdef/);
  assert.match(cause.message, /\[REDACTED\]/);
});
