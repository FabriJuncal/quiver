const {
  buildErrorPayload,
  collectDashboardReport,
  formatHumanDashboard,
  normalizeDashboardOptions,
} = require('../lib/dashboard');

function runDashboard(repoRoot, options = {}) {
  try {
    normalizeDashboardOptions(options);
    const report = collectDashboardReport(repoRoot, options);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return report;
    }

    process.stdout.write(formatHumanDashboard(report, options));
    return report;
  } catch (error) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(buildErrorPayload(error), null, 2)}\n`);
      process.exitCode = 1;
      return null;
    }
    throw error;
  }
}

module.exports = {
  runDashboard,
};
