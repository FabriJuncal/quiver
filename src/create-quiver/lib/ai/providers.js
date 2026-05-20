const fs = require('node:fs');
const { spawn } = require('node:child_process');

const { finalizePromptTransport, preparePromptTransport, describePromptTransport } = require('./prompt-transport');

const SUPPORTED_PROVIDERS = ['codex', 'claude', 'gemini'];

const PROVIDERS = {
  codex: {
    id: 'codex',
    command: 'codex',
    args: ['exec'],
    timeoutMs: 10 * 60 * 1000,
    installHint: 'Install the Codex CLI and make sure it is available on PATH.',
  },
  claude: {
    id: 'claude',
    command: 'claude',
    args: ['-p'],
    timeoutMs: 10 * 60 * 1000,
    installHint: 'Install the Claude CLI and make sure it is available on PATH.',
  },
  gemini: {
    id: 'gemini',
    command: 'gemini',
    args: ['--prompt', ''],
    timeoutMs: 10 * 60 * 1000,
    installHint: 'Install the Gemini CLI and make sure it is available on PATH.',
  },
};

class ProviderRunnerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProviderRunnerError';
    this.code = code;
    this.details = details;
  }
}

function formatProviderList() {
  return SUPPORTED_PROVIDERS.join(', ');
}

function assertSupportedProvider(providerId) {
  const normalized = String(providerId || '').trim().toLowerCase();
  if (!normalized || !Object.prototype.hasOwnProperty.call(PROVIDERS, normalized)) {
    throw new ProviderRunnerError(
      'UNSUPPORTED_PROVIDER',
      `Unsupported provider '${providerId}'. Supported providers: ${formatProviderList()}.`,
      { providerId, supportedProviders: SUPPORTED_PROVIDERS.slice() },
    );
  }

  return normalized;
}

function getProviderDefinition(providerId) {
  const normalized = assertSupportedProvider(providerId);
  return PROVIDERS[normalized];
}

function buildProviderInvocation(providerId, options = {}) {
  const provider = getProviderDefinition(providerId);
  const extraArgs = Array.isArray(options.args) ? options.args.map((arg) => String(arg)) : [];
  const prompt = String(options.prompt ?? '');
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : provider.timeoutMs;
  const cwd = options.cwd ? String(options.cwd) : process.cwd();
  const transportMode = options.transportMode || options.promptTransport || 'stdin';

  return {
    provider: provider.id,
    command: provider.command,
    args: provider.args.concat(extraArgs),
    cwd,
    timeoutMs,
    promptLength: Buffer.byteLength(prompt, 'utf8'),
    promptTransport: {
      mode: transportMode,
      promptLength: Buffer.byteLength(prompt, 'utf8'),
      usesStdin: transportMode !== 'temp-file',
    },
  };
}

function createDryRunResult(invocation) {
  return {
    ok: true,
    dryRun: true,
    provider: invocation.provider,
    command: invocation.command,
    args: invocation.args.slice(),
    cwd: invocation.cwd,
    timeoutMs: invocation.timeoutMs,
    promptTransport: invocation.promptTransport,
    exitCode: 0,
    stdout: '',
    stderr: '',
    error: null,
  };
}

function serializeError(error, provider, invocation) {
  if (!error) {
    return null;
  }

  return {
    code: error.code || 'PROVIDER_ERROR',
    message: error.message || String(error),
    provider,
    command: invocation.command,
    args: invocation.args.slice(),
    syscall: error.syscall || null,
    errno: typeof error.errno === 'number' ? error.errno : null,
  };
}

function runSpawn(command, args, options = {}) {
  const spawnImpl = options.spawn || spawn;

  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl(command, args, {
        cwd: options.cwd,
        env: options.env,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      resolve({
        ok: false,
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: '',
        error: serializeError(error, options.provider, options.invocation),
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    const cleanupFns = [];
    let settled = false;

    if (child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
    }

    if (child.stderr) {
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }

    const finalize = (payload) => {
      if (settled) {
        return;
      }
      settled = true;

      while (cleanupFns.length > 0) {
        const fn = cleanupFns.pop();
        try {
          fn();
        } catch {
          // Ignore cleanup failures so execution results remain visible.
        }
      }

      resolve({
        ok: payload.exitCode === 0,
        exitCode: payload.exitCode,
        signal: payload.signal || null,
        stdout,
        stderr,
        error: payload.error ? serializeError(payload.error, options.provider, options.invocation) : null,
      });
    };

    if (options.transport && typeof options.transport.cleanup === 'function') {
      cleanupFns.push(() => options.transport.cleanup());
    }

    const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 0;
    if (timeoutMs > 0) {
      const timer = setTimeout(() => {
        if (child && typeof child.kill === 'function') {
          child.kill('SIGTERM');
        }
        finalize({
          exitCode: null,
          signal: 'SIGTERM',
          error: new ProviderRunnerError(
            'PROVIDER_TIMEOUT',
            `Provider '${options.provider}' timed out after ${timeoutMs}ms.`,
            { timeoutMs },
          ),
        });
      }, timeoutMs);
      cleanupFns.push(() => clearTimeout(timer));
    }

    child.on('error', (error) => {
      finalize({
        exitCode: null,
        error,
      });
    });

    child.on('close', (exitCode, signal) => {
      finalize({
        exitCode: typeof exitCode === 'number' ? exitCode : null,
        signal,
      });
    });

    if (options.transport && options.transport.mode === 'temp-file') {
      if (child.stdin) {
        const contents = fs.readFileSync(options.transport.filePath, 'utf8');
        child.stdin.end(contents, 'utf8');
      }
    } else if (child.stdin) {
      child.stdin.end(String(options.prompt ?? ''), 'utf8');
    }
  });
}

async function runProvider(providerId, options = {}) {
  const invocation = buildProviderInvocation(providerId, options);

  if (options.dryRun) {
    return createDryRunResult(invocation);
  }

  let preflightResult;
  try {
    const { preflightProvider } = require('./preflight');
    preflightResult = preflightProvider(providerId, {
      probe: options.probe,
      cwd: invocation.cwd,
    });
  } catch (error) {
    return {
      ok: false,
      dryRun: false,
      provider: invocation.provider,
      command: invocation.command,
      args: invocation.args.slice(),
      cwd: invocation.cwd,
      timeoutMs: invocation.timeoutMs,
      promptTransport: invocation.promptTransport,
      exitCode: null,
      stdout: '',
      stderr: '',
      error: serializeError(error, invocation.provider, invocation),
      preflight: null,
    };
  }

  const transport = preparePromptTransport(String(options.prompt ?? ''), {
    mode: invocation.promptTransport.mode,
    tempRoot: options.tempRoot,
    tempFileName: options.tempFileName,
    tempFilePrefix: options.tempFilePrefix,
  });

  try {
    const execution = await runSpawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      env: options.env,
      spawn: options.spawn,
      transport,
      prompt: options.prompt,
      provider: invocation.provider,
      invocation,
      timeoutMs: invocation.timeoutMs,
    });

    return {
      ok: execution.ok,
      dryRun: false,
      provider: invocation.provider,
      command: invocation.command,
      args: invocation.args.slice(),
      cwd: invocation.cwd,
      timeoutMs: invocation.timeoutMs,
      promptTransport: describePromptTransport(transport),
      exitCode: execution.exitCode,
      signal: execution.signal,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error,
      preflight: preflightResult,
    };
  } finally {
    finalizePromptTransport(transport);
  }
}

module.exports = {
  SUPPORTED_PROVIDERS,
  ProviderRunnerError,
  assertSupportedProvider,
  buildProviderInvocation,
  getProviderDefinition,
  runProvider,
};
