const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-plan-spec-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execAi(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', 'plan', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function execAiSubcommand(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function approvedPlanManifest() {
  return {
    spec: {
      slug: 'quiver-v21-cli-spec',
      title: 'Quiver v21 CLI spec',
      ticket: 'QUIVER-21-02',
      objective: 'Wire the AI plan spec phase to the generator.',
      scope: {
        included: ['ai plan spec phase', 'spec tree generation', 'safe overwrite handling'],
        excluded: ['Provider execution'],
      },
      acceptance: [
        'slice-00 exists',
        'pr.md always exists',
      ],
      slices: [
        {
          slice_id: 'slice-01-generator-core',
          ticket: 'QUIVER-21-02',
          title: 'Generator core',
          objective: 'Render the spec tree.',
          description: 'Create the generated artifacts from approved input.',
          must: ['Render SPEC.md', 'Render slice briefs'],
          acceptance: ['The generator writes a valid spec tree.'],
          files: ['src/create-quiver/lib/ai/spec-generator.js'],
          tests: ['node --test tests/lib/ai-spec-generator.test.js'],
        },
      ],
    },
  };
}

test('ai plan spec phase dry-run reports the generated spec tree and does not write files', () => {
  const repo = makeRepo({
    'technical-plan.md': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--input', 'technical-plan.md']);
    const output = execAi(repo.root, ['--phase', 'spec', '--dry-run']);
    assert.ok(output.includes('AI plan dry-run'));
    assert.ok(output.includes('Phase: spec'));
    assert.ok(output.includes('Spec slug: quiver-v21-cli-spec'));
    assert.ok(output.includes('Target: specs/quiver-v21-cli-spec'));
    assert.ok(output.includes('slice-00-spec-foundation'));
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v21-cli-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts', () => {
  const repo = makeRepo({
    'technical-plan.md': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--input', 'technical-plan.md']);
    const output = execAi(repo.root, ['--phase', 'spec']);
    const specDir = path.join(repo.root, 'specs', 'quiver-v21-cli-spec');

    assert.ok(output.includes('AI plan spec generation completed'));
    assert.ok(output.includes('Spec slug: quiver-v21-cli-spec'));
    assert.ok(output.includes('Files written:'));
    assert.ok(fs.existsSync(path.join(specDir, 'SPEC.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'STATUS.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EVIDENCE_REPORT.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EXECUTION_PLAN.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'pr.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-01-generator-core', 'slice.json')));

    const sliceJson = JSON.parse(fs.readFileSync(path.join(specDir, 'slices', 'slice-01-generator-core', 'slice.json'), 'utf8'));
    assert.deepEqual(sliceJson.depends_on, ['slice-00-spec-foundation']);
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase rejects unapproved technical-plan input', () => {
  const repo = makeRepo({
    'technical-plan.md': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    assert.throws(
      () => execAi(repo.root, ['--phase', 'spec', '--input', 'technical-plan.md']),
      (error) => error.stderr.includes("requires approved technical-plan input") && error.stderr.includes("current status: missing"),
    );
  } finally {
    repo.cleanup();
  }
});
