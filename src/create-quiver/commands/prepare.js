const fs = require('node:fs');
const path = require('node:path');

const { collectDoctorReport } = require('../lib/doctor');
const { ensureGhAuthenticated, ensureGhInstalled, ensureIdentityFile } = require('../lib/ai/github');
const { preflightProvider } = require('../lib/ai/preflight');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function summarizeError(error) {
  return {
    code: error && error.code ? error.code : 'UNKNOWN_ERROR',
    message: error && error.message ? error.message : String(error),
    details: error && error.details ? error.details : undefined,
  };
}

function collectCheckStatus(label, runner, sink) {
  try {
    const value = runner();
    sink.status = 'ok';
    sink.value = value;
    return value;
  } catch (error) {
    sink.status = 'missing';
    sink.error = summarizeError(error);
    return null;
  }
}

function buildNextSteps(report) {
  const nextSteps = [];

  if (report.gh.status !== 'ok') {
    nextSteps.push('Install GitHub CLI, then rerun `npx create-quiver prepare`.');
  }

  if (report.ssh.identityFileStatus === 'missing') {
    nextSteps.push('Fix the SSH identity file path, then rerun `npx create-quiver prepare`.');
  }

  if (report.ssh.authStatus === 'missing') {
    nextSteps.push('Run `gh auth login`, then rerun `npx create-quiver prepare`.');
  }

  if (report.provider.status === 'missing') {
    nextSteps.push('Install the ' + report.provider.name + ' CLI, then rerun `npx create-quiver prepare --provider ' + report.provider.name + '`.');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Run `npx create-quiver doctor` for the layout contract, then `npx create-quiver ai onboard --dry-run` to preview the onboarding prompt.');
  }

  return nextSteps;
}

function formatListLine(label, value) {
  if (Array.isArray(value)) {
    return `${label}: ${value.length > 0 ? value.join(', ') : 'none'}`;
  }

  return `${label}: ${value}`;
}

function formatPrepareReport(report) {
  const lines = [
    'Quiver prepare report',
    `Mode: ${report.dryRun ? 'dry-run' : 'live'}`,
    `Project: ${report.projectRoot}`,
    `Docs source: ${report.workflowSource.exists ? 'README_FOR_AI.md present' : 'README_FOR_AI.md missing'}`,
    `Layout: ${report.doctor.layout}`,
    formatListLine('Specs', report.doctor.specSlugs),
  ];

  if (report.doctor.warnings.length > 0) {
    lines.push(`Doctor warnings: ${report.doctor.warnings.join(' | ')}`);
  }

  lines.push('Checks: project docs, GitHub CLI, GitHub auth when SSH inputs are provided, SSH identity file when passed, provider CLI when passed');

  lines.push('GitHub CLI:');
  if (report.gh.status === 'ok') {
    lines.push(`- available (${report.gh.value.command})`);
  } else {
    lines.push(`- missing`);
    lines.push(`- ${report.gh.error.message}`);
  }

  lines.push('SSH:');
  lines.push(`- host alias: ${report.ssh.hostAlias || 'not provided'}`);
  if (report.ssh.identityFile) {
    lines.push(`- identity file: ${report.ssh.identityFile}`);
  } else if (report.ssh.identityFileStatus === 'skipped') {
    lines.push('- identity file: not requested');
  } else if (report.ssh.identityFileStatus === 'missing') {
    lines.push(`- identity file: missing (${report.ssh.identityError.message})`);
  }
  if (report.ssh.authStatus === 'ok') {
    lines.push('- auth: ok');
  } else if (report.ssh.authStatus === 'missing') {
    lines.push(`- auth: missing (${report.ssh.authError.message})`);
  } else {
    lines.push('- auth: not requested');
  }

  if (report.provider.name) {
    lines.push(`Provider CLI (${report.provider.name}):`);
    if (report.provider.status === 'ok') {
      lines.push(`- available (${report.provider.value.command})`);
    } else {
      lines.push(`- missing (${report.provider.error.message})`);
    }
  } else {
    lines.push('Provider CLI: not requested');
  }

  lines.push('Next safe commands:');
  for (const step of report.nextSteps) {
    lines.push(`- ${step}`);
  }

  if (report.dryRun) {
    lines.push('Dry-run note: this command does not write files.');
  }

  return `${lines.join('\n')}\n`;
}

async function runPrepare(repoRoot, options = {}) {
  const doctorReport = collectDoctorReport(repoRoot);
  const workflowSourcePath = path.join(repoRoot, 'README_FOR_AI.md');
  const report = {
    dryRun: options.dryRun === true,
    doctor: doctorReport,
    gh: { status: 'skipped', value: null, error: null },
    nextSteps: [],
    projectRoot: repoRoot,
    provider: { name: '', status: 'skipped', value: null, error: null },
    ssh: {
      authError: null,
      authStatus: 'skipped',
      hostAlias: String(options.sshHostAlias || '').trim(),
      identityError: null,
      identityFile: '',
      identityFileStatus: 'skipped',
      status: 'skipped',
    },
    workflowSource: {
      exists: fs.existsSync(workflowSourcePath),
      path: workflowSourcePath,
    },
  };

  collectCheckStatus(
    'gh',
    () => ensureGhInstalled({
      cwd: repoRoot,
      ghCommand: options.ghCommand,
      ghProbe: options.ghProbe,
      ghProbeArgs: options.ghProbeArgs,
    }),
    report.gh,
  );

  if (report.ssh.hostAlias || options.identityFile) {
    report.ssh.status = 'requested';

    if (options.identityFile) {
      try {
        report.ssh.identityFile = ensureIdentityFile(repoRoot, options.identityFile);
        report.ssh.identityFileStatus = 'ok';
      } catch (error) {
        report.ssh.identityFileStatus = 'missing';
        report.ssh.identityError = summarizeError(error);
      }
    }

    if (report.gh.status === 'ok') {
      try {
        const auth = ensureGhAuthenticated({
          cwd: repoRoot,
          ghAuthArgs: options.ghAuthArgs,
          ghAuthProbe: options.ghAuthProbe,
          ghCommand: options.ghCommand,
          ghProbe: options.ghProbe,
        });
        report.ssh.authStatus = 'ok';
        report.ssh.auth = auth;
      } catch (error) {
        report.ssh.authStatus = 'missing';
        report.ssh.authError = summarizeError(error);
      }
    } else {
      report.ssh.authStatus = 'skipped';
    }
  }

  if (options.provider) {
    report.provider.name = String(options.provider).trim().toLowerCase();
    collectCheckStatus(
      'provider',
      () => preflightProvider(report.provider.name, {
        cwd: repoRoot,
        probe: options.providerProbe,
        probeArgs: options.providerProbeArgs,
      }),
      report.provider,
    );
  }

  report.nextSteps = buildNextSteps(report);

  process.stdout.write(formatPrepareReport(report));
  return report;
}

module.exports = {
  formatPrepareReport,
  runPrepare,
};
