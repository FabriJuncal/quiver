const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { checkHandoff, scaffoldHandoff } = require('./lib/handoff');
const {
  applyDoctorFixPlan,
  buildDoctorFixPlan,
  collectDoctorReport,
  formatDoctorFixPlan,
} = require('./lib/doctor');
const {
  runActiveSlice: runAiActiveSlice,
  runAgent: runAiAgent,
  runApprovalStatus: runAiApprovalStatus,
  runApprove: runAiApprove,
  runDoctor: runAiDoctor,
  runExecutePlan: runAiExecutePlan,
  runExecuteSlice: runAiExecuteSlice,
  runExport: runAiExport,
  runInspect: runAiInspect,
  runLifecycleResume: runAiLifecycleResume,
  runLifecycleRun: runAiLifecycleRun,
  runLifecycleStatus: runAiLifecycleStatus,
  runModelsList: runAiModelsList,
  runOnboard,
  runPlan: runAiPlan,
  runPrepareContext: runAiPrepareContext,
  runPr: runAiPr,
  runRepairPlan: runAiRepairPlan,
  runPromptSlice: runAiPromptSlice,
  runReviewPlan: runAiReviewPlan,
  runRevise: runAiRevise,
  runSlicesList: runAiSlicesList,
  runSpecsList: runAiSpecsList,
  runTraceReport: runAiTraceReport,
} = require('./commands/ai');
const { runDemo } = require('./commands/demo');
const { runPrepare } = require('./commands/prepare');
const { runEvidence } = require('./commands/evidence');
const { runFlow } = require('./commands/flow');
const { runGraph } = require('./commands/graph');
const { runNext } = require('./commands/next');
const { runPlan } = require('./commands/plan');
const { runCreateSpec, runValidateSpec } = require('./commands/spec');
const { buildInitLayout, formatInitLayoutPlan } = require('./lib/init-layout');
const {
  formatInstallSelfCommand,
  initializeProjectDocs,
  installSelfAsDevDep,
  refreshAiContextDoc,
} = require('./lib/init-docs');
const { checkPrReadiness, checkScope, checkSliceReadiness } = require('./lib/readiness');
const { cleanupSlice, refreshActiveSlicesBoard, startSlice } = require('./lib/lifecycle');
const { buildSpecStatus, closeSpecWorktree, formatSpecCloseResult, formatSpecStartResult, formatSpecStatus, startSpecWorktree } = require('./lib/spec-worktrees');
const { getContextPathExclusionReason } = require('./lib/ai/safety');
const { selectOption } = require('./lib/cli/selectors');
const { createUx } = require('./lib/cli/ux');
const { validateUxFlags } = require('./lib/cli/ux-flags');
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

const SUPPORTED_COMMAND_MODES = new Set([
  'init',
  'flow',
  'plan',
  'graph',
  'next',
  'doctor',
  'prepare',
  'analyze',
  'migrate',
  'start-slice',
  'check-slice',
  'check-pr',
  'check-handoff',
  'new-handoff',
  'cleanup-slice',
  'check-scope',
  'refresh-active-slices',
  'spec',
  'evidence',
  'demo',
  'ai',
]);

const SUPPORTED_AI_COMMANDS = new Set([
  'active-slice',
  'agent',
  'approve',
  'approval-status',
  'approvals',
  'doctor',
  'execute-plan',
  'execute-slice',
  'executor-prompt',
  'export',
  'inspect',
  'onboard',
  'plan',
  'prepare-context',
  'pr',
  'prompt-slice',
  'repair-plan',
  'review-plan',
  'revise',
  'resume',
  'run',
  'slices',
  'specs',
  'status',
  'trace',
]);

const SUPPORTED_SPEC_COMMANDS = new Set(['close', 'create', 'start', 'status', 'validate']);
const SUPPORTED_DEMO_COMMANDS = new Set(['create']);

function unsupportedCommandMessage(commandName) {
  return [
    `unsupported command: ${commandName}`,
    'Run: npx create-quiver --help',
    `If you meant to initialize a project, use: npx create-quiver init --name "${commandName}"`,
    'If this command exists in newer docs, update create-quiver and rerun the command.',
  ].join('\n');
}

const COMMAND_HELP_GROUPS = [
  {
    title: 'Bootstrap and project context',
    commands: [
      ['init', 'Create the default AI-first Quiver contract in the current project.'],
      ['analyze', 'Scan the project and write docs/PROJECT_MAP.md plus .quiver scan data.'],
      ['doctor', 'Validate the Quiver layout, generated docs, environment, and next safe steps.'],
      ['flow', 'Show the read-only guided workflow stage, blockers, and next safe command.'],
      ['prepare', 'Run setup diagnostics for providers, GitHub, SSH, and project readiness.'],
      ['migrate', 'Upgrade an already initialized Quiver project to the current contract.'],
    ],
  },
  {
    title: 'Planning and slice navigation',
    commands: [
      ['plan', 'List slices in execution order with critical path and optional JSON output.'],
      ['graph', 'Render slice dependencies as tree, Mermaid, DOT, or JSON-ready graph output.'],
      ['next', 'Print the next ready slice or every ready slice with --all-ready.'],
    ],
  },
  {
    title: 'AI lifecycle',
    commands: [
      ['ai run create|close', 'Create a durable AI lifecycle run or close/archive a completed or stale run without deleting evidence.'],
      ['ai active-slice status|reconcile', 'Inspect or dry-run reconcile local active-slice state from every supported source.'],
      ['ai status', 'Show current AI lifecycle phase, approved versions, blockers, and next command.'],
      ['ai resume', 'Resume guidance from the last valid lifecycle phase without chat memory.'],
      ['ai onboard', 'Run or print the planner onboarding prompt with a token-aware context pack.'],
      ['ai prepare-context', 'Preview or write docs-only AI context updates with assumptions and risks.'],
      ['ai agent set|list|show|doctor|repair', 'Manage, diagnose, and dry-run repair planner, executor, reviewer, and doctor provider profiles without secrets.'],
      ['ai models list', 'List provider/model ids known by Quiver without claiming account availability.'],
      ['ai plan', 'Generate versioned planner drafts for acceptance criteria, technical plan, or spec phase.'],
      ['ai revise', 'Create a new planner draft from human feedback without approving it.'],
      ['ai repair-plan', 'Repair an approved technical plan into a new structured draft without mutating the approved artifact.'],
      ['ai review-plan', 'Review the technical-plan draft for production readiness before approval.'],
      ['ai approve', 'Approve a concrete saved draft version for the next planner phase.'],
      ['ai approvals', 'Inspect approval status and saved planner drafts.'],
      ['ai prompt-slice', 'Print a minimal executor prompt for one slice without provider execution.'],
      ['ai execute-slice', 'Execute one slice with scope checks, redacted evidence, closure updates, and optional commit.'],
      ['ai execute-plan', 'Print or execute dependency-safe waves in manual or delegated mode.'],
      ['ai doctor', 'Run GitHub, SSH, and PR readiness preflight checks.'],
      ['ai pr', 'Validate and optionally create a GitHub PR from the generated PR body.'],
    ],
  },
  {
    title: 'Inspection and export',
    commands: [
      ['ai inspect', 'Show dashboard-friendly lifecycle state for specs, slices, runs, agents, and blockers.'],
      ['ai export', 'Export lifecycle state as JSON or Markdown for dashboards, PRs, or other agents.'],
      ['ai specs list', 'List specs with status, progress, slice counts, and paths.'],
      ['ai slices list', 'List slices with status, dependencies, blockers, and optional JSON.'],
      ['ai trace report', 'Report AI runs, execution waves, and migration guidance.'],
    ],
  },
  {
    title: 'Specs, slices, and validation',
    commands: [
      ['spec create', 'Create the real spec tree from a reviewed approved technical plan.'],
      ['spec start', 'Create or reuse the dedicated worktree and branch for one spec.'],
      ['spec status', 'Show spec worktree, branch, slice-00 state, and pending slices.'],
      ['spec validate', 'Validate spec docs, slices, briefs, evidence, status, dependencies, and safe paths.'],
      ['spec close', 'Close a merged clean spec worktree and guide local sync.'],
      ['start-slice', 'Start work on one slice and mark it active.'],
      ['check-slice', 'Validate slice structure, dependencies, scope, and readiness.'],
      ['check-pr', 'Validate PR readiness for a slice/spec workflow.'],
      ['check-scope', 'Compare changed files against a slice scope.'],
      ['cleanup-slice', 'Clean active-slice state after a slice finishes or is discarded.'],
      ['refresh-active-slices', 'Refresh generated active-slice boards.'],
      ['check-handoff', 'Validate a transfer handoff or per-slice execution/closure brief.'],
      ['new-handoff', 'Create a handoff scaffold for exceptional context transfer.'],
    ],
  },
  {
    title: 'Evidence and demos',
    commands: [
      ['evidence run', 'Run a command and record exit code, duration, redacted output, and Markdown evidence.'],
      ['demo create spec-viewer', 'Create or preview the optional static Quiver Spec Viewer demo scaffold.'],
    ],
  },
  {
    title: 'Shortcuts and compatibility',
    commands: [
      ['--name "<project>"', 'Compatibility alias for init when bootstrapping a project.'],
      ['--version / -V', 'Print the installed create-quiver package version.'],
      ['--help / help', 'Show this command reference.'],
      ['quiver', 'Local installed alias to the same CLI; use npx create-quiver for bootstrap.'],
    ],
  },
];

function formatCommandHelpGroups() {
  const lines = ['Commands:'];
  for (const group of COMMAND_HELP_GROUPS) {
    lines.push('', `${group.title}:`);
    for (const [command, description] of group.commands) {
      lines.push(`  ${command.padEnd(24)} ${description}`);
    }
  }
  return lines.join('\n');
}

function printUsage() {
  console.log(`Usage:
  npx create-quiver [options]
  npx create-quiver init [options]
  npx create-quiver analyze [options]
  npx create-quiver flow [options]
  npx create-quiver plan [options]
  npx create-quiver ai <task> [options]
  npx create-quiver ai run create --input <requirements.md>
  npx create-quiver ai run close --run <id>
  npx create-quiver ai active-slice reconcile --dry-run
  npx create-quiver ai status [options]
  npx create-quiver ai resume [options]
  npx create-quiver ai inspect [options]
  npx create-quiver ai export [--format json|markdown]
  npx create-quiver ai specs list [--json]
  npx create-quiver ai slices list [--json]
  npx create-quiver ai trace report [options]
  npx create-quiver ai agent <set|list|show|doctor|repair> [role] [options]
  npx create-quiver ai models list [--provider codex|claude|gemini] [--json]
  npx create-quiver ai prepare-context [options]
  npx create-quiver ai revise [options]
  npx create-quiver ai repair-plan [options]
  npx create-quiver graph [options]
  npx create-quiver next [options]
  npx create-quiver migrate [options]
  npx create-quiver doctor [options]
  npx create-quiver prepare [options]
  npx create-quiver start-slice [options] <slice.json>
  npx create-quiver check-slice [options] <slice.json>
  npx create-quiver check-pr <slice.json>
  npx create-quiver check-handoff <handoff-or-brief.md>
  npx create-quiver new-handoff <spec-slug>
  npx create-quiver cleanup-slice [options] <slice.json>
  npx create-quiver check-scope [options] <slice.json>
  npx create-quiver refresh-active-slices
  npx create-quiver spec create [options]
  npx create-quiver spec start <spec-dir>
  npx create-quiver spec status <spec-dir>
  npx create-quiver spec validate <spec-dir>
  npx create-quiver spec close <spec-dir>
  npx create-quiver evidence run [options] -- <command>
  npx create-quiver demo create spec-viewer [options]

${formatCommandHelpGroups()}

Options:
  -n, --name <project-name>   Project name to generate
  -d, --dir <target-dir>      Target directory to scaffold into or inspect
      --spec <slug>           Restrict plan output to one spec
      --format <name>         Graph or AI export output format (tree, mermaid, dot, json, markdown)
      --show-conflicts        Show shared file paths in graph output
      --level <n>             Restrict graph output to one level
      --json                  Emit machine-readable JSON
      --include-completed     Include completed slices in plan, graph, or next history output
      --only-ready            Show only slices with no pending dependencies
      --all-ready             List every ready slice returned by next
      --auto-start            Prompt for confirmation and run start-slice on next
      --local                 For check-slice, run structural validation without remote/base checks
      --strict                Treat supported validation warnings as failures
      --unicode               Prefer Unicode output when supported
      --minimal               Plan or run the minimal init profile
      --full                  Plan or run the full compatibility init profile
      --legacy-scripts        Include legacy Bash wrappers in init profile
      --include-templates     Export packaged templates in init profile
      --dry-run               Preview init, analyze, migrate, prepare, spec create/start/close, demo, ai agent set, or AI work without executing writes/providers
      --print-prompt          Print the exact AI prompt and exit without executing provider CLIs
      --with-planner          Enable planner-assisted behavior on commands that explicitly support it
      --interactive           Enable prompts on commands that explicitly support interactive choices
      --review                Open or prepare human review before persistent writes where supported
      --methodology <name>    Select methodology where supported (currently wdd-sdd)
      --no-color              Disable ANSI colors in human output
      --fix                   For doctor, apply safe non-destructive repairs
      --execute               For ai execute-plan, run the planned slices instead of printing commands
      --create                For ai pr, create the PR after preflight instead of printing the plan only
      --commit                For ai execute-slice, commit validated slice changes after provider, scope, and tests pass
      --allow-dirty           For ai execute-slice, allow pre-existing dirty files and ignore them for scope diff
      --mode <name>           Execution mode for ai execute-plan (auto, manual, delegated)
      --provider <name>       Provider CLI to preflight for prepare or AI commands
      --model <label>         Free-form model label for AI agent profiles
      --version <n>           Draft version to approve for AI planner phases
      --run <id>              AI lifecycle run id
      --ssh-host-alias <name> SSH host alias to validate for prepare or AI commands
      --identity-file <path>  SSH identity file to validate for prepare or AI commands
      --remote <name>         Git remote name for check-slice or AI PR checks
      --base <branch>         Base branch for check-slice, check-scope, ai pr, or spec close (default: main)
      --output <file>         Output file for evidence run
      --max-output <n>        Maximum stdout/stderr chars per evidence section
      --title <text>          Override PR title for ai pr create
  -y, --yes                   Skip prompts and use the provided inputs
  -V, --version               Show the installed create-quiver version
  -h, --help                  Show this help message

Examples:
  npx create-quiver init --name "My Project"
  npx create-quiver init --interactive
  npx create-quiver init --name "My Project" --dry-run
  npx create-quiver --name "My Project"
  npx create-quiver --name "My Project" --dir ./my-project
  cd ./my-project && npx create-quiver flow
  cd ./my-project && npx create-quiver analyze
  cd ./my-project && npx create-quiver plan --json
  cd ./my-project && npx create-quiver ai onboard --dry-run
  cd ./my-project && npx create-quiver ai onboard --print-prompt
  cd ./my-project && npx create-quiver ai prepare-context --dry-run
  cd ./my-project && npx create-quiver ai run create --input requirements.md
  cd ./my-project && npx create-quiver ai active-slice reconcile --dry-run
  cd ./my-project && npx create-quiver ai status
  cd ./my-project && npx create-quiver ai resume
  cd ./my-project && npx create-quiver ai inspect
  cd ./my-project && npx create-quiver ai export --format json
  cd ./my-project && npx create-quiver ai export --format markdown
  cd ./my-project && npx create-quiver ai specs list
  cd ./my-project && npx create-quiver ai slices list --json
  cd ./my-project && npx create-quiver ai trace report
  cd ./my-project && npx create-quiver ai agent set planner --provider codex --model gpt-5.5 --dry-run
  cd ./my-project && npx create-quiver ai agent set planner --provider codex --model gpt-5.5
  cd ./my-project && npx create-quiver ai agent doctor
  cd ./my-project && npx create-quiver ai agent repair --dry-run
  cd ./my-project && npx create-quiver ai agent list
  cd ./my-project && npx create-quiver ai models list --provider codex
  cd ./my-project && npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
  cd ./my-project && npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run
  cd ./my-project && npx create-quiver ai approve --phase acceptance --version 1
  cd ./my-project && npx create-quiver ai plan --phase technical-plan --dry-run
  cd ./my-project && npx create-quiver ai repair-plan --dry-run
  cd ./my-project && npx create-quiver ai review-plan --dry-run
  cd ./my-project && npx create-quiver ai approve --phase technical-plan --version 1
  cd ./my-project && npx create-quiver spec create --dry-run
  cd ./my-project && npx create-quiver spec start specs/my-project --dry-run
  cd ./my-project && npx create-quiver ai approvals
  cd ./my-project && npx create-quiver ai prompt-slice --slice specs/my-project/slices/slice-01/slice.json --dry-run
  cd ./my-project && npx --yes create-quiver@${CLI_VERSION} ai prompt-slice --slice specs/my-project/slices/slice-01/slice.json --dry-run
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
  cd ./my-project && npx create-quiver check-handoff specs/my-project/slices/slice-01/EXECUTION_BRIEF.md
  cd ./my-project && npx create-quiver new-handoff my-spec
  cd ./my-project && npx create-quiver cleanup-slice specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver check-scope specs/my-project/slices/slice-01/slice.json
  cd ./my-project && npx create-quiver refresh-active-slices
  cd ./my-project && npx create-quiver spec start specs/my-project
  cd ./my-project && npx create-quiver spec status specs/my-project
  cd ./my-project && npx create-quiver spec validate specs/my-project
  cd ./my-project && npx create-quiver spec close specs/my-project --dry-run
  cd ./my-project && npx create-quiver evidence run -- npm test
  cd ./my-project && npx create-quiver demo create spec-viewer --dry-run
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
    checkSliceLocal: false,
    closeBaseline: false,
    discard: false,
    doctorFix: false,
    dryRun: false,
    aiPrintPrompt: false,
    gate: 'execution',
    projectName: '',
    targetDir: '.',
    targetDirExplicit: false,
    strict: false,
    strictOverlap: false,
    json: false,
    noColor: false,
    withPlanner: false,
    interactive: false,
    review: false,
    includeCompleted: false,
    onlyReady: false,
    allReady: false,
    autoStart: false,
    specSlug: '',
    format: 'tree',
    formatExplicit: false,
    showConflicts: false,
    methodology: '',
    level: null,
    unicode: false,
    aiCommand: '',
    aiSecondaryCommand: '',
    aiAgentCommand: '',
    aiAgentRole: '',
    aiRunCommand: '',
    aiRunId: '',
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
    aiExecutionMode: 'auto',
    aiCreate: false,
    aiBaseBranch: 'main',
    baseBranchExplicit: false,
    aiTitle: '',
    aiSshHostAlias: '',
    aiIdentityFile: '',
    aiRemote: 'origin',
    initFull: false,
    initIncludeTemplates: false,
    initLegacyScripts: false,
    initMinimal: false,
    specCommand: '',
    demoCommand: '',
    demoName: '',
    evidenceCommand: '',
    evidenceArgs: [],
    evidenceOutput: '',
    evidenceMaxOutput: null,
  };

  const args = [...argv];
  if (SUPPORTED_COMMAND_MODES.has(args[0])) {
    result.mode = args[0];
    result.explicitInit = args[0] === 'init';
    args.shift();
    if (result.mode === 'spec') {
      result.specCommand = args.shift() || '';
    }
    if (result.mode === 'evidence') {
      result.evidenceCommand = args.shift() || '';
    }
    if (result.mode === 'demo') {
      result.demoCommand = args.shift() || '';
      result.demoName = args.shift() || '';
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
  } else if (args[0] && !args[0].startsWith('-')) {
    throw new Error(formatError(unsupportedCommandMessage(args[0])));
  }

  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      result.evidenceArgs = args.slice(index + 1);
      break;
    }

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

    if (arg === '--local') {
      result.checkSliceLocal = true;
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

    if (arg === '--fix') {
      result.doctorFix = true;
      continue;
    }

    if (arg === '--dry-run') {
      result.dryRun = true;
      continue;
    }

    if (arg === '--print-prompt') {
      result.aiPrintPrompt = true;
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

    if (arg === '--mode') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --mode'));
      }
      result.aiExecutionMode = value;
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

    if (arg === '--no-color') {
      result.noColor = true;
      continue;
    }

    if (arg === '--with-planner') {
      result.withPlanner = true;
      continue;
    }

    if (arg === '--interactive') {
      result.interactive = true;
      continue;
    }

    if (arg === '--review') {
      result.review = true;
      continue;
    }

    if (arg === '--include-completed') {
      result.includeCompleted = true;
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
      result.formatExplicit = true;
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

    if (arg === '--id') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --id'));
      }
      result.aiProfileId = value;
      continue;
    }

    if (arg === '--display-name') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --display-name'));
      }
      result.aiDisplayName = value;
      continue;
    }

    if (arg === '--default') {
      result.aiDefaultProfile = true;
      continue;
    }

    if (arg === '--planner') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --planner'));
      }
      result.aiPlannerProfile = value;
      continue;
    }

    if (arg === '--executor') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --executor'));
      }
      result.aiExecutorProfile = value;
      continue;
    }

    if (arg === '--reviewer') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --reviewer'));
      }
      result.aiReviewerProfile = value;
      continue;
    }

    if (arg === '--doctor') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --doctor'));
      }
      result.aiDoctorProfile = value;
      continue;
    }

    if (arg === '--methodology') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --methodology'));
      }
      result.methodology = value;
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

    if (arg === '--run') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --run'));
      }
      result.aiRunId = value;
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
      result.baseBranchExplicit = true;
      continue;
    }

    if (arg === '--output') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --output'));
      }
      result.evidenceOutput = value;
      continue;
    }

    if (arg === '--max-output') {
      const value = args[++index];
      if (typeof value === 'undefined') {
        throw new Error(formatError('missing value for --max-output'));
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(formatError('invalid value for --max-output'));
      }
      result.evidenceMaxOutput = parsed;
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
      result.targetDirExplicit = true;
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
    if (result.aiCommand === 'run' && !result.aiRunCommand && positional.length > 0) {
      result.aiRunCommand = positional.shift();
    }
    if ((result.aiCommand === 'specs' || result.aiCommand === 'slices' || result.aiCommand === 'models' || result.aiCommand === 'trace' || result.aiCommand === 'active-slice') && !result.aiSecondaryCommand && positional.length > 0) {
      result.aiSecondaryCommand = positional.shift();
    }
    if ((result.aiCommand === 'specs' || result.aiCommand === 'slices' || result.aiCommand === 'models') && result.aiSecondaryCommand && result.aiSecondaryCommand !== 'list') {
      throw new Error(formatError(`unsupported ai ${result.aiCommand} subcommand: ${result.aiSecondaryCommand}. Supported tasks: list`));
    }
    if (result.aiCommand === 'trace' && result.aiSecondaryCommand && result.aiSecondaryCommand !== 'report') {
      throw new Error(formatError(`unsupported ai trace subcommand: ${result.aiSecondaryCommand}. Supported tasks: report`));
    }
    if (result.aiCommand === 'active-slice' && result.aiSecondaryCommand && result.aiSecondaryCommand !== 'status' && result.aiSecondaryCommand !== 'reconcile') {
      throw new Error(formatError(`unsupported ai active-slice subcommand: ${result.aiSecondaryCommand}. Supported tasks: status, reconcile`));
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
      throw new Error(formatError('missing spec subcommand. Use: npx create-quiver spec <create|start|status|validate|close>'));
    }
    if (result.specCommand !== 'create' && positional.length > 0) {
      result.targetDir = positional.shift();
    }
    if (result.specCommand === 'create' && positional.length > 0) {
      throw new Error(formatError('spec create does not accept positional arguments; use --input <file> or --spec <slug>'));
    }
  } else if (result.mode === 'evidence') {
    if (!result.evidenceCommand && positional.length > 0) {
      result.evidenceCommand = positional.shift();
    }
    if (!result.evidenceCommand) {
      throw new Error(formatError('missing evidence subcommand. Use: npx create-quiver evidence run -- <command>'));
    }
    if (result.evidenceCommand !== 'run') {
      throw new Error(formatError(`unsupported evidence subcommand: ${result.evidenceCommand}. Supported tasks: run`));
    }
    if (positional.length > 0) {
      throw new Error(formatError('evidence run does not accept positional arguments before --'));
    }
  } else if (result.mode === 'demo') {
    if (!result.demoCommand && positional.length > 0) {
      result.demoCommand = positional.shift();
    }
    if (!result.demoName && positional.length > 0) {
      result.demoName = positional.shift();
    }
    if (!result.demoCommand) {
      throw new Error(formatError('missing demo subcommand. Use: npx create-quiver demo create spec-viewer'));
    }
    if (!SUPPORTED_DEMO_COMMANDS.has(result.demoCommand)) {
      throw new Error(formatError(`unsupported demo subcommand: ${result.demoCommand}. Supported tasks: create`));
    }
    if (result.demoName !== 'spec-viewer') {
      throw new Error(formatError(`unsupported demo: ${result.demoName || '(missing)'}. Supported demos: spec-viewer`));
    }
    if (positional.length > 0) {
      throw new Error(formatError('demo create spec-viewer does not accept positional target paths; use --dir <target-dir>'));
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
  const seenLanguages = new Set();
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
    if (extensions.has(ext) && !seenLanguages.has(language)) {
      languages.push(language);
      seenLanguages.add(language);
    }
  }

  return languages;
}

function parseCreateQuiverScriptCommand(command) {
  const normalized = String(command || '').trim();
  const match = normalized.match(/^npx\s+create-quiver(?:@[^\s]+)?\s+(.+)$/);
  if (!match) {
    return null;
  }

  const tokens = match[1].split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  return {
    commandName: tokens[0],
    subcommand: tokens[1] || '',
  };
}

function findUnsupportedCreateQuiverScripts(scripts = {}) {
  const unsupported = [];

  for (const [scriptName, command] of Object.entries(scripts)) {
    const parsed = parseCreateQuiverScriptCommand(command);
    if (!parsed) {
      continue;
    }

    if (!SUPPORTED_COMMAND_MODES.has(parsed.commandName)) {
      unsupported.push({
        command,
        reason: `unsupported command "${parsed.commandName}"`,
        scriptName,
      });
      continue;
    }

    if (parsed.commandName === 'ai' && !SUPPORTED_AI_COMMANDS.has(parsed.subcommand)) {
      unsupported.push({
        command,
        reason: `unsupported ai subcommand "${parsed.subcommand || '(missing)'}"`,
        scriptName,
      });
      continue;
    }

    if (parsed.commandName === 'spec' && !SUPPORTED_SPEC_COMMANDS.has(parsed.subcommand)) {
      unsupported.push({
        command,
        reason: `unsupported spec subcommand "${parsed.subcommand || '(missing)'}"`,
        scriptName,
      });
      continue;
    }

    if (parsed.commandName === 'demo' && !SUPPORTED_DEMO_COMMANDS.has(parsed.subcommand)) {
      unsupported.push({
        command,
        reason: `unsupported demo subcommand "${parsed.subcommand || '(missing)'}"`,
        scriptName,
      });
    }
  }

  return unsupported;
}

function detectNodeProject(files, rootEntries, packageJson, languages) {
  const hasPackageJson = Boolean(packageJson);
  const hasJavaScriptSignals = languages.some((language) => language === 'javascript' || language === 'typescript');
  const hasSourceDirectories = detectSourceDirectories(rootEntries).length > 0;
  const hasSourceFiles = files.some((file) => /\.(?:c|m)?jsx?$/i.test(file) || /\.(?:c|m)?tsx?$/i.test(file));

  return hasJavaScriptSignals && (hasPackageJson || hasSourceDirectories || hasSourceFiles);
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
      matches: () => dependencies.has('vue') || rootFileSet.has('vue.config.js'),
      signals: ['vue', 'vue.config.*'],
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

  if (frameworks.length === 0 && detectNodeProject(files, rootEntries, packageJson, languages)) {
    frameworks.push('node');
    evidence.push({ framework: 'node', signals: ['package.json', 'javascript or typescript source files'] });
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
    .filter(([name]) => /(^|:)(analyze|doctor|migrate|validate|test|build|lint|dev|start|check)(:|$)|analyze|doctor|migrate|validate|test|build|lint|dev|start|check/i.test(name))
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

function runAnalyze(targetDir, options = {}) {
  const projectRoot = resolveTargetRoot(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  const scan = buildProjectScan(projectRoot);

  if (options.dryRun) {
    console.log(`Project analysis dry-run for ${projectRoot}`);
    console.log('Writes: none');
    console.log(`Would write ${CURRENT_SCAN_RELATIVE_PATH}`);
    console.log(`Would write ${PROJECT_MAP_RELATIVE_PATH}`);
    console.log('Would refresh docs/AI_CONTEXT.md');
    console.log(`Detected primary stack: ${scan.stack.primary}`);
    console.log(`Detected frameworks: ${scan.stack.frameworks.length > 0 ? scan.stack.frameworks.join(', ') : 'none detected'}`);
    console.log(`Detected package manager: ${scan.project.package_manager}`);
    return {
      artifacts: {
        jsonPath: path.join(projectRoot, CURRENT_SCAN_RELATIVE_PATH),
        mdPath: path.join(projectRoot, PROJECT_MAP_RELATIVE_PATH),
      },
      dryRun: true,
      scan,
    };
  }

  const artifacts = writeProjectScanArtifacts(projectRoot, scan);
  const aiContextPath = refreshAiContextDoc(projectRoot, scan);
  updateStateForAnalyze(projectRoot, CLI_VERSION);

  console.log(`Project analysis completed for ${projectRoot}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, artifacts.jsonPath)}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, artifacts.mdPath)}`);
  console.log(`Wrote ${relativePosixPath(projectRoot, aiContextPath)}`);
  console.log(`Detected primary stack: ${scan.stack.primary}`);
  console.log(`Detected package manager: ${scan.project.package_manager}`);

  return {
    artifacts,
    aiContextPath,
    dryRun: false,
    scan,
  };
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
  const legacyLayout = inspectLegacyMigrationLayout(projectRoot);

  if (options.dryRun) {
    const migrationPlan = buildInitLayout(projectRoot, {
      dryRun: true,
      full: true,
      legacyScripts: true,
      projectName,
      skipInstall: options.skipInstall === true,
    });
    console.log('Quiver migration dry-run');
    console.log(`- Project: ${projectName}`);
    console.log(`- Target: ${projectRoot}`);
    console.log('- Writes: none');
    console.log(`- Planned create: ${migrationPlan.summary.create}`);
    console.log(`- Planned update: ${migrationPlan.summary.update}`);
    console.log(`- Planned preserve: ${migrationPlan.summary.preserve}`);
    if (legacyLayout.hasLegacyLayout) {
      console.log(`- Legacy layout detected and preserved: ${legacyLayout.legacyPaths.join(', ')}`);
    }
    console.log('- Next command: npx create-quiver migrate --skip-install');
    console.log('');
    console.log(formatInitLayoutPlan(migrationPlan));
    return;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-migrate-'));

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
        console.warn(`Warning: could not install create-quiver automatically. Run: ${formatInstallSelfCommand(projectRoot, CLI_VERSION)}`);
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

function uniqueLines(lines) {
  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const value = String(line || '').trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    unique.push(value);
  }
  return unique;
}

function buildDoctorCommandReport(projectRoot) {
  const doctorReport = collectDoctorReport(projectRoot);
  const specSlugs = doctorReport.specSlugs;
  const doctorExampleTarget = doctorReport.exampleTarget || {
    sliceId: '<slice-id>',
    source: 'generic',
    specSlug: '<spec-slug>',
  };
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
    'quiver:ai:inspect',
    'quiver:ai:export',
    'quiver:ai:specs',
    'quiver:ai:slices',
    'quiver:ai:trace',
    'quiver:ai:onboard',
    'quiver:ai:plan',
    'quiver:ai:review-plan',
    'quiver:ai:approve',
    'quiver:ai:prompt-slice',
    'quiver:ai:execute-slice',
    'quiver:ai:execute-plan',
    'quiver:ai:pr',
    'quiver:ai:doctor',
  ].filter((name) => typeof pkg.scripts?.[name] !== 'string');
  const unsupportedCreateQuiverScripts = findUnsupportedCreateQuiverScripts(pkg.scripts || {});
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
  const checks = [];

  const addCheck = (id, status, message, details = {}) => {
    checks.push({
      id,
      status,
      message,
      ...details,
    });
  };

  addCheck('project-root', 'ok', `Quiver doctor passed for ${projectRoot}`);
  addCheck(
    'layout',
    doctorReport.layout === 'incomplete' ? 'error' : 'ok',
    `Layout: ${doctorReport.layout}`,
  );
  addCheck('specs', 'ok', specSlugs.length > 0 ? `Specs: ${specSlugs.join(', ')}` : 'Specs: none yet');

  if (doctorReport.legacySignals.length > 0) {
    addCheck('legacy-signals', doctorReport.layout === 'legacy' || doctorReport.layout === 'hybrid' ? 'warning' : 'ok', `Legacy signals: ${doctorReport.legacySignals.join(', ')}`);
  }

  addCheck(
    'required-files',
    missingFiles.length > 0 ? 'error' : 'ok',
    missingFiles.length > 0 ? `Missing required files: ${missingFiles.join(', ')}` : 'Required files found',
    { missing: missingFiles },
  );

  if (requiredExecutables.length > 0 || nonExecutableScripts.length > 0) {
    addCheck(
      'legacy-executables',
      nonExecutableScripts.length > 0 ? 'error' : 'ok',
      nonExecutableScripts.length > 0 ? `Missing executable bit: ${nonExecutableScripts.join(', ')}` : 'Legacy executable scripts are runnable',
      { missing: nonExecutableScripts },
    );
  }

  addCheck(
    'workflow-scripts',
    missingScripts.length > 0 ? 'error' : 'ok',
    missingScripts.length > 0 ? `Missing package.json workflow scripts: ${missingScripts.join(', ')}` : 'Workflow scripts available',
    { missing: missingScripts },
  );

  addCheck(
    'state',
    hasQuiverState ? 'ok' : 'warning',
    hasQuiverState ? 'Quiver state metadata found' : 'Warning: missing Quiver state metadata: .quiver/state.json',
  );

  addCheck(
    'project-scan',
    hasScanArtifacts ? 'ok' : 'warning',
    hasScanArtifacts ? 'Project analysis artifacts found' : 'Warning: project analysis artifacts not found; run analyze when you need the visible project map',
  );

  for (const scriptName of missingNodeNativeScripts) {
    addCheck(`node-script:${scriptName}`, 'warning', `Warning: missing Node-native script: ${scriptName}`);
  }

  for (const scriptName of missingAiScripts) {
    addCheck(`ai-script:${scriptName}`, 'warning', `Warning: missing AI orchestration script: ${scriptName}`);
  }

  if (legacyOnlyScripts.length > 0) {
    addCheck(
      'legacy-only-scripts',
      'warning',
      `Warning: legacy Bash workflow scripts detected for ${legacyOnlyScripts.join(', ')}. Run npx create-quiver migrate to add quiver:* npm scripts.`,
    );
  }

  for (const script of unsupportedCreateQuiverScripts) {
    addCheck(
      `unsupported-script:${script.scriptName}`,
      'warning',
      `Warning: package.json script ${script.scriptName} targets ${script.reason}: \`${script.command}\`. Update create-quiver or regenerate scripts with npx create-quiver migrate.`,
      { script_name: script.scriptName, command: script.command, reason: script.reason },
    );
  }

  for (const warning of doctorReport.warnings) {
    addCheck(`warning:${checks.length + 1}`, 'warning', `Warning: ${warning}`);
  }

  const suggestedFixes = [
    ...doctorReport.recommendations,
    !hasQuiverState
      ? 'Run migration first: npx create-quiver migrate'
      : !hasScanArtifacts
        ? 'Analyze the project first: npx create-quiver analyze'
        : 'Ask your AI agent: Read AGENTS.md, then docs/AI_ONBOARDING_PROMPT.md and execute it.',
    'Check the next ready slice: npx create-quiver next',
  ];

  if (specSlugs.length > 0) {
    const projectSlug = doctorExampleTarget.specSlug;
    const sliceId = doctorExampleTarget.sliceId || '<slice-id>';
    if (doctorExampleTarget.source === 'active-slice') {
      suggestedFixes.push(`Example target: ${projectSlug}/${sliceId} (${doctorExampleTarget.status})`);
    } else if (doctorExampleTarget.source === 'generic-multiple-specs') {
      suggestedFixes.push('Example target: specs/<spec-slug>/slices/<slice-id>/slice.json (generic because no active slice is obvious)');
    }
    suggestedFixes.push(`Start a slice: npx create-quiver start-slice specs/${projectSlug}/slices/${sliceId}/slice.json`);
    suggestedFixes.push(`Validate a slice: npx create-quiver check-slice specs/${projectSlug}/slices/${sliceId}/slice.json`);
    suggestedFixes.push(`Validate the PR gate: npx create-quiver check-pr specs/${projectSlug}/slices/${sliceId}/slice.json`);
  } else {
    suggestedFixes.push('Create real specs and slices only after acceptance criteria are approved and the technical plan is reviewed and approved.');
  }

  const errors = checks.filter((check) => check.status === 'error').map((check) => check.message);
  const warnings = checks.filter((check) => check.status === 'warning').map((check) => check.message);
  const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';

  return {
    schema_version: 1,
    command: 'doctor',
    project_root: projectRoot,
    status,
    exit_code: errors.length > 0 ? 1 : 0,
    layout: doctorReport.layout,
    specs: specSlugs,
    legacy_signals: doctorReport.legacySignals,
    checks,
    suggested_fixes: uniqueLines(suggestedFixes),
    warnings,
    errors: migrationProblems.length > 0 ? uniqueLines([...migrationProblems, ...errors]) : errors,
  };
}

function formatDoctorHumanReport(report, options = {}) {
  const lines = [];
  const ux = createUx({
    ...options,
    spinner: false,
    write: (text) => lines.push(String(text)),
  });
  const symbolForStatus = (status) => {
    if (status === 'ok') return ux.theme.symbols.success;
    if (status === 'error') return ux.theme.symbols.error;
    return ux.theme.symbols.warning;
  };
  const colorForStatus = (status) => {
    if (status === 'ok') return 'success';
    if (status === 'error') return 'error';
    return 'warning';
  };

  ux.section('Quiver Doctor');
  ux.line('');
  ux.line('Checks');
  for (const check of report.checks) {
    const line = `  ${symbolForStatus(check.status)} ${check.message}`;
    ux.line(ux.mode.decoration ? ux.theme.status(colorForStatus(check.status), line) : line);
  }

  ux.line('');
  ux.line('Suggested fixes');
  for (const fix of report.suggested_fixes) {
    const line = `  ${ux.theme.symbols.bullet} ${fix}`;
    ux.line(ux.mode.decoration ? ux.theme.status('command', line) : line);
  }

  return lines.join('');
}

const METHODOLOGY_OPTIONS = Object.freeze([
  {
    label: 'WDD + SDD',
    value: 'wdd-sdd',
    hint: 'Workflow Driven Development + Spec Driven Development',
    default: true,
  },
]);

const INIT_MODE_OPTIONS = Object.freeze([
  {
    label: 'Proyecto existente',
    value: 'existing',
    hint: 'Agrega Quiver sin sobrescribir archivos existentes',
    default: true,
  },
  {
    label: 'Proyecto nuevo',
    value: 'new',
    hint: 'Crea el contrato base en una carpeta nueva o vacia',
  },
  {
    label: 'Solo validar estructura',
    value: 'validate',
    hint: 'Ejecuta Doctor en lugar de escribir archivos',
  },
]);

const INIT_PROFILE_OPTIONS = Object.freeze([
  {
    label: 'Default',
    value: 'default',
    hint: 'Contrato AI-first recomendado',
    default: true,
  },
  {
    label: 'Minimal',
    value: 'minimal',
    hint: 'Solo documentos esenciales',
  },
  {
    label: 'Full compatibility',
    value: 'full',
    hint: 'Incluye compatibilidad historica y templates visibles',
  },
]);

function hasDirectoryContent(dirPath) {
  return fs.existsSync(dirPath)
    && fs.statSync(dirPath).isDirectory()
    && fs.readdirSync(dirPath).length > 0;
}

function assertSupportedMethodology(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'wdd-sdd';
  }
  if (normalized !== 'wdd-sdd') {
    throw new Error(formatError(`unsupported methodology '${normalized}'. Supported methodologies: wdd-sdd.`));
  }
  return normalized;
}

async function resolveInteractiveInitOptions(args, targetDir, projectName, options = {}) {
  const explicitMethodology = assertSupportedMethodology(args.methodology);

  if (args.interactive !== true) {
    return {
      action: 'init',
      full: args.initFull,
      includeTemplates: args.initIncludeTemplates,
      legacyScripts: args.initLegacyScripts,
      methodology: explicitMethodology,
      minimal: args.initMinimal,
      projectName,
    };
  }

  const ux = createUx({
    env: options.env,
    input: options.input,
    interactive: true,
    noColor: args.noColor,
    output: options.output,
    promptConfirm: options.promptConfirm,
    stderrIsTTY: options.stderrIsTTY,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    write: options.write,
  });

  if (!ux.mode.usePrompts) {
    throw new Error(formatError('init --interactive requires an interactive TTY. Use explicit flags such as --name, --minimal, --full, --legacy-scripts, --include-templates, or run doctor to validate structure.'));
  }

  const selectorOptions = {
    env: options.env,
    input: options.input,
    interactive: true,
    noColor: args.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    stderrIsTTY: options.stderrIsTTY,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
  };

  ux.heading('Bienvenido a Quiver');
  const selectedMode = await selectOption('¿Qué querés configurar?', INIT_MODE_OPTIONS, {
    ...selectorOptions,
    defaultValue: hasDirectoryContent(targetDir) ? 'existing' : 'new',
    flag: 'init|doctor',
    name: 'init mode',
  });
  const selectedMethodology = await selectOption('¿Qué metodología vas a usar?', METHODOLOGY_OPTIONS, {
    ...selectorOptions,
    defaultValue: explicitMethodology,
    flag: '--methodology',
    name: 'methodology',
    value: args.methodology || '',
  });

  assertSupportedMethodology(selectedMethodology.value);

  if (selectedMode.value === 'validate') {
    ux.summary([
      { label: 'Modo', value: 'Solo validar estructura' },
      { label: 'Metodologia', value: selectedMethodology.label },
      { label: 'Comando equivalente', value: 'npx create-quiver doctor' },
    ], { title: 'Configuracion elegida' });
    if (!args.force && !args.dryRun) {
      const confirmed = await ux.promptConfirm('Ejecutar Doctor ahora?', { initialValue: true });
      if (!confirmed) {
        throw new Error(formatError('init interactive validation declined. No files were written.'));
      }
    }
    return {
      action: 'doctor',
      methodology: selectedMethodology.value,
      projectName,
    };
  }

  const defaultProfile = args.initFull ? 'full' : args.initMinimal ? 'minimal' : 'default';
  const selectedProfile = await selectOption('¿Qué contrato inicial querés crear?', INIT_PROFILE_OPTIONS, {
    ...selectorOptions,
    defaultValue: defaultProfile,
    flag: '--minimal|--full',
    name: 'init profile',
  });
  const agentGuidance = await selectOption('¿Querés ver el próximo paso para perfiles de agentes?', [
    {
      label: 'Mostrar comandos sugeridos',
      value: 'show',
      hint: 'No guarda credenciales ni ejecuta proveedores',
      default: true,
    },
    {
      label: 'Omitir por ahora',
      value: 'skip',
    },
  ], {
    ...selectorOptions,
    defaultValue: 'show',
    flag: 'ai agent set',
    name: 'agent profile guidance',
  });
  const nextFlags = {
    full: selectedProfile.value === 'full',
    includeTemplates: args.initIncludeTemplates || selectedProfile.value === 'full',
    legacyScripts: args.initLegacyScripts,
    methodology: selectedMethodology.value,
    minimal: selectedProfile.value === 'minimal',
    projectName,
  };

  ux.summary([
    { label: 'Proyecto', value: projectName },
    { label: 'Modo', value: selectedMode.label },
    { label: 'Metodologia', value: selectedMethodology.label },
    { label: 'Perfil', value: selectedProfile.label },
    { label: 'Perfiles de agentes', value: agentGuidance.value === 'show' ? 'mostrar proximo paso' : 'omitir' },
  ], { title: 'Configuracion elegida' });

  if (agentGuidance.value === 'show') {
    ux.nextSteps([
      'npx create-quiver ai agent set planner --provider codex --model "<modelo-planner>" --dry-run',
      'npx create-quiver ai agent set executor --provider claude --model "<modelo-executor>" --dry-run',
    ], { title: 'Despues de inicializar' });
  }

  if (!args.force && !args.dryRun) {
    const confirmed = await ux.promptConfirm(`Inicializar Quiver en ${targetDir}?`, { initialValue: true });
    if (!confirmed) {
      throw new Error(formatError('init interactive approval declined. No files were written.'));
    }
  }

  return {
    action: 'init',
    ...nextFlags,
  };
}

function runDoctor(targetDir, options = {}) {
  const projectRoot = resolveTargetRoot(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  if (!hasQuiverInitializationEvidence(projectRoot)) {
    throw new Error(formatError('doctor requires a project previously initialized by Quiver.\nRun init first: npx create-quiver --name "Project Name"'));
  }

  const fixPlan = buildDoctorFixPlan(projectRoot);
  if (options.fix) {
    if (options.dryRun) {
      if (options.json) {
        console.log(JSON.stringify({
          schema_version: 1,
          command: 'doctor fix',
          dry_run: true,
          fixes: fixPlan,
        }, null, 2));
        return;
      }
      console.log(formatDoctorFixPlan(fixPlan, { dryRun: true }));
      return;
    }

    applyDoctorFixPlan(projectRoot, fixPlan);
    if (!options.json) {
      console.log(formatDoctorFixPlan(fixPlan));
    }
  }

  const commandReport = buildDoctorCommandReport(projectRoot);
  if (options.json) {
    console.log(JSON.stringify(commandReport, null, 2));
  } else {
    process.stdout.write(formatDoctorHumanReport(commandReport, {
      noColor: options.noColor,
      unicode: options.unicode,
    }));
  }

  if (commandReport.exit_code !== 0) {
    process.exitCode = commandReport.exit_code;
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
  if (argv.length === 1 && argv[0] === 'help') {
    printUsage();
    return;
  }

  if (argv.length === 1 && (argv[0] === '-V' || argv[0] === '--version')) {
    console.log(CLI_VERSION);
    return;
  }

  const args = parseArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  validateUxFlags(args);

  if (args.mode === 'analyze') {
    runAnalyze(args.targetDir, {
      dryRun: args.dryRun,
    });
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
      includeCompleted: args.includeCompleted,
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
      throw new Error(formatError('missing ai subcommand. Use: npx create-quiver ai onboard | prepare-context | run | active-slice | status | resume | inspect | export | specs | slices | models | trace | plan | revise | repair-plan | review-plan | approve | approvals | agent | prompt-slice | execute-slice | execute-plan | doctor | pr'));
    }

    if (args.aiCommand === 'run') {
      runAiLifecycleRun(process.cwd(), {
        command: args.aiRunCommand,
        input: args.aiInput || undefined,
        runId: args.aiRunId || undefined,
        specSlug: args.specSlug || undefined,
      });
      return;
    }

    if (args.aiCommand === 'active-slice') {
      runAiActiveSlice(process.cwd(), {
        command: args.aiSecondaryCommand || 'status',
        dryRun: args.dryRun,
      });
      return;
    }

    if (args.aiCommand === 'status') {
      runAiLifecycleStatus(process.cwd(), {
        runId: args.aiRunId || undefined,
      });
      return;
    }

    if (args.aiCommand === 'resume') {
      runAiLifecycleResume(process.cwd(), {
        runId: args.aiRunId || undefined,
      });
      return;
    }

    if (args.aiCommand === 'inspect') {
      runAiInspect(process.cwd(), {
        includeCompleted: args.includeCompleted,
      });
      return;
    }

    if (args.aiCommand === 'export') {
      runAiExport(process.cwd(), {
        format: args.formatExplicit ? args.format : 'json',
        includeCompleted: args.includeCompleted,
      });
      return;
    }

    if (args.aiCommand === 'specs') {
      runAiSpecsList(process.cwd(), {
        includeCompleted: args.includeCompleted,
        json: args.json,
      });
      return;
    }

    if (args.aiCommand === 'slices') {
      runAiSlicesList(process.cwd(), {
        includeCompleted: args.includeCompleted,
        json: args.json,
      });
      return;
    }

    if (args.aiCommand === 'trace') {
      runAiTraceReport(process.cwd(), {
        includeCompleted: args.includeCompleted,
      });
      return;
    }

    if (args.aiCommand === 'models') {
      runAiModelsList({
        json: args.json,
        provider: args.aiProviderExplicit ? args.aiProvider : undefined,
      });
      return;
    }

    if (args.aiCommand === 'agent') {
      await runAiAgent(process.cwd(), {
        command: args.aiAgentCommand,
        context: args.aiContext || undefined,
        defaultProfile: args.aiDefaultProfile,
        displayName: args.aiDisplayName || undefined,
        id: args.aiProfileId || undefined,
        interactive: args.interactive,
        json: args.json,
        label: args.aiLabel || undefined,
        model: args.aiModel || undefined,
        provider: args.aiProviderExplicit ? args.aiProvider : undefined,
        role: args.aiAgentRole || undefined,
        dryRun: args.dryRun,
      });
      return;
    }

    if (args.aiCommand === 'onboard') {
      await runOnboard(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        plannerProfile: args.aiPlannerProfile || undefined,
        role: args.aiRole,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'prepare-context') {
      await runAiPrepareContext(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        interactive: args.interactive,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        plannerProfile: args.aiPlannerProfile || undefined,
        review: args.review,
        role: args.aiRole,
        runId: args.aiRunId || undefined,
        timeout: args.aiTimeout,
        withPlanner: args.withPlanner,
      });
      return;
    }

    if (args.aiCommand === 'plan') {
      await runAiPlan(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        phase: args.aiPhase,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        plannerProfile: args.aiPlannerProfile || undefined,
        interactive: args.interactive,
        review: args.review,
        role: args.aiRole,
        runId: args.aiRunId || undefined,
        specSlug: args.specSlug || undefined,
        timeout: args.aiTimeout,
        withPlanner: args.withPlanner,
      });
      return;
    }

    if (args.aiCommand === 'review-plan') {
      await runAiReviewPlan(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        reviewerProfile: args.aiReviewerProfile || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'repair-plan') {
      await runAiRepairPlan(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        plannerProfile: args.aiPlannerProfile || undefined,
        role: args.aiRole,
        runId: args.aiRunId || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'revise') {
      await runAiRevise(process.cwd(), {
        context: args.aiContext || undefined,
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        phase: args.aiPhase,
        printPrompt: args.aiPrintPrompt,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        model: args.aiModel || undefined,
        plannerProfile: args.aiPlannerProfile || undefined,
        role: args.aiRole,
        runId: args.aiRunId || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'approve') {
      await runAiApprove(process.cwd(), {
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        phase: args.aiPhase,
        runId: args.aiRunId || undefined,
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
        executorProfile: args.aiExecutorProfile || undefined,
        interactive: args.interactive,
        model: args.aiModel || undefined,
        provider: args.aiProvider,
        providerExplicit: args.aiProviderExplicit,
        role: args.aiRole,
        slice: args.aiSlice || undefined,
        timeout: args.aiTimeout,
      });
      return;
    }

    if (args.aiCommand === 'prompt-slice' || args.aiCommand === 'executor-prompt') {
      runAiPromptSlice(process.cwd(), {
        slice: args.aiSlice || undefined,
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
        executorProfile: args.aiExecutorProfile || undefined,
        interactive: args.interactive,
        json: args.json,
        model: args.aiModel || undefined,
        mode: args.aiExecutionMode,
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
        interactive: args.interactive,
        remote: args.aiRemote || undefined,
        review: args.review,
        sshHostAlias: args.aiSshHostAlias || undefined,
        identityFile: args.aiIdentityFile || undefined,
        title: args.aiTitle || undefined,
      });
      return;
    }

    throw new Error(formatError(`unsupported ai subcommand: ${args.aiCommand}. Supported tasks: onboard, prepare-context, run, active-slice, status, resume, inspect, export, specs, slices, models, trace, plan, revise, repair-plan, review-plan, approve, approvals, agent, prompt-slice, execute-slice, execute-plan, doctor, pr`));
  }

  if (args.mode === 'graph') {
    runGraph(process.cwd(), {
      format: args.format,
      includeCompleted: args.includeCompleted,
      json: args.json,
      level: args.level,
      showConflicts: args.showConflicts,
      specSlug: args.specSlug,
      unicode: args.unicode,
    });
    return;
  }

  if (args.mode === 'next') {
    await runNext(process.cwd(), {
      allReady: args.allReady,
      autoStart: args.autoStart,
      includeCompleted: args.includeCompleted,
      json: args.json,
      specSlug: args.specSlug,
    });
    return;
  }

  if (args.mode === 'evidence') {
    const result = runEvidence(process.cwd(), {
      command: args.evidenceArgs,
      maxOutput: args.evidenceMaxOutput || undefined,
      output: args.evidenceOutput || undefined,
      subcommand: args.evidenceCommand,
    });
    process.exitCode = result.exitCode;
    return;
  }

  if (args.mode === 'demo') {
    const demoTarget = resolveTargetRoot(process.cwd(), args.targetDirExplicit ? args.targetDir : 'quiver-spec-viewer');
    runDemo({
      command: args.demoCommand,
      demo: args.demoName,
      dryRun: args.dryRun,
      targetRoot: demoTarget,
    });
    return;
  }

  if (args.mode === 'migrate') {
    runMigrate(args.targetDir, {
      dryRun: args.dryRun,
      skipInstall: args.skipInstall,
    });
    return;
  }

  if (args.mode === 'doctor') {
    runDoctor(args.targetDir, {
      dryRun: args.dryRun,
      fix: args.doctorFix,
      json: args.json,
      noColor: args.noColor,
      unicode: args.unicode,
    });
    return;
  }

  if (args.mode === 'start-slice') {
    startSlice(args.targetDir, { allowDraft: args.allowDraft });
    return;
  }

  if (args.mode === 'check-slice') {
    checkSliceReadiness(args.targetDir, {
      baseBranch: args.baseBranchExplicit ? args.aiBaseBranch : '',
      gate: args.gate,
      local: args.checkSliceLocal,
      remote: args.aiRemote,
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
      throw new Error(formatError('missing handoff or brief path. Use: npx create-quiver check-handoff specs/<spec-slug>/HANDOFF.md or specs/<spec-slug>/slices/<slice-id>/EXECUTION_BRIEF.md'));
    }
    const resolved = checkHandoff(handoffInput, repoRoot);
    console.log(`PASS: ${resolved.label} validated at ${resolved.relativePath}`);
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
    checkScope(args.targetDir, {
      baseBranch: args.baseBranchExplicit ? args.aiBaseBranch : '',
      remote: args.aiRemote,
      strict: args.strict,
    });
    return;
  }

  if (args.mode === 'refresh-active-slices') {
    const outputPath = refreshActiveSlicesBoard(path.resolve(process.cwd(), '.'));
    console.log(`Active slices refreshed: ${outputPath}`);
    return;
  }

  if (args.mode === 'spec') {
    if (args.specCommand === 'create') {
      await runCreateSpec(process.cwd(), {
        dryRun: args.dryRun,
        input: args.aiInput || undefined,
        interactive: args.interactive,
        methodology: args.methodology || undefined,
        review: args.review,
        specSlug: args.specSlug || undefined,
        withPlanner: args.withPlanner,
      });
      return;
    }

    if (!args.targetDir || args.targetDir === '.') {
      throw new Error(formatError('missing spec directory. Use: npx create-quiver spec <start|status|validate|close> <spec-dir>'));
    }

    if (args.specCommand === 'start') {
      const report = startSpecWorktree(process.cwd(), args.targetDir, {
        dryRun: args.dryRun,
      });
      process.stdout.write(formatSpecStartResult(report));
      return;
    }

    if (args.specCommand === 'status') {
      const report = buildSpecStatus(process.cwd(), args.targetDir);
      process.stdout.write(formatSpecStatus(report));
      return;
    }

    if (args.specCommand === 'validate') {
      runValidateSpec(process.cwd(), args.targetDir, {
        strict: args.strict,
      });
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

    throw new Error(formatError(`unsupported spec subcommand: ${args.specCommand}. Supported tasks: create, start, status, validate, close`));
  }

  const packageRoot = path.resolve(__dirname, '../..');
  const targetDir = resolveTargetRoot(process.cwd(), args.targetDir);
  const projectName = args.projectName || path.basename(targetDir) || 'Quiver Project';
  const initOptions = await resolveInteractiveInitOptions(args, targetDir, projectName);
  if (initOptions.action === 'doctor') {
    runDoctor(targetDir, {
      dryRun: args.dryRun,
      fix: false,
      json: args.json,
      noColor: args.noColor,
      unicode: args.unicode,
    });
    return;
  }
  const initLayout = buildInitLayout(targetDir, {
    compatibilityAlias: !args.explicitInit,
    dryRun: args.dryRun,
    full: initOptions.full,
    includeTemplates: initOptions.includeTemplates,
    legacyScripts: initOptions.legacyScripts,
    minimal: initOptions.minimal,
    projectName: initOptions.projectName,
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
    runInitDocs(targetDir, initOptions.projectName, {
      includeTemplates: initOptions.includeTemplates,
      legacyScripts: initOptions.legacyScripts,
      profile: initLayout.profile,
      templateRoot,
    });

    if (!args.skipInstall) {
      const installResult = installSelfAsDevDep(targetDir, CLI_VERSION);
      if (installResult === 'installed') {
        console.log(`Added create-quiver@${CLI_VERSION} as dev dependency`);
      } else if (installResult === 'failed') {
        console.warn(`Warning: could not install create-quiver automatically. Run: ${formatInstallSelfCommand(targetDir, CLI_VERSION)}`);
      }
    }

    console.log(`Installed Quiver into ${targetDir}`);
    printInitNextSteps(targetDir, initOptions.projectName);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  resolveInteractiveInitOptions,
  runAnalyze,
  runDoctor,
  runFlow,
  runMigrate,
  runPrepare,
  run,
};
