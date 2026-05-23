const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-demo-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runCliFailure(args, options = {}) {
  try {
    runCli(args, options);
  } catch (error) {
    return error;
  }

  throw new Error('Expected CLI command to fail');
}

test('demo create spec-viewer dry-run prints planned files without writing', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const target = path.join(dir, 'demo');
    const output = runCli(['demo', 'create', 'spec-viewer', '--dir', target, '--dry-run']);

    assert.match(output, /Quiver demo dry-run/);
    assert.match(output, /Demo: spec-viewer/);
    assert.match(output, /Files to create/);
    assert.match(output, /src\/index\.html/);
    assert.match(output, /No files were written/);
    assert.equal(fs.existsSync(path.join(target, 'package.json')), false);
  } finally {
    cleanup();
  }
});

test('demo create spec-viewer defaults to a nested target on dry-run', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const output = runCli(['demo', 'create', 'spec-viewer', '--dry-run'], { cwd: dir });

    assert.match(output, /Target: .*quiver-spec-viewer/);
    assert.equal(fs.existsSync(path.join(dir, 'quiver-spec-viewer')), false);
  } finally {
    cleanup();
  }
});

test('demo create spec-viewer writes a small runnable demo', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const target = path.join(dir, 'demo');
    const output = runCli(['demo', 'create', 'spec-viewer', '--dir', target]);

    assert.match(output, /Quiver demo created/);
    assert.equal(fs.existsSync(path.join(target, 'package.json')), true);
    assert.equal(fs.existsSync(path.join(target, '.quiver', 'state.json')), true);
    assert.equal(fs.existsSync(path.join(target, '.quiver', 'config.json')), true);
    assert.equal(fs.existsSync(path.join(target, 'AGENTS.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'AI_CONTEXT.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'server.js')), true);
    assert.equal(fs.existsSync(path.join(target, 'src', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(target, 'src', 'app.js')), true);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'quiver-spec-viewer', 'SPEC.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'quiver-spec-viewer', 'slices', 'slice-00-docs-foundation', 'EXECUTION_BRIEF.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'quiver-spec-viewer', 'slices', 'slice-01-static-spec-viewer', 'slice.json')), true);

    const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
    assert.equal(packageJson.scripts.start, 'node server.js');
    assert.equal(packageJson.scripts.validate, 'node scripts/validate-demo.js');
    assert.equal(packageJson.scripts['quiver:doctor'], 'npx create-quiver doctor');
    assert.equal(packageJson.scripts['quiver:plan'], 'npx create-quiver plan --spec quiver-spec-viewer');
    assert.equal(typeof packageJson.dependencies, 'undefined');

    const validation = execFileSync(process.execPath, ['scripts/validate-demo.js'], {
      cwd: target,
      encoding: 'utf8',
    });
    assert.match(validation, /demo validated/);

    const doctor = runCli(['doctor'], { cwd: target });
    assert.match(doctor, /Quiver doctor passed/);
    assert.doesNotMatch(doctor, /doctor requires a project previously initialized by Quiver/);

    const plan = runCli(['plan', '--spec', 'quiver-spec-viewer'], { cwd: target });
    const graph = runCli(['graph', '--spec', 'quiver-spec-viewer', '--format', 'mermaid'], { cwd: target });
    const next = runCli(['next', '--spec', 'quiver-spec-viewer'], { cwd: target });
    const brief = runCli(['check-handoff', 'specs/quiver-spec-viewer/slices/slice-01-static-spec-viewer/EXECUTION_BRIEF.md'], { cwd: target });

    assert.match(plan, /slice-01-static-spec-viewer/);
    assert.match(graph, /flowchart TD/);
    assert.match(next, /slice-01-static-spec-viewer/);
    assert.match(brief, /PASS: Execution brief validated/);
  } finally {
    cleanup();
  }
});

test('generated demo documents and implements occupied-port fallback without network fixtures', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const target = path.join(dir, 'demo');
    runCli(['demo', 'create', 'spec-viewer', '--dir', target]);
    const server = fs.readFileSync(path.join(target, 'server.js'), 'utf8');
    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');

    assert.match(server, /EADDRINUSE/);
    assert.match(server, /startServer\(port \+ 1, attempt \+ 1\)/);
    assert.match(server, /Set PORT to a free port/);
    assert.match(readme, /automatically tries the next ports/);
    assert.match(readme, /\$env:PORT = "4300"; npm start/);
  } finally {
    cleanup();
  }
});

test('demo create spec-viewer preserves existing files', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const target = path.join(dir, 'demo');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'README.md'), '# Existing demo\n');

    const output = runCli(['demo', 'create', 'spec-viewer', '--dir', target]);
    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');

    assert.match(output, /Files to preserve: 1/);
    assert.equal(readme, '# Existing demo\n');
    assert.equal(fs.existsSync(path.join(target, 'src', 'index.html')), true);
  } finally {
    cleanup();
  }
});

test('demo rejects unsupported names and subcommands clearly', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const badSubcommand = runCliFailure(['demo', 'show', 'spec-viewer'], { cwd: dir });
    const badName = runCliFailure(['demo', 'create', 'other-demo'], { cwd: dir });

    assert.equal(badSubcommand.status, 1);
    assert.match(String(badSubcommand.stderr), /unsupported demo subcommand: show/);
    assert.equal(badName.status, 1);
    assert.match(String(badName.stderr), /unsupported demo: other-demo/);
  } finally {
    cleanup();
  }
});
