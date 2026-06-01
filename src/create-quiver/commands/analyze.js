function createRunAnalyze(deps) {
  return function runAnalyze(targetDir, options = {}) {
    const projectRoot = deps.resolveTargetRoot(process.cwd(), targetDir);
    const translator = deps.createTranslator(options.language);

    if (!deps.fs.existsSync(projectRoot)) {
      throw new Error(deps.formatError(`target directory does not exist: ${projectRoot}`));
    }

    const scan = deps.buildProjectScan(projectRoot);
    const writeCount = 3;

    if (options.dryRun) {
      console.log(translator.t('analyze.dry_run_for', { path: projectRoot }));
      console.log(translator.t('analyze.writes_none'));
      console.log(translator.t('analyze.planned_writes', { count: writeCount }));
      console.log(translator.t('analyze.would_write', { path: deps.CURRENT_SCAN_RELATIVE_PATH }));
      console.log(translator.t('analyze.would_write', { path: deps.PROJECT_MAP_RELATIVE_PATH }));
      console.log(translator.t('analyze.would_refresh', { path: 'docs/AI_CONTEXT.md' }));
      console.log(translator.t('analyze.detected_primary_stack', { stack: scan.stack.primary }));
      console.log(translator.t('analyze.detected_frameworks', { frameworks: scan.stack.frameworks.length > 0 ? scan.stack.frameworks.join(', ') : translator.t('common.none_detected') }));
      console.log(translator.t('analyze.detected_package_manager', { manager: scan.project.package_manager }));
      return {
        artifacts: {
          jsonPath: deps.path.join(projectRoot, deps.CURRENT_SCAN_RELATIVE_PATH),
          mdPath: deps.path.join(projectRoot, deps.PROJECT_MAP_RELATIVE_PATH),
        },
        dryRun: true,
        scan,
      };
    }

    const artifacts = deps.writeProjectScanArtifacts(projectRoot, scan);
    const aiContextPath = deps.refreshAiContextDoc(projectRoot, scan);
    deps.updateStateForAnalyze(projectRoot, deps.CLI_VERSION);

    console.log(translator.t('analyze.completed_for', { path: projectRoot }));
    console.log(translator.t('analyze.wrote', { path: deps.relativePosixPath(projectRoot, artifacts.jsonPath) }));
    console.log(translator.t('analyze.wrote', { path: deps.relativePosixPath(projectRoot, artifacts.mdPath) }));
    console.log(translator.t('analyze.wrote', { path: deps.relativePosixPath(projectRoot, aiContextPath) }));
    console.log(translator.t('analyze.applied_writes', { count: writeCount }));
    console.log(translator.t('analyze.detected_primary_stack', { stack: scan.stack.primary }));
    console.log(translator.t('analyze.detected_package_manager', { manager: scan.project.package_manager }));

    return {
      artifacts,
      aiContextPath,
      dryRun: false,
      scan,
    };
  };
}

module.exports = {
  createRunAnalyze,
};
