const fs = require('node:fs');
const path = require('node:path');

const { assertSupportedProvider, formatProviderList } = require('./ai/providers');
const { normalizeModelSelection } = require('./ai/model-catalog');
const { preflightProvider } = require('./ai/preflight');
const { quiverInternalPaths } = require('./init-layout');

const AGENT_PROFILE_ROLES = Object.freeze(['planner', 'executor', 'reviewer', 'doctor']);
const PROFILE_STATE_VERSION = 2;

function formatError(message) {
  return `create-quiver: ${message}`;
}

function agentProfilesPath(projectRoot) {
  return path.join(quiverInternalPaths(projectRoot).root, 'agents', 'profiles.json');
}

function normalizeAgentProfileRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (!AGENT_PROFILE_ROLES.includes(normalized)) {
    throw new Error(formatError(`unsupported agent profile role '${role}'. Expected one of: ${AGENT_PROFILE_ROLES.join(', ')}`));
  }
  return normalized;
}

function normalizeOptionalText(value, fieldName) {
  if (value === undefined || value === null) {
    return '';
  }

  const normalized = String(value).trim();
  if (normalized.length > 160) {
    throw new Error(formatError(`agent profile ${fieldName} is too long`));
  }

  assertNotSecretLike(normalized, fieldName);
  return normalized;
}

function assertNotSecretLike(value, fieldName) {
  const text = String(value || '');
  const secretPatterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bsk-[A-Za-z0-9_-]{16,}\b/,
    /\bghp_[A-Za-z0-9_]{16,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{16,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{16,}\b/,
  ];

  if (secretPatterns.some((pattern) => pattern.test(text))) {
    throw new Error(formatError(`agent profile ${fieldName} looks like a secret; store provider credentials in the provider CLI, not in Quiver profiles`));
  }
}

function emptyProfilesState() {
  return {
    version: PROFILE_STATE_VERSION,
    profiles: {},
    profile_sets: {},
  };
}

function profileSetKey(role) {
  return `${normalizeAgentProfileRole(role)}s`;
}

function normalizeProfileId(value, fallback = 'default') {
  const source = String(value || fallback || 'default').trim().toLowerCase();
  const normalized = source
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'default';
}

function resolveAgentProfileDisplayName(profile = {}) {
  return profile.displayName || profile.model || profile.provider || profile.role || '';
}

function normalizeStoredProfile(profile, role, fallbackId = 'default') {
  const normalizedRole = normalizeAgentProfileRole(role || profile?.role);
  const provider = profile?.provider ? assertSupportedProvider(profile.provider) : '';
  const normalized = {
    id: normalizeProfileId(profile?.id || profile?.label, fallbackId),
    role: normalizedRole,
    provider,
    model: normalizeOptionalText(profile?.model, 'model'),
    label: normalizeOptionalText(profile?.label, 'label'),
    displayName: normalizeOptionalText(profile?.displayName || profile?.display_name, 'displayName'),
    context: normalizeOptionalText(profile?.context, 'context'),
    modelSource: normalizeOptionalText(profile?.modelSource || profile?.model_source, 'modelSource'),
    modelAlias: normalizeOptionalText(profile?.modelAlias || profile?.model_alias, 'modelAlias'),
    validation_status: normalizeOptionalText(profile?.validation_status || profile?.validationStatus, 'validation_status'),
    validated_at: normalizeOptionalText(profile?.validated_at || profile?.validatedAt, 'validated_at'),
    validation_error: normalizeOptionalText(profile?.validation_error || profile?.validationError, 'validation_error'),
    default: profile?.default === true,
    updated_at: profile?.updated_at || '',
  };
  if (!normalized.displayName) {
    normalized.displayName = resolveAgentProfileDisplayName(normalized);
  }
  return normalized;
}

function readAgentProfiles(projectRoot) {
  const filePath = agentProfilesPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return emptyProfilesState();
  }

  const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    version: state.version || PROFILE_STATE_VERSION,
    profiles: state.profiles && typeof state.profiles === 'object' ? state.profiles : {},
    profile_sets: state.profile_sets && typeof state.profile_sets === 'object' ? state.profile_sets : {},
    updated_at: state.updated_at || undefined,
  };
}

function writeAgentProfiles(projectRoot, state) {
  const filePath = agentProfilesPath(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
  return filePath;
}

function getAgentProfile(projectRoot, role) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const profiles = getAgentProfilesForRole(projectRoot, normalizedRole);
  if (profiles.length === 0) return null;
  return profiles.find((profile) => profile.default) || profiles[0];
}

function getAgentProfileById(projectRoot, role, profileId) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const normalizedId = normalizeProfileId(profileId);
  return getAgentProfilesForRole(projectRoot, normalizedRole)
    .find((profile) => profile.id === normalizedId) || null;
}

function getAgentProfilesForRole(projectRoot, role) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const state = readAgentProfiles(projectRoot);
  const setKey = profileSetKey(normalizedRole);
  const fromSet = Array.isArray(state.profile_sets[setKey])
    ? state.profile_sets[setKey].map((profile, index) => normalizeStoredProfile(profile, normalizedRole, index === 0 ? 'default' : `${normalizedRole}-${index + 1}`))
    : [];
  const legacy = state.profiles[normalizedRole]
    ? normalizeStoredProfile({ ...state.profiles[normalizedRole], default: true }, normalizedRole, 'default')
    : null;
  const merged = new Map();

  if (legacy) merged.set(legacy.id, legacy);
  for (const profile of fromSet) {
    merged.set(profile.id, profile);
  }

  const profiles = Array.from(merged.values()).filter((profile) => profile.provider);
  if (profiles.length > 0 && !profiles.some((profile) => profile.default)) {
    profiles[0].default = true;
  }
  return profiles;
}

function listAgentProfiles(projectRoot) {
  return AGENT_PROFILE_ROLES.map((role) => {
    const profiles = getAgentProfilesForRole(projectRoot, role);
    return {
      role,
      configured: profiles.length > 0,
      profile: profiles.find((profile) => profile.default) || profiles[0] || null,
      profiles,
    };
  });
}

function setAgentProfile(projectRoot, role, options = {}) {
  const next = buildAgentProfileState(projectRoot, role, options);

  const filePath = writeAgentProfiles(projectRoot, next.state);
  return {
    filePath,
    profile: next.profile,
  };
}

function buildAgentProfileState(projectRoot, role, options = {}) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const provider = assertSupportedProvider(options.provider);
  const rawModel = normalizeOptionalText(options.model, 'model');
  const label = normalizeOptionalText(options.label, 'label');
  const rawDisplayName = normalizeOptionalText(options.displayName || options.display_name, 'displayName');
  const context = normalizeOptionalText(options.context, 'context');
  const state = readAgentProfiles(projectRoot);
  const currentProfiles = getAgentProfilesForRole(projectRoot, normalizedRole);
  const currentDefault = currentProfiles.find((profile) => profile.default) || currentProfiles[0] || {};
  const modelSelection = rawModel
    ? normalizeModelSelection(provider, rawModel, { displayName: rawDisplayName })
    : null;
  const id = normalizeProfileId(options.id || currentDefault.id || label || modelSelection?.model || rawModel || provider);
  const current = currentProfiles.find((profile) => profile.id === id) || {};
  const model = modelSelection?.model || current.model || '';
  const displayName = rawDisplayName
    || modelSelection?.displayName
    || current.displayName
    || model
    || label
    || provider;
  const now = options.now instanceof Date ? options.now.toISOString() : new Date().toISOString();
  const shouldBeDefault = options.default === true || currentProfiles.length === 0 || (options.default !== false && current.default === true);
  const modelSource = modelSelection?.modelSource || current.modelSource || (model ? 'custom' : '');
  const modelAlias = modelSelection && modelSelection.input && modelSelection.input !== model
    ? modelSelection.input
    : (current.modelAlias || '');
  const profile = {
    id,
    role: normalizedRole,
    provider,
    model: model || current.model || '',
    label: label || current.label || '',
    displayName,
    context: context || current.context || '',
    modelSource,
    modelAlias,
    validation_status: current.validation_status || (model ? 'not-tested' : ''),
    validated_at: current.validated_at || '',
    validation_error: current.validation_error || '',
    default: shouldBeDefault,
    updated_at: now,
  };

  state.version = PROFILE_STATE_VERSION;
  const setKey = profileSetKey(normalizedRole);
  const nextProfiles = currentProfiles
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      default: shouldBeDefault ? false : item.default === true,
    }))
    .concat(profile);
  if (!nextProfiles.some((item) => item.default)) {
    nextProfiles[0].default = true;
  }
  state.profile_sets = {
    ...state.profile_sets,
    [setKey]: nextProfiles,
  };
  const defaultProfile = nextProfiles.find((item) => item.default) || profile;
  state.profiles = {
    ...state.profiles,
    [normalizedRole]: defaultProfile,
  };
  state.updated_at = now;

  return {
    action: current.provider ? 'update' : 'create',
    filePath: agentProfilesPath(projectRoot),
    profile,
    state,
  };
}

function resolveProfileProvider(projectRoot, role, fallbackProvider) {
  const profile = getAgentProfile(projectRoot, role);
  if (profile?.provider) {
    return assertSupportedProvider(profile.provider);
  }
  return assertSupportedProvider(fallbackProvider);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function rawText(value) {
  return String(value || '').trim();
}

function rawDisplayName(profile, role) {
  return rawText(profile.displayName || profile.display_name || profile.model || profile.provider || role);
}

function collectRawAgentProfileEntries(state) {
  const entries = [];
  for (const role of AGENT_PROFILE_ROLES) {
    const setKey = profileSetKey(role);
    const setProfiles = Array.isArray(state.profile_sets?.[setKey]) ? state.profile_sets[setKey] : [];
    if (setProfiles.length > 0) {
      setProfiles.forEach((profile, index) => {
        entries.push({
          role,
          profile,
          id: normalizeProfileId(profile?.id || profile?.label, index === 0 ? 'default' : `${role}-${index + 1}`),
          source: 'profile_sets',
          setKey,
          index,
        });
      });
      continue;
    }

    if (state.profiles?.[role]) {
      entries.push({
        role,
        profile: state.profiles[role],
        id: normalizeProfileId(state.profiles[role]?.id || state.profiles[role]?.label, 'default'),
        source: 'profiles',
        index: null,
      });
    }
  }
  return entries;
}

function createAgentProfileFinding(severity, code, message, entry, extra = {}) {
  return {
    severity,
    code,
    message,
    role: entry.role,
    profileId: entry.id,
    fix: extra.fix || '',
    before: extra.before,
    after: extra.after,
  };
}

function classifyAgentProfileEntry(projectRoot, entry, options = {}) {
  const findings = [];
  const profile = entry.profile || {};
  const providerInput = rawText(profile.provider).toLowerCase();
  const modelInput = rawText(profile.model);
  const displayName = rawDisplayName(profile, entry.role);
  let provider = providerInput;
  let status = 'ok';

  if (!providerInput) {
    findings.push(createAgentProfileFinding(
      'error',
      'missing-provider',
      `Profile ${entry.role}/${entry.id} is missing provider.`,
      entry,
      { fix: `npx create-quiver ai agent set ${entry.role} --provider <provider> --model <model>` },
    ));
  } else {
    try {
      provider = assertSupportedProvider(providerInput);
      const runPreflight = options.checkProviderCli !== false;
      if (runPreflight) {
        const preflight = options.preflightProvider || preflightProvider;
        try {
          preflight(provider, {
            cwd: projectRoot,
            probe: options.providerProbe,
            probeArgs: options.providerProbeArgs,
          });
        } catch (error) {
          findings.push(createAgentProfileFinding(
            'warning',
            error && error.code === 'MISSING_PROVIDER_CLI' ? 'provider-cli-missing' : 'provider-cli-unverified',
            `Provider CLI for '${provider}' could not be verified.`,
            entry,
            { fix: `Install and authenticate the ${provider} CLI, then rerun npx create-quiver ai agent doctor.` },
          ));
        }
      }
    } catch (error) {
      findings.push(createAgentProfileFinding(
        'error',
        'unsupported-provider',
        `Profile ${entry.role}/${entry.id} uses unsupported provider '${profile.provider}'.`,
        entry,
        { fix: `Use one of: ${formatProviderList()}.` },
      ));
      provider = providerInput;
    }
  }

  if (!modelInput) {
    findings.push(createAgentProfileFinding(
      'warning',
      'missing-model',
      `Profile ${entry.role}/${entry.id} has no model selected.`,
      entry,
      { fix: `npx create-quiver ai agent set ${entry.role} --provider ${provider || '<provider>'} --model <model>` },
    ));
  } else if (providerInput && findings.every((finding) => finding.code !== 'unsupported-provider')) {
    const modelSelection = normalizeModelSelection(provider, modelInput, {
      displayName: rawText(profile.displayName || profile.display_name),
    });
    if (modelSelection.modelSource === 'catalog' && modelSelection.model !== modelInput) {
      findings.push(createAgentProfileFinding(
        'warning',
        'display-model-alias',
        `Profile ${entry.role}/${entry.id} stores display alias '${modelInput}' as the technical model id.`,
        entry,
        {
          fix: 'Run npx create-quiver ai agent repair --dry-run to preview the normalized profile.',
          before: { model: modelInput, displayName: rawText(profile.displayName || profile.display_name) },
          after: { model: modelSelection.model, displayName: modelSelection.displayName },
        },
      ));
    }
    if (modelSelection.modelSource === 'custom') {
      const validationStatus = rawText(profile.validation_status || profile.validationStatus);
      if (!['validated', 'ok', 'passed'].includes(validationStatus.toLowerCase())) {
        findings.push(createAgentProfileFinding(
          'warning',
          'custom-model-unvalidated',
          `Profile ${entry.role}/${entry.id} uses custom model '${modelInput}' without live validation evidence.`,
          entry,
          { fix: `Run a dry-run or provider smoke with ${provider} before using this profile in automation.` },
        ));
      }
    }
  }

  if (profile.default === true) {
    findings.push(createAgentProfileFinding(
      'info',
      'default-profile',
      `Profile ${entry.role}/${entry.id} is the default ${entry.role} profile.`,
      entry,
    ));
  }

  if (findings.some((finding) => finding.severity === 'error')) status = 'error';
  else if (findings.some((finding) => finding.severity === 'warning')) status = 'warning';

  return {
    role: entry.role,
    id: entry.id,
    source: entry.source,
    provider,
    model: modelInput,
    displayName,
    default: profile.default === true,
    status,
    findings,
  };
}

function addDuplicateDisplayNameFindings(checks) {
  const groups = new Map();
  for (const check of checks) {
    const key = `${check.role}:${rawText(check.displayName).toLowerCase()}`;
    if (!check.displayName) continue;
    const group = groups.get(key) || [];
    group.push(check);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ids = group.map((item) => `${item.role}/${item.id}`).join(', ');
    for (const check of group) {
      check.findings.push({
        severity: 'warning',
        code: 'duplicate-display-name',
        message: `Display name '${check.displayName}' is shared by ${ids}.`,
        role: check.role,
        profileId: check.id,
        fix: 'Use --display-name or --id to make selector entries easier to distinguish.',
      });
      if (check.status !== 'error') check.status = 'warning';
    }
  }
}

function buildAgentProfileDoctorReport(projectRoot, options = {}) {
  const state = readAgentProfiles(projectRoot);
  const entries = collectRawAgentProfileEntries(state);
  const checks = entries.map((entry) => classifyAgentProfileEntry(projectRoot, entry, options));
  addDuplicateDisplayNameFindings(checks);
  const findings = checks.flatMap((check) => check.findings);
  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const info = findings.filter((finding) => finding.severity === 'info').length;
  const suggestedFixes = Array.from(new Set(findings
    .map((finding) => finding.fix)
    .filter(Boolean)));

  return {
    ok: errors === 0,
    summary: {
      profiles: checks.length,
      defaults: checks.filter((check) => check.default).length,
      errors,
      warnings,
      info,
    },
    checks,
    findings,
    suggestedFixes,
  };
}

function repairProfileObject(profile, provider, modelSelection) {
  const before = {
    model: rawText(profile.model),
    displayName: rawText(profile.displayName || profile.display_name),
    modelSource: rawText(profile.modelSource || profile.model_source),
    modelAlias: rawText(profile.modelAlias || profile.model_alias),
    validation_status: rawText(profile.validation_status || profile.validationStatus),
  };
  const after = {
    ...before,
    model: modelSelection.model,
    displayName: before.displayName || modelSelection.displayName,
    modelSource: 'catalog',
    modelAlias: before.model,
    validation_status: before.validation_status || 'not-tested',
  };

  profile.model = after.model;
  profile.displayName = after.displayName;
  profile.modelSource = after.modelSource;
  profile.modelAlias = after.modelAlias;
  profile.validation_status = after.validation_status;
  return { before, after, provider };
}

function buildAgentProfileRepairPlan(projectRoot, options = {}) {
  const state = readAgentProfiles(projectRoot);
  const nextState = cloneJson(state);
  const entries = collectRawAgentProfileEntries(state);
  const changes = [];

  for (const entry of entries) {
    const profile = entry.profile || {};
    const providerInput = rawText(profile.provider).toLowerCase();
    const modelInput = rawText(profile.model);
    if (!providerInput || !modelInput) continue;

    let provider;
    try {
      provider = assertSupportedProvider(providerInput);
    } catch (error) {
      continue;
    }

    const modelSelection = normalizeModelSelection(provider, modelInput, {
      displayName: rawText(profile.displayName || profile.display_name),
    });
    if (modelSelection.modelSource !== 'catalog' || modelSelection.model === modelInput) {
      continue;
    }

    const target = entry.source === 'profile_sets'
      ? nextState.profile_sets[entry.setKey][entry.index]
      : nextState.profiles[entry.role];
    const repair = repairProfileObject(target, provider, modelSelection);
    changes.push({
      role: entry.role,
      profileId: entry.id,
      provider,
      reason: 'display-model-alias',
      before: repair.before,
      after: repair.after,
    });
  }

  return {
    dryRun: true,
    wouldWrite: false,
    changes,
    nextState: options.includeState === true ? nextState : undefined,
  };
}

module.exports = {
  AGENT_PROFILE_ROLES,
  PROFILE_STATE_VERSION,
  agentProfilesPath,
  buildAgentProfileDoctorReport,
  buildAgentProfileRepairPlan,
  getAgentProfileById,
  getAgentProfilesForRole,
  resolveAgentProfileDisplayName,
  formatProviderList,
  buildAgentProfileState,
  getAgentProfile,
  listAgentProfiles,
  normalizeAgentProfileRole,
  readAgentProfiles,
  resolveProfileProvider,
  setAgentProfile,
};
