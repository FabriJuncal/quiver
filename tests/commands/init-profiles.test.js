const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('init --dry-run prints the planned layout and does not write files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    const output = runCli(['init', '--name', 'Dry Project', '--dir', target, '--dry-run']);

    assert.match(output, /Init dry-run plan/);
    assert.match(output, /Project: Dry Project/);
    assert.match(output, /Entry point: explicit init command/);
    assert.match(output, /Profile: default/);
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('legacy --name alias supports dry-run without writing files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    const output = runCli(['--name', 'Alias Project', '--dir', target, '--dry-run']);

    assert.match(output, /Init dry-run plan/);
    assert.match(output, /Project: Alias Project/);
    assert.match(output, /Entry point: compatibility alias/);
    assert.match(output, /compatibility alias path used/);
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('unsupported subcommands fail clearly instead of initializing a project', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    let error;
    try {
      runCli(['prepare-context', '--dir', target]);
    } catch (caught) {
      error = caught;
    }

    assert.ok(error, 'expected unsupported command to fail');
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    assert.match(output, /unsupported command: prepare-context/);
    assert.match(output, /npx create-quiver --help/);
    assert.match(output, /npx create-quiver init --name "prepare-context"/);
    assert.match(output, /update create-quiver/);
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('init --dry-run reports requested profiles and optional assets', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const minimalOutput = runCli(['init', '--name', 'Minimal Project', '--dir', path.join(dir, 'minimal'), '--minimal', '--dry-run']);
    const fullOutput = runCli(['init', '--name', 'Full Project', '--dir', path.join(dir, 'full'), '--full', '--dry-run']);
    const optionalOutput = runCli([
      'init',
      '--name',
      'Optional Project',
      '--dir',
      path.join(dir, 'optional'),
      '--legacy-scripts',
      '--include-templates',
      '--dry-run',
    ]);

    assert.match(minimalOutput, /Profile: minimal/);
    assert.match(fullOutput, /Profile: full/);
    assert.match(fullOutput, /docs-template/);
    assert.match(optionalOutput, /tools\/scripts\/start-slice\.sh/);
    assert.match(optionalOutput, /\.quiver\/templates\//);
  } finally {
    cleanup();
  }
});

test('init rejects incompatible profile flags before writing files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    assert.throws(
      () => runCli(['init', '--name', 'Bad Project', '--dir', target, '--minimal', '--full', '--dry-run']),
      /--minimal and --full are mutually exclusive/,
    );
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

function readPackageJson(projectRoot) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
}

function readText(projectRoot, relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('init command without dry-run writes the default clean AI-first layout', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Real Project', '--dir', target, '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, 'README.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'AGENTS.md')), true);
    assert.equal(fs.existsSync(path.join(target, '.gitignore')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'AI_CONTEXT.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'AI_ONBOARDING_PROMPT.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'COMMANDS.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'WORKFLOW.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs-template')), false);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts')), false);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'real-project')), false);

    const pkg = readPackageJson(target);
    assert.equal(pkg.name, 'real-project');
    assert.equal(typeof pkg.scripts['quiver:ai:onboard'], 'string');
    assert.equal(typeof pkg.scripts['quiver:check-slice'], 'string');
    assert.equal(pkg.scripts['start:slice'], undefined);
    assert.equal(pkg.scripts.migrate, undefined);

    const gitignore = readText(target, '.gitignore');
    assert.match(gitignore, /^node_modules\/$/m);
    assert.match(gitignore, /^\.DS_Store$/m);
    assert.match(gitignore, /^dist\/$/m);
    assert.match(gitignore, /^coverage\/$/m);

    const index = readText(target, path.join('docs', 'INDEX.md'));
    assert.doesNotMatch(index, /MULTI_AGENT_WORKFLOW\.md/);
    assert.doesNotMatch(index, /ai\/QUICK\.md/);
    assert.doesNotMatch(index, /ai\/STANDARD\.md/);
    assert.doesNotMatch(index, /ai\/DEEP\.md/);
    assert.doesNotMatch(index, /\.\.\/specs\/real-project/);
    assert.doesNotMatch(index, /\.\/tools\//);
    assert.doesNotMatch(index, /\.\/archive\//);
  } finally {
    cleanup();
  }
});

test('init --minimal writes only the essential onboarding contract', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Minimal Project', '--dir', target, '--minimal', '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, 'README.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'AGENTS.md')), true);
    assert.equal(fs.existsSync(path.join(target, '.gitignore')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'AI_CONTEXT.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'AI_ONBOARDING_PROMPT.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'COMMANDS.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'WORKFLOW.md')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'INDEX.md')), false);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'SUPPORT_MATRIX.md')), false);
    assert.equal(fs.existsSync(path.join(target, 'docs-template')), false);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts')), false);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'minimal-project')), false);
  } finally {
    cleanup();
  }
});

test('init --full preserves the historical compatibility layout explicitly', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Full Project', '--dir', target, '--full', '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, 'docs-template')), true);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts')), true);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'full-project', 'slices', 'slice-template', 'slice.json')), true);

    const index = readText(target, path.join('docs', 'INDEX.md'));
    assert.match(index, /MULTI_AGENT_WORKFLOW\.md/);
    assert.match(index, /ai\/QUICK\.md/);
    assert.match(index, /ai\/STANDARD\.md/);
    assert.match(index, /ai\/DEEP\.md/);
    assert.match(index, /\.\.\/specs\/full-project/);

    const pkg = readPackageJson(target);
    assert.equal(pkg.name, 'full-project');
    assert.equal(typeof pkg.scripts['quiver:ai:onboard'], 'string');
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
  } finally {
    cleanup();
  }
});

test('init --legacy-scripts writes compatibility wrappers and package scripts without full extras', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Scripts Project', '--dir', target, '--legacy-scripts', '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts', 'start-slice.sh')), true);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts', 'migrate-project.sh')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs-template')), false);

    const pkg = readPackageJson(target);
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
    assert.equal(typeof pkg.scripts['quiver:check-slice'], 'string');
  } finally {
    cleanup();
  }
});

test('init --include-templates exports packaged templates under .quiver/templates only', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Templates Project', '--dir', target, '--include-templates', '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, '.quiver', 'templates')), true);
    assert.equal(fs.existsSync(path.join(target, '.quiver', 'templates', 'package.template.json')), true);
    assert.equal(fs.existsSync(path.join(target, 'docs-template')), false);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts')), false);
  } finally {
    cleanup();
  }
});

test('init preserves existing project files by default', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    fs.mkdirSync(path.join(target, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(target, 'README.md'), '# Keep README\n');
    fs.writeFileSync(path.join(target, 'docs', 'COMMANDS.md'), '# Keep Commands\n');

    runCli(['init', '--name', 'Existing Project', '--dir', target, '--skip-install']);

    assert.equal(fs.readFileSync(path.join(target, 'README.md'), 'utf8'), '# Keep README\n');
    assert.equal(fs.readFileSync(path.join(target, 'docs', 'COMMANDS.md'), 'utf8'), '# Keep Commands\n');
  } finally {
    cleanup();
  }
});

test('init merges root gitignore defaults without deleting existing entries', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, '.gitignore'), 'custom.log\nnode_modules\n');

    runCli(['init', '--name', 'Gitignore Project', '--dir', target, '--skip-install']);

    const gitignore = readText(target, '.gitignore');
    assert.match(gitignore, /^custom\.log$/m);
    assert.equal((gitignore.match(/^node_modules\/?$/gm) || []).length, 1);
    assert.match(gitignore, /^\.DS_Store$/m);
    assert.match(gitignore, /^dist\/$/m);
    assert.match(gitignore, /^coverage\/$/m);
  } finally {
    cleanup();
  }
});

test('migrate reports legacy layout paths and preserves existing legacy files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    fs.mkdirSync(path.join(target, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(target, 'docs', 'PROJECT_SCAN.json'), '{"legacy":true}\n');
    fs.writeFileSync(path.join(target, 'docs', 'SEARCH.md'), 'keep me\n');

    const output = runCli(['migrate', '--dir', target, '--skip-install']);

    assert.match(output, /Legacy layout detected and preserved:/);
    assert.match(output, /docs-template\//);
    assert.match(output, /tools\/scripts\//);
    assert.match(output, /docs\/PROJECT_SCAN\.json/);
    assert.equal(fs.readFileSync(path.join(target, 'docs', 'SEARCH.md'), 'utf8'), 'keep me\n');
    assert.equal(fs.readFileSync(path.join(target, 'docs', 'PROJECT_SCAN.json'), 'utf8'), '{"legacy":true}\n');
  } finally {
    cleanup();
  }
});
