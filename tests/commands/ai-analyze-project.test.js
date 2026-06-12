const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-project-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execAnalyzeProject(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'ai', 'analyze-project', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function spawnAnalyzeProject(repoRoot, args = []) {
  return spawnSync(process.execPath, [BIN_PATH, 'ai', 'analyze-project', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({
      name: 'analyze-demo',
      scripts: {
        dev: 'next dev',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
      },
    }, null, 2),
    '.env.local': 'TOKEN=secret\n',
    'app/page.tsx': 'export default function Page() { return null }\n',
    'src/components/Button.tsx': 'export function Button() { return null }\n',
    'prisma/schema.prisma': 'model Product { id String @id }\n',
    'src/__tests__/button.test.tsx': 'test("button", () => {})\n',
  });

  try {
    const output = execAnalyzeProject(repo.root, ['--deep', '--dry-run', '--max-files', '10']);

    assert.match(output, /AI analyze-project read-only analysis/);
    assert.match(output, /Mode: read-only/);
    assert.match(output, /Provider execution: skipped/);
    assert.match(output, /Writes: none/);
    assert.match(output, /Project: analyze-demo/);
    assert.match(output, /Selected files:/);
    assert.match(output, /app\/page\.tsx/);
    assert.match(output, /prisma\/schema\.prisma/);
    assert.match(output, /src\/__tests__\/button\.test\.tsx .*option:tests-disabled/);
    assert.match(output, /\.env\.local \(env-file\)/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --json emits clean machine-readable output', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'json-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = []\n',
    'src/routes/users.test.ts': 'test("users", () => {})\n',
  });

  try {
    const output = execAnalyzeProject(repo.root, ['--include-source', '--include-tests', '--dry-run', '--json', '--max-files', '5']);
    const parsed = JSON.parse(output);

    assert.equal(parsed.kind, 'quiver-project-analysis-plan');
    assert.equal(parsed.mode, 'read-only');
    assert.equal(parsed.read_only, true);
    assert.equal(parsed.provider_execution, 'skipped');
    assert.deepEqual(parsed.writes, []);
    assert.equal(parsed.project.name, 'json-demo');
    assert.ok(parsed.selected_files.some((file) => file.path === 'src/routes/users.ts'));
    assert.ok(parsed.selected_files.some((file) => file.path === 'src/routes/users.test.ts'));
    assert.ok(parsed.detected.structural_map.routes.includes('src/routes/users.ts'));
    assert.ok(parsed.detected.structural_map.exports.some((entry) => entry.path === 'src/routes/users.ts' && entry.exports.includes('users')));
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project rejects analysis flags on other ai subcommands', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'bad-flags' }, null, 2),
  });

  try {
    const result = spawnSync(process.execPath, [BIN_PATH, 'ai', 'prepare-context', '--max-files', '2', '--dry-run'], {
      cwd: repo.root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /analysis flags are only supported by ai analyze-project/);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'contract-demo' }, null, 2),
  });

  try {
    const reviewApply = spawnAnalyzeProject(repo.root, ['--deep', '--apply-docs', '--review']);
    assert.notEqual(reviewApply.status, 0);
    assert.equal(reviewApply.stdout, '');
    assert.match(reviewApply.stderr, /--apply-docs cannot be combined with --review/);

    const drySave = spawnAnalyzeProject(repo.root, ['--deep', '--dry-run', '--save-proposal']);
    assert.notEqual(drySave.status, 0);
    assert.equal(drySave.stdout, '');
    assert.match(drySave.stderr, /--dry-run cannot be combined with --save-proposal/);

    const jsonApply = spawnAnalyzeProject(repo.root, ['--deep', '--apply-docs', '--json']);
    assert.notEqual(jsonApply.status, 0);
    assert.equal(jsonApply.stdout, '');
    assert.match(jsonApply.stderr, /--json with --apply-docs requires --yes/);

    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project apply --run is parsed without provider/model and validates saved artifacts', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'apply-contract' }, null, 2),
  });

  try {
    const missingRun = spawnAnalyzeProject(repo.root, ['apply']);
    assert.notEqual(missingRun.status, 0);
    assert.match(missingRun.stderr, /apply requires --run <run-id>/);

    const applyRun = spawnAnalyzeProject(repo.root, ['apply', '--run', 'run-123']);
    assert.notEqual(applyRun.status, 0);
    assert.equal(applyRun.stdout, '');
    assert.match(applyRun.stderr, /missing analyze-project proposal manifest/);

    const latestYes = spawnAnalyzeProject(repo.root, ['apply', '--run', 'latest', '--yes']);
    assert.notEqual(latestYes.status, 0);
    assert.equal(latestYes.stdout, '');
    assert.match(latestYes.stderr, /--run latest cannot be combined with --yes/);

    const latestJson = spawnAnalyzeProject(repo.root, ['apply', '--run', 'latest', '--json']);
    assert.notEqual(latestJson.status, 0);
    assert.equal(latestJson.stdout, '');
    assert.match(latestJson.stderr, /--run latest cannot be combined with --json/);

    const mixed = spawnAnalyzeProject(repo.root, ['apply', '--run', 'run-123', '--save-proposal']);
    assert.notEqual(mixed.status, 0);
    assert.equal(mixed.stdout, '');
    assert.match(mixed.stderr, /apply --run cannot be combined with --apply-docs, --save-proposal, or --review/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --review remains a supported UX flag at CLI boundary', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'review-contract' }, null, 2),
  });

  try {
    const result = spawnAnalyzeProject(repo.root, ['--deep', '--review', '--json']);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stderr, /UX flag --review is not supported/);
    assert.match(result.stderr, /--json cannot be combined with --review/);
  } finally {
    repo.cleanup();
  }
});
