const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runExecutePlan } = require('../../src/create-quiver/commands/ai');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function slice(sliceId, files, extra = {}) {
  return {
    slice_id: sliceId,
    ticket: extra.ticket || 'QUIVER-01',
    type: extra.type || 'feature',
    title: extra.title || sliceId,
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: sliceId,
      branch_name: `feature/QUIVER-01-${sliceId}`,
    },
    files,
    status: extra.status || 'draft',
    acceptance: [`Acceptance for ${sliceId}`],
    tests: [],
    ...(extra.depends_on !== undefined ? { depends_on: extra.depends_on } : {}),
  };
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-execute-plan-'));
  writeJson(path.join(root, 'specs/demo/slices/slice-00-spec-foundation/slice.json'), slice('slice-00-spec-foundation', ['docs/foundation.md'], {
    status: 'completed',
    type: 'docs',
  }));
  writeJson(path.join(root, 'specs/demo/slices/slice-01-alpha/slice.json'), slice('slice-01-alpha', ['src/alpha.js'], {
    depends_on: [],
  }));
  writeJson(path.join(root, 'specs/demo/slices/slice-02-beta/slice.json'), slice('slice-02-beta', ['src/beta.js'], {
    depends_on: [],
  }));

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('ai execute-plan CLI dry-run prints commands without calling providers', () => {
  const project = makeProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-plan', '--dry-run', '--commit'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('AI execute-plan dry-run'));
    assert.ok(output.includes('Wave 0: parallel-ready'));
    assert.ok(output.includes('npx create-quiver ai execute-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --provider codex --commit'));
  } finally {
    project.cleanup();
  }
});

test('runExecutePlan executes slices with commit enabled and stops on failure', async () => {
  const project = makeProject();
  const calls = [];
  try {
    await assert.rejects(
      runExecutePlan(project.root, {
        commit: true,
        execute: true,
        provider: 'codex',
        runExecuteSliceFn: async (repoRoot, options) => {
          calls.push(options);
          assert.equal(repoRoot, project.root);
          assert.equal(options.commit, true);
          if (options.slice.includes('slice-02-beta')) {
            const error = new Error('provider failed');
            error.code = 'PROVIDER_FAILED';
            throw error;
          }
          return { ok: true };
        },
      }),
      (error) => error.code === 'PROVIDER_FAILED'
        && error.message.includes('ai execute-plan stopped')
        && error.message.includes('demo/slice-02-beta'),
    );

    assert.deepEqual(calls.map((call) => call.slice), [
      'specs/demo/slices/slice-01-alpha/slice.json',
      'specs/demo/slices/slice-02-beta/slice.json',
    ]);
  } finally {
    project.cleanup();
  }
});

test('runExecutePlan requires --commit for real execution', async () => {
  const project = makeProject();
  try {
    await assert.rejects(
      runExecutePlan(project.root, {
        execute: true,
        runExecuteSliceFn: async () => {
          throw new Error('should not run');
        },
      }),
      /requires --commit/,
    );
  } finally {
    project.cleanup();
  }
});
