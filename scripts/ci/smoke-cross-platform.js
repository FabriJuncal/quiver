#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const repoRoot = cp.execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const cli = path.join(repoRoot, 'bin', 'create-quiver.js');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-cross-smoke-'));
const fixtureRoot = path.join(repoRoot, 'tests', 'fixtures', 'workflow-gates');
const slicePath = path.join('specs', 'quiver-v03-adoption-verification', 'slices', 'slice-02-workflow-gate-fixtures', 'slice.json');
const prPath = path.join('specs', 'quiver-v03-adoption-verification', 'slices', 'slice-02-workflow-gate-fixtures', 'pr.md');

function cleanup() {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

function run(command, args, options = {}) {
  return cp.execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function runNodeCli(cwd, args, options = {}) {
  return run('node', [cli, ...args], { cwd, ...options });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(filePath) {
  assert(fs.existsSync(filePath), `Missing expected file: ${filePath}`);
}

function assertContains(text, needle, label) {
  assert(text.includes(needle), `${label} did not contain: ${needle}`);
}

function assertPackageScripts(packageJsonPath, label, scripts) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const missing = scripts.filter((name) => typeof pkg.scripts?.[name] !== 'string');
  assert(missing.length === 0, `${label}: missing npm scripts: ${missing.join(', ')}`);
}

function assertProjectMapSections(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const expected = [
    '## Suggested Reading Order',
    '## Entry Points',
    '## Primary Config Files',
    '## Likely Test Commands',
    '## High-Signal Files',
    '## Do Not Read First',
  ];

  for (const needle of expected) {
    assert(text.includes(needle), `Project map missing section: ${needle}`);
  }
}

function countNonEmptyLines(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .length;
}

function cloneRepo(dest) {
  run('git', ['clone', '--quiet', repoRoot, dest]);
  run('git', ['config', 'user.name', 'Quiver Smoke'], { cwd: dest });
  run('git', ['config', 'user.email', 'smoke@example.com'], { cwd: dest });
  return dest;
}

function seedWorkflowFixtures(repoDir, includePr = true) {
  const sliceDest = path.join(repoDir, slicePath);
  fs.mkdirSync(path.dirname(sliceDest), { recursive: true });
  fs.copyFileSync(path.join(fixtureRoot, 'slice-ready.json'), sliceDest);

  if (includePr) {
    const prDest = path.join(repoDir, prPath);
    fs.mkdirSync(path.dirname(prDest), { recursive: true });
    fs.copyFileSync(path.join(fixtureRoot, 'pr-good.md'), prDest);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function packInstaller() {
  const packDir = path.join(tempRoot, 'pack');
  const cacheDir = path.join(tempRoot, 'npm-cache');
  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  const output = run('npm', ['pack', '--json', '--pack-destination', packDir], {
    cwd: repoRoot,
    env: { ...process.env, npm_config_cache: cacheDir },
  });
  const parsed = JSON.parse(output);
  return path.join(packDir, parsed[0].filename);
}

function initProject(targetRoot, projectName) {
  runNodeCli(repoRoot, ['--name', projectName, '--dir', targetRoot]);
}

function assertNodeNativeScripts(packageJsonPath, label) {
  assertPackageScripts(packageJsonPath, label, [
    'quiver:migrate',
    'quiver:analyze',
    'quiver:doctor',
    'quiver:start-slice',
    'quiver:check-slice',
    'quiver:check-pr',
    'quiver:cleanup-slice',
    'quiver:check-scope',
    'quiver:refresh-active-slices',
  ]);
}

function prepareCompletedSlice(repoDir) {
  const sliceFile = path.join(repoDir, slicePath);
  const json = readJson(sliceFile);
  json.status = 'completed';
  json.started_at = '2026-04-20T00:00:00Z';
  json.completed_at = '2026-04-20T00:30:00Z';
  json.actual_hours = 1;
  writeJson(sliceFile, json);
  run('git', ['add', slicePath], { cwd: repoDir });
  run('git', ['commit', '-m', 'test: complete workflow gate slice'], { cwd: repoDir });
  run('git', ['update-ref', 'refs/remotes/origin/develop', 'HEAD^'], { cwd: repoDir });
}

function runSmoke() {
  const newProject = path.join(tempRoot, 'new-project');
  const legacyProject = path.join(tempRoot, 'legacy-project');
  const startRepo = path.join(tempRoot, 'start-repo');
  const readyRepo = path.join(tempRoot, 'ready-repo');
  const prRepo = path.join(tempRoot, 'pr-repo');
  const installerRoot = path.join(tempRoot, 'installer');
  const releaseProject = path.join(tempRoot, 'release-project');

  fs.mkdirSync(newProject, { recursive: true });
  fs.mkdirSync(legacyProject, { recursive: true });

  initProject(newProject, 'Smoke Project');
  assertFile(path.join(newProject, 'README.md'));
  assertFile(path.join(newProject, 'AGENTS.md'));
  assertFile(path.join(newProject, 'docs', 'AI_CONTEXT.md'));
  assertFile(path.join(newProject, 'docs', 'AI_ONBOARDING_PROMPT.md'));
  assertFile(path.join(newProject, 'docs', 'ai', 'QUICK.md'));
  assertFile(path.join(newProject, 'docs', 'ai', 'STANDARD.md'));
  assertFile(path.join(newProject, 'docs', 'ai', 'DEEP.md'));
  assertFile(path.join(newProject, '.quiver', 'state.json'));
  assertNodeNativeScripts(path.join(newProject, 'package.json'), 'new project');
  assertPackageScripts(path.join(newProject, 'package.json'), 'new project', [
    'check:slice',
    'check:pr',
    'start:slice',
    'cleanup:slice',
    'check:scope',
    'refresh:active-slices',
    'migrate',
  ]);

  const doctorBefore = runNodeCli(newProject, ['doctor']);
  assertContains(doctorBefore, 'npx create-quiver analyze', 'doctor before analyze');
  assert(!doctorBefore.includes('Run migration first'), 'doctor before analyze should not require migration');

  runNodeCli(newProject, ['analyze']);
  const doctorAfter = runNodeCli(newProject, ['doctor']);
  assertContains(doctorAfter, 'Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it.', 'doctor after analyze');
  assertContains(doctorAfter, 'npx create-quiver start-slice', 'doctor after analyze');
  assertContains(fs.readFileSync(path.join(newProject, 'AGENTS.md'), 'utf8'), '## Reading Budget', 'AGENTS.md');
  assertFile(path.join(newProject, 'docs', 'PROJECT_SCAN.json'));
  assertFile(path.join(newProject, 'docs', 'PROJECT_MAP.md'));
  assertProjectMapSections(path.join(newProject, 'docs', 'PROJECT_MAP.md'));
  assertContains(fs.readFileSync(path.join(newProject, 'docs', 'INDEX.md'), 'utf8'), './ai/QUICK.md', 'docs index');
  assertContains(fs.readFileSync(path.join(newProject, 'docs', 'INDEX.md'), 'utf8'), './ai/STANDARD.md', 'docs index');
  assertContains(fs.readFileSync(path.join(newProject, 'docs', 'INDEX.md'), 'utf8'), './ai/DEEP.md', 'docs index');
  assert(countNonEmptyLines(path.join(newProject, 'docs', 'ai', 'QUICK.md')) <= 50, 'QUICK.md exceeds 50 non-empty lines');
  assert(countNonEmptyLines(path.join(newProject, 'docs', 'ai', 'STANDARD.md')) <= 300, 'STANDARD.md exceeds 300 non-empty lines');
  assert(readJson(path.join(newProject, '.quiver', 'state.json')).last_analysis_at, 'analysis metadata missing after analyze');

  initProject(legacyProject, 'Legacy Repo');
  const legacyPackage = path.join(legacyProject, 'package.json');
  const legacyPkg = readJson(legacyPackage);
  delete legacyPkg.scripts['quiver:migrate'];
  delete legacyPkg.scripts['quiver:analyze'];
  delete legacyPkg.scripts['quiver:doctor'];
  delete legacyPkg.scripts['quiver:start-slice'];
  delete legacyPkg.scripts['quiver:check-slice'];
  delete legacyPkg.scripts['quiver:check-pr'];
  delete legacyPkg.scripts['quiver:cleanup-slice'];
  delete legacyPkg.scripts['quiver:check-scope'];
  delete legacyPkg.scripts['quiver:refresh-active-slices'];
  legacyPkg.scripts.lint = 'echo lint';
  writeJson(legacyPackage, legacyPkg);
  fs.rmSync(path.join(legacyProject, '.quiver', 'state.json'));
  fs.rmSync(path.join(legacyProject, 'docs', 'AI_ONBOARDING_PROMPT.md'));
  fs.rmSync(path.join(legacyProject, 'tools', 'scripts', 'migrate-project.sh'));
  fs.writeFileSync(path.join(legacyProject, 'AGENTS.md'), 'keep me\n');
  let migrateBefore = '';
  try {
    migrateBefore = runNodeCli(legacyProject, ['doctor']);
  } catch (error) {
    migrateBefore = String(error.stderr || error.stdout || error.message || '');
  }
  assertContains(migrateBefore, 'Run migration first: npx create-quiver migrate', 'doctor before migrate');
  runNodeCli(legacyProject, ['migrate']);
  assertPackageScripts(legacyPackage, 'legacy project after migrate', [
    'quiver:migrate',
    'quiver:analyze',
    'quiver:doctor',
    'quiver:start-slice',
    'quiver:check-slice',
    'quiver:check-pr',
    'quiver:cleanup-slice',
    'quiver:check-scope',
    'quiver:refresh-active-slices',
  ]);
  assert(readJson(path.join(legacyProject, '.quiver', 'state.json')).last_migration_at, 'migration metadata missing');
  assertContains(fs.readFileSync(path.join(legacyProject, 'AGENTS.md'), 'utf8'), 'keep me', 'legacy AGENTS.md');
  assertFile(path.join(legacyProject, 'docs', 'AI_ONBOARDING_PROMPT.md'));
  assertFile(path.join(legacyProject, 'docs', 'ai', 'QUICK.md'));
  assertFile(path.join(legacyProject, 'docs', 'ai', 'STANDARD.md'));
  assertFile(path.join(legacyProject, 'docs', 'ai', 'DEEP.md'));
  assert(readJson(legacyPackage).scripts.lint === 'echo lint', 'custom user script was not preserved');

  cloneRepo(startRepo);
  seedWorkflowFixtures(startRepo, false);
  run('git', ['branch', 'develop', 'HEAD'], { cwd: startRepo });
  const startEnv = { ...process.env, SLICE_WORKTREES_DIR: path.join(tempRoot, 'worktrees-start') };
  const activeSlicePath = path.join(startRepo, 'docs', 'ai', 'ACTIVE_SLICE.md');
  const worktreePath = path.join(tempRoot, 'worktrees-start', 'feature-QUIVER-02-workflow-gate-fixtures');

  const startOutput = runNodeCli(startRepo, ['start-slice', '--allow-draft', slicePath], { env: startEnv });
  assertContains(startOutput, 'Slice listo para trabajar.', 'start-slice output');
  assertContains(startOutput, 'Base: develop', 'start-slice output');
  assertFile(activeSlicePath);
  assertContains(fs.readFileSync(activeSlicePath, 'utf8'), '## allowed_files', 'ACTIVE_SLICE');
  assertContains(fs.readFileSync(activeSlicePath, 'utf8'), 'Definition of Done', 'ACTIVE_SLICE');
  assertContains(fs.readFileSync(path.join(worktreePath, 'WORKTREE_CONTEXT.md'), 'utf8'), 'docs/ai/ACTIVE_SLICE.md', 'WORKTREE_CONTEXT');

  const startAgainOutput = runNodeCli(startRepo, ['start-slice', '--allow-draft', slicePath], { env: startEnv });
  assertContains(startAgainOutput, 'Reemplazando docs/ai/ACTIVE_SLICE.md existente.', 'start-slice replacement');
  assertFile(activeSlicePath);

  const cleanupOutput = runNodeCli(startRepo, ['cleanup-slice', '--discard', slicePath], { env: startEnv });
  assertContains(cleanupOutput, 'PASS: Cleanup finalizado', 'cleanup-slice output');
  assertContains(cleanupOutput, 'PASS: ACTIVE_SLICE.md eliminado', 'cleanup-slice output');
  assert(!fs.existsSync(activeSlicePath), 'ACTIVE_SLICE.md should be removed after cleanup');

  const startAfterCleanup = runNodeCli(startRepo, ['start-slice', '--allow-draft', slicePath], { env: startEnv });
  assertContains(startAfterCleanup, 'Slice listo para trabajar.', 'start-slice output after cleanup');
  assertFile(activeSlicePath);
  fs.rmSync(activeSlicePath);
  const cleanupMissingOutput = runNodeCli(startRepo, ['cleanup-slice', '--discard', slicePath], { env: startEnv });
  assertContains(cleanupMissingOutput, 'PASS: Cleanup finalizado', 'cleanup-slice output when active slice missing');
  assert(!fs.existsSync(activeSlicePath), 'ACTIVE_SLICE.md should stay removed when cleanup runs without it');

  cloneRepo(readyRepo);
  seedWorkflowFixtures(readyRepo, false);
  run('git', ['branch', 'develop', 'HEAD'], { cwd: readyRepo });
  const readyOutput = runNodeCli(readyRepo, ['check-slice', '--gate', 'ready', slicePath]);
  assertContains(readyOutput, 'PASS: Gate ready', 'check-slice output');

  cloneRepo(prRepo);
  seedWorkflowFixtures(prRepo, true);
  run('git', ['switch', '-C', 'feature/QUIVER-02-workflow-gate-fixtures'], { cwd: prRepo });
  run('git', ['reset', '--hard'], { cwd: prRepo });
  run('git', ['clean', '-fd'], { cwd: prRepo });
  prepareCompletedSlice(prRepo);
  const prOutput = runNodeCli(prRepo, ['check-pr', slicePath]);
  assertContains(prOutput, 'PASS: Gate PR listo', 'check-pr output');
  const scopeOutput = runNodeCli(prRepo, ['check-scope', slicePath]);
  assertContains(scopeOutput, 'PASS: Todos los archivos tocados', 'check-scope output');

  const tarball = packInstaller();
  fs.mkdirSync(installerRoot, { recursive: true });
  run('npm', ['install', '--prefix', installerRoot, tarball, '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: repoRoot,
    env: { ...process.env, npm_config_cache: path.join(tempRoot, 'npm-cache-install') },
  });

  run('node', [path.join(installerRoot, 'node_modules', 'create-quiver', 'bin', 'create-quiver.js'), '--name', 'Packaged Project', '--dir', releaseProject], {
    cwd: repoRoot,
  });
  run('node', [path.join(installerRoot, 'node_modules', 'create-quiver', 'bin', 'create-quiver.js'), 'analyze'], {
    cwd: releaseProject,
  });
  const releaseDoctor = run('node', [path.join(installerRoot, 'node_modules', 'create-quiver', 'bin', 'create-quiver.js'), 'doctor'], {
    cwd: releaseProject,
  });
  assertContains(releaseDoctor, 'Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it.', 'packaged doctor');
  assertFile(path.join(releaseProject, 'docs', 'PROJECT_SCAN.json'));
  assertFile(path.join(releaseProject, 'AGENTS.md'));
  assertFile(path.join(releaseProject, 'docs', 'PROJECT_MAP.md'));
  assertProjectMapSections(path.join(releaseProject, 'docs', 'PROJECT_MAP.md'));
  assertFile(path.join(releaseProject, 'docs', 'ai', 'QUICK.md'));
  assertFile(path.join(releaseProject, 'docs', 'ai', 'STANDARD.md'));
  assertFile(path.join(releaseProject, 'docs', 'ai', 'DEEP.md'));
  assert(countNonEmptyLines(path.join(releaseProject, 'docs', 'ai', 'QUICK.md')) <= 50, 'packaged QUICK.md exceeds 50 non-empty lines');
  assert(countNonEmptyLines(path.join(releaseProject, 'docs', 'ai', 'STANDARD.md')) <= 300, 'packaged STANDARD.md exceeds 300 non-empty lines');

  console.log('create-quiver cross-platform smoke passed');
}

runSmoke();
