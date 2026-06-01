const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');

const DEFAULT_OUTPUT_LIMIT = 4000;

function redactSecrets(text) {
  return String(text || '')
    .replace(/(authorization:\s*bearer\s+)[^\s`'"]+/gi, '$1[REDACTED]')
    .replace(/\b((?:api[_-]?key|token|secret|password|passwd|pwd)[A-Z0-9_-]*\s*[:=]\s*)[^\s`'"]+/gi, '$1[REDACTED]')
    .replace(/\b(npm_[A-Za-z0-9]{20,})\b/g, '[REDACTED_NPM_TOKEN]');
}

function truncateText(text, maxLength = DEFAULT_OUTPUT_LIMIT) {
  const value = String(text || '');
  if (value.length <= maxLength) {
    return {
      text: value,
      truncated: false,
    };
  }

  return {
    text: `${value.slice(0, maxLength)}\n[... truncated ${value.length - maxLength} chars ...]`,
    truncated: true,
  };
}

function quoteCommandPart(value) {
  const part = String(value || '');
  return /\s/.test(part) ? JSON.stringify(part) : part;
}

function formatCommand(commandArgs) {
  return commandArgs.map(quoteCommandPart).join(' ');
}

function defaultEvidencePath(repoRoot, startedAt = new Date()) {
  const stamp = startedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return path.join(repoRoot, '.quiver', 'evidence', `evidence-${stamp}.md`);
}

function evidenceRoot(repoRoot) {
  return path.join(repoRoot, '.quiver', 'evidence');
}

function toPosixRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function listEvidenceArtifacts(repoRoot) {
  const root = evidenceRoot(repoRoot);
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];
  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const stats = fs.statSync(fullPath);
        files.push({
          path: toPosixRelative(repoRoot, fullPath),
          size: stats.size,
          mtimeMs: stats.mtimeMs,
          updatedAt: stats.mtime.toISOString(),
        });
      }
    }
  };

  walk(root);
  return files.sort((left, right) => {
    if (right.mtimeMs !== left.mtimeMs) {
      return right.mtimeMs - left.mtimeMs;
    }
    return left.path.localeCompare(right.path);
  });
}

function resolveEvidenceArtifact(repoRoot, inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('missing evidence path');
  }

  const root = evidenceRoot(repoRoot);
  const candidate = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(repoRoot, inputPath);

  if (!fs.existsSync(candidate)) {
    throw new Error(`evidence artifact not found: ${inputPath}`);
  }

  const rootReal = fs.realpathSync.native(root);
  const realCandidate = fs.realpathSync.native(candidate);
  const relative = path.relative(rootReal, realCandidate);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('evidence path must stay inside .quiver/evidence');
  }

  const stats = fs.statSync(realCandidate);
  if (!stats.isFile()) {
    throw new Error('evidence path must be a file');
  }
  if (path.extname(realCandidate) !== '.md') {
    throw new Error('evidence path must be a Markdown file');
  }

  return {
    absolutePath: realCandidate,
    relativePath: toPosixRelative(fs.realpathSync.native(repoRoot), realCandidate),
    size: stats.size,
    updatedAt: stats.mtime.toISOString(),
  };
}

function readEvidenceArtifact(repoRoot, inputPath) {
  const artifact = resolveEvidenceArtifact(repoRoot, inputPath);
  return {
    ...artifact,
    content: fs.readFileSync(artifact.absolutePath, 'utf8'),
  };
}

function renderEvidenceMarkdown(record) {
  return `# Quiver Evidence

- Command: \`${record.command}\`
- Exit code: ${record.exit_code}
- Duration ms: ${record.duration_ms}
- Started at: ${record.started_at}
- Finished at: ${record.finished_at}
- Output truncated: ${record.output_truncated ? 'yes' : 'no'}

## Stdout

\`\`\`\`text
${record.stdout || ''}
\`\`\`\`

## Stderr

\`\`\`\`text
${record.stderr || ''}
\`\`\`\`
`;
}

function runEvidenceCommand(repoRoot, commandArgs, options = {}) {
  if (!Array.isArray(commandArgs) || commandArgs.length === 0) {
    throw new Error('create-quiver: evidence run requires a command after --');
  }

  const startedAtDate = new Date();
  const started = Date.now();
  const result = (options.spawnSync || spawnSync)(commandArgs[0], commandArgs.slice(1), {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });
  const finishedAtDate = new Date();
  const duration = Date.now() - started;
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const stdout = truncateText(redactSecrets(result.stdout || ''), options.maxOutput || DEFAULT_OUTPUT_LIMIT);
  const stderr = truncateText(redactSecrets(result.stderr || result.error?.message || ''), options.maxOutput || DEFAULT_OUTPUT_LIMIT);
  const record = {
    command: redactSecrets(formatCommand(commandArgs)),
    duration_ms: duration,
    exit_code: exitCode,
    finished_at: finishedAtDate.toISOString(),
    output_truncated: stdout.truncated || stderr.truncated,
    stderr: stderr.text,
    stdout: stdout.text,
    started_at: startedAtDate.toISOString(),
  };
  const outputPath = options.outputPath
    ? path.resolve(repoRoot, options.outputPath)
    : defaultEvidencePath(repoRoot, startedAtDate);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderEvidenceMarkdown(record));

  return {
    exitCode,
    outputPath,
    record,
  };
}

module.exports = {
  DEFAULT_OUTPUT_LIMIT,
  defaultEvidencePath,
  evidenceRoot,
  listEvidenceArtifacts,
  redactSecrets,
  readEvidenceArtifact,
  renderEvidenceMarkdown,
  resolveEvidenceArtifact,
  runEvidenceCommand,
  truncateText,
};
