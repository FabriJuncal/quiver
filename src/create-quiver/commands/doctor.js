function createRunDoctor(deps) {
  return function runDoctor(targetDir, options = {}) {
    const projectRoot = deps.resolveTargetRoot(process.cwd(), targetDir);

    if (!deps.fs.existsSync(projectRoot)) {
      throw new Error(deps.formatError(`target directory does not exist: ${projectRoot}`));
    }

    if (!deps.hasQuiverInitializationEvidence(projectRoot)) {
      throw new Error(deps.formatError('doctor requires a project previously initialized by Quiver.\nRun init first: npx create-quiver --name "Project Name"'));
    }

    const fixPlan = deps.buildDoctorFixPlan(projectRoot);
    if (options.fix) {
      if (options.dryRun) {
        if (options.json) {
          console.log(JSON.stringify({
            schema_version: 1,
            command: 'doctor fix',
            dry_run: true,
            fixes: fixPlan,
          }, null, 2));
          return;
        }
        console.log(deps.formatDoctorFixPlan(fixPlan, { dryRun: true }));
        return;
      }

      deps.applyDoctorFixPlan(projectRoot, fixPlan);
      if (!options.json) {
        console.log(deps.formatDoctorFixPlan(fixPlan));
      }
    }

    const commandReport = deps.buildDoctorCommandReport(projectRoot);
    if (options.json) {
      console.log(JSON.stringify(commandReport, null, 2));
    } else {
      process.stdout.write(deps.formatDoctorHumanReport(commandReport, {
        language: options.language,
        noColor: options.noColor,
        unicode: options.unicode,
      }));
    }

    if (commandReport.exit_code !== 0) {
      process.exitCode = commandReport.exit_code;
    }
  };
}

module.exports = {
  createRunDoctor,
};
