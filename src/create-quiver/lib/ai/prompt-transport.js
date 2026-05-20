const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function normalizePrompt(prompt) {
  return String(prompt ?? '');
}

function createStdinPromptTransport(prompt) {
  return {
    mode: 'stdin',
    prompt: normalizePrompt(prompt),
  };
}

function createTempFilePromptTransport(prompt, options = {}) {
  const tempRoot = options.tempRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-prompt-'));
  const ownsTempRoot = !options.tempRoot;
  const tempFileName = options.tempFileName || 'prompt.txt';
  const filePath = path.join(tempRoot, tempFileName);
  const contents = normalizePrompt(prompt);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');

  return {
    mode: 'temp-file',
    filePath,
    tempRoot,
    promptLength: Buffer.byteLength(contents, 'utf8'),
    cleanup() {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      if (ownsTempRoot && fs.existsSync(tempRoot)) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  };
}

function preparePromptTransport(prompt, options = {}) {
  const mode = options.mode || 'stdin';
  if (mode === 'temp-file') {
    return createTempFilePromptTransport(prompt, options);
  }
  return createStdinPromptTransport(prompt);
}

function describePromptTransport(transport) {
  if (!transport) {
    return { mode: 'unknown' };
  }

  if (transport.mode === 'temp-file') {
    return {
      mode: transport.mode,
      filePath: transport.filePath,
      promptLength: transport.promptLength,
    };
  }

  return {
    mode: transport.mode || 'stdin',
    promptLength: Buffer.byteLength(String(transport.prompt ?? ''), 'utf8'),
  };
}

function finalizePromptTransport(transport) {
  if (transport && typeof transport.cleanup === 'function') {
    transport.cleanup();
  }
}

module.exports = {
  createStdinPromptTransport,
  createTempFilePromptTransport,
  describePromptTransport,
  finalizePromptTransport,
  preparePromptTransport,
};
