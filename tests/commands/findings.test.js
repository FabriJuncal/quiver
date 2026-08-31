const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { runFindings, UNSAFE_CONTRACTUAL_DATA } = require('../../src/create-quiver/commands/findings');
const {
  DISPOSITION_DUPLICATE,
  DISPOSITION_UNRESOLVED,
  buildDefaultGovernanceConfig,
  computePolicyDigest,
} = require('../../src/create-quiver/lib/ai/review-governance');
const {
  createAiRun,
  readRunGovernance,
  writeRunGovernance,
} = require('../../src/create-quiver/lib/ai/run-state');
const { runGovernanceStateSchema } = require('../../src/create-quiver/lib/ai/review-governance.schema');

const ACTOR = {
  actor_id: 'github:github.com:42',
  provider: 'github-cli',
  provider_subject: 'github:github.com:42',
  verified: true,
};
const NOW = '2026-08-27T12:00:00.000Z';
const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function planWithSlices(
  sliceIds = ['slice-03-runtime'],
  criterion = 'AC-10 — Preserve directed evidence.',
) {
  return `${JSON.stringify({
    spec: {
      slug: 'finding-transfer-test',
      title: 'Finding transfer test',
      ticket: 'QUIVER-TEST',
      objective: 'Exercise exact finding transfer.',
      acceptance: ['AC-10'],
      slices: sliceIds.map((sliceId) => ({
        slice_id: sliceId,
        title: sliceId,
        objective: `Implement ${sliceId}.`,
        files: ['src/example.js'],
        acceptance: [criterion],
      })),
    },
  }, null, 2)}\n`;
}

function makeRepo(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-findings-'));
  const runId = 'run-findings';
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings[ACTOR.provider_subject] = {
    actor_id: 'person:alice',
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions['transfer-blocker'] = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const policyDigest = computePolicyDigest(governance);
  const binding = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: governance.policy.version,
    policy_digest: policyDigest,
    requirement_categories: [],
  };
  createAiRun(root, {
    runId,
    governance: binding,
    phase: options.phase || 'technical-plan-reviewed',
    now: new Date(NOW),
  });
  writeFile(root, '.quiver/config.json', `${JSON.stringify({ governance }, null, 2)}\n`);
  writeFile(root, '.quiver/state.json', `${JSON.stringify({
    quiver_version: governance.compatibility.minimum_writer_version,
    project_name: 'Findings fixture',
    initialized_version: governance.compatibility.minimum_writer_version,
    migrated_version: null,
    last_initialized_at: NOW,
    last_migration_at: null,
    last_analysis_at: null,
  }, null, 2)}\n`);
  writeFile(root, 'technical-plan.json', planWithSlices(options.sliceIds, options.planCriterion));
  writeFile(root, 'docs/criteria/ac-10.md', options.criterion || 'AC-10 — Preserve directed evidence.\r\n');
  const finding = {
    finding_id: 'F-001',
    run_id: runId,
    origin_fingerprint: `sha256:${'a'.repeat(64)}`,
    state: 'open',
    title: 'Preserve directed evidence',
    summary: 'The implementation slice must preserve the directed evidence obligation.',
    severity: 'medium',
    category: options.findingCategory || 'implementation-detail',
    phase_owner: options.phaseOwner || 'slice',
    phase_blocking: false,
    evidence: ['technical-plan.json#/spec/slices/0'],
    acceptance_refs: ['AC-10'],
    recommended_disposition: options.recommendedDisposition || 'transfer-to-slice',
    confidence: 'high',
    supersedes: null,
    origins: [{ review_id: 'R-001', provider_finding_id: 'provider-1' }],
    lifecycle: [{
      event: 'created',
      at: NOW,
      review_id: 'R-001',
      provider_finding_id: 'provider-1',
    }],
  };
  const projection = {
    blocking: false,
    approval_recommendation: 'revise',
    required_fixes: [],
    plan_required_fixes: [],
    slice_required_fixes: ['F-001'],
    pr_required_fixes: [],
    follow_ups: [],
    optional_hardening: [],
    current_blockers: [],
    later_phase_transfers: ['F-001'],
  };
  writeRunGovernance(root, runId, {
    schema_version: 1,
    run_id: runId,
    next_finding_number: 2,
    current_review_id: 'R-001',
    reviews: [{
      schema_version: 1,
      review_id: 'R-001',
      run_id: runId,
      source_file: 'technical-plan.json',
      source_kind: 'draft',
      source_version: 1,
      raw_artifact_path: null,
      output_source: 'provider',
      provider_finding_ids: ['provider-1'],
      finding_ids: ['F-001'],
      requested_profile: 'fast-delivery',
      effective_profile: 'fast-delivery',
      policy_version: governance.policy.version,
      policy_digest: policyDigest,
      provider_recommendation: 'revise',
      provider_blocking: false,
      projection,
      reviewed_at: NOW,
    }],
    findings: [finding],
    dispositions: [],
    condition_evaluations: [],
    conditioned_candidates: [],
    updated_at: NOW,
  });
  return {
    root,
    runId,
    policyDigest,
    cleanup: () => fs.rmSync(root, { force: true, recursive: true }),
  };
}

async function captureStdout(callback) {
  const original = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += String(chunk);
    return true;
  };
  try {
    const result = await callback();
    return { output, result };
  } finally {
    process.stdout.write = original;
  }
}

function expectCode(code) {
  return (error) => error?.code === code;
}

test('individual transfer preserves exact criterion bytes and writes one canonical disposition', async () => {
  const repo = makeRepo();
  try {
    const exact = fs.readFileSync(path.join(repo.root, 'docs/criteria/ac-10.md'), 'utf8');
    const { output, result } = await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'transfer',
      criterionFile: 'docs/criteria/ac-10.md',
      evidenceObligations: ['Record directed test evidence.'],
      findingId: 'F-001',
      json: true,
      now: new Date(NOW),
      runId: repo.runId,
      target: 'slice-03',
    }));
    const state = readRunGovernance(repo.root, repo.runId);

    assert.deepEqual(JSON.parse(output), result);
    assert.equal(result.status, 'saved');
    assert.equal(state.dispositions.length, 1);
    assert.equal(state.dispositions[0].authorization.action, 'transfer-blocker');
    assert.equal(state.dispositions[0].target, 'slice:slice-03-runtime');
    assert.equal(state.dispositions[0].criterion_binding.content, exact);
    assert.equal(result.dispositions[0].criterion_binding.content, exact);
    assert.doesNotThrow(() => runGovernanceStateSchema.parse({
      ...state,
      condition_evaluations: [{
        schema_version: 1,
        evaluation_id: 'CE-001',
        run_id: repo.runId,
        review_id: 'R-001',
        actor_id: 'person:final-approver',
        policy_version: 'v58',
        policy_digest: repo.policyDigest,
        disposition_ids: ['D-001'],
        reason_path: 'docs/decisions/reason.md',
        reason_sha256: `sha256:${'b'.repeat(64)}`,
        result: {
          eligible: true,
          status: 'ELIGIBLE',
          code: 'ELIGIBLE_WITH_CONDITIONS',
          finding_id: null,
          disposition_id: null,
          policy_rule_ids: ['v58-transfer-slice'],
          authorization_code: null,
        },
        evaluated_at: NOW,
      }],
    }));
  } finally {
    repo.cleanup();
  }
});

test('invocation files stay scoped to the invoking worktree while run state stays canonical', async () => {
  const canonical = makeRepo();
  const invocationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-findings-worktree-'));
  try {
    fs.rmSync(path.join(canonical.root, 'docs/criteria/ac-10.md'));
    writeFile(invocationRoot, 'docs/criteria/ac-10.md', 'AC-10 — Preserve directed evidence.\n');
    await captureStdout(() => runFindings(invocationRoot, {
      actor: ACTOR,
      command: 'transfer',
      criterionFile: 'docs/criteria/ac-10.md',
      evidenceObligations: ['Record directed test evidence.'],
      findingId: 'F-001',
      resolveCanonicalProjectRootFn: () => canonical.root,
      runId: canonical.runId,
      target: 'slice-03',
    }));

    const disposition = readRunGovernance(canonical.root, canonical.runId).dispositions[0];
    assert.equal(disposition.criterion_binding.source_path, 'docs/criteria/ac-10.md');
    assert.equal(disposition.criterion_binding.content, 'AC-10 — Preserve directed evidence.\n');
    assert.equal(fs.existsSync(path.join(invocationRoot, '.quiver')), false);
  } finally {
    canonical.cleanup();
    fs.rmSync(invocationRoot, { force: true, recursive: true });
  }
});

test('batch keyed-map and canonical-envelope forms require explicit supersession', async () => {
  const repo = makeRepo();
  try {
    writeFile(repo.root, 'batch-1.json', `${JSON.stringify({
      'F-001': {
        action: 'transfer-to-slice',
        target: 'slice-03',
        acceptance_ref: 'AC-10',
        criterion_file: 'docs/criteria/ac-10.md',
        evidence_obligations: ['Record directed test evidence.'],
      },
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'batch-1.json',
      runId: repo.runId,
    }));
    const first = readRunGovernance(repo.root, repo.runId).dispositions[0];

    writeFile(repo.root, 'batch-duplicate.json', `${JSON.stringify({
      'F-001': {
        action: 'transfer-to-slice',
        target: 'slice-03',
        acceptance_ref: 'AC-10',
        criterion_file: 'docs/criteria/ac-10.md',
        evidence_obligations: ['Record replacement evidence.'],
      },
    }, null, 2)}\n`);
    await assert.rejects(
      runFindings(repo.root, {
        actor: ACTOR,
        command: 'disposition',
        file: 'batch-duplicate.json',
        runId: repo.runId,
      }),
      expectCode(DISPOSITION_DUPLICATE),
    );
    assert.equal(readRunGovernance(repo.root, repo.runId).dispositions.length, 1);

    writeFile(repo.root, 'batch-digest-drift.json', `${JSON.stringify({
      'F-001': {
        action: 'transfer-to-slice',
        target: 'slice-03',
        acceptance_ref: 'AC-10',
        criterion_binding: { ...first.criterion_binding, content: 'tampered criterion\n' },
        evidence_obligations: ['Record replacement evidence.'],
        supersedes: first.disposition_id,
      },
    }, null, 2)}\n`);
    await assert.rejects(
      runFindings(repo.root, {
        actor: ACTOR,
        command: 'disposition',
        file: 'batch-digest-drift.json',
        runId: repo.runId,
      }),
      expectCode(DISPOSITION_UNRESOLVED),
    );
    assert.equal(readRunGovernance(repo.root, repo.runId).dispositions.length, 1);

    writeFile(repo.root, 'batch-2.json', `${JSON.stringify({
      schema_version: 1,
      run_id: repo.runId,
      review_id: 'R-001',
      policy_version: 'v58',
      policy_digest: repo.policyDigest,
      dispositions: [{
        finding_id: 'F-001',
        action: 'transfer-to-slice',
        target: 'slice-03-runtime',
        acceptance_ref: 'AC-10',
        criterion_binding: first.criterion_binding,
        evidence_obligations: ['Record replacement evidence.'],
        supersedes: first.disposition_id,
      }],
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'batch-2.json',
      runId: repo.runId,
    }));
    const dispositions = readRunGovernance(repo.root, repo.runId).dispositions;

    assert.equal(dispositions[0].state, 'superseded');
    assert.equal(dispositions[1].state, 'current');
    assert.equal(dispositions[1].supersedes, first.disposition_id);
  } finally {
    repo.cleanup();
  }
});

test('batch preserves historical revise, follow-up, and optional actions but rejects accept-risk', async () => {
  const repo = makeRepo({
    findingCategory: 'tooling',
    phaseOwner: 'follow-up',
    recommendedDisposition: 'create-follow-up',
  });
  try {
    writeFile(repo.root, 'revise.json', `${JSON.stringify({
      'F-001': {
        action: 'revise-plan',
        evidence_obligations: ['Revise the technical plan before final approval.'],
      },
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'revise.json',
      runId: repo.runId,
    }));
    const revise = readRunGovernance(repo.root, repo.runId).dispositions[0];
    assert.equal(revise.action, 'revise-plan');
    assert.equal(revise.criterion_binding, undefined);

    writeFile(repo.root, 'follow-up.json', `${JSON.stringify({
      'F-001': {
        action: 'create-follow-up',
        target_issue: 'QUIVER-99',
        evidence_obligations: ['Close the linked follow-up.'],
        supersedes: revise.disposition_id,
      },
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'follow-up.json',
      runId: repo.runId,
    }));
    const followUp = readRunGovernance(repo.root, repo.runId).dispositions.at(-1);
    assert.equal(followUp.action, 'create-follow-up');
    assert.equal(followUp.target_issue, 'QUIVER-99');

    writeFile(repo.root, 'accept-risk.json', `${JSON.stringify({
      'F-001': {
        action: 'accept-risk',
        evidence_obligations: ['Record risk acceptance.'],
        supersedes: followUp.disposition_id,
      },
    }, null, 2)}\n`);
    await assert.rejects(
      runFindings(repo.root, {
        actor: ACTOR,
        command: 'disposition',
        file: 'accept-risk.json',
        runId: repo.runId,
      }),
      expectCode('DISPOSITION_UNAUTHORIZED'),
    );
    assert.equal(readRunGovernance(repo.root, repo.runId).dispositions.length, 2);
  } finally {
    repo.cleanup();
  }

  const optional = makeRepo({
    findingCategory: 'optional-hardening',
    recommendedDisposition: 'optional',
  });
  try {
    writeFile(optional.root, 'optional.json', `${JSON.stringify({
      'F-001': {
        action: 'optional',
        evidence_obligations: ['Document optional hardening.'],
      },
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(optional.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'optional.json',
      runId: optional.runId,
    }));
    assert.equal(readRunGovernance(optional.root, optional.runId).dispositions[0].action, 'optional');
  } finally {
    optional.cleanup();
  }
});

test('complete batch validation and unsafe contractual data fail before mutation', async () => {
  const repo = makeRepo({ criterion: 'token sk-abcdefghijklmnop123456\n' });
  try {
    const before = fs.readFileSync(path.join(repo.root, `.quiver/runs/${repo.runId}/review-governance.json`), 'utf8');
    await assert.rejects(
      runFindings(repo.root, {
        actor: ACTOR,
        command: 'transfer',
        criterionFile: 'docs/criteria/ac-10.md',
        evidenceObligations: ['Record directed test evidence.'],
        findingId: 'F-001',
        runId: repo.runId,
        target: 'slice-03',
      }),
      expectCode(UNSAFE_CONTRACTUAL_DATA),
    );
    const after = fs.readFileSync(path.join(repo.root, `.quiver/runs/${repo.runId}/review-governance.json`), 'utf8');
    assert.equal(after, before);
  } finally {
    repo.cleanup();
  }
});

test('criterion binding must resolve uniquely to the current technical-plan criterion before mutation', async () => {
  for (const options of [
    { criterion: 'AC-10 — Different contractual content.\n' },
    {
      criterion: 'Preserve directed evidence.\n',
      planCriterion: 'Preserve directed evidence.',
    },
  ]) {
    const repo = makeRepo(options);
    try {
      const statePath = path.join(repo.root, `.quiver/runs/${repo.runId}/review-governance.json`);
      const before = fs.readFileSync(statePath, 'utf8');
      await assert.rejects(
        runFindings(repo.root, {
          actor: ACTOR,
          command: 'transfer',
          criterionFile: 'docs/criteria/ac-10.md',
          evidenceObligations: ['Record directed test evidence.'],
          findingId: 'F-001',
          runId: repo.runId,
          target: 'slice-03',
        }),
        expectCode(DISPOSITION_UNRESOLVED),
      );
      assert.equal(fs.readFileSync(statePath, 'utf8'), before);
    } finally {
      repo.cleanup();
    }
  }
});

test('unsafe follow-up target_issue fails before mutation while a safe issue remains persistable', async () => {
  const repo = makeRepo({
    findingCategory: 'tooling',
    phaseOwner: 'follow-up',
    recommendedDisposition: 'create-follow-up',
  });
  try {
    writeFile(repo.root, 'unsafe-follow-up.json', `${JSON.stringify({
      'F-001': {
        action: 'create-follow-up',
        target_issue: 'sk-abcdefghijklmnop123456',
        evidence_obligations: ['Close the linked follow-up.'],
      },
    }, null, 2)}\n`);
    const statePath = path.join(repo.root, `.quiver/runs/${repo.runId}/review-governance.json`);
    const before = fs.readFileSync(statePath, 'utf8');
    await assert.rejects(
      runFindings(repo.root, {
        actor: ACTOR,
        command: 'disposition',
        file: 'unsafe-follow-up.json',
        runId: repo.runId,
      }),
      (error) => {
        assert.equal(error.code, UNSAFE_CONTRACTUAL_DATA);
        assert.doesNotMatch(
          JSON.stringify({ message: error.message, details: error.details }),
          /sk-abcdefghijklmnop123456/,
        );
        return true;
      },
    );
    assert.equal(fs.readFileSync(statePath, 'utf8'), before);

    writeFile(repo.root, 'safe-follow-up.json', `${JSON.stringify({
      'F-001': {
        action: 'create-follow-up',
        target_issue: 'QUIVER-99',
        evidence_obligations: ['Close the linked follow-up.'],
      },
    }, null, 2)}\n`);
    await captureStdout(() => runFindings(repo.root, {
      actor: ACTOR,
      command: 'disposition',
      file: 'safe-follow-up.json',
      runId: repo.runId,
    }));
    assert.equal(readRunGovernance(repo.root, repo.runId).dispositions[0].target_issue, 'QUIVER-99');
  } finally {
    repo.cleanup();
  }
});

test('ambiguous slice aliases and post-review phases are rejected without writes', async () => {
  const ambiguous = makeRepo({ sliceIds: ['slice-03-api', 'slice-03-ui'] });
  try {
    await assert.rejects(
      runFindings(ambiguous.root, {
        actor: ACTOR,
        command: 'transfer',
        criterionFile: 'docs/criteria/ac-10.md',
        evidenceObligations: ['Record directed test evidence.'],
        findingId: 'F-001',
        runId: ambiguous.runId,
        target: 'slice-03',
      }),
      expectCode(DISPOSITION_UNRESOLVED),
    );
    assert.deepEqual(readRunGovernance(ambiguous.root, ambiguous.runId).dispositions, []);
  } finally {
    ambiguous.cleanup();
  }

  const finalPhase = makeRepo({ phase: 'technical-plan-approved' });
  try {
    await assert.rejects(
      runFindings(finalPhase.root, {
        actor: ACTOR,
        command: 'transfer',
        criterionFile: 'docs/criteria/ac-10.md',
        evidenceObligations: ['Record directed test evidence.'],
        findingId: 'F-001',
        runId: finalPhase.runId,
        target: 'slice-03',
      }),
      expectCode('AI_RUN_PHASE_INVALID'),
    );
  } finally {
    finalPhase.cleanup();
  }
});

test('direct findings errors redact invocation, canonical, and secret values without changing contracts', async () => {
  const canonical = makeRepo();
  const invocationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-findings-errors-'));
  const secretId = 'sk-abcdefghijklmnop123456';
  try {
    await assert.rejects(
      runFindings(invocationRoot, {
        actor: ACTOR,
        command: 'transfer',
        criterionFile: path.join(canonical.root, 'docs/criteria/ac-10.md'),
        evidenceObligations: ['Record directed test evidence.'],
        findingId: 'F-001',
        resolveCanonicalProjectRootFn: () => canonical.root,
        runId: canonical.runId,
        target: 'slice-03',
      }),
      (error) => {
        assert.equal(error.code, DISPOSITION_UNRESOLVED);
        assert.doesNotMatch(error.message, new RegExp(canonical.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(error.message, /\[(?:HOME|PROJECT_ROOT)\]/);
        return true;
      },
    );

    const dependencyError = new Error(
      `Identity failed for ${secretId} in ${invocationRoot} using ${canonical.root}.`,
    );
    dependencyError.code = 'IDENTITY_LOOKUP_FAILED';
    dependencyError.status = 503;
    dependencyError.details = {
      finding_id: secretId,
      invocation_path: invocationRoot,
      primary_path: canonical.root,
      target_issue: 'QUIVER-99',
    };
    await assert.rejects(
      runFindings(invocationRoot, {
        command: 'transfer',
        criterionFile: 'docs/criteria/ac-10.md',
        evidenceObligations: ['Record directed test evidence.'],
        findingId: 'F-001',
        resolveActorFn: async () => { throw dependencyError; },
        resolveCanonicalProjectRootFn: () => canonical.root,
        runId: canonical.runId,
        target: 'slice-03',
      }),
      (error) => {
        assert.equal(error.code, 'IDENTITY_LOOKUP_FAILED');
        assert.equal(error.status, 503);
        assert.equal(error.details.finding_id, '[REDACTED]');
        assert.equal(error.details.invocation_path, '[PROJECT_ROOT]');
        assert.match(error.details.primary_path, /^\[(?:HOME|PROJECT_ROOT)\]/);
        assert.equal(error.details.target_issue, 'QUIVER-99');
        assert.doesNotMatch(JSON.stringify({ message: error.message, details: error.details }), new RegExp(secretId));
        assert.doesNotMatch(error.message, new RegExp(invocationRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.doesNotMatch(error.message, new RegExp(canonical.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        return true;
      },
    );
  } finally {
    canonical.cleanup();
    fs.rmSync(invocationRoot, { force: true, recursive: true });
  }
});

test('findings CLI redacts failures consistently in human and JSON modes', () => {
  const repo = makeRepo();
  const secret = 'sk-abcdefghijklmnop123456';
  const unsafeAbsoluteFile = path.join(repo.root, `${secret}.json`);
  const args = [
    'findings',
    'disposition',
    '--file',
    unsafeAbsoluteFile,
    '--run',
    repo.runId,
  ];
  try {
    const human = spawnSync(process.execPath, [BIN_PATH, ...args], {
      cwd: repo.root,
      encoding: 'utf8',
      env: { ...process.env, PWD: repo.root },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(human.status, 1);
    assert.equal(human.stdout, '');
    assert.match(human.stderr, /\[PROJECT_ROOT\]/);
    assert.match(human.stderr, /\[REDACTED\]/);
    assert.doesNotMatch(human.stderr, new RegExp(secret));
    assert.doesNotMatch(human.stderr, new RegExp(repo.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const json = spawnSync(process.execPath, [BIN_PATH, ...args, '--json'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: { ...process.env, PWD: repo.root },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const payload = JSON.parse(json.stdout);
    assert.equal(json.status, 1);
    assert.equal(json.stderr, '');
    assert.equal(payload.status, 'error');
    assert.equal(payload.code, DISPOSITION_UNRESOLVED);
    assert.match(payload.error.message, /\[PROJECT_ROOT\]/);
    assert.match(payload.error.message, /\[REDACTED\]/);
    assert.doesNotMatch(json.stdout, new RegExp(secret));
    assert.doesNotMatch(json.stdout, new RegExp(repo.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  } finally {
    repo.cleanup();
  }
});
