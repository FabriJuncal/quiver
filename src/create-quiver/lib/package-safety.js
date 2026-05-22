const PACKAGE_PREFIX = 'package/';

const SAFETY_RULES = [
  {
    code: 'env-file',
    match(relativePath) {
      return /(^|\/)\.env($|[./])/.test(relativePath);
    },
  },
  {
    code: 'npm-credentials',
    match(relativePath) {
      return /(^|\/)\.npmrc$/.test(relativePath) || /(^|\/)\.npm(\/|$)/.test(relativePath);
    },
  },
  {
    code: 'ai-tool-state',
    match(relativePath) {
      return /(^|\/)\.(claude|codex|quiver)(\/|$)/.test(relativePath);
    },
  },
  {
    code: 'worktree-state',
    match(relativePath) {
      return /(^|\/)\.worktrees(\/|$)/.test(relativePath);
    },
  },
  {
    code: 'worktree-context',
    match(relativePath) {
      return /(^|\/)WORKTREE_CONTEXT\.md$/.test(relativePath);
    },
  },
  {
    code: 'demo-output',
    match(relativePath) {
      return relativePath === 'quiver-spec-viewer' || relativePath.startsWith('quiver-spec-viewer/');
    },
  },
];

function normalizeTarballPath(inputPath) {
  return String(inputPath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/{2,}/g, '/');
}

function stripPackagePrefix(inputPath) {
  const normalizedPath = normalizeTarballPath(inputPath);

  if (normalizedPath.startsWith(PACKAGE_PREFIX)) {
    return normalizedPath.slice(PACKAGE_PREFIX.length);
  }

  return normalizedPath;
}

function collectPackageSafetyViolations(paths) {
  const violations = [];
  const seen = new Set();

  for (const rawPath of paths || []) {
    const normalizedPath = normalizeTarballPath(rawPath);
    const relativePath = stripPackagePrefix(normalizedPath);

    for (const rule of SAFETY_RULES) {
      if (!rule.match(relativePath)) {
        continue;
      }

      const key = `${rule.code}:${normalizedPath}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      violations.push({
        code: rule.code,
        path: normalizedPath,
      });
    }
  }

  return violations;
}

function formatPackageSafetyViolations(violations) {
  return violations
    .map((violation) => `${violation.path} [${violation.code}]`)
    .join(', ');
}

function assertPackageSafety(paths) {
  const violations = collectPackageSafetyViolations(paths);

  if (violations.length === 0) {
    return {
      ok: true,
      violations,
    };
  }

  const error = new Error(`PACKAGE_SAFETY_FAILED: unsafe tarball contents detected: ${formatPackageSafetyViolations(violations)}`);
  error.code = 'PACKAGE_SAFETY_FAILED';
  error.violations = violations;
  throw error;
}

module.exports = {
  assertPackageSafety,
  collectPackageSafetyViolations,
  formatPackageSafetyViolations,
  normalizeTarballPath,
  stripPackagePrefix,
};
