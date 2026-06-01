function createRunInit(deps) {
  return async function runInit(args) {
    const packageRoot = deps.packageRoot;
    const targetDir = deps.resolveTargetRoot(process.cwd(), args.targetDir);
    const projectName = args.projectName || deps.path.basename(targetDir) || 'Quiver Project';
    const initOptions = await deps.resolveInteractiveInitOptions(args, targetDir, projectName);

    if (initOptions.action === 'doctor') {
      deps.runDoctor(targetDir, {
        dryRun: args.dryRun,
        fix: false,
        json: args.json,
        noColor: args.noColor,
        unicode: args.unicode,
      });
      return;
    }

    const initLanguage = deps.resolveInitGeneratedLanguage(args, targetDir, initOptions);
    const initLayout = deps.buildInitLayout(targetDir, {
      compatibilityAlias: !args.explicitInit,
      dryRun: args.dryRun,
      full: initOptions.full,
      includeTemplates: initOptions.includeTemplates,
      language: initLanguage.configLanguage,
      legacyScripts: initOptions.legacyScripts,
      minimal: initOptions.minimal,
      projectName: initOptions.projectName,
      skipInstall: args.skipInstall,
    });

    if (args.dryRun) {
      console.log(deps.formatInitLayoutPlan(initLayout));
      return;
    }

    const tempRoot = deps.fs.mkdtempSync(deps.path.join(deps.os.tmpdir(), 'quiver-create-'));

    try {
      deps.ensureDir(targetDir);

      const templateRoot = deps.packTemplate(packageRoot, tempRoot);
      if (initLayout.profile === 'full') {
        deps.exportTemplatesToLegacyRoot(templateRoot, targetDir);
      }
      deps.runInitDocs(targetDir, initOptions.projectName, {
        includeTemplates: initOptions.includeTemplates,
        language: initLanguage.docsLanguage,
        legacyScripts: initOptions.legacyScripts,
        profile: initLayout.profile,
        templateRoot,
      });
      const languageWrite = deps.persistInitLanguage(targetDir, { language: initLanguage.configLanguage });

      if (!args.skipInstall) {
        const installResult = deps.installSelfAsDevDep(targetDir, deps.CLI_VERSION);
        if (installResult === 'installed') {
          console.log(`Added create-quiver@${deps.CLI_VERSION} as dev dependency`);
        } else if (installResult === 'failed') {
          console.warn(`Warning: could not install create-quiver automatically. Run: ${deps.formatInstallSelfCommand(targetDir, deps.CLI_VERSION)}`);
        }
      }

      const translator = deps.createTranslator(args.language);
      console.log(translator.t('init.installed', { path: targetDir }));
      console.log(translator.t('init.applied_summary', initLayout.summary));
      if (languageWrite) {
        console.log(translator.t('init.language.saved', { language: languageWrite.language }));
      }
      deps.printInitNextSteps(targetDir, initOptions.projectName, { language: args.language });
    } finally {
      deps.fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  };
}

module.exports = {
  createRunInit,
};
