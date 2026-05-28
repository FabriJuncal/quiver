const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  createAiRun,
  recordAiRunApproval,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');
const {
  approvePlannerPhase,
  savePlannerDraft,
} = require('../../src/create-quiver/lib/approvals');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-run-cli-'));
  fs.writeFileSync(path.join(root, 'requirements.md'), '# Requirement\n');
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execAi(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function structuredTechnicalPlanText(slug = 'run-state-spec') {
  return `${JSON.stringify({
    spec: {
      slug,
      title: 'Run state spec',
      objective: 'Keep lifecycle guidance aligned.',
      slices: [
        {
          slice_id: 'slice-01-run-state',
          title: 'Run state slice',
          objective: 'Validate run-state guidance.',
          files: ['src/index.js'],
        },
      ],
    },
  }, null, 2)}\n`;
}

test('ai run create creates persistent run state and ai status can inspect it', () => {
  const repo = makeRepo();

  try {
    const created = execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-cli']);
    assert.match(created, /AI run status/);
    assert.match(created, /Run: run-cli/);
    assert.match(created, /Phase: created/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-cli/state.json')), true);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-cli/approvals.json')), true);

    const status = execAi(repo.root, ['status']);
    assert.match(status, /Run: run-cli/);
    assert.match(status, /Next safe command: npx create-quiver ai plan --phase acceptance/);

    const resume = execAi(repo.root, ['resume']);
    assert.match(resume, /AI run resume/);
    assert.match(resume, /Current phase: created/);
  } finally {
    repo.cleanup();
  }
});

test('ai status and resume use current approval candidate versions', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-approval-guidance',
    });
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# Acceptance v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# Acceptance v2\n');
    updateAiRunPhase(repo.root, 'run-approval-guidance', 'acceptance-draft', {
      command: 'test acceptance draft',
    });

    const acceptanceStatus = execAi(repo.root, ['status']);
    const acceptanceResume = execAi(repo.root, ['resume']);

    assert.match(acceptanceStatus, /Next safe command: npx create-quiver ai approve --phase acceptance --version 2/);
    assert.match(acceptanceResume, /Next safe command: npx create-quiver ai approve --phase acceptance --version 2/);

    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('run-status-plan'));
    savePlanReview(repo.root, {
      contents: '```json\n{"review":{"blocking":false,"approvalRecommendation":"approve","requiredFixes":[],"optionalHardening":[],"risks":[]}}\n```\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    updateAiRunPhase(repo.root, 'run-approval-guidance', 'technical-plan-reviewed', {
      command: 'test technical-plan reviewed',
    });

    const technicalStatus = execAi(repo.root, ['status']);
    assert.match(technicalStatus, /Next safe command: npx create-quiver ai approve --phase technical-plan --version 1/);
  } finally {
    repo.cleanup();
  }
});

test('ai status makes multiple open runs visible', () => {
  const repo = makeRepo();

  try {
    execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-old']);
    const created = execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-new']);

    assert.match(created, /Run: run-new/);
    assert.match(created, /Open runs: 2/);
    assert.match(created, /Other open runs:/);
    assert.match(created, /run-old: created \(active\)/);

    const status = execAi(repo.root, ['status']);
    assert.match(status, /Run: run-new/);
    assert.match(status, /Open runs: 2/);
    assert.match(status, /run-old: created \(active\)/);
  } finally {
    repo.cleanup();
  }
});

test('ai run close archives a selected run without deleting evidence', () => {
  const repo = makeRepo();

  try {
    execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-to-close']);
    const output = execAi(repo.root, ['run', 'close', '--run', 'run-to-close']);

    assert.match(output, /AI run closed/);
    assert.match(output, /Run: run-to-close/);
    assert.match(output, /Status: closed/);
    assert.match(output, /Phase: closed/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-to-close/state.json')), true);

    const status = execAi(repo.root, ['status']);
    assert.match(status, /Status: no active run/);
  } finally {
    repo.cleanup();
  }
});

test('ai approvals separates run-scoped approvals from global planner approvals', () => {
  const repo = makeRepo();

  try {
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# Acceptance\n');
    const approved = approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });

    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-old',
    });
    recordAiRunApproval(repo.root, 'run-old', {
      phase: 'acceptance',
      artifact: path.relative(repo.root, approved.filePath).split(path.sep).join('/'),
      version: 1,
      at: '2026-05-25T00:00:00.000Z',
    });
    updateAiRunPhase(repo.root, 'run-old', 'closed', {
      command: 'test close',
      now: new Date('2026-05-25T00:01:00.000Z'),
    });
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-active',
    });

    const output = execAi(repo.root, ['approvals']);

    assert.match(output, /Run-scoped approvals/);
    assert.match(output, /Active run: run-active/);
    assert.match(output, /Run: run-active \(active, phase: created, status: active\)/);
    assert.match(output, /Run: run-old \(historical, phase: closed, status: closed\)/);
    assert.match(output, /- acceptance v1: \.quiver\/approvals\/acceptance\/approved\.md/);
    assert.match(output, /Global planner approvals/);
    assert.match(output, /Phase: acceptance/);
    assert.match(output, /Run relation: historical/);
  } finally {
    repo.cleanup();
  }
});

test('ai status reports no active run without creating files', () => {
  const repo = makeRepo();

  try {
    const output = execAi(repo.root, ['status']);
    assert.match(output, /Status: no active run/);
    assert.match(output, /ai run create --input <requirements.md>/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});
