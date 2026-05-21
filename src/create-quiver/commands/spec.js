const fs = require('node:fs');
const path = require('node:path');

const { resolveReviewedTechnicalPlanInput } = require('../lib/ai/plan-review');
const {
  buildSpecGenerationManifest,
  describeSpecGeneration,
  generateSpecArtifacts,
} = require('../lib/ai/spec-generator');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function readInputText(repoRoot, inputPath) {
  const resolved = path.resolve(repoRoot, inputPath || '');
  if (!inputPath || !fs.existsSync(resolved)) {
    throw new Error(formatError(`missing reviewed and approved plan input: ${inputPath || '<default>'}`));
  }
  return fs.readFileSync(resolved, 'utf8');
}

function buildSpecCreatePreview(repoRoot, options = {}) {
  const resolved = resolveReviewedTechnicalPlanInput(repoRoot, options.input || undefined);
  const inputPath = resolved.inputPath;
  const inputText = readInputText(repoRoot, inputPath);
  const manifest = buildSpecGenerationManifest({
    inputPath,
    inputText,
    repoRoot,
    specSlug: options.specSlug,
  });
  const preview = describeSpecGeneration(manifest, repoRoot);
  const relativeSpecDir = toRelativePosix(repoRoot, preview.specDir);

  if (fs.existsSync(preview.specDir)) {
    throw new Error(formatError(`spec directory already exists: ${relativeSpecDir}`));
  }

  return {
    inputPath,
    manifest,
    preview,
    relativeSpecDir,
  };
}

function formatNextCommands(specDir) {
  return [
    'Next safe commands:',
    `- npx create-quiver spec start ${specDir}`,
    `- npx create-quiver spec status ${specDir}`,
    '- npx create-quiver next',
    '- npx create-quiver ai execute-plan --dry-run --commit',
  ];
}

function formatSpecCreateDryRun(preview) {
  const lines = [
    'Quiver spec create dry-run',
    `Spec slug: ${preview.manifest.slug}`,
    `Title: ${preview.manifest.title}`,
    `Input file: ${preview.inputPath}`,
    `Target: ${preview.relativeSpecDir}`,
    `Planned files: ${preview.preview.files.length}`,
  ];

  for (const file of preview.preview.files) {
    lines.push(`- ${file}`);
  }

  lines.push(...formatNextCommands(preview.relativeSpecDir));
  lines.push('No files will be written in dry-run mode.');
  return `${lines.join('\n')}\n`;
}

function formatSpecCreateResult(result, repoRoot) {
  const relativeSpecDir = toRelativePosix(repoRoot, result.specDir);
  const lines = [
    'Quiver spec created',
    `Spec slug: ${result.manifest.slug}`,
    `Target: ${relativeSpecDir}`,
    `Files written: ${result.files.length}`,
  ];

  for (const filePath of result.files) {
    lines.push(`- ${toRelativePosix(repoRoot, filePath)}`);
  }

  lines.push(...formatNextCommands(relativeSpecDir));
  return `${lines.join('\n')}\n`;
}

function runCreateSpec(repoRoot, options = {}) {
  const preview = buildSpecCreatePreview(repoRoot, options);

  if (options.dryRun) {
    process.stdout.write(formatSpecCreateDryRun(preview));
    return {
      task: 'spec-create',
      dryRun: true,
      manifest: preview.manifest,
      specDir: preview.relativeSpecDir,
      files: preview.preview.files,
    };
  }

  const result = generateSpecArtifacts(repoRoot, {
    input: preview.inputPath,
    specSlug: options.specSlug,
  });
  process.stdout.write(formatSpecCreateResult(result, repoRoot));

  return {
    task: 'spec-create',
    dryRun: false,
    specSlug: result.manifest.slug,
    specDir: toRelativePosix(repoRoot, result.specDir),
    files: result.files.map((filePath) => toRelativePosix(repoRoot, filePath)),
    manifest: result.manifest,
  };
}

module.exports = {
  buildSpecCreatePreview,
  formatSpecCreateDryRun,
  formatSpecCreateResult,
  runCreateSpec,
};
