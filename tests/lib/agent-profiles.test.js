const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  agentProfilesPath,
  buildAgentProfileDoctorReport,
  buildAgentProfileRepairPlan,
  getAgentProfileById,
  getAgentProfilesForRole,
  getAgentProfile,
  listAgentProfiles,
  readAgentProfiles,
  resolveAgentProfileDisplayName,
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

function writeProfiles(repoRoot, state) {
  const filePath = agentProfilesPath(repoRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
  return filePath;
}

test('agent profiles persist provider and technical model ids without secrets', () => {
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
    assert.equal(state.profiles.planner.id, 'expensive-planner');
    assert.equal(state.profiles.planner.displayName, 'gpt-5.5-xhigh');
    assert.equal(state.profiles.planner.context, 'planning');
    assert.equal(state.profiles.planner.modelSource, 'custom');
    assert.equal(state.profiles.planner.validation_status, 'not-tested');
    assert.equal(state.profile_sets.planners.length, 1);
    assert.equal(JSON.stringify(state).includes('api_key'), false);
    assert.equal(JSON.stringify(state).includes('token'), false);
  } finally {
    repo.cleanup();
  }
});

test('agent profiles normalize known visual model aliases to technical ids', () => {
  const repo = makeRepo();

  try {
    const result = setAgentProfile(repo.root, 'planner', {
      provider: 'codex',
      model: 'GPT 5.5',
    });

    assert.equal(result.profile.model, 'gpt-5.5');
    assert.equal(result.profile.displayName, 'GPT 5.5');
    assert.equal(result.profile.modelSource, 'catalog');
    assert.equal(result.profile.modelAlias, 'GPT 5.5');
    assert.equal(result.profile.validation_status, 'not-tested');

    const state = readAgentProfiles(repo.root);
    assert.equal(state.profiles.planner.model, 'gpt-5.5');
    assert.equal(state.profiles.planner.displayName, 'GPT 5.5');
  } finally {
    repo.cleanup();
  }
});

test('agent profiles support multiple named profiles per role with a default', () => {
  const repo = makeRepo();

  try {
    setAgentProfile(repo.root, 'planner', {
      id: 'gpt-55',
      provider: 'codex',
      model: 'gpt-5.5',
      displayName: 'GPT 5.5',
      default: true,
    });
    setAgentProfile(repo.root, 'planner', {
      id: 'opus-47',
      provider: 'claude',
      model: 'opus-4.7',
      displayName: 'OPUS 4.7',
      default: false,
    });

    const profiles = getAgentProfilesForRole(repo.root, 'planner');
    assert.equal(profiles.length, 2);
    assert.equal(getAgentProfile(repo.root, 'planner').id, 'gpt-55');
    assert.equal(getAgentProfileById(repo.root, 'planner', 'opus-47').provider, 'claude');
    assert.equal(resolveAgentProfileDisplayName(getAgentProfileById(repo.root, 'planner', 'gpt-55')), 'GPT 5.5');

    const listed = listAgentProfiles(repo.root).find((item) => item.role === 'planner');
    assert.equal(listed.configured, true);
    assert.equal(listed.profiles.length, 2);
    assert.equal(listed.profile.id, 'gpt-55');
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

test('agent profile doctor classifies aliases, custom models, and unsupported providers', () => {
  const repo = makeRepo();

  try {
    writeProfiles(repo.root, {
      version: 2,
      profiles: {},
      profile_sets: {
        planners: [
          { id: 'alias', role: 'planner', provider: 'codex', model: 'GPT 5.5', default: true },
          { id: 'custom', role: 'planner', provider: 'codex', model: 'local-planner' },
        ],
        executors: [
          { id: 'bad', role: 'executor', provider: 'openai', model: 'gpt' },
        ],
      },
    });

    const report = buildAgentProfileDoctorReport(repo.root, {
      checkProviderCli: false,
    });

    assert.equal(report.ok, false);
    assert.equal(report.summary.profiles, 3);
    assert.equal(report.summary.errors, 1);
    assert.equal(report.findings.some((finding) => finding.code === 'display-model-alias'), true);
    assert.equal(report.findings.some((finding) => finding.code === 'custom-model-unvalidated'), true);
    assert.equal(report.findings.some((finding) => finding.code === 'unsupported-provider'), true);
  } finally {
    repo.cleanup();
  }
});

test('agent profile repair plan previews alias normalization without writes', () => {
  const repo = makeRepo();

  try {
    writeProfiles(repo.root, {
      version: 2,
      profiles: {},
      profile_sets: {
        planners: [
          { id: 'alias', role: 'planner', provider: 'codex', model: 'GPT 5.5', default: true },
        ],
      },
    });

    const plan = buildAgentProfileRepairPlan(repo.root);
    const state = readAgentProfiles(repo.root);

    assert.equal(plan.dryRun, true);
    assert.equal(plan.wouldWrite, false);
    assert.equal(plan.changes.length, 1);
    assert.equal(plan.changes[0].before.model, 'GPT 5.5');
    assert.equal(plan.changes[0].after.model, 'gpt-5.5');
    assert.equal(plan.changes[0].after.displayName, 'GPT 5.5');
    assert.equal(state.profile_sets.planners[0].model, 'GPT 5.5');
  } finally {
    repo.cleanup();
  }
});
