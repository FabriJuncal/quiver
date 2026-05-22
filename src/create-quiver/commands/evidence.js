const path = require('path');
const { runEvidenceCommand } = require('../lib/evidence');

function formatOutputPath(repoRoot, outputPath) {
  const relativeOutput = path.relative(repoRoot, outputPath).split(path.sep).join('/');
  if (relativeOutput && !relativeOutput.startsWith('../') && relativeOutput !== '..') {
    return relativeOutput;
  }

  return outputPath;
}

function runEvidence(repoRoot, options = {}) {
  const command = options.command || '';
  if (options.subcommand !== 'run') {
    throw new Error('create-quiver: missing evidence subcommand. Use: npx create-quiver evidence run -- <command>');
  }

  const result = runEvidenceCommand(repoRoot, command, {
    maxOutput: options.maxOutput,
    outputPath: options.output,
    spawnSync: options.spawnSync,
  });
  const displayOutput = formatOutputPath(repoRoot, result.outputPath);

  console.log('Quiver evidence recorded');
  console.log(`- Command: ${result.record.command}`);
  console.log(`- Exit code: ${result.exitCode}`);
  console.log(`- Output: ${displayOutput}`);

  return result;
}

module.exports = {
  formatOutputPath,
  runEvidence,
};
