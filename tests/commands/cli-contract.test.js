const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../../package.json');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runCliRaw(args, options = {}) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('top-level --version prints the installed package version', () => {
  assert.equal(runCli(['--version']).trim(), packageJson.version);
});

test('top-level -V prints the installed package version', () => {
  assert.equal(runCli(['-V']).trim(), packageJson.version);
});

test('version command prints human and JSON metadata without changing semver flags', () => {
  const human = runCli(['version', '--no-color']);
  const json = JSON.parse(runCli(['version', '--json']));

  assert.match(human, /Quiver CLI:/);
  assert.match(human, /Node:/);
  assert.match(human, /Package manager:/);
  assert.doesNotMatch(human, /\u001b\[/);
  assert.equal(json.version_schema_version, 1);
  assert.equal(json.cli.version, packageJson.version);
  assert.equal(json.runtime.node, process.version);
});

test('local quiver alias points to the same CLI entrypoint', () => {
  assert.equal(packageJson.bin.quiver, packageJson.bin['create-quiver']);
  assert.equal(packageJson.bin.quiver, 'bin/create-quiver.js');
});

test('top-level help command prints grouped command descriptions', () => {
  const output = runCli(['help']);

  assert.match(output, /Commands:/);
  assert.match(output, /Bootstrap and project context:/);
  assert.match(output, /AI lifecycle:/);
  assert.match(output, /Specs, slices, and validation:/);
  assert.match(output, /init\s+Create the default AI-first Quiver contract/);
  assert.match(output, /ai plan\s+Generate versioned planner drafts/);
  assert.match(output, /ai agent set\|list\|show\|doctor\|repair\s+Manage, diagnose, and dry-run repair planner, executor, reviewer, and doctor provider profiles without secrets\./);
  assert.match(output, /ai models list\s+List provider\/model ids known by Quiver without claiming account availability\./);
  assert.match(output, /check-slice\s+Validate slice structure/);
  assert.match(output, /dashboard\s+Show compact read-only project, spec, slice, run, approval, and agent status\./);
  assert.match(output, /version\s+Show a Quiver-branded version report/);
  assert.match(output, /demo create spec-viewer\s+Create or preview the optional static Quiver Spec Viewer demo scaffold/);
});

test('help output documents important public commands', () => {
  const output = runCli(['--help']);
  const expectedCommands = [
    'init',
    'version',
    'config language show|set',
    'analyze',
    'doctor',
    'flow',
    'dashboard',
    'prepare',
    'migrate',
    'plan',
    'graph',
    'next',
    'ai run create',
    'ai active-slice status|reconcile',
    'ai status',
    'ai resume',
    'ai onboard',
    'ai prepare-context',
    'ai agent set|list|show|doctor|repair',
    'ai models list',
    'ai plan',
    'ai revise',
    'ai repair-plan',
    'ai review-plan',
    'ai approve',
    'ai approvals',
    'ai prompt-slice',
    'ai execute-slice',
    'ai execute-plan',
    'ai doctor',
    'ai pr',
    'ai inspect',
    'ai export',
    'ai specs list',
    'ai slices list',
    'ai trace report',
    'spec create',
    'spec start',
    'spec status',
    'spec validate',
    'spec close',
    'start-slice',
    'check-slice',
    'check-pr',
    'check-scope',
    'cleanup-slice',
    'refresh-active-slices',
    'check-handoff',
    'new-handoff',
    'evidence run',
    'demo create spec-viewer',
    '--version / -V',
    '--help / help',
    'quiver',
  ];

  for (const command of expectedCommands) {
    assert.match(output, new RegExp(`${command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\S`));
  }
  assert.match(output, /--dry-run\s+Preview .*ai agent set/);
  assert.match(output, /--details\s+Show the full human dashboard report/);
  assert.match(output, /--section <name>\s+Show one human dashboard section/);
  assert.match(output, /--limit <n>\s+Limit dashboard human lists/);
  assert.match(output, /--model <model-id>\s+Technical model id for AI agent profiles or provider-backed AI commands/);
  assert.match(output, /--lang <en\|es>\s+Override CLI human output language/);
  assert.match(output, /--global\s+For config language set, write the global user config/);
  assert.match(output, /ai agent set planner --provider codex --model gpt-5\.5 --dry-run/);
  assert.match(output, new RegExp(`npx --yes create-quiver@${packageJson.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ai prompt-slice`));
});

test('global --lang works before and after command names without changing JSON output', () => {
  const before = JSON.parse(runCli(['--lang', 'es', 'version', '--json']));
  const after = JSON.parse(runCli(['version', '--json', '--lang=en']));
  const inline = JSON.parse(runCli(['--lang=es', 'version', '--json']));

  assert.equal(before.version_schema_version, 1);
  assert.equal(after.version_schema_version, 1);
  assert.equal(inline.version_schema_version, 1);
  assert.equal(before.cli.version, packageJson.version);
  assert.equal(after.cli.version, packageJson.version);
  assert.equal(inline.cli.version, packageJson.version);
});

test('unsupported global --lang falls back without polluting JSON output', () => {
  const output = runCli(['--lang', 'fr', 'version', '--json']);
  const parsed = JSON.parse(output);

  assert.equal(parsed.version_schema_version, 1);
  assert.equal(parsed.cli.version, packageJson.version);
});

test('global --lang before help is accepted', () => {
  const output = runCli(['--lang', 'es', '--help']);

  assert.match(output, /Comandos:/);
  assert.match(output, /--lang <en\|es>/);
  assert.match(output, /Anula el idioma de la salida humana del CLI/);
});

test('help uses configured project language without requiring --lang', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-i18n-help-'));
  fs.mkdirSync(path.join(tmp, '.quiver'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.quiver', 'config.json'), JSON.stringify({ language: 'es' }, null, 2));

  const result = runCliRaw(['--help', '--no-color'], { cwd: tmp });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /Uso:/);
  assert.match(result.stdout, /Comandos:/);
  assert.match(result.stdout, /Opciones:/);
  assert.match(result.stdout, /Ejemplos:/);
  assert.match(result.stdout, /Nombre del proyecto a generar/);
  assert.match(result.stdout, /Emite JSON legible por maquinas/);
  assert.doesNotMatch(result.stdout, /Project name to generate/);
  assert.doesNotMatch(result.stdout, /Emit machine-readable JSON/);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test('ai approve --version remains a draft-version option', () => {
  assert.throws(
    () => runCli(['ai', 'approve', '--phase', 'technical-plan', '--version']),
    /create-quiver: missing value for --version/,
  );
});

test('global --lang requires a value', () => {
  assert.throws(
    () => runCli(['--lang', '--json']),
    /create-quiver: missing value for --lang/,
  );
});

test('early parser errors use the resolved language and keep JSON stdout empty', () => {
  const missingLang = runCliRaw(['--lang', '--json'], {
    env: { QUIVER_LANG: 'es' },
  });
  assert.notEqual(missingLang.status, 0);
  assert.equal(missingLang.stdout, '');
  assert.match(missingLang.stderr, /create-quiver: falta el valor de --lang/);

  const unknownFlag = runCliRaw(['--lang', 'es', '--unknown-flag']);
  assert.notEqual(unknownFlag.status, 0);
  assert.equal(unknownFlag.stdout, '');
  assert.match(unknownFlag.stderr, /create-quiver: flag no compatible: --unknown-flag/);
});

test('unsupported commands fail with localized actionable guidance', () => {
  assert.throws(
    () => runCli(['future-command']),
    (error) => {
      const output = `${error.stdout || ''}${error.stderr || ''}`;
      assert.match(output, /create-quiver: unsupported command: future-command/);
      assert.match(output, /Run: npx create-quiver --help/);
      assert.match(output, /npx create-quiver init --name "future-command"/);
      assert.match(output, /update create-quiver/);
      return true;
    },
  );

  const localized = runCliRaw(['--lang', 'es', 'future-command']);
  assert.notEqual(localized.status, 0);
  assert.match(localized.stderr, /create-quiver: comando no compatible: future-command/);
  assert.match(localized.stderr, /Ejecuta: npx create-quiver --help/);
  assert.match(localized.stderr, /npx create-quiver init --name "future-command"/);
});
