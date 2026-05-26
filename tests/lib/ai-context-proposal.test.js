const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ContextProposalError,
  classifyDisallowedContextPath,
  getAllowedContextProposalPaths,
  normalizeContextProposal,
  parseContextProposalOutput,
  validateContextProposalPath,
  writeInvalidContextProposalArtifact,
} = require('../../src/create-quiver/lib/ai/context-proposal');

const FIXTURES = path.join(__dirname, '..', 'fixtures', 'ai-context-proposals');

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

test('valid planner context proposal parses into a normalized docs-only write plan', () => {
  const proposal = parseContextProposalOutput(readFixture('valid.json'));

  assert.equal(proposal.schemaVersion, 1);
  assert.equal(proposal.kind, 'quiver-context-proposal');
  assert.equal(proposal.parseSource, 'raw-json');
  assert.deepEqual(proposal.docs.map((doc) => doc.path), [
    'docs/AI_CONTEXT.md',
    'docs/STATUS.md',
  ]);
  assert.deepEqual(proposal.writePlan.map((doc) => doc.path), [
    'docs/AI_CONTEXT.md',
    'docs/STATUS.md',
  ]);
  assert.equal(proposal.docs[0].source, 'planner-proposal');
  assert.equal(proposal.assumptions.length, 1);
  assert.equal(proposal.risks.length, 1);
});

test('fenced JSON planner output is accepted when schema and paths are safe', () => {
  const proposal = parseContextProposalOutput(readFixture('fenced-valid.txt'));

  assert.equal(proposal.parseSource, 'fenced-json');
  assert.equal(proposal.docs[0].path, 'docs/PROJECT_MAP.md');
});

test('legacy files alias is normalized to docs for planner proposals', () => {
  const proposal = normalizeContextProposal({
    schemaVersion: 1,
    summary: 'Alias shape',
    files: [
      {
        path: 'docs/WORKFLOW.md',
        content: '# Workflow\n',
      },
    ],
  });

  assert.equal(proposal.docs[0].path, 'docs/WORKFLOW.md');
  assert.equal(proposal.nextSteps.length, 0);
});

test('planner proposal rejects product code, dependency files, and unapproved docs', () => {
  assert.throws(
    () => parseContextProposalOutput(readFixture('product-code.json')),
    (error) => {
      assert.equal(error instanceof ContextProposalError, true);
      assert.equal(error.issues[0].issue, 'product-code');
      assert.match(error.issues[0].message, /Allowed paths:/);
      return true;
    },
  );

  assert.equal(classifyDisallowedContextPath('package-lock.json'), 'dependency-or-lockfile');
  assert.equal(classifyDisallowedContextPath('docs/RANDOM.md'), 'unapproved-context-doc');
});

test('planner proposal rejects absolute and traversal paths before writes', () => {
  assert.throws(
    () => parseContextProposalOutput(readFixture('absolute-path.json')),
    (error) => {
      assert.equal(error.issues[0].issue, 'absolute-path');
      return true;
    },
  );

  assert.throws(
    () => parseContextProposalOutput(readFixture('traversal.json')),
    (error) => {
      assert.equal(error.issues[0].issue, 'path-traversal');
      return true;
    },
  );
});

test('invalid schema, duplicate paths, empty content, and malformed output are actionable', () => {
  assert.throws(
    () => parseContextProposalOutput(readFixture('malformed.txt')),
    (error) => {
      assert.equal(error.code, 'AI_CONTEXT_PROPOSAL_INVALID');
      assert.equal(error.issues[0].issue, 'malformed-json');
      assert.ok(error.safeNextSteps.some((step) => step.includes('--print-prompt')));
      return true;
    },
  );

  assert.throws(
    () => normalizeContextProposal({ docs: [] }),
    /does not match the required schema/,
  );

  assert.throws(
    () => normalizeContextProposal({
      docs: [
        { path: 'docs/AI_CONTEXT.md', content: '# One\n' },
        { path: 'docs/AI_CONTEXT.md', content: '# Two\n' },
      ],
    }),
    (error) => {
      assert.equal(error.issues[0].issue, 'duplicate-path');
      return true;
    },
  );

  assert.throws(
    () => normalizeContextProposal({
      docs: [
        { path: 'docs/AI_CONTEXT.md', action: 'update', content: '' },
      ],
    }),
    (error) => {
      assert.equal(error.issues[0].issue, 'missing-content');
      return true;
    },
  );
});

test('context proposal path allowlist is explicit and validates safe paths', () => {
  assert.deepEqual(getAllowedContextProposalPaths(), [
    'docs/INDEX.md',
    'docs/PROJECT_MAP.md',
    'docs/AI_CONTEXT.md',
    'docs/AI_ONBOARDING_PROMPT.md',
    'docs/CONTEXTO.md',
    'docs/WORKFLOW.md',
    'docs/ARCHITECTURE.md',
    'docs/STATUS.md',
    'docs/DECISIONS.md',
  ]);

  assert.deepEqual(validateContextProposalPath('docs/AI_CONTEXT.md'), {
    ok: true,
    path: 'docs/AI_CONTEXT.md',
  });
  assert.equal(validateContextProposalPath('src/app.js').issue, 'product-code');
});

test('invalid planner proposal artifacts are redacted and stored under the run raw directory', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-context-proposal-'));
  const error = new ContextProposalError('planner context proposal contains unsafe writes', [
    { path: 'src/app.js', issue: 'product-code', message: 'blocked' },
  ]);
  const result = writeInvalidContextProposalArtifact(
    projectRoot,
    'run-1',
    `token=${'a'.repeat(24)}\n${projectRoot}/docs/AI_CONTEXT.md`,
    error,
    { now: new Date('2026-05-26T12:00:00.000Z') },
  );

  assert.equal(result.path, '.quiver/runs/run-1/raw/2026-05-26t12-00-00z-invalid-context-proposal.json');
  assert.equal(result.artifact.kind, 'invalid-context-proposal');
  assert.match(result.artifact.raw_output, /token=\[REDACTED\]/);
  assert.match(result.artifact.raw_output, /\[PROJECT_ROOT\]\/docs\/AI_CONTEXT\.md/);
  assert.equal(fs.existsSync(result.filePath), true);
});
