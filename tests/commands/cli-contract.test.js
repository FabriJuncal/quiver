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
  assert.match(output, /changelog\s+Show recent local CHANGELOG\.md release entries/);
  assert.match(output, /demo create spec-viewer\s+Create or preview the optional static Quiver Spec Viewer demo scaffold/);
});

test('help output documents important public commands', () => {
  const output = runCli(['--help']);
  const expectedCommands = [
    'init',
    'version',
    'changelog',
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
    'ai analyze-project',
    'ai onboard',
    'ai prepare-context',
    'ai agent set|list|show|doctor|repair',
    'ai models list',
    'ai plan',
    'ai revise',
    'ai repair-plan',
    'ai review-plan',
    'ai approve',
    'ai approval <show|verify|export>',
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
    'findings transfer|disposition',
    'slice start|check|pr|scope|cleanup|refresh-active',
    'handoff check|new',
    'start-slice',
    'check-slice',
    'check-pr',
    'check-scope',
    'cleanup-slice',
    'refresh-active-slices',
    'check-handoff',
    'new-handoff',
    'evidence run',
    'evidence list',
    'evidence show',
    'demo create spec-viewer',
    '--version / -V',
    '--help / help',
    'quiver',
  ];

  for (const command of expectedCommands) {
    assert.match(output, new RegExp(`${command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\S`));
  }
  assert.match(output, /--dry-run\s+Preview .*ai agent set/);
  assert.match(output, /--max-files <n>\s+For ai analyze-project, maximum files/);
  assert.match(output, /ai analyze-project apply --run <run-id>/);
  assert.match(output, /--apply-docs\s+For ai analyze-project, apply validated documentation proposals/);
  assert.match(output, /--save-proposal\s+For ai analyze-project, save a validated documentation proposal/);
  assert.match(output, /--diff\s+For ai analyze-project, show or save the proposed documentation diff/);
  assert.match(output, /--allow-dirty-docs\s+For ai analyze-project, allow dirty target docs checks/);
  assert.match(output, /--details\s+Show the full human dashboard report/);
  assert.match(output, /--format <name>\s+[^\n]*linear-comment/);
  assert.match(output, /--json\s+Emit machine-readable JSON/);
  assert.match(output, /--section <name>\s+Show one human dashboard section \(overview, specs, slices, blockers, warnings, agents, approvals, runs, active-slice, next-steps\)/);
  assert.match(output, /--limit <n>\s+Limit dashboard human lists/);
  assert.match(output, /--model <model-id>\s+Technical model id for AI agent profiles or provider-backed AI commands/);
  assert.match(output, /--governance-profile <fast-delivery\|high-assurance>\s+Request the v58 governance execution profile/);
  assert.match(output, /--phase <acceptance\|technical-plan>\s+\S/);
  assert.match(output, /--decision <name>\s+Approval decision: approved or approved-with-conditions/);
  assert.match(output, /--conditions-file <file>\s+Canonical condition disposition envelope for approved-with-conditions/);
  assert.match(output, /--reason-file <file>\s+Repository-relative reason file for approved-with-conditions/);
  assert.match(output, /--finding <id>\s+Canonical finding id for findings transfer/);
  assert.match(output, /--to <target>\s+Canonical phase or exact-one slice target/);
  assert.match(output, /--criterion-file <file>\s+Repository-relative UTF-8 criterion source/);
  assert.match(output, /--evidence-obligation <text>\s+Required downstream evidence/);
  assert.match(output, /--file <file>\s+Repository-relative JSON batch for findings disposition/);
  assert.match(output, /--run <id>\s+AI lifecycle run id/);
  assert.match(output, /--lang <en\|es>\s+Override CLI human output language/);
  assert.match(output, /--global\s+For config language set, write the global user config/);
  assert.match(output, /--yes\s+Skip prompts and confirm write prompts such as migrate/);
  assert.match(output, /ai agent set planner --provider codex --model gpt-5\.5 --dry-run/);
  assert.match(output, /ai approval show --phase acceptance --run <run-id>/);
  assert.match(output, /ai approval verify --phase acceptance --run <run-id> --json/);
  assert.match(output, /ai approval export --phase acceptance --run <run-id> --format linear-comment/);
  assert.match(output, new RegExp(`npx --yes create-quiver@${packageJson.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ai prompt-slice`));
});

test('ai approval accepts the singular verify contract and emits a clean JSON runtime error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-approval-contract-'));
  const result = runCliRaw([
    'ai',
    'approval',
    'verify',
    '--phase',
    'acceptance',
    '--run',
    'missing-run',
    '--format',
    'linear-comment',
    '--json',
  ], { cwd: tmp });

  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    schema_version: 1,
    task: 'approval-verify',
    ok: false,
    status: 'error',
    code: 'AI_RUN_REQUIRED',
    error: {
      message: "AI run 'missing-run' does not exist.",
      details: {
        run_id: 'missing-run',
      },
    },
  });
});

test('ai approval rejects missing or unsupported singular subcommands', () => {
  for (const [args, expected] of [
    [['ai', 'approval'], /unsupported ai approval subcommand: \(missing\)\. Supported tasks: show, verify, export/],
    [['ai', 'approval', 'watch'], /unsupported ai approval subcommand: watch\. Supported tasks: show, verify, export/],
  ]) {
    const result = runCliRaw(args);

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, expected);
  }
});

test('approval value flags reject a following flag as a missing value', () => {
  const cases = [
    { args: ['ai', 'approve', '--decision', '--json'], flag: '--decision' },
    { args: ['ai', 'approve', '--conditions-file', '--json'], flag: '--conditions-file' },
    { args: ['ai', 'approve', '--reason-file', '--json'], flag: '--reason-file' },
    { args: ['ai', 'approval', 'verify', '--phase', '--json'], flag: '--phase' },
    { args: ['ai', 'approval', 'verify', '--run', '--json'], flag: '--run' },
    { args: ['ai', 'approval', 'export', '--format', '--json'], flag: '--format' },
  ];

  for (const { args, flag } of cases) {
    const result = runCliRaw(args);

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`create-quiver: missing value for ${flag}`));
  }
});

test('findings namespace validates its public subcommands and value flags before mutation', () => {
  for (const [args, expected] of [
    [['findings'], /unsupported findings subcommand: \(missing\)\. Supported tasks: transfer, disposition/],
    [['findings', 'watch'], /unsupported findings subcommand: watch\. Supported tasks: transfer, disposition/],
    [['findings', 'transfer', '--finding', '--json'], /missing value for --finding/],
    [['findings', 'transfer', '--to', '--json'], /missing value for --to/],
    [['findings', 'transfer', '--criterion-file', '--json'], /missing value for --criterion-file/],
    [['findings', 'transfer', '--evidence-obligation', '--json'], /missing value for --evidence-obligation/],
    [['findings', 'disposition'], /findings disposition requires --file <file>/],
  ]) {
    const result = runCliRaw(args);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, expected);
  }
});

test('findings JSON runtime failures use one machine envelope and no stderr prose', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-findings-contract-'));
  const result = runCliRaw([
    'findings',
    'transfer',
    '--finding',
    'F-001',
    '--to',
    'slice-03',
    '--criterion-file',
    'criterion.md',
    '--evidence-obligation',
    'Record evidence.',
    '--json',
  ], { cwd: tmp });

  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.task, 'findings-transfer');
  assert.equal(output.ok, false);
  assert.equal(output.status, 'error');
  assert.equal(output.code, 'AI_RUN_REQUIRED');
});

test('ai approve rejects decisions outside the public approval vocabulary', () => {
  const result = runCliRaw(['ai', 'approve', '--decision', 'rejected']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /invalid approval decision 'rejected'; expected approved or approved-with-conditions/);
});

test('governance profile flag rejects unknown profile names before command execution', () => {
  const result = runCliRaw(['ai', 'review-plan', '--governance-profile', 'turbo', '--dry-run']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid governance profile 'turbo'; expected fast-delivery or high-assurance/);
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
  assert.match(output, /ai analyze-project apply --run <run-id>/);
  assert.match(output, /--lang <en\|es>/);
  assert.match(output, /--apply-docs\s+En ai analyze-project, aplica propuestas de documentacion validadas/);
  assert.match(output, /--save-proposal\s+En ai analyze-project, guarda una propuesta de documentacion validada/);
  assert.match(output, /--diff\s+En ai analyze-project, muestra o guarda el diff de documentacion propuesto/);
  assert.match(output, /--allow-dirty-docs\s+En ai analyze-project, permite checks de docs destino con cambios/);
  assert.match(output, /Anula el idioma de la salida humana del CLI/);
  assert.match(output, /--yes\s+Omite prompts y confirma escrituras como migrate/);
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
