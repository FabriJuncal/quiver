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
    throw new Error(options.missingCommandMessage || 'create-quiver: evidence run requires a command after --');
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
  redactSecrets,
  renderEvidenceMarkdown,
  runEvidenceCommand,
  truncateText,
};
