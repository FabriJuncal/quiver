const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');
const { quiverInternalPaths } = require('./init-layout');
const {
  CURRENT_WRITER_VERSION,
  GOVERNANCE_READ_ONLY,
  LEGACY_EVIDENCE_UNVERIFIED,
  MIGRATION_VERIFICATION_FAILED,
  UNSAFE_WRITER_DOWNGRADE,
  GovernanceError,
  assertGovernanceWriterAllowed,
  comparePackageSemver,
  parsePackageSemver,
  readGovernanceCompatibility,
  readGovernanceConfig,
} = require('./ai/review-governance');

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

function readStateForCompatibility(projectRoot) {
  try {
    return readState(projectRoot);
  } catch (error) {
    throw new GovernanceError(
      MIGRATION_VERIFICATION_FAILED,
      'Quiver state metadata is not valid JSON.',
      { cause_code: error?.code || 'STATE_JSON_INVALID' },
    );
  }
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

function hasGovernanceConfigEvidence(projectRoot) {
  const configPath = quiverInternalPaths(projectRoot).configPath;
  if (!fs.existsSync(configPath)) return false;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return Boolean(config && Object.prototype.hasOwnProperty.call(config, 'governance'));
  } catch {
    return true;
  }
}

function hasQuiverInitializationEvidence(projectRoot) {
  const state = readStateForCompatibility(projectRoot);
  return Boolean(state)
    || hasGovernanceConfigEvidence(projectRoot)
    || inspectLegacyMigrationLayout(projectRoot).hasLegacyLayout
    || hasLegacyQuiverInitializationEvidence(projectRoot);
}

function parseDeclaredRange(value) {
  let text = String(value || '').trim();
  if (text.startsWith('workspace:')) return null;
  if (text.startsWith('npm:create-quiver@')) text = text.slice('npm:create-quiver@'.length);
  if (text === '*' || text === 'latest') return { kind: 'any' };
  const match = text.match(/^(\^|~|>=|>|<=|<|=)?\s*(.+)$/);
  if (!match) return null;
  const version = parsePackageSemver(match[2]);
  if (!version) return null;
  return { kind: match[1] || 'exact', version: version.raw };
}

function incrementVersion(version, field) {
  const parsed = parsePackageSemver(version);
  const next = { major: parsed.major, minor: parsed.minor, patch: parsed.patch };
  if (field === 'major') {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
  } else if (field === 'minor') {
    next.minor += 1;
    next.patch = 0;
  } else {
    next.patch += 1;
  }
  return `${next.major}.${next.minor}.${next.patch}`;
}

function declaredRangeIncludesVersion(rangeValue, version) {
  const range = parseDeclaredRange(rangeValue);
  if (!range) return null;
  if (range.kind === 'any') return true;
  const lowerComparison = comparePackageSemver(version, range.version);
  if (range.kind === 'exact' || range.kind === '=') return lowerComparison === 0;
  if (range.kind === '>=') return lowerComparison >= 0;
  if (range.kind === '>') return lowerComparison > 0;
  if (range.kind === '<=') return lowerComparison <= 0;
  if (range.kind === '<') return lowerComparison < 0;
  if (range.kind === '~') {
    return lowerComparison >= 0
      && comparePackageSemver(version, incrementVersion(range.version, 'minor')) < 0;
  }
  if (range.kind === '^') {
    const parsed = parsePackageSemver(range.version);
    const upperField = parsed.major > 0 ? 'major' : parsed.minor > 0 ? 'minor' : 'patch';
    return lowerComparison >= 0
      && comparePackageSemver(version, incrementVersion(range.version, upperField)) < 0;
  }
  return null;
}

function inspectDeclaredWriterDependency(projectRoot, minimumWriterVersion) {
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return { declared: null, source: null, status: 'absent' };
  }
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    throw new GovernanceError(
      MIGRATION_VERIFICATION_FAILED,
      'package.json is not valid JSON.',
      { cause_code: error?.code || 'PACKAGE_JSON_INVALID' },
    );
  }
  const declarations = [
    ['dependencies', packageJson.dependencies?.['create-quiver']],
    ['devDependencies', packageJson.devDependencies?.['create-quiver']],
  ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0);
  if (declarations.length === 0) {
    return { declared: null, source: null, status: 'absent' };
  }
  const results = declarations.map(([source, declared]) => ({
    declared,
    source,
    includes_minimum: declaredRangeIncludesVersion(declared, minimumWriterVersion),
  }));
  const unsafe = results.find((result) => result.includes_minimum === false);
  const unverifiable = results.find((result) => result.includes_minimum === null);
  const selected = unsafe || unverifiable || results[0];
  return {
    declared: selected.declared,
    declarations: results,
    source: selected.source,
    status: unsafe ? 'older' : unverifiable ? 'unverifiable' : 'compatible',
  };
}

function compatibilityEvidenceExists(projectRoot, state) {
  return Boolean(state)
    || hasGovernanceConfigEvidence(projectRoot)
    || inspectLegacyMigrationLayout(projectRoot).hasLegacyLayout
    || hasGeneratedProjectSpec(projectRoot);
}

function inspectCompatibilityState(projectRoot, options = {}) {
  const state = readStateForCompatibility(projectRoot);
  let compatibility;
  try {
    compatibility = readGovernanceCompatibility(projectRoot, { allowMissing: true });
  } catch (error) {
    if (error?.code === LEGACY_EVIDENCE_UNVERIFIED) compatibility = null;
    else {
      throw new GovernanceError(
        MIGRATION_VERIFICATION_FAILED,
        'Governance compatibility metadata cannot be verified.',
        { cause_code: error?.code || 'GOVERNANCE_CONFIG_INVALID' },
      );
    }
  }
  if (!compatibility) {
    const hasEvidence = compatibilityEvidenceExists(projectRoot, state);
    return {
      status: hasEvidence ? 'legacy-unverified' : 'none',
      code: hasEvidence ? LEGACY_EVIDENCE_UNVERIFIED : null,
      writer_mode: null,
      minimum_writer_version: null,
      writer_compatible: null,
      declared_dependency: { declared: null, source: null, status: 'absent' },
      unavailable_counts: {
        approvals: null,
        conditions: null,
        dispositions: null,
        findings: null,
      },
    };
  }

  const hasInitialized = hasInitializedStateMetadata(state);
  const hasMigrated = Boolean(
    state
    && typeof state.migrated_version === 'string'
    && state.migrated_version.length > 0
    && typeof state.last_migration_at === 'string'
    && state.last_migration_at.length > 0,
  );
  if (!hasInitialized && !hasMigrated) {
    throw new GovernanceError(
      MIGRATION_VERIFICATION_FAILED,
      'Verified compatibility metadata requires initialized or migrated state evidence.',
      { state_present: Boolean(state) },
    );
  }

  const writerVersion = String(options.writerVersion || CURRENT_WRITER_VERSION).trim();
  const writerCompatible = comparePackageSemver(
    writerVersion,
    compatibility.minimum_writer_version,
  ) >= 0;
  const declaredDependency = inspectDeclaredWriterDependency(
    projectRoot,
    compatibility.minimum_writer_version,
  );
  const code = writerCompatible === false || declaredDependency.status === 'older'
    ? UNSAFE_WRITER_DOWNGRADE
    : compatibility.writer_mode === 'read-only'
      ? GOVERNANCE_READ_ONLY
      : null;
  return {
    status: compatibility.writer_mode === 'read-only' ? 'rollback-read-only' : 'v58-verified',
    code,
    writer_mode: compatibility.writer_mode,
    minimum_writer_version: compatibility.minimum_writer_version,
    writer_compatible: writerCompatible,
    declared_dependency: declaredDependency,
    unavailable_counts: null,
  };
}

function assertProjectWriterAllowed(projectRoot, options = {}) {
  const writerVersion = String(options.writerVersion || CURRENT_WRITER_VERSION).trim();
  const inspection = inspectCompatibilityState(projectRoot, { writerVersion });
  if (inspection.status === 'legacy-unverified') {
    if (options.allowLegacy === true) {
      const declaredDependency = inspectDeclaredWriterDependency(projectRoot, writerVersion);
      if (declaredDependency.status === 'older') {
        throw new GovernanceError(
          UNSAFE_WRITER_DOWNGRADE,
          'The declared local create-quiver dependency is older than the migration writer.',
          {
            action: options.action || null,
            declared_version: declaredDependency.declared,
            minimum_writer_version: writerVersion,
          },
        );
      }
      return { ...inspection, declared_dependency: declaredDependency };
    }
    throw new GovernanceError(
      LEGACY_EVIDENCE_UNVERIFIED,
      'Legacy Quiver evidence must be explicitly migrated before governed writes.',
      { action: options.action || null },
    );
  }
  if (inspection.status === 'none') return inspection;
  if (inspection.writer_compatible === false) {
    throw new GovernanceError(
      UNSAFE_WRITER_DOWNGRADE,
      'The active Quiver writer is older than the project minimum writer version.',
      {
        action: options.action || null,
        writer_version: writerVersion,
        minimum_writer_version: inspection.minimum_writer_version,
      },
    );
  }
  if (inspection.declared_dependency.status === 'older') {
    throw new GovernanceError(
      UNSAFE_WRITER_DOWNGRADE,
      'The declared local create-quiver dependency cannot satisfy the project minimum writer version.',
      {
        action: options.action || null,
        declared_version: inspection.declared_dependency.declared,
        minimum_writer_version: inspection.minimum_writer_version,
      },
    );
  }
  const governance = readGovernanceConfig(projectRoot);
  assertGovernanceWriterAllowed(governance, writerVersion, { action: options.action });
  return inspection;
}

function verifyProjectMigration(projectRoot, options = {}) {
  const writerVersion = String(options.writerVersion || CURRENT_WRITER_VERSION).trim();
  let inspection;
  try {
    inspection = inspectCompatibilityState(projectRoot, { writerVersion });
  } catch (error) {
    if ([GOVERNANCE_READ_ONLY, UNSAFE_WRITER_DOWNGRADE].includes(error?.code)) throw error;
    if (error?.code === MIGRATION_VERIFICATION_FAILED) throw error;
    throw new GovernanceError(
      MIGRATION_VERIFICATION_FAILED,
      'Project migration verification failed.',
      { cause_code: error?.code || 'COMPATIBILITY_INSPECTION_FAILED' },
    );
  }
  if (!['v58-verified', 'rollback-read-only'].includes(inspection.status)) {
    throw new GovernanceError(
      MIGRATION_VERIFICATION_FAILED,
      'Project migration has not produced verified v58 compatibility evidence.',
      { compatibility_status: inspection.status, cause_code: inspection.code },
    );
  }
  if (inspection.writer_compatible === false) {
    throw new GovernanceError(
      UNSAFE_WRITER_DOWNGRADE,
      'The active Quiver writer is older than the project minimum writer version.',
      {
        writer_version: writerVersion,
        minimum_writer_version: inspection.minimum_writer_version,
      },
    );
  }
  if (inspection.declared_dependency.status === 'older') {
    throw new GovernanceError(
      UNSAFE_WRITER_DOWNGRADE,
      'The declared local create-quiver dependency cannot satisfy the project minimum writer version.',
      {
        declared_version: inspection.declared_dependency.declared,
        minimum_writer_version: inspection.minimum_writer_version,
      },
    );
  }
  return { ...inspection, verified: true };
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
  const alreadyCurrent = currentState.quiver_version === cliVersion
    && currentState.migrated_version === cliVersion
    && typeof currentState.last_migration_at === 'string'
    && currentState.last_migration_at.length > 0;
  const now = alreadyCurrent ? currentState.last_migration_at : new Date().toISOString();
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

  const wrote = !isDeepStrictEqual(currentState, nextState);
  if (wrote) writeState(projectRoot, nextState);
  return {
    status: wrote ? 'applied' : 'already-current',
    wrote,
    state: nextState,
    path: statePath(projectRoot),
  };
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
  inspectCompatibilityState,
  inspectDeclaredWriterDependency,
  readState,
  statePath,
  assertProjectWriterAllowed,
  declaredRangeIncludesVersion,
  updateStateForAnalyze,
  updateStateForInit,
  updateStateForMigrate,
  verifyProjectMigration,
  writeState,
};
