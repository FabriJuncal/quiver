const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const packageJson = require('../../package.json');
const { approvePlannerPhase, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { resolveInitPackageScripts } = require('../../src/create-quiver/lib/init-layout');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-flow-'));
  for (const [relativePath, content] of Object.entries(structure)) {
    writeFile(root, relativePath, content);
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function snapshotFiles(root) {
  const files = [];

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(path.relative(root, fullPath).split(path.sep).join('/'));
      }
    }
  };

  walk(root);
  return files.sort();
}

function runFlow(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'flow', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runCli(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function seedInitializedContext(repoRoot) {
  writeFile(repoRoot, '.quiver/state.json', JSON.stringify({
    initialized_version: '0.10.0',
    last_initialized_at: '2026-05-21T00:00:00.000Z',
    quiver_version: '0.10.0',
  }, null, 2));
  writeFile(repoRoot, 'docs/PROJECT_MAP.md', '# Project Map\n');
  writeFile(repoRoot, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(repoRoot, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
}

function structuredTechnicalPlanText(slug = 'flow-spec') {
  return `${JSON.stringify({
    spec: {
      slug,
      title: 'Flow spec',
      objective: 'Create specs from the approved flow plan.',
      slices: [
        {
          slice_id: 'slice-01-flow',
          title: 'Flow slice',
          objective: 'Implement the flow slice.',
          files: ['src/index.js'],
        },
      ],
    },
  }, null, 2)}\n`;
}

test('package exposes quiver as an alias to the create-quiver binary', () => {
  assert.equal(packageJson.bin['create-quiver'], 'bin/create-quiver.js');
  assert.equal(packageJson.bin.quiver, 'bin/create-quiver.js');
});

test('generated package scripts include the flow entrypoint', () => {
  const scripts = resolveInitPackageScripts('default');
  assert.equal(scripts['quiver:flow'], 'npx create-quiver flow');
});

test('flow command is read-only and guides uninitialized projects to init', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const before = snapshotFiles(repo.root);
    const output = runFlow(repo.root);
    const after = snapshotFiles(repo.root);

    assert.deepEqual(after, before);
    assert.match(output, /Quiver guided flow/);
    assert.match(output, /Stage: not initialized/);
    assert.match(output, /Next safe command: npx create-quiver init --name "Project Name"/);
    assert.match(output, /Safety: this command is read-only and does not call AI providers\./);
  } finally {
    repo.cleanup();
  }
});

test('flow command localizes uninitialized guidance while preserving commands', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const output = runFlow(repo.root, ['--lang', 'es']);

    assert.match(output, /Flujo guiado de Quiver/);
    assert.match(output, /Etapa: sin inicializar/);
    assert.match(output, /Proximo comando seguro: npx create-quiver init --name "Project Name"/);
    assert.match(output, /Quiver no fue inicializado en este proyecto\./);
    assert.match(output, /Seguridad: este comando es read-only y no llama providers de IA\./);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports analysis guidance when initialized context docs are missing', () => {
  const repo = makeRepo({
    '.quiver/state.json': JSON.stringify({
      initialized_version: '0.10.0',
      last_initialized_at: '2026-05-21T00:00:00.000Z',
      quiver_version: '0.10.0',
    }, null, 2),
  });

  try {
    const output = runFlow(repo.root);

    assert.match(output, /Stage: context needs refresh/);
    assert.match(output, /Next safe command: npx create-quiver analyze/);
    assert.match(output, /Missing docs\/PROJECT_MAP\.md\./);
    assert.match(output, /Context source: missing analysis artifacts/);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports agent profile guidance before planning when context docs exist', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    const output = runFlow(repo.root);

    assert.match(output, /Stage: agent profiles need setup/);
    assert.match(output, /Next safe command: npx create-quiver ai agent set planner --provider codex --model gpt-5\.5/);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports package-manager-aware generated script guidance', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({
      name: 'flow-pnpm-project',
      packageManager: 'pnpm@9.0.0',
    }, null, 2),
  });

  try {
    seedInitializedContext(repo.root);
    const output = runFlow(repo.root);

    assert.match(output, /Package manager: pnpm/);
    assert.match(output, /Generated project script: pnpm run quiver:flow/);
  } finally {
    repo.cleanup();
  }
});

test('flow command uses the generated project map after analyze', () => {
  const repo = makeRepo();

  try {
    runCli(repo.root, ['init', '--name', 'Analyzed Flow Project', '--skip-install']);
    runCli(repo.root, ['analyze']);

    const output = runFlow(repo.root);

    assert.doesNotMatch(output, /Missing docs\/PROJECT_MAP\.md\./);
    assert.match(output, /Stage: agent profiles need setup/);
    assert.match(output, /Context source: \.quiver\/scans\/PROJECT_SCAN\.json \(current, updated /);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports criteria draft approval guidance', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'requirements.md', '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# Draft criteria\n');

    const output = runFlow(repo.root);

    assert.match(output, /Stage: acceptance criteria need approval/);
    assert.match(output, /Next safe command: npx create-quiver ai approve --phase acceptance --version 1/);
    assert.match(output, /v1, current, approvable/);
  } finally {
    repo.cleanup();
  }
});

test('flow command asks for production review before technical-plan approval', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', structuredTechnicalPlanText());
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText());

    const output = runFlow(repo.root);

    assert.match(output, /Stage: technical plan needs production review/);
    assert.match(output, /Next safe command: npx create-quiver ai review-plan --dry-run/);
  } finally {
    repo.cleanup();
  }
});

test('flow command asks for technical-plan approval after production review', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', structuredTechnicalPlanText());
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText());
    savePlanReview(repo.root, {
      contents: 'review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });

    const output = runFlow(repo.root);

    assert.match(output, /Stage: technical plan needs approval/);
    assert.match(output, /Next safe command: npx create-quiver ai approve --phase technical-plan --version 1/);
    assert.match(output, /review=approve-with-risk/);
  } finally {
    repo.cleanup();
  }
});

test('flow command points to revise when plan review blocks technical-plan approval', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', structuredTechnicalPlanText('flow-revise-plan'));
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('flow-revise-plan'));
    savePlanReview(repo.root, {
      contents: '```json\n{"review":{"blocking":true,"approvalRecommendation":"revise","requiredFixes":["Add rollback"],"optionalHardening":[],"risks":[]}}\n```\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });

    const output = runFlow(repo.root);

    assert.match(output, /Stage: technical plan review requires revision/);
    assert.match(output, /Next safe command: npx create-quiver ai revise --phase technical-plan --input <feedback\.md> --dry-run/);
    assert.doesNotMatch(output, /npx create-quiver ai approve --phase technical-plan --version 1/);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports spec create after reviewed and approved technical plan', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', structuredTechnicalPlanText());
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText());
    savePlanReview(repo.root, {
      contents: 'review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    execFileSync(process.execPath, [BIN_PATH, 'ai', 'approve', '--phase', 'technical-plan', '--version', '1'], {
      cwd: repo.root,
      encoding: 'utf8',
    });

    const output = runFlow(repo.root);

    assert.match(output, /Stage: ready for spec generation/);
    assert.match(output, /Next safe command: npx create-quiver spec create --dry-run/);
  } finally {
    repo.cleanup();
  }
});

test('flow command does not suggest re-approving a technical plan that still needs review', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', '# Technical plan\n');
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan draft\n');
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    const output = runFlow(repo.root);

    assert.match(output, /Stage: technical plan needs production review/);
    assert.match(output, /Next safe command: npx create-quiver ai review-plan --dry-run/);
    assert.doesNotMatch(output, /npx create-quiver ai approve --phase technical-plan --version <n>/);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports ready slice execution after approved plan and completed slice-00', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', '# Approved plan\n');
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Approved plan\n');
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });
    writeFile(repo.root, 'specs/my-spec/SPEC.md', '# Spec\n');
    writeFile(repo.root, 'specs/my-spec/slices/slice-00/slice.json', JSON.stringify({
      slice_id: 'slice-00',
      status: 'completed',
      files: ['specs/my-spec/SPEC.md'],
      depends_on: [],
    }, null, 2));
    writeFile(repo.root, 'specs/my-spec/slices/slice-01/slice.json', JSON.stringify({
      slice_id: 'slice-01',
      status: 'draft',
      files: ['src/index.js'],
      depends_on: ['slice-00'],
    }, null, 2));

    const output = runFlow(repo.root);

    assert.match(output, /Stage: ready for slice execution/);
    assert.match(output, /Next safe command: npx create-quiver ai execute-slice --slice specs\/my-spec\/slices\/slice-01\/slice\.json --dry-run --commit/);
    assert.match(output, /Specs found: my-spec/);
  } finally {
    repo.cleanup();
  }
});

test('flow command supports machine-readable output', () => {
  const repo = makeRepo({});

  try {
    const output = runFlow(repo.root, ['--json']);
    const parsed = JSON.parse(output);

    assert.equal(parsed.stage, 'not-initialized');
    assert.equal(parsed.nextCommand, 'npx create-quiver init --name "Project Name"');
    assert.equal(parsed.next_command, parsed.nextCommand);
    assert.equal(parsed.facts.contextSource.status, 'missing');
  } finally {
    repo.cleanup();
  }
});

test('flow JSON preserves camelCase and snake_case next command fields for ready slices', () => {
  const repo = makeRepo();

  try {
    seedInitializedContext(repo.root);
    writeFile(repo.root, 'acceptance.md', '# Approved acceptance\n');
    writeFile(repo.root, 'technical-plan.md', '# Approved plan\n');
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', '# Approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Approved plan\n');
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });
    writeFile(repo.root, 'specs/my-spec/SPEC.md', '# Spec\n');
    writeFile(repo.root, 'specs/my-spec/slices/slice-00/slice.json', JSON.stringify({
      slice_id: 'slice-00',
      status: 'completed',
      files: ['specs/my-spec/SPEC.md'],
      depends_on: [],
    }, null, 2));
    writeFile(repo.root, 'specs/my-spec/slices/slice-01/slice.json', JSON.stringify({
      slice_id: 'slice-01',
      status: 'draft',
      files: ['src/index.js'],
      depends_on: ['slice-00'],
    }, null, 2));

    const output = runFlow(repo.root, ['--json']);
    const parsed = JSON.parse(output);

    assert.equal(parsed.stage, 'slice-execution-ready');
    assert.equal(parsed.nextCommand, 'npx create-quiver ai execute-slice --slice specs/my-spec/slices/slice-01/slice.json --dry-run --commit');
    assert.equal(parsed.next_command, parsed.nextCommand);
  } finally {
    repo.cleanup();
  }
});
