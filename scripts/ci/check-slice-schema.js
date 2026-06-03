#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const { parseJsonWithComments } = require('../../src/create-quiver/lib/json');

const DEFAULT_SCHEMA_PATH = 'docs/schema/slice.schema.json';
const DEFAULT_INVALID_FIXTURE_DIR = 'tests/fixtures/slice-schema/invalid';

function repoRootFromScript() {
  return path.resolve(__dirname, '..', '..');
}

function toPosix(filePath) {
  return String(filePath || '').split(path.sep).join('/');
}

function isPlaceholderPath(filePath) {
  return toPosix(filePath)
    .split('/')
    .some((part) => part.startsWith('[') || part === 'slice-template' || part.startsWith('slice-template-'));
}

function walkFiles(rootDir, predicate, files = []) {
  if (!fs.existsSync(rootDir)) {
    return files;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, files);
    } else if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function readJson(filePath) {
  return parseJsonWithComments(fs.readFileSync(filePath, 'utf8'));
}

function loadSchema(repoRoot, schemaPath = DEFAULT_SCHEMA_PATH) {
  return readJson(path.join(repoRoot, schemaPath));
}

function createSliceSchemaValidator(schema) {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    validateSchema: true,
  });
  return ajv.compile(schema);
}

function isRuntimeValidSliceFixture(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return false;
  }

  const writeScope = Array.isArray(json.allowed_write_paths) && json.allowed_write_paths.length > 0
    ? json.allowed_write_paths
    : json.files;

  return Boolean(
    String(json.slice_id || '').trim()
      && String(json.ticket || '').trim()
      && Array.isArray(json.files)
      && json.files.length > 0
      && Array.isArray(writeScope)
      && writeScope.length > 0
      && String(json.git?.branch_type || '').trim()
      && String(json.git?.base_branch || '').trim()
      && String(json.git?.branch_slug || '').trim()
      && String(json.git?.branch_name || '').trim(),
  );
}

function collectRealSliceFixtures(repoRoot) {
  const files = [
    ...walkFiles(path.join(repoRoot, 'specs'), (filePath) => path.basename(filePath) === 'slice.json'),
    ...walkFiles(path.join(repoRoot, 'examples'), (filePath) => path.basename(filePath) === 'slice.json'),
  ]
    .filter((filePath) => !isPlaceholderPath(filePath))
    .sort();

  const valid = [];
  const skipped = [];

  for (const filePath of files) {
    const json = readJson(filePath);
    const relativePath = toPosix(path.relative(repoRoot, filePath));
    if (isRuntimeValidSliceFixture(json)) {
      valid.push({ filePath, relativePath, json });
    } else {
      skipped.push({ filePath, relativePath, reason: 'does not satisfy current runtime-required slice fields' });
    }
  }

  return { valid, skipped };
}

function collectInvalidFixtures(repoRoot, fixtureDir = DEFAULT_INVALID_FIXTURE_DIR) {
  return walkFiles(path.join(repoRoot, fixtureDir), (filePath) => filePath.endsWith('.json'))
    .sort()
    .map((filePath) => ({
      filePath,
      relativePath: toPosix(path.relative(repoRoot, filePath)),
      json: readJson(filePath),
    }));
}

function formatAjvErrors(errors = []) {
  return errors
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function runSliceSchemaCheck(options = {}) {
  const repoRoot = options.repoRoot || repoRootFromScript();
  const schema = loadSchema(repoRoot, options.schemaPath);
  const validate = createSliceSchemaValidator(schema);
  const fixtures = collectRealSliceFixtures(repoRoot);
  const invalidFixtures = collectInvalidFixtures(repoRoot, options.invalidFixtureDir);
  const failures = [];
  const invalidPasses = [];

  if (fixtures.valid.length === 0) {
    failures.push('No runtime-valid slice fixtures were found.');
  }

  for (const fixture of fixtures.valid) {
    if (!validate(fixture.json)) {
      failures.push(`${fixture.relativePath}: ${formatAjvErrors(validate.errors)}`);
    }
  }

  for (const fixture of invalidFixtures) {
    if (validate(fixture.json)) {
      invalidPasses.push(`${fixture.relativePath}: invalid fixture unexpectedly passed`);
    }
  }

  return {
    ok: failures.length === 0 && invalidPasses.length === 0,
    schemaPath: options.schemaPath || DEFAULT_SCHEMA_PATH,
    validCount: fixtures.valid.length,
    skipped: fixtures.skipped,
    skippedCount: fixtures.skipped.length,
    invalidCount: invalidFixtures.length,
    failures,
    invalidPasses,
  };
}

function formatReport(report) {
  const lines = [
    'Slice schema validation',
    `Schema: ${report.schemaPath}`,
    `Valid runtime fixtures: ${report.validCount}`,
    `Skipped historical/non-runtime fixtures: ${report.skippedCount}`,
    `Invalid fixtures: ${report.invalidCount}`,
  ];

  const skippedFixtures = Array.isArray(report.skipped) ? report.skipped : [];
  if (skippedFixtures.length > 0) {
    lines.push('Skipped fixtures:');
    for (const fixture of skippedFixtures) {
      lines.push(`- ${fixture.relativePath}: ${fixture.reason}`);
    }
  }

  if (report.failures.length > 0 || report.invalidPasses.length > 0) {
    lines.push('Failures:');
    for (const failure of [...report.failures, ...report.invalidPasses]) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push(report.ok ? 'PASS: slice schema validation passed.' : 'FAIL: slice schema validation failed.');
  return `${lines.join('\n')}\n`;
}

if (require.main === module) {
  const report = runSliceSchemaCheck();
  process.stdout.write(formatReport(report));
  if (!report.ok) {
    process.exit(1);
  }
}

module.exports = {
  collectInvalidFixtures,
  collectRealSliceFixtures,
  createSliceSchemaValidator,
  isRuntimeValidSliceFixture,
  loadSchema,
  runSliceSchemaCheck,
};
