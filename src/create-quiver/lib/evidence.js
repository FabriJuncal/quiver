const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');

const DEFAULT_OUTPUT_LIMIT = 4000;
const SIGNAL_NUMBERS = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGQUIT: 3,
  SIGILL: 4,
  SIGTRAP: 5,
  SIGABRT: 6,
  SIGBUS: 7,
  SIGFPE: 8,
  SIGKILL: 9,
  SIGUSR1: 10,
  SIGSEGV: 11,
  SIGUSR2: 12,
  SIGPIPE: 13,
  SIGALRM: 14,
  SIGTERM: 15,
};

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

function isPathInside(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function realpathExistingAncestor(targetPath) {
  let current = targetPath;
  while (!fs.existsSync(current)) {
    const next = path.dirname(current);
    if (next === current) {
      return fs.realpathSync(current);
    }
    current = next;
  }
  return fs.realpathSync(current);
}

function assertSafeProjectPath(repoRoot, targetPath, label = 'evidence path') {
  const rootPath = path.resolve(repoRoot);
  const rootReal = fs.realpathSync(rootPath);
  const resolved = path.resolve(rootPath, targetPath);
  const ancestorReal = realpathExistingAncestor(resolved);
  const pathLooksInsideRoot = isPathInside(rootPath, resolved) || isPathInside(rootReal, resolved);

  if (!pathLooksInsideRoot || !isPathInside(rootReal, ancestorReal)) {
    throw new Error(`create-quiver: ${label} must stay inside the project root.`);
  }

  return resolved;
}

function resolveEvidenceOutputPath(repoRoot, outputPath, startedAtDate = new Date()) {
  const resolved = outputPath
    ? assertSafeProjectPath(repoRoot, outputPath, 'evidence output path')
    : defaultEvidencePath(repoRoot, startedAtDate);
  const directory = path.dirname(resolved);

  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) {
    throw new Error('create-quiver: evidence output path cannot be a symlink.');
  }

  fs.mkdirSync(directory, { recursive: true });
  const rootReal = fs.realpathSync(repoRoot);
  const directoryReal = fs.realpathSync(directory);
  if (!isPathInside(rootReal, directoryReal)) {
    throw new Error('create-quiver: evidence output path must stay inside the project root.');
  }

  return resolved;
}

function resolveEvidenceReadPath(repoRoot, evidencePath) {
  if (!evidencePath) {
    throw new Error('create-quiver: evidence show requires an evidence file path.');
  }

  const resolved = assertSafeProjectPath(repoRoot, evidencePath, 'evidence read path');
  if (!fs.existsSync(resolved)) {
    throw new Error(`create-quiver: evidence file not found: ${evidencePath}`);
  }

  const rootReal = fs.realpathSync(repoRoot);
  const fileReal = fs.realpathSync(resolved);
  if (!isPathInside(rootReal, fileReal)) {
    throw new Error('create-quiver: evidence read path must stay inside the project root.');
  }

  return resolved;
}

function signalExitCode(signal) {
  if (!signal) {
    return null;
  }
  return 128 + (SIGNAL_NUMBERS[signal] || 0) || 1;
}

function renderEvidenceMarkdown(record) {
  return `# Quiver Evidence

- Command: \`${record.command}\`
- Exit code: ${record.exit_code}
- Duration ms: ${record.duration_ms}
- Started at: ${record.started_at}
- Finished at: ${record.finished_at}
- Signal: ${record.signal || '-'}
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
    throw new Error(options.missingCommandMessage || 'create-quiver: evidence run requires a command after --');
  }

  const startedAtDate = new Date();
  const outputPath = resolveEvidenceOutputPath(repoRoot, options.outputPath, startedAtDate);
  const started = Date.now();
  const result = (options.spawnSync || spawnSync)(commandArgs[0], commandArgs.slice(1), {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });
  const finishedAtDate = new Date();
  const duration = Date.now() - started;
  const signal = result.signal || '';
  const exitCode = typeof result.status === 'number' ? result.status : (signalExitCode(signal) || 1);
  const stdout = truncateText(redactSecrets(result.stdout || ''), options.maxOutput || DEFAULT_OUTPUT_LIMIT);
  const stderr = truncateText(redactSecrets(result.stderr || result.error?.message || ''), options.maxOutput || DEFAULT_OUTPUT_LIMIT);
  const record = {
    command: redactSecrets(formatCommand(commandArgs)),
    duration_ms: duration,
    exit_code: exitCode,
    finished_at: finishedAtDate.toISOString(),
    output_truncated: stdout.truncated || stderr.truncated,
    signal,
    stderr: stderr.text,
    stdout: stdout.text,
    started_at: startedAtDate.toISOString(),
  };

  fs.writeFileSync(outputPath, renderEvidenceMarkdown(record));

  return {
    exitCode,
    outputPath,
    record,
  };
}

function parseEvidenceMarkdown(content) {
  const text = String(content || '');
  const field = (label) => {
    const match = text.match(new RegExp(`^- ${label}: (.*)$`, 'm'));
    return match ? match[1].trim() : '';
  };
  const rawExitCode = field('Exit code');
  const rawDuration = field('Duration ms');

  return {
    command: field('Command').replace(/^`|`$/g, ''),
    duration_ms: Number.isFinite(Number(rawDuration)) ? Number(rawDuration) : null,
    exit_code: Number.isFinite(Number(rawExitCode)) ? Number(rawExitCode) : null,
    finished_at: field('Finished at'),
    output_truncated: field('Output truncated') === 'yes',
    signal: field('Signal') === '-' ? '' : field('Signal'),
    started_at: field('Started at'),
  };
}

function listEvidenceFiles(repoRoot) {
  const evidenceDir = path.join(repoRoot, '.quiver', 'evidence');
  if (!fs.existsSync(evidenceDir)) {
    return [];
  }

  const rootReal = fs.realpathSync(repoRoot);
  const dirReal = fs.realpathSync(evidenceDir);
  if (!isPathInside(rootReal, dirReal)) {
    throw new Error('create-quiver: evidence directory must stay inside the project root.');
  }

  return fs.readdirSync(evidenceDir)
    .filter((entry) => entry.endsWith('.md'))
    .sort()
    .map((entry) => {
      const filePath = path.join(evidenceDir, entry);
      const content = fs.readFileSync(resolveEvidenceReadPath(repoRoot, filePath), 'utf8');
      return {
        path: path.relative(repoRoot, filePath).split(path.sep).join('/'),
        ...parseEvidenceMarkdown(content),
      };
    });
}

function showEvidenceFile(repoRoot, evidencePath) {
  const resolved = resolveEvidenceReadPath(repoRoot, evidencePath);
  const content = fs.readFileSync(resolved, 'utf8');
  return {
    content,
    path: path.relative(repoRoot, resolved).split(path.sep).join('/'),
    record: parseEvidenceMarkdown(content),
  };
}

module.exports = {
  DEFAULT_OUTPUT_LIMIT,
  defaultEvidencePath,
  listEvidenceFiles,
  parseEvidenceMarkdown,
  redactSecrets,
  renderEvidenceMarkdown,
  resolveEvidenceOutputPath,
  resolveEvidenceReadPath,
  runEvidenceCommand,
  showEvidenceFile,
  signalExitCode,
  truncateText,
};
