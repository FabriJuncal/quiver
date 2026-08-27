const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  buildSpecGenerationManifest,
  generateSpecArtifacts,
  parseApprovedManifest,
} = require('../../src/create-quiver/lib/ai/spec-generator');
const {
  GOVERNANCE_MARKER_BEGIN,
  GOVERNANCE_MARKER_END,
  GOVERNANCE_TRACEABILITY_MARKER_END,
  governanceTraceabilityMarkerBegin,
  resolveCanonicalProjectRoot,
} = require('../../src/create-quiver/lib/ai/spec-governance');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-spec-gen-'));
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

function approvedPlanManifest() {
  return {
    spec: {
      slug: 'quiver-v21-approved-spec',
      title: 'Quiver v21 approved spec',
      ticket: 'QUIVER-21-01',
      objective: 'Generate a spec pack from approved input.',
      scope: {
        included: ['SPEC.md', 'slice-00', 'implementation slices', 'EXECUTION_PLAN.md', 'pr.md'],
        excluded: ['Provider execution', 'GitHub PR creation'],
      },
      acceptance: [
        'slice-00 exists',
        'Every later slice depends on slice-00',
        'pr.md always exists',
      ],
      risks: [
        'The generated spec could drift from the approved input.',
      ],
      slices: [
        {
          slice_id: 'slice-01-spec-generator-core',
          ticket: 'QUIVER-21-01',
          title: 'Spec generator core',
          objective: 'Render spec files and slice briefs.',
          description: 'Create the spec directory and all generated artifacts.',
          must: ['Generate SPEC.md', 'Generate slice briefs'],
          not_included: ['Provider execution'],
          acceptance: ['The generator writes a valid spec tree.'],
          files: ['src/create-quiver/lib/ai/spec-generator.js'],
          expected_read_paths: ['docs/approved-plan.json', 'src/create-quiver/lib/ai/spec-templates.js'],
          allowed_write_paths: ['src/create-quiver/lib/ai/spec-generator.js'],
          tests: ['node --test tests/lib/ai-spec-generator.test.js'],
          validation_hints: ['node --test tests/lib/ai-spec-generator.test.js', 'git diff --check'],
          estimated_hours: 4,
        },
        {
          slice_id: 'slice-02-spec-cli-plumbing',
          ticket: 'QUIVER-21-01',
          title: 'Spec CLI plumbing',
          objective: 'Wire the CLI entry point to the generator.',
          description: 'Invoke the generator from ai plan spec phase.',
          must: ['Integrate ai plan spec phase'],
          not_included: ['Provider execution'],
          acceptance: ['The CLI invokes the generator.'],
          files: ['src/create-quiver/commands/ai.js'],
          tests: ['node --test tests/commands/ai-plan-spec-phase.test.js'],
          estimated_hours: 2,
        },
      ],
    },
  };
}

function governedPlanFixture(repoRoot, source = approvedPlanManifest(), overrides = {}) {
  source.spec.slices[0].acceptance = [
    overrides.criterionContent ?? 'AC-TP-01 preserves the transferred finding.',
  ];
  const content = source.spec.slices[0].acceptance[0];
  const runId = 'run-governed-spec';
  const reviewId = 'R-001';
  const artifactPath = `.quiver/runs/${runId}/approvals/technical-plan/v001.md`;
  const criterionPath = 'criterion.md';
  const finding = {
    finding_id: 'F-001',
    run_id: runId,
    origin_fingerprint: `sha256:${'1'.repeat(64)}`,
    state: 'open',
    title: 'Preserve validation evidence',
    summary: 'Carry the approved validation criterion into its destination slice.',
    severity: 'medium',
    category: 'implementation-detail',
    phase_owner: 'slice',
    phase_blocking: false,
    evidence: ['technical-plan.md#/validation'],
    acceptance_refs: ['AC-TP-01'],
    recommended_disposition: 'transfer-to-slice',
    confidence: 'high',
    supersedes: null,
    origins: [{ review_id: reviewId, provider_finding_id: 'provider-1' }],
    lifecycle: [{
      event: 'created',
      at: '2099-08-27T12:00:00.000Z',
      review_id: reviewId,
      provider_finding_id: 'provider-1',
    }],
  };
  const disposition = {
    schema_version: 1,
    disposition_id: 'D-001',
    run_id: runId,
    review_id: reviewId,
    finding_id: finding.finding_id,
    action: 'transfer-to-slice',
    target: overrides.target || 'slice:01',
    evidence_obligations: overrides.evidenceObligations || ['Record the directed validation result.'],
    criterion_binding: {
      acceptance_ref: 'AC-TP-01',
      content,
      source_path: criterionPath,
      criterion_sha256: `sha256:${crypto.createHash('sha256').update(content, 'utf8').digest('hex')}`,
    },
    state: 'current',
    supersedes: null,
    actor_id: 'maintainer',
    policy_version: 'v58',
    policy_digest: `sha256:${'2'.repeat(64)}`,
    recorded_at: '2099-08-27T12:01:00.000Z',
  };
  const governanceState = {
    schema_version: 1,
    run_id: runId,
    next_finding_number: 2,
    current_review_id: reviewId,
    reviews: [],
    findings: [finding],
    dispositions: [disposition],
    condition_evaluations: [],
    conditioned_candidates: [],
    decisions: [],
    updated_at: '2099-08-27T12:01:00.000Z',
  };
  const decision = {
    decision_id: 'A-002',
    decision_sha256: `sha256:${'3'.repeat(64)}`,
    run_id: runId,
    review_id: reviewId,
    phase: 'technical-plan',
    decision: 'approved-with-conditions',
    publication_state: 'final',
    candidate_id: 'C-001',
    evaluation_id: 'CE-001',
    version: 1,
    artifact_path: artifactPath,
    artifact_sha256: `sha256:${'4'.repeat(64)}`,
    input_path: `.quiver/runs/${runId}/approvals/acceptance/v001.md`,
    input_sha256: `sha256:${'5'.repeat(64)}`,
    review_sha256: `sha256:${'6'.repeat(64)}`,
    finding_count: 1,
    criterion_count: source.spec.slices.reduce(
      (count, slice) => count + (Array.isArray(slice.acceptance) ? slice.acceptance.length : 0),
      0,
    ),
    disposition_ids: ['D-001'],
    disposition_sha256: `sha256:${'7'.repeat(64)}`,
    reason_path: 'condition-reason.md',
    reason_sha256: `sha256:${'8'.repeat(64)}`,
    reviewer_recommendation: 'approve-with-risk',
    reviewer_approved: false,
    recorded_at: '2099-08-27T12:02:00.000Z',
  };
  return {
    source,
    context: {
      canonicalRoot: repoRoot,
      governanceState,
      decision,
      inputPath: artifactPath,
      inputText: `${JSON.stringify(source, null, 2)}\n`,
    },
  };
}

test('parseApprovedManifest falls back to markdown headings when JSON is unavailable', () => {
  const markdown = [
    '# Especificacion aprobada',
    '',
    '## Objetivo',
    '',
    'Create the generated spec tree.',
    '',
    '## Alcance',
    '',
    '### Incluye',
    '- SPEC.md',
    '- pr.md',
    '',
    '### Fuera de alcance',
    '- Provider execution',
    '',
    '## Criterios de aceptación',
    '',
    '- slice-00 exists',
    '',
    '## Supuestos',
    '',
    '- El usuario aprobo el plan tecnico',
  ].join('\n');

  const parsed = parseApprovedManifest(markdown, { fallbackTitle: 'Markdown spec' });

  assert.equal(parsed.source.title, 'Especificacion aprobada');
  assert.equal(parsed.source.objective, 'Create the generated spec tree.');
  assert.deepEqual(parsed.source.scope.included, ['SPEC.md', 'pr.md']);
  assert.deepEqual(parsed.source.scope.excluded, ['Provider execution']);
  assert.deepEqual(parsed.source.acceptance, ['slice-00 exists']);
  assert.deepEqual(parsed.source.assumptions, ['El usuario aprobo el plan tecnico']);
});

test('buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan', () => {
  const source = approvedPlanManifest();
  const manifest = buildSpecGenerationManifest({
    inputText: `${JSON.stringify(source, null, 2)}\n`,
    inputPath: 'docs/approved-plan.json',
    repoRoot: '/tmp/quiver-ai-spec-gen',
  });

  assert.equal(manifest.slug, 'quiver-v21-approved-spec');
  assert.equal(manifest.title, 'Quiver v21 approved spec');
  assert.equal(manifest.slices[0].slice_id, 'slice-00-spec-foundation');
  assert.equal(manifest.slices.length, 3);
  assert.deepEqual(manifest.slices[1].depends_on, ['slice-00-spec-foundation']);
  assert.deepEqual(manifest.slices[2].depends_on, ['slice-00-spec-foundation']);
  assert.equal(manifest.executionGroups.length, 2);
  assert.equal(manifest.executionGroups[1].length, 2);
});

test('buildSpecGenerationManifest preserves every approved implementation slice', () => {
  const source = {
    spec: {
      slug: 'eight-slice-plan',
      title: 'Eight slice plan',
      ticket: 'QUIVER-8',
      objective: 'Generate every approved slice.',
      slices: Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 1).padStart(2, '0');
        return {
          slice_id: `slice-${number}-work`,
          title: `Work ${number}`,
          objective: `Implement work ${number}.`,
          files: [`src/work-${number}.js`],
          depends_on: index === 0 ? [] : [`slice-${String(index).padStart(2, '0')}-work`],
        };
      }),
    },
  };

  const manifest = buildSpecGenerationManifest({
    inputText: JSON.stringify(source),
    inputPath: 'docs/eight-slice-plan.json',
    repoRoot: '/tmp/quiver-ai-spec-gen',
  });

  assert.equal(manifest.slices.length, 9);
  assert.equal(manifest.slices[0].slice_id, 'slice-00-spec-foundation');
  assert.deepEqual(
    manifest.slices.slice(1).map((slice) => slice.slice_id),
    source.spec.slices.map((slice) => slice.slice_id),
  );
  assert.deepEqual(manifest.slices[8].depends_on, ['slice-00-spec-foundation', 'slice-07-work']);
});


test('buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown', () => {
  const markdown = [
    '# Markdown approved plan',
    '',
    '## Objective',
    '',
    'Generate a spec from a reviewed markdown plan.',
    '',
    '```json',
    JSON.stringify({
      spec: {
        slug: 'markdown-approved-plan',
        ticket: 'QUIVER-MD',
        slices: [
          {
            slice_id: 'slice-01-markdown-core',
            title: 'Markdown core',
            objective: 'Use structured slices from a fenced block.',
            files: ['src/demo.js'],
          },
        ],
      },
    }, null, 2),
    '```',
  ].join('\n');

  const manifest = buildSpecGenerationManifest({
    inputText: markdown,
    inputPath: 'docs/approved-plan.md',
    repoRoot: '/tmp/quiver-ai-spec-gen',
  });

  assert.equal(manifest.slug, 'markdown-approved-plan');
  assert.equal(manifest.title, 'Markdown approved plan');
  assert.deepEqual(manifest.slices.map((slice) => slice.slice_id), ['slice-00-spec-foundation', 'slice-01-markdown-core']);
});

test('buildSpecGenerationManifest rejects plans without structured slices', () => {
  const markdown = [
    '# Free form plan',
    '',
    '## Objective',
    '',
    'This plan has no structured slice data.',
  ].join('\n');

  assert.throws(
    () => buildSpecGenerationManifest({
      inputText: markdown,
      inputPath: 'docs/free-form-plan.md',
      repoRoot: '/tmp/quiver-ai-spec-gen',
    }),
    /approved technical plan must include a structured slices array/,
  );
});

test('buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies', () => {
  const base = approvedPlanManifest();

  assert.throws(
    () => buildSpecGenerationManifest({
      inputText: JSON.stringify({
        spec: {
          ...base.spec,
          slices: [
            { slice_id: 'slice-01-dup', title: 'One', objective: 'one' },
            { slice_id: 'slice-01-dup', title: 'Two', objective: 'two' },
          ],
        },
      }),
      inputPath: 'docs/approved-plan.json',
      repoRoot: '/tmp/quiver-ai-spec-gen',
    }),
    /duplicate slice_id 'slice-01-dup'/,
  );

  assert.throws(
    () => buildSpecGenerationManifest({
      inputText: JSON.stringify({
        spec: {
          ...base.spec,
          slices: [
            { slice_id: 'slice-01-needs-missing', title: 'Missing dep', objective: 'missing', depends_on: ['slice-99-missing'] },
          ],
        },
      }),
      inputPath: 'docs/approved-plan.json',
      repoRoot: '/tmp/quiver-ai-spec-gen',
    }),
    /depends on missing slice 'slice-99-missing'/,
  );

  assert.throws(
    () => buildSpecGenerationManifest({
      inputText: JSON.stringify({
        spec: {
          ...base.spec,
          slices: [
            { slice_id: 'slice-01-a', title: 'A', objective: 'a', depends_on: ['slice-02-b'] },
            { slice_id: 'slice-02-b', title: 'B', objective: 'b', depends_on: ['slice-01-a'] },
          ],
        },
      }),
      inputPath: 'docs/approved-plan.json',
      repoRoot: '/tmp/quiver-ai-spec-gen',
    }),
    /dependency cycle: slice-01-a -> slice-02-b -> slice-01-a/,
  );
});

test('generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions', () => {
  const repo = makeRepo({
    'docs/approved-plan.json': `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
  });

  try {
    const result = generateSpecArtifacts(repo.root, { input: 'docs/approved-plan.json' });
    const specDir = path.join(repo.root, 'specs', 'quiver-v21-approved-spec');

    assert.equal(result.specDir, specDir);
    assert.ok(fs.existsSync(path.join(specDir, 'SPEC.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'STATUS.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EVIDENCE_REPORT.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EXECUTION_PLAN.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'pr.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-01-spec-generator-core', 'slice.json')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-02-spec-cli-plumbing', 'slice.json')));

    const specText = fs.readFileSync(path.join(specDir, 'SPEC.md'), 'utf8');
    assert.ok(specText.includes('slice-00-spec-foundation'));
    assert.ok(specText.includes('Every later slice depends on slice-00'));

    const executionPlan = fs.readFileSync(path.join(specDir, 'EXECUTION_PLAN.md'), 'utf8');
    assert.ok(executionPlan.includes('Group 1 after slice-00-spec-foundation'));
    assert.ok(executionPlan.includes('slice-01-spec-generator-core'));
    assert.ok(executionPlan.includes('slice-02-spec-cli-plumbing'));

    const firstSlice = JSON.parse(fs.readFileSync(path.join(specDir, 'slices', 'slice-01-spec-generator-core', 'slice.json'), 'utf8'));
    assert.deepEqual(firstSlice.depends_on, ['slice-00-spec-foundation']);
    assert.deepEqual(firstSlice.expected_read_paths, ['docs/approved-plan.json', 'src/create-quiver/lib/ai/spec-templates.js']);
    assert.deepEqual(firstSlice.allowed_write_paths, ['src/create-quiver/lib/ai/spec-generator.js']);
    assert.deepEqual(firstSlice.validation_hints, ['node --test tests/lib/ai-spec-generator.test.js', 'git diff --check']);

    const secondSlice = JSON.parse(fs.readFileSync(path.join(specDir, 'slices', 'slice-02-spec-cli-plumbing', 'slice.json'), 'utf8'));
    assert.deepEqual(secondSlice.allowed_write_paths, ['src/create-quiver/commands/ai.js']);
    assert.deepEqual(secondSlice.validation_hints, ['node --test tests/commands/ai-plan-spec-phase.test.js']);

    const executionBrief = fs.readFileSync(path.join(specDir, 'slices', 'slice-01-spec-generator-core', 'EXECUTION_BRIEF.md'), 'utf8');
    assert.ok(executionBrief.includes('## Expected read paths'));
    assert.ok(executionBrief.includes('## Allowed write paths'));
    assert.ok(executionBrief.includes('## Validation hints'));

    assert.throws(
      () => generateSpecArtifacts(repo.root, { input: 'docs/approved-plan.json' }),
      (error) => String(error.message || error).includes('spec directory already exists'),
    );
  } finally {
    repo.cleanup();
  }
});

test('generateSpecArtifacts fails before writing when structured slices are missing', () => {
  const repo = makeRepo({
    'docs/free-form-plan.md': '# Free form plan\n\nNo structured slices here.\n',
  });

  try {
    assert.throws(
      () => generateSpecArtifacts(repo.root, { input: 'docs/free-form-plan.md', specSlug: 'free-form-plan' }),
      /approved technical plan must include a structured slices array/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'free-form-plan')), false);
    assert.equal(
      fs.existsSync(path.join(repo.root, 'specs'))
        ? fs.readdirSync(path.join(repo.root, 'specs')).some((entry) => entry.includes('free-form-plan-build'))
        : false,
      false,
    );
  } finally {
    repo.cleanup();
  }
});

test('governed spec generation publishes one digest-bound manifest and derives all projections from it', () => {
  const repo = makeRepo({});

  try {
    const fixture = governedPlanFixture(repo.root);
    const manifest = buildSpecGenerationManifest({
      inputText: fixture.context.inputText,
      inputPath: fixture.context.inputPath,
      repoRoot: repo.root,
      governanceContext: fixture.context,
    });
    const result = generateSpecArtifacts(repo.root, { manifest });
    const specDir = result.specDir;
    const governance = JSON.parse(fs.readFileSync(path.join(specDir, 'GOVERNANCE_MANIFEST.json'), 'utf8'));

    assert.equal(governance.kind, 'quiver-planning-governance');
    assert.equal(governance.schema_version, 1);
    assert.equal(governance.decision.decision, 'approved-with-conditions');
    assert.equal(governance.dispositions[0].target, 'slice:slice-01-spec-generator-core');
    assert.equal(governance.dispositions[0].criterion_binding.acceptance_ref, 'AC-TP-01');
    const digestInput = { ...governance };
    delete digestInput.manifest_sha256;
    const { canonicalSha256 } = require('../../src/create-quiver/lib/ai/review-governance');
    assert.equal(governance.manifest_sha256, canonicalSha256(digestInput));

    const foundation = JSON.parse(fs.readFileSync(
      path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json'),
      'utf8',
    ));
    assert.ok(foundation.files.includes(
      `specs/${manifest.slug}/GOVERNANCE_MANIFEST.json`,
    ));

    const sliceDir = path.join(specDir, 'slices', 'slice-01-spec-generator-core');
    const slice = JSON.parse(fs.readFileSync(path.join(sliceDir, 'slice.json'), 'utf8'));
    assert.deepEqual(slice.planning_governance, {
      schema_version: 1,
      manifest: '../../GOVERNANCE_MANIFEST.json',
      manifest_sha256: governance.manifest_sha256,
      target: { kind: 'slice', id: 'slice-01-spec-generator-core' },
      pending_finding_ids: ['F-001'],
    });
    for (const name of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
      const text = fs.readFileSync(path.join(sliceDir, name), 'utf8');
      assert.match(text, new RegExp(GOVERNANCE_MARKER_BEGIN));
      assert.match(text, /## Pending governance findings/);
      assert.match(text, /`F-001`/);
      assert.match(text, new RegExp(GOVERNANCE_MARKER_END));
    }
    const specText = fs.readFileSync(path.join(specDir, 'SPEC.md'), 'utf8');
    assert.match(specText, /## Governance Traceability/);
    assert.equal(
      specText.split(governanceTraceabilityMarkerBegin(governance.manifest_sha256)).length - 1,
      1,
    );
    assert.equal(specText.split(GOVERNANCE_TRACEABILITY_MARKER_END).length - 1, 1);
    assert.match(fs.readFileSync(path.join(specDir, 'pr.md'), 'utf8'), /`F-001`/);
    assert.ok(result.files.some((file) => file.endsWith('GOVERNANCE_MANIFEST.json')));
  } finally {
    repo.cleanup();
  }
});

test('governance projections escape marker, newline, and backtick injection without changing the manifest', () => {
  const repo = makeRepo({});
  const evidence = [
    'First line',
    '`command`',
    '<!-- quiver-governance:end -->',
    '<!-- quiver-governance-traceability:end -->',
  ].join('\n');

  try {
    const fixture = governedPlanFixture(repo.root, approvedPlanManifest(), {
      evidenceObligations: [evidence],
    });
    const manifest = buildSpecGenerationManifest({
      inputText: fixture.context.inputText,
      inputPath: fixture.context.inputPath,
      repoRoot: repo.root,
      governanceContext: fixture.context,
    });
    const result = generateSpecArtifacts(repo.root, { manifest });
    const governance = JSON.parse(
      fs.readFileSync(path.join(result.specDir, 'GOVERNANCE_MANIFEST.json'), 'utf8'),
    );

    assert.deepEqual(governance.dispositions[0].evidence_obligations, [evidence]);

    const projectedPaths = [
      path.join(result.specDir, 'slices', 'slice-01-spec-generator-core', 'EXECUTION_BRIEF.md'),
      path.join(result.specDir, 'slices', 'slice-01-spec-generator-core', 'CLOSURE_BRIEF.md'),
      path.join(result.specDir, 'pr.md'),
    ];
    for (const projectedPath of projectedPaths) {
      const text = fs.readFileSync(projectedPath, 'utf8');
      assert.equal(text.split(GOVERNANCE_MARKER_BEGIN).length - 1, 1);
      assert.equal(text.split(GOVERNANCE_MARKER_END).length - 1, 1);
      assert.ok(text.includes(
        'First line ⏎ &#96;command&#96; ⏎ &lt;!-- quiver-governance:end --&gt;',
      ));
      assert.equal(text.includes(evidence), false);
    }
    const specText = fs.readFileSync(path.join(result.specDir, 'SPEC.md'), 'utf8');
    assert.equal(
      specText.split(governanceTraceabilityMarkerBegin(governance.manifest_sha256)).length - 1,
      1,
    );
    assert.equal(specText.split(GOVERNANCE_TRACEABILITY_MARKER_END).length - 1, 1);
    assert.ok(specText.includes('&lt;!-- quiver-governance-traceability:end --&gt;'));
    assert.equal(specText.includes(evidence), false);
  } finally {
    repo.cleanup();
  }
});

test('criterion binding preserves exact bytes while resolving parser-normalized approved content', () => {
  const repo = makeRepo({});
  const criterionContent = 'AC-TP-01 preserves the transferred finding.\n  ';

  try {
    const fixture = governedPlanFixture(repo.root, approvedPlanManifest(), { criterionContent });
    const manifest = buildSpecGenerationManifest({
      inputText: fixture.context.inputText,
      inputPath: fixture.context.inputPath,
      repoRoot: repo.root,
      governanceContext: fixture.context,
    });
    assert.equal(manifest.slices[1].acceptance[0], criterionContent.trim());
    assert.equal(manifest.governance.dispositions[0].criterion_binding.content, criterionContent);
    assert.equal(
      manifest.governance.dispositions[0].criterion_binding.criterion_sha256,
      `sha256:${crypto.createHash('sha256').update(criterionContent, 'utf8').digest('hex')}`,
    );

    const duplicateSource = approvedPlanManifest();
    duplicateSource.spec.slices[1].acceptance = [criterionContent.trim()];
    const duplicateFixture = governedPlanFixture(repo.root, duplicateSource, { criterionContent });
    assert.throws(
      () => buildSpecGenerationManifest({
        inputText: duplicateFixture.context.inputText,
        inputPath: duplicateFixture.context.inputPath,
        repoRoot: repo.root,
        governanceContext: duplicateFixture.context,
      }),
      (error) => error.code === 'REPRESENTATION_MISMATCH',
    );
  } finally {
    repo.cleanup();
  }
});

test('governance target ambiguity fails before any spec artifact is published', () => {
  const repo = makeRepo({});
  const source = approvedPlanManifest();
  source.spec.slices = [
    { ...source.spec.slices[0], slice_id: 'slice-01-first' },
    { ...source.spec.slices[1], slice_id: 'slice-01-second' },
  ];

  try {
    const fixture = governedPlanFixture(repo.root, source, { target: 'slice-01' });
    assert.throws(
      () => generateSpecArtifacts(repo.root, {
        input: fixture.context.inputPath,
        sourceRoot: repo.root,
        governanceContext: fixture.context,
      }),
      (error) => error.code === 'DISPOSITION_UNRESOLVED',
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs')), false);
  } finally {
    repo.cleanup();
  }
});

test('canonical governance root resolves the primary checkout from a linked worktree', () => {
  const primary = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-primary-checkout-'));
  const linked = `${primary}-linked`;
  try {
    execFileSync('git', ['init', '-b', 'main'], { cwd: primary, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'quiver-tests@example.invalid'], { cwd: primary });
    execFileSync('git', ['config', 'user.name', 'Quiver Tests'], { cwd: primary });
    writeFile(path.join(primary, 'README.md'), 'fixture\n');
    execFileSync('git', ['add', 'README.md'], { cwd: primary });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: primary, stdio: 'ignore' });
    execFileSync('git', ['worktree', 'add', '-b', 'feature/fixture', linked], { cwd: primary, stdio: 'ignore' });

    assert.equal(resolveCanonicalProjectRoot(linked), fs.realpathSync(primary));
  } finally {
    if (fs.existsSync(linked)) {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', linked], { cwd: primary, stdio: 'ignore' });
      } catch {
        fs.rmSync(linked, { recursive: true, force: true });
      }
    }
    fs.rmSync(primary, { recursive: true, force: true });
  }
});
