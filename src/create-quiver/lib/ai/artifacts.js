const fs = require('node:fs');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');

const { redactSecrets } = require('../evidence');
const { quiverInternalPaths } = require('../init-layout');

const RAW_ARTIFACT_SCHEMA_VERSION = 1;
const DEFAULT_MAX_PROVIDER_PROMPT_BYTES = 1024 * 1024;
const DEFAULT_MAX_RAW_PROVIDER_STREAM_BYTES = 64 * 1024;
const DEFAULT_MAX_REVISION_INPUT_BYTES = 400 * 1024;
const DEFAULT_COMPACTED_REVISION_INPUT_BYTES = 120 * 1024;

const IMPORTANT_REVISION_LINE = /\b(acceptance|criteri[ao]s?|decision|decisi[o\u00f3]n|risk|riesgo|file|archivo|changed|cambio|scope|alcance|validation|validaci[o\u00f3]n|test|blocker|bloque|dependency|dependencia|assumption|supuesto|pending|pendiente|error|rollback|evidence|evidencia)\b/i;
const PROVIDER_LOG_LINE = /^\s*(?:\[?(?:debug|info|notice|trace|warn|warning)\]?[:\s-]|(?:codex|claude|gemini)\b.*(?:provider|model|prompt|token|running|loading|thinking)|(?:using|loading)\s+(?:model|provider)\b|prompt\s+(?:length|transport)\s*:)/i;

function formatError(message) {
  return `create-quiver: ${message}`;
}

function byteLength(value) {
  return Buffer.byteLength(String(value || ''), 'utf8');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u001b\[[0-9;]*m/g, '');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactSensitiveLocalValues(text, options = {}) {
  let result = redactSecrets(text)
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED]')
    .replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, '[REDACTED]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, '[REDACTED]');
  const replacements = [];

  if (options.projectRoot) {
    replacements.push({
      value: path.resolve(options.projectRoot),
      label: '[PROJECT_ROOT]',
    });
  }

  if (os.homedir()) {
    replacements.push({
      value: os.homedir(),
      label: '[HOME]',
    });
  }

  for (const replacement of replacements) {
    if (!replacement.value) {
      continue;
    }
    result = result.replace(new RegExp(escapeRegExp(replacement.value), 'g'), replacement.label);
  }

  return result;
}

function normalizePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function sliceStartToByteLimit(text, maxBytes) {
  let value = String(text || '');
  while (byteLength(value) > maxBytes && value.length > 0) {
    value = value.slice(0, Math.max(0, value.length - Math.ceil((byteLength(value) - maxBytes) / 2) - 8));
  }
  return value;
}

function sliceEndToByteLimit(text, maxBytes) {
  let value = String(text || '');
  while (byteLength(value) > maxBytes && value.length > 0) {
    value = value.slice(Math.min(value.length, Math.ceil((byteLength(value) - maxBytes) / 2) + 8));
  }
  return value;
}

function limitRawProviderStream(text, options = {}) {
  const maxBytes = normalizePositiveInteger(
    options.maxBytes ?? process.env.QUIVER_AI_MAX_RAW_PROVIDER_STREAM_BYTES,
    DEFAULT_MAX_RAW_PROVIDER_STREAM_BYTES,
  );
  const value = normalizeText(text);
  const originalBytes = byteLength(value);
  const digest = sha256(value);

  if (originalBytes <= maxBytes) {
    return {
      text: value,
      metadata: {
        bytes: originalBytes,
        stored_bytes: originalBytes,
        max_bytes: maxBytes,
        truncated: false,
        sha256: digest,
      },
    };
  }

  const marker = `\n[... Quiver truncated provider stream; original_bytes=${originalBytes}; sha256=${digest} ...]\n`;
  const markerBytes = byteLength(marker);
  const contentBudget = Math.max(0, maxBytes - markerBytes);
  const headBudget = Math.floor(contentBudget * 0.6);
  const tailBudget = contentBudget - headBudget;
  const head = sliceStartToByteLimit(value, headBudget);
  const tail = sliceEndToByteLimit(value, tailBudget);
  const stored = `${head}${marker}${tail}`;

  return {
    text: stored,
    metadata: {
      bytes: originalBytes,
      stored_bytes: byteLength(stored),
      max_bytes: maxBytes,
      truncated: true,
      sha256: digest,
      head_bytes: byteLength(head),
      tail_bytes: byteLength(tail),
    },
  };
}

function resolveAiArtifactLimits(options = {}) {
  return {
    maxProviderPromptBytes: normalizePositiveInteger(
      options.maxProviderPromptBytes ?? process.env.QUIVER_AI_MAX_PROMPT_BYTES,
      DEFAULT_MAX_PROVIDER_PROMPT_BYTES,
    ),
    maxRevisionInputBytes: normalizePositiveInteger(
      options.maxRevisionInputBytes ?? process.env.QUIVER_AI_MAX_REVISION_INPUT_BYTES,
      DEFAULT_MAX_REVISION_INPUT_BYTES,
    ),
    compactedRevisionInputBytes: normalizePositiveInteger(
      options.compactedRevisionInputBytes ?? process.env.QUIVER_AI_COMPACTED_REVISION_INPUT_BYTES,
      DEFAULT_COMPACTED_REVISION_INPUT_BYTES,
    ),
  };
}

function stripPromptEcho(text, prompt) {
  const normalizedText = normalizeText(text);
  const normalizedPrompt = normalizeText(prompt).trim();

  if (!normalizedPrompt || normalizedPrompt.length < 80) {
    return normalizedText;
  }

  const directIndex = normalizedText.indexOf(normalizedPrompt);
  if (directIndex >= 0) {
    return `${normalizedText.slice(0, directIndex)}${normalizedText.slice(directIndex + normalizedPrompt.length)}`;
  }

  return normalizedText;
}

function stripProviderLogEdges(text) {
  const lines = normalizeText(text).split('\n');

  while (lines.length > 0 && (PROVIDER_LOG_LINE.test(lines[0]) || lines[0].trim() === '')) {
    lines.shift();
  }

  while (lines.length > 0 && (PROVIDER_LOG_LINE.test(lines[lines.length - 1]) || lines[lines.length - 1].trim() === '')) {
    lines.pop();
  }

  return lines.join('\n').trim();
}

function normalizeDraftOutput(text, sourceText = text) {
  const value = normalizeText(text).trim();
  if (!value) {
    return '';
  }
  return /\n\s*$/.test(String(sourceText || '')) ? `${value}\n` : value;
}

function extractCleanProviderOutput(result, options = {}) {
  const stdout = redactSensitiveLocalValues(result?.stdout || '', options);
  const stderr = redactSensitiveLocalValues(result?.stderr || '', options);
  const primary = stdout.trim() ? stdout : stderr;
  const cleaned = stripProviderLogEdges(stripPromptEcho(primary, options.prompt || ''));
  const cleanOutput = normalizeDraftOutput(cleaned, primary);

  if (cleanOutput) {
    return {
      cleanOutput,
      source: stdout.trim() ? 'stdout' : 'stderr',
      strippedPromptEcho: primary !== stripPromptEcho(primary, options.prompt || ''),
    };
  }

  return {
    cleanOutput: normalizeDraftOutput(primary || [stdout, stderr].filter(Boolean).join('\n'), primary),
    source: stdout.trim() ? 'stdout' : stderr.trim() ? 'stderr' : 'empty',
    strippedPromptEcho: false,
  };
}

function safeArtifactName(scope, now = new Date()) {
  const slug = String(scope || 'provider-output')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'provider-output';
  const stamp = now.toISOString()
    .replace(/\.\d{3}Z$/, 'z')
    .replace(/[^0-9a-z]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  return `${stamp}-${slug}.json`;
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function writeRawProviderArtifact(projectRoot, runId, scope, result, options = {}) {
  if (!runId) {
    throw new Error(formatError('missing AI run id for raw provider artifact'));
  }

  const now = options.now || new Date();
  const rawDir = path.join(quiverInternalPaths(projectRoot).runsDir, String(runId), 'raw');
  const rawPath = path.join(rawDir, safeArtifactName(scope, now));
  const serializedError = result?.error
    ? {
        code: result.error.code || null,
        message: result.error.message || String(result.error),
        provider: result.error.provider || null,
        command: result.error.command || null,
      }
    : null;
  const stdout = limitRawProviderStream(
    redactSensitiveLocalValues(result?.stdout || '', { projectRoot }),
    { maxBytes: options.maxRawProviderStreamBytes },
  );
  const stderr = limitRawProviderStream(
    redactSensitiveLocalValues(result?.stderr || '', { projectRoot }),
    { maxBytes: options.maxRawProviderStreamBytes },
  );
  const artifact = {
    schema_version: RAW_ARTIFACT_SCHEMA_VERSION,
    kind: 'provider-output',
    scope: String(scope || 'provider-output'),
    created_at: now.toISOString(),
    provider: result?.provider || null,
    command: result?.command || null,
    args: Array.isArray(result?.args) ? result.args.slice() : [],
    cwd: result?.cwd ? redactSensitiveLocalValues(result.cwd, { projectRoot }) : null,
    ok: Boolean(result?.ok),
    dry_run: Boolean(result?.dryRun),
    exit_code: typeof result?.exitCode === 'number' ? result.exitCode : null,
    signal: result?.signal || null,
    timeout_ms: typeof result?.timeoutMs === 'number' ? result.timeoutMs : null,
    prompt_transport: result?.promptTransport || null,
    stdout: stdout.text,
    stderr: stderr.text,
    streams: {
      stdout: stdout.metadata,
      stderr: stderr.metadata,
    },
    error: serializedError ? JSON.parse(redactSensitiveLocalValues(JSON.stringify(serializedError), { projectRoot })) : null,
    metadata: options.metadata || {},
  };

  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(rawPath, `${JSON.stringify(artifact, null, 2)}\n`);

  return {
    filePath: rawPath,
    path: toRelativePosix(projectRoot, rawPath),
    artifact,
  };
}

function compactTextToByteLimit(text, maxBytes) {
  let value = normalizeText(text).trim();
  if (byteLength(value) <= maxBytes) {
    return value;
  }

  while (byteLength(value) > maxBytes && value.length > 0) {
    value = value.slice(0, Math.max(0, value.length - Math.ceil((byteLength(value) - maxBytes) / 2) - 32)).trimEnd();
  }

  return value;
}

function compactRevisionInput(inputText, options = {}) {
  const limits = resolveAiArtifactLimits(options);
  const originalText = normalizeText(inputText);
  const originalBytes = byteLength(originalText);

  if (originalBytes <= limits.maxRevisionInputBytes) {
    return {
      text: originalText,
      compaction: null,
    };
  }

  const lines = originalText.split('\n');
  const selected = [];
  const seen = new Set();
  const addLine = (line) => {
    const key = line;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    selected.push(line);
  };

  lines.slice(0, 24).forEach(addLine);
  for (const line of lines) {
    if (/^\s*#{1,6}\s+/.test(line) || IMPORTANT_REVISION_LINE.test(line)) {
      addLine(line);
    }
  }
  lines.slice(-24).forEach(addLine);

  const preface = [
    `[Quiver compacted oversized revise input from ${originalBytes} bytes before provider execution.]`,
    '[Preserved headings and lines mentioning decisions, risks, files, acceptance criteria, validation, blockers, dependencies, assumptions, pending work, rollback, and evidence.]',
    '',
  ].join('\n');
  const compacted = `${preface}${selected.join('\n')}`;
  const targetBytes = Math.min(limits.compactedRevisionInputBytes, limits.maxRevisionInputBytes);
  const finalText = compactTextToByteLimit(compacted, targetBytes);
  const compactedBytes = byteLength(finalText);

  if (compactedBytes > limits.maxRevisionInputBytes) {
    const error = new Error(formatError(`ai revise input is too large after compaction (${compactedBytes} bytes; limit ${limits.maxRevisionInputBytes}). Reduce feedback size and retry.`));
    error.code = 'AI_INPUT_TOO_LARGE';
    throw error;
  }

  return {
    text: `${finalText.trimEnd()}\n`,
    compaction: {
      compacted: true,
      original_bytes: originalBytes,
      compacted_bytes: compactedBytes,
      max_revision_input_bytes: limits.maxRevisionInputBytes,
      preserved: ['headings', 'decisions', 'risks', 'files', 'acceptance criteria', 'validation', 'blockers', 'dependencies', 'assumptions', 'rollback', 'evidence'],
    },
  };
}

function assertProviderPromptWithinLimit(prompt, options = {}) {
  const limits = resolveAiArtifactLimits(options);
  const promptBytes = byteLength(prompt);

  if (promptBytes <= limits.maxProviderPromptBytes) {
    return {
      prompt,
      bytes: promptBytes,
      maxProviderPromptBytes: limits.maxProviderPromptBytes,
    };
  }

  const error = new Error(formatError(`provider prompt is too large (${promptBytes} bytes; limit ${limits.maxProviderPromptBytes}). Reduce the input, split the work, or run ai revise with focused feedback before invoking the provider.`));
  error.code = 'AI_PROMPT_TOO_LARGE';
  throw error;
}

module.exports = {
  DEFAULT_COMPACTED_REVISION_INPUT_BYTES,
  DEFAULT_MAX_PROVIDER_PROMPT_BYTES,
  DEFAULT_MAX_RAW_PROVIDER_STREAM_BYTES,
  DEFAULT_MAX_REVISION_INPUT_BYTES,
  RAW_ARTIFACT_SCHEMA_VERSION,
  assertProviderPromptWithinLimit,
  byteLength,
  compactRevisionInput,
  extractCleanProviderOutput,
  limitRawProviderStream,
  redactSensitiveLocalValues,
  resolveAiArtifactLimits,
  writeRawProviderArtifact,
};
