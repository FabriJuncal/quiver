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
