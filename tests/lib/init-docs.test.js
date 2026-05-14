const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { detectPackageManager, installSelfAsDevDep } = require('../../src/create-quiver/lib/init-docs');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('detectPackageManager returns npm when no lockfile exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    assert.equal(detectPackageManager(dir), 'npm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns yarn when yarn.lock exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    assert.equal(detectPackageManager(dir), 'yarn');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns pnpm when pnpm-lock.yaml exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    assert.equal(detectPackageManager(dir), 'pnpm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns bun when bun.lockb exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
    assert.equal(detectPackageManager(dir), 'bun');
  } finally {
    cleanup();
  }
});

test('detectPackageManager prefers bun over pnpm over yarn over npm', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
    assert.equal(detectPackageManager(dir), 'bun');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns skipped-no-package-json when no package.json', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'skipped-no-package-json');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'test', devDependencies: { 'create-quiver': '^0.7.0' } }),
    );
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'skipped-already-present');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns failed when install command fails', () => {
  const { dir, cleanup } = makeTmpDir();
  const originalPath = process.env.PATH;
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.PATH = '';
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'failed');
  } finally {
    process.env.PATH = originalPath;
    cleanup();
  }
});
