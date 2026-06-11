const fs = require('node:fs');
const path = require('node:path');

const { getContextPathExclusionReason } = require('./safety');
const {
  classifyProjectFile,
  isLockfilePath,
  summarizeByReason,
} = require('./analyze-project-sampling');

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
const STRUCTURAL_TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
]);
const MAX_STRUCTURAL_FILES = 80;
const MAX_STRUCTURAL_FILE_BYTES = 20_000;

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

function packageManagerFromLockfile(filePath) {
  const base = path.posix.basename(toPosix(filePath)).toLowerCase();
  if (base === 'package-lock.json') return 'npm';
  if (base === 'pnpm-lock.yaml') return 'pnpm';
  if (base === 'yarn.lock') return 'yarn';
  if (base === 'bun.lockb') return 'bun';
  if (base === 'cargo.lock') return 'cargo';
  if (base === 'gemfile.lock') return 'bundler';
  if (base === 'composer.lock') return 'composer';
  if (base === 'poetry.lock') return 'poetry';
  if (base === 'go.sum') return 'go';
  return 'unknown';
}

function readPackageJson(repoRoot, relativeDir = '.') {
  const packagePath = path.join(repoRoot, relativeDir, 'package.json');
  const pkg = fs.existsSync(packagePath) ? safeReadJson(packagePath) : null;
  return pkg && typeof pkg === 'object' ? pkg : null;
}

function dependencyNamesFromPackageJson(packageJson) {
  const names = [
    ...Object.keys(packageJson?.dependencies || {}),
    ...Object.keys(packageJson?.devDependencies || {}),
    ...Object.keys(packageJson?.peerDependencies || {}),
    ...Object.keys(packageJson?.optionalDependencies || {}),
  ];
  return uniqueSorted(names);
}

function summarizeNpmLockfile(lockfilePath) {
  const lock = safeReadJson(lockfilePath);
  if (!lock || typeof lock !== 'object') {
    return {
      dependency_count: null,
      dependency_count_source: 'unreadable-package-lock',
    };
  }

  if (lock.packages && typeof lock.packages === 'object') {
    return {
      dependency_count: Object.keys(lock.packages).filter(Boolean).length,
      dependency_count_source: 'package-lock.packages',
    };
  }

  if (lock.dependencies && typeof lock.dependencies === 'object') {
    return {
      dependency_count: Object.keys(lock.dependencies).length,
      dependency_count_source: 'package-lock.dependencies',
    };
  }

  return {
    dependency_count: 0,
    dependency_count_source: 'package-lock.empty',
  };
}

function summarizeLockfiles(repoRoot, files) {
  const packageJson = readPackageJson(repoRoot);
  const topDependencies = dependencyNamesFromPackageJson(packageJson).slice(0, 30);

  return files
    .filter((file) => isLockfilePath(file.path))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => {
      const manager = packageManagerFromLockfile(file.path);
      const lockfilePath = path.join(repoRoot, file.path);
      const details = manager === 'npm'
        ? summarizeNpmLockfile(lockfilePath)
        : {
            dependency_count: null,
            dependency_count_source: 'not-estimated',
          };

      return {
        path: file.path,
        package_manager: manager,
        bytes: file.bytes || 0,
        content_included: false,
        dependency_count: details.dependency_count,
        dependency_count_source: details.dependency_count_source,
        top_dependencies: topDependencies,
        reason: 'lockfile summarized as metadata; full content excluded from provider sample by default',
      };
    });
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function extractImportSpecifiers(content) {
  const imports = [];
  const patterns = [
    /\bimport\s+[^'"]*from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      imports.push(match[1]);
    }
  }
  return uniqueSorted(imports).slice(0, 12);
}

function extractExportNames(content) {
  const exports = [];
  const patterns = [
    /\bexport\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /\bexport\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/g,
    /\bexport\s+default\s+(?:function\s+)?([A-Za-z0-9_$]+)?/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      exports.push(match[1] || 'default');
    }
  }
  return uniqueSorted(exports).slice(0, 12);
}

function isRoutePath(filePath) {
  return /(^|\/)(routes?|controllers?|pages\/api|app\/api)(\/|$)/i.test(filePath)
    || /(^|\/)app\/.+\/(page|route)\.[jt]sx?$/i.test(filePath)
    || /(^|\/)pages\/.+\.[jt]sx?$/i.test(filePath);
}

function isComponentPath(filePath) {
  const basename = path.posix.basename(filePath).replace(/\.[^.]+$/, '');
  return /(^|\/)components?\//i.test(filePath) || /^[A-Z][A-Za-z0-9]+$/.test(basename);
}

function isContextPath(filePath) {
  return /(^|\/)(contexts?|providers?)\//i.test(filePath) || /(?:context|provider)\.[jt]sx?$/i.test(filePath);
}

function buildStructuralMap(repoRoot, files, detected) {
  const warnings = [];
  const routeFiles = [];
  const componentFiles = [];
  const contextFiles = [];
  const importEntries = [];
  const exportEntries = [];
  let scannedFiles = 0;

  for (const file of files.slice().sort((a, b) => a.path.localeCompare(b.path))) {
    if (isRoutePath(file.path)) routeFiles.push(file.path);
    if (isComponentPath(file.path)) componentFiles.push(file.path);
    if (isContextPath(file.path)) contextFiles.push(file.path);

    const extension = path.extname(file.path).toLowerCase();
    if (!STRUCTURAL_TEXT_EXTENSIONS.has(extension)) {
      continue;
    }
    if (scannedFiles >= MAX_STRUCTURAL_FILES) {
      warnings.push({ path: file.path, issue: 'structural-file-budget-exhausted' });
      continue;
    }
    if (file.bytes > MAX_STRUCTURAL_FILE_BYTES) {
      warnings.push({ path: file.path, issue: 'structural-file-too-large' });
      continue;
    }

    try {
      const content = fs.readFileSync(path.join(repoRoot, file.path), 'utf8');
      const imports = extractImportSpecifiers(content);
      const exports = extractExportNames(content);
      if (imports.length > 0) {
        importEntries.push({ path: file.path, imports });
      }
      if (exports.length > 0) {
        exportEntries.push({ path: file.path, exports });
      }
      scannedFiles += 1;
    } catch (error) {
      warnings.push({ path: file.path, issue: error.code || 'structural-read-failed' });
    }
  }

  return {
    schema_version: 1,
    files_scanned: scannedFiles,
    files_considered: files.length,
    warnings: warnings.slice(0, 40),
    routes: uniqueSorted(routeFiles).slice(0, 80),
    components: uniqueSorted(componentFiles).slice(0, 80),
    contexts: uniqueSorted(contextFiles).slice(0, 40),
    configs: (detected.configs || []).slice(0, 80),
    scripts: Object.keys(detected.scripts || {}).sort(),
    imports: importEntries.slice(0, 80),
    exports: exportEntries.slice(0, 80),
  };
}

function discoverProjectFiles(repoRoot, options = {}) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const workspaceRoots = discoverWorkspaceRoots(resolvedRepoRoot);
  const analysisRoot = resolveAnalysisRoot(resolvedRepoRoot, options.scope, workspaceRoots);
  const walked = walkFiles(resolvedRepoRoot, analysisRoot.absolutePath);
  const packageJson = readPackageJson(resolvedRepoRoot);
  const detected = detectStack(resolvedRepoRoot, walked.files);
  detected.lockfiles = summarizeLockfiles(resolvedRepoRoot, walked.files);
  detected.structural_map = buildStructuralMap(resolvedRepoRoot, walked.files, detected);

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
    detected,
  };
}

module.exports = {
  discoverProjectFiles,
  discoverWorkspaceRoots,
  resolveAnalysisRoot,
};
