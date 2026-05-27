const fs = require('node:fs');
const path = require('node:path');

const { assertSupportedProvider, formatProviderList } = require('./ai/providers');
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
  const model = normalizeOptionalText(options.model, 'model');
  const label = normalizeOptionalText(options.label, 'label');
  const displayName = normalizeOptionalText(options.displayName || options.display_name, 'displayName');
  const context = normalizeOptionalText(options.context, 'context');
  const state = readAgentProfiles(projectRoot);
  const currentProfiles = getAgentProfilesForRole(projectRoot, normalizedRole);
  const currentDefault = currentProfiles.find((profile) => profile.default) || currentProfiles[0] || {};
  const id = normalizeProfileId(options.id || currentDefault.id || label || model || provider);
  const current = currentProfiles.find((profile) => profile.id === id) || {};
  const now = options.now instanceof Date ? options.now.toISOString() : new Date().toISOString();
  const shouldBeDefault = options.default === true || currentProfiles.length === 0 || (options.default !== false && current.default === true);
  const profile = {
    id,
    role: normalizedRole,
    provider,
    model: model || current.model || '',
    label: label || current.label || '',
    displayName: displayName || current.displayName || model || label || provider,
    context: context || current.context || '',
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

module.exports = {
  AGENT_PROFILE_ROLES,
  PROFILE_STATE_VERSION,
  agentProfilesPath,
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
