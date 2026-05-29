const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  collectLocalizedTemplateCoverage,
  isHumanTemplatePath,
  localizedTemplateRelativePath,
  resolveLocalizedTemplatePath,
  resolveTemplateLanguage,
  toTemplatePath,
} = require('../../src/create-quiver/lib/i18n/templates');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-i18n-templates-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return filePath;
}

test('template paths normalize safely', () => {
  assert.equal(toTemplatePath('docs\\INDEX.md.template'), 'docs/INDEX.md.template');
  assert.equal(toTemplatePath('./docs/INDEX.md.template'), 'docs/INDEX.md.template');
  assert.throws(() => toTemplatePath('../docs/INDEX.md.template'), /invalid template path/);
  assert.throws(() => toTemplatePath('/tmp/docs/INDEX.md.template'), /invalid template path/);
});

test('human template classification excludes machine artifacts', () => {
  assert.equal(isHumanTemplatePath('docs/INDEX.md.template'), true);
  assert.equal(isHumanTemplatePath('AGENTS.md.template'), true);
  assert.equal(isHumanTemplatePath('specs/[project-name]/SPEC.md.template'), true);
  assert.equal(isHumanTemplatePath('package.template.json'), false);
  assert.equal(isHumanTemplatePath('specs/[project-name]/slices/slice-template/slice.json'), false);
});

test('localized template convention inserts language before .template', () => {
  assert.equal(
    localizedTemplateRelativePath('docs/INDEX.md.template', 'es'),
    'docs/INDEX.md.es.template',
  );
  assert.equal(
    localizedTemplateRelativePath('docs/INDEX.md.template', 'en'),
    'docs/INDEX.md.template',
  );
  assert.equal(
    localizedTemplateRelativePath('package.template.json', 'es'),
    'package.template.json',
  );
});

test('template language resolution uses project config and explicit overrides', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const projectRoot = path.join(dir, 'project');
    writeFile(projectRoot, '.quiver/config.json', '{ "language": "es" }\n');

    assert.equal(resolveTemplateLanguage({ projectRoot }).language, 'es');
    assert.equal(resolveTemplateLanguage({ projectRoot, language: 'en' }).language, 'en');
  } finally {
    cleanup();
  }
});

test('localized human templates resolve by language and fall back explicitly to en', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const templateRoot = path.join(dir, 'templates');
    const projectRoot = path.join(dir, 'project');
    const base = writeFile(templateRoot, 'docs/INDEX.md.template', '# Index\n');
    const es = writeFile(templateRoot, 'docs/INDEX.md.es.template', '# Indice\n');
    writeFile(templateRoot, 'docs/STATUS.md.template', '# Status\n');
    writeFile(projectRoot, '.quiver/config.json', '{ "language": "es" }\n');

    const localized = resolveLocalizedTemplatePath(templateRoot, 'docs/INDEX.md.template', { projectRoot });
    assert.equal(localized.templatePath, es);
    assert.equal(localized.language, 'es');
    assert.equal(localized.fallback, false);
    assert.equal(localized.reason, 'localized-template');

    const explicitEn = resolveLocalizedTemplatePath(templateRoot, 'docs/INDEX.md.template', {
      projectRoot,
      language: 'en',
    });
    assert.equal(explicitEn.templatePath, base);
    assert.equal(explicitEn.language, 'en');
    assert.equal(explicitEn.fallback, false);

    const fallback = resolveLocalizedTemplatePath(templateRoot, 'docs/STATUS.md.template', {
      projectRoot,
      language: 'es',
    });
    assert.equal(fallback.language, 'en');
    assert.equal(fallback.requestedLanguage, 'es');
    assert.equal(fallback.fallback, true);
    assert.equal(fallback.reason, 'missing-localized-template');
  } finally {
    cleanup();
  }
});

test('machine artifacts are never routed through localized human templates', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const templateRoot = path.join(dir, 'templates');
    const machine = writeFile(templateRoot, 'package.template.json', '{"scripts":{}}\n');
    writeFile(templateRoot, 'package.template.es.json', '{"translated":true}\n');

    const resolved = resolveLocalizedTemplatePath(templateRoot, 'package.template.json', { language: 'es' });

    assert.equal(resolved.human, false);
    assert.equal(resolved.templatePath, machine);
    assert.equal(resolved.relativePath, 'package.template.json');
    assert.equal(resolved.localizedRelativePath, 'package.template.json');
    assert.equal(resolved.reason, 'machine-artifact');
  } finally {
    cleanup();
  }
});

test('localized template coverage reports missing human templates and skips machine artifacts', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const templateRoot = path.join(dir, 'templates');
    writeFile(templateRoot, 'docs/INDEX.md.template', '# Index\n');
    writeFile(templateRoot, 'docs/INDEX.md.es.template', '# Indice\n');
    writeFile(templateRoot, 'docs/STATUS.md.template', '# Status\n');
    writeFile(templateRoot, 'package.template.json', '{"scripts":{}}\n');

    const report = collectLocalizedTemplateCoverage(templateRoot, [
      'docs/INDEX.md.template',
      'docs/STATUS.md.template',
      'package.template.json',
    ], { languages: ['en', 'es'] });

    assert.equal(report.ok, false);
    assert.deepEqual(report.missing, [{
      language: 'es',
      relativePath: 'docs/STATUS.md.template',
      localizedRelativePath: 'docs/STATUS.md.es.template',
    }]);
    assert.deepEqual(report.skipped, [{
      relativePath: 'package.template.json',
      reason: 'machine-artifact',
    }]);
  } finally {
    cleanup();
  }
});
