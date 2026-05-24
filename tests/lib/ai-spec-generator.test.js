const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildSpecGenerationManifest,
  generateSpecArtifacts,
  parseApprovedManifest,
} = require('../../src/create-quiver/lib/ai/spec-generator');

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
