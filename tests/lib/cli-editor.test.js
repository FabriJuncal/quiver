const assert = require('node:assert/strict');
const test = require('node:test');

const {
  defaultEditorForPlatform,
  openEditor,
  resolveEditor,
  splitEditorCommand,
} = require('../../src/create-quiver/lib/cli/editor');

test('splitEditorCommand handles quoted commands and arguments', () => {
  assert.deepEqual(splitEditorCommand('"Visual Studio Code" --wait'), {
    command: 'Visual Studio Code',
    args: ['--wait'],
  });
  assert.deepEqual(splitEditorCommand("'vim' -n"), {
    command: 'vim',
    args: ['-n'],
  });
});

test('resolveEditor prefers VISUAL over EDITOR and keeps arguments', () => {
  assert.deepEqual(resolveEditor({
    VISUAL: 'code --wait',
    EDITOR: 'vim',
  }), {
    command: 'code',
    args: ['--wait'],
    source: 'VISUAL',
  });
});

test('resolveEditor falls back to platform editor when env is empty', () => {
  assert.deepEqual(resolveEditor({}, { platform: 'win32' }), {
    command: 'notepad',
    args: [],
    source: 'fallback',
  });
  assert.deepEqual(resolveEditor({}, { platform: 'darwin', fallbacks: ['nano'] }), {
    command: 'nano',
    args: [],
    source: 'fallback',
  });
});

test('defaultEditorForPlatform uses notepad on Windows and vi elsewhere', () => {
  assert.equal(defaultEditorForPlatform('win32'), 'notepad');
  assert.equal(defaultEditorForPlatform('linux'), 'vi');
  assert.equal(defaultEditorForPlatform('darwin'), 'vi');
});

test('openEditor invokes the resolved editor without a shell', () => {
  const calls = [];
  const result = openEditor('/tmp/proposal.md', {
    env: { VISUAL: 'code --wait' },
    cwd: '/repo',
    spawnSync(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0 };
    },
    stdio: 'pipe',
  });

  assert.equal(result.ok, true);
  assert.equal(result.canceled, false);
  assert.deepEqual(calls, [
    {
      command: 'code',
      args: ['--wait', '/tmp/proposal.md'],
      options: {
        cwd: '/repo',
        env: { VISUAL: 'code --wait' },
        shell: false,
        stdio: 'pipe',
      },
    },
  ]);
});

test('openEditor reports cancellation for missing or failed editor execution', () => {
  assert.deepEqual(openEditor('/tmp/proposal.md', {
    env: {},
    fallbacks: [],
  }), {
    ok: false,
    canceled: true,
    filePath: '/tmp/proposal.md',
    reason: 'No editor configured. Set VISUAL or EDITOR, then rerun the command.',
  });

  const failed = openEditor('/tmp/proposal.md', {
    editor: { command: 'vim', args: [], source: 'EDITOR' },
    spawnSync() {
      return { status: 1 };
    },
    stdio: 'pipe',
  });

  assert.equal(failed.ok, false);
  assert.equal(failed.canceled, true);
  assert.equal(failed.command, 'vim');
  assert.equal(failed.exitCode, 1);
  assert.equal(failed.source, 'EDITOR');
});
