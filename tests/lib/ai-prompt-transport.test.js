const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  createStdinPromptTransport,
  createTempFilePromptTransport,
  describePromptTransport,
  finalizePromptTransport,
  preparePromptTransport,
} = require('../../src/create-quiver/lib/ai/prompt-transport');

test('preparePromptTransport defaults to stdin and preserves the prompt text', () => {
  const transport = preparePromptTransport('hello\nworld');
  assert.equal(transport.mode, 'stdin');
  assert.equal(transport.prompt, 'hello\nworld');
  assert.deepEqual(describePromptTransport(transport), {
    mode: 'stdin',
    promptLength: Buffer.byteLength('hello\nworld', 'utf8'),
  });
});

test('createTempFilePromptTransport writes a prompt file in a path that may contain spaces', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver ai transport '));
  const transport = createTempFilePromptTransport('prompt content', {
    tempRoot,
    tempFileName: 'prompt file.txt',
  });

  try {
    assert.equal(transport.mode, 'temp-file');
    assert.ok(fs.existsSync(transport.filePath));
    assert.equal(fs.readFileSync(transport.filePath, 'utf8'), 'prompt content');
    assert.ok(transport.filePath.includes('prompt file.txt'));
    assert.deepEqual(describePromptTransport(transport), {
      mode: 'temp-file',
      filePath: transport.filePath,
      promptLength: Buffer.byteLength('prompt content', 'utf8'),
    });
  } finally {
    finalizePromptTransport(transport);
    if (fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test('createStdinPromptTransport is a lightweight wrapper', () => {
  const transport = createStdinPromptTransport('abc');
  assert.deepEqual(transport, { mode: 'stdin', prompt: 'abc' });
  assert.deepEqual(describePromptTransport(transport), {
    mode: 'stdin',
    promptLength: 3,
  });
});
