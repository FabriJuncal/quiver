const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  createAiRun,
  readAiRun,
  readRunApprovalDecision,
  recordAiRunApproval,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');
const {
  approvePlannerPhase,
  readPhaseApproval,
  savePlannerDraft,
} = require('../../src/create-quiver/lib/approvals');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { runApprove } = require('../../src/create-quiver/commands/ai');
const {
  buildDefaultGovernanceConfig,
  resolveEffectiveProfile,
} = require('../../src/create-quiver/lib/ai/review-governance');

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

function execCli(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function execAiRaw(repoRoot, args = []) {
  return spawnSync(process.execPath, [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function configureCanonicalApprovals(repoRoot) {
  const actor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  fs.mkdirSync(path.join(repoRoot, '.quiver'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.quiver', 'config.json'),
    `${JSON.stringify({ governance }, null, 2)}\n`,
  );
  const profile = resolveEffectiveProfile({ governance, requirementCategories: [] });
  return { actor, governance, profile };
}

async function seedCanonicalAcceptance(repoRoot, runId = 'run-canonical-approval') {
  const { actor, profile } = configureCanonicalApprovals(repoRoot);
  createAiRun(repoRoot, {
    input: 'requirements.md',
    runId,
    governance: {
      requested_profile: profile.requested_profile,
      effective_profile: profile.effective_profile,
      policy_version: profile.policy_version,
      policy_digest: profile.policy_digest,
      requirement_categories: [],
    },
  });
  const artifact = `${JSON.stringify({
    spec: { acceptance: ['AC-01', 'AC-02'] },
  }, null, 2)}\n`;
  savePlannerDraft(repoRoot, 'acceptance', 'requirements.md', artifact, {
    requireDigestBindings: true,
  });
  const draft = readPhaseApproval(repoRoot, 'acceptance').meta.drafts.at(-1);
  updateAiRunPhase(repoRoot, runId, 'acceptance-draft', {
    artifact: draft.path,
    command: 'ai plan --phase acceptance',
  });
  await runApprove(repoRoot, {
    actor,
    digestBound: true,
    phase: 'acceptance',
    publishFinal: true,
    runId,
    suppressOutput: true,
    version: draft.version,
  });
  return readRunApprovalDecision(repoRoot, runId, 'acceptance');
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

test('ai status and resume render Spanish human output while preserving commands', () => {
  const repo = makeRepo();

  try {
    execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-cli']);

    const status = execCli(repo.root, ['--lang', 'es', 'ai', 'status']);
    assert.match(status, /Estado del run de IA/);
    assert.match(status, /Run: run-cli/);
    assert.match(status, /Estado: activo/);
    assert.match(status, /Proximo comando seguro: npx create-quiver ai plan --phase acceptance/);

    const resume = execCli(repo.root, ['--lang', 'es', 'ai', 'resume']);
    assert.match(resume, /Reanudar run de IA/);
    assert.match(resume, /Fase actual: created/);
    assert.match(resume, /npx create-quiver ai plan --phase acceptance/);
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

test('ai run create and close render Spanish human wrappers while preserving ids', () => {
  const repo = makeRepo();

  try {
    const created = execCli(repo.root, ['--lang', 'es', 'ai', 'run', 'create', '--input', 'requirements.md', '--run', 'run-es']);
    assert.match(created, /Estado del run de IA/);
    assert.match(created, /Run: run-es/);
    assert.match(created, /Estado: activo/);
    assert.match(created, /Fase: created/);

    const closed = execCli(repo.root, ['--lang', 'es', 'ai', 'run', 'close', '--run', 'run-es']);
    assert.match(closed, /Run de IA cerrado/);
    assert.match(closed, /Run: run-es/);
    assert.match(closed, /Estado: cerrado/);
    assert.match(closed, /Fase: closed/);
  } finally {
    repo.cleanup();
  }
});

test('ai run command errors render Spanish without translating commands', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'ai', 'run', 'create']),
      /ai run create requiere --input <requirements\.md>/,
    );
    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'ai', 'run', 'watch', '--run', 'run-cli']),
      /subcomando ai run no soportado: watch\. Tareas soportadas: create, close/,
    );
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

    const spanish = execCli(repo.root, ['--lang', 'es', 'ai', 'approvals']);
    assert.match(spanish, /Estado de aprobaciones de IA/);
    assert.match(spanish, /Aprobaciones asociadas a runs/);
    assert.match(spanish, /Run activo: run-active/);
    assert.match(spanish, /Aprobaciones globales del planner/);
    assert.match(spanish, /Relacion con run: historico/);
    assert.match(spanish, /npx create-quiver ai approve --phase acceptance --version 1/);
  } finally {
    repo.cleanup();
  }
});

test('ai approvals fails closed when a run projection points at another run', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-projection-a' });
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-projection-b' });
    recordAiRunApproval(repo.root, 'run-projection-b', {
      phase: 'acceptance',
      artifact: '.quiver/approvals/acceptance/approved.md',
      version: 1,
    });
    const statePath = path.join(repo.root, '.quiver', 'runs', 'run-projection-a', 'state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.approvals_path = '.quiver/runs/run-projection-b/approvals.json';
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

    const result = execAiRaw(repo.root, ['approvals']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /approval projection path is not canonical/);
    assert.equal(result.stdout.includes('run-projection-b'), false);
  } finally {
    repo.cleanup();
  }
});

test('ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-row-a' });
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-row-b' });
    const projectionPath = path.join(repo.root, '.quiver', 'runs', 'run-row-a', 'approvals.json');
    fs.writeFileSync(projectionPath, `${JSON.stringify({
      schema_version: 1,
      run_id: 'run-row-a',
      approvals: [{
        schema_version: 1,
        run_id: 'run-row-b',
        decision_id: 'A-001',
        phase: 'acceptance',
        decision: 'approved',
        artifact: '.quiver/runs/run-row-b/approvals/acceptance/v001.md',
        artifact_sha256: `sha256:${'a'.repeat(64)}`,
        input_sha256: `sha256:${'b'.repeat(64)}`,
        criterion_count: 1,
        version: 1,
        at: '2026-08-27T00:00:00.000Z',
      }],
    }, null, 2)}\n`);

    const result = execAiRaw(repo.root, ['approvals']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid canonical approval entry/);
    assert.equal(result.stdout.includes('v001.md'), false);

    fs.writeFileSync(projectionPath, `${JSON.stringify({
      schema_version: 1,
      run_id: 'run-row-a',
      approvals: [{
        phase: 'acceptance',
        artifact: '.quiver/runs/run-row-b/approvals/acceptance/v001.md',
        version: 1,
        at: '2026-08-27T00:00:00.000Z',
      }],
    }, null, 2)}\n`);
    const downgraded = execAiRaw(repo.root, ['approvals']);
    assert.notEqual(downgraded.status, 0);
    assert.match(downgraded.stderr, /invalid canonical approval entry/);
    assert.equal(downgraded.stdout.includes('v001.md'), false);

    fs.writeFileSync(projectionPath, `${JSON.stringify({
      schema_version: 1,
      run_id: 'run-row-a',
      approvals: [{
        phase: 'acceptance',
        artifact: '.quiver/approvals/acceptance/approved.md',
        version: 1,
        at: '2026-08-27T00:00:00.000Z',
      }],
    }, null, 2)}\n`);
    const legacy = execAiRaw(repo.root, ['approvals']);
    assert.equal(legacy.status, 0);
    assert.match(legacy.stdout, /\.quiver\/approvals\/acceptance\/approved\.md/);
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
    const spanish = execCli(repo.root, ['--lang', 'es', 'ai', 'status']);
    assert.match(spanish, /Estado: sin run activo/);
    assert.match(spanish, /npx create-quiver ai run create --input <requirements\.md>/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai approval show, verify, and export consume the same canonical decision', async () => {
  const repo = makeRepo();

  try {
    const decision = await seedCanonicalAcceptance(repo.root);

    const show = execAi(repo.root, [
      'approval',
      'show',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
    ]);
    assert.match(show, /AI canonical approval/);
    assert.match(show, new RegExp(`Run: ${decision.run_id}`));
    assert.match(show, /Decision: approved/);
    assert.match(show, /Version: v1/);
    assert.match(show, new RegExp(`Artifact digest: ${decision.artifact_sha256}`));
    assert.match(show, new RegExp(`Input digest: ${decision.input_sha256}`));
    assert.match(show, /Criteria: 2/);

    const verified = JSON.parse(execAi(repo.root, [
      'approval',
      'verify',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--json',
    ]));
    assert.equal(verified.ok, true);
    assert.equal(verified.status, 'valid');
    assert.equal(verified.code, 'APPROVAL_VALID');
    assert.equal(verified.approval.decision_id, decision.decision_id);
    assert.equal(verified.verification.criteria_count, 2);

    const exported = execAi(repo.root, [
      'approval',
      'export',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--format',
      'linear-comment',
    ]);
    assert.equal(exported, [
      'ACCEPTANCE_APPROVED:v1',
      `artifact_sha256=${decision.artifact_sha256}`,
      `requirement_sha256=${decision.input_sha256}`,
      'criteria_count=2',
      '',
    ].join('\n'));

    updateAiRunPhase(repo.root, decision.run_id, 'closed', {
      command: 'test close after approval',
    });
    const historical = execAi(repo.root, [
      'approval',
      'show',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
    ]);
    assert.match(historical, /Status: valid/);
  } finally {
    repo.cleanup();
  }
});

test('ai approval verify fails closed with one JSON document after artifact or projection tampering', async () => {
  const repo = makeRepo();

  try {
    const decision = await seedCanonicalAcceptance(repo.root, 'run-tampered-approval');
    const artifactPath = path.join(repo.root, ...decision.artifact_path.split('/'));
    const originalArtifact = fs.readFileSync(artifactPath);
    fs.writeFileSync(
      artifactPath,
      originalArtifact.toString('utf8').replace('AC-01', 'AC-X1'),
    );

    const artifactResult = execAiRaw(repo.root, [
      'approval',
      'verify',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--json',
    ]);
    assert.notEqual(artifactResult.status, 0);
    assert.equal(artifactResult.stderr, '');
    const artifactFailure = JSON.parse(artifactResult.stdout);
    assert.equal(artifactFailure.ok, false);
    assert.equal(artifactFailure.code, 'APPROVAL_BINDING_MISMATCH');

    fs.writeFileSync(artifactPath, originalArtifact);
    const statePath = path.join(repo.root, '.quiver', 'runs', decision.run_id, 'state.json');
    const originalState = fs.readFileSync(statePath);
    const projectionPath = path.join(repo.root, '.quiver', 'runs', decision.run_id, 'approvals.json');
    const alternateProjectionPath = path.join(repo.root, '.quiver', 'copied-approvals.json');
    fs.copyFileSync(projectionPath, alternateProjectionPath);
    const redirectedState = JSON.parse(originalState.toString('utf8'));
    redirectedState.approvals_path = '.quiver/copied-approvals.json';
    fs.writeFileSync(statePath, `${JSON.stringify(redirectedState, null, 2)}\n`);

    const redirectedResult = execAiRaw(repo.root, [
      'approval',
      'verify',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--json',
    ]);
    assert.notEqual(redirectedResult.status, 0);
    assert.equal(redirectedResult.stderr, '');
    const redirectedFailure = JSON.parse(redirectedResult.stdout);
    assert.equal(redirectedFailure.ok, false);
    assert.equal(redirectedFailure.code, 'APPROVAL_BINDING_MISMATCH');

    fs.writeFileSync(statePath, originalState);
    const projection = JSON.parse(fs.readFileSync(projectionPath, 'utf8'));
    projection.approvals[0].criterion_count += 1;
    fs.writeFileSync(projectionPath, `${JSON.stringify(projection, null, 2)}\n`);

    const projectionResult = execAiRaw(repo.root, [
      'approval',
      'verify',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--json',
    ]);
    assert.notEqual(projectionResult.status, 0);
    assert.equal(projectionResult.stderr, '');
    const projectionFailure = JSON.parse(projectionResult.stdout);
    assert.equal(projectionFailure.ok, false);
    assert.equal(projectionFailure.code, 'REPRESENTATION_MISMATCH');
  } finally {
    repo.cleanup();
  }
});

test('ai approval requires an explicit run when more than one active run exists', async () => {
  const repo = makeRepo();

  try {
    const decision = await seedCanonicalAcceptance(repo.root, 'run-with-approval');
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-without-approval',
    });

    const ambiguous = execAiRaw(repo.root, [
      'approval',
      'show',
      '--phase',
      'acceptance',
      '--json',
    ]);
    assert.notEqual(ambiguous.status, 0);
    assert.equal(ambiguous.stderr, '');
    const failure = JSON.parse(ambiguous.stdout);
    assert.equal(failure.ok, false);
    assert.equal(failure.code, 'AI_RUN_AMBIGUOUS');

    const explicit = JSON.parse(execAi(repo.root, [
      'approval',
      'verify',
      '--phase',
      'acceptance',
      '--run',
      decision.run_id,
      '--json',
    ]));
    assert.equal(explicit.ok, true);
    assert.equal(explicit.approval.decision_id, decision.decision_id);
  } finally {
    repo.cleanup();
  }
});

test('two active runs publish only their own approval candidate and canonical counts', async () => {
  const repo = makeRepo();

  try {
    const { actor, profile } = configureCanonicalApprovals(repo.root);
    const governanceBinding = {
      requested_profile: profile.requested_profile,
      effective_profile: profile.effective_profile,
      policy_version: profile.policy_version,
      policy_digest: profile.policy_digest,
      requirement_categories: [],
    };
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-isolated-a',
      governance: governanceBinding,
    });
    const draftA = savePlannerDraft(
      repo.root,
      'acceptance',
      'requirements.md',
      `${JSON.stringify({ spec: { acceptance: ['A-01'] } }, null, 2)}\n`,
      { requireDigestBindings: true },
    );
    const draftAPath = readPhaseApproval(repo.root, 'acceptance').meta.drafts
      .find((item) => item.version === draftA.version).path;
    updateAiRunPhase(repo.root, 'run-isolated-a', 'acceptance-draft', {
      artifact: draftAPath,
      command: 'test run A draft',
    });

    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-isolated-b',
      governance: governanceBinding,
    });
    const draftB = savePlannerDraft(
      repo.root,
      'acceptance',
      'requirements.md',
      `${JSON.stringify({ spec: { acceptance: ['B-01', 'B-02', 'B-03'] } }, null, 2)}\n`,
      { requireDigestBindings: true },
    );
    const draftBPath = readPhaseApproval(repo.root, 'acceptance').meta.drafts
      .find((item) => item.version === draftB.version).path;
    updateAiRunPhase(repo.root, 'run-isolated-b', 'acceptance-draft', {
      artifact: draftBPath,
      command: 'test run B draft',
    });

    await runApprove(repo.root, {
      actor,
      digestBound: true,
      phase: 'acceptance',
      publishFinal: true,
      runId: 'run-isolated-a',
      suppressOutput: true,
      version: draftA.version,
    });
    await runApprove(repo.root, {
      actor,
      digestBound: true,
      phase: 'acceptance',
      publishFinal: true,
      runId: 'run-isolated-b',
      suppressOutput: true,
      version: draftB.version,
    });

    const decisionA = readRunApprovalDecision(repo.root, 'run-isolated-a', 'acceptance');
    const decisionB = readRunApprovalDecision(repo.root, 'run-isolated-b', 'acceptance');
    assert.equal(decisionA.run_id, 'run-isolated-a');
    assert.equal(decisionA.version, 1);
    assert.equal(decisionA.criterion_count, 1);
    assert.equal(decisionB.run_id, 'run-isolated-b');
    assert.equal(decisionB.version, 2);
    assert.equal(decisionB.criterion_count, 3);
    assert.notEqual(decisionA.artifact_path, decisionB.artifact_path);
    assert.equal(readAiRun(repo.root, 'run-isolated-a').phase, 'acceptance-approved');
    assert.equal(readAiRun(repo.root, 'run-isolated-b').phase, 'acceptance-approved');
  } finally {
    repo.cleanup();
  }
});

test('a run in approval recovery cannot break explicit status or close for another run', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-recovery-a' });
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-independent-b' });
    fs.writeFileSync(
      path.join(repo.root, '.quiver', 'runs', 'run-recovery-a', 'approval-commit-wal.json'),
      '{}\n',
    );

    const status = execAi(repo.root, ['status', '--run', 'run-independent-b']);
    assert.match(status, /Run: run-independent-b/);
    assert.match(status, /Status: active/);

    const closed = execAi(repo.root, ['run', 'close', '--run', 'run-independent-b']);
    assert.match(closed, /AI run closed/);
    assert.match(closed, /Run: run-independent-b/);
    assert.match(closed, /Status: closed/);
    assert.equal(JSON.parse(fs.readFileSync(
      path.join(repo.root, '.quiver', 'runs', 'run-independent-b', 'state.json'),
      'utf8',
    )).status, 'closed');
    assert.equal(JSON.parse(fs.readFileSync(
      path.join(repo.root, '.quiver', 'runs', 'run-recovery-a', 'state.json'),
      'utf8',
    )).status, 'active');

    const implicit = execAiRaw(repo.root, ['status']);
    assert.notEqual(implicit.status, 0);
    assert.match(implicit.stderr, /Approval commit recovery is required/);
  } finally {
    repo.cleanup();
  }
});
