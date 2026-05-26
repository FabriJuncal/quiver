const os = require('os');
const { spawnSync } = require('child_process');

function splitEditorCommand(value) {
  const input = String(value || '').trim();
  if (!input) return null;
  const parts = [];
  let current = '';
  let quote = null;
  let escaping = false;

  for (const char of input) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === '\\') {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }

  if (current) parts.push(current);
  return parts.length > 0 ? { command: parts[0], args: parts.slice(1) } : null;
}

function defaultEditorForPlatform(platform = os.platform()) {
  return platform === 'win32' ? 'notepad' : 'vi';
}

function resolveEditor(env = process.env, options = {}) {
  const candidates = [
    { source: 'VISUAL', value: env.VISUAL },
    { source: 'EDITOR', value: env.EDITOR },
    ...((options.fallbacks || [defaultEditorForPlatform(options.platform)]).map((value) => ({
      source: 'fallback',
      value,
    }))),
  ];

  for (const candidate of candidates) {
    const parsed = splitEditorCommand(candidate.value);
    if (parsed) {
      return { ...parsed, source: candidate.source };
    }
  }

  return null;
}

function openEditor(filePath, options = {}) {
  const editor = options.editor || resolveEditor(options.env || process.env, options);
  if (!editor) {
    return {
      ok: false,
      canceled: true,
      filePath,
      reason: 'No editor configured. Set VISUAL or EDITOR, then rerun the command.',
    };
  }

  const runner = options.spawnSync || spawnSync;
  const result = runner(editor.command, [...editor.args, filePath], {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    shell: false,
    stdio: options.stdio || 'inherit',
  });

  if (result.error) {
    return {
      ok: false,
      canceled: true,
      command: editor.command,
      filePath,
      reason: result.error.message,
      source: editor.source,
    };
  }

  const status = result.status ?? 0;
  return {
    ok: status === 0,
    canceled: status !== 0,
    command: editor.command,
    exitCode: status,
    filePath,
    source: editor.source,
  };
}

module.exports = {
  defaultEditorForPlatform,
  openEditor,
  resolveEditor,
  splitEditorCommand,
};
