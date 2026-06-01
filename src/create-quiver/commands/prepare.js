const fs = require('node:fs');
const path = require('node:path');

const { collectDoctorReport } = require('../lib/doctor');
const { ensureGhAuthenticated, ensureGhInstalled, ensureIdentityFile } = require('../lib/ai/github');
const { collectOnboardingContextPlan } = require('../lib/ai/onboarding-template');
const { preflightProvider } = require('../lib/ai/preflight');
const { createTranslator } = require('../lib/i18n/catalog');

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

function buildNextSteps(report, translator) {
  const nextSteps = [];

  if (report.gh.status !== 'ok') {
    nextSteps.push(translator.t('prepare.output.next.fix_gh'));
  }

  if (report.ssh.identityFileStatus === 'missing') {
    nextSteps.push(translator.t('prepare.output.next.fix_ssh_identity'));
  }

  if (report.ssh.authStatus === 'missing') {
    nextSteps.push(translator.t('prepare.output.next.gh_auth'));
  }

  if (report.provider.status === 'missing') {
    nextSteps.push(translator.t('prepare.output.next.install_provider', {
      provider: report.provider.name,
    }));
  }

  if (nextSteps.length === 0) {
    nextSteps.push(translator.t('prepare.output.next.ready'));
  }

  return nextSteps;
}

function formatPrepareReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('prepare.output.title'),
    translator.t('prepare.output.mode', { mode: report.dryRun ? 'dry-run' : 'live' }),
    translator.t('prepare.output.project', { project: report.projectRoot }),
    translator.t('prepare.output.framework_guidance'),
    translator.t('prepare.output.project_docs_copy', {
      status: report.workflowSource.exists
        ? translator.t('prepare.output.docs_present')
        : translator.t('prepare.output.docs_absent'),
    }),
    translator.t('prepare.output.layout', { layout: report.doctor.layout }),
    translator.t('prepare.output.specs', {
      specs: report.doctor.specSlugs.length > 0 ? report.doctor.specSlugs.join(', ') : translator.t('common.none'),
    }),
  ];

  if (report.doctor.warnings.length > 0) {
    lines.push(translator.t('prepare.output.doctor_warnings', {
      warnings: report.doctor.warnings.join(' | '),
    }));
  }

  lines.push(translator.t('prepare.output.checks'));

  lines.push(translator.t('prepare.output.onboarding_context'));
  lines.push(`- ${translator.t('prepare.output.prompt_source')}: ${report.onboarding.promptSource}`);
  lines.push(`- ${translator.t('prepare.output.selected_docs')}: ${report.onboarding.selectedDocs.length > 0 ? report.onboarding.selectedDocs.map((item) => item.path).join(', ') : translator.t('common.none')}`);
  lines.push(`- ${translator.t('prepare.output.documentation_debt')}: ${report.onboarding.missingDocs.length > 0 ? report.onboarding.missingDocs.map((item) => item.path).join(', ') : translator.t('common.none')}`);
  lines.push(`- ${translator.t('prepare.output.omitted_by_default')}: ${report.onboarding.omittedByDefault.join(' | ')}`);

  if (report.onboarding.risks.length > 0) {
    lines.push(`- ${translator.t('prepare.output.onboarding_risks')}: ${report.onboarding.risks.join(' | ')}`);
  }

  lines.push(translator.t('prepare.output.github_cli'));
  if (report.gh.status === 'ok') {
    lines.push(`- ${translator.t('prepare.output.available', { command: report.gh.value.command })}`);
  } else {
    lines.push(`- ${translator.t('prepare.output.missing')}`);
    lines.push(`- ${report.gh.error.message}`);
  }

  lines.push(translator.t('prepare.output.ssh'));
  lines.push(`- ${translator.t('prepare.output.host_alias')}: ${report.ssh.hostAlias || translator.t('prepare.output.not_provided')}`);
  if (report.ssh.identityFile) {
    lines.push(`- ${translator.t('prepare.output.identity_file')}: ${report.ssh.identityFile}`);
  } else if (report.ssh.identityFileStatus === 'skipped') {
    lines.push(`- ${translator.t('prepare.output.identity_file')}: ${translator.t('prepare.output.not_requested')}`);
  } else if (report.ssh.identityFileStatus === 'missing') {
    lines.push(`- ${translator.t('prepare.output.identity_file')}: ${translator.t('prepare.output.missing')} (${report.ssh.identityError.message})`);
  }
  if (report.ssh.authStatus === 'ok') {
    lines.push(`- ${translator.t('prepare.output.auth')}: ${translator.t('prepare.output.ok')}`);
  } else if (report.ssh.authStatus === 'missing') {
    lines.push(`- ${translator.t('prepare.output.auth')}: ${translator.t('prepare.output.missing')} (${report.ssh.authError.message})`);
  } else {
    lines.push(`- ${translator.t('prepare.output.auth')}: ${translator.t('prepare.output.not_requested')}`);
  }

  if (report.provider.name) {
    lines.push(translator.t('prepare.output.provider_cli', { provider: report.provider.name }));
    if (report.provider.status === 'ok') {
      lines.push(`- ${translator.t('prepare.output.available', { command: report.provider.value.command })}`);
    } else {
      lines.push(`- ${translator.t('prepare.output.missing')} (${report.provider.error.message})`);
    }
  } else {
    lines.push(`Provider CLI: ${translator.t('prepare.output.not_requested')}`);
  }

  lines.push(translator.t('prepare.output.next_safe_commands'));
  for (const step of report.nextSteps) {
    lines.push(`- ${step}`);
  }

  if (report.dryRun) {
    lines.push(translator.t('prepare.output.dry_run_note'));
  }

  return `${lines.join('\n')}\n`;
}

async function runPrepare(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const doctorReport = collectDoctorReport(repoRoot);
  const workflowSourcePath = path.join(repoRoot, 'README_FOR_AI.md');
  const onboarding = collectOnboardingContextPlan(repoRoot);
  const report = {
    dryRun: options.dryRun === true,
    doctor: doctorReport,
    gh: { status: 'skipped', value: null, error: null },
    nextSteps: [],
    onboarding,
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

  report.nextSteps = buildNextSteps(report, translator);

  process.stdout.write(formatPrepareReport(report, { language: options.language }));
  return report;
}

module.exports = {
  formatPrepareReport,
  runPrepare,
};
