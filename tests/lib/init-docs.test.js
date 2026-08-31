const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  applyProjectMigrationSurface,
  initializeProjectDocs,
  detectPackageManager,
  formatInstallSelfCommand,
  installSelfAsDevDep,
  preflightProjectMigration,
} = require('../../src/create-quiver/lib/init-docs');
const { buildDefaultGovernanceConfig } = require('../../src/create-quiver/lib/ai/review-governance');
const packageJson = require('../../package.json');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function writeFile(filePath, content = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeTemplateRoot() {
  const { dir, cleanup } = makeTmpDir();

  try {
    writeFile(path.join(dir, 'package.template.json'), JSON.stringify({ name: 'template-root', private: true }, null, 2));
    writeFile(path.join(dir, 'AGENTS.md.template'), 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
    writeFile(path.join(dir, 'docs', 'INDEX.md.template'), '# Index\n');
    writeFile(path.join(dir, 'docs', 'COMMANDS.md.template'), '# Commands\n');
    writeFile(path.join(dir, 'docs', 'AI_CONTEXT.md.template'), '# AI Context\n');
    writeFile(path.join(dir, 'docs', 'AI_ONBOARDING_PROMPT.md.template'), '# AI Onboarding Prompt\n');
    writeFile(path.join(dir, 'docs', 'CONTEXTO.md.template'), '# Contexto\n');
    writeFile(path.join(dir, 'docs', 'STATUS.md.template'), '# Status\n');
    writeFile(path.join(dir, 'docs', 'WORKFLOW.md.template'), '# Workflow\n');
    writeFile(path.join(dir, 'docs', 'SUPPORT_MATRIX.md.template'), '# Support Matrix\n');
    writeFile(path.join(dir, 'docs', 'TROUBLESHOOTING.md.template'), '# Troubleshooting\n');
    writeFile(path.join(dir, 'docs', 'DECISIONS.md.template'), '# Decisions\n');
    writeFile(path.join(dir, 'docs', 'ai', 'LESSONS.md.template'), '# Lessons\n');
    writeFile(path.join(dir, 'docs', 'ai', 'PRINCIPLES.md'), '# Principles\n');
    writeFile(path.join(dir, 'docs', 'ai', 'RULES.yaml'), 'rules: []\n');
    writeFile(path.join(dir, 'docs', 'QUICK.md.template'), '# Quick\n');
    writeFile(path.join(dir, 'docs', 'STANDARD.md.template'), '# Standard\n');
    writeFile(path.join(dir, 'docs', 'DEEP.md.template'), '# Deep\n');
    writeFile(path.join(dir, 'docs', 'examples', 'plan.md.template'), '# Plan Example\n');
    writeFile(path.join(dir, 'docs', 'examples', 'graph.md.template'), '# Graph Example\n');
    writeFile(path.join(dir, 'docs', 'examples', 'next.md.template'), '# Next Example\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'SPEC.md.template'), '# Spec\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'HANDOFF.md.template'), '# Handoff\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'STATUS.md.template'), '# Spec Status\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'EVIDENCE_REPORT.md.template'), '# Evidence\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'slices', 'slice-template', 'slice.json'), '{}\n');
    writeFile(path.join(dir, 'specs', '[project-name]', 'slices', 'pr.md.template'), '# PR\n');
    writeFile(path.join(dir, 'scripts', 'start-slice.sh'), '#!/usr/bin/env bash\n');
    fs.chmodSync(path.join(dir, 'scripts', 'start-slice.sh'), 0o755);
    writeFile(path.join(dir, 'scripts', 'migrate-project.sh'), '#!/usr/bin/env bash\n');
    fs.chmodSync(path.join(dir, 'scripts', 'migrate-project.sh'), 0o755);
    writeFile(path.join(dir, 'scripts', 'refresh-active-slices.sh'), '#!/usr/bin/env bash\n');
    fs.chmodSync(path.join(dir, 'scripts', 'refresh-active-slices.sh'), 0o755);
    return { dir, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}

test('migration blocks compatibility evidence drift before its first project write', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');
  const configPath = path.join(projectRoot, '.quiver', 'config.json');
  const statePath = path.join(projectRoot, '.quiver', 'state.json');

  try {
    writeFile(path.join(projectRoot, 'package.json'), `${JSON.stringify({ name: 'migration-drift' }, null, 2)}\n`);
    writeFile(configPath, `${JSON.stringify({ governance: buildDefaultGovernanceConfig() }, null, 2)}\n`);
    writeFile(statePath, `${JSON.stringify({
      initialized_version: packageJson.version,
      last_initialized_at: '2026-08-31T00:00:00.000Z',
      quiver_version: packageJson.version,
    }, null, 2)}\n`);
    const options = {
      cliVersion: packageJson.version,
      projectName: 'Migration Drift',
      projectRoot,
      skipInstall: true,
      templateRoot: templateRoot.dir,
    };
    const preflight = preflightProjectMigration(options);
    assert.equal(preflight.status, 'apply');
    assert.equal(preflight.compatibility.status, 'v58-verified');

    fs.rmSync(configPath);
    fs.rmSync(statePath);
    assert.throws(
      () => applyProjectMigrationSurface({ ...options, preflight }),
      (error) => error?.code === 'MIGRATION_VERIFICATION_FAILED',
    );
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs')), false);
    assert.equal(fs.existsSync(configPath), false);
    assert.equal(fs.existsSync(statePath), false);
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});

test('legacy migration blocks declared older dependency drift before its first project write', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');
  const packagePath = path.join(projectRoot, 'package.json');
  const configPath = path.join(projectRoot, '.quiver', 'config.json');

  try {
    writeFile(packagePath, `${JSON.stringify({ name: 'legacy-dependency-drift' }, null, 2)}\n`);
    const legacyGovernance = buildDefaultGovernanceConfig();
    delete legacyGovernance.compatibility;
    writeFile(configPath, `${JSON.stringify({ governance: legacyGovernance }, null, 2)}\n`);
    const options = {
      cliVersion: packageJson.version,
      projectName: 'Legacy Dependency Drift',
      projectRoot,
      skipInstall: true,
      templateRoot: templateRoot.dir,
    };
    const preflight = preflightProjectMigration(options);
    assert.equal(preflight.status, 'apply');
    assert.equal(preflight.compatibility.status, 'legacy-unverified');
    assert.equal(preflight.dependency.status, 'absent');

    writeFile(packagePath, `${JSON.stringify({
      name: 'legacy-dependency-drift',
      devDependencies: { 'create-quiver': '0.1.0' },
    }, null, 2)}\n`);
    const beforeConfig = fs.readFileSync(configPath, 'utf8');
    assert.throws(
      () => applyProjectMigrationSurface({ ...options, preflight }),
      (error) => error?.code === 'UNSAFE_WRITER_DOWNGRADE',
    );
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs')), false);
    assert.equal(fs.readFileSync(configPath, 'utf8'), beforeConfig);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'state.json')), false);
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});

test('detectPackageManager returns npm when no lockfile exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    assert.equal(detectPackageManager(dir), 'npm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns yarn when yarn.lock exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    assert.equal(detectPackageManager(dir), 'yarn');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns pnpm when pnpm-lock.yaml exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    assert.equal(detectPackageManager(dir), 'pnpm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns bun when bun.lockb exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
    assert.equal(detectPackageManager(dir), 'bun');
  } finally {
    cleanup();
  }
});

test('detectPackageManager prefers bun over pnpm over yarn over npm', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
    assert.equal(detectPackageManager(dir), 'bun');
  } finally {
    cleanup();
  }
});

test('formatInstallSelfCommand respects detected package managers', () => {
  const cases = [
    ['npm', 'package-lock.json', 'npm install -D create-quiver@0.13.0'],
    ['pnpm', 'pnpm-lock.yaml', 'pnpm add -D create-quiver@0.13.0'],
    ['yarn', 'yarn.lock', 'yarn add -D create-quiver@0.13.0'],
    ['bun', 'bun.lockb', 'bun add -d create-quiver@0.13.0'],
  ];

  for (const [, lockfile, expected] of cases) {
    const { dir, cleanup } = makeTmpDir();
    try {
      fs.writeFileSync(path.join(dir, lockfile), '');
      assert.equal(formatInstallSelfCommand(dir, '0.13.0'), expected);
    } finally {
      cleanup();
    }
  }
});

test('installSelfAsDevDep returns skipped-no-package-json when no package.json', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'skipped-no-package-json');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'test', devDependencies: { 'create-quiver': '^0.7.0' } }),
    );
    const result = installSelfAsDevDep(dir, '0.7.6');
    assert.equal(result, 'skipped-already-present');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns failed when install command fails', () => {
  const { dir, cleanup } = makeTmpDir();
  const originalPath = process.env.PATH;
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.PATH = '';
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'failed');
  } finally {
    process.env.PATH = originalPath;
    cleanup();
  }
});

test('initializeProjectDocs writes legacy scripts and exports templates only when requested', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');

  try {
    initializeProjectDocs({
      cliVersion: '0.8.0',
      includeTemplates: true,
      legacyScripts: true,
      profile: 'default',
      projectName: 'Legacy Scripts Project',
      projectRoot,
      templateRoot: templateRoot.dir,
    });

    assert.equal(fs.existsSync(path.join(projectRoot, 'README.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'AGENTS.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'AI_CONTEXT.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'tools', 'scripts', 'start-slice.sh')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'tools', 'scripts', 'migrate-project.sh')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'templates', 'package.template.json')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs-template')), false);

    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, '.quiver', 'config.json'), 'utf8'));
    assert.equal(pkg.scripts['quiver:version'], 'npx create-quiver version');
    assert.equal(pkg.scripts['quiver:dashboard'], 'npx create-quiver dashboard');
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
    assert.equal(typeof pkg.scripts['quiver:ai:onboard'], 'string');
    assert.equal(config.governance.schema_version, 1);
    assert.equal(config.governance.policy.authorization.default_effect, 'deny');
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});

test('initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');

  try {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'README.md'), 'keep me\n');
    writeFile(path.join(projectRoot, '.quiver', 'config.json'), `${JSON.stringify({
      layout_version: 1,
      compatible_root_key: {
        owner: 'project',
      },
      governance: {
        ...buildDefaultGovernanceConfig(),
        compatible_future_control: {
          enabled: true,
        },
      },
    }, null, 2)}\n`);
    writeFile(path.join(projectRoot, '.quiver', 'state.json'), `${JSON.stringify({
      initialized_version: packageJson.version,
      last_initialized_at: '2026-08-31T00:00:00.000Z',
      quiver_version: packageJson.version,
    }, null, 2)}\n`);

    initializeProjectDocs({
      cliVersion: packageJson.version,
      legacyScripts: true,
      migrateMode: true,
      profile: 'full',
      projectName: 'Full Migrate Project',
      projectRoot,
      templateRoot: templateRoot.dir,
    });

    assert.equal(fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8'), 'keep me\n');
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'examples', 'plan.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'examples', 'graph.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'examples', 'next.md')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'tools', 'scripts', 'migrate-project.sh')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'templates')), false);

    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, '.quiver', 'config.json'), 'utf8'));
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
    assert.equal(config.compatible_root_key.owner, 'project');
    assert.equal(config.governance.compatible_future_control.enabled, true);
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});

test('initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');

  try {
    fs.mkdirSync(projectRoot, { recursive: true });
    execFileSync('git', ['init'], { cwd: projectRoot, stdio: 'ignore' });
    const excludePath = path.join(projectRoot, '.git', 'info', 'exclude');
    fs.appendFileSync(excludePath, 'custom-local.log\n.quiver/\n');
    writeFile(path.join(projectRoot, '.quiver', '.gitignore'), 'custom-runtime/\n');
    writeFile(path.join(projectRoot, '.quiver', 'state.json'), `${JSON.stringify({
      initialized_version: '0.7.0',
      last_initialized_at: '2026-01-01T00:00:00.000Z',
      quiver_version: '0.7.0',
    }, null, 2)}\n`);

    initializeProjectDocs({
      cliVersion: '0.8.0',
      migrateMode: true,
      profile: 'full',
      projectName: 'Granular Ignore Project',
      projectRoot,
      templateRoot: templateRoot.dir,
    });

    const internalIgnore = fs.readFileSync(path.join(projectRoot, '.quiver', '.gitignore'), 'utf8');
    const localExclude = fs.readFileSync(excludePath, 'utf8');
    assert.match(internalIgnore, /^custom-runtime\/$/m);
    assert.match(internalIgnore, /^runs\/$/m);
    assert.match(localExclude, /^custom-local\.log$/m);
    assert.doesNotMatch(localExclude, /^\.quiver\/$/m);
    assert.equal((localExclude.match(/^\.quiver\/runs\/$/gm) || []).length, 1);
    assert.equal(spawnSync('git', ['check-ignore', '-q', '.quiver/config.json'], { cwd: projectRoot }).status, 1);

    writeFile(path.join(projectRoot, '.quiver', 'runs', 'run-test', 'state.json'), '{}\n');
    assert.equal(spawnSync('git', ['check-ignore', '-q', '.quiver/runs/run-test/state.json'], { cwd: projectRoot }).status, 0);
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});

test('initializeProjectDocs fails closed without overwriting invalid governance config', () => {
  const { dir, cleanup } = makeTmpDir();
  const templateRoot = makeTemplateRoot();
  const projectRoot = path.join(dir, 'project');
  const configPath = path.join(projectRoot, '.quiver', 'config.json');

  try {
    const invalidConfig = {
      layout_version: 1,
      governance: {
        ...buildDefaultGovernanceConfig(),
        requested_profile: 'unsafe-profile',
      },
    };
    writeFile(configPath, `${JSON.stringify(invalidConfig, null, 2)}\n`);
    const before = fs.readFileSync(configPath, 'utf8');

    assert.throws(
      () => initializeProjectDocs({
        cliVersion: '0.8.0',
        migrateMode: true,
        profile: 'full',
        projectName: 'Invalid Governance Project',
        projectRoot,
        templateRoot: templateRoot.dir,
      }),
      (error) => error?.code === 'MIGRATION_VERIFICATION_FAILED',
    );
    assert.equal(fs.readFileSync(configPath, 'utf8'), before);
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});
