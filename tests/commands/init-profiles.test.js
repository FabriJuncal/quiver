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
    assert.deepEqual(JSON.parse(readText(target, path.join('.quiver', 'config.json'))), {
      layout_version: 1,
      language: 'es',
      custom: true,
    });
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
    assert.equal(jsonResult.stdout, '');
    assert.match(jsonResult.stderr, /migrate writes require confirmation/);
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
