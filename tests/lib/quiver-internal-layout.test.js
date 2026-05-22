const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildQuiverConfig,
  buildQuiverInternalGitignore,
  quiverInternalPaths,
} = require('../../src/create-quiver/lib/init-layout');
const { initializeProjectDocs } = require('../../src/create-quiver/lib/init-docs');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-internal-layout-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function makeTemplateRoot(root) {
  fs.mkdirSync(path.join(root, 'docs', 'ai'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specs', '[project-name]', 'slices', 'slice-template'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.template.json'), '{"scripts":{"quiver:doctor":"npx create-quiver doctor"}}\n');
  fs.writeFileSync(path.join(root, 'AGENTS.md.template'), '# Agents {{PROJECT_NAME}}\n');
  fs.writeFileSync(path.join(root, 'docs', 'AI_CONTEXT.md.template'), '# AI Context {{PROJECT_SLUG}}\n');
  fs.writeFileSync(path.join(root, 'docs', 'AI_ONBOARDING_PROMPT.md.template'), '# Prompt\n');
  fs.writeFileSync(path.join(root, 'docs', 'COMMANDS.md.template'), '# Commands\n');
  fs.writeFileSync(path.join(root, 'docs', 'WORKFLOW.md.template'), '# Workflow\n');
  fs.writeFileSync(path.join(root, 'docs', 'GITFLOW_PR_GUIDE.md.template'), '# GitFlow\n');
  fs.writeFileSync(path.join(root, 'docs', 'QUICK.md.template'), '# Quick {{PROJECT_SLUG}}\n');
  fs.writeFileSync(path.join(root, 'docs', 'STANDARD.md.template'), '# Standard\n');
  fs.writeFileSync(path.join(root, 'docs', 'DEEP.md.template'), '# Deep\n');
  fs.writeFileSync(path.join(root, 'docs', 'ai', 'LESSONS.md.template'), '# Lessons\n');
  fs.writeFileSync(path.join(root, 'docs', 'ai', 'PRINCIPLES.md'), '# Principles\n');
  fs.writeFileSync(path.join(root, 'docs', 'ai', 'RULES.yaml'), 'rules: []\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'SPEC.md.template'), '# Spec\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'HANDOFF.md.template'), '# Handoff\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'STATUS.md.template'), '# Status\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'EVIDENCE_REPORT.md.template'), '# Evidence\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'slices', 'slice-template', 'slice.json'), '{"slice_id":"slice-template"}\n');
  fs.writeFileSync(path.join(root, 'specs', '[project-name]', 'slices', 'pr.md.template'), '# PR\n');
}

test('quiverInternalPaths centralizes internal paths', () => {
  const paths = quiverInternalPaths('/repo');

  assert.equal(paths.root, path.join('/repo', '.quiver'));
  assert.equal(paths.statePath, path.join('/repo', '.quiver', 'state.json'));
  assert.equal(paths.configPath, path.join('/repo', '.quiver', 'config.json'));
  assert.equal(paths.scansDir, path.join('/repo', '.quiver', 'scans'));
});

test('buildQuiverInternalGitignore ignores runtime-only folders', () => {
  const content = buildQuiverInternalGitignore();

  assert.match(content, /^cache\/$/m);
  assert.match(content, /^evidence\/$/m);
  assert.match(content, /^runs\/$/m);
  assert.match(content, /^worktrees\/$/m);
  assert.doesNotMatch(content, /state\.json/);
  assert.doesNotMatch(content, /config\.json/);
});

test('buildQuiverConfig documents internal and visible artifact paths', () => {
  assert.deepEqual(buildQuiverConfig(), {
    layout_version: 1,
    internal_root: '.quiver',
    scan_path: '.quiver/scans/PROJECT_SCAN.json',
    project_map_path: 'docs/PROJECT_MAP.md',
    templates_path: '.quiver/templates',
  });
});

test('initializeProjectDocs writes internal config and gitignore using explicit template root', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const templateRoot = path.join(dir, 'templates');
    fs.mkdirSync(projectRoot, { recursive: true });
    makeTemplateRoot(templateRoot);

    const result = initializeProjectDocs({
      cliVersion: '0.0.0-test',
      projectName: 'Internal Project',
      projectRoot,
      templateRoot,
    });

    assert.equal(result.projectSlug, 'internal-project');
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'config.json')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', '.gitignore')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.quiver', 'scans')), true);

    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, '.quiver', 'config.json'), 'utf8'));
    const gitignore = fs.readFileSync(path.join(projectRoot, '.quiver', '.gitignore'), 'utf8');

    assert.equal(config.scan_path, '.quiver/scans/PROJECT_SCAN.json');
    assert.match(gitignore, /^cache\/$/m);
    assert.match(gitignore, /^runs\/$/m);
    assert.match(gitignore, /^worktrees\/$/m);
  } finally {
    cleanup();
  }
});
