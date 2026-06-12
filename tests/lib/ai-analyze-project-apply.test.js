const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  AnalyzeProjectApplyError,
  assertAnalyzeProjectApplyPreflight,
} = require('../../src/create-quiver/lib/ai/analyze-project-apply');

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-apply-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('assertAnalyzeProjectApplyPreflight blocks dirty target docs without override', () => {
  const repo = makeRepo({
    'docs/CONTEXTO.md': '# Existing human docs\n',
  });

  try {
    assert.throws(
      () => assertAnalyzeProjectApplyPreflight([{
        path: 'docs/CONTEXTO.md',
        destinationPath: path.join(repo.root, 'docs/CONTEXTO.md'),
        action: 'update',
        dirty: true,
      }], {
        doc_before_hashes: {
          'docs/CONTEXTO.md': 'unused-hash',
        },
      }),
      (error) => {
        assert.ok(error instanceof AnalyzeProjectApplyError);
        assert.equal(error.issues[0].issue, 'dirty-target-doc');
        return true;
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override', () => {
  const repo = makeRepo({
    'docs/CONTEXTO.md': '# Changed after proposal\n',
  });

  try {
    assert.throws(
      () => assertAnalyzeProjectApplyPreflight([{
        path: 'docs/CONTEXTO.md',
        destinationPath: path.join(repo.root, 'docs/CONTEXTO.md'),
        action: 'update',
        dirty: true,
      }], {
        doc_before_hashes: {
          'docs/CONTEXTO.md': 'hash-from-old-proposal',
        },
      }, {
        allowDirtyDocs: true,
      }),
      (error) => {
        assert.ok(error instanceof AnalyzeProjectApplyError);
        assert.equal(error.issues[0].issue, 'stale-target-doc');
        assert.equal(error.issues[0].expected_sha256, 'hash-from-old-proposal');
        assert.equal(typeof error.issues[0].current_sha256, 'string');
        return true;
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target', () => {
  const repo = makeRepo();

  try {
    const result = assertAnalyzeProjectApplyPreflight([{
      path: 'docs/CONTEXTO.md',
      destinationPath: path.join(repo.root, 'docs/CONTEXTO.md'),
      action: 'create',
      dirty: false,
    }], {
      doc_before_hashes: {
        'docs/CONTEXTO.md': null,
      },
    });

    assert.equal(result.ok, true);
  } finally {
    repo.cleanup();
  }
});
