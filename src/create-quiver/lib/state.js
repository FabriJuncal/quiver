const fs = require('fs');
const path = require('path');

function statePath(projectRoot) {
  return path.join(projectRoot, '.quiver', 'state.json');
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
  readState,
  statePath,
  updateStateForAnalyze,
  updateStateForInit,
  updateStateForMigrate,
  writeState,
};
