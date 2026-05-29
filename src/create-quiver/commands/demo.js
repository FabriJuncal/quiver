const { buildDemoPlan, formatDemoPlan, writeDemoPlan } = require('../lib/demo');

function runDemo(options = {}) {
  if (options.command !== 'create') {
    throw new Error(`create-quiver: unsupported demo subcommand: ${options.command || '(missing)'}. Supported tasks: create`);
  }

  const plan = buildDemoPlan(options.targetRoot, { demo: options.demo });

  if (options.dryRun) {
    console.log(formatDemoPlan(plan, { dryRun: true, language: options.language }));
    return plan;
  }

  writeDemoPlan(plan);
  console.log(formatDemoPlan(plan, { language: options.language }));
  return plan;
}

module.exports = {
  runDemo,
};
