const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { discoverProjectFiles } = require('../../src/create-quiver/lib/ai/analyze-project-discovery');
const { sampleProjectFiles } = require('../../src/create-quiver/lib/ai/analyze-project-sampling');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-discovery-'));
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

test('project discovery reports workspace roots and safety exclusions without reading unsafe paths', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({
      name: 'workspace-root',
      workspaces: ['apps/*'],
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        '@supabase/supabase-js': '^2.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    }, null, 2),
    'pnpm-lock.yaml': 'lockfileVersion: 9\n',
    '.env': 'TOKEN=secret\n',
    'node_modules/pkg/index.js': 'module.exports = {}\n',
    'dist/bundle.js': 'console.log("built")\n',
    'apps/web/package.json': JSON.stringify({ name: 'web-app' }, null, 2),
    'apps/web/app/page.tsx': 'export default function Page() { return null }\n',
    'apps/web/prisma/schema.prisma': 'model User { id String @id }\n',
    'apps/web/__tests__/page.test.tsx': 'test("page", () => {})\n',
    'assets/logo.png': Buffer.from([0, 1, 2, 3]),
  });

  try {
    const discovery = discoverProjectFiles(repo.root);

    assert.equal(discovery.project.name, 'workspace-root');
    assert.equal(discovery.project.package_manager, 'pnpm');
    assert.ok(discovery.roots.workspaces.some((workspace) => workspace.path === 'apps/web' && workspace.name === 'web-app'));
    assert.ok(discovery.detected.stack.includes('nextjs'));
    assert.ok(discovery.detected.stack.includes('react'));
    assert.ok(discovery.detected.stack.includes('supabase'));
    assert.ok(discovery.safetyExclusions.some((item) => item.path === '.env' && item.reason === 'env-file'));
    assert.ok(discovery.safetyExclusions.some((item) => item.path === 'node_modules' && item.reason === 'unsafe-segment:node_modules'));
    assert.ok(discovery.safetyExclusions.some((item) => item.path === 'dist' && item.reason === 'unsafe-segment:dist'));
    assert.ok(discovery.skippedFiles.some((item) => item.path === 'assets/logo.png' && item.reason === 'binary-file'));
    assert.ok(discovery.files.some((file) => file.path === 'apps/web/app/page.tsx'));
  } finally {
    repo.cleanup();
  }
});

test('project discovery handles unknown stack, no package manager, symlinks, and large samples safely', () => {
  const repo = makeRepo({
    'README.md': '# Unknown Stack\n',
    'notes/domain.txt': 'Business notes without a known framework.\n',
  });

  try {
    fs.symlinkSync(path.join(repo.root, 'README.md'), path.join(repo.root, 'linked-readme.md'));
    for (let index = 0; index < 120; index += 1) {
      writeFile(path.join(repo.root, 'src/services', `service-${index}.ts`), `export const service${index} = ${index};\n`);
    }

    const discovery = discoverProjectFiles(repo.root);
    const sample = sampleProjectFiles(discovery.files, {
      includeSource: true,
      includeDb: false,
      includeTests: false,
      maxFiles: 10,
      maxBytes: 800,
    });

    assert.equal(discovery.project.package_manager, 'unknown');
    assert.deepEqual(discovery.detected.stack, []);
    assert.ok(discovery.skippedFiles.some((item) => item.path === 'linked-readme.md' && item.reason === 'symlink'));
    assert.ok(sample.selectedFiles.length <= 10);
    assert.ok(sample.budgets.selected_bytes <= 800);
    assert.ok(sample.omittedFiles.some((file) => file.reason === 'budget:max-files' || file.reason === 'budget:max-bytes'));
  } finally {
    repo.cleanup();
  }
});

test('semantic sampling respects source, test, db, and budget options', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({ name: 'sample-app' }, null, 2),
    'README.md': '# Sample\n',
    'src/routes/users.ts': 'export const users = []\n',
    'src/services/user-service.ts': 'export function listUsers() {}\n',
    'prisma/schema.prisma': 'model User { id String @id }\n',
    'src/__tests__/users.test.ts': 'test("users", () => {})\n',
  });

  try {
    const discovery = discoverProjectFiles(repo.root);
    const shallow = sampleProjectFiles(discovery.files, {
      includeSource: false,
      includeDb: false,
      includeTests: false,
      maxFiles: 10,
      maxBytes: 100000,
    });

    assert.ok(shallow.selectedFiles.some((file) => file.path === 'package.json'));
    assert.ok(shallow.omittedFiles.some((file) => file.path === 'src/routes/users.ts' && file.reason === 'option:source-disabled'));
    assert.ok(shallow.omittedFiles.some((file) => file.path === 'prisma/schema.prisma' && file.reason === 'option:db-disabled'));
    assert.ok(shallow.omittedFiles.some((file) => file.path === 'src/__tests__/users.test.ts' && file.reason === 'option:tests-disabled'));

    const deep = sampleProjectFiles(discovery.files, {
      includeSource: true,
      includeDb: true,
      includeTests: true,
      maxFiles: 2,
      maxBytes: 100000,
    });

    assert.equal(deep.selectedFiles.length, 2);
    assert.ok(deep.omittedFiles.some((file) => file.reason === 'budget:max-files'));
  } finally {
    repo.cleanup();
  }
});

test('project discovery can restrict analysis to a workspace name', () => {
  const repo = makeRepo({
    'package.json': JSON.stringify({
      name: 'root',
      workspaces: ['apps/*'],
    }, null, 2),
    'apps/web/package.json': JSON.stringify({ name: 'web' }, null, 2),
    'apps/web/app/page.tsx': 'export default function Page() { return null }\n',
    'apps/admin/package.json': JSON.stringify({ name: 'admin' }, null, 2),
    'apps/admin/app/page.tsx': 'export default function Admin() { return null }\n',
  });

  try {
    const discovery = discoverProjectFiles(repo.root, { scope: 'web' });
    assert.equal(discovery.roots.analysis_root, 'apps/web');
    assert.ok(discovery.files.some((file) => file.path === 'apps/web/app/page.tsx'));
    assert.equal(discovery.files.some((file) => file.path === 'apps/admin/app/page.tsx'), false);
  } finally {
    repo.cleanup();
  }
});
