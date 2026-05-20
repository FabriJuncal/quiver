const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  resolveExportedTemplateRoot,
  resolveLegacyTemplateRoot,
  resolvePackagedTemplateRoot,
  resolveTemplatePath,
  resolveTemplateRoot,
  templateRootExists,
} = require('../../src/create-quiver/lib/template-resolver');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-template-resolver-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function makeTemplateRoot(root) {
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.template.json'), '{"scripts":{}}\n');
  fs.writeFileSync(path.join(root, 'docs', 'COMMANDS.md.template'), '# Commands\n');
}

test('templateRootExists validates a minimal Quiver template root', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    assert.equal(templateRootExists(dir), false);
    makeTemplateRoot(dir);
    assert.equal(templateRootExists(dir), true);
  } finally {
    cleanup();
  }
});

test('resolveTemplateRoot prefers packaged templates by default', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const packageRoot = path.join(dir, 'package');
    const legacyRoot = resolveLegacyTemplateRoot(projectRoot);
    fs.mkdirSync(projectRoot, { recursive: true });
    makeTemplateRoot(packageRoot);
    makeTemplateRoot(legacyRoot);

    const resolved = resolveTemplateRoot(projectRoot, { packageRoot });

    assert.equal(resolved.kind, 'packaged');
    assert.equal(resolved.path, resolvePackagedTemplateRoot(packageRoot));
  } finally {
    cleanup();
  }
});

test('resolveTemplateRoot can prefer exported templates when requested', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const packageRoot = path.join(dir, 'package');
    const exportedRoot = resolveExportedTemplateRoot(projectRoot);
    fs.mkdirSync(projectRoot, { recursive: true });
    makeTemplateRoot(packageRoot);
    makeTemplateRoot(exportedRoot);

    const resolved = resolveTemplateRoot(projectRoot, { packageRoot, preferExported: true });

    assert.equal(resolved.kind, 'exported');
    assert.equal(resolved.path, exportedRoot);
  } finally {
    cleanup();
  }
});

test('resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const packageRoot = path.join(dir, 'package');
    const legacyRoot = resolveLegacyTemplateRoot(projectRoot);
    fs.mkdirSync(projectRoot, { recursive: true });
    makeTemplateRoot(legacyRoot);

    const resolved = resolveTemplateRoot(projectRoot, { packageRoot });

    assert.equal(resolved.kind, 'legacy');
    assert.equal(resolved.path, legacyRoot);
  } finally {
    cleanup();
  }
});

test('resolveTemplatePath returns the concrete template file path', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const packageRoot = path.join(dir, 'package');
    fs.mkdirSync(projectRoot, { recursive: true });
    makeTemplateRoot(packageRoot);

    const resolved = resolveTemplatePath(projectRoot, 'docs/COMMANDS.md.template', { packageRoot });

    assert.equal(resolved.kind, 'packaged');
    assert.equal(resolved.templatePath, path.join(packageRoot, 'docs', 'COMMANDS.md.template'));
  } finally {
    cleanup();
  }
});

test('resolveTemplateRoot reports every searched location when templates are missing', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    const packageRoot = path.join(dir, 'package');
    fs.mkdirSync(projectRoot, { recursive: true });

    assert.throws(
      () => resolveTemplateRoot(projectRoot, { packageRoot, preferExported: true }),
      /missing Quiver templates.*exported:.*packaged:.*legacy:/,
    );
  } finally {
    cleanup();
  }
});
