const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { persistInitLanguage, resolveInteractiveInitOptions, runMigrate } = require('../../src/create-quiver');

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

function runCliRaw(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function snapshotTree(root) {
  const snapshot = {};
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile()) {
        snapshot[relative] = fs.readFileSync(absolute, 'utf8');
      }
    }
  }
  if (fs.existsSync(root)) {
    visit(root);
  }
  return snapshot;
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

test('init --interactive resolves guided choices without writing by itself', async () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  const writes = [];
  const selected = [];

  try {
    const result = await resolveInteractiveInitOptions({
      dryRun: false,
      force: true,
      initFull: false,
      initIncludeTemplates: false,
      initLegacyScripts: false,
      initMinimal: false,
      interactive: true,
      methodology: '',
      noColor: true,
    }, target, 'Interactive Project', {
      language: 'es',
      promptSelect: async (message) => {
        selected.push(message);
        if (message.includes('configurar')) return 'existing';
        if (message.includes('metodologia')) return 'wdd-sdd';
        if (message.includes('idioma')) return 'es';
        if (message.includes('contrato')) return 'minimal';
        return 'show';
      },
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      write: (text) => writes.push(text),
    });

    assert.equal(result.action, 'init');
    assert.equal(result.methodology, 'wdd-sdd');
    assert.equal(result.minimal, true);
    assert.equal(result.full, false);
    assert.deepEqual(selected, [
      'Que queres configurar?',
      'Que metodologia vas a usar?',
      'Que idioma del CLI debe usar este proyecto?',
      'Que contrato inicial queres crear?',
      'Queres ver el proximo paso para perfiles de agentes?',
    ]);
    assert.ok(writes.some((line) => line.includes('Bienvenido a Quiver')));
    assert.ok(writes.some((line) => line.includes('Metodologia: WDD + SDD')));
    assert.ok(writes.some((line) => line.includes('Idioma: es')));
    assert.ok(writes.some((line) => line.includes('ai agent set planner')));
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('init --interactive keeps or changes existing project language without dropping config keys', async () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  const configPath = path.join(target, '.quiver', 'config.json');
  const selected = [];

  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify({ layout_version: 1, language: 'es', custom: true }, null, 2)}\n`);

    const result = await resolveInteractiveInitOptions({
      dryRun: false,
      force: true,
      initFull: false,
      initIncludeTemplates: false,
      initLegacyScripts: false,
      initMinimal: false,
      interactive: true,
      methodology: '',
      noColor: true,
    }, target, 'Existing Language Project', {
      language: 'en',
      promptSelect: async (message) => {
        selected.push(message);
        if (message.includes('What do you want')) return 'existing';
        if (message.includes('Which methodology')) return 'wdd-sdd';
        if (message.includes('Which CLI language')) return 'en';
        if (message.includes('Which initial contract')) return 'default';
        return 'skip';
      },
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      write: () => {},
    });

    assert.equal(result.language, 'en');
    persistInitLanguage(target, result);

    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(saved, {
      layout_version: 1,
      language: 'en',
      custom: true,
    });
    assert.ok(selected.includes('Which CLI language should this project use?'));
  } finally {
    cleanup();
  }
});

test('init --interactive dry-run resolves intended language without writing config', async () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');

  try {
    const result = await resolveInteractiveInitOptions({
      dryRun: true,
      force: false,
      initFull: false,
      initIncludeTemplates: false,
      initLegacyScripts: false,
      initMinimal: false,
      interactive: true,
      methodology: '',
      noColor: true,
    }, target, 'Dry Language Project', {
      language: 'en',
      promptSelect: async (message) => {
        if (message.includes('What do you want')) return 'new';
        if (message.includes('Which methodology')) return 'wdd-sdd';
        if (message.includes('Which CLI language')) return 'es';
        if (message.includes('Which initial contract')) return 'minimal';
        return 'skip';
      },
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      write: () => {},
    });

    assert.equal(result.language, 'es');
    assert.equal(fs.existsSync(path.join(target, '.quiver', 'config.json')), false);
  } finally {
    cleanup();
  }
});

test('init --interactive rejects non-TTY automation with explicit flag guidance', async () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    await assert.rejects(
      resolveInteractiveInitOptions({
        dryRun: false,
        force: false,
        initFull: false,
        initIncludeTemplates: false,
        initLegacyScripts: false,
        initMinimal: false,
        interactive: true,
        methodology: '',
        noColor: true,
      }, path.join(dir, 'target'), 'No TTY Project', {
        stdinIsTTY: false,
        stdoutIsTTY: false,
        stderrIsTTY: false,
      }),
      /init --interactive requires an interactive TTY/,
    );
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
    const output = runCli(['init', '--name', 'Real Project', '--dir', target, '--skip-install']);

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
    assert.doesNotMatch(output, /Preparing packaged templates/);
    assert.doesNotMatch(output, /Writing init docs/);
    assert.doesNotMatch(output, /Checking create-quiver package install/);
  } finally {
    cleanup();
  }
});

test('init generated human docs follow --lang and keep machine artifacts stable', () => {
  const { dir, cleanup } = makeTmpDir();
  const enTarget = path.join(dir, 'target-en');
  const esTarget = path.join(dir, 'target-es');
  try {
    runCli(['--lang', 'en', 'init', '--name', 'Language Project', '--dir', enTarget, '--skip-install']);
    runCli(['--lang', 'es', 'init', '--name', 'Language Project', '--dir', esTarget, '--skip-install']);

    assert.match(readText(enTarget, path.join('docs', 'INDEX.md')), /Documentation Index/);
    assert.match(readText(esTarget, path.join('docs', 'INDEX.md')), /Indice de documentacion/);
    assert.match(readText(esTarget, 'AGENTS.md'), /# Agentes de Language Project/);
    assert.match(readText(esTarget, path.join('docs', 'AI_CONTEXT.md')), /# Contexto IA de Language Project/);

    assert.deepEqual(readPackageJson(esTarget).scripts, readPackageJson(enTarget).scripts);
    assert.equal(readPackageJson(esTarget).name, readPackageJson(enTarget).name);
    assert.equal(JSON.parse(readText(esTarget, path.join('.quiver', 'config.json'))).language, 'es');
  } finally {
    cleanup();
  }
});

test('init uses existing project language config for generated docs without --lang', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    fs.mkdirSync(path.join(target, '.quiver'), { recursive: true });
    fs.writeFileSync(path.join(target, '.quiver', 'config.json'), `${JSON.stringify({
      layout_version: 1,
      language: 'es',
      custom: true,
    }, null, 2)}\n`);

    runCli(['init', '--name', 'Configured Project', '--dir', target, '--skip-install']);

    assert.match(readText(target, path.join('docs', 'INDEX.md')), /Indice de documentacion/);
    const config = JSON.parse(readText(target, path.join('.quiver', 'config.json')));
    assert.deepEqual({
      layout_version: config.layout_version,
      language: config.language,
      custom: config.custom,
    }, {
      layout_version: 1,
      language: 'es',
      custom: true,
    });
    assert.equal(config.governance.schema_version, 1);
    assert.equal(config.governance.requested_profile, 'fast-delivery');
    assert.equal(config.governance.policy.authorization.default_effect, 'deny');
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

test('migrate --yes reports legacy layout paths and preserves existing legacy files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    fs.mkdirSync(path.join(target, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(target, 'docs', 'PROJECT_SCAN.json'), '{"legacy":true}\n');
    fs.writeFileSync(path.join(target, 'docs', 'SEARCH.md'), 'keep me\n');

    const output = runCli(['migrate', '--dir', target, '--yes', '--skip-install']);

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

test('migrate without --yes is safe and actionable in no-TTY automation', async () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    const before = snapshotTree(target);

    const result = runCliRaw(['migrate', '--dir', target, '--skip-install']);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /migrate writes require confirmation/);
    assert.match(result.stderr, /migrate --dry-run/);
    assert.match(result.stderr, /--yes/);
    assert.deepEqual(snapshotTree(target), before);

    const jsonResult = runCliRaw(['migrate', '--dir', target, '--json', '--skip-install']);

    assert.equal(jsonResult.status, 1);
    assert.equal(jsonResult.stderr, '');
    const jsonError = JSON.parse(jsonResult.stdout);
    assert.equal(jsonError.task, 'migrate');
    assert.equal(jsonError.ok, false);
    assert.equal(jsonError.code, 'COMMAND_FAILED');
    assert.match(jsonError.error.message, /migrate writes require confirmation/);
    assert.deepEqual(snapshotTree(target), before);

    await assert.rejects(
      () => runMigrate(target, {
        language: 'es',
        skipInstall: true,
        stdinIsTTY: false,
        stdoutIsTTY: false,
      }),
      /migrate requiere confirmacion antes de modificar archivos/,
    );
    assert.deepEqual(snapshotTree(target), before);
  } finally {
    cleanup();
  }
});

test('migrate cancellation leaves the tree unchanged before side effects', async () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    const before = snapshotTree(target);

    await assert.rejects(
      () => runMigrate(target, {
        promptConfirm: () => false,
        skipInstall: true,
        stdinIsTTY: true,
        stdoutIsTTY: true,
      }),
      /migrate canceled\. No files were written\./,
    );

    assert.deepEqual(snapshotTree(target), before);
  } finally {
    cleanup();
  }
});

test('migrate --dry-run reports planned changes without writing', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    const statePath = path.join(target, '.quiver', 'state.json');
    const beforeState = fs.readFileSync(statePath, 'utf8');

    const output = runCli(['migrate', '--dir', target, '--dry-run', '--skip-install']);

    assert.match(output, /Quiver migration dry-run/);
    assert.match(output, /Writes: none/);
    assert.match(output, /Next command: npx create-quiver migrate --skip-install/);
    assert.equal(fs.readFileSync(statePath, 'utf8'), beforeState);
  } finally {
    cleanup();
  }
});

test('migrate --dry-run supports Spanish human output without translating commands', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Legacy Project', '--dir', target, '--full', '--skip-install']);
    const statePath = path.join(target, '.quiver', 'state.json');
    const beforeState = fs.readFileSync(statePath, 'utf8');

    const output = runCli(['--lang', 'es', 'migrate', '--dir', target, '--dry-run', '--skip-install']);

    assert.match(output, /Dry-run de migracion de Quiver/);
    assert.match(output, /Escrituras: ninguna/);
    assert.match(output, /Proximo comando: npx create-quiver migrate --skip-install/);
    assert.equal(fs.readFileSync(statePath, 'utf8'), beforeState);
  } finally {
    cleanup();
  }
});

test('migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');

  try {
    runCli(['init', '--name', 'Migration Contract Project', '--dir', target, '--full', '--skip-install']);
    const configPath = path.join(target, '.quiver', 'config.json');
    const legacyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    delete legacyConfig.governance.compatibility;
    fs.writeFileSync(configPath, `${JSON.stringify(legacyConfig, null, 2)}\n`);
    fs.rmSync(path.join(target, '.quiver', 'state.json'));

    const beforeDryRun = snapshotTree(target);
    const dryRun = runCliRaw(['migrate', '--dir', target, '--dry-run', '--json', '--skip-install']);
    assert.equal(dryRun.status, 0);
    assert.equal(dryRun.stderr, '');
    const dryRunReport = JSON.parse(dryRun.stdout);
    assert.equal(dryRunReport.status, 'dry-run');
    assert.equal(dryRunReport.migration_status, 'apply');
    assert.equal(dryRunReport.writes, 0);
    assert.deepEqual(snapshotTree(target), beforeDryRun);

    const apply = runCliRaw(['migrate', '--dir', target, '--yes', '--json', '--skip-install']);
    assert.equal(apply.status, 0);
    assert.equal(apply.stderr, '');
    const applyReport = JSON.parse(apply.stdout);
    assert.equal(applyReport.status, 'applied');
    assert.equal(applyReport.post_verification.status, 'passed');
    assert.equal(applyReport.compatibility.status, 'v58-verified');

    const afterApply = snapshotTree(target);
    const reapply = runCliRaw(['migrate', '--dir', target, '--yes', '--json', '--skip-install']);
    assert.equal(reapply.status, 0);
    assert.equal(reapply.stderr, '');
    const reapplyReport = JSON.parse(reapply.stdout);
    assert.equal(reapplyReport.status, 'already-current');
    assert.equal(reapplyReport.writes, 0);
    assert.equal(reapplyReport.post_verification.status, 'passed');
    assert.deepEqual(snapshotTree(target), afterApply);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.governance.compatibility.writer_mode = 'read-only';
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const rollbackCurrent = snapshotTree(target);
    const rollbackDoctor = runCliRaw(['doctor', '--json'], { cwd: target });
    assert.equal(rollbackDoctor.status, 0);
    assert.equal(rollbackDoctor.stderr, '');
    const rollbackDoctorReport = JSON.parse(rollbackDoctor.stdout);
    assert.equal(rollbackDoctorReport.code, 'GOVERNANCE_READ_ONLY');
    assert.equal(rollbackDoctorReport.compatibility.status, 'rollback-read-only');
    assert.deepEqual(snapshotTree(target), rollbackCurrent);

    for (const command of [
      ['ai', 'status', '--json'],
      ['ai', 'approvals', '--json'],
    ]) {
      const reader = runCliRaw(command, { cwd: target });
      assert.equal(reader.status, 0);
      assert.equal(reader.stderr, '');
      const readerReport = JSON.parse(reader.stdout);
      assert.equal(readerReport.code, 'GOVERNANCE_READ_ONLY');
      assert.equal(readerReport.projection.next_command, 'npx create-quiver doctor --json');
    }
    const rollbackFlow = runCliRaw(['flow', '--json'], { cwd: target });
    assert.equal(rollbackFlow.status, 0);
    assert.equal(rollbackFlow.stderr, '');
    const rollbackFlowReport = JSON.parse(rollbackFlow.stdout);
    assert.equal(rollbackFlowReport.facts.governance.code, 'GOVERNANCE_READ_ONLY');
    assert.equal(rollbackFlowReport.next_command, 'npx create-quiver doctor --json');

    const rollbackGate = runCliRaw([
      'check-slice', '--local', '--json', 'missing-slice.json',
    ], { cwd: target });
    assert.equal(rollbackGate.status, 1);
    assert.equal(rollbackGate.stderr, '');
    assert.equal(JSON.parse(rollbackGate.stdout).code, 'GOVERNANCE_READ_ONLY');
    assert.deepEqual(snapshotTree(target), rollbackCurrent);

    const rollbackDryRun = runCliRaw(['migrate', '--dir', target, '--dry-run', '--json', '--skip-install']);
    assert.equal(rollbackDryRun.status, 0);
    assert.equal(rollbackDryRun.stderr, '');
    const rollbackDryRunReport = JSON.parse(rollbackDryRun.stdout);
    assert.equal(rollbackDryRunReport.status, 'dry-run');
    assert.equal(rollbackDryRunReport.migration_status, 'already-current');
    assert.equal(rollbackDryRunReport.writes, 0);
    assert.deepEqual(snapshotTree(target), rollbackCurrent);

    const rollbackReapply = runCliRaw(['migrate', '--dir', target, '--yes', '--json', '--skip-install']);
    assert.equal(rollbackReapply.status, 0);
    assert.equal(rollbackReapply.stderr, '');
    const rollbackReapplyReport = JSON.parse(rollbackReapply.stdout);
    assert.equal(rollbackReapplyReport.status, 'already-current');
    assert.equal(rollbackReapplyReport.writes, 0);
    assert.equal(rollbackReapplyReport.compatibility.status, 'rollback-read-only');
    assert.deepEqual(snapshotTree(target), rollbackCurrent);

    fs.rmSync(path.join(target, 'docs', 'COMMANDS.md'));
    const rollbackWithDelta = snapshotTree(target);
    const blockedApply = runCliRaw(['migrate', '--dir', target, '--yes', '--json', '--skip-install']);
    assert.equal(blockedApply.status, 1);
    assert.equal(blockedApply.stderr, '');
    const blockedReport = JSON.parse(blockedApply.stdout);
    assert.equal(blockedReport.code, 'GOVERNANCE_READ_ONLY');
    assert.deepEqual(snapshotTree(target), rollbackWithDelta);

    const packagePath = path.join(target, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageData.devDependencies = {
      ...(packageData.devDependencies || {}),
      'create-quiver': '0.1.0',
    };
    fs.writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);
    const unsafeWriterTree = snapshotTree(target);

    const unsafeDoctor = runCliRaw(['doctor', '--json'], { cwd: target });
    assert.equal(unsafeDoctor.status, 1);
    assert.equal(unsafeDoctor.stderr, '');
    assert.equal(JSON.parse(unsafeDoctor.stdout).code, 'UNSAFE_WRITER_DOWNGRADE');

    const unsafeWriter = runCliRaw([
      'ai', 'run', 'create', '--input', 'requirements.md', '--json',
    ], { cwd: target });
    assert.equal(unsafeWriter.status, 1);
    assert.equal(unsafeWriter.stderr, '');
    assert.equal(JSON.parse(unsafeWriter.stdout).code, 'UNSAFE_WRITER_DOWNGRADE');

    const unsafeGate = runCliRaw([
      'check-slice', '--local', '--json', 'missing-slice.json',
    ], { cwd: target });
    assert.equal(unsafeGate.status, 1);
    assert.equal(unsafeGate.stderr, '');
    assert.equal(JSON.parse(unsafeGate.stdout).code, 'UNSAFE_WRITER_DOWNGRADE');
    assert.deepEqual(snapshotTree(target), unsafeWriterTree);

    delete packageData.devDependencies['create-quiver'];
    fs.writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);
    config.governance.compatibility.writer_mode = 'read-write';
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    const statePath = path.join(target, '.quiver', 'state.json');
    const validState = fs.readFileSync(statePath);

    fs.writeFileSync(statePath, '{invalid-state\n');
    const invalidStateTree = snapshotTree(target);
    const invalidState = runCliRaw(['migrate', '--dir', target, '--dry-run', '--json', '--skip-install']);
    assert.equal(invalidState.status, 1);
    assert.equal(invalidState.stderr, '');
    assert.equal(JSON.parse(invalidState.stdout).code, 'MIGRATION_VERIFICATION_FAILED');
    assert.deepEqual(snapshotTree(target), invalidStateTree);

    fs.writeFileSync(statePath, validState);
    fs.writeFileSync(packagePath, '{invalid-package\n');
    const invalidPackageTree = snapshotTree(target);
    const invalidPackage = runCliRaw(['migrate', '--dir', target, '--dry-run', '--json', '--skip-install']);
    assert.equal(invalidPackage.status, 1);
    assert.equal(invalidPackage.stderr, '');
    assert.equal(JSON.parse(invalidPackage.stdout).code, 'MIGRATION_VERIFICATION_FAILED');
    assert.deepEqual(snapshotTree(target), invalidPackageTree);
  } finally {
    cleanup();
  }
});
