const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runExecuteSlice } = require('../../src/create-quiver/commands/ai');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function createProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-execute-cli-'));
  const sliceDir = path.join(root, 'specs/demo/slices/slice-01-demo');
  const sliceJson = {
    slice_id: 'slice-01-demo',
    ticket: 'QUIVER-01',
    type: 'feature',
    title: 'Demo slice',
    objective: 'Implement demo behavior.',
    description: 'Demo executor fixture.',
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: 'demo',
      branch_name: 'feature/QUIVER-01-demo',
    },
    files: ['src/app.js'],
    acceptance: ['Allowed file is changed.'],
    tests: ['node --test tests/demo.test.js'],
    status: 'draft',
  };

  writeFile(path.join(sliceDir, 'slice.json'), `${JSON.stringify(sliceJson, null, 2)}\n`);
  writeFile(path.join(sliceDir, 'EXECUTION_BRIEF.md'), '# Execution Brief\n\nChange the allowed file only.\n');
  writeFile(path.join(root, 'src/app.js'), 'module.exports = 1;\n');

  return {
    root,
    slicePath: 'specs/demo/slices/slice-01-demo/slice.json',
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('ai execute-slice CLI dry-run prints executor context and does not call provider', () => {
  const project = createProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-slice', '--slice', project.slicePath, '--dry-run'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('AI execute-slice dry-run'));
    assert.ok(output.includes('Role: executor'));
    assert.ok(output.includes('Context pack: slice'));
    assert.ok(output.includes('Slice: slice-01-demo'));
    assert.ok(output.includes('Commit after validation: disabled'));
    assert.ok(output.includes('src/app.js'));
  } finally {
    project.cleanup();
  }
});

test('ai execute-slice CLI dry-run shows opt-in commit mode', () => {
  const project = createProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-slice', '--slice', project.slicePath, '--dry-run', '--commit'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('AI execute-slice dry-run'));
    assert.ok(output.includes('Commit after validation: enabled'));
  } finally {
    project.cleanup();
  }
});

test('ai execute-slice requires --slice', async () => {
  await assert.rejects(
    runExecuteSlice('/tmp/quiver-project', {
      dryRun: true,
      provider: 'codex',
    }),
    /missing required --slice path/,
  );
});
