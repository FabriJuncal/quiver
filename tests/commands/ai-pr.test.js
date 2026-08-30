const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const test = require('node:test');

const { runDoctor, runPr } = require('../../src/create-quiver/commands/ai');
const { DEFAULT_GITFLOW_GUIDE_PATH } = require('../../src/create-quiver/lib/ai/github');
const { canonicalSha256 } = require('../../src/create-quiver/lib/ai/review-governance');
const {
  renderGovernanceTraceability,
  renderPendingGovernanceBlock,
} = require('../../src/create-quiver/lib/ai/spec-templates');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

async function captureStdout(fn) {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += String(chunk);
    return true;
  };
  try {
    const value = await fn();
    return { output, value };
  } finally {
    process.stdout.write = originalWrite;
  }
}

function createRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-'));
  git(root, ['init']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['checkout', '-b', 'feature/ai-pr-preflight']);
  git(root, ['remote', 'add', 'origin', 'git@github.com:example/quiver.git']);

  writeFile(path.join(root, 'README.md'), '# repo\n');

  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }

  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function createFakeGh(binDir) {
  const scriptPath = path.join(binDir, 'gh');
  writeFile(scriptPath, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('gh version 2.0.0\\n');
  process.exit(0);
}
if (args[0] === 'auth' && args[1] === 'status') {
  process.stdout.write('Logged in to github.com as octocat\\n');
  process.exit(0);
}
process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(1);
`);
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}

function governanceManifest() {
  const manifest = {
    schema_version: 1,
    kind: 'quiver-planning-governance',
    source: { run_id: 'run-pr', path: '.quiver/runs/run-pr/review-governance.json', sha256: `sha256:${'1'.repeat(64)}` },
    decision: {
      decision_id: 'DEC-PR',
      decision_sha256: `sha256:${'3'.repeat(64)}`,
      phase: 'technical-plan',
      publication_state: 'final',
      decision: 'approved-with-conditions',
      disposition_ids: ['DISP-PR'],
    },
    findings: [{ finding_id: 'F-001', state: 'open' }],
    dispositions: [{
      disposition_id: 'DISP-PR',
      finding_id: 'F-001',
      action: 'transfer-to-pr',
      target: 'phase:pr-review',
      evidence_obligations: ['Record PR review evidence.'],
      state: 'current',
      criterion_binding: { acceptance_ref: 'AC-11' },
    }],
  };
  return { ...manifest, manifest_sha256: canonicalSha256(manifest) };
}

function governedSpecBody(manifest) {
  return `${renderGovernanceTraceability(manifest).join('\n')}\n`;
}

function governanceEntry(extra = {}) {
  return {
    finding: { finding_id: 'F-001', state: extra.resolved ? 'closed' : 'open' },
    disposition: {
      disposition_id: 'DISP-PR',
      action: 'transfer-to-pr',
      target: 'phase:pr-review',
      evidence_obligations: ['Record PR review evidence.'],
      state: 'current',
      criterion_binding: { acceptance_ref: 'AC-11' },
    },
    target: 'phase:pr-review',
    criterion_binding: { acceptance_ref: 'AC-11' },
    pending: !extra.resolved,
    resolved: extra.resolved === true,
    accepted: extra.accepted !== false,
  };
}

function governedPrBody() {
  return [
    '## Title',
    'Governed PR',
    '',
    '## Summary',
    'Body',
    '',
    ...renderPendingGovernanceBlock([governanceEntry()]),
  ].join('\n');
}

function governanceOptions(manifest, entry, verifyOverride) {
  return {
    governanceEntriesForTargetFn: (_value, target) => (
      target == null || target === entry.disposition.target ? [entry] : []
    ),
    verifyGovernanceManifestParityFn: verifyOverride || (({ specRoot }) => ({
      manifest,
      manifestPath: path.join(specRoot, 'GOVERNANCE_MANIFEST.json'),
      specRoot,
    })),
  };
}

test('ai pr dry-run forwards git and ssh options to the GitHub preflight', async () => {
  let captured = null;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-unit-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');

  try {
    const result = await runPr(root, {
      dryRun: true,
      remote: 'upstream',
      sshHostAlias: 'github-work',
      identityFile: 'ssh/github-work',
      preflightFn: async (repoRoot, options) => {
        captured = { repoRoot, options };
        return {
          ok: true,
          repoRoot,
          remote: options.remote,
          branchName: 'feature/ai-pr-preflight',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
          sshHostAlias: options.sshHostAlias,
          identityFile: `${repoRoot}/${options.identityFile}`,
        };
      },
    });

    assert.equal(result.task, 'pr');
    assert.equal(result.dryRun, true);
    assert.equal(result.preflight.remote, 'upstream');
    assert.equal(result.preflight.sshHostAlias, 'github-work');
    assert.ok(result.preflight.identityFile.endsWith('ssh/github-work'));
    assert.equal(result.plan.title, 'Demo PR');
    assert.equal(captured.repoRoot, root);
    assert.equal(captured.options.remote, 'upstream');
    assert.equal(captured.options.sshHostAlias, 'github-work');
    assert.equal(captured.options.identityFile, 'ssh/github-work');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai doctor annotates GitHub preflight failures', async () => {
  await assert.rejects(
    runDoctor('/tmp/quiver-repo', {
      preflightFn: async () => {
        const error = new Error('missing GitHub CLI');
        error.code = 'MISSING_GH_CLI';
        error.details = { command: 'gh' };
        throw error;
      },
    }),
    (error) => error.message.includes('ai doctor failed')
      && error.message.includes('missing GitHub CLI')
      && error.code === 'MISSING_GH_CLI',
  );
});

test('ai pr json emits one machine report without human prose', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-json-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');

  try {
    const captured = await captureStdout(() => runPr(root, {
      dryRun: true,
      input: 'specs/demo/pr.md',
      json: true,
      preflightFn: async (repoRoot) => ({
        ok: true,
        repoRoot,
        remote: 'origin',
        branchName: 'feature/demo',
        guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
      }),
    }));
    const report = JSON.parse(captured.output);
    assert.equal(report.task, 'ai-pr');
    assert.equal(report.ok, true);
    assert.equal(report.governance.status, 'legacy');
    assert.doesNotMatch(captured.output, /GitHub pr dry-run|Command:/);
    assert.equal(captured.value.report.task, 'ai-pr');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr with an explicit run rejects an ungoverned PR surface', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-run-binding-'));
  writeFile(path.join(root, 'docs/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');

  try {
    await assert.rejects(
      runPr(root, {
        dryRun: true,
        input: 'docs/pr.md',
        runId: 'run-pr',
        preflightFn: async (repoRoot) => ({
          ok: true,
          repoRoot,
          remote: 'origin',
          branchName: 'feature/demo',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        }),
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.issue === 'unsupported-governance-surface',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr CLI dry-run wires through the new router and avoids opening a PR', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'specs/demo/pr.md': '## Title\nDemo PR\n\n## Summary\nBody\n',
    'ssh/github-work': 'identity-file\n',
  });
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-gh-'));

  try {
    createFakeGh(binDir);
    const output = execFileSync('node', [BIN_PATH, 'ai', 'pr', '--dry-run', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/github-work'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
      },
    });

    assert.ok(output.includes('GitHub pr dry-run'));
    assert.ok(output.includes('Command: gh pr create'));
    assert.ok(output.includes('SSH host alias: github-work'));
    assert.ok(output.includes('No PR will be created in dry-run mode.'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('ai pr CLI dry-run renders Spanish wrappers while preserving gh command', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'specs/demo/pr.md': '## Title\nDemo PR\n\n## Summary\nBody\n',
    'ssh/github-work': 'identity-file\n',
  });
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-gh-'));

  try {
    createFakeGh(binDir);
    const output = execFileSync('node', [BIN_PATH, '--lang', 'es', 'ai', 'pr', '--dry-run', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/github-work'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
      },
    });

    assert.ok(output.includes('GitHub pr dry-run'));
    assert.ok(output.includes('Comando: gh pr create'));
    assert.ok(output.includes('Alias SSH: github-work'));
    assert.ok(output.includes('No se creara ningun PR en modo dry-run.'));
    assert.ok(output.includes('--body-file'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('ai pr --review lets a human edit pr.md before the PR plan is built', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-review-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nOriginal PR\n\n## Summary\nBody\n');

  try {
    const result = await runPr(root, {
      dryRun: true,
      input: 'specs/demo/pr.md',
      review: true,
      preflightFn: async (repoRoot) => ({
        ok: true,
        repoRoot,
        remote: 'origin',
        branchName: 'feature/demo',
        guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
      }),
      openEditorFn: (prBodyPath) => {
        fs.writeFileSync(prBodyPath, '## Title\nEdited PR\n\n## Summary\nUpdated body\n');
        return { ok: true, canceled: false };
      },
    });

    assert.equal(result.plan.title, 'Edited PR');
    assert.equal(fs.readFileSync(path.join(root, 'specs/demo/pr.md'), 'utf8'), '## Title\nEdited PR\n\n## Summary\nUpdated body\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr --interactive can decline PR creation before gh runs', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-interactive-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');
  let ghCalled = false;

  try {
    await assert.rejects(
      runPr(root, {
        create: true,
        input: 'specs/demo/pr.md',
        interactive: true,
        promptConfirm: async () => false,
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        write: () => {},
        preflightFn: async (repoRoot) => ({
          ok: true,
          repoRoot,
          remote: 'origin',
          branchName: 'feature/demo',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        }),
        ghCreateRunner() {
          ghCalled = true;
          return { status: 0, stdout: '', stderr: '' };
        },
      }),
      /interactive approval declined/,
    );

    assert.equal(ghCalled, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr create runs gh pr create with pr.md after preflight', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-create-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');
  let captured = null;

  try {
    const result = await runPr(root, {
      create: true,
      input: 'specs/demo/pr.md',
      preflightFn: async (repoRoot) => ({
        ok: true,
        repoRoot,
        remote: 'origin',
        branchName: 'feature/demo',
        guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
      }),
      ghCreateRunner(command, args, options) {
        captured = { command, args, options };
        return {
          status: 0,
          stdout: 'https://github.com/example/repo/pull/1\n',
          stderr: '',
        };
      },
    });

    assert.equal(result.create, true);
    assert.equal(result.plan.title, 'Demo PR');
    assert.equal(captured.command, 'gh');
    assert.deepEqual(captured.args.slice(0, 2), ['pr', 'create']);
    assert.ok(captured.args.includes('--body-file'));
    assert.ok(captured.args.includes(path.join(root, 'specs/demo/pr.md')));
    assert.equal(captured.options.cwd, root);
    assert.ok(result.result.stdout.includes('/pull/1'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr create shows TTY progress for preflight and gh creation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-progress-'));
  writeFile(path.join(root, 'specs/demo/pr.md'), '## Title\nDemo PR\n\n## Summary\nBody\n');
  const events = [];

  try {
    await runPr(root, {
      create: true,
      input: 'specs/demo/pr.md',
      stdoutIsTTY: true,
      stdinIsTTY: true,
      stderrIsTTY: true,
      noColor: true,
      env: { LANG: 'en_US.UTF-8' },
      write: (text) => events.push(['write', text]),
      prompts: {
        spinner() {
          return {
            start(message) {
              events.push(['start', message]);
            },
            stop(message, code) {
              events.push(['stop', message, code]);
            },
          };
        },
      },
      preflightFn: async (repoRoot) => ({
        ok: true,
        repoRoot,
        remote: 'origin',
        branchName: 'feature/demo',
        guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
      }),
      ghCreateRunner() {
        return {
          status: 0,
          stdout: 'https://github.com/example/repo/pull/1\n',
          stderr: '',
        };
      },
    });

    assert.deepEqual(events, [
      ['write', '◇ Creating PR with gh\n'],
      ['start', 'Running GitHub preflight...'],
      ['stop', 'GitHub preflight ready', undefined],
      ['write', '✓ PR body prepared\n'],
      ['start', 'Creating PR in GitHub...'],
      ['stop', 'PR created', undefined],
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr revalidates governed PR evidence after editor changes', async () => {
  const manifest = governanceManifest();
  const entry = governanceEntry();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-governed-review-'));
  writeFile(path.join(root, 'specs/demo/GOVERNANCE_MANIFEST.json'), `${JSON.stringify(manifest)}\n`);
  writeFile(path.join(root, 'specs/demo/SPEC.md'), governedSpecBody(manifest));
  writeFile(path.join(root, 'specs/demo/pr.md'), governedPrBody());

  try {
    await assert.rejects(
      runPr(root, {
        ...governanceOptions(manifest, entry),
        dryRun: true,
        input: 'specs/demo/pr.md',
        review: true,
        preflightFn: async (repoRoot) => ({
          ok: true,
          repoRoot,
          remote: 'origin',
          branchName: 'feature/demo',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        }),
        openEditorFn: (prBodyPath) => {
          fs.writeFileSync(prBodyPath, '## Title\nEdited PR\n\n## Summary\nGovernance block removed.\n');
          return { ok: true, canceled: false };
        },
      }),
      (error) => error.code === 'REPRESENTATION_MISMATCH'
        && error.details.issue === 'omitted',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr revalidates canonical parity immediately before gh create', async () => {
  const manifest = governanceManifest();
  const entry = governanceEntry();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-governed-final-'));
  writeFile(path.join(root, 'specs/demo/GOVERNANCE_MANIFEST.json'), `${JSON.stringify(manifest)}\n`);
  writeFile(path.join(root, 'specs/demo/SPEC.md'), governedSpecBody(manifest));
  writeFile(path.join(root, 'specs/demo/pr.md'), governedPrBody());
  let verifyCount = 0;
  let ghCalled = false;

  try {
    const options = governanceOptions(manifest, entry, ({ specRoot }) => {
      verifyCount += 1;
      if (verifyCount === 2) {
        const error = new Error('APPROVAL_BINDING_MISMATCH: canonical source changed');
        error.code = 'APPROVAL_BINDING_MISMATCH';
        error.details = { issue: 'stale' };
        throw error;
      }
      return {
        manifest,
        manifestPath: path.join(specRoot, 'GOVERNANCE_MANIFEST.json'),
        specRoot,
      };
    });
    await assert.rejects(
      runPr(root, {
        ...options,
        create: true,
        input: 'specs/demo/pr.md',
        preflightFn: async (repoRoot) => ({
          ok: true,
          repoRoot,
          remote: 'origin',
          branchName: 'feature/demo',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        }),
        ghCreateRunner() {
          ghCalled = true;
          return { status: 0, stdout: '', stderr: '' };
        },
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.issue === 'stale',
    );
    assert.equal(verifyCount, 2);
    assert.equal(ghCalled, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ai pr fails closed when a PR-phase finding is neither closed nor accepted', async () => {
  const manifest = governanceManifest();
  const entry = governanceEntry({ accepted: false });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-governed-unresolved-'));
  writeFile(path.join(root, 'specs/demo/GOVERNANCE_MANIFEST.json'), `${JSON.stringify(manifest)}\n`);
  writeFile(path.join(root, 'specs/demo/SPEC.md'), governedSpecBody(manifest));
  writeFile(path.join(root, 'specs/demo/pr.md'), governedPrBody());

  try {
    await assert.rejects(
      runPr(root, {
        ...governanceOptions(manifest, entry),
        dryRun: true,
        input: 'specs/demo/pr.md',
        preflightFn: async (repoRoot) => ({
          ok: true,
          repoRoot,
          remote: 'origin',
          branchName: 'feature/demo',
          guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        }),
      }),
      (error) => error.code === 'DISPOSITION_UNRESOLVED'
        && error.details.issue === 'unresolved'
        && error.details.finding_ids.includes('F-001'),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
