const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const {
  checkPrReadiness,
  checkSliceReadiness,
  verifyPrGovernanceReadiness,
} = require('../../src/create-quiver/lib/readiness');
const { buildSpecGenerationManifest } = require('../../src/create-quiver/lib/ai/spec-generator');
const {
  renderGovernanceTraceability,
  renderPendingGovernanceBlock,
} = require('../../src/create-quiver/lib/ai/spec-templates');
const {
  buildApprovalDecisionRecord,
  canonicalSha256,
  computeApprovalDispositionDigest,
} = require('../../src/create-quiver/lib/ai/review-governance');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function sha256Text(text) {
  return `sha256:${crypto.createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-check-slice-'));
  cp.execFileSync('git', ['init', '-q'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.name', 'Quiver Test'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  cp.execFileSync('git', ['checkout', '-b', 'feature/test-slice'], { cwd: root });

  for (const [relativePath, data] of Object.entries(structure)) {
    if (typeof data === 'string') {
      writeText(path.join(root, relativePath), data);
    } else {
      writeJson(path.join(root, relativePath), data);
    }
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function makeProject(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-check-slice-local-'));

  for (const [relativePath, data] of Object.entries(structure)) {
    if (typeof data === 'string') {
      writeText(path.join(root, relativePath), data);
    } else {
      writeJson(path.join(root, relativePath), data);
    }
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function withRepoCwd(repoRoot, fn) {
  const previous = process.cwd();
  process.chdir(repoRoot);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function captureConsole(fn) {
  const originalLog = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join('\n');
}

function commitAll(repoRoot, message = 'seed') {
  cp.execFileSync('git', ['add', '.'], { cwd: repoRoot });
  cp.execFileSync('git', ['commit', '-m', message, '--quiet'], { cwd: repoRoot });
}

function completedSlice(ref, extra = {}) {
  const [, sliceId] = ref.split('/');
  return {
    slice_id: sliceId,
    ticket: extra.ticket || 'QUIVER-01',
    title: extra.title || ref,
    type: extra.type || 'feat',
    objective: extra.objective || `Objective for ${ref}`,
    description: extra.description || `Description for ${ref}`,
    git: extra.git || {
      branch_type: 'feature',
      base_branch: 'develop',
      branch_slug: sliceId,
      branch_name: `feature/QUIVER-01-${sliceId}`,
    },
    files: extra.files || ['docs/example.md'],
    acceptance: extra.acceptance || [`Acceptance for ${ref}`],
    tests: extra.tests || [],
    status: 'completed',
    started_at: extra.started_at || '2026-04-23T00:00:00Z',
    completed_at: extra.completed_at || '2026-04-23T01:00:00Z',
    actual_hours: extra.actual_hours || 1,
    ...(extra.depends_on !== undefined ? { depends_on: extra.depends_on } : {}),
    ...(extra.parallel_safe !== undefined ? { parallel_safe: extra.parallel_safe } : {}),
    ...(extra.parallel_safe_reason !== undefined ? { parallel_safe_reason: extra.parallel_safe_reason } : {}),
  };
}

function prBody() {
  return [
    '## Title',
    'Demo PR',
    '',
    '## Summary',
    'Body',
    '',
    '## Scope',
    '- Demo',
    '',
    '## Files',
    '- `src/app.js`',
    '',
    '## How to Test (DETAILED - REQUIRED)',
    '',
    '### Required Environment',
    '- Node.js',
    '',
    '### Worktree Access',
    '- `git switch feature/QUIVER-01-slice-01-alpha`',
    '',
    '### Run the Project',
    '- No server required.',
    '',
    '### Use Cases',
    '#### Case 1: demo',
    '1. Run the command.',
    '',
    '### Technical Verification',
    '- `node --test`',
    '',
    '## Evidence',
    '- Pending',
    '',
    '## Rollback',
    '- `git revert HEAD`',
    '',
    '## Risks / Notes',
    '- None',
    '',
  ].join('\n');
}

function governanceBlock(findingIds = [], target = 'slice:slice-01-alpha') {
  const entries = findingIds.map((findingId) => governanceEntry(findingId, target));
  return `${renderPendingGovernanceBlock(entries).join('\n')}\n`;
}

function governanceTraceability(manifest, findingIds = null) {
  const projectedIds = findingIds || manifest.findings.map((finding) => finding.finding_id);
  const entries = projectedIds.map((findingId) => {
    const finding = manifest.findings.find((item) => item.finding_id === findingId)
      || { finding_id: findingId, state: 'open' };
    const disposition = manifest.dispositions.find((item) => item.finding_id === findingId)
      || governanceEntry(findingId).disposition;
    return {
      finding,
      disposition,
      target: disposition.target || disposition.target_issue || null,
      criterion_binding: disposition.criterion_binding || null,
    };
  });
  return `${renderGovernanceTraceability(manifest, entries).join('\n')}\n`;
}

function governanceManifest(findingIds = ['F-001']) {
  const dispositionIds = findingIds.map((findingId) => `DISP-${findingId}`);
  const manifest = {
    schema_version: 1,
    kind: 'quiver-planning-governance',
    source: { run_id: 'run-test', path: '.quiver/runs/run-test/review-governance.json', sha256: `sha256:${'1'.repeat(64)}` },
    decision: {
      decision_id: 'DEC-001',
      decision_sha256: `sha256:${'3'.repeat(64)}`,
      phase: 'technical-plan',
      publication_state: 'final',
      decision: 'approved-with-conditions',
      disposition_ids: dispositionIds,
    },
    findings: findingIds.map((findingId) => ({ finding_id: findingId, state: 'open' })),
    dispositions: findingIds.map((findingId) => ({
      disposition_id: `DISP-${findingId}`,
      finding_id: findingId,
      action: 'transfer-to-slice',
      target: 'slice:slice-01-alpha',
      evidence_obligations: ['Record directed test evidence.'],
      state: 'current',
      criterion_binding: { acceptance_ref: 'AC-11' },
    })),
  };
  return { ...manifest, manifest_sha256: canonicalSha256(manifest) };
}

function governanceEntry(findingId = 'F-001', target = 'slice:slice-01-alpha', extra = {}) {
  return {
    finding: {
      finding_id: findingId,
      state: extra.state || 'open',
    },
    disposition: {
      disposition_id: `DISP-${findingId}`,
      action: target === 'phase:pr-review' ? 'transfer-to-pr' : 'transfer-to-slice',
      target,
      evidence_obligations: ['Record directed test evidence.'],
      state: extra.dispositionState || 'current',
      criterion_binding: { acceptance_ref: 'AC-11' },
    },
    target,
    criterion_binding: { acceptance_ref: 'AC-11' },
    pending: extra.pending ?? true,
    resolved: extra.resolved ?? false,
    accepted: extra.accepted ?? true,
  };
}

function governancePlanning(sliceId, manifest, findingIds = ['F-001']) {
  return {
    schema_version: 1,
    manifest: '../../GOVERNANCE_MANIFEST.json',
    manifest_sha256: manifest.manifest_sha256,
    target: { kind: 'slice', id: sliceId },
    pending_finding_ids: findingIds,
  };
}

function governanceGateOptions(manifest, entries, overrides = {}) {
  return {
    governanceEntriesForTargetFn: (value, target) => entries.filter((entry) => (
      target == null || entry.disposition.target === target
    )),
    verifyGovernanceManifestParityFn: ({ specRoot }) => ({
      manifest,
      manifestPath: path.join(specRoot, 'GOVERNANCE_MANIFEST.json'),
      specRoot,
    }),
    ...overrides,
  };
}

function realCanonicalGovernanceFixture(projectRoot) {
  const runId = 'run-real-readiness';
  const reviewId = 'R-001';
  const policyDigest = `sha256:${'a'.repeat(64)}`;
  const artifactPath = `.quiver/runs/${runId}/approvals/technical-plan/v001.md`;
  const source = {
    spec: {
      slug: 'spec-real',
      title: 'Real governed readiness fixture',
      ticket: 'QUIVER-REAL',
      objective: 'Exercise the canonical governance parity reader.',
      slices: [{
        slice_id: 'slice-01-alpha',
        title: 'Alpha',
        objective: 'Validate real governance parity.',
        acceptance: ['AC-01 validates canonical parity.'],
        files: ['docs/example.md'],
      }],
    },
  };
  const artifactText = `${JSON.stringify(source, null, 2)}\n`;
  writeText(path.join(projectRoot, artifactPath), artifactText);
  const review = {
    schema_version: 1,
    review_id: reviewId,
    run_id: runId,
    source_file: artifactPath,
    source_kind: 'draft',
    source_version: 1,
    raw_artifact_path: null,
    output_source: 'fixture',
    provider_finding_ids: [],
    finding_ids: [],
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58-test',
    policy_digest: policyDigest,
    provider_recommendation: 'approve',
    provider_blocking: false,
    projection: {
      blocking: false,
      approval_recommendation: 'approve',
      required_fixes: [],
      plan_required_fixes: [],
      slice_required_fixes: [],
      pr_required_fixes: [],
      follow_ups: [],
      optional_hardening: [],
      current_blockers: [],
      later_phase_transfers: [],
    },
    reviewed_at: '2026-08-27T12:00:00.000Z',
  };
  const authorization = {
    action: 'approve',
    policy_version: 'v58-test',
    policy_digest: policyDigest,
    actor_id: 'person:test',
    provider_actor_id: 'local:test',
    provider_subject: 'local:test',
    verified: true,
    binding: 'local:test',
    matched_actor_ids: ['person:test'],
    matched_roles: ['approver'],
    independence: 'none',
    independence_result: 'passed',
    identity_label: null,
  };
  const decision = buildApprovalDecisionRecord({
    schema_version: 1,
    decision_id: 'A-001',
    run_id: runId,
    review_id: reviewId,
    phase: 'technical-plan',
    decision: 'approved',
    publication_state: 'final',
    candidate_id: null,
    evaluation_id: null,
    version: 1,
    artifact_path: artifactPath,
    artifact_sha256: sha256Text(artifactText),
    input_path: artifactPath,
    input_sha256: sha256Text(artifactText),
    review_sha256: canonicalSha256(review),
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    profile_sha256: `sha256:${'b'.repeat(64)}`,
    policy_version: 'v58-test',
    policy_digest: policyDigest,
    finding_count: 0,
    criterion_count: 1,
    disposition_ids: [],
    disposition_sha256: computeApprovalDispositionDigest([]),
    reason_path: null,
    reason_sha256: null,
    actor_id: 'person:test',
    authorization,
    reviewer_recommendation: 'approve',
    reviewer_approved: null,
    recorded_at: '2026-08-27T12:01:00.000Z',
  });
  const governanceState = {
    schema_version: 1,
    run_id: runId,
    next_finding_number: 1,
    current_review_id: reviewId,
    reviews: [review],
    findings: [],
    dispositions: [],
    condition_evaluations: [],
    conditioned_candidates: [],
    decisions: [decision],
    updated_at: '2026-08-27T12:01:00.000Z',
  };
  writeJson(path.join(projectRoot, `.quiver/runs/${runId}/review-governance.json`), governanceState);
  const generated = buildSpecGenerationManifest({
    inputText: artifactText,
    inputPath: artifactPath,
    repoRoot: projectRoot,
    governanceContext: {
      canonicalRoot: projectRoot,
      governanceState,
      decision,
    },
  });
  return { artifactPath, generated, governanceState, runId };
}

function readySlice(ref, extra = {}) {
  return {
    ...completedSlice(ref, extra),
    status: 'ready',
    started_at: undefined,
    completed_at: undefined,
    actual_hours: undefined,
  };
}

test('check-slice passes for a completed slice without optional dependency fields', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha'),
  });

  try {
    assert.doesNotThrow(() => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      gate: 'validation',
    })));
  } finally {
    repo.cleanup();
  }
});

test('check-slice --local validates structure without requiring remote or base branches', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const output = withRepoCwd(repo.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));

    assert.match(output, /PASS: El slice local tiene EXECUTION_BRIEF\.md y CLOSURE_BRIEF\.md/);
    assert.match(output, /PASS: slice\.json declara metadata git compatible con start-slice/);
    assert.match(output, /PASS: slice\.json declara rutas relativas seguras dentro del proyecto/);
    assert.match(output, /INFO: Modo local: se omite validacion de existencia del slice en origin\/develop o develop/);
    assert.match(output, /INFO: Modo local: se omite validacion de overlap/);
    assert.match(output, /INFO: Modo local: checks ejecutados:/);
    assert.match(output, /INFO: Modo local: checks omitidos:/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    repo.cleanup();
  }
});

test('check-slice --local renders English output when requested', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const output = withRepoCwd(repo.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      language: 'en',
      local: true,
    })));

    assert.match(output, /PASS: Local spec has SPEC\.md, STATUS\.md, and EVIDENCE_REPORT\.md/);
    assert.match(output, /PASS: Local slice has EXECUTION_BRIEF\.md and CLOSURE_BRIEF\.md/);
    assert.match(output, /INFO: Local mode: skipping slice existence validation/);
    assert.match(output, /PASS: Gate execution: metadata and minimum preconditions OK/);
  } finally {
    repo.cleanup();
  }
});

test('check-slice --local rejects missing execution git metadata', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': {
      slice_id: 'slice-01-alpha',
      ticket: 'QUIVER-01',
      title: 'Alpha',
      files: ['src/alpha.js'],
      status: 'ready',
    },
  });

  try {
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
        local: true,
      })),
      /bloque "git" debe incluir/,
    );
  } finally {
    project.cleanup();
  }
});

test('check-slice --local rejects scope paths outside the project', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha', {
      files: ['../outside.js'],
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
        local: true,
      })),
      /project-relative path without traversal/,
    );
  } finally {
    project.cleanup();
  }
});

test('check-slice rejects an external absolute slice path even if it contains specs', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
  });
  const external = makeProject({
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const externalSlice = path.join(external.root, 'specs/spec-a/slices/slice-01-alpha/slice.json');
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(externalSlice, {
        local: true,
      })),
      /slice path must stay inside the project root/,
    );
  } finally {
    external.cleanup();
    project.cleanup();
  }
});

test('check-slice --local validates structure without requiring a Git repository', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const output = withRepoCwd(project.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));

    assert.match(output, /PASS: El spec local tiene SPEC\.md, STATUS\.md y EVIDENCE_REPORT\.md/);
    assert.match(output, /PASS: El slice local tiene EXECUTION_BRIEF\.md y CLOSURE_BRIEF\.md/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    project.cleanup();
  }
});

test('check-slice --local accepts a completed slice-00 dependency declared as a bare slice id', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-00-docs-foundation/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-00-docs-foundation/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-00-docs-foundation/slice.json': completedSlice('spec-a/slice-00-docs-foundation', {
      files: ['specs/spec-a/SPEC.md'],
    }),
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha', {
      depends_on: ['slice-00-docs-foundation'],
      files: ['src/alpha.js'],
    }),
  });

  try {
    assert.doesNotThrow(() => withRepoCwd(project.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));
  } finally {
    project.cleanup();
  }
});

test('check-slice default mode gives local/base guidance when no base exists', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json')),
      (error) => {
        const message = String(error.message || error);
        return message.includes('--local') && message.includes('--base <branch>') && message.includes("origin");
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice supports an explicit local base branch', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha', {
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'slice-01-alpha',
        branch_name: 'feature/QUIVER-01-slice-01-alpha',
      },
    }),
  });

  try {
    commitAll(repo.root);
    const output = withRepoCwd(repo.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      baseBranch: 'feature/test-slice',
    })));

    assert.match(output, /PASS: El slice ya existe en feature\/test-slice local/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    repo.cleanup();
  }
});

test('check-pr uses slice base branch instead of hardcoded origin/develop', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/pr.md': prBody(),
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'slice-01-alpha',
        branch_name: 'feature/test-slice',
      },
      files: ['src/app.js'],
    }),
    'src/app.js': 'module.exports = 1;\n',
  });

  try {
    commitAll(repo.root, 'base');
    cp.execFileSync('git', ['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: repo.root });
    writeText(path.join(repo.root, 'src/app.js'), 'module.exports = 2;\n');
    commitAll(repo.root, 'feature change');

    const output = withRepoCwd(repo.root, () => captureConsole(() => checkPrReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      language: 'en',
    })));

    assert.match(output, /PASS: Branch has own commits against origin\/main/);
    assert.doesNotMatch(output, /origin\/develop/);
    assert.match(output, /PASS: Gate PR ready/);
  } finally {
    repo.cleanup();
  }
});

test('check-slice rejects missing depends_on targets', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      depends_on: ['missing-spec/slice-99'],
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('missing-spec/slice-99'),
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice rejects cycles introduced by depends_on', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      depends_on: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': completedSlice('spec-a/slice-02-beta', {
      depends_on: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('ciclo') || String(error.message || error).includes('cycle'),
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice requires a parallel_safe_reason when parallel_safe is never', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      parallel_safe: 'never',
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('parallel_safe_reason'),
    );

    writeJson(path.join(repo.root, 'specs/spec-a/slices/slice-01-alpha/slice.json'), completedSlice('spec-a/slice-01-alpha', {
      parallel_safe: 'never',
      parallel_safe_reason: 'Needs exclusive database migration window.',
    }));

    assert.doesNotThrow(() => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      gate: 'validation',
    })));
  } finally {
    repo.cleanup();
  }
});

test('check-slice projects governed pending findings from one verified manifest', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const slice = {
    ...readySlice('spec-a/slice-01-alpha'),
    planning_governance: governancePlanning('slice-01-alpha', manifest),
  };
  const project = makeProject({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice,
  });

  try {
    const report = withRepoCwd(project.root, () => checkSliceReadiness(
      'specs/spec-a/slices/slice-01-alpha/slice.json',
      {
        ...governanceGateOptions(manifest, entries),
        emitReport: false,
        json: true,
        local: true,
      },
    ));
    assert.equal(report.governance.status, 'verified');
    assert.equal(report.governance.pending_count, 1);
    assert.deepEqual(report.governance.findings.map((finding) => finding.finding_id), ['F-001']);
    assert.equal(report.governance.findings[0].accepted, true);
  } finally {
    project.cleanup();
  }
});

test('check-slice verifies a real manifest self-digest against the primary canonical run store', () => {
  const project = makeProject({});

  try {
    const fixture = realCanonicalGovernanceFixture(project.root);
    const manifest = fixture.generated.governance;
    const slicePath = 'specs/spec-real/slices/slice-01-alpha/slice.json';
    writeJson(path.join(project.root, 'specs/spec-real/GOVERNANCE_MANIFEST.json'), manifest);
    writeText(path.join(project.root, 'specs/spec-real/SPEC.md'), governanceTraceability(manifest, []));
    writeText(path.join(project.root, 'specs/spec-real/STATUS.md'), '# status\n');
    writeText(path.join(project.root, 'specs/spec-real/EVIDENCE_REPORT.md'), '# evidence\n');
    writeText(path.join(project.root, 'specs/spec-real/slices/slice-01-alpha/EXECUTION_BRIEF.md'), governanceBlock([]));
    writeText(path.join(project.root, 'specs/spec-real/slices/slice-01-alpha/CLOSURE_BRIEF.md'), governanceBlock([]));
    writeJson(path.join(project.root, slicePath), {
      ...readySlice('spec-real/slice-01-alpha'),
      planning_governance: governancePlanning('slice-01-alpha', manifest, []),
    });

    const report = withRepoCwd(project.root, () => checkSliceReadiness(slicePath, {
      emitReport: false,
      json: true,
      local: true,
      runId: fixture.runId,
    }));
    assert.equal(report.governance.run_id, fixture.runId);
    assert.equal(report.governance.manifest_sha256, manifest.manifest_sha256);

    writeJson(path.join(project.root, 'specs/spec-real/GOVERNANCE_MANIFEST.json'), {
      ...manifest,
      manifest_sha256: `sha256:${'f'.repeat(64)}`,
    });
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(slicePath, {
        local: true,
        runId: fixture.runId,
      })),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.mismatches.includes('manifest_sha256'),
    );

    writeJson(path.join(project.root, 'specs/spec-real/GOVERNANCE_MANIFEST.json'), manifest);
    writeJson(path.join(project.root, `.quiver/runs/${fixture.runId}/review-governance.json`), {
      ...fixture.governanceState,
      updated_at: '2026-08-27T12:02:00.000Z',
    });
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(slicePath, {
        local: true,
        runId: fixture.runId,
      })),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.mismatches.includes('source.sha256'),
    );
  } finally {
    project.cleanup();
  }
});

test('check-slice with an explicit run cannot degrade to legacy when the manifest is absent', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# execution\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# closure\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(
        'specs/spec-a/slices/slice-01-alpha/slice.json',
        { local: true, runId: 'run-required' },
      )),
      (error) => error.code === 'REPRESENTATION_MISMATCH'
        && error.details.mismatches.includes('GOVERNANCE_MANIFEST.json'),
    );
  } finally {
    project.cleanup();
  }
});

test('a generated manifest declaration prevents legacy downgrade for slices and PRs', () => {
  const manifestPath = 'specs/spec-a/GOVERNANCE_MANIFEST.json';
  const slicePath = 'specs/spec-a/slices/slice-01-alpha/slice.json';
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/pr.md': '# root pr without governance projection\n',
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': readySlice(
      'spec-a/slice-00-spec-foundation',
      { files: [manifestPath] },
    ),
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# execution\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# closure\n',
    'specs/spec-a/slices/slice-01-alpha/pr.md': '# slice pr without governance projection\n',
    [slicePath]: readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const missingManifest = (error) => error.code === 'REPRESENTATION_MISMATCH'
      && error.details.mismatches.includes('GOVERNANCE_MANIFEST.json');
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(slicePath, { local: true })),
      missingManifest,
      'slice readiness',
    );
    for (const prPath of [
      'specs/spec-a/pr.md',
      'specs/spec-a/slices/slice-01-alpha/pr.md',
    ]) {
      assert.throws(
        () => verifyPrGovernanceReadiness(project.root, path.join(project.root, prPath)),
        missingManifest,
        prPath,
      );
    }
  } finally {
    project.cleanup();
  }
});

test('check-slice rejects stale, unknown, and reordered SPEC traceability projections', () => {
  const manifest = governanceManifest(['F-001', 'F-002']);
  const entries = [governanceEntry('F-001'), governanceEntry('F-002')];
  const scenarios = [
    {
      name: 'stale digest',
      code: 'APPROVAL_BINDING_MISMATCH',
      text: governanceTraceability({ ...manifest, manifest_sha256: `sha256:${'f'.repeat(64)}` }),
      verify: (error) => error.details.issue === 'stale',
    },
    {
      name: 'unknown row',
      code: 'REPRESENTATION_MISMATCH',
      text: governanceTraceability(manifest, ['F-001', 'F-999']),
      verify: (error) => error.details.unknown_finding_ids.includes('F-999'),
    },
    {
      name: 'row order',
      code: 'REPRESENTATION_MISMATCH',
      text: governanceTraceability(manifest, ['F-002', 'F-001']),
      verify: (error) => error.details.order_mismatch === true,
    },
    {
      name: 'canonical field drift',
      code: 'REPRESENTATION_MISMATCH',
      text: governanceTraceability(manifest).replace('(transfer-to-slice)', '(revise-plan)'),
      verify: (error) => error.details.mismatches.includes('canonical_governance_markdown'),
    },
  ];

  for (const scenario of scenarios) {
    const project = makeProject({
      'specs/spec-a/SPEC.md': scenario.text,
      'specs/spec-a/STATUS.md': '# status\n',
      'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
      'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
      'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001', 'F-002']),
      'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001', 'F-002']),
      'specs/spec-a/slices/slice-01-alpha/slice.json': {
        ...readySlice('spec-a/slice-01-alpha'),
        planning_governance: governancePlanning('slice-01-alpha', manifest, ['F-001', 'F-002']),
      },
    });

    try {
      assert.throws(
        () => withRepoCwd(project.root, () => checkSliceReadiness(
          'specs/spec-a/slices/slice-01-alpha/slice.json',
          { ...governanceGateOptions(manifest, entries), local: true },
        )),
        (error) => error.code === scenario.code && scenario.verify(error),
        scenario.name,
      );
    } finally {
      project.cleanup();
    }
  }
});

test('check-slice rejects omitted and unknown governed finding projections', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  for (const scenario of [
    { name: 'omitted', ids: [], expectedDetail: 'omitted_finding_ids' },
    { name: 'unknown', ids: ['F-001', 'F-999'], expectedDetail: 'unknown_finding_ids' },
  ]) {
    const slice = {
      ...readySlice('spec-a/slice-01-alpha'),
      planning_governance: governancePlanning('slice-01-alpha', manifest),
    };
    const project = makeProject({
      'specs/spec-a/SPEC.md': governanceTraceability(manifest),
      'specs/spec-a/STATUS.md': '# status\n',
      'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
      'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
      'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(scenario.ids),
      'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
      'specs/spec-a/slices/slice-01-alpha/slice.json': slice,
    });

    try {
      assert.throws(
        () => withRepoCwd(project.root, () => checkSliceReadiness(
          'specs/spec-a/slices/slice-01-alpha/slice.json',
          { ...governanceGateOptions(manifest, entries), local: true },
        )),
        (error) => error.code === 'REPRESENTATION_MISMATCH'
          && Array.isArray(error.details[scenario.expectedDetail])
          && error.details[scenario.expectedDetail].length > 0,
        scenario.name,
      );
    } finally {
      project.cleanup();
    }
  }
});

test('check-slice rejects canonical governance field drift in execution briefs', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const mutations = [
    ['disposition', 'DISP-F-001', 'DISP-TAMPERED'],
    ['action', 'transfer-to-slice', 'revise-plan'],
    ['state', 'current', 'superseded'],
    ['target', 'slice:slice-01-alpha', 'slice:slice-02-beta'],
    ['acceptance', 'AC-11', 'AC-99'],
    ['evidence', 'Record directed test evidence.', 'Skip directed test evidence.'],
  ];

  for (const [name, currentValue, mutatedValue] of mutations) {
    const project = makeProject({
      'specs/spec-a/SPEC.md': governanceTraceability(manifest),
      'specs/spec-a/STATUS.md': '# status\n',
      'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
      'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
      'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001'])
        .replace(currentValue, mutatedValue),
      'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
      'specs/spec-a/slices/slice-01-alpha/slice.json': {
        ...readySlice('spec-a/slice-01-alpha'),
        planning_governance: governancePlanning('slice-01-alpha', manifest),
      },
    });

    try {
      assert.throws(
        () => withRepoCwd(project.root, () => checkSliceReadiness(
          'specs/spec-a/slices/slice-01-alpha/slice.json',
          { ...governanceGateOptions(manifest, entries), local: true },
        )),
        (error) => error.code === 'REPRESENTATION_MISMATCH'
          && error.details.mismatches.includes('canonical_governance_markdown'),
        name,
      );
    } finally {
      project.cleanup();
    }
  }
});

test('check-slice requires the canonical governance heading inside marked blocks', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const project = makeProject({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '<!-- quiver-governance:begin -->\n- `F-001` - pending\n<!-- quiver-governance:end -->\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/slice.json': {
      ...readySlice('spec-a/slice-01-alpha'),
      planning_governance: governancePlanning('slice-01-alpha', manifest),
    },
  });

  try {
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(
        'specs/spec-a/slices/slice-01-alpha/slice.json',
        { ...governanceGateOptions(manifest, entries), local: true },
      )),
      (error) => error.code === 'REPRESENTATION_MISMATCH'
        && error.details.expected_heading === '## Pending governance findings',
    );
  } finally {
    project.cleanup();
  }
});

test('check-slice fails closed when a target finding is neither closed nor accepted', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry('F-001', 'slice:slice-01-alpha', { accepted: false })];
  const project = makeProject({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/slice.json': {
      ...readySlice('spec-a/slice-01-alpha'),
      planning_governance: governancePlanning('slice-01-alpha', manifest),
    },
  });

  try {
    assert.throws(
      () => withRepoCwd(project.root, () => checkSliceReadiness(
        'specs/spec-a/slices/slice-01-alpha/slice.json',
        { ...governanceGateOptions(manifest, entries), local: true },
      )),
      (error) => error.code === 'DISPOSITION_UNRESOLVED'
        && error.details.target === 'slice:slice-01-alpha'
        && error.details.finding_ids.includes('F-001'),
    );
  } finally {
    project.cleanup();
  }
});

test('check-slice propagates orphaned, stale, and unresolved governance failures', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const slice = {
    ...readySlice('spec-a/slice-01-alpha'),
    planning_governance: governancePlanning('slice-01-alpha', manifest),
  };
  const project = makeProject({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice,
  });

  try {
    for (const [issue, code] of [
      ['orphaned', 'REPRESENTATION_MISMATCH'],
      ['stale', 'APPROVAL_BINDING_MISMATCH'],
      ['unresolved', 'DISPOSITION_UNRESOLVED'],
    ]) {
      const failure = new Error(`${code}: ${issue}`);
      failure.code = code;
      failure.details = { issue };
      assert.throws(
        () => withRepoCwd(project.root, () => checkSliceReadiness(
          'specs/spec-a/slices/slice-01-alpha/slice.json',
          {
            ...governanceGateOptions(manifest, entries, {
              verifyGovernanceManifestParityFn: () => { throw failure; },
            }),
            local: true,
          },
        )),
        (error) => error.code === code && error.details.issue === issue,
      );
    }
  } finally {
    project.cleanup();
  }
});

test('check-pr rejects a governed slice PR that omits its finding block', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const slice = {
    ...completedSlice('spec-a/slice-01-alpha', {
      files: ['src/app.js'],
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'slice-01-alpha',
        branch_name: 'feature/test-slice',
      },
    }),
    planning_governance: governancePlanning('slice-01-alpha', manifest),
  };
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': governanceBlock(['F-001']),
    'specs/spec-a/slices/slice-01-alpha/pr.md': prBody(),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice,
    'src/app.js': 'module.exports = 1;\n',
  });

  try {
    commitAll(repo.root, 'base');
    cp.execFileSync('git', ['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: repo.root });
    writeText(path.join(repo.root, 'src/app.js'), 'module.exports = 2;\n');
    commitAll(repo.root, 'feature change');

    assert.throws(
      () => withRepoCwd(repo.root, () => checkPrReadiness(
        'specs/spec-a/slices/slice-01-alpha/slice.json',
        governanceGateOptions(manifest, entries),
      )),
      (error) => error.code === 'REPRESENTATION_MISMATCH' && error.details.issue === 'omitted',
    );
  } finally {
    repo.cleanup();
  }
});

test('PR governance readiness rejects canonical field drift with unchanged finding ids', () => {
  const manifest = governanceManifest();
  const entries = [governanceEntry()];
  const mutatedBlock = governanceBlock(['F-001']).replace('AC-11', 'AC-99');
  const project = makeProject({
    'specs/spec-a/SPEC.md': governanceTraceability(manifest),
    'specs/spec-a/GOVERNANCE_MANIFEST.json': manifest,
    'specs/spec-a/pr.md': mutatedBlock,
    'specs/spec-a/slices/slice-01-alpha/pr.md': mutatedBlock,
  });

  try {
    for (const prPath of [
      'specs/spec-a/pr.md',
      'specs/spec-a/slices/slice-01-alpha/pr.md',
    ]) {
      assert.throws(
        () => verifyPrGovernanceReadiness(
          project.root,
          path.join(project.root, prPath),
          governanceGateOptions(manifest, entries),
        ),
        (error) => error.code === 'REPRESENTATION_MISMATCH'
          && error.details.mismatches.includes('canonical_governance_markdown'),
        prPath,
      );
    }
  } finally {
    project.cleanup();
  }
});
