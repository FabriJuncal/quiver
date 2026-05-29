const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { savePlannerDraft } = require('../../src/create-quiver/lib/approvals');

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

function execCli(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function promptBody(output) {
  const match = String(output).match(/--- PROMPT START ---\n([\s\S]*?)\n--- PROMPT END ---/);
  return match ? match[1] : '';
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
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'production review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);
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

test('ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids', () => {
  const repo = makeRepo({
    'technical-plan.md': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'production review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);

    const output = execCli(repo.root, ['--lang', 'es', 'ai', 'plan', '--phase', 'spec', '--dry-run']);
    assert.ok(output.includes('Dry-run de plan IA'));
    assert.ok(output.includes('Fase: spec'));
    assert.ok(output.includes('Slug de spec: quiver-v21-cli-spec'));
    assert.ok(output.includes('Destino: specs/quiver-v21-cli-spec'));
    assert.ok(output.includes('slice-00-spec-foundation'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan print-prompt localizes wrappers but keeps provider prompt body stable', () => {
  const repo = makeRepo({
    'requirements.md': '# Requirements\nBuild the feature.\n',
  });

  try {
    const en = execCli(repo.root, ['ai', 'plan', '--phase', 'acceptance', '--input', 'requirements.md', '--print-prompt']);
    const es = execCli(repo.root, ['--lang', 'es', 'ai', 'plan', '--phase', 'acceptance', '--input', 'requirements.md', '--print-prompt']);

    assert.ok(en.includes('AI plan prompt-only'));
    assert.ok(es.includes('Prompt-only de IA plan'));
    assert.equal(promptBody(es), promptBody(en));
    assert.match(promptBody(es), /Task: produce acceptance criteria only/);
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan dry-run renders Spanish wrapper fields without changing draft path', () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan\n');

    const output = execCli(repo.root, ['--lang', 'es', 'ai', 'review-plan', '--dry-run']);
    assert.ok(output.includes('Dry-run de IA review-plan'));
    assert.ok(output.includes('Provider: codex'));
    assert.ok(output.includes('Rol: reviewer'));
    assert.ok(output.includes('Fuente del prompt: packaged production-readiness plan review template'));
    assert.ok(output.includes('Archivo de entrada: .quiver/approvals/technical-plan/drafts/001.md'));
    assert.ok(output.includes('Tipo de entrada: draft'));
    assert.ok(output.includes('Version de entrada: v1'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts', () => {
  const repo = makeRepo({
    'technical-plan.md': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'production review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);
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

test('ai approve dry-run and missing-version guidance render Spanish wrappers', () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n',
  });

  try {
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Draft criteria\n');

    const dryRun = execCli(repo.root, ['--lang', 'es', 'ai', 'approve', '--phase', 'acceptance', '--version', '1', '--dry-run']);
    assert.ok(dryRun.includes('Dry-run de aprobacion IA'));
    assert.ok(dryRun.includes('Fase: acceptance'));
    assert.ok(dryRun.includes('Version: v1'));

    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'ai', 'approve', '--phase', 'acceptance']),
      (error) => error.stderr.includes('requiere --version <n>')
        && error.stderr.includes('Siguiente comando: npx create-quiver ai approve --phase acceptance --version 1'),
    );
  } finally {
    repo.cleanup();
  }
});
