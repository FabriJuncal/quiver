const path = require('path');
const { listEvidenceArtifacts, readEvidenceArtifact, runEvidenceCommand } = require('../lib/evidence');
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
    const artifacts = listEvidenceArtifacts(repoRoot);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ schema_version: 1, items: artifacts }, null, 2)}\n`);
      return { exitCode: 0, artifacts };
    }

    console.log(translator.t('evidence.list.title'));
    if (artifacts.length === 0) {
      console.log(translator.t('evidence.list.empty'));
    } else {
      for (const artifact of artifacts) {
        console.log(`- ${artifact.path} (${artifact.size} bytes, ${artifact.updatedAt})`);
      }
    }
    return { exitCode: 0, artifacts };
  }

  if (options.subcommand === 'show') {
    const artifact = readEvidenceArtifact(repoRoot, options.path);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ schema_version: 1, artifact }, null, 2)}\n`);
      return { exitCode: 0, artifact };
    }

    process.stdout.write(artifact.content.endsWith('\n') ? artifact.content : `${artifact.content}\n`);
    return { exitCode: 0, artifact };
  }

  if (options.subcommand !== 'run') {
    throw new Error(`create-quiver: ${translator.t('evidence.error.missing_subcommand')}`);
  }
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error(`create-quiver: ${translator.t('evidence.error.missing_command')}`);
  }

  const result = runEvidenceCommand(repoRoot, command, {
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
