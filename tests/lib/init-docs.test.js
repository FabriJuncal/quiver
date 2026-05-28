const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  initializeProjectDocs,
  detectPackageManager,
  formatInstallSelfCommand,
  installSelfAsDevDep,
} = require('../../src/create-quiver/lib/init-docs');

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
    const result = installSelfAsDevDep(dir, '0.8.0');
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
    assert.equal(pkg.scripts['quiver:version'], 'npx create-quiver version');
    assert.equal(pkg.scripts['quiver:dashboard'], 'npx create-quiver dashboard');
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
    assert.equal(typeof pkg.scripts['quiver:ai:onboard'], 'string');
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

    initializeProjectDocs({
      cliVersion: '0.8.0',
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
    assert.equal(typeof pkg.scripts['start:slice'], 'string');
    assert.equal(typeof pkg.scripts.migrate, 'string');
  } finally {
    templateRoot.cleanup();
    cleanup();
  }
});
