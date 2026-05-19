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
          tests: ['node --test tests/lib/ai-spec-generator.test.js'],
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

    assert.throws(
      () => generateSpecArtifacts(repo.root, { input: 'docs/approved-plan.json' }),
      (error) => String(error.message || error).includes('spec directory already exists'),
    );
  } finally {
    repo.cleanup();
  }
});
