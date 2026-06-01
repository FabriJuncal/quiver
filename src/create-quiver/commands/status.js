const { detectFlowState } = require('./flow');
const { translatorForHuman } = require('../lib/i18n/read-only-format');

function buildStatusReport(repoRoot) {
  const flow = detectFlowState(repoRoot);
  return {
    schema_version: 1,
    state: flow.stage,
    source: 'flow',
    next_command: flow.nextCommand,
    blockers: flow.blockers,
    warnings: [],
    specs: flow.facts.specSlugs,
    facts: {
      initialized: flow.facts.initialized,
      package_manager: flow.facts.packageManager,
      context_source: flow.facts.contextSource?.status || 'unknown',
      approvals: flow.facts.approvals,
      slices: flow.facts.slices,
    },
  };
}

function formatHumanStatus(report, options = {}) {
  const translator = translatorForHuman(options);
  const lines = [
    translator.t('status_command.title'),
    '',
    `${translator.t('status_command.state')}: ${translator.t(`flow.stage.${report.state}`)}`,
    `${translator.t('status_command.source')}: ${report.source}`,
    `${translator.t('status_command.next_command')}: ${report.next_command}`,
  ];

  if (report.specs.length > 0) {
    lines.push(`${translator.t('status_command.specs')}: ${report.specs.join(', ')}`);
  }

  if (report.blockers.length > 0) {
    lines.push('', `${translator.t('status_command.blockers')}:`);
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker.message || blocker.code || String(blocker)}`);
    }
  }

  lines.push('', translator.t('status_command.read_only'));
  return `${lines.join('\n')}\n`;
}

function runStatus(repoRoot, options = {}) {
  const report = buildStatusReport(repoRoot);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report;
  }

  process.stdout.write(formatHumanStatus(report, options));
  return report;
}

module.exports = {
  buildStatusReport,
  formatHumanStatus,
  runStatus,
};
