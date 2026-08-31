const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-doctor-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runCliResult(args, options = {}) {
  try {
    const stdout = runCli(args, options);
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      status: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout ? String(error.stdout) : '',
      stderr: error.stderr ? String(error.stderr) : '',
    };
  }
}

function writeFile(root, relativePath, content = '') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(root, relativePath, data) {
  writeFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

test('doctor accepts the new default init layout before specs exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'No Spec Project', '--dir', target, '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Quiver Doctor/);
    assert.match(output, /Checks/);
    assert.match(output, /Suggested fixes/);
    assert.match(output, /Quiver doctor passed/);
    assert.match(output, /Layout: new/);
    assert.match(output, /Specs: none yet/);
    assert.match(output, /No specs yet\. That is valid after the AI-first init flow\./);
    assert.match(output, /Create real specs and slices only after acceptance criteria are approved and the technical plan is reviewed and approved\./);
    assert.doesNotMatch(output, /Warning: missing local docs link:/);
  } finally {
    cleanup();
  }
});

test('doctor localizes human output while preserving command snippets', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Proyecto Sin Specs', '--dir', target, '--skip-install']);
    writeFile(target, 'docs/BROKEN_LINK.md', '# Broken\n\n[Missing](./NOPE.md)\n');
    const output = runCli(['--lang', 'es', 'doctor'], { cwd: target });

    assert.match(output, /Doctor de Quiver/);
    assert.match(output, /Chequeos/);
    assert.match(output, /Arreglos sugeridos/);
    assert.match(output, /Doctor de Quiver aprobado para/);
    assert.match(output, /Layout: new/);
    assert.match(output, /Specs: ninguna todavia/);
    assert.match(output, /Todavia no hay specs\. Es valido despues del flujo init AI-first\./);
    assert.match(output, /Advertencia: missing local docs link: docs\/BROKEN_LINK\.md -> \.\/NOPE\.md/);
    assert.match(output, /npx create-quiver analyze/);
    assert.doesNotMatch(output, /Suggested fixes/);
    assert.doesNotMatch(output, /Warning: missing local docs link/);
  } finally {
    cleanup();
  }
});

test('doctor json emits parseable diagnostics with human parity', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Json Doctor Project', '--dir', target, '--skip-install']);
    writeFile(target, 'docs/BROKEN_LINK.md', '# Broken\n\n[Missing](./NOPE.md)\n');

    const human = runCli(['doctor'], { cwd: target });
    const json = JSON.parse(runCli(['doctor', '--json'], { cwd: target }));
    const brokenLinkCheck = json.checks.find((check) => check.message.includes('docs/BROKEN_LINK.md -> ./NOPE.md'));

    assert.equal(json.schema_version, 1);
    assert.equal(json.command, 'doctor');
    assert.ok(Array.isArray(json.checks));
    assert.ok(Array.isArray(json.suggested_fixes));
    assert.ok(brokenLinkCheck);
    assert.match(human, new RegExp(brokenLinkCheck.message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotThrow(() => JSON.stringify(json));
  } finally {
    cleanup();
  }
});

test('doctor json exits deterministically for blocking layout errors', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    writeJson(target, '.quiver/state.json', {
      initialized_version: '0.14.1',
      last_initialized_at: '2026-05-27T00:00:00.000Z',
    });

    const result = runCliResult(['doctor', '--json'], { cwd: target });
    const json = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(json.status, 'error');
    assert.equal(json.exit_code, 1);
    assert.ok(json.errors.some((error) => error.includes('missing file: README.md')));
  } finally {
    cleanup();
  }
});

test('doctor warns when package scripts target unsupported create-quiver commands', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Unsupported Script Project', '--dir', target, '--skip-install']);
    const packageJsonPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkg.scripts['quiver:ai:prepare-context'] = 'npx create-quiver ai prepare-context --dry-run';
    pkg.scripts['quiver:future'] = 'npx create-quiver future run -- npm test';
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Warning: package\.json script quiver:future targets unsupported command "future"/);
    assert.doesNotMatch(output, /quiver:ai:prepare-context targets unsupported ai subcommand "prepare-context"/);
    assert.match(output, /Update create-quiver or regenerate scripts with npx create-quiver migrate/);
  } finally {
    cleanup();
  }
});

test('doctor fix dry-run previews safe repairs without writing', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Fix Dry Run Project', '--dir', target, '--skip-install']);
    fs.rmSync(path.join(target, '.gitignore'), { force: true });
    const packageJsonPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    delete pkg.scripts['quiver:check-slice'];
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

    const output = runCli(['doctor', '--fix', '--dry-run'], { cwd: target });
    const afterPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    assert.match(output, /Quiver doctor fix dry-run/);
    assert.match(output, /Would update \.gitignore/);
    assert.match(output, /Would update package\.json/);
    assert.equal(fs.existsSync(path.join(target, '.gitignore')), false);
    assert.equal(afterPkg.scripts['quiver:check-slice'], undefined);
  } finally {
    cleanup();
  }
});

test('doctor fix applies safe repairs idempotently', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Fix Project', '--dir', target, '--skip-install']);
    fs.writeFileSync(path.join(target, '.gitignore'), 'custom.log\nnode_modules\n');
    const packageJsonPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    delete pkg.scripts['quiver:check-slice'];
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

    const firstOutput = runCli(['doctor', '--fix'], { cwd: target });
    const secondOutput = runCli(['doctor', '--fix'], { cwd: target });
    const gitignore = fs.readFileSync(path.join(target, '.gitignore'), 'utf8');
    const fixedPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    assert.match(firstOutput, /Updated \.gitignore/);
    assert.match(firstOutput, /Updated package\.json/);
    assert.match(secondOutput, /No safe fixes to apply/);
    assert.match(gitignore, /^custom\.log$/m);
    assert.equal((gitignore.match(/^node_modules\/?$/gm) || []).length, 1);
    assert.equal((gitignore.match(/^dist\/$/gm) || []).length, 1);
    assert.equal(typeof fixedPkg.scripts['quiver:check-slice'], 'string');
  } finally {
    cleanup();
  }
});

test('doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Ignore Project', '--dir', target, '--skip-install']);
    execFileSync('git', ['init'], { cwd: target, stdio: 'ignore' });
    const excludePath = path.join(target, '.git', 'info', 'exclude');
    fs.appendFileSync(excludePath, '.quiver/\ncustom-local.log\n');

    const before = runCli(['doctor'], { cwd: target });
    const firstFix = runCli(['doctor', '--fix'], { cwd: target });
    const secondFix = runCli(['doctor', '--fix'], { cwd: target });
    const exclude = fs.readFileSync(excludePath, 'utf8');

    assert.match(before, /blanket \.quiver\/ Git exclusion hides repository-visible configuration/);
    assert.match(firstFix, /Updated \.git\/info\/exclude/);
    assert.match(secondFix, /No safe fixes to apply/);
    assert.doesNotMatch(exclude, /^\.quiver\/$/m);
    assert.match(exclude, /^custom-local\.log$/m);
    assert.equal((exclude.match(/^\.quiver\/locks\/$/gm) || []).length, 1);
    assert.throws(
      () => execFileSync('git', ['check-ignore', '-q', '.quiver/config.json'], { cwd: target, stdio: 'ignore' }),
      (error) => error.status === 1,
    );
  } finally {
    cleanup();
  }
});

test('doctor diagnoses missing governance and requires explicit migration without rewriting config', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Governance Merge', '--dir', target, '--skip-install']);
    const configPath = path.join(target, '.quiver', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    delete config.governance;
    config.compatible_project_key = { enabled: true };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const before = runCliResult(['doctor'], { cwd: target });
    const fixed = runCliResult(['doctor', '--fix'], { cwd: target });
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    assert.equal(before.status, 1);
    assert.match(before.stdout, /missing v58 governance configuration/);
    assert.equal(fixed.status, 1);
    assert.match(fixed.stderr, /Legacy Quiver evidence must be explicitly migrated/);
    assert.equal(saved.compatible_project_key.enabled, true);
    assert.equal(saved.governance, undefined);
  } finally {
    cleanup();
  }
});

test('doctor reports invalid governance without overwriting authorization policy', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Invalid Governance', '--dir', target, '--skip-install']);
    const configPath = path.join(target, '.quiver', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.governance.requested_profile = 'unsafe-profile';
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    const before = fs.readFileSync(configPath, 'utf8');

    const report = runCliResult(['doctor'], { cwd: target });
    const fixed = runCliResult(['doctor', '--fix'], { cwd: target });

    assert.equal(report.status, 1);
    assert.match(report.stdout, /invalid v58 governance configuration \(GOVERNANCE_CONFIG_INVALID\)/);
    assert.equal(fixed.status, 1);
    assert.match(fixed.stderr, /Governance compatibility metadata cannot be verified/);
    assert.equal(fs.readFileSync(configPath, 'utf8'), before);
  } finally {
    cleanup();
  }
});

test('doctor gives actionable AGENTS.md repair guidance', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Agents Guidance Project', '--dir', target, '--skip-install']);
    fs.writeFileSync(path.join(target, 'AGENTS.md'), '# Custom Agents\n\nManual project note.\n');

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Warning: AGENTS\.md is missing required sections:/);
    assert.match(output, /Repair AGENTS\.md contract: npx create-quiver doctor --fix --dry-run, then npx create-quiver doctor --fix/);
  } finally {
    cleanup();
  }
});

test('doctor fix repairs AGENTS.md contract without replacing manual content', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Agents Fix Project', '--dir', target, '--skip-install']);
    fs.writeFileSync(path.join(target, 'AGENTS.md'), '# Custom Agents\n\nManual project note.\n');

    const dryRun = runCli(['doctor', '--fix', '--dry-run'], { cwd: target });
    const firstOutput = runCli(['doctor', '--fix'], { cwd: target });
    const secondOutput = runCli(['doctor', '--fix'], { cwd: target });
    const agents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');

    assert.match(dryRun, /Would update AGENTS\.md: Append missing AGENTS\.md contract sections/);
    assert.match(firstOutput, /Updated AGENTS\.md: Append missing AGENTS\.md contract sections/);
    assert.match(secondOutput, /No safe fixes to apply/);
    assert.match(agents, /Manual project note/);
    assert.match(agents, /^Purpose$/m);
    assert.match(agents, /^## Reading Budget$/m);
    assert.match(agents, /^## Reading Order$/m);
    assert.match(agents, /^## Output Policy$/m);
    assert.match(agents, /^## Slice Execution Rules$/m);
    assert.match(agents, /^## Links$/m);
  } finally {
    cleanup();
  }
});

test('doctor warns about missing local markdown links in generated docs', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Broken Link Project', '--dir', target, '--skip-install']);
    writeFile(target, 'docs/BROKEN_LINK.md', '# Broken\n\n[Missing](./NOPE.md)\n[External](https://example.com)\n');

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Warning: missing local docs link: docs\/BROKEN_LINK\.md -> \.\/NOPE\.md/);
    assert.doesNotMatch(output, /example\.com/);
  } finally {
    cleanup();
  }
});

test('doctor reports a legacy layout with migration guidance', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    fs.mkdirSync(target, { recursive: true });
    writeJson(target, 'package.json', {
      name: 'legacy-project',
      scripts: {
        migrate: 'bash tools/scripts/migrate-project.sh',
        'start:slice': 'bash tools/scripts/start-slice.sh',
        'check:slice': 'bash tools/scripts/check-slice-readiness.sh',
        'check:pr': 'bash tools/scripts/check-pr-readiness.sh',
        'cleanup:slice': 'bash tools/scripts/cleanup-slice.sh',
        'check:scope': 'bash tools/scripts/check-scope.sh',
        'refresh:active-slices': 'bash tools/scripts/refresh-active-slices.sh',
      },
    });
    writeFile(target, 'docs-template/scripts/init-docs.sh', '#!/usr/bin/env bash\n');
    writeFile(target, '.github/pull_request_template.md', '# PR\n');
    writeFile(target, 'docs/INDEX.md', '# Index\n');
    writeFile(target, 'specs/legacy-project/SPEC.md', '# Spec\n');
    writeFile(target, 'specs/legacy-project/STATUS.md', '# Status\n');
    writeFile(target, 'specs/legacy-project/EVIDENCE_REPORT.md', '# Evidence\n');
    writeJson(target, 'specs/legacy-project/slices/slice-template/slice.json', {
      slice_id: 'slice-template',
      status: 'draft',
    });

    for (const file of [
      'tools/scripts/start-slice.sh',
      'tools/scripts/check-slice-readiness.sh',
      'tools/scripts/check-pr-readiness.sh',
      'tools/scripts/cleanup-slice.sh',
      'tools/scripts/check-scope.sh',
      'tools/scripts/refresh-active-slices.sh',
      'tools/scripts/migrate-project.sh',
    ]) {
      writeFile(target, file, '#!/usr/bin/env bash\n');
      fs.chmodSync(path.join(target, file), 0o755);
    }

    const result = runCliResult(['doctor'], { cwd: target });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Layout: legacy/);
    assert.match(result.stdout, /Legacy layout detected\. Run `npx create-quiver migrate`/);
    assert.match(result.stdout, /Legacy signals:/);
  } finally {
    cleanup();
  }
});

test('doctor accepts the minimal init layout before specs exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Minimal Project', '--dir', target, '--minimal', '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Layout: new/);
    assert.match(output, /Specs: none yet/);
  } finally {
    cleanup();
  }
});

test('doctor reports a hybrid layout when explicit full compatibility assets exist', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Full Project', '--dir', target, '--full', '--skip-install']);
    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Layout: hybrid/);
    assert.match(output, /Legacy signals:/);
    assert.match(output, /tools\/scripts\/start-slice\.sh/);
  } finally {
    cleanup();
  }
});

test('doctor examples prefer an active slice over the first spec alphabetically', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Active Spec Project', '--dir', target, '--skip-install']);
    for (const specSlug of ['alpha-spec', 'zeta-active-spec']) {
      writeFile(target, `specs/${specSlug}/SPEC.md`, `# ${specSlug}\n`);
      writeFile(target, `specs/${specSlug}/STATUS.md`, '# Status\n');
      writeFile(target, `specs/${specSlug}/EVIDENCE_REPORT.md`, '# Evidence\n');
    }
    writeJson(target, 'specs/alpha-spec/slices/slice-00/slice.json', {
      slice_id: 'slice-00',
      status: 'completed',
    });
    writeJson(target, 'specs/zeta-active-spec/slices/slice-01/slice.json', {
      slice_id: 'slice-01-active',
      status: 'in-progress',
    });

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Example target: zeta-active-spec\/slice-01-active \(in-progress\)/);
    assert.match(output, /start-slice specs\/zeta-active-spec\/slices\/slice-01-active\/slice\.json/);
    assert.doesNotMatch(output, /start-slice specs\/alpha-spec\/slices\/<slice-id>\/slice\.json/);
  } finally {
    cleanup();
  }
});

test('doctor uses generic examples when multiple specs have no active slice', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Generic Spec Project', '--dir', target, '--skip-install']);
    for (const specSlug of ['alpha-spec', 'zeta-spec']) {
      writeFile(target, `specs/${specSlug}/SPEC.md`, `# ${specSlug}\n`);
      writeFile(target, `specs/${specSlug}/STATUS.md`, '# Status\n');
      writeFile(target, `specs/${specSlug}/EVIDENCE_REPORT.md`, '# Evidence\n');
      writeJson(target, `specs/${specSlug}/slices/slice-00/slice.json`, {
        slice_id: 'slice-00',
        status: 'completed',
      });
    }

    const output = runCli(['doctor'], { cwd: target });

    assert.match(output, /Example target: specs\/<spec-slug>\/slices\/<slice-id>\/slice\.json/);
    assert.match(output, /start-slice specs\/<spec-slug>\/slices\/<slice-id>\/slice\.json/);
    assert.doesNotMatch(output, /start-slice specs\/alpha-spec\/slices\/<slice-id>\/slice\.json/);
  } finally {
    cleanup();
  }
});

test('doctor reports stale generated context when scan is newer than project map', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Doctor Stale Docs Project', '--dir', target, '--skip-install']);
    runCli(['analyze'], { cwd: target });

    const projectMapPath = path.join(target, 'docs', 'PROJECT_MAP.md');
    const scanPath = path.join(target, '.quiver', 'scans', 'PROJECT_SCAN.json');
    const oldDate = new Date('2026-01-01T00:00:00.000Z');
    const newDate = new Date('2026-01-01T00:00:05.000Z');
    fs.utimesSync(projectMapPath, oldDate, oldDate);
    fs.utimesSync(scanPath, newDate, newDate);

    const output = runCli(['flow'], { cwd: target });

    assert.match(output, /Context source: \.quiver\/scans\/PROJECT_SCAN\.json newer than docs\/PROJECT_MAP\.md; run analyze to refresh visible context/);
  } finally {
    cleanup();
  }
});

test('doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Old State Project', '--dir', target, '--full', '--skip-install']);
    fs.rmSync(path.join(target, '.quiver', 'state.json'));
    writeJson(target, '.quiver/state.json', {
      migrated_version: '0.7.0',
    });
    fs.rmSync(path.join(target, 'docs', 'AI_ONBOARDING_PROMPT.md'));

    const result = runCliResult(['doctor'], { cwd: target });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Layout: legacy/);
    assert.match(result.stdout, /Legacy layout detected\. Run `npx create-quiver migrate`/);
    assert.doesNotMatch(result.stdout, /Run init first: npx create-quiver --name "Project Name"/);
  } finally {
    cleanup();
  }
});
