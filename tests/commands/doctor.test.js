const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-doctor-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function writeFile(root, relativePath, content = '') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(root, relativePath, data) {
  writeFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

test('doctor accepts the new default init layout before specs exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'No Spec Project', '--dir', target, '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Quiver doctor passed/);
    assert.match(output, /Layout: new/);
    assert.match(output, /Specs: none yet/);
    assert.match(output, /No specs yet\. That is valid after the AI-first init flow\./);
    assert.match(output, /Create real specs and slices only after acceptance criteria and the technical plan are approved\./);
  } finally {
    cleanup();
  }
});

test('doctor reports a legacy layout with migration guidance', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    fs.mkdirSync(target, { recursive: true });
    writeJson(target, 'package.json', {
      name: 'legacy-project',
      scripts: {
        migrate: 'bash tools/scripts/migrate-project.sh',
        'start:slice': 'bash tools/scripts/start-slice.sh',
        'check:slice': 'bash tools/scripts/check-slice-readiness.sh',
        'check:pr': 'bash tools/scripts/check-pr-readiness.sh',
        'cleanup:slice': 'bash tools/scripts/cleanup-slice.sh',
        'check:scope': 'bash tools/scripts/check-scope.sh',
        'refresh:active-slices': 'bash tools/scripts/refresh-active-slices.sh',
      },
    });
    writeFile(target, 'docs-template/scripts/init-docs.sh', '#!/usr/bin/env bash\n');
    writeFile(target, '.github/pull_request_template.md', '# PR\n');
    writeFile(target, 'docs/INDEX.md', '# Index\n');
    writeFile(target, 'specs/legacy-project/SPEC.md', '# Spec\n');
    writeFile(target, 'specs/legacy-project/STATUS.md', '# Status\n');
    writeFile(target, 'specs/legacy-project/EVIDENCE_REPORT.md', '# Evidence\n');
    writeJson(target, 'specs/legacy-project/slices/slice-template/slice.json', {
      slice_id: 'slice-template',
      status: 'draft',
    });

    for (const file of [
      'tools/scripts/start-slice.sh',
      'tools/scripts/check-slice-readiness.sh',
      'tools/scripts/check-pr-readiness.sh',
      'tools/scripts/cleanup-slice.sh',
      'tools/scripts/check-scope.sh',
      'tools/scripts/refresh-active-slices.sh',
      'tools/scripts/migrate-project.sh',
    ]) {
      writeFile(target, file, '#!/usr/bin/env bash\n');
      fs.chmodSync(path.join(target, file), 0o755);
    }

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Layout: legacy/);
    assert.match(output, /Legacy layout detected\. Run `npx create-quiver migrate`/);
    assert.match(output, /Legacy signals:/);
  } finally {
    cleanup();
  }
});

test('doctor accepts the minimal init layout before specs exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Minimal Project', '--dir', target, '--minimal', '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Layout: new/);
    assert.match(output, /Specs: none yet/);
  } finally {
    cleanup();
  }
});

test('doctor reports a hybrid layout when explicit full compatibility assets exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Full Project', '--dir', target, '--full', '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Layout: hybrid/);
    assert.match(output, /Legacy signals:/);
    assert.match(output, /tools\/scripts\/start-slice\.sh/);
  } finally {
    cleanup();
  }
});
