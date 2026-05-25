const fs = require('node:fs');
const path = require('node:path');

const CURRENT_SCAN_RELATIVE_PATH = '.quiver/scans/PROJECT_SCAN.json';
const LEGACY_SCAN_RELATIVE_PATH = 'docs/PROJECT_SCAN.json';
const PROJECT_MAP_RELATIVE_PATH = 'docs/PROJECT_MAP.md';

function projectScanPaths(projectRoot) {
  return {
    currentScanPath: path.join(projectRoot, '.quiver', 'scans', 'PROJECT_SCAN.json'),
    legacyScanPath: path.join(projectRoot, 'docs', 'PROJECT_SCAN.json'),
    projectMapPath: path.join(projectRoot, 'docs', 'PROJECT_MAP.md'),
    scanDir: path.join(projectRoot, '.quiver', 'scans'),
  };
}

function toRelativeScanPath(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function writeProjectScanJson(projectRoot, scan) {
  const { currentScanPath, scanDir } = projectScanPaths(projectRoot);
  fs.mkdirSync(scanDir, { recursive: true });
  fs.writeFileSync(currentScanPath, `${JSON.stringify(scan, null, 2)}\n`);
  return currentScanPath;
}

function readProjectScanArtifact(projectRoot) {
  const { currentScanPath, legacyScanPath } = projectScanPaths(projectRoot);

  if (fs.existsSync(currentScanPath)) {
    return {
      path: currentScanPath,
      relativePath: toRelativeScanPath(projectRoot, currentScanPath),
      source: 'current',
      scan: JSON.parse(fs.readFileSync(currentScanPath, 'utf8')),
    };
  }

  if (fs.existsSync(legacyScanPath)) {
    return {
      path: legacyScanPath,
      relativePath: toRelativeScanPath(projectRoot, legacyScanPath),
      source: 'legacy',
      scan: JSON.parse(fs.readFileSync(legacyScanPath, 'utf8')),
    };
  }

  return null;
}

function statIso(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

function readProjectScanStatus(projectRoot) {
  const { currentScanPath, legacyScanPath, projectMapPath } = projectScanPaths(projectRoot);
  const projectMapExists = fs.existsSync(projectMapPath);
  let artifact = null;
  let artifactError = '';

  try {
    artifact = readProjectScanArtifact(projectRoot);
  } catch (error) {
    artifactError = error.message;
  }

  const scanPath = artifact?.path || (fs.existsSync(currentScanPath) ? currentScanPath : fs.existsSync(legacyScanPath) ? legacyScanPath : '');
  const source = artifact?.source || (artifactError ? 'invalid' : 'missing');
  const scanUpdatedAt = scanPath ? statIso(scanPath) : null;
  const projectMapUpdatedAt = projectMapExists ? statIso(projectMapPath) : null;
  const stale = Boolean(
    scanUpdatedAt
    && projectMapUpdatedAt
    && Date.parse(projectMapUpdatedAt) + 1000 < Date.parse(scanUpdatedAt),
  );
  let status = 'missing';

  if (artifactError) {
    status = 'invalid';
  } else if (artifact && projectMapExists && stale) {
    status = 'stale';
  } else if (artifact && projectMapExists && source === 'current') {
    status = 'fresh';
  } else if (artifact && projectMapExists && source === 'legacy') {
    status = 'legacy';
  } else if (artifact || projectMapExists) {
    status = 'partial';
  }

  let summary;
  if (status === 'fresh') {
    summary = `${artifact.relativePath} (current, updated ${scanUpdatedAt})`;
  } else if (status === 'legacy') {
    summary = `${artifact.relativePath} (legacy scan, updated ${scanUpdatedAt})`;
  } else if (status === 'stale') {
    summary = `${artifact.relativePath} newer than docs/PROJECT_MAP.md; run analyze to refresh visible context`;
  } else if (status === 'partial' && artifact && !projectMapExists) {
    summary = `${artifact.relativePath} exists but docs/PROJECT_MAP.md is missing`;
  } else if (status === 'partial' && !artifact && projectMapExists) {
    summary = `docs/PROJECT_MAP.md exists but no scan artifact was found`;
  } else if (status === 'invalid') {
    summary = `scan artifact is invalid: ${artifactError}`;
  } else {
    summary = 'missing analysis artifacts; run npx create-quiver analyze';
  }

  return {
    artifactPath: artifact?.relativePath || (scanPath ? toRelativeScanPath(projectRoot, scanPath) : null),
    error: artifactError || null,
    projectMapPath: projectMapExists ? PROJECT_MAP_RELATIVE_PATH : null,
    projectMapUpdatedAt,
    scanUpdatedAt,
    source,
    status,
    stale,
    summary,
  };
}

function hasProjectScanArtifact(projectRoot) {
  const { currentScanPath, legacyScanPath } = projectScanPaths(projectRoot);
  return fs.existsSync(currentScanPath) || fs.existsSync(legacyScanPath);
}

module.exports = {
  CURRENT_SCAN_RELATIVE_PATH,
  LEGACY_SCAN_RELATIVE_PATH,
  PROJECT_MAP_RELATIVE_PATH,
  hasProjectScanArtifact,
  projectScanPaths,
  readProjectScanArtifact,
  readProjectScanStatus,
  toRelativeScanPath,
  writeProjectScanJson,
};
