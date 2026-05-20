const fs = require('fs');
const path = require('path');
const { readAllSlices } = require('./slice-graph');
const { hasGeneratedProjectSpec, hasInitializedStateMetadata, readState } = require('./state');
const { worktreeList } = require('./git');

const NEW_LAYOUT_REQUIRED_PATHS = [
  'README.md',
  'AGENTS.md',
  'package.json',
  'docs/AI_CONTEXT.md',
  'docs/AI_ONBOARDING_PROMPT.md',
  'docs/COMMANDS.md',
  'docs/WORKFLOW.md',
  '.quiver/state.json',
  '.quiver/config.json',
  '.quiver/.gitignore',
];

const LEGACY_LAYOUT_PROBES = [
  'docs-template/',
  'tools/scripts/start-slice.sh',
  'tools/scripts/check-slice-readiness.sh',
  'tools/scripts/check-pr-readiness.sh',
  '.github/pull_request_template.md',
  'docs/PROJECT_SCAN.json',
];

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

function hasPath(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function collectPresentPaths(projectRoot, relativePaths) {
  return relativePaths.filter((relativePath) => hasPath(projectRoot, relativePath));
}

function collectMissingPaths(projectRoot, relativePaths) {
  return relativePaths.filter((relativePath) => !hasPath(projectRoot, relativePath));
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

function collectLayoutReport(projectRoot) {
  const hasStateMetadata = hasInitializedStateMetadata(readState(projectRoot));
  const realSlices = readAllSlices(projectRoot);
  const specSlugs = Array.from(new Set(realSlices.map((slice) => slice.specSlug))).sort((left, right) => left.localeCompare(right));
  const newLayoutFiles = collectPresentPaths(projectRoot, NEW_LAYOUT_REQUIRED_PATHS);
  const missingNewLayoutFiles = collectMissingPaths(projectRoot, NEW_LAYOUT_REQUIRED_PATHS);
  const legacySignals = collectPresentPaths(projectRoot, LEGACY_LAYOUT_PROBES);
  const hasLegacyProjectSpec = hasGeneratedProjectSpec(projectRoot);

  if (hasLegacyProjectSpec) {
    legacySignals.push('specs/<project-slug>/SPEC.md');
  }

  const hasNewLayout = missingNewLayoutFiles.length === 0;
  const hasLegacyLayout = legacySignals.length > 0;

  let layout = 'incomplete';
  if (hasNewLayout && hasLegacyLayout) {
    layout = 'hybrid';
  } else if (hasNewLayout) {
    layout = 'new';
  } else if (hasLegacyLayout) {
    layout = 'legacy';
  }

  const recommendations = [];

  if (layout === 'new') {
    if (specSlugs.length === 0) {
      recommendations.push('No specs yet. That is valid after the AI-first init flow.');
    } else {
      recommendations.push(`Specs found: ${specSlugs.join(', ')}.`);
    }

    if (!hasPath(projectRoot, 'docs/PROJECT_MAP.md')) {
      recommendations.push('Run `npx create-quiver analyze` to generate docs/PROJECT_MAP.md when you want the visible project map.');
    }
  } else if (layout === 'legacy') {
    recommendations.push('Legacy layout detected. Run `npx create-quiver migrate` to add the modern .quiver/ contract and AI-first docs.');
  } else if (layout === 'hybrid') {
    recommendations.push('Hybrid layout detected. Keep the new .quiver/ contract as the source of truth and plan cleanup of legacy roots.');
    recommendations.push('Review any remaining docs-template/, tools/scripts/, or docs/PROJECT_SCAN.json paths and migrate them only if they are still needed.');
  } else {
    recommendations.push('Incomplete layout detected. Restore the missing AI-first contract files before relying on this project for onboarding.');
    if (missingNewLayoutFiles.length > 0) {
      recommendations.push(`Missing files: ${missingNewLayoutFiles.join(', ')}.`);
    }
    if (!hasStateMetadata && !hasLegacyLayout) {
      recommendations.push('Run `npx create-quiver --name "Project Name"` or `npx create-quiver init` to create the Quiver contract first.');
    }
  }

  return {
    hasLegacyLayout,
    hasNewLayout,
    hasStateMetadata,
    layout,
    legacySignals,
    missingNewLayoutFiles,
    newLayoutFiles,
    recommendations,
    realSlices,
    specSlugs,
  };
}

function collectDoctorReport(projectRoot) {
  const layout = collectLayoutReport(projectRoot);
  const warnings = collectDoctorWarnings(projectRoot);

  return {
    ...layout,
    warnings,
  };
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
  collectDoctorReport,
  collectDoctorWarnings,
  collectLayoutReport,
};
