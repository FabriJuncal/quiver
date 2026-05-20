const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-analyze-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('analyze writes raw scan under .quiver and keeps project map visible', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
      name: 'scan-project',
      scripts: { test: 'node --test' },
    }, null, 2));

    const output = runCli(['analyze'], { cwd: projectRoot });

    assert.match(output, /Wrote \.quiver\/scans\/PROJECT_SCAN\.json/);
    assert.match(output, /Wrote docs\/PROJECT_MAP\.md/);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'scans', 'PROJECT_SCAN.json')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'PROJECT_MAP.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'PROJECT_SCAN.json')), false);

    const scan = JSON.parse(fs.readFileSync(path.join(projectRoot, '.quiver', 'scans', 'PROJECT_SCAN.json'), 'utf8'));
    assert.equal(scan.project.name, 'scan-project');
  } finally {
    cleanup();
  }
});
