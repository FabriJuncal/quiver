const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { checkHandoff, scaffoldHandoff } = require('./lib/handoff');
const { collectDoctorReport } = require('./lib/doctor');
const { runAgent: runAiAgent, runApprovalStatus: runAiApprovalStatus, runApprove: runAiApprove, runDoctor: runAiDoctor, runExecutePlan: runAiExecutePlan, runExecuteSlice: runAiExecuteSlice, runOnboard, runPlan: runAiPlan, runPr: runAiPr, runReviewPlan: runAiReviewPlan } = require('./commands/ai');
const { runPrepare } = require('./commands/prepare');
const { runFlow } = require('./commands/flow');
const { runGraph } = require('./commands/graph');
const { runNext } = require('./commands/next');
const { runPlan } = require('./commands/plan');
const { buildInitLayout, formatInitLayoutPlan } = require('./lib/init-layout');
const { initializeProjectDocs, installSelfAsDevDep, refreshAiContextDoc } = require('./lib/init-docs');
const { checkPrReadiness, checkScope, checkSliceReadiness } = require('./lib/readiness');
const { cleanupSlice, refreshActiveSlicesBoard, startSlice } = require('./lib/lifecycle');
const { buildSpecStatus, closeSpecWorktree, formatSpecCloseResult, formatSpecStartResult, formatSpecStatus, startSpecWorktree } = require('./lib/spec-worktrees');
const { getContextPathExclusionReason } = require('./lib/ai/safety');
const { relativePosixPath, resolveTargetRoot } = require('./lib/paths');
const {
  CURRENT_SCAN_RELATIVE_PATH,
  PROJECT_MAP_RELATIVE_PATH,
  hasProjectScanArtifact,
  projectScanPaths,
  writeProjectScanJson,
} = require('./lib/project-scan');
const { resolveTemplateRoot } = require('./lib/template-resolver');
const {
  hasQuiverInitializationEvidence,
  inspectLegacyMigrationLayout,
  readState,
  updateStateForAnalyze,
  updateStateForMigrate,
} = require('./lib/state');
const cliPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', 'package.json'), 'utf8'));
const CLI_VERSION = cliPackageJson.version || '0.0.0';

function formatError(message) {
  return `create-quiver: ${message}`;
}

function printUsage() {
  console.log(`Usage:
  npx create-quiver [options]
  npx create-quiver init [options]
  npx create-quiver analyze [options]
  npx create-quiver flow [options]
  npx create-quiver plan [options]
  npx create-quiver ai <task> [options]
  npx create-quiver ai agent <set|list|show> [role] [options]
  npx create-quiver graph [options]
  npx create-quiver next [options]
  npx create-quiver migrate [options]
  npx create-quiver doctor [options]
  npx create-quiver prepare [options]
  npx create-quiver start-slice [options] <slice.json>
  npx create-quiver check-slice [options] <slice.json>
  npx create-quiver check-pr <slice.json>
  npx create-quiver check-handoff <handoff.md>
  npx create-quiver new-handoff <spec-slug>
  npx create-quiver cleanup-slice [options] <slice.json>
  npx create-quiver check-scope [options] <slice.json>
  npx create-quiver refresh-active-slices
  npx create-quiver spec start <spec-dir>
  npx create-quiver spec status <spec-dir>
  npx create-quiver spec close <spec-dir>

Options:
  -n, --name <project-name>   Project name to generate
  -d, --dir <target-dir>      Target directory to scaffold into or inspect
      --spec <slug>           Restrict plan output to one spec
      --format <name>         Graph output format (tree, mermaid, dot)
      --show-conflicts        Show shared file paths in graph output
      --level <n>             Restrict graph output to one level
      --json                  Emit machine-readable JSON
      --only-ready            Show only slices with no pending dependencies
      --all-ready             List every ready slice returned by next
      --auto-start            Prompt for confirmation and run start-slice on next
      --unicode               Prefer Unicode output when supported
      --minimal               Plan or run the minimal init profile
      --full                  Plan or run the full compatibility init profile
      --legacy-scripts        Include legacy Bash wrappers in init profile
      --include-templates     Export packaged templates in init profile
      --dry-run               Preview init, prepare, or AI work without executing writes/providers
      --execute               For ai execute-plan, run the planned slices instead of printing commands
      --create                For ai pr, create the PR after preflight instead of printing the plan only
      --commit                For ai execute-slice, commit validated slice changes after provider, scope, and tests pass
      --allow-dirty           For ai execute-slice, allow pre-existing dirty files and ignore them for scope diff
      --provider <name>       Provider CLI to preflight for prepare or AI commands
      --model <label>         Free-form model label for AI agent profiles
      --version <n>           Draft version to approve for AI planner phases
      --ssh-host-alias <name> SSH host alias to validate for prepare or AI commands
      --identity-file <path>  SSH identity file to validate for prepare or AI commands
      --remote <name>         Git remote name for AI PR checks
      --base <branch>         Base branch for ai pr create (default: main)
      --title <text>          Override PR title for ai pr create
  -y, --yes                   Skip prompts and use the provided inputs
  -h, --help                  Show this help message

Examples:
  npx create-quiver init --name "My Project"
  npx create-quiver init --name "My Project" --dry-run
  npx create-quiver --name "My Project"
  npx create-quiver --name "My Project" --dir ./my-project
  cd ./my-project && npx create-quiver flow
  cd ./my-project && npx create-quiver analyze
  cd ./my-project && npx create-quiver plan --json
  cd ./my-project && npx create-quiver ai onboard --dry-run
  cd ./my-project && npx create-quiver ai agent set planner --provider codex --model gpt-5.5
  cd ./my-project && npx create-quiver ai agent list
  cd ./my-project && npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
  cd ./my-project && npx create-quiver ai approve --phase acceptance --input acceptance.md
  cd ./my-project && npx create-quiver ai plan --phase technical-plan --dry-run
  cd ./my-project && npx create-quiver ai review-plan --dry-run
  cd ./my-project && npx create-quiver ai approve --phase technical-plan --version 1
  cd ./my-project && npx create-quiver ai approvals
  cd ./my-project && npx create-quiver ai execute-slice --slice specs/my-project/slices/slice-01/slice.json --dry-run
  cd ./my-project && npx create-quiver ai execute-slice --slice specs/my-project/slices/slice-01/slice.json --commit
  cd ./my-project && npx create-quiver ai execute-plan --dry-run --commit
  cd ./my-project && npx create-quiver ai doctor --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
  cd ./my-project && npx create-quiver ai pr --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
  cd ./my-project && npx create-quiver ai pr --create --input specs/my-project/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
  cd ./my-project && npx create-quiver prepare --dry-run --provider codex --ssh-host-alias github-work --identity-file ~/.ssh/github-work
  cd ./my-project && npx create-quiver graph --show-conflicts
  cd ./my-project && npx create-quiver graph --format mermaid
  cd ./my-project && npx create-quiver graph --format dot
  cd ./my-project && npx create-quiver next
  cd ./my-project && npx create-quiver next --all-ready
  cd ./my-project && npx create-quiver next --auto-start
  cd ./my-project && npx create-quiver migrate
  cd ./my-project && npx create-quiver doctor
  cd ./my-project && npx create-quiver start-slice specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver check-slice specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver check-pr specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver check-handoff specs/my-project/HANDOFF.md
  cd ./my-project && npx create-quiver new-handoff my-spec
  cd ./my-project && npx create-quiver cleanup-slice specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver check-scope specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver refresh-active-slices
  cd ./my-project && npx create-quiver spec start specs/my-project
  cd ./my-project && npx create-quiver spec status specs/my-project
  cd ./my-project && npx create-quiver spec close specs/my-project --dry-run
  node bin/create-quiver.js doctor --dir ./my-project
`);
}

function parseArgs(argv) {
  const result = {
    help: false,
    force: false,
    explicitInit: false,
    mode: 'init',
    allowDraft: false,
    closeBaseline: false,
    discard: false,
    dryRun: false,
    gate: 'execution',
    projectName: '',
    targetDir: '.',
    strict: false,
    strictOverlap: false,
    json: false,
    onlyReady: false,
    allReady: false,
    autoStart: false,
    specSlug: '',
    format: 'tree',
    showConflicts: false,
    level: null,
    unicode: false,
    aiCommand: '',
    aiAgentCommand: '',
    aiAgentRole: '',
    aiPhase: 'acceptance',
    aiProvider: 'codex',
    aiProviderExplicit: false,
    aiModel: '',
    aiLabel: '',
    aiVersion: '',
    prepareProvider: '',
    aiRole: '',
    aiContext: '',
    aiInput: '',
    aiSlice: '',
    aiTimeout: null,
    aiCommit: false,
    aiAllowDirty: false,
    aiExecute: false,
    aiCreate: false,
    aiBaseBranch: 'main',
    aiTitle: '',
    aiSshHostAlias: '',
    aiIdentityFile: '',
    aiRemote: 'origin',
    initFull: false,
    initIncludeTemplates: false,
    initLegacyScripts: false,
    initMinimal: false,
    specCommand: '',
  };

  const args = [...argv];
  const commandModes = new Set(['init', 'flow', 'plan', 'graph', 'next', 'doctor', 'prepare', 'analyze', 'migrate', 'start-slice', 'check-slice', 'check-pr', 'check-handoff', 'new-handoff', 'cleanup-slice', 'check-scope', 'refresh-active-slices', 'spec', 'ai']);
  if (commandModes.has(args[0])) {
    result.mode = args[0];
    result.explicitInit = args[0] === 'init';
    args.shift();
    if (result.mode === 'spec') {
      result.specCommand = args.shift() || '';
    }
  } else if (args[0] === '--analyze') {
    result.mode = 'analyze';
    args.shift();
  } else if (args[0] === '--migrate') {
    result.mode = 'migrate';
    args.shift();
  } else if (args[0] === '--doctor') {
    result.mode = 'doctor';
    args.shift();
  } else if (args[0] === '--check-handoff') {
    result.mode = 'check-handoff';
    args.shift();
  } else if (args[0] === '--new-handoff') {
    result.mode = 'new-handoff';
    args.shift();
  }

  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      continue;
    }

    if (arg === '-y' || arg === '--yes') {
      result.force = true;
      continue;
    }

    if (arg === '--skip-install') {
      result.skipInstall = true;
      continue;
    }

    if (arg === '--doctor') {
      result.mode = 'doctor';
      continue;
    }

    if (arg === '--migrate') {
      result.mode = 'migrate';
      continue;
    }

    if (arg === '--check-handoff') {
      result.mode = 'check-handoff';
      continue;
    }

    if (arg === '--new-handoff') {
      result.mode = 'new-handoff';
      continue;
    }

    if (arg === '--allow-draft') {
      result.allowDraft = true;
      continue;
    }

    if (arg === '--close-baseline') {
      result.closeBaseline = true;
      continue;
    }

    if (arg === '--discard') {
      result.discard = true;
      continue;
    }

    if (arg === '--dry-run') {
      result.dryRun = true;
      continue;
    }

    if (arg === '--commit') {
      result.aiCommit = true;
      continue;
    }

    if (arg === '--execute') {
      result.aiExecute = true;
      continue;
    }

    if (arg === '--create') {
      result.aiCreate = true;
      continue;
    }

    if (arg === '--allow-dirty') {
      result.aiAllowDirty = true;
      continue;
    }

    if (arg === '--minimal') {
      result.initMinimal = true;
      continue;
    }

    if (arg === '--full') {
      result.initFull = true;
      continue;
    }

    if (arg === '--legacy-scripts') {
      result.initLegacyScripts = true;
      continue;
    }

    if (arg === '--include-templates') {
      result.initIncludeTemplates = true;
      continue;
    }

    if (arg === '--strict') {
      result.strict = true;
      continue;
    }

    if (arg === '--strict-overlap') {
      result.strictOverlap = true;
      continue;
    }

    if (arg === '--json') {
      result.json = true;
      continue;
    }

    if (arg === '--show-conflicts') {
      result.showConflicts = true;
      continue;
    }

    if (arg === '--format') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --format'));
      }
      result.format = value;
      continue;
    }

    if (arg === '--level') {
      const value = args[++index];
      if (typeof value === 'undefined') {
        throw new Error(formatError('missing value for --level'));
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(formatError('invalid value for --level'));
      }
      result.level = parsed;
      continue;
    }

    if (arg === '--only-ready') {
      result.onlyReady = true;
      continue;
    }

    if (arg === '--all-ready') {
      result.allReady = true;
      continue;
    }

    if (arg === '--auto-start') {
      result.autoStart = true;
      continue;
    }

    if (arg === '--unicode') {
      result.unicode = true;
      continue;
    }

    if (arg === '--provider') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --provider'));
      }
      result.aiProvider = value;
      result.prepareProvider = value;
      result.aiProviderExplicit = true;
      continue;
    }

    if (arg === '--model') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --model'));
      }
      result.aiModel = value;
      continue;
    }

    if (arg === '--label') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --label'));
      }
      result.aiLabel = value;
      continue;
    }

    if (arg === '--version') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --version'));
      }
      result.aiVersion = value;
      continue;
    }

    if (arg === '--role') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --role'));
      }
      result.aiRole = value;
      continue;
    }

    if (arg === '--context') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --context'));
      }
      result.aiContext = value;
      continue;
    }

    if (arg === '--input') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --input'));
      }
      result.aiInput = value;
      continue;
    }

    if (arg === '--slice') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --slice'));
      }
      result.aiSlice = value;
      continue;
    }

    if (arg === '--timeout') {
      const value = args[++index];
      if (typeof value === 'undefined') {
        throw new Error(formatError('missing value for --timeout'));
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(formatError('invalid value for --timeout'));
      }
      result.aiTimeout = parsed;
      continue;
    }

    if (arg === '--ssh-host-alias') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --ssh-host-alias'));
      }
      result.aiSshHostAlias = value;
      continue;
    }

    if (arg === '--identity-file') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --identity-file'));
      }
      result.aiIdentityFile = value;
      continue;
    }

    if (arg === '--remote') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --remote'));
      }
      result.aiRemote = value;
      continue;
    }

    if (arg === '--base') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --base'));
      }
      result.aiBaseBranch = value;
      continue;
    }

    if (arg === '--title') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --title'));
      }
      result.aiTitle = value;
      continue;
    }

    if (arg === '--phase') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --phase'));
      }
      result.aiPhase = value;
      continue;
    }

    if (arg === '--spec') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --spec'));
      }
      result.specSlug = value;
      continue;
    }

    if (arg === '--gate') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --gate'));
      }
      result.gate = value;
      continue;
    }

    if (arg === '-n' || arg === '--name' || arg === '--project-name') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --name'));
      }
      result.projectName = value;
      continue;
    }

    if (arg === '-d' || arg === '--dir' || arg === '--target') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --dir'));
      }
      result.targetDir = value;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(formatError(`unknown flag: ${arg}`));
    }

    positional.push(arg);
  }

  if (result.mode === 'init') {
    if (!result.projectName && positional.length > 0) {
      result.projectName = positional.shift();
    }

    if (positional.length > 0) {
      result.targetDir = positional.shift();
    }
  } else if (result.mode === 'plan') {
    if (positional.length > 0) {
      throw new Error(formatError('plan does not accept positional arguments; use --spec <slug>'));
    }
  } else if (result.mode === 'flow') {
    if (positional.length > 0) {
      throw new Error(formatError('flow does not accept positional arguments'));
    }
  } else if (result.mode === 'ai') {
    if (!result.aiCommand && positional.length > 0) {
      result.aiCommand = positional.shift();
    }
    if (result.aiCommand === 'agent') {
      if (!result.aiAgentCommand && positional.length > 0) {
        result.aiAgentCommand = positional.shift();
      }
      if (!result.aiAgentRole && positional.length > 0) {
        result.aiAgentRole = positional.shift();
      }
    }
    if (positional.length > 0) {
      throw new Error(formatError('ai does not accept extra positional arguments'));
    }
  } else if (result.mode === 'prepare') {
    if (positional.length > 0) {
      throw new Error(formatError('prepare does not accept positional arguments'));
    }
  } else if (result.mode === 'refresh-active-slices') {
    if (positional.length > 0) {
      throw new Error(formatError('refresh-active-slices does not accept positional arguments'));
    }
  } else if (result.mode === 'spec') {
    if (!result.specCommand && positional.length > 0) {
      result.specCommand = positional.shift();
    }
    if (!result.specCommand) {
      throw new Error(formatError('missing spec subcommand. Use: npx create-quiver spec <start|status|close> <spec-dir>'));
    }
    if (positional.length > 0) {
      result.targetDir = positional.shift();
    }
  } else {
    if (positional.length > 0) {
      result.targetDir = positional.shift();
    }
  }

  if (positional.length > 0) {
    throw new Error(formatError('too many positional arguments'));
  }

  return result;
}

function toProjectSlug(projectName) {
  return projectName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiver-project';
}

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
}

function copyPackageFallback(packageRoot, tempRoot) {
  const fallbackDir = path.join(tempRoot, 'package-fallback');
  const ignoredRoots = new Set([
    '.git',
    '.worktrees',
    'examples',
    'package-lock.json',
    'tests',
  ]);
  const ignoredPrefixes = [
    'scripts/ci',
    'specs/quiver-v01',
    'specs/quiver-v02-bootstrap-hardening',
    'specs/quiver-v03-adoption-verification',
    'specs/quiver-v04-zero-friction-installation',
  ];

  fs.cpSync(packageRoot, fallbackDir, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = relativePosixPath(packageRoot, sourcePath);
      if (!relativePath || relativePath === '.') {
        return true;
      }

      const firstSegment = relativePath.split('/')[0];
      if (ignoredRoots.has(firstSegment) || ignoredRoots.has(relativePath)) {
        return false;
      }

      return !ignoredPrefixes.some((prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`));
    },
  });

  return fallbackDir;
}

function packTemplate(packageRoot, tempRoot) {
  const packDir = path.join(tempRoot, 'pack');
  const extractDir = path.join(tempRoot, 'extract');
  const npmCache = path.join(tempRoot, 'npm-cache');

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(npmCache, { recursive: true });

  try {
    const packOutput = runCommand('npm', ['pack', '--json', '--pack-destination', packDir], {
      cwd: packageRoot,
      env: {
        ...process.env,
        npm_config_cache: npmCache,
      },
    });

    const packInfo = JSON.parse(packOutput.trim());
    const tarballPath = path.join(packDir, packInfo[0].filename);

    if (!fs.existsSync(tarballPath)) {
      throw new Error(formatError(`pack output not found at ${tarballPath}`));
    }

    runCommand('tar', ['-xzf', tarballPath, '-C', extractDir]);

    return path.join(extractDir, 'package');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return copyPackageFallback(packageRoot, tempRoot);
    }

    throw error;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyTemplate(templateRoot, targetDir) {
  const docsTemplateDir = path.join(targetDir, 'docs-template');

  if (fs.existsSync(docsTemplateDir)) {
    throw new Error(formatError(`docs-template already exists at ${docsTemplateDir}`));
  }

  fs.cpSync(templateRoot, docsTemplateDir, { recursive: true });

  return docsTemplateDir;
}

function exportTemplatesToLegacyRoot(templateRoot, targetDir) {
  return copyTemplate(templateRoot, targetDir);
}

function mergeDirectoryTree(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    force: false,
    errorOnExist: false,
    preserveTimestamps: true,
  });
}

function runInitDocs(repoRoot, projectName, options = {}) {
  const templateRoot = options.templateRoot
    ? { path: options.templateRoot }
    : resolveTemplateRoot(repoRoot, {
      packageRoot: path.resolve(__dirname, '../..'),
    });

  initializeProjectDocs({
    projectRoot: repoRoot,
    projectName,
    cliVersion: CLI_VERSION,
    includeTemplates: options.includeTemplates === true,
    legacyScripts: options.legacyScripts === true,
    migrateMode: false,
    profile: options.profile || 'default',
    templateRoot: templateRoot.path,
  });
}

function listGeneratedSpecDirs(projectRoot) {
  const specsDir = path.join(projectRoot, 'specs');

  if (!fs.existsSync(specsDir)) {
    return [];
  }

  return fs.readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((entry) => entry !== '[project-name]' && !entry.startsWith('quiver-'));
}

function assertFilesExist(root, relativePaths) {
  return relativePaths.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
}

function assertExecutablesExist(root, relativePaths) {
  if (process.platform === 'win32') {
    return [];
  }

  return relativePaths.filter((relativePath) => {
    const absolutePath = path.join(root, relativePath);

    if (!fs.existsSync(absolutePath)) {
      return true;
    }

    const mode = fs.statSync(absolutePath).mode;
    return (mode & 0o111) === 0;
  });
}

function loadPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(formatError(`missing package.json in ${projectRoot}`));
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function toRelativePath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function summarizeSkippedPaths(scan) {
  const details = Array.isArray(scan.skipped_path_details) && scan.skipped_path_details.length > 0
    ? scan.skipped_path_details
    : (Array.isArray(scan.skipped_paths) ? scan.skipped_paths.map((item) => ({ reason: 'excluded path', path: item })) : []);
  const counts = new Map();
  const dependencySegments = new Set(['node_modules', '.pnpm-store', '.npm', '.yarn']);
  const outputSegments = new Set(['dist', 'build', 'coverage', 'out', 'tmp', 'temp', 'cache', '.cache', '.turbo', '.next', '.nuxt', '.parcel-cache', 'generated', 'gen', 'artifacts', 'reports', 'vendor', 'target']);

  for (const item of details) {
    const reason = item.reason || 'excluded path';
    let label = reason;
    if (reason === 'env-file') {
      label = 'env files';
    } else if (reason === 'git-metadata') {
      label = 'git metadata';
    } else if (reason === 'hidden-directory') {
      label = 'hidden directories';
    } else if (reason.startsWith('secret-file:')) {
      label = 'secret files';
    } else if (reason.startsWith('unsafe-segment:')) {
      const segment = reason.slice('unsafe-segment:'.length);
      if (segment === '.quiver') {
        label = 'local AI state';
      } else if (dependencySegments.has(segment)) {
        label = 'dependency folders';
      } else if (outputSegments.has(segment)) {
        label = 'generated/output/cache folders';
      } else {
        label = segment;
      }
    }
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([reason, count]) => ({ reason, count }));
}

function collectPackageManagers(projectRoot) {
  const packageManagerField = readJsonIfExists(path.join(projectRoot, 'package.json'))?.packageManager;

  if (typeof packageManagerField === 'string' && packageManagerField.length > 0) {
    return packageManagerField.split('@')[0];
  }

  const priority = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['npm', 'package-lock.json'],
  ];

  for (const [manager, filename] of priority) {
    if (fs.existsSync(path.join(projectRoot, filename))) {
      return manager;
    }
  }

  return 'unknown';
}

function collectProjectFiles(projectRoot, maxDepth = 2) {
  const files = [];
  const skippedPaths = [];
  const skippedPathDetails = [];
  const ignoredDirs = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    'vendor',
    '.turbo',
    '.cache',
    'out',
    'tmp',
    'docs-template',
  ]);
  const allowedHiddenDirs = new Set(['.github', '.vscode', '.devcontainer']);

  function skipPath(relativePath, reason) {
    const normalized = relativePath.split(path.sep).join('/');
    skippedPaths.push(normalized);
    skippedPathDetails.push({ path: normalized, reason });
  }

  function walk(currentDir, depth, relativeDir = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) {
          skipPath(entryRelativePath, `unsafe-segment:${entry.name}`);
          continue;
        }

        const directoryReason = getContextPathExclusionReason(entryRelativePath);
        if (directoryReason) {
          skipPath(entryRelativePath, directoryReason);
          continue;
        }

        if (entry.name.startsWith('.') && !allowedHiddenDirs.has(entry.name)) {
          skipPath(entryRelativePath, 'hidden-directory');
          continue;
        }

        if (depth < maxDepth) {
          walk(absolutePath, depth + 1, entryRelativePath);
        }

        continue;
      }

      const fileReason = getContextPathExclusionReason(entryRelativePath);
      if (fileReason) {
        skipPath(entryRelativePath, fileReason);
        continue;
      }

      files.push(entryRelativePath);
    }
  }

  walk(projectRoot, 0);

  return { files, skipped_path_details: skippedPathDetails, skippedPaths };
}

function collectRootEntries(projectRoot) {
  return fs.readdirSync(projectRoot, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file',
  }));
}

function detectSourceDirectories(rootEntries) {
  const commonNames = new Set([
    'src',
    'app',
    'pages',
    'components',
    'lib',
    'server',
    'client',
    'api',
    'packages',
    'services',
    'modules',
    'tests',
    'test',
    'spec',
    'stories',
  ]);

  return rootEntries
    .filter((entry) => entry.type === 'directory' && commonNames.has(entry.name))
    .map((entry) => entry.name);
}

function collectLanguageSignals(files) {
  const extensions = new Map();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();

    if (!ext) {
      continue;
    }

    extensions.set(ext, (extensions.get(ext) || 0) + 1);
  }

  const languages = [];
  const extToLanguage = new Map([
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.mts', 'typescript'],
    ['.cts', 'typescript'],
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.mjs', 'javascript'],
    ['.cjs', 'javascript'],
    ['.py', 'python'],
    ['.go', 'go'],
    ['.php', 'php'],
    ['.rb', 'ruby'],
    ['.rs', 'rust'],
    ['.java', 'java'],
    ['.kt', 'kotlin'],
    ['.swift', 'swift'],
    ['.cs', 'csharp'],
    ['.sh', 'shell'],
    ['.toml', 'toml'],
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
  ]);

  for (const [ext, language] of extToLanguage.entries()) {
    if (extensions.has(ext)) {
      languages.push(language);
    }
  }

  return languages;
}

function collectWorkspaces(packageJson) {
  if (!packageJson) {
    return [];
  }

  const workspaces = packageJson.workspaces;

  if (Array.isArray(workspaces)) {
    return workspaces.filter((workspace) => typeof workspace === 'string');
  }

  if (workspaces && Array.isArray(workspaces.packages)) {
    return workspaces.packages.filter((workspace) => typeof workspace === 'string');
  }

  return [];
}

function collectDependencies(packageJson) {
  const dependencySets = [
    packageJson?.dependencies,
    packageJson?.devDependencies,
    packageJson?.peerDependencies,
    packageJson?.optionalDependencies,
  ];
  const dependencies = new Set();

  for (const set of dependencySets) {
    if (!set) {
      continue;
    }

    for (const name of Object.keys(set)) {
      dependencies.add(name);
    }
  }

  return dependencies;
}

function detectFrameworks(projectRoot, files, rootEntries, packageJson) {
  const dependencies = collectDependencies(packageJson);
  const rootFileSet = new Set(rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name));
  const rootDirSet = new Set(rootEntries.filter((entry) => entry.type === 'directory').map((entry) => entry.name));
  const frameworks = [];
  const evidence = [];

  const candidates = [
    {
      name: 'nextjs',
      matches: () => dependencies.has('next') || rootFileSet.has('next.config.js') || rootFileSet.has('next.config.mjs') || rootFileSet.has('next.config.ts') || rootDirSet.has('pages') || rootDirSet.has('app'),
      signals: ['next', 'next.config.*', 'app/pages'],
    },
    {
      name: 'nuxt',
      matches: () => dependencies.has('nuxt') || rootFileSet.has('nuxt.config.js') || rootFileSet.has('nuxt.config.ts') || rootFileSet.has('app.vue'),
      signals: ['nuxt', 'nuxt.config.*'],
    },
    {
      name: 'angular',
      matches: () => dependencies.has('@angular/core') || rootFileSet.has('angular.json'),
      signals: ['@angular/core', 'angular.json'],
    },
    {
      name: 'sveltekit',
      matches: () => dependencies.has('@sveltejs/kit') || rootFileSet.has('svelte.config.js') || rootFileSet.has('svelte.config.ts'),
      signals: ['@sveltejs/kit', 'svelte.config.*'],
    },
    {
      name: 'vue',
      matches: () => dependencies.has('vue') || rootFileSet.has('vue.config.js') || rootFileSet.has('vite.config.js') || rootFileSet.has('vite.config.ts'),
      signals: ['vue', 'vue.config.*', 'vite.config.*'],
    },
    {
      name: 'react',
      matches: () => dependencies.has('react'),
      signals: ['react'],
    },
    {
      name: 'vite',
      matches: () => dependencies.has('vite') || rootFileSet.has('vite.config.js') || rootFileSet.has('vite.config.ts') || rootFileSet.has('vite.config.mjs'),
      signals: ['vite', 'vite.config.*'],
    },
    {
      name: 'express',
      matches: () => dependencies.has('express'),
      signals: ['express'],
    },
    {
      name: 'python',
      matches: () => rootFileSet.has('pyproject.toml') || rootFileSet.has('requirements.txt') || rootFileSet.has('Pipfile'),
      signals: ['pyproject.toml', 'requirements.txt', 'Pipfile'],
    },
    {
      name: 'go',
      matches: () => rootFileSet.has('go.mod'),
      signals: ['go.mod'],
    },
    {
      name: 'php',
      matches: () => rootFileSet.has('composer.json'),
      signals: ['composer.json'],
    },
    {
      name: 'ruby',
      matches: () => rootFileSet.has('Gemfile'),
      signals: ['Gemfile'],
    },
    {
      name: 'rust',
      matches: () => rootFileSet.has('Cargo.toml'),
      signals: ['Cargo.toml'],
    },
  ];

  for (const candidate of candidates) {
    if (candidate.matches()) {
      frameworks.push(candidate.name);
      evidence.push({ framework: candidate.name, signals: candidate.signals });
    }
  }

  const languages = collectLanguageSignals(files);

  if (frameworks.length === 0 && languages.includes('typescript') && dependencies.has('react')) {
    frameworks.push('react');
    evidence.push({ framework: 'react', signals: ['react', 'typescript files'] });
  }

  const primary = frameworks[0] || 'unknown';

  return {
    primary,
    frameworks,
    languages,
    evidence,
  };
}

function detectConfigFiles(rootEntries) {
  const rootFiles = rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name);
  const configNames = new Set([
    'package.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'bun.lockb',
    'bun.lock',
    'pyproject.toml',
    'requirements.txt',
    'Pipfile',
    'go.mod',
    'composer.json',
    'Cargo.toml',
    'Gemfile',
    'angular.json',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'nuxt.config.js',
    'nuxt.config.ts',
    'svelte.config.js',
    'svelte.config.ts',
    'vue.config.js',
    'eslint.config.js',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.json',
  ]);

  return rootFiles.filter((name) => configNames.has(name));
}

function detectWorkflowFiles(files) {
  return files.filter((file) => file.startsWith('.github/workflows/') && /\.(ya?ml)$/i.test(file));
}

function detectDocsFiles(files) {
  return files.filter((file) => file === 'README.md' || file.startsWith('docs/'));
}

function detectRisks(projectRoot, scan) {
  const risks = [];

  if (!scan.project.has_package_json) {
    risks.push('package.json is missing, so command detection is limited');
  }

  if (!scan.docs.has_readme) {
    risks.push('README.md is missing, so onboarding guidance is limited');
  }

  if (scan.ci.github_actions_workflows.length === 0) {
    risks.push('no GitHub Actions workflows were found');
  }

  if (scan.stack.primary === 'unknown') {
    risks.push('no primary framework could be inferred from the repository signals');
  }

  if (scan.structure.source_directories.length === 0) {
    risks.push('no common source directory names were found at the repository root');
  }

  if (scan.skipped_paths.length === 0) {
    risks.push('no large or secret-like paths were skipped, or the repository is very small');
  }

  return risks;
}

function buildProjectScan(projectRoot) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));
  const rootEntries = collectRootEntries(projectRoot);
  const { files, skippedPaths, skipped_path_details } = collectProjectFiles(projectRoot);
  const topLevelDirectories = rootEntries.filter((entry) => entry.type === 'directory' && !entry.name.startsWith('.')).map((entry) => entry.name);
  const sourceDirectories = detectSourceDirectories(rootEntries);
  const configFiles = detectConfigFiles(rootEntries);
  const workflowFiles = detectWorkflowFiles(files);
  const docsFiles = detectDocsFiles(files);
  const stack = detectFrameworks(projectRoot, files, rootEntries, packageJson);
  const packageManager = collectPackageManagers(projectRoot);
  const workspaces = collectWorkspaces(packageJson);
  const scripts = packageJson?.scripts && typeof packageJson.scripts === 'object' ? packageJson.scripts : {};
  const projectName = packageJson?.name || path.basename(projectRoot) || 'unknown';
  const hasReadme = fs.existsSync(path.join(projectRoot, 'README.md'));
  const generatedDocs = docsFiles.filter((file) => file.startsWith('docs/'));

  const scan = {
    project: {
      name: projectName,
      root_name: path.basename(projectRoot),
      has_package_json: Boolean(packageJson),
      package_manager: packageManager,
      workspaces,
      scripts,
      top_level_files: rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name),
      top_level_directories: topLevelDirectories,
    },
    stack: {
      primary: stack.primary,
      frameworks: stack.frameworks,
      languages: stack.languages,
      evidence: stack.evidence,
    },
    commands: {
      install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : packageManager === 'bun' ? 'bun install' : 'npm install',
      scripts,
      common: {
        dev: scripts.dev || scripts.start || '',
        build: scripts.build || '',
        test: scripts.test || '',
        lint: scripts.lint || '',
      },
    },
    structure: {
      top_level_directories: topLevelDirectories,
      source_directories: sourceDirectories,
      config_files: configFiles,
      workspace_patterns: workspaces,
    },
    ci: {
      github_actions_workflows: workflowFiles,
      has_ci: workflowFiles.length > 0,
    },
    docs: {
      has_readme: hasReadme,
      files: docsFiles,
      generated_files: generatedDocs,
    },
    risks: [],
    skipped_paths: skippedPaths,
    skipped_path_details,
  };

  scan.risks = detectRisks(projectRoot, scan);

  return scan;
}

function renderProjectMap(scan) {
  const lines = [];
  const projectSlug = scan.project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
  const docsFiles = new Set(scan.docs.files);
  const hasDecisionLog = docsFiles.has('docs/DECISIONS.md');
  const hasAiPrompt = docsFiles.has('docs/AI_ONBOARDING_PROMPT.md');
  const sourceDirs = scan.structure.source_directories.length > 0 ? scan.structure.source_directories : [];
  const configFiles = scan.structure.config_files.length > 0 ? scan.structure.config_files : [];
  const highSignalFiles = [
    'README.md',
    'docs/INDEX.md',
    'docs/AI_CONTEXT.md',
    'docs/DECISIONS.md',
    CURRENT_SCAN_RELATIVE_PATH,
    PROJECT_MAP_RELATIVE_PATH,
    'docs/AI_ONBOARDING_PROMPT.md',
    'docs/CONTEXTO.md',
    'docs/WORKFLOW.md',
    'docs/SUPPORT_MATRIX.md',
    'docs/TROUBLESHOOTING.md',
    'package.json',
    ...configFiles,
  ].filter((value, index, array) => array.indexOf(value) === index);
  const likelyTestCommands = [
    ['Install', scan.commands.install || 'npm install'],
    ['dev', scan.commands.common.dev || 'not defined'],
    ['build', scan.commands.common.build || 'not defined'],
    ['test', scan.commands.common.test || 'not defined'],
    ['lint', scan.commands.common.lint || 'not defined'],
  ];
  const readingOrder = [
    'README.md',
    'docs/INDEX.md',
    'docs/AI_CONTEXT.md',
    PROJECT_MAP_RELATIVE_PATH,
    hasDecisionLog ? 'docs/DECISIONS.md' : 'docs/DECISIONS.md (create with migrate if missing)',
    'docs/CONTEXTO.md',
    'docs/WORKFLOW.md',
    'docs/SUPPORT_MATRIX.md',
    'docs/TROUBLESHOOTING.md',
  ];

  lines.push('# Project Map');
  lines.push('');
  lines.push('## Project');
  lines.push(`- Name: ${scan.project.name}`);
  lines.push(`- Root folder: ${scan.project.root_name}`);
  lines.push(`- Package manager: ${scan.project.package_manager}`);
  lines.push(`- package.json present: ${scan.project.has_package_json ? 'yes' : 'no'}`);
  if (scan.project.workspaces.length > 0) {
    lines.push(`- Workspaces: ${scan.project.workspaces.join(', ')}`);
  }

  lines.push('');
  lines.push('## Suggested Reading Order');
  for (const item of readingOrder) {
    lines.push(`- ${item}`);
  }

  if (hasAiPrompt) {
    lines.push('- docs/AI_ONBOARDING_PROMPT.md');
  }

  lines.push(`- specs/${projectSlug}/SPEC.md`);
  if (sourceDirs.length > 0) {
    for (const sourceDir of sourceDirs) {
      lines.push(`- ${sourceDir}/...`);
    }
  }

  lines.push('');
  lines.push('## Entry Points');
  lines.push(`- Project overview: ${scan.docs.has_readme ? 'README.md' : 'docs/CONTEXTO.md'}`);
  lines.push(`- AI context: ${hasDecisionLog ? 'docs/AI_CONTEXT.md + docs/DECISIONS.md' : 'docs/AI_CONTEXT.md'}`);
  lines.push(`- Analysis outputs: ${CURRENT_SCAN_RELATIVE_PATH}, ${PROJECT_MAP_RELATIVE_PATH}`);
  lines.push(`- Workflow contract: docs/WORKFLOW.md`);
  lines.push(`- Spec contract: specs/${projectSlug}/SPEC.md`);
  if (sourceDirs.length > 0) {
    lines.push(`- Source roots: ${sourceDirs.join(', ')}`);
  } else {
    lines.push('- Source roots: none detected');
  }

  lines.push('');
  lines.push('## Primary Config Files');
  if (configFiles.length > 0) {
    for (const configFile of configFiles) {
      lines.push(`- ${configFile}`);
    }
  } else {
    lines.push('- none detected');
  }

  lines.push('');
  lines.push('## Commands');
  lines.push('See **Likely Test Commands** for the current read-friendly command summary.');

  lines.push('');
  lines.push('## Likely Test Commands');
  lines.push('| Command | Value |');
  lines.push('|---------|-------|');
  for (const [name, value] of likelyTestCommands) {
    lines.push(`| ${name} | ${escapeMarkdownCell(value)} |`);
  }

  const relevantScripts = Object.entries(scan.commands.scripts)
    .filter(([name]) => /(^|:)(analyze|doctor|migrate|test|build|lint|dev|start|check)(:|$)|analyze|doctor|migrate|test|build|lint|dev|start|check/i.test(name))
    .slice(0, 12);

  if (relevantScripts.length > 0) {
    lines.push('');
    lines.push('### package.json scripts');
    for (const [name, command] of relevantScripts) {
      lines.push(`- ${name}: \`${command}\``);
    }
  }

  lines.push('');
  lines.push('## Stack');
  lines.push(`- Primary: ${scan.stack.primary}`);
  lines.push(`- Frameworks: ${scan.stack.frameworks.length > 0 ? scan.stack.frameworks.join(', ') : 'none detected'}`);
  lines.push(`- Languages: ${scan.stack.languages.length > 0 ? scan.stack.languages.join(', ') : 'none detected'}`);

  if (scan.stack.evidence.length > 0) {
    lines.push('');
    lines.push('### Evidence');
    for (const item of scan.stack.evidence) {
      lines.push(`- ${item.framework}: ${item.signals.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('## Structure');
  lines.push(`- Top-level directories: ${scan.structure.top_level_directories.length > 0 ? scan.structure.top_level_directories.join(', ') : 'none detected'}`);
  lines.push(`- Source directories: ${scan.structure.source_directories.length > 0 ? scan.structure.source_directories.join(', ') : 'none detected'}`);
  lines.push(`- Config files: ${scan.structure.config_files.length > 0 ? scan.structure.config_files.join(', ') : 'none detected'}`);

  lines.push('');
  lines.push('## CI');
  lines.push(`- GitHub Actions workflows: ${scan.ci.github_actions_workflows.length > 0 ? scan.ci.github_actions_workflows.join(', ') : 'none detected'}`);

  lines.push('');
  lines.push('## Docs');
  lines.push(`- README present: ${scan.docs.has_readme ? 'yes' : 'no'}`);
  lines.push(`- Docs files: ${scan.docs.files.length > 0 ? scan.docs.files.join(', ') : 'none detected'}`);
  lines.push(`- Decision log: ${hasDecisionLog ? 'present' : 'missing'}`);
  lines.push(`- AI onboarding prompt: ${hasAiPrompt ? 'present' : 'missing'}`);

  lines.push('');
  lines.push('## High-Signal Files');
  for (const file of highSignalFiles) {
    lines.push(`- ${file}`);
  }

  lines.push('');
  lines.push('## Risks');
  if (scan.risks.length > 0) {
    for (const risk of scan.risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push('- No major onboarding risks detected.');
  }

  lines.push('');
  lines.push('## Skipped Paths');
  const skippedSummaries = summarizeSkippedPaths(scan);
  if (skippedSummaries.length > 0) {
    for (const skippedPath of skippedSummaries) {
      lines.push(`- ${skippedPath.reason}: ${skippedPath.count}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  lines.push('## Do Not Read First');
  if (skippedSummaries.length > 0) {
    lines.push('- Hidden, generated, secret, and cache paths are excluded from the analysis scan.');
  } else {
    lines.push('- None detected, but still prioritize docs and config files before source trees.');
  }

  lines.push('');
  return lines.join('\n');
}

function writeProjectScanArtifacts(projectRoot, scan) {
  const scanPaths = projectScanPaths(projectRoot);
  ensureDir(path.dirname(scanPaths.projectMapPath));

  const jsonPath = writeProjectScanJson(projectRoot, scan);
  fs.writeFileSync(scanPaths.projectMapPath, `${renderProjectMap(scan)}\n`);

  return { jsonPath, mdPath: scanPaths.projectMapPath };
}

function runAnalyze(targetDir) {
  const projectRoot = resolveTargetRoot(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  const scan = buildProjectScan(projectRoot);
  const artifacts = writeProjectScanArtifacts(projectRoot, scan);
  const aiContextPath = refreshAiContextDoc(projectRoot, scan);
  updateStateForAnalyze(projectRoot, CLI_VERSION);

  console.log(`Project analysis completed for ${projectRoot}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, artifacts.jsonPath)}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, artifacts.mdPath)}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, aiContextPath)}`);
  console.log(`Detected primary stack: ${scan.stack.primary}`);
  console.log(`Detected package manager: ${scan.project.package_manager}`);
}

function runMigrate(targetDir, options = {}) {
  const projectRoot = resolveTargetRoot(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  if (!hasQuiverInitializationEvidence(projectRoot)) {
    throw new Error(formatError('migrate requires a project previously initialized by Quiver.\nRun: npx create-quiver --name "Project Name"'));
  }

  const packageJson = loadPackageJson(projectRoot);
  const projectName = packageJson.name || path.basename(projectRoot) || 'Quiver Project';
  const packageRoot = path.resolve(__dirname, '../..');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-migrate-'));
  const legacyLayout = inspectLegacyMigrationLayout(projectRoot);

  try {
    const templateRoot = packTemplate(packageRoot, tempRoot);
    mergeDirectoryTree(templateRoot, path.join(projectRoot, 'docs-template'));
    initializeProjectDocs({
      projectRoot,
      projectName,
      cliVersion: CLI_VERSION,
      legacyScripts: true,
      migrateMode: true,
      profile: 'full',
      templateRoot,
    });
    updateStateForMigrate(projectRoot, projectName, CLI_VERSION);

    if (!options.skipInstall) {
      const installResult = installSelfAsDevDep(projectRoot, CLI_VERSION);
      if (installResult === 'installed') {
        console.log(`Added create-quiver@${CLI_VERSION} as dev dependency`);
      } else if (installResult === 'failed') {
        console.warn(`Warning: could not install create-quiver automatically. Run: npm install -D create-quiver@${CLI_VERSION}`);
      }
    }

    console.log(`Quiver migration completed for ${projectRoot}`);
    console.log('Missing workflow files were restored without overwriting existing project files.');
    if (legacyLayout.hasLegacyLayout) {
      console.log(`Legacy layout detected and preserved: ${legacyLayout.legacyPaths.join(', ')}`);
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runDoctor(targetDir) {
  const projectRoot = resolveTargetRoot(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  if (!hasQuiverInitializationEvidence(projectRoot)) {
    throw new Error(formatError('doctor requires a project previously initialized by Quiver.\nRun init first: npx create-quiver --name "Project Name"'));
  }

  const doctorReport = collectDoctorReport(projectRoot);
  const specSlugs = doctorReport.specSlugs;
  const specRequiredFiles = specSlugs.flatMap((projectSlug) => [
    `specs/${projectSlug}/SPEC.md`,
    `specs/${projectSlug}/STATUS.md`,
    `specs/${projectSlug}/EVIDENCE_REPORT.md`,
  ]);
  const newLayoutRequiredFiles = [
    'AGENTS.md',
    'README.md',
    'docs/AI_CONTEXT.md',
    'docs/AI_ONBOARDING_PROMPT.md',
    'docs/COMMANDS.md',
    'docs/WORKFLOW.md',
    'package.json',
    '.quiver/state.json',
    '.quiver/config.json',
    '.quiver/.gitignore',
    ...specRequiredFiles,
  ];
  const requiredFiles = doctorReport.layout === 'legacy'
    ? ['package.json', ...specRequiredFiles]
    : newLayoutRequiredFiles;
  const legacyScriptsDir = path.join(projectRoot, 'tools', 'scripts');
  const requiredExecutables = fs.existsSync(legacyScriptsDir)
    ? [
        'tools/scripts/start-slice.sh',
        'tools/scripts/check-slice-readiness.sh',
        'tools/scripts/check-pr-readiness.sh',
        'tools/scripts/cleanup-slice.sh',
        'tools/scripts/check-scope.sh',
      ]
    : [];
  const missingFiles = assertFilesExist(projectRoot, requiredFiles);
  const nonExecutableScripts = assertExecutablesExist(projectRoot, requiredExecutables);
  const pkg = fs.existsSync(path.join(projectRoot, 'package.json')) ? loadPackageJson(projectRoot) : {};
  const workflowScriptGroups = [
    { label: 'migrate', node: 'quiver:migrate', legacy: 'migrate' },
    { label: 'start-slice', node: 'quiver:start-slice', legacy: 'start:slice' },
    { label: 'check-slice', node: 'quiver:check-slice', legacy: 'check:slice' },
    { label: 'check-pr', node: 'quiver:check-pr', legacy: 'check:pr' },
    { label: 'cleanup-slice', node: 'quiver:cleanup-slice', legacy: 'cleanup:slice' },
    { label: 'check-scope', node: 'quiver:check-scope', legacy: 'check:scope' },
    { label: 'refresh-active-slices', node: 'quiver:refresh-active-slices', legacy: 'refresh:active-slices' },
  ];
  const missingScripts = workflowScriptGroups
    .filter((group) => typeof pkg.scripts?.[group.node] !== 'string' && typeof pkg.scripts?.[group.legacy] !== 'string')
    .map((group) => `${group.node} (or legacy ${group.legacy})`);
  const legacyOnlyScripts = workflowScriptGroups
    .filter((group) => typeof pkg.scripts?.[group.node] !== 'string' && typeof pkg.scripts?.[group.legacy] === 'string')
    .map((group) => group.label);
  const missingNodeNativeScripts = ['quiver:migrate', 'quiver:analyze', 'quiver:doctor']
    .filter((name) => typeof pkg.scripts?.[name] !== 'string');
  const missingAiScripts = [
    'quiver:ai:agent',
    'quiver:ai:onboard',
    'quiver:ai:plan',
    'quiver:ai:review-plan',
    'quiver:ai:approve',
    'quiver:ai:execute-slice',
    'quiver:ai:execute-plan',
    'quiver:ai:pr',
    'quiver:ai:doctor',
  ].filter((name) => typeof pkg.scripts?.[name] !== 'string');
  const hasScanArtifacts = hasProjectScanArtifact(projectRoot)
    && fs.existsSync(path.join(projectRoot, PROJECT_MAP_RELATIVE_PATH));
  const quiverState = readState(projectRoot);
  const hasQuiverState = Boolean(quiverState);
  const stateWarnings = hasQuiverState ? [] : ['missing Quiver state metadata: .quiver/state.json'];
  const migrationProblems = [
    ...missingFiles.map((file) => `missing file: ${file}`),
    ...nonExecutableScripts.map((file) => `missing executable bit: ${file}`),
    ...missingScripts.map((name) => `missing package.json script: ${name}`),
  ];
  const softWarnings = doctorReport.warnings;

  if (migrationProblems.length > 0) {
    throw new Error(formatError(`doctor failed:\n- ${migrationProblems.join('\n- ')}\n- Run migration first: npx create-quiver migrate`));
  }

  console.log(`Quiver doctor passed for ${projectRoot}`);
  console.log(`Layout: ${doctorReport.layout}`);
  if (specSlugs.length > 0) {
    console.log(`Specs: ${specSlugs.join(', ')}`);
  } else {
    console.log('Specs: none yet');
  }
  if (doctorReport.legacySignals.length > 0) {
    console.log(`Legacy signals: ${doctorReport.legacySignals.join(', ')}`);
  }
  console.log('Next steps:');
  for (const recommendation of doctorReport.recommendations) {
    console.log(`- ${recommendation}`);
  }
  for (const warning of stateWarnings) {
    console.log(`- Warning: ${warning}`);
  }
  for (const scriptName of missingNodeNativeScripts) {
    console.log(`- Warning: missing Node-native script: ${scriptName}`);
  }
  for (const scriptName of missingAiScripts) {
    console.log(`- Warning: missing AI orchestration script: ${scriptName}`);
  }
  if (legacyOnlyScripts.length > 0) {
    console.log(`- Warning: legacy Bash workflow scripts detected for ${legacyOnlyScripts.join(', ')}. Run npx create-quiver migrate to add quiver:* npm scripts.`);
  }
  for (const warning of softWarnings) {
    console.log(`- Warning: ${warning}`);
  }
  if (!hasQuiverState) {
    console.log('- Run migration first: npx create-quiver migrate');
  } else if (!hasScanArtifacts) {
  console.log('- Analyze the project first: npx create-quiver analyze');
  } else {
    console.log('- Ask your AI agent: Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it.');
  }
  console.log('- Check the next ready slice: npx create-quiver next');
  if (specSlugs.length > 0) {
    const projectSlug = specSlugs[0];
    console.log(`- Start a slice: npx create-quiver start-slice specs/${projectSlug}/slices/<slice-id>/slice.json`);
    console.log(`- Validate a slice: npx create-quiver check-slice specs/${projectSlug}/slices/<slice-id>/slice.json`);
    console.log(`- Validate the PR gate: npx create-quiver check-pr specs/${projectSlug}/slices/<slice-id>/slice.json`);
  } else {
    console.log('- Create real specs and slices only after acceptance criteria are approved and the technical plan is reviewed and approved.');
  }
}

function printInitNextSteps(targetDir, projectName) {
  console.log('');
  console.log('Next steps:');
  console.log(`- Review AGENTS.md, then ${path.join(targetDir, 'docs', 'AI_ONBOARDING_PROMPT.md')}`);
  console.log(`- Review ${path.join(targetDir, 'docs', 'WORKFLOW.md')}`);
  console.log('- Analyze the project with npx create-quiver analyze');
  console.log('- Create real specs and slices after acceptance criteria are approved and the technical plan is reviewed and approved.');
}

async function run(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  if (args.mode === 'analyze') {
    runAnalyze(args.targetDir);
    return;
  }

  if (args.mode === 'flow') {
    await runFlow(process.cwd(), {
      json: args.json,
    });
    return;
  }

  if (args.mode === 'plan') {
    runPlan(process.cwd(), {
      json: args.json,
      onlyReady: args.onlyReady,
      specSlug: args.specSlug,
      unicode: args.unicode,
    });
    return;
  }

  if (args.mode === 'prepare') {
    await runPrepare(process.cwd(), {
      dryRun: args.dryRun,
      identityFile: args.aiIdentityFile || undefined,
      provider: args.prepareProvider || undefined,
      sshHostAlias: args.aiSshHostAlias || undefined,
    });
    return;
  }

  if (args.mode === 'ai') {
    if (!args.aiCommand) {
      throw new Error(formatError('missing ai subcommand. Use: npx create-quiver ai onboard | plan | review-plan | approve | approvals | agent | execute-slice | execute-plan | doctor | pr'));
    }

    if (args.aiCommand === 'agent') {
      runAiAgent(process.cwd(), {
        command: args.aiAgentCommand,
        context: args.aiContext || undefined,
        label: args.aiLabel || undefined,
        model: args.aiModel || undefined,
        provider: args.aiProviderExplicit ? args.aiProvider : undefined,
        role: args.aiAgentRole || undefined,
      });
      return;
    }

    if (args.aiCommand === 'onboard') {
      await runOnboard(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        role: args.aiRole,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'plan') {
      await runAiPlan(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        phase: args.aiPhase,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        role: args.aiRole,
        specSlug: args.specSlug || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'review-plan') {
      await runAiReviewPlan(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'approve') {
      await runAiApprove(process.cwd(), {
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        phase: args.aiPhase,
        version: args.aiVersion || undefined,
      });
      return;
    }

    if (args.aiCommand === 'approvals' || args.aiCommand === 'approval-status') {
      await runAiApprovalStatus(process.cwd());
      return;
    }

    if (args.aiCommand === 'execute-slice') {
      await runAiExecuteSlice(process.cwd(), {
        allowDirty: args.aiAllowDirty,
        commit: args.aiCommit,
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        role: args.aiRole,
        slice: args.aiSlice || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'execute-plan') {
      await runAiExecutePlan(process.cwd(), {
        allowDirty: args.aiAllowDirty,
        commit: args.aiCommit,
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        execute: args.aiExecute,
        json: args.json,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        role: args.aiRole,
        specSlug: args.specSlug || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'doctor') {
      await runAiDoctor(process.cwd(), {
        dryRun: args.dryRun,
        remote: args.aiRemote || undefined,
        sshHostAlias: args.aiSshHostAlias || undefined,
        identityFile: args.aiIdentityFile || undefined,
      });
      return;
    }

    if (args.aiCommand === 'pr') {
      await runAiPr(process.cwd(), {
        baseBranch: args.aiBaseBranch,
        create: args.aiCreate,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        remote: args.aiRemote || undefined,
        sshHostAlias: args.aiSshHostAlias || undefined,
        identityFile: args.aiIdentityFile || undefined,
        title: args.aiTitle || undefined,
      });
      return;
    }

    throw new Error(formatError(`unsupported ai subcommand: ${args.aiCommand}. Supported tasks: onboard, plan, review-plan, approve, approvals, agent, execute-slice, execute-plan, doctor, pr`));
  }

  if (args.mode === 'graph') {
    runGraph(process.cwd(), {
      format: args.format,
      json: args.json,
      level: args.level,
      showConflicts: args.showConflicts,
      unicode: args.unicode,
    });
    return;
  }

  if (args.mode === 'next') {
    await runNext(process.cwd(), {
      allReady: args.allReady,
      autoStart: args.autoStart,
      json: args.json,
      specSlug: args.specSlug,
    });
    return;
  }

  if (args.mode === 'migrate') {
    runMigrate(args.targetDir, { skipInstall: args.skipInstall });
    return;
  }

  if (args.mode === 'doctor') {
    runDoctor(args.targetDir);
    return;
  }

  if (args.mode === 'start-slice') {
    startSlice(args.targetDir, { allowDraft: args.allowDraft });
    return;
  }

  if (args.mode === 'check-slice') {
    checkSliceReadiness(args.targetDir, {
      gate: args.gate,
      strictOverlap: args.strictOverlap,
    });
    return;
  }

  if (args.mode === 'check-pr') {
    checkPrReadiness(args.targetDir);
    return;
  }

  if (args.mode === 'check-handoff') {
    const repoRoot = process.cwd();
    const handoffInput = args.targetDir;
    if (!handoffInput || handoffInput === '.') {
      throw new Error(formatError('missing handoff path. Use: npx create-quiver check-handoff specs/<spec-slug>/HANDOFF.md'));
    }
    const resolved = checkHandoff(handoffInput, repoRoot);
    console.log(`PASS: Handoff validated at ${resolved.relativePath}`);
    return;
  }

  if (args.mode === 'new-handoff') {
    const repoRoot = process.cwd();
    const handoffSlug = args.targetDir;
    const resolved = scaffoldHandoff(handoffSlug, repoRoot);
    console.log(`PASS: Handoff scaffolded at ${resolved.relativePath}`);
    return;
  }

  if (args.mode === 'cleanup-slice') {
    cleanupSlice(args.targetDir, {
      closeBaseline: args.closeBaseline,
      discard: args.discard,
      dryRun: args.dryRun,
      force: args.force,
    });
    return;
  }

  if (args.mode === 'check-scope') {
    checkScope(args.targetDir, { strict: args.strict });
    return;
  }

  if (args.mode === 'refresh-active-slices') {
    const outputPath = refreshActiveSlicesBoard(path.resolve(process.cwd(), '.'));
    console.log(`Active slices refreshed: ${outputPath}`);
    return;
  }

  if (args.mode === 'spec') {
    if (!args.targetDir || args.targetDir === '.') {
      throw new Error(formatError('missing spec directory. Use: npx create-quiver spec <start|status|close> <spec-dir>'));
    }

    if (args.specCommand === 'start') {
      const report = startSpecWorktree(process.cwd(), args.targetDir);
      process.stdout.write(formatSpecStartResult(report));
      return;
    }

    if (args.specCommand === 'status') {
      const report = buildSpecStatus(process.cwd(), args.targetDir);
      process.stdout.write(formatSpecStatus(report));
      return;
    }

    if (args.specCommand === 'close') {
      const report = closeSpecWorktree(process.cwd(), args.targetDir, {
        baseBranch: args.aiBaseBranch,
        discard: args.discard,
        dryRun: args.dryRun,
        force: args.force,
        remote: args.aiRemote,
      });
      process.stdout.write(formatSpecCloseResult(report));
      return;
    }

    throw new Error(formatError(`unsupported spec subcommand: ${args.specCommand}. Supported tasks: start, status, close`));
  }

  const packageRoot = path.resolve(__dirname, '../..');
  const targetDir = resolveTargetRoot(process.cwd(), args.targetDir);
  const projectName = args.projectName || path.basename(targetDir) || 'Quiver Project';
  const initLayout = buildInitLayout(targetDir, {
    compatibilityAlias: !args.explicitInit,
    dryRun: args.dryRun,
    full: args.initFull,
    includeTemplates: args.initIncludeTemplates,
    legacyScripts: args.initLegacyScripts,
    minimal: args.initMinimal,
    projectName,
    skipInstall: args.skipInstall,
  });

  if (args.dryRun) {
    console.log(formatInitLayoutPlan(initLayout));
    return;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-create-'));

  try {
    ensureDir(targetDir);

    const templateRoot = packTemplate(packageRoot, tempRoot);
    if (initLayout.profile === 'full') {
      exportTemplatesToLegacyRoot(templateRoot, targetDir);
    }
    runInitDocs(targetDir, projectName, {
      includeTemplates: args.initIncludeTemplates,
      legacyScripts: args.initLegacyScripts,
      profile: initLayout.profile,
      templateRoot,
    });

    if (!args.skipInstall) {
      const installResult = installSelfAsDevDep(targetDir, CLI_VERSION);
      if (installResult === 'installed') {
        console.log(`Added create-quiver@${CLI_VERSION} as dev dependency`);
      } else if (installResult === 'failed') {
        console.warn(`Warning: could not install create-quiver automatically. Run: npm install -D create-quiver@${CLI_VERSION}`);
      }
    }

    console.log(`Installed Quiver into ${targetDir}`);
    printInitNextSteps(targetDir, projectName);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  runAnalyze,
  runDoctor,
  runFlow,
  runMigrate,
  runPrepare,
  run,
};
