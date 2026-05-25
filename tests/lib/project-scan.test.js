const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  CURRENT_SCAN_RELATIVE_PATH,
  LEGACY_SCAN_RELATIVE_PATH,
  hasProjectScanArtifact,
  projectScanPaths,
  readProjectScanArtifact,
  readProjectScanStatus,
  writeProjectScanJson,
} = require('../../src/create-quiver/lib/project-scan');
const { buildContextPackMetadata } = require('../../src/create-quiver/lib/ai/context-packs');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-project-scan-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('writeProjectScanJson writes the current internal scan path', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const scanPath = writeProjectScanJson(dir, { project: { name: 'demo' } });

    assert.equal(path.relative(dir, scanPath).split(path.sep).join('/'), CURRENT_SCAN_RELATIVE_PATH);
    assert.equal(fs.existsSync(path.join(dir, LEGACY_SCAN_RELATIVE_PATH)), false);
    assert.equal(hasProjectScanArtifact(dir), true);
  } finally {
    cleanup();
  }
});

test('readProjectScanArtifact prefers current scan over legacy scan', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const paths = projectScanPaths(dir);
    fs.mkdirSync(path.dirname(paths.legacyScanPath), { recursive: true });
    fs.writeFileSync(paths.legacyScanPath, '{"project":{"name":"legacy"}}\n');
    writeProjectScanJson(dir, { project: { name: 'current' } });

    const artifact = readProjectScanArtifact(dir);

    assert.equal(artifact.source, 'current');
    assert.equal(artifact.relativePath, CURRENT_SCAN_RELATIVE_PATH);
    assert.equal(artifact.scan.project.name, 'current');
  } finally {
    cleanup();
  }
});

test('readProjectScanArtifact falls back to legacy scan path', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const paths = projectScanPaths(dir);
    fs.mkdirSync(path.dirname(paths.legacyScanPath), { recursive: true });
    fs.writeFileSync(paths.legacyScanPath, '{"project":{"name":"legacy"}}\n');

    const artifact = readProjectScanArtifact(dir);

    assert.equal(artifact.source, 'legacy');
    assert.equal(artifact.relativePath, LEGACY_SCAN_RELATIVE_PATH);
    assert.equal(artifact.scan.project.name, 'legacy');
  } finally {
    cleanup();
  }
});

test('context pack metadata reports current or legacy scan source when repoRoot is provided', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const paths = projectScanPaths(dir);
    fs.mkdirSync(path.dirname(paths.legacyScanPath), { recursive: true });
    fs.writeFileSync(paths.legacyScanPath, '{"project":{"name":"legacy"}}\n');

    const legacyMetadata = buildContextPackMetadata({ role: 'planner', repoRoot: dir });
    assert.deepEqual(legacyMetadata.scanArtifact, {
      path: LEGACY_SCAN_RELATIVE_PATH,
      source: 'legacy',
    });

    writeProjectScanJson(dir, { project: { name: 'current' } });
    const currentMetadata = buildContextPackMetadata({ role: 'planner', repoRoot: dir });
    assert.deepEqual(currentMetadata.scanArtifact, {
      path: CURRENT_SCAN_RELATIVE_PATH,
      source: 'current',
    });
  } finally {
    cleanup();
  }
});

test('readProjectScanStatus reports source and missing visible map state', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    assert.equal(readProjectScanStatus(dir).status, 'missing');

    writeProjectScanJson(dir, { project: { name: 'current' } });
    const partial = readProjectScanStatus(dir);
    assert.equal(partial.status, 'partial');
    assert.equal(partial.source, 'current');
    assert.match(partial.summary, /docs\/PROJECT_MAP\.md is missing/);

    fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'docs', 'PROJECT_MAP.md'), '# Project Map\n');
    const fresh = readProjectScanStatus(dir);
    assert.equal(fresh.status, 'fresh');
    assert.equal(fresh.artifactPath, CURRENT_SCAN_RELATIVE_PATH);
    assert.equal(fresh.projectMapPath, 'docs/PROJECT_MAP.md');
  } finally {
    cleanup();
  }
});
