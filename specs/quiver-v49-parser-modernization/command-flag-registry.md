# Command Flag Registry - Quiver v49 Parser Modernization

## Purpose

This registry records the current public CLI surface before parser modernization. It is documentation-only and must be treated as the source input for v49 golden tests, parser decision, adapter migration, and help scoping.

## Sources

- `src/create-quiver/index.js`: command mode detection, manual flag parser, positional validation, root help, dispatch, compatibility warnings.
- `src/create-quiver/lib/cli/ux-flags.js`: post-parse UX flag support matrix and JSON incompatibilities.
- `src/create-quiver/commands/slice.js`: canonical slice subcommands and legacy aliases.
- `src/create-quiver/commands/handoff.js`: canonical handoff subcommands and legacy aliases.
- `docs/reference/commands.md`: documented public command surface.
- `tests/commands/cli-contract.test.js`: existing contract coverage for help, version, `--lang`, aliases, and parser errors.

## Root Parser Behavior

| Behavior | Current owner | Contract |
|---|---|---|
| Root help | `run()` and `printUsage()` in `src/create-quiver/index.js` | `help`, `--help`, and `-h` render grouped help. |
| Top-level version | `run()` in `src/create-quiver/index.js` | Sole `--version` or `-V` prints package semver only. |
| Language extraction | `extractCliLanguageFlag()` before `parseArgs()` | `--lang <en|es>` and `--lang=<value>` are accepted before or after command tokens and removed before regular parsing. |
| Unsupported root command | `parseArgs()` | First non-flag token outside `SUPPORTED_COMMAND_MODES` fails with actionable guidance. |
| `--` separator | `parseArgs()` | Stops regular parsing and stores the remaining tokens in `evidenceArgs`; currently consumed by `evidence run`. |
| Deprecation warnings | `legacyCommandWarning()`, AI alias warning, `run()` | Human warnings go to `stderr` only and are suppressed for `--json`. |
| UX flag validation | `validateUxFlags()` | Runs after parse and before dispatch; `--json` is incompatible with `--interactive` and `--review`. |

## Global And Cross-Cutting Flags

These flags are parsed independently of command mode. Some are valid only for specific commands after parse; v49 help scoping must distinguish that.

| Flag | Value | Current parser field | Owner / valid scope |
|---|---:|---|---|
| `-h`, `--help` | no | `help` | Root help for any mode before dispatch. |
| `--lang` | yes | extracted before `parseArgs()` | Global human-output language override. |
| `--lang=<value>` | inline | extracted before `parseArgs()` | Global human-output language override. |
| `--json` | no | `json` | JSON-capable commands only; must keep stdout machine-readable. |
| `--no-color` | no | `noColor` | Human output where supported, currently version and doctor paths. |
| `-y`, `--yes` | no | `force` | Init and cleanup confirmation flows. |
| `--dry-run` | no | `dryRun` | Preview mode for init, analyze, migrate, prepare, spec, demo, and AI workflows that support it. |
| `--interactive` | no | `interactive` | UX matrix: `init`, `ai prepare-context`, `ai plan`, `spec create`, `ai pr`, `ai execute-slice`, `ai execute-plan`. |
| `--review` | no | `review` | UX matrix: `ai prepare-context`, `ai plan`, `spec create`, `ai pr`. |
| `--with-planner` | no | `withPlanner` | UX matrix: `ai prepare-context`, `ai plan`, `spec create`. |
| `--methodology` | yes | `methodology` | Interactive/planning/spec creation workflows; documented value is `wdd-sdd`. |
| `--spec` | yes | `specSlug` | `plan`, `dashboard`, `graph`, `next`, `ai lifecycle/run`, `ai plan`, `ai execute-plan`. |
| `--include-completed` | no | `includeCompleted` | `dashboard`, `plan`, `graph`, `next`, `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report`. |
| `--provider` | yes | `aiProvider`, `prepareProvider` | `prepare`, provider-backed AI commands, `ai models list`, `ai agent set`. |
| `--model` | yes | `aiModel` | `ai agent set` and provider-backed AI commands. |
| `--context` | yes | `aiContext` | Provider-backed AI commands and AI onboarding. |
| `--input` | yes | `aiInput` | AI planning/lifecycle/revision/PR flows; missing-value message is specialized for `ai revise`. |
| `--timeout` | positive int | `aiTimeout` | Provider-backed AI commands. |
| `--ssh-host-alias` | yes | `aiSshHostAlias` | `prepare`, `ai doctor`, `ai pr`. |
| `--identity-file` | yes | `aiIdentityFile` | `prepare`, `ai doctor`, `ai pr`. |
| `--remote` | yes | `aiRemote` | `check-slice`, `check-scope`, `ai doctor`, `ai pr`. |
| `--base` | yes | `aiBaseBranch`, `baseBranchExplicit` | `check-slice`, `check-scope`, `ai pr`, `spec close`. |
| `--version` | yes when not sole arg | `aiVersion` | `ai approve` draft version option; sole root `--version` remains semver output. |

## Command-Scoped Flags

| Scope | Flags |
|---|---|
| `init` | `--name`, `--project-name`, `-n`, `--dir`, `--target`, `-d`, `--minimal`, `--full`, `--legacy-scripts`, `--include-templates`, `--dry-run`, `--interactive`, `--yes`, `--skip-install`, `--methodology`. |
| `analyze` | `--dir`, `--target`, `-d`, `--dry-run`. |
| `migrate` | `--dir`, `--target`, `-d`, `--dry-run`, `--skip-install`. |
| `doctor` | `--dir`, `--target`, `-d`, `--fix`, `--json`, `--no-color`, `--unicode`. |
| `prepare` | `--dry-run`, `--provider`, `--ssh-host-alias`, `--identity-file`. |
| `status` | `--json`. |
| `dashboard` | `--spec`, `--include-completed`, `--json`, `--details`, `--section`, `--limit`, `--no-color`. |
| `version` | `--json`, `--no-color`. |
| `changelog` | `--json`. |
| `config language show` | `--json`. |
| `config language set` | `--global`. |
| `plan` | `--spec`, `--include-completed`, `--only-ready`, `--json`, `--unicode`. |
| `graph` | `--spec`, `--include-completed`, `--show-conflicts`, `--format`, `--level`, `--json`, `--unicode`. |
| `next` | `--spec`, `--include-completed`, `--all-ready`, `--auto-start`, `--json`. |
| `slice start` / `start-slice` | `--allow-draft`. |
| `slice check` / `check-slice` | `--local`, `--base`, `--remote`, `--gate`, `--strict-overlap`. |
| `slice check-pr` / `check-pr` | no command-specific flags parsed. |
| `slice scope` / `check-scope` | `--base`, `--remote`, `--strict`. |
| `slice cleanup` / `cleanup-slice` | `--close-baseline`, `--discard`, `--dry-run`, `--yes`. |
| `slice refresh` / `refresh-active-slices` | no command-specific flags parsed. |
| `handoff check` / `check-handoff` | no command-specific flags parsed. |
| `handoff create` / `new-handoff` | no command-specific flags parsed. |
| `spec create` | `--dry-run`, `--input`, `--spec`, `--with-planner`, `--interactive`, `--review`, `--methodology`. |
| `spec start` | `--dry-run`. |
| `spec status` | no command-specific flags parsed. |
| `spec validate` | `--strict`. |
| `spec close` | `--dry-run`, `--base`. |
| `evidence run` | `--output`, `--max-output`, `--json`, `--` command separator. |
| `evidence list` | `--json`. |
| `evidence show` | `--json`. |
| `demo spec-viewer` / `demo create spec-viewer` | `--dir`, `--target`, `-d`, `--dry-run`. |
| `ai lifecycle create` / `ai run create` | `--input`, `--run`, `--spec`. |
| `ai lifecycle close` / `ai run close` | `--run`, `--spec`. |
| `ai status` | `--run`. |
| `ai resume` | `--run`. |
| `ai inspect` | `--include-completed`. |
| `ai export` | `--format`, `--include-completed`. |
| `ai specs list` | `--json`, `--include-completed`. |
| `ai slices list` | `--json`, `--include-completed`. |
| `ai trace report` | `--include-completed`. |
| `ai active-slice status` | no command-specific flags parsed. |
| `ai active-slice reconcile` | `--dry-run`. |
| `ai models list` | `--provider`, `--json`. |
| `ai agent set` | `--provider`, `--model`, `--id`, `--display-name`, `--default`, `--context`, `--label`, `--dry-run`, `--interactive`, `--json`. |
| `ai agent list` | `--json`. |
| `ai agent show` | role positional, `--json`. |
| `ai agent doctor` | `--json`. |
| `ai agent repair` | `--dry-run`, `--json`. |
| `ai onboard` | `--context`, `--input`, `--print-prompt`, `--provider`, `--model`, `--planner`, `--role`, `--timeout`, `--dry-run`. |
| `ai prepare-context` | `--context`, `--print-prompt`, `--provider`, `--model`, `--planner`, `--role`, `--run`, `--timeout`, `--dry-run`, `--with-planner`, `--interactive`, `--review`. |
| `ai plan` | `--phase`, `--input`, `--context`, `--print-prompt`, `--provider`, `--model`, `--planner`, `--role`, `--run`, `--spec`, `--timeout`, `--dry-run`, `--with-planner`, `--interactive`, `--review`. |
| `ai revise` | `--phase`, `--input`, `--context`, `--print-prompt`, `--provider`, `--model`, `--planner`, `--role`, `--run`, `--timeout`, `--dry-run`. |
| `ai review-plan` | `--input`, `--context`, `--print-prompt`, `--provider`, `--model`, `--reviewer`, `--timeout`, `--dry-run`. |
| `ai repair-plan` | `--input`, `--context`, `--print-prompt`, `--provider`, `--model`, `--planner`, `--role`, `--run`, `--timeout`, `--dry-run`. |
| `ai approve` | `--phase`, `--version`, `--run`, `--input`, `--dry-run`. |
| `ai approvals` / `ai approval-status` | no command-specific flags parsed. |
| `ai prompt-slice` / `ai executor-prompt` | `--slice`. |
| `ai execute-slice` | `--slice`, `--provider`, `--model`, `--executor`, `--role`, `--context`, `--timeout`, `--dry-run`, `--commit`, `--allow-dirty`, `--interactive`. |
| `ai execute-plan` | `--spec`, `--provider`, `--model`, `--executor`, `--role`, `--context`, `--timeout`, `--dry-run`, `--commit`, `--allow-dirty`, `--execute`, `--mode`, `--json`, `--interactive`. |
| `ai doctor` | `--dry-run`, `--remote`, `--ssh-host-alias`, `--identity-file`. |
| `ai pr` | `--input`, `--base`, `--remote`, `--ssh-host-alias`, `--identity-file`, `--title`, `--dry-run`, `--create`, `--interactive`, `--review`. |

## Public Command Inventory

| Command | Aliases / deprecated forms | Positionals | Owner evidence |
|---|---|---|---|
| `init` | default mode; root `--name` compatibility init | optional `<project-name>` and optional `<target-dir>` | `SUPPORTED_COMMAND_MODES`, `parseArgs()`, `run()` dispatch, root help. |
| `analyze` | `--analyze` shortcut | optional target dir through fallback positional or `--dir` | `SUPPORTED_COMMAND_MODES`, root shortcut detection, `runAnalyze()` dispatch. |
| `migrate` | `--migrate` shortcut | optional target dir through fallback positional or `--dir` | `SUPPORTED_COMMAND_MODES`, root shortcut detection, `runMigrate()` dispatch. |
| `doctor` | `--doctor` shortcut | optional target dir through fallback positional or `--dir` | `SUPPORTED_COMMAND_MODES`, root shortcut detection, `runDoctor()` dispatch. |
| `flow` | none | none | `SUPPORTED_COMMAND_MODES`, positional rejection, `runFlow()` dispatch. |
| `status` | none | optional target dir through generic fallback is parseable but dispatch ignores it; docs advertise no positional | `SUPPORTED_COMMAND_MODES`, `runStatus()` dispatch, docs. |
| `dashboard` | none | none; use `--spec` | `SUPPORTED_COMMAND_MODES`, positional rejection, `runDashboard()` dispatch. |
| `version` | root `--version`, root `-V` are separate semver-only modes | none | root version special case, version mode parser branch, `collectVersionReport()` dispatch. |
| `changelog` | none | optional target dir through generic fallback is parseable but dispatch ignores it; docs advertise no positional | `SUPPORTED_COMMAND_MODES`, `runChangelog()` dispatch, docs. |
| `config language show` | none | section `language`, command `show`; no value allowed | `SUPPORTED_CONFIG_SECTIONS`, `SUPPORTED_CONFIG_LANGUAGE_COMMANDS`, `runConfig()` dispatch. |
| `config language set` | none | section `language`, command `set`, required `<en\|es>` value | `SUPPORTED_CONFIG_SECTIONS`, `SUPPORTED_CONFIG_LANGUAGE_COMMANDS`, `runConfig()` dispatch. |
| `prepare` | none | none | `SUPPORTED_COMMAND_MODES`, positional rejection, `runPrepare()` dispatch. |
| `plan` | none | none; use `--spec` | `SUPPORTED_COMMAND_MODES`, positional rejection, `runPlan()` dispatch. |
| `graph` | none | optional target dir through generic fallback is parseable but dispatch ignores it; docs advertise no positional | `SUPPORTED_COMMAND_MODES`, `runGraph()` dispatch, docs. |
| `next` | none | optional target dir through generic fallback is parseable but dispatch ignores it; docs advertise no positional | `SUPPORTED_COMMAND_MODES`, `runNext()` dispatch, docs. |
| `slice start` | `start-slice` deprecated | required `<slice.json>` by downstream readiness/lifecycle behavior | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, `startSlice()` dispatch. |
| `slice check` | `check-slice` deprecated | required `<slice.json>` | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, `checkSliceReadiness()` dispatch. |
| `slice check-pr` | `check-pr` deprecated | required `<slice.json>` | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, `checkPrReadiness()` dispatch. |
| `slice scope` | `check-scope` deprecated | required `<slice.json>` | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, `checkScope()` dispatch. |
| `slice cleanup` | `cleanup-slice` deprecated | required `<slice.json>` | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, `cleanupSlice()` dispatch. |
| `slice refresh` | `refresh-active-slices` deprecated | none | `SLICE_COMMAND_MODE`, `LEGACY_SLICE_COMMANDS`, positional rejection for legacy mode, `refreshActiveSlicesBoard()` dispatch. |
| `handoff check` | `check-handoff` deprecated; root `--check-handoff` shortcut | required `<handoff-or-brief.md>` | `HANDOFF_COMMAND_MODE`, `LEGACY_HANDOFF_COMMANDS`, shortcut detection, `checkHandoff()` dispatch. |
| `handoff create` | `new-handoff` deprecated; root `--new-handoff` shortcut | required `<spec-slug>` | `HANDOFF_COMMAND_MODE`, `LEGACY_HANDOFF_COMMANDS`, shortcut detection, `scaffoldHandoff()` dispatch. |
| `spec create` | none | none; use `--input` or `--spec` | `SUPPORTED_SPEC_COMMANDS`, `spec create` parser branch, `runCreateSpec()` dispatch. |
| `spec start` | none | required `<spec-dir>` | `SUPPORTED_SPEC_COMMANDS`, spec parser branch, `startSpecWorktree()` dispatch. |
| `spec status` | none | required `<spec-dir>` | `SUPPORTED_SPEC_COMMANDS`, spec parser branch, `buildSpecStatus()` dispatch. |
| `spec validate` | none | required `<spec-dir>` | `SUPPORTED_SPEC_COMMANDS`, spec parser branch, `runValidateSpec()` dispatch. |
| `spec close` | none | required `<spec-dir>` | `SUPPORTED_SPEC_COMMANDS`, spec parser branch, `closeSpecWorktree()` dispatch. |
| `evidence run` | none | no positionals before `--`; command tokens after `--` required downstream | evidence parser branch, `runEvidence()` dispatch. |
| `evidence list` | none | none | evidence parser branch, `runEvidence()` dispatch. |
| `evidence show` | none | required `<path.md>` | evidence parser branch, `runEvidence()` dispatch. |
| `demo spec-viewer` | simplified alias for `demo create spec-viewer` | no target positional; use `--dir` | demo parser branch maps to `create/spec-viewer`, `runDemo()` dispatch. |
| `demo create spec-viewer` | canonical form | no target positional; use `--dir` | `SUPPORTED_DEMO_COMMANDS`, demo parser branch, `runDemo()` dispatch. |
| `ai lifecycle create` | `ai run create` compatibility alias | subcommand `create`; input via `--input` | `SUPPORTED_AI_COMMANDS`, AI run/lifecycle parser branch, `runAiLifecycleRun()` dispatch. |
| `ai lifecycle close` | `ai run close` compatibility alias | subcommand `close`; run id via `--run` | `SUPPORTED_AI_COMMANDS`, AI run/lifecycle parser branch, `runAiLifecycleRun()` dispatch. |
| `ai status` | none | none | AI parser branch, `runAiLifecycleStatus()` dispatch. |
| `ai resume` | none | none | AI parser branch, `runAiLifecycleResume()` dispatch. |
| `ai inspect` | none | none | AI parser branch, `runAiInspect()` dispatch. |
| `ai export` | none | none | AI parser branch, `runAiExport()` dispatch. |
| `ai specs list` | none | required secondary `list` when provided; default downstream list behavior when omitted | AI collection parser branch, `runAiSpecsList()` dispatch. |
| `ai slices list` | none | required secondary `list` when provided; default downstream list behavior when omitted | AI collection parser branch, `runAiSlicesList()` dispatch. |
| `ai trace report` | none | required secondary `report` when provided; default downstream report behavior when omitted | AI trace parser branch, `runAiTraceReport()` dispatch. |
| `ai active-slice status` | none | optional secondary defaults to `status` | AI active-slice parser branch, `runAiActiveSlice()` dispatch. |
| `ai active-slice reconcile` | none | secondary `reconcile` | AI active-slice parser branch, `runAiActiveSlice()` dispatch. |
| `ai models list` | none | required secondary `list` when provided; default downstream list behavior when omitted | AI collection parser branch, `runAiModelsList()` dispatch. |
| `ai agent set` | none | subcommand `set`, optional role positional | AI agent parser branch, `runAiAgent()` dispatch. |
| `ai agent list` | none | subcommand `list` | AI agent parser branch, `runAiAgent()` dispatch. |
| `ai agent show` | none | subcommand `show`, optional role positional | AI agent parser branch, `runAiAgent()` dispatch. |
| `ai agent doctor` | none | subcommand `doctor` | AI agent parser branch, `runAiAgent()` dispatch. |
| `ai agent repair` | none | subcommand `repair` | AI agent parser branch, `runAiAgent()` dispatch. |
| `ai onboard` | none | none | AI parser branch, `runOnboard()` dispatch. |
| `ai prepare-context` | none | none | AI parser branch, `runAiPrepareContext()` dispatch. |
| `ai plan` | none | none | AI parser branch, `runAiPlan()` dispatch. |
| `ai revise` | none | none | AI parser branch, `runAiRevise()` dispatch. |
| `ai review-plan` | none | none | AI parser branch, `runAiReviewPlan()` dispatch. |
| `ai repair-plan` | none | none | AI parser branch, `runAiRepairPlan()` dispatch. |
| `ai approve` | none | none | AI parser branch, `runAiApprove()` dispatch. |
| `ai approvals` | `ai approval-status` deprecated | none | AI parser alias warning, `runAiApprovalStatus()` dispatch. |
| `ai prompt-slice` | `ai executor-prompt` deprecated | none; slice path via `--slice` | AI parser alias warning, `runAiPromptSlice()` dispatch. |
| `ai execute-slice` | none | none; slice path via `--slice` | AI parser branch, `runAiExecuteSlice()` dispatch. |
| `ai execute-plan` | none | none | AI parser branch, `runAiExecutePlan()` dispatch. |
| `ai doctor` | none | none | AI parser branch, `runAiDoctor()` dispatch. |
| `ai pr` | none | none | AI parser branch, `runAiPr()` dispatch. |

## Aliases And Deprecations

| Deprecated / compatibility form | Canonical form | Warning behavior |
|---|---|---|
| `start-slice` | `slice start` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `check-slice` | `slice check` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `check-pr` | `slice check-pr` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `check-scope` | `slice scope` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `cleanup-slice` | `slice cleanup` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `refresh-active-slices` | `slice refresh` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `check-handoff` | `handoff check` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `new-handoff` | `handoff create` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `ai run create\|close` | `ai lifecycle create\|close` | Compatibility alias; no deprecation warning currently recorded. |
| `ai approval-status` | `ai approvals` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `ai executor-prompt` | `ai prompt-slice` | Human `stderr` deprecation warning; suppressed for JSON flows. |
| `demo spec-viewer` | `demo create spec-viewer` | Compatibility simplification; no deprecation warning currently recorded. |
| Root `--name <project>` | `init --name <project>` | Compatibility bootstrap form; no deprecation warning currently recorded. |
| `--analyze`, `--migrate`, `--doctor`, `--check-handoff`, `--new-handoff` | matching command forms | Compatibility shortcuts; no deprecation warning currently recorded for shortcut flags. |

## Parser Ambiguities To Preserve Or Test Before Migration

- `--doctor` is parsed as a command shortcut before a later `--doctor <profile>` branch can assign `aiDoctorProfile`. Golden tests must pin the current behavior before any ownership cleanup.
- `status`, `changelog`, `graph`, and `next` can accept a generic fallback positional in `parseArgs()`, but dispatch and docs treat them as no-positional commands. Golden tests should decide whether this is intentional compatibility or an existing parser leak before migration.
- Collection commands `ai specs`, `ai slices`, and `ai models` default downstream to list-like behavior when no secondary subcommand is passed, while help documents `list`. Golden tests should capture both documented and current fallback behavior.
- Global-looking flags such as `--format`, `--provider`, `--model`, `--base`, and `--input` are accepted by the manual parser before command-specific validation. Help scoping should annotate ownership without changing parse behavior until the migration slice.
