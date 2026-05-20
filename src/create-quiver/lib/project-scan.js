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
  toRelativeScanPath,
  writeProjectScanJson,
};
