const fs = require('node:fs');
const path = require('node:path');

const { getContextPathExclusionReason } = require('./safety');
const { classifyProjectFile, summarizeByReason } = require('./analyze-project-sampling');

const BINARY_EXTENSIONS = new Set([
  '.7z',
  '.avif',
  '.bmp',
  '.class',
  '.dll',
  '.dmg',
  '.doc',
  '.docx',
  '.eot',
  '.exe',
  '.gif',
  '.gz',
  '.ico',
  '.jar',
  '.jpeg',
  '.jpg',
  '.lockb',
  '.mov',
  '.mp3',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.so',
  '.tar',
  '.ttf',
  '.wasm',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function relativePath(from, to) {
  const relative = toPosix(path.relative(from, to));
  return relative || '.';
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function detectPackageManager(repoRoot) {
  const checks = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
    ['bun', 'bun.lockb'],
  ];
  for (const [manager, fileName] of checks) {
    if (fs.existsSync(path.join(repoRoot, fileName))) {
      return manager;
    }
  }
  const pkg = safeReadJson(path.join(repoRoot, 'package.json'));
  if (pkg && typeof pkg.packageManager === 'string') {
    return pkg.packageManager.split('@')[0] || 'unknown';
  }
  return 'unknown';
}

function readPackageJson(repoRoot, relativeDir = '.') {
  const packagePath = path.join(repoRoot, relativeDir, 'package.json');
  const pkg = fs.existsSync(packagePath) ? safeReadJson(packagePath) : null;
  return pkg && typeof pkg === 'object' ? pkg : null;
}

function expandWorkspacePattern(repoRoot, pattern) {
  const normalized = toPosix(pattern).trim();
  if (!normalized || normalized.startsWith('!')) {
    return [];
  }

  const withoutRecursive = normalized.replace(/\/\*\*.*$/, '');
  if (!withoutRecursive.includes('*')) {
    const absolute = path.resolve(repoRoot, withoutRecursive);
    return fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? [relativePath(repoRoot, absolute)] : [];
  }

  const parts = withoutRecursive.split('/');
  const starIndex = parts.indexOf('*');
  if (starIndex === -1) {
    return [];
  }

  const baseRelative = parts.slice(0, starIndex).join('/') || '.';
  const suffix = parts.slice(starIndex + 1);
  const baseAbsolute = path.resolve(repoRoot, baseRelative);
  if (!fs.existsSync(baseAbsolute) || !fs.statSync(baseAbsolute).isDirectory()) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(baseAbsolute, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const workspaceAbsolute = path.join(baseAbsolute, entry.name, ...suffix);
    if (fs.existsSync(workspaceAbsolute) && fs.statSync(workspaceAbsolute).isDirectory()) {
      results.push(relativePath(repoRoot, workspaceAbsolute));
    }
  }
  return results;
}

function readPnpmWorkspacePatterns(repoRoot) {
  const filePath = path.join(repoRoot, 'pnpm-workspace.yaml');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return lines
    .map((line) => line.trim().match(/^-\s+['"]?([^'"]+)['"]?$/))
    .filter(Boolean)
    .map((match) => match[1]);
}

function discoverWorkspaceRoots(repoRoot) {
  const rootPackage = readPackageJson(repoRoot);
  const patterns = [];
  const sources = new Map();

  if (rootPackage && Array.isArray(rootPackage.workspaces)) {
    for (const pattern of rootPackage.workspaces) {
      patterns.push(pattern);
      sources.set(pattern, 'package.json#workspaces');
    }
  } else if (rootPackage && rootPackage.workspaces && Array.isArray(rootPackage.workspaces.packages)) {
    for (const pattern of rootPackage.workspaces.packages) {
      patterns.push(pattern);
      sources.set(pattern, 'package.json#workspaces.packages');
    }
  }

  for (const pattern of readPnpmWorkspacePatterns(repoRoot)) {
    patterns.push(pattern);
    sources.set(pattern, 'pnpm-workspace.yaml');
  }

  for (const conventional of ['apps/*', 'packages/*']) {
    if (fs.existsSync(path.join(repoRoot, conventional.split('/')[0]))) {
      patterns.push(conventional);
      sources.set(conventional, 'convention');
    }
  }

  const rootsByPath = new Map();
  rootsByPath.set('.', {
    name: rootPackage?.name || path.basename(repoRoot),
    path: '.',
    source: 'repo-root',
  });

  for (const pattern of patterns) {
    for (const relative of expandWorkspacePattern(repoRoot, pattern)) {
      const pkg = readPackageJson(repoRoot, relative);
      rootsByPath.set(relative, {
        name: pkg?.name || path.basename(relative),
        path: relative,
        source: sources.get(pattern) || 'workspace-pattern',
      });
    }
  }

  return [...rootsByPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function resolveAnalysisRoot(repoRoot, scope, workspaceRoots) {
  if (!scope) {
    return {
      absolutePath: repoRoot,
      relativePath: '.',
      source: 'repo-root',
    };
  }

  const matchingWorkspace = workspaceRoots.find((workspace) => workspace.name === scope || workspace.path === scope);
  if (matchingWorkspace) {
    return {
      absolutePath: path.resolve(repoRoot, matchingWorkspace.path),
      relativePath: matchingWorkspace.path,
      source: 'workspace-scope',
    };
  }

  const absolutePath = path.resolve(repoRoot, scope);
  if (!isInside(repoRoot, absolutePath)) {
    throw new Error(`scope is outside the repository: ${scope}`);
  }
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    throw new Error(`scope directory does not exist: ${scope}`);
  }

  return {
    absolutePath,
    relativePath: relativePath(repoRoot, absolutePath),
    source: 'path-scope',
  };
}

function isBinaryFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(extension)) {
    return true;
  }

  let descriptor;
  try {
    descriptor = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024);
    const bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
    for (let index = 0; index < bytesRead; index += 1) {
      if (buffer[index] === 0) {
        return true;
      }
    }
  } catch (_) {
    return true;
  } finally {
    if (typeof descriptor === 'number') {
      fs.closeSync(descriptor);
    }
  }

  return false;
}

function walkFiles(repoRoot, analysisRoot) {
  const files = [];
  const skipped = [];
  const safetyExclusions = [];

  function visit(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      const relative = relativePath(repoRoot, absolutePath);
      const normalizedRelative = relative === '.' ? entry.name : relative;

      if (entry.isSymbolicLink()) {
        skipped.push({ path: toPosix(normalizedRelative), reason: 'symlink' });
        continue;
      }

      const exclusionReason = getContextPathExclusionReason(normalizedRelative);
      if (exclusionReason) {
        safetyExclusions.push({ path: toPosix(normalizedRelative), reason: exclusionReason });
        continue;
      }

      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        skipped.push({ path: toPosix(normalizedRelative), reason: 'not-regular-file' });
        continue;
      }

      const stat = fs.statSync(absolutePath);
      if (isBinaryFile(absolutePath)) {
        skipped.push({ path: toPosix(normalizedRelative), reason: 'binary-file' });
        continue;
      }

      files.push({
        path: toPosix(normalizedRelative),
        bytes: stat.size,
      });
    }
  }

  visit(analysisRoot);
  return { files, safetyExclusions, skipped };
}

function detectStack(repoRoot, files) {
  const stack = new Set();
  const configs = [];
  const entrypoints = [];
  const sourceRoots = new Set();
  const packageJson = readPackageJson(repoRoot);
  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };

  for (const dependency of Object.keys(dependencies)) {
    if (dependency === 'next') stack.add('nextjs');
    if (dependency === 'react') stack.add('react');
    if (dependency === 'vue') stack.add('vue');
    if (dependency === 'svelte') stack.add('svelte');
    if (dependency === '@nestjs/core') stack.add('nestjs');
    if (dependency === 'express') stack.add('express');
    if (dependency === 'fastify') stack.add('fastify');
    if (dependency === 'prisma' || dependency === '@prisma/client') stack.add('prisma');
    if (dependency === 'drizzle-orm') stack.add('drizzle');
    if (dependency.includes('supabase')) stack.add('supabase');
    if (dependency === 'typescript') stack.add('typescript');
  }

  for (const file of files) {
    const classification = classifyProjectFile(file.path);
    const firstSegment = file.path.split('/')[0];
    if (classification.signals.includes('config')) {
      configs.push(file.path);
    }
    if (classification.signals.includes('entrypoint')) {
      entrypoints.push(file.path);
    }
    if (classification.signals.some((signal) => ['source', 'frontend', 'backend'].includes(signal))) {
      sourceRoots.add(firstSegment);
    }

    const base = path.posix.basename(file.path);
    if (base === 'pyproject.toml') stack.add('python');
    if (base === 'pom.xml') stack.add('java');
    if (base === 'Gemfile') stack.add('ruby');
    if (base === 'go.mod') stack.add('go');
    if (base === 'composer.json') stack.add('php');
    if (base === 'pubspec.yaml') stack.add('dart');
  }

  return {
    stack: [...stack].sort(),
    configs: configs.sort(),
    entrypoints: entrypoints.sort(),
    source_roots: [...sourceRoots].sort(),
    scripts: packageJson?.scripts || {},
  };
}

function discoverProjectFiles(repoRoot, options = {}) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const workspaceRoots = discoverWorkspaceRoots(resolvedRepoRoot);
  const analysisRoot = resolveAnalysisRoot(resolvedRepoRoot, options.scope, workspaceRoots);
  const walked = walkFiles(resolvedRepoRoot, analysisRoot.absolutePath);
  const packageJson = readPackageJson(resolvedRepoRoot);

  return {
    project: {
      name: packageJson?.name || path.basename(resolvedRepoRoot),
      root: resolvedRepoRoot,
      package_manager: detectPackageManager(resolvedRepoRoot),
    },
    roots: {
      repo_root: resolvedRepoRoot,
      analysis_root: analysisRoot.relativePath,
      analysis_root_source: analysisRoot.source,
      workspaces: workspaceRoots,
    },
    files: walked.files,
    skippedFiles: walked.skipped,
    skippedSummary: summarizeByReason(walked.skipped),
    safetyExclusions: walked.safetyExclusions,
    safetySummary: summarizeByReason(walked.safetyExclusions),
    detected: detectStack(resolvedRepoRoot, walked.files),
  };
}

module.exports = {
  discoverProjectFiles,
  discoverWorkspaceRoots,
  resolveAnalysisRoot,
};
