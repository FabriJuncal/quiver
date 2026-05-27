const fs = require('node:fs');
const { spawn } = require('node:child_process');

const { finalizePromptTransport, preparePromptTransport, describePromptTransport } = require('./prompt-transport');
const { redactSecrets } = require('../evidence');

const SUPPORTED_PROVIDERS = ['codex', 'claude', 'gemini'];

const PROVIDERS = {
  codex: {
    id: 'codex',
    command: 'codex',
    args: ['exec'],
    supportsModelSelection: true,
    modelArgBuilder: (model) => ['--model', model],
    timeoutMs: 10 * 60 * 1000,
    installHint: 'Install the Codex CLI and make sure it is available on PATH.',
  },
  claude: {
    id: 'claude',
    command: 'claude',
    args: ['-p'],
    supportsModelSelection: true,
    modelArgBuilder: (model) => ['--model', model],
    timeoutMs: 10 * 60 * 1000,
    installHint: 'Install the Claude CLI and make sure it is available on PATH.',
  },
  gemini: {
    id: 'gemini',
    command: 'gemini',
    args: ['--prompt', ''],
    supportsModelSelection: true,
    modelArgBuilder: (model) => ['--model', model],
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

function normalizeProviderModel(model) {
  const value = String(model || '').trim();
  return value || '';
}

function resolveProviderModelSelection(providerId, model, options = {}) {
  const rawModel = normalizeProviderModel(model);
  if (!rawModel) {
    return {
      input: '',
      model: '',
      displayName: '',
      modelSource: '',
      aliasNormalized: false,
    };
  }

  const { normalizeModelSelection } = require('./model-catalog');
  const selection = normalizeModelSelection(providerId, rawModel, {
    displayName: options.displayName,
  });
  const aliasNormalized = selection.modelSource === 'catalog' && selection.model !== rawModel;
  if (aliasNormalized && options.blockModelAlias === true) {
    throw new ProviderRunnerError(
      'DISPLAY_MODEL_ALIAS',
      `Model '${rawModel}' is a display alias for provider '${providerId}', not the technical id. Use '${selection.model}' or run 'npx create-quiver ai agent repair --dry-run'.`,
      {
        provider: providerId,
        inputModel: rawModel,
        suggestedModel: selection.model,
        displayName: selection.displayName,
        nextSteps: [
          `Use --model ${selection.model}.`,
          'Run npx create-quiver ai agent repair --dry-run to preview profile normalization.',
          'Run npx create-quiver ai agent doctor to inspect profile issues.',
        ],
      },
    );
  }

  return {
    input: rawModel,
    model: selection.model,
    displayName: selection.displayName,
    modelSource: selection.modelSource,
    aliasNormalized,
  };
}

function buildProviderModelArgs(providerId, model, options = {}) {
  const provider = getProviderDefinition(providerId);
  const modelResolution = resolveProviderModelSelection(provider.id, model, options);
  const normalizedModel = modelResolution.model;
  const enforce = options.enforce === true;

  if (!normalizedModel) {
    return {
      model: '',
      supported: Boolean(provider.supportsModelSelection),
      enforced: enforce,
      args: [],
      reason: 'no model selected',
    };
  }

  if (provider.supportsModelSelection !== true || typeof provider.modelArgBuilder !== 'function') {
    if (enforce) {
      throw new ProviderRunnerError(
        'UNSUPPORTED_PROVIDER_MODEL_SELECTION',
        `Provider '${provider.id}' cannot receive model '${normalizedModel}' through its Quiver adapter. Remove the model selection or update the provider adapter before live execution.`,
        {
          provider: provider.id,
          model: normalizedModel,
          nextSteps: [
            `Run without a model override for provider '${provider.id}'.`,
            `Update the '${provider.id}' provider adapter with model argument support.`,
            'Use --dry-run to inspect the invocation before live execution.',
          ],
        },
      );
    }

    return {
      model: normalizedModel,
      supported: false,
      enforced: false,
      args: [],
      reason: 'provider adapter does not support model arguments',
    };
  }

  const args = provider.modelArgBuilder(normalizedModel);
  const result = {
    model: normalizedModel,
    supported: true,
    enforced: enforce,
    args: Array.isArray(args) ? args.map((arg) => String(arg)) : [],
    reason: modelResolution.aliasNormalized ? `model alias normalized from ${modelResolution.input}` : 'model argument supported',
  };
  if (modelResolution.aliasNormalized) {
    result.input = modelResolution.input;
    result.displayName = modelResolution.displayName;
    result.modelSource = modelResolution.modelSource;
  }
  return result;
}

function buildProviderInvocation(providerId, options = {}) {
  const provider = getProviderDefinition(providerId);
  const extraArgs = Array.isArray(options.args) ? options.args.map((arg) => String(arg)) : [];
  const modelSelection = buildProviderModelArgs(provider.id, options.model, {
    enforce: options.enforceModelSelection === true,
    blockModelAlias: options.blockModelAlias === true,
    displayName: options.displayName,
  });
  const prompt = String(options.prompt ?? '');
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : provider.timeoutMs;
  const cwd = options.cwd ? String(options.cwd) : process.cwd();
  const transportMode = options.transportMode || options.promptTransport || 'stdin';

  return {
    provider: provider.id,
    command: provider.command,
    args: provider.args.concat(modelSelection.args, extraArgs),
    cwd,
    timeoutMs,
    promptLength: Buffer.byteLength(prompt, 'utf8'),
    modelSelection,
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
    modelSelection: invocation.modelSelection,
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
    message: redactSecrets(error.message || String(error)),
    provider,
    command: invocation.command,
    args: invocation.args.slice(),
    syscall: error.syscall || null,
    errno: typeof error.errno === 'number' ? error.errno : null,
  };
}

function compactProviderText(value) {
  return redactSecrets(String(value || ''))
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED]')
    .replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, '[REDACTED]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, '[REDACTED]')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(' ');
}

function extractProviderErrorCause(result = {}) {
  const error = result.error || {};
  const text = compactProviderText([
    error.message,
    result.stderr,
    result.stdout,
  ].filter(Boolean).join('\n'));
  const lower = text.toLowerCase();

  if (error.code === 'MISSING_PROVIDER_CLI') {
    return {
      code: 'MISSING_PROVIDER_CLI',
      message: error.message || `Provider CLI '${result.command || result.provider}' is not available.`,
    };
  }

  if (error.code === 'PROVIDER_TIMEOUT') {
    return {
      code: 'PROVIDER_TIMEOUT',
      message: error.message || `Provider '${result.provider}' timed out.`,
    };
  }

  const quotedUnsupportedModel = text.match(/the ['"`]([^'"`]+)['"`] model is not supported/i);
  const genericInvalidModel = /invalid model|unknown model|model .*not supported|model .*not available|model .*does not exist|unsupported model/i.test(text);
  if (quotedUnsupportedModel || genericInvalidModel) {
    const model = quotedUnsupportedModel ? quotedUnsupportedModel[1] : result.modelSelection?.model;
    return {
      code: 'INVALID_PROVIDER_MODEL',
      message: model
        ? `Provider '${result.provider}' rejected model '${model}'. ${text}`
        : `Provider '${result.provider}' rejected the selected model. ${text}`,
    };
  }

  if (/unauthorized|forbidden|permission denied|not authenticated|authentication|api key|login required|log in/i.test(text)) {
    return {
      code: 'PROVIDER_AUTH_ERROR',
      message: `Provider '${result.provider}' authentication failed. ${text}`,
    };
  }

  if (text) {
    return {
      code: 'PROVIDER_RUN_FAILED',
      message: text,
    };
  }

  return {
    code: 'PROVIDER_RUN_FAILED',
    message: 'provider run failed',
  };
}

function createProviderFailureError(result = {}) {
  const cause = extractProviderErrorCause(result);
  return new ProviderRunnerError(cause.code, cause.message, {
    provider: result.provider,
    command: result.command,
    args: Array.isArray(result.args) ? result.args.slice() : [],
    exitCode: result.exitCode,
    signal: result.signal,
    modelSelection: result.modelSelection,
  });
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
        stdout: redactSecrets(stdout),
        stderr: redactSecrets(stderr),
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
      modelSelection: invocation.modelSelection,
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

    const providerResult = {
      ok: execution.ok,
      dryRun: false,
      provider: invocation.provider,
      command: invocation.command,
      args: invocation.args.slice(),
      cwd: invocation.cwd,
      timeoutMs: invocation.timeoutMs,
      modelSelection: invocation.modelSelection,
      promptTransport: describePromptTransport(transport),
      exitCode: execution.exitCode,
      signal: execution.signal,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error,
      preflight: preflightResult,
    };
    if (!providerResult.ok && !providerResult.error) {
      providerResult.error = serializeError(createProviderFailureError(providerResult), invocation.provider, invocation);
    }
    return providerResult;
  } finally {
    finalizePromptTransport(transport);
  }
}

module.exports = {
  SUPPORTED_PROVIDERS,
  ProviderRunnerError,
  assertSupportedProvider,
  buildProviderModelArgs,
  buildProviderInvocation,
  createProviderFailureError,
  extractProviderErrorCause,
  formatProviderList,
  getProviderDefinition,
  resolveProviderModelSelection,
  runProvider,
};
