const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  agentProfilesPath,
  getAgentProfile,
  listAgentProfiles,
  readAgentProfiles,
  resolveProfileProvider,
  setAgentProfile,
} = require('../../src/create-quiver/lib/agent-profiles');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-agent-profiles-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('agent profiles persist provider and free-form model labels without secrets', () => {
  const repo = makeRepo();

  try {
    const result = setAgentProfile(repo.root, 'planner', {
      provider: 'codex',
      model: 'gpt-5.5-xhigh',
      label: 'expensive-planner',
      context: 'planning',
    });

    assert.equal(result.filePath, agentProfilesPath(repo.root));
    assert.equal(fs.existsSync(result.filePath), true);

    const state = readAgentProfiles(repo.root);
    assert.equal(state.profiles.planner.provider, 'codex');
    assert.equal(state.profiles.planner.model, 'gpt-5.5-xhigh');
    assert.equal(state.profiles.planner.label, 'expensive-planner');
    assert.equal(state.profiles.planner.context, 'planning');
    assert.equal(JSON.stringify(state).includes('api_key'), false);
    assert.equal(JSON.stringify(state).includes('token'), false);
  } finally {
    repo.cleanup();
  }
});

test('agent profiles list and resolve configured provider defaults', () => {
  const repo = makeRepo();

  try {
    setAgentProfile(repo.root, 'executor', {
      provider: 'claude',
      model: 'sonnet',
    });
    setAgentProfile(repo.root, 'doctor', {
      provider: 'gemini',
      model: 'diagnostic',
    });

    assert.equal(getAgentProfile(repo.root, 'executor').provider, 'claude');
    assert.equal(getAgentProfile(repo.root, 'doctor').provider, 'gemini');
    assert.equal(resolveProfileProvider(repo.root, 'executor', 'codex'), 'claude');
    assert.equal(resolveProfileProvider(repo.root, 'planner', 'codex'), 'codex');
    assert.equal(resolveProfileProvider(repo.root, 'doctor', 'codex'), 'gemini');

    const profiles = listAgentProfiles(repo.root);
    assert.equal(profiles.find((profile) => profile.role === 'executor').configured, true);
    assert.equal(profiles.find((profile) => profile.role === 'reviewer').configured, false);
    assert.equal(profiles.find((profile) => profile.role === 'doctor').configured, true);
    assert.equal(profiles.find((profile) => profile.role === 'researcher'), undefined);
  } finally {
    repo.cleanup();
  }
});

test('agent profiles reject unsupported providers and secret-like values', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => setAgentProfile(repo.root, 'planner', { provider: 'openai', model: 'gpt' }),
      /Unsupported provider 'openai'. Supported providers: codex, claude, gemini\./,
    );

    assert.throws(
      () => setAgentProfile(repo.root, 'planner', { provider: 'codex', model: 'sk-1234567890abcdef' }),
      /looks like a secret/,
    );

    assert.throws(
      () => setAgentProfile(repo.root, 'researcher', { provider: 'codex', model: 'safe-label' }),
      /unsupported agent profile role 'researcher'.*planner, executor, reviewer, doctor/,
    );
  } finally {
    repo.cleanup();
  }
});
