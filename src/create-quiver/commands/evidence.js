const path = require('path');
const { listEvidenceFiles, runEvidenceCommand, showEvidenceFile } = require('../lib/evidence');
const { createTranslator } = require('../lib/i18n/catalog');

function formatOutputPath(repoRoot, outputPath) {
  const relativeOutput = path.relative(repoRoot, outputPath).split(path.sep).join('/');
  if (relativeOutput && !relativeOutput.startsWith('../') && relativeOutput !== '..') {
    return relativeOutput;
  }

  return outputPath;
}

function runEvidence(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const command = options.command || '';
  if (options.subcommand === 'list') {
    const evidence = listEvidenceFiles(repoRoot);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ evidence }, null, 2)}\n`);
      return { evidence, exitCode: 0 };
    }

    console.log(translator.t('evidence.list.title'));
    if (evidence.length === 0) {
      console.log(translator.t('evidence.list.empty'));
      return { evidence, exitCode: 0 };
    }

    for (const item of evidence) {
      console.log(`- ${item.path} (${translator.t('evidence.exit_code', { code: item.exit_code ?? '-' })})`);
    }
    return { evidence, exitCode: 0 };
  }

  if (options.subcommand === 'show') {
    const evidence = showEvidenceFile(repoRoot, options.target);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
      return { evidence, exitCode: 0 };
    }

    process.stdout.write(evidence.content);
    return { evidence, exitCode: 0 };
  }

  if (options.subcommand !== 'run') {
    throw new Error(`create-quiver: ${translator.t('evidence.error.missing_subcommand')}`);
  }

  const result = runEvidenceCommand(repoRoot, command, {
    missingCommandMessage: `create-quiver: ${translator.t('evidence.error.missing_command')}`,
    maxOutput: options.maxOutput,
    outputPath: options.output,
    spawnSync: options.spawnSync,
  });
  const displayOutput = formatOutputPath(repoRoot, result.outputPath);

  console.log(translator.t('evidence.recorded'));
  console.log(`- ${translator.t('evidence.command', { command: result.record.command })}`);
  console.log(`- ${translator.t('evidence.exit_code', { code: result.exitCode })}`);
  console.log(`- ${translator.t('evidence.output', { path: displayOutput })}`);

  return result;
}

module.exports = {
  formatOutputPath,
  runEvidence,
};
