# AI Guide for Quiver

Use this guide when initializing a new project with Quiver or when explaining the workflow to another agent.

The first AI job in a generated project is context preparation, not product implementation.

Important: slice numbering resets inside each spec. `slice-00` is the mandatory documentary foundation for a spec; `slice-01` is the first implementation slice, not a global repo counter.
The canonical installer entrypoint is `npx create-quiver` run from the target project root.
Do not recommend global installation; use `npx` or a project-local devDependency when the team needs a pinned version.
The package also exposes `quiver` as a binary alias to the same CLI. Treat it as a local installed shortcut, not as a replacement for the bootstrap command `npx create-quiver`.
The root `README.md` is the public landing/onboarding page: keep it concise, Spanish-first, AI-first, and focused on what Quiver is, what problem it solves, the WDD + SDD flow, core commands, and links to deeper guides. Long step-by-step instructions live in `docs/getting-started/`, `docs/workflows/`, and `docs/reference/commands.md`; do not duplicate every procedural detail in the root README.
The post-init contract is validated with `npx create-quiver doctor` from the project root. Use `npx create-quiver doctor --fix --dry-run` to preview safe non-destructive repairs, then `npx create-quiver doctor --fix` only after reviewing the plan.
`doctor` must render the human hierarchy `Quiver Doctor` -> `Checks` -> `Suggested fixes`, and `doctor --json` must emit the same diagnostics as stable parseable JSON without colors, prompts, or human prose.
`init --interactive` and `spec create --interactive` are explicit human-only wrappers. They must not run in CI/no-TTY/JSON, must show only the real methodology `WDD + SDD` (`--methodology wdd-sdd`), and must summarize choices before persistent writes.
If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate` before `analyze` from the project root.
If the project was never initialized by Quiver, do not use `migrate` as bootstrap; run `npx create-quiver init --name "Project Name"` first.
Use `npx create-quiver evidence run -- <command>` to capture validation evidence with command, exit code, duration, truncated output, and best-effort redaction. The safe default output is `.quiver/evidence/`; use `--output <file>` when a slice needs a specific evidence artifact.
Use `npx create-quiver demo create spec-viewer --dry-run` to inspect the optional Quiver Spec Viewer demo scaffold, then add `--dir <target>` for a real run. The demo is not part of default init and must remain small, static, dependency-light, and non-destructive.
The v20, v21, v22, and v23 specs are completed. `specs/quiver-v23-guided-flow-productization/` productized the manual planner/executor prompt workflow into guided Quiver commands, profiles, compact prompts, safe approvals, executor prompts, delegated execution modes, and release readiness evidence.
The v24 spec is implemented under `specs/quiver-v24-dx-onboarding-hardening/`; it captures DX hardening found while dogfooding Quiver with Quiver Spec Viewer, including init hygiene, CLI ambiguity, local slice validation, analyzer quality, AI context preparation, evidence capture, and demo scaffolding. Do not claim a package release until npm publication actually happens.
The v25 spec is implemented under `specs/quiver-v25-ai-first-lifecycle-orchestrator/` and shipped in `create-quiver@0.12.0`; it covers safe AI onboarding docs, strict run state, phase locks, agent adapters, approval gates, spec/slice generation, execution planning, controlled slice execution, worktree/PR lifecycle, validation hardening, export, and migration.
The v26 hotfix spec is implemented under `specs/quiver-v26-0121-smoke-hardening/` and shipped in `create-quiver@0.12.1`; it covers smoke hardening for CLI help/version output, generated doc links, AI approval/review guidance, local validation, slice brief validation, demo readiness, scoped plan/graph performance, and release smoke coverage.
The v27 spec is implemented under `specs/quiver-v27-reliability-ai-workflow-hardening/` and shipped in `create-quiver@0.13.0`; it captures Pixel Quiver dogfooding findings (`QP-001` to `QP-019`, `QIS-001` to `QIS-022`) and includes shared state resolution, canonical statuses, schema v2 exports, structured spec creation, AI artifact cleanup, worktree locks, validation gates, context diagnostics, cross-platform DX, fixtures, smoke suites, and package/tarball release readiness.
The v28 spec is implemented under `specs/quiver-v28-pixel-quiver-feedback-reconciliation/` and shipped in `create-quiver@0.14.0`; it captures the Pixel Quiver follow-up reconciliation with active-slice reconciliation, stale `ai inspect` recovery, structured review closure, stricter technical-plan approval, spec/worktree validation hardening, agent-safe commands, GitHub auth/alias guidance, and package-readiness evidence.
The v29 spec is implemented under `specs/quiver-v29-planner-prepare-context-cli-ux/` and shipped in `create-quiver@0.14.1`; it adds shared CLI UX primitives, Quiver palette usage, guarded UX flags, planner-assisted `ai prepare-context`, and review/interactive adoption for selected planner/spec/PR commands.
The v30 spec is implemented under `specs/quiver-v30-interactive-cli-ux-agent-selection/` and is release-ready pending package publication; it adds production-grade interactive CLI UX with visible IA progress, Quiver-branded output, configured Planner/Executor/Reviewer/Doctor selectors, real provider model-selection contracts, Doctor human/JSON parity, guided init/spec-create selectors, and cross-platform release readiness.
The v31 spec is in progress under `specs/quiver-v31-ai-model-catalog-agent-selection/`; slice-00 through slice-02 are completed. Current implemented scope includes the local AI model catalog, alias normalization, and guided provider/model selection for `ai agent set <role>`. Remaining planned scope includes `ai models list`, `ai agent doctor`, `ai agent repair --dry-run`, shared live-command model preflight, and clearer provider errors for invalid model ids.
Guided AI workflow behavior is available: prepare, approvals, production-readiness plan review, spec worktrees, executor commits, execution waves, PR creation, spec close, and package safety.
Generated projects also get `quiver:*` npm scripts that call the Node CLI directly; prefer those for repeatable project workflows, including `quiver:flow` for the read-only guided entrypoint, `quiver:plan` for sequential planning, `quiver:graph` for parallel-level inspection, `quiver:next` for the next ready slice, `quiver:evidence` for local command evidence, `quiver:spec:create` for real spec generation, `quiver:spec:validate` for full spec validation, and the AI family `quiver:ai:agent`, `quiver:ai:inspect`, `quiver:ai:export`, `quiver:ai:specs`, `quiver:ai:slices`, `quiver:ai:trace`, `quiver:ai:onboard`, `quiver:ai:prepare-context`, `quiver:ai:plan`, `quiver:ai:review-plan`, `quiver:ai:approve`, `quiver:ai:prompt-slice`, `quiver:ai:execute-slice`, `quiver:ai:execute-plan`, `quiver:ai:pr`, and `quiver:ai:doctor`. Use `quiver:graph --format mermaid` for PR-ready Markdown or `quiver:graph --format dot` for Graphviz source.
`quiver:ai:execute-plan` supports `--mode manual` for paste-ready executor prompts and `--mode delegated` for temporary worktrees on parallel-ready waves; unsafe waves fall back to sequential execution.
Agent profiles live in `.quiver/agents/profiles.json`; they store role, provider, model label, context label, display label, profile id, and default profile only. Do not store API keys, tokens, or credentials there.
Provider/model selection must be honest: dry-runs can preview a selected model without provider auth, but live IA execution must pass the selected model through the provider adapter or fail with actionable guidance instead of silently ignoring it.
Planner-oriented live IA commands must show visible TTY progress with the selected profile/model name, completed preparation checks, and a provider-running spinner. `--dry-run`, `--print-prompt`, CI, JSON, and non-TTY output must remain clean and automation-safe.
Executor and PR live commands follow the same standard: show truthful TTY progress for slice execution, validation, commits, GitHub preflight, and PR creation while preserving scope gates, provider errors, `gh` errors, and clean machine output.
Planner drafts are versioned under `.quiver/approvals/<phase>/drafts/`; review the technical-plan draft with `npx create-quiver ai review-plan --dry-run` before approving it, then approve a concrete version with `npx create-quiver ai approve --phase <phase> --version <n>` when reviewing iterations.
`ai review-plan` stores structured closure metadata under `.quiver/approvals/plan-review/meta.json`: `approval_recommendation` is `approve`, `approve-with-risk`, or `revise`; required fixes block technical-plan approval, while optional hardening does not.
AI lifecycle runs are persisted under `.quiver/runs/<run-id>/`; use `npx create-quiver ai run create --input <requirements.md>` to start one explicitly, `npx create-quiver ai status` to inspect it, `npx create-quiver ai resume` to continue from the last valid phase without relying on chat memory, and `npx create-quiver ai export --format json|markdown` when another agent, PR, or dashboard needs the current specs/slices/runs state.
Use `npx create-quiver ai active-slice reconcile --dry-run` when `docs/ai/ACTIVE_SLICE.md`, `ACTIVE_SLICES.md`, worktrees, or `ai inspect` appear out of sync. The command is dry-run-first and reports preserve, close, replace, or blocked decisions without writing files.
When generating commands for another AI agent, prefer non-interactive package-pinned examples such as `npx --yes create-quiver@<version> ai prompt-slice --slice <slice.json> --dry-run`.
Maintain release notes and package publishing with `scripts/release-quiver.sh`.
Use `npm run smoke:doctor-fixtures` after changing doctor, preflight, validation, actionable errors, or fixture coverage.
The primary generated project context for agents is `docs/AI_CONTEXT.md`.
The project map is the single source of truth for stack, package manager, commands, and file hints: `docs/PROJECT_MAP.md`.
The raw analyzer output is internal machinery at `.quiver/scans/PROJECT_SCAN.json`; read it only when the visible map is not enough.
`npx create-quiver analyze --dry-run` must remain read-only and only preview the scan/project-map/context writes. `npx create-quiver flow` reports the context source/freshness and the package-manager-aware generated script command so agents can see whether the project map is current, stale, partial, legacy, invalid, or missing.
`npx create-quiver ai prepare-context --dry-run` remains the deterministic default and must not execute provider CLIs. `npx create-quiver ai prepare-context --with-planner --dry-run` previews planner-assisted context preparation. `--with-planner --print-prompt` prints the exact prompt without provider auth; live planner writes should use `--review` and/or `--interactive` when the human wants review before docs-only writes.
`npx create-quiver ai agent set <role> --provider <provider> --model "<label>" --dry-run` must preview `.quiver/agents/profiles.json` changes without writing. Use it before saving planner/executor/reviewer/doctor profiles.
GitHub PR diagnostics must stay cross-platform: auth failures should point to likely account, scope, and SSH alias issues; path examples with spaces must be copy-safe for macOS/Linux, Windows PowerShell, Git Bash, and WSL.
CLI UX standard lives in `docs/CLI_UX_GUIDE.md`. Supported Quiver colors are `#86C8F2`, `#6BADEB`, `#7F9EE8`, `#9B82E6`, and `#D56AB0`; output must respect `--no-color`, `NO_COLOR`, CI, and no-TTY environments.
UX flags are intentionally limited: `ai prepare-context`, `ai plan`, and `spec create` support `--with-planner`, `--interactive`, and `--review`; `ai pr` supports `--interactive` and `--review` but rejects `--with-planner`; read-only commands such as `flow`, `next`, `graph`, `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, and `ai trace report` reject these UX flags. `--json` must reject `--interactive` and `--review` before writing human output.
The universal router for generated projects is `AGENTS.md`; read it before `docs/AI_CONTEXT.md` and `docs/AI_ONBOARDING_PROMPT.md`.
Generated projects also get `docs/DECISIONS.md`; use it for durable choices that should not be re-litigated.
If a generated project has been analyzed, the exact agent handoff prompt is `docs/AI_ONBOARDING_PROMPT.md`.
Keep README copy-paste prompts short; the detailed onboarding contract lives in `docs/AI_ONBOARDING_PROMPT.md` generated from `docs/AI_ONBOARDING_PROMPT.md.template`.
If a new bounded transfer is needed, scaffold `specs/<project-slug>/HANDOFF.md` with `npx create-quiver new-handoff <spec-slug>` and validate it with `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md`.
Use `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md` to validate a transferred handoff before execution.
Use `npx create-quiver check-slice --local <slice.json>` for structural validation in a new repo without remote/base branches; run normal `check-slice` before PR readiness so base/remote checks still happen.
During onboarding, after reading `ROADMAP.md`, also read `BACKLOG.md` in the repository root: it tracks emerging patterns that are not yet scoped as specs. Before proposing a new spec, confirm the idea is not already parked or emerging there.

## Token-Efficient Reading Rules

Use the smallest context that still answers the current task.

- **Onboarding:** start from `README.md`, `AGENTS.md` when present, `docs/PROJECT_MAP.md`, `.quiver/scans/PROJECT_SCAN.json` when it exists, `docs/AI_CONTEXT.md`, and `docs/AI_ONBOARDING_PROMPT.md` before opening source files.
- **Onboarding router:** start from `README.md` and `AGENTS.md` first, then the onboarding files above.
- **Implementation:** start from `docs/ai/ACTIVE_SLICE.md` when it exists; otherwise start from `specs/<project-slug>/slices/<slice-id>/slice.json`, then read only the declared files, nearby tests, and directly related source.
- **Handoff:** start from `specs/<project-slug>/HANDOFF.md` when the work was explicitly transferred through a handoff artifact.
- **Handoff scaffold:** if no handoff exists yet and the work needs one, use `npx create-quiver new-handoff <spec-slug>` first.
- **Review:** start from `git diff` and the slice scope before opening full files.
- **Debug:** start from the command, exit code, first relevant error, stacktrace, and the nearest changed code before reading long logs.

Prefer maps, metadata, diffs, and summaries over full file reads when they are enough. Treat front-matter as a skim-first signal: if the header is enough, do not open the body.

## Core Rules

- Do not treat `docs-template/` as part of the default project contract. It is legacy or exported only when explicitly requested.
- Use `npx create-quiver init` or `npx create-quiver --name "Project Name"` instead of copying templates by hand.
- Treat `.quiver/` as Quiver internal machinery and `docs/` as the visible project-specific contract.
- Not every project needs every optional file.
- The AI context pack lives in `docs/AI_CONTEXT.md`; `docs/CONTEXTO.md` is the broader project overview; `docs/PROJECT_MAP.md` owns stack and command facts.
- The onboarding prompt lives in `docs/AI_ONBOARDING_PROMPT.md` and should reference `docs/PROJECT_MAP.md`; raw scan details live in `.quiver/scans/PROJECT_SCAN.json`.
- `specs/<project-slug>/HANDOFF.md` is reserved for exceptional context transfers between agents or phases.
- Initial onboarding should complete context docs and report assumptions before any feature work starts.
- The normal workflow runs from the project root without `--dir`; use `--dir` only when targeting another directory explicitly.
- The cross-platform contract targets native macOS, Linux, and Windows users through the Node CLI (`npx create-quiver ...`) and generated `quiver:*` npm scripts. Bash wrappers are legacy or optional compatibility, not the primary path. Keep root README examples clear about adapting SSH identity paths on Windows PowerShell, Git Bash, WSL, macOS, and Linux.
- The support contract lives in `docs/SUPPORT_MATRIX.md` and `docs/TROUBLESHOOTING.md`.
- Generated project npm scripts should prefer `quiver:*` names such as `quiver:analyze`, `quiver:flow`, `quiver:plan`, `quiver:graph`, `quiver:next`, `quiver:doctor`, `quiver:evidence`, `quiver:ai:agent`, `quiver:ai:inspect`, `quiver:ai:export`, `quiver:ai:specs`, `quiver:ai:slices`, `quiver:ai:trace`, `quiver:ai:prepare-context`, `quiver:ai:plan`, `quiver:ai:review-plan`, `quiver:ai:approve`, `quiver:ai:prompt-slice`, `quiver:ai:execute-slice`, `quiver:ai:execute-plan`, `quiver:spec:create`, `quiver:spec:start`, `quiver:spec:status`, `quiver:spec:validate`, `quiver:spec:close`, `quiver:start-slice`, `quiver:check-slice`, and `quiver:check-pr`.
- Optional demos are created with `npx create-quiver demo create spec-viewer`; do not add demo output to the package or default init flow.
- `quiver:graph` defaults to the tree view; choose `--format mermaid` or `--format dot` when you need exportable graph artifacts.
- `quiver:next` prints the next ready slice and can auto-start it behind a confirmation prompt.
- `quiver:next --all-ready` prints the whole ready level when you want to inspect every actionable slice at once.
- Use `--include-completed` with `plan`, `graph`, or `next` only for audit/demo history; default output remains pending/actionable work.

## Initialization Flow

1. From the target project root, run the default AI-first initializer:

```bash
npx create-quiver init --name "Project Name"
npx create-quiver flow
```

The compatibility alias is still valid:

```bash
npx create-quiver --name "Project Name"
```

2. Analyze and validate the project contract:

```bash
npx create-quiver analyze
npx create-quiver doctor
```

3. Tell the user to review or complete:
  - `docs/AI_CONTEXT.md`
  - `docs/AI_ONBOARDING_PROMPT.md`
  - `docs/CONTEXTO.md`
  - `docs/STATUS.md`
  - `docs/PROJECT_MAP.md`

## What Init Creates

Default init creates the visible AI-first contract and Quiver internal state:

- `AGENTS.md`
- `docs/`
- `docs/ai/`
- `docs/AI_CONTEXT.md`
- `docs/AI_ONBOARDING_PROMPT.md`
- `docs/SUPPORT_MATRIX.md`
- `docs/TROUBLESHOOTING.md`
- `.gitignore`
- `.quiver/config.json`
- `.quiver/state.json`
- `.quiver/.gitignore`
- a merged or copied `package.json` with `quiver:*` scripts

Default init does not create `docs-template/`, `tools/scripts/`, or a placeholder spec.

Optional compatibility profiles:

- `--minimal` creates only the essential onboarding contract.
- `--full` preserves the broad legacy-compatible layout, including placeholder spec assets and OSS/community files.
- `--legacy-scripts` adds Bash wrappers under `tools/scripts/`.
- `--include-templates` exports packaged templates under `.quiver/templates/`, not root `docs-template/`.

Init preserves existing target files and reports skipped copies instead of overwriting them.

## Required Follow-Up

After initialization, the user should:

1. Run `npx create-quiver flow` when unsure about the next safe command
2. Run `npx create-quiver ai prepare-context --dry-run` to preview deterministic onboarding docs, diffs, assumptions, risks, contradictions, and omitted paths without provider execution
3. If the user wants planner-generated context, run `npx create-quiver ai prepare-context --with-planner --dry-run`; use `--print-prompt` for external planner execution or `--with-planner --review --interactive` before live docs-only writes
4. After review, run `npx create-quiver ai prepare-context` for deterministic writes or `npx create-quiver ai prepare-context --with-planner --review --interactive` for planner-assisted writes; Quiver snapshots touched docs under `.quiver/runs/<run-id>/snapshots/` and preserves human-authored content
5. Run `npx create-quiver analyze --dry-run` when unsure what analysis would update, then run `npx create-quiver analyze` if `docs/PROJECT_MAP.md` or `.quiver/scans/PROJECT_SCAN.json` is missing or stale
6. If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate`
7. If the project was never initialized by Quiver, run `npx create-quiver init --name "Project Name"` instead of `migrate`
8. Ask the AI agent to execute `docs/AI_ONBOARDING_PROMPT.md`
9. Review context docs before creating the first implementation slice
10. Open and merge the documentation PR that establishes the workflow files
11. Preview reusable provider choices with `npx create-quiver ai agent set <role> --provider <provider> --model "<label>" --dry-run`, then save planner/executor/doctor profiles without `--dry-run` after review
12. Use `npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run`; use `--print-prompt` when you need the exact prompt without provider auth and `--review --interactive` when the human should edit or confirm before saving
13. If the human asks for changes, create a new draft with `npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run`; after human approval, save the selected current draft with `npx create-quiver ai approve --phase acceptance --version <n>`
14. Use `npx create-quiver ai plan --phase technical-plan --dry-run`
15. Review the technical plan with `npx create-quiver ai review-plan --dry-run`, inspect exact prompt with `--print-prompt` if needed, then run it without `--dry-run` when ready
16. After human approval, save the reviewed plan version with `npx create-quiver ai approve --phase technical-plan --version <n>`
17. Use `npx create-quiver spec create --dry-run` to preview the real spec, slices, handoffs, execution plan, and PR body; use `--review --interactive` when the human should inspect the package before writing
18. Run `npx create-quiver spec start specs/<spec-slug> --dry-run` to inspect the planned worktree, then run without `--dry-run` to create or reuse it
19. Run `npx create-quiver plan` or `npm run quiver:plan`
20. Run `npx create-quiver next` or `npm run quiver:next`
21. Run `npx create-quiver ai execute-plan --dry-run --commit --mode manual` to inspect prompts, or `npx create-quiver ai execute-plan --dry-run --commit --mode delegated` to inspect delegated execution waves
22. For manual assignment, print a minimal executor prompt with `npx create-quiver ai prompt-slice --slice <slice.json> --dry-run`
23. Execute one slice with `npx create-quiver ai execute-slice --slice <slice.json> --commit` or execute delegated waves with `npx create-quiver ai execute-plan --execute --commit --mode delegated`; single-slice execution must run from the declared slice branch, validates `allowed_write_paths`/`files`, redacts captured logs, and updates closure, evidence, command log, status, and `slice.json`
24. Keep one commit per slice
25. Open one PR per spec with `npx create-quiver ai pr --dry-run --input specs/<spec-slug>/pr.md --ssh-host-alias <alias> ...`, optionally use `--review`, then `--create --interactive` only after review; PR creation is blocked while spec slices remain open
26. After merge, close the worktree with `npx create-quiver spec close specs/<spec-slug>`
27. Validate the spec with `npx create-quiver spec validate specs/<spec-slug>` or `npm run quiver:spec:validate -- specs/<spec-slug>`
28. Validate the slice and the final PR with the workflow gates

Bootstrap note: `start-slice` should resolve paths canonically, prefer a local `develop` or `main` base branch before reaching for `origin`, and reject `draft` slices unless `--allow-draft` is passed intentionally.
Release note: `scripts/package-quiver.sh` runs package safety against the npm tarball and must fail if local AI state, env files, npm credentials, or worktree state would be published.

## Optional Files

- `docs/MOCK_DATA_GUIDE.md` if the project uses mock data
- `docs/UI_STANDARDS.md` if the project has UI
- `docs/GITFLOW_PR_GUIDE.md` if the team wants a stricter branch workflow
- `docs/SUPPORT_MATRIX.md` and `docs/TROUBLESHOOTING.md` for first-run support
- `docs/ai/LESSONS.md` after each slice
- `.quiver/templates/` only when the team explicitly exports packaged templates

## Good Defaults

- Simple project: `INDEX`, `CONTEXTO`, `WORKFLOW`, and the AI files
- Medium project: add `STATUS.md`
- Complex project: use the full documentation set

## Reminder

If a file does not exist in the generated project, do not invent it. Either create it from the template or tell the user what is missing.
