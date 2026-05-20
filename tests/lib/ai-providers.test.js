const assert = require('node:assert/strict');
const test = require('node:test');

const {
  SUPPORTED_PROVIDERS,
  ProviderRunnerError,
  assertSupportedProvider,
  buildProviderInvocation,
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
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, '');
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
