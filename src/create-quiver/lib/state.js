const fs = require('fs');
const path = require('path');
const { quiverInternalPaths } = require('./init-layout');

function statePath(projectRoot) {
  return quiverInternalPaths(projectRoot).statePath;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readState(projectRoot) {
  const filePath = statePath(projectRoot);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hasInitializedStateMetadata(state) {
  return Boolean(
    state
    && typeof state.initialized_version === 'string'
    && state.initialized_version.length > 0
    && typeof state.last_initialized_at === 'string'
    && state.last_initialized_at.length > 0,
  );
}

function hasGeneratedProjectSpec(projectRoot) {
  const specsDir = path.join(projectRoot, 'specs');
  if (!fs.existsSync(specsDir)) {
    return false;
  }

  return fs.readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((entry) => entry !== '[project-name]' && !entry.startsWith('quiver-'))
    .some((entry) => (
      fs.existsSync(path.join(specsDir, entry, 'SPEC.md'))
      && fs.existsSync(path.join(specsDir, entry, 'STATUS.md'))
      && fs.existsSync(path.join(specsDir, entry, 'EVIDENCE_REPORT.md'))
      && fs.existsSync(path.join(specsDir, entry, 'slices', 'slice-template', 'slice.json'))
    ));
}

function hasLegacyQuiverInitializationEvidence(projectRoot) {
  const requiredPaths = [
    'docs-template/scripts/init-docs.sh',
    'tools/scripts/start-slice.sh',
    'tools/scripts/check-slice-readiness.sh',
    '.github/pull_request_template.md',
    'docs/INDEX.md',
  ];

  return requiredPaths.every((relativePath) => fs.existsSync(path.join(projectRoot, relativePath)))
    && hasGeneratedProjectSpec(projectRoot);
}

function inspectLegacyMigrationLayout(projectRoot) {
  const candidates = [
    'docs-template/',
    'tools/scripts/',
    'docs/PROJECT_SCAN.json',
  ];

  const detected = candidates.filter((relativePath) => fs.existsSync(path.join(projectRoot, relativePath)));

  return {
    hasLegacyLayout: detected.length > 0,
    legacyPaths: detected,
  };
}

function hasQuiverInitializationEvidence(projectRoot) {
  const state = readState(projectRoot);
  return hasInitializedStateMetadata(state) || hasLegacyQuiverInitializationEvidence(projectRoot);
}

function writeState(projectRoot, nextState) {
  const stateDir = path.join(projectRoot, '.quiver');
  ensureDir(stateDir);
  fs.writeFileSync(statePath(projectRoot), `${JSON.stringify(nextState, null, 2)}\n`);
  return statePath(projectRoot);
}

function updateStateForInit(projectRoot, projectName, cliVersion) {
  const currentState = readState(projectRoot) || {};
  const now = new Date().toISOString();
  const nextState = {
    ...currentState,
    quiver_version: cliVersion,
    project_name: projectName || currentState.project_name || '',
    initialized_version: currentState.initialized_version || cliVersion,
    migrated_version: currentState.migrated_version ?? null,
    last_initialized_at: currentState.last_initialized_at || now,
    last_migration_at: currentState.last_migration_at ?? null,
    last_analysis_at: currentState.last_analysis_at ?? null,
  };

  writeState(projectRoot, nextState);
  return nextState;
}

function updateStateForMigrate(projectRoot, projectName, cliVersion) {
  const currentState = readState(projectRoot) || {};
  const now = new Date().toISOString();
  const nextState = {
    ...currentState,
    quiver_version: cliVersion,
    project_name: projectName || currentState.project_name || '',
    initialized_version: currentState.initialized_version ?? null,
    migrated_version: cliVersion,
    last_initialized_at: currentState.last_initialized_at ?? null,
    last_migration_at: now,
    last_analysis_at: currentState.last_analysis_at ?? null,
  };

  writeState(projectRoot, nextState);
  return nextState;
}

function updateStateForAnalyze(projectRoot, cliVersion) {
  const currentState = readState(projectRoot);

  if (!currentState) {
    return null;
  }

  const nextState = {
    ...currentState,
    quiver_version: cliVersion,
    last_analysis_at: new Date().toISOString(),
  };

  writeState(projectRoot, nextState);
  return nextState;
}

module.exports = {
  hasGeneratedProjectSpec,
  hasInitializedStateMetadata,
  hasLegacyQuiverInitializationEvidence,
  inspectLegacyMigrationLayout,
  hasQuiverInitializationEvidence,
  readState,
  statePath,
  updateStateForAnalyze,
  updateStateForInit,
  updateStateForMigrate,
  writeState,
};
