const fs = require('node:fs');
const path = require('node:path');

const { assertSupportedProvider, formatProviderList } = require('./ai/providers');
const { quiverInternalPaths } = require('./init-layout');

const AGENT_PROFILE_ROLES = Object.freeze(['planner', 'executor', 'reviewer', 'researcher']);
const PROFILE_STATE_VERSION = 1;

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
  };
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
  const state = readAgentProfiles(projectRoot);
  return state.profiles[normalizedRole] || null;
}

function listAgentProfiles(projectRoot) {
  const state = readAgentProfiles(projectRoot);
  return AGENT_PROFILE_ROLES.map((role) => ({
    role,
    configured: Boolean(state.profiles[role]),
    profile: state.profiles[role] || null,
  }));
}

function setAgentProfile(projectRoot, role, options = {}) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const provider = assertSupportedProvider(options.provider);
  const model = normalizeOptionalText(options.model, 'model');
  const label = normalizeOptionalText(options.label, 'label');
  const context = normalizeOptionalText(options.context, 'context');
  const state = readAgentProfiles(projectRoot);
  const current = state.profiles[normalizedRole] || {};
  const now = new Date().toISOString();
  const profile = {
    role: normalizedRole,
    provider,
    model: model || current.model || '',
    label: label || current.label || '',
    context: context || current.context || '',
    updated_at: now,
  };

  state.version = PROFILE_STATE_VERSION;
  state.profiles = {
    ...state.profiles,
    [normalizedRole]: profile,
  };
  state.updated_at = now;

  const filePath = writeAgentProfiles(projectRoot, state);
  return {
    filePath,
    profile,
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
  formatProviderList,
  getAgentProfile,
  listAgentProfiles,
  normalizeAgentProfileRole,
  readAgentProfiles,
  resolveProfileProvider,
  setAgentProfile,
};
