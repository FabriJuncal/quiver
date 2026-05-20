const { spawnSync } = require('node:child_process');

const { ProviderRunnerError, getProviderDefinition, assertSupportedProvider, SUPPORTED_PROVIDERS } = require('./providers');

function buildInstallHint(providerId) {
  const provider = getProviderDefinition(providerId);
  return `${provider.installHint} Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}.`;
}

function createMissingCliError(providerId, errorDetails = {}) {
  const provider = getProviderDefinition(providerId);
  return new ProviderRunnerError(
    'MISSING_PROVIDER_CLI',
    `Provider CLI '${provider.command}' is not available. ${buildInstallHint(providerId)}`,
    {
      provider: provider.id,
      command: provider.command,
      installHint: provider.installHint,
      ...errorDetails,
    },
  );
}

function preflightProvider(providerId, options = {}) {
  const normalized = assertSupportedProvider(providerId);
  const provider = getProviderDefinition(normalized);
  const probe = options.probe || spawnSync;
  const probeArgs = Array.isArray(options.probeArgs) ? options.probeArgs : ['--version'];
  const probeResult = probe(provider.command, probeArgs, {
    cwd: options.cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (probeResult && probeResult.error && probeResult.error.code === 'ENOENT') {
    throw createMissingCliError(normalized, {
      probeArgs,
      errorCode: probeResult.error.code,
    });
  }

  return {
    ok: true,
    provider: provider.id,
    command: provider.command,
    probeArgs,
    stdout: probeResult && typeof probeResult.stdout === 'string' ? probeResult.stdout : '',
    stderr: probeResult && typeof probeResult.stderr === 'string' ? probeResult.stderr : '',
    status: probeResult && typeof probeResult.status === 'number' ? probeResult.status : 0,
  };
}

module.exports = {
  buildInstallHint,
  createMissingCliError,
  preflightProvider,
};
