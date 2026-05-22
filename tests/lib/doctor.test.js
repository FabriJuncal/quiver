const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  collectEnvironmentWarnings,
  collectLayoutReport,
} = require('../../src/create-quiver/lib/doctor');
const { formatActionableError } = require('../../src/create-quiver/lib/actionable-error');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-doctor-layout-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function writeFile(root, relativePath, content = '') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(root, relativePath, data) {
  writeFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

function seedNewLayout(root) {
  writeFile(root, 'README.md', '# Project\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeJson(root, 'package.json', { name: 'project', scripts: { 'quiver:doctor': 'npx create-quiver doctor' } });
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeJson(root, '.quiver/state.json', {
    initialized_version: '0.9.0',
    last_initialized_at: '2026-05-20T00:00:00.000Z',
  });
  writeJson(root, '.quiver/config.json', { layout_version: 1 });
  writeFile(root, '.quiver/.gitignore', 'cache/\nevidence/\nruns/\nworktrees/\n');
}

function seedLegacyLayout(root) {
  writeFile(root, 'docs-template/scripts/init-docs.sh', '#!/usr/bin/env bash\n');
  writeFile(root, 'tools/scripts/start-slice.sh', '#!/usr/bin/env bash\n');
  writeFile(root, 'tools/scripts/check-slice-readiness.sh', '#!/usr/bin/env bash\n');
  writeFile(root, 'tools/scripts/check-pr-readiness.sh', '#!/usr/bin/env bash\n');
  writeFile(root, '.github/pull_request_template.md', '# PR\n');
  writeFile(root, 'docs/INDEX.md', '# Index\n');
  writeFile(root, 'specs/legacy-project/SPEC.md', '# Spec\n');
  writeFile(root, 'specs/legacy-project/STATUS.md', '# Status\n');
  writeFile(root, 'specs/legacy-project/EVIDENCE_REPORT.md', '# Evidence\n');
  writeJson(root, 'specs/legacy-project/slices/slice-template/slice.json', {
    slice_id: 'slice-template',
    status: 'draft',
  });
}

test('collectLayoutReport detects a new no-spec layout as valid', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    seedNewLayout(dir);
    const report = collectLayoutReport(dir);

    assert.equal(report.layout, 'new');
    assert.equal(report.hasNewLayout, true);
    assert.deepEqual(report.specSlugs, []);
    assert(report.recommendations.some((item) => item.includes('No specs yet')));
  } finally {
    cleanup();
  }
});

test('collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts', () => {
  const legacy = makeTmpDir();
  const hybrid = makeTmpDir();
  const incomplete = makeTmpDir();

  try {
    seedLegacyLayout(legacy.dir);
    assert.equal(collectLayoutReport(legacy.dir).layout, 'legacy');

    seedNewLayout(hybrid.dir);
    seedLegacyLayout(hybrid.dir);
    assert.equal(collectLayoutReport(hybrid.dir).layout, 'hybrid');

    writeJson(incomplete.dir, '.quiver/state.json', {
      initialized_version: '0.9.0',
      last_initialized_at: '2026-05-20T00:00:00.000Z',
    });
    const incompleteReport = collectLayoutReport(incomplete.dir);
    assert.equal(incompleteReport.layout, 'incomplete');
    assert(incompleteReport.missingNewLayoutFiles.includes('README.md'));
  } finally {
    legacy.cleanup();
    hybrid.cleanup();
    incomplete.cleanup();
  }
});

test('collectEnvironmentWarnings reports missing tools, auth, and spaced paths', () => {
  const { dir, cleanup } = makeTmpDir();
  const spacedRoot = path.join(dir, 'project with spaces');
  fs.mkdirSync(spacedRoot, { recursive: true });

  try {
    const warnings = collectEnvironmentWarnings(spacedRoot, {
      runner(command, args) {
        if (command === 'node' || command === 'npm' || command === 'git') {
          return { status: 0, stdout: `${command} ok`, stderr: '' };
        }
        if (command === 'gh' && args[0] === '--version') {
          return { status: 0, stdout: 'gh ok', stderr: '' };
        }
        if (command === 'gh' && args[0] === 'auth') {
          return { status: 1, stdout: '', stderr: 'not logged in' };
        }
        return { error: Object.assign(new Error('missing'), { code: 'ENOENT' }) };
      },
    });

    assert(warnings.some((warning) => warning.includes('gh auth check failed')));
    assert(warnings.some((warning) => warning.includes('path contains spaces')));
  } finally {
    cleanup();
  }
});

test('collectEnvironmentWarnings reports missing gh with cross-platform guidance', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const warnings = collectEnvironmentWarnings(dir, {
      runner(command) {
        if (command === 'gh') {
          return { error: Object.assign(new Error('missing'), { code: 'ENOENT' }) };
        }
        return { status: 0, stdout: `${command} ok`, stderr: '' };
      },
    });

    const ghWarning = warnings.find((warning) => warning.includes('gh check failed'));
    assert.ok(ghWarning);
    assert.match(ghWarning, /macOS/);
    assert.match(ghWarning, /Linux/);
    assert.match(ghWarning, /Windows/);
  } finally {
    cleanup();
  }
});

test('formatActionableError includes failure, impact, fix, and next command', () => {
  const output = formatActionableError({
    failure: 'missing fixture matrix',
    impact: 'validation can regress silently',
    fix: 'add the required fixture states',
    nextCommand: 'npm run smoke:doctor-fixtures',
  });

  assert.match(output, /^create-quiver: missing fixture matrix/);
  assert.match(output, /Impact: validation can regress silently/);
  assert.match(output, /Fix: add the required fixture states/);
  assert.match(output, /Next command: npm run smoke:doctor-fixtures/);
});
