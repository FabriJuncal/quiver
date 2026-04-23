const fs = require('fs');
const path = require('path');
const { worktreeList } = require('./git');

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function countNonEmptyLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .length;
}

function hasFrontMatter(text) {
  const value = String(text || '');
  if (!value.startsWith('---\n')) {
    return false;
  }

  return value.indexOf('\n---\n', 4) !== -1;
}

function normalizeRelativePath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function collectAiMarkdownFiles(projectRoot) {
  const aiDir = path.join(projectRoot, 'docs', 'ai');
  if (!fs.existsSync(aiDir)) {
    return [];
  }

  const files = [];

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };

  walk(aiDir);

  return files;
}

function countDocsAiFrontMatterIssues(projectRoot) {
  const files = collectAiMarkdownFiles(projectRoot);
  const missing = [];

  for (const filePath of files) {
    const text = readTextIfExists(filePath);
    if (!text || !hasFrontMatter(text)) {
      missing.push(normalizeRelativePath(projectRoot, filePath));
    }
  }

  return missing;
}

function countAgentsSections(projectRoot) {
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const text = readTextIfExists(agentsPath);
  if (!text) {
    return ['AGENTS.md'];
  }

  const requiredSections = [
    [/^Purpose$/m, 'Purpose'],
    [/^## Reading Budget$/m, 'Reading Budget'],
    [/^## Reading Order$/m, 'Reading Order'],
    [/^## Output Policy$/m, 'Output Policy'],
    [/^## Slice Execution Rules$/m, 'Slice Execution Rules'],
    [/^## Links$/m, 'Links'],
  ];

  const missing = requiredSections
    .filter(([pattern]) => !pattern.test(text))
    .map(([, label]) => label);
  return missing;
}

function countTieredPackSizeWarnings(projectRoot) {
  const warnings = [];

  const quickPath = path.join(projectRoot, 'docs', 'ai', 'QUICK.md');
  const quickText = readTextIfExists(quickPath);
  if (quickText && countNonEmptyLines(quickText) > 50) {
    warnings.push(`docs/ai/QUICK.md exceeds the 50 non-empty line budget (${countNonEmptyLines(quickText)})`);
  }

  const standardPath = path.join(projectRoot, 'docs', 'ai', 'STANDARD.md');
  const standardText = readTextIfExists(standardPath);
  if (standardText && countNonEmptyLines(standardText) > 300) {
    warnings.push(`docs/ai/STANDARD.md exceeds the 300 non-empty line budget (${countNonEmptyLines(standardText)})`);
  }

  return warnings;
}

function countActiveSliceOrphans(projectRoot) {
  const activeSlicePath = path.join(projectRoot, 'docs', 'ai', 'ACTIVE_SLICE.md');
  if (!fs.existsSync(activeSlicePath)) {
    return [];
  }

  const activeWorktrees = worktreeList(projectRoot).filter((entry) => {
    const worktreePath = entry.worktree || '';
    if (!worktreePath || worktreePath === projectRoot) {
      return false;
    }

    return fs.existsSync(path.join(worktreePath, 'WORKTREE_CONTEXT.md'));
  });

  if (activeWorktrees.length === 0) {
    return ['docs/ai/ACTIVE_SLICE.md exists without an active slice worktree'];
  }

  return [];
}

function countStackInfoLeaks(projectRoot) {
  const leakPatterns = [
    /Package manager:/i,
    /Detected package manager:/i,
    /Detected primary stack:/i,
    /Primary install:/i,
    /Primary test:/i,
    /Stack summary:/i,
  ];

  const generatedFiles = [];
  const docsDir = path.join(projectRoot, 'docs');

  if (fs.existsSync(docsDir)) {
    const walk = (dirPath) => {
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md') && path.relative(docsDir, fullPath) !== 'PROJECT_MAP.md') {
          generatedFiles.push(fullPath);
        }
      }
    };

    walk(docsDir);
  }

  const leaks = [];

  for (const filePath of generatedFiles) {
    const text = readTextIfExists(filePath);
    if (!text) {
      continue;
    }

    if (leakPatterns.some((pattern) => pattern.test(text))) {
      leaks.push(normalizeRelativePath(projectRoot, filePath));
    }
  }

  return leaks;
}

function collectDoctorWarnings(projectRoot) {
  const warnings = [];

  const agentsMissing = countAgentsSections(projectRoot);
  if (agentsMissing.length > 0) {
    if (agentsMissing.includes('AGENTS.md')) {
      warnings.push('missing AGENTS.md');
    } else {
      warnings.push(`AGENTS.md is missing required sections: ${agentsMissing.join(', ')}`);
    }
  }

  for (const issue of countTieredPackSizeWarnings(projectRoot)) {
    warnings.push(issue);
  }

  const frontMatterIssues = countDocsAiFrontMatterIssues(projectRoot);
  for (const issue of frontMatterIssues) {
    warnings.push(`${issue} is missing YAML front matter`);
  }

  for (const issue of countActiveSliceOrphans(projectRoot)) {
    warnings.push(issue);
  }

  const leakIssues = countStackInfoLeaks(projectRoot);
  if (leakIssues.length > 0) {
    warnings.push(`stack information appears outside docs/PROJECT_MAP.md: ${leakIssues.join(', ')}`);
  }

  return warnings;
}

module.exports = {
  collectDoctorWarnings,
};
