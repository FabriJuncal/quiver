const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { approvePlannerPhase, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { runCreateSpec } = require('../../src/create-quiver/commands/spec');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-create-'));
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

function execCli(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, QUIVER_LANG: 'en', ...env },
  });
}

function approvedPlanManifest() {
  return {
    spec: {
      slug: 'quiver-v23-created-spec',
      title: 'Quiver v23 created spec',
      ticket: 'QUIVER-23-CREATE',
      objective: 'Create a spec from a reviewed approved plan.',
      acceptance: [
        'slice-00 exists',
        'pr.md exists',
      ],
      slices: [
        {
          slice_id: 'slice-01-create-core',
          ticket: 'QUIVER-23-CREATE',
          title: 'Create core',
          objective: 'Render the spec tree from the approved plan.',
          description: 'Generate the expected files.',
          files: ['src/create-quiver/commands/spec.js'],
          acceptance: ['Spec create writes a valid spec tree.'],
        },
      ],
    },
  };
}

function seedReviewedApprovedPlan(repoRoot) {
  writeFile(path.join(repoRoot, 'technical-plan.json'), `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`);
  savePlannerDraft(repoRoot, 'technical-plan', 'technical-plan.json', fs.readFileSync(path.join(repoRoot, 'technical-plan.json'), 'utf8'));
  savePlanReview(repoRoot, {
    contents: 'reviewed\n',
    inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
    inputKind: 'draft',
    inputVersion: 1,
  });
  execCli(repoRoot, ['ai', 'approve', '--phase', 'technical-plan', '--version', '1']);
}

test('spec create dry-run previews files and next safe commands without writing', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run']);

    assert.match(output, /Quiver spec create dry-run/);
    assert.match(output, /Spec slug: quiver-v23-created-spec/);
    assert.match(output, /Target: specs\/quiver-v23-created-spec/);
    assert.match(output, /slices\/slice-00-spec-foundation\/slice\.json/);
    assert.match(output, /Next safe commands:/);
    assert.match(output, /npx create-quiver spec start specs\/quiver-v23-created-spec/);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --review dry-run advertises review without opening an editor or writing', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run', '--review']);

    assert.match(output, /Quiver spec create dry-run/);
    assert.match(output, /Review requested: yes \(dry-run preview only; no editor opened and no files written\)\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create dry-run renders Spanish from explicit language without translating commands', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['--lang', 'es', 'spec', 'create', '--dry-run']);

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Slug de spec: quiver-v23-created-spec/);
    assert.match(output, /Archivo de entrada:/);
    assert.match(output, /Destino: specs\/quiver-v23-created-spec/);
    assert.match(output, /Proximos comandos seguros:/);
    assert.match(output, /npx create-quiver spec start specs\/quiver-v23-created-spec/);
    assert.match(output, /No se escribiran archivos en modo dry-run\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create review dry-run renders Spanish review wrapper safely', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['--lang', 'es', 'spec', 'create', '--dry-run', '--review']);

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Revision solicitada: si \(preview dry-run solamente; no se abre editor ni se escriben archivos\)\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create dry-run uses configured project language when no flag is provided', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    writeFile(path.join(repo.root, '.quiver', 'config.json'), `${JSON.stringify({ language: 'es' }, null, 2)}\n`);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run'], { QUIVER_LANG: '' });

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Proximos comandos seguros:/);
    assert.match(output, /npx create-quiver spec status specs\/quiver-v23-created-spec/);
  } finally {
    repo.cleanup();
  }
});

test('spec create --review cancellation blocks writes', async () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    await assert.rejects(
      runCreateSpec(repo.root, {
        review: true,
        openEditorFn: () => ({ ok: false, canceled: true, reason: 'review canceled' }),
      }),
      /review canceled/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --interactive can decline writes', async () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const selections = [];
    await assert.rejects(
      runCreateSpec(repo.root, {
        interactive: true,
        language: 'es',
        promptSelect: async (message, options) => {
          selections.push(message);
          return options.find((option) => option.default)?.value || options[0].value;
        },
        promptConfirm: async () => false,
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        write: () => {},
      }),
      /aprobacion interactiva de spec create rechazada/,
    );
    assert.deepEqual(selections, [
      'Que metodologia aplica esta spec?',
      'Que plan aprobado queres usar?',
      'Como queres revisar antes de escribir?',
    ]);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --interactive writes after guided summary approval', async () => {
  const repo = makeRepo();
  const writes = [];

  try {
    seedReviewedApprovedPlan(repo.root);
    const result = await runCreateSpec(repo.root, {
      interactive: true,
      language: 'es',
      promptSelect: async (message, options) => {
        if (message.includes('metodologia')) {
          return 'wdd-sdd';
        }
        return options.find((option) => option.default)?.value || options[0].value;
      },
      promptConfirm: async () => true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      write: (text) => writes.push(text),
    });

    assert.equal(result.specSlug, 'quiver-v23-created-spec');
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec', 'SPEC.md')), true);
    assert.ok(writes.some((line) => line.includes('Spec create')));
    assert.ok(writes.some((line) => line.includes('Metodologia: WDD + SDD')));
    assert.ok(writes.some((line) => line.includes('Plan tecnico: aprobado, v1, review=approve-with-risk')));
  } finally {
    repo.cleanup();
  }
});

test('spec create writes the generated spec tree and refuses collisions', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create']);
    const specDir = path.join(repo.root, 'specs', 'quiver-v23-created-spec');

    assert.match(output, /Quiver spec created/);
    assert.match(output, /Next safe commands:/);
    assert.ok(fs.existsSync(path.join(specDir, 'SPEC.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'STATUS.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EVIDENCE_REPORT.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EXECUTION_PLAN.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'pr.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-01-create-core', 'EXECUTION_BRIEF.md')));

    const sliceJson = JSON.parse(fs.readFileSync(path.join(specDir, 'slices', 'slice-01-create-core', 'slice.json'), 'utf8'));
    assert.deepEqual(sliceJson.depends_on, ['slice-00-spec-foundation']);
    assert.deepEqual(sliceJson.allowed_write_paths, ['src/create-quiver/commands/spec.js']);
    assert.deepEqual(sliceJson.validation_hints, []);
    assert.ok(sliceJson.expected_read_paths.includes('specs/quiver-v23-created-spec/SPEC.md'));

    assert.throws(
      () => execCli(repo.root, ['spec', 'create']),
      (error) => error.stderr.includes('spec directory already exists: specs/quiver-v23-created-spec'),
    );
  } finally {
    repo.cleanup();
  }
});

test('spec create blocks when the approved technical plan was not reviewed', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'technical-plan.json'), `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`);
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.json', fs.readFileSync(path.join(repo.root, 'technical-plan.json'), 'utf8'));
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    assert.throws(
      () => execCli(repo.root, ['spec', 'create', '--dry-run']),
      (error) => error.stderr.includes('requires a reviewed and approved technical-plan input')
        && error.stderr.includes('current review status: missing'),
    );
  } finally {
    repo.cleanup();
  }
});

test('spec create fails before writing when approved plan lacks structured slices', () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n\nThis plan has no structured slice block.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'reviewed\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    assert.throws(
      () => execCli(repo.root, ['spec', 'create', '--dry-run']),
      (error) => error.stderr.includes('approved technical plan must include a structured slices array'),
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs')), false);
  } finally {
    repo.cleanup();
  }
});
