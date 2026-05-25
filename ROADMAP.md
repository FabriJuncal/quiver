# Roadmap

## v0.1

- Publish the OSS foundation
- Make the quick start executable
- Ship one complete example

## v0.2

- Add `npx create-quiver`
- Add a docs site
- Add JSON Schema for slices

## v0.3

- Expand automation and testing
- Add richer templates and examples
- Improve release workflows

## v0.4 (shipped 2026-04-21)

- `create-quiver` CLI installer surface
- Post-init `doctor` validation mode
- Release helper and packaged-installer smoke checks

## v0.5 (shipped)

- Existing project migration flow (`create-quiver migrate`)
- Onboarding README flow polish
- Local project installation guidance

## v0.6 (shipped)

> Scope absorbed into v0.7. Node-native runtime and `quiver:*` npm scripts
> landed together with the token-efficient context pack work.

- Cross-platform CI matrix (macOS, Linux, Windows) for Node-native runtime
- Node-native generated project npm scripts (`quiver:*`)
- Additive migration support for existing projects

## v0.7 — Token-Efficient AI Context Packs (shipped 2026-04-23)

- **v13** — Token-efficient AI modes guidance (Completed)
- **v14** — Tiered context pack: QUICK/STANDARD/DEEP tiers, AGENTS.md router, ACTIVE_SLICE lifecycle, YAML front-matter, dedup (Completed)
- **v15** — Init required before migrate (Completed)
- v13 slice-04 reconciled into v14 slice-05 (2026-04-23); v13 slice-02 narrowed to `DECISIONS.md` only
- Validation checkpoint passed after real-world use and spec completion

## v0.10 (shipped 2026-05-21)

- Published package `0.10.0`.
- Shipped v20 AI CLI orchestration: provider runner, planner/executor roles, context packs, phase-gated planning, spec/slice/handoff generation, execution planning, executor scope checks, and GitHub PR preflight.
- Shipped v21 AI-first layout: smaller default init, `.quiver/` internal machinery, analyze scan relocation, optional legacy/full assets, and no placeholder specs by default.
- Shipped v22 Guided AI Workflow after `0.10.0`: preparation diagnostics, approval state, spec worktrees, executor commits, execution waves, PR creation, post-merge cleanup, and release/package safety are implemented on the release branch.
- Shipped v23 Guided Flow Productization after `0.10.0`: short `quiver` entrypoint, flow status, agent profiles, token-efficient onboarding, versioned planner drafts, production plan review, spec create, executor prompts, delegated worktrees, and final smoke/readiness coverage are implemented on the release branch and ready for the next package release.

## v0.11 — DX Onboarding Hardening (shipped 2026-05-22)

- Published package `0.11.0`.
- **v24** — DX and onboarding hardening from real Quiver Spec Viewer dogfooding: init hygiene, CLI ambiguity, version mismatch checks, local slice validation, analyzer quality, AI context preparation, evidence capture, optional demo scaffolding, documentation, and smoke coverage.

## v0.12 — AI-First Lifecycle Orchestrator (shipped 2026-05-22)

- Published package `0.12.0`.
- **v25** — AI-first lifecycle orchestrator: safe AI onboarding docs, strict run state, phase locks, agent adapters, approval gates, generated specs/slices/handoffs/PR body, execution waves, controlled slice execution, worktree/PR lifecycle, validation hardening, export, and migration.

## v0.12.1 — Smoke Hardening Hotfix (shipped 2026-05-24)

- Published package `0.12.1`.
- **v26** — `0.12.1` smoke hardening from clean npm package validation: CLI help/version output, generated doc links, AI approval/review guidance, local validation, slice brief validation, demo scaffold readiness, scoped plan/graph performance, and release smoke coverage.

## v0.13 — Reliability and AI Workflow Hardening (shipped 2026-05-25)

- Published package `0.13.0`.
- **v27** — Reliability hardening from Pixel Quiver dogfooding: shared state resolver, canonical statuses, JSON export contract, approved-plan spec generation, AI artifact cleanup, token compaction, worktree lifecycle, validation gates, context diagnostics, cross-platform DX, fixtures, smoke tests, and package/tarball release readiness live in `specs/quiver-v27-reliability-ai-workflow-hardening/`.

## v0.14 — Pixel Quiver Feedback Reconciliation (unreleased)

- **v28** — Follow-up hardening from Pixel Quiver dogfooding: active-slice reconciliation, spec-aware `ai inspect` recovery, structured plan-review closure, safer technical-plan approval, stronger spec/worktree validation, agent-safe command examples, GitHub auth/alias guidance, and final release-readiness evidence live in `specs/quiver-v28-pixel-quiver-feedback-reconciliation/`.
- This line is not published yet. Do not claim npm availability until the package is explicitly released.

## Post-Checkpoint Plan (do not execute before validating v14)

> This section now records the follow-up line from the v14-era plan.
> Earlier speculative v20/v21 names were superseded by the actual shipped
> specs listed below. v22 and v23 are now complete and await the next package release.

### Orchestration and Tooling

- **v20 — AI CLI Orchestration** (completed): `quiver ai ...`, planner/executor roles, phase gates, context packs, executor scope checks, execution plans, and PR preflight.
- **v21 — AI-First Layout** (completed): clean default init, `.quiver/` internals, analyze scan relocation, optional legacy assets, and no-spec-safe commands.
- **v22 — Guided AI Workflow** (completed): guided preparation, approvals, spec worktrees, executor commits, execution waves, PR creation, cleanup, and release/package safety live in `specs/quiver-v22-guided-ai-workflow/`.
- **v23 — Guided Flow Productization** (completed): AI-first flow command, agent profiles, compact onboarding/planning prompts, production plan review, explicit `spec create`, manual executor prompts, delegated worktree execution, and release readiness live in `specs/quiver-v23-guided-flow-productization/`.
- **v24 — DX Onboarding Hardening** (shipped in `0.11.0`): real-world dogfooding fixes for init/templates, CLI routing, doctor/prepare, local validation, analyzer, AI context preparation, evidence, and demos live in `specs/quiver-v24-dx-onboarding-hardening/`.
- **v25 — AI-First Lifecycle Orchestrator** (shipped in `0.12.0`): safe AI onboarding docs, strict run state, phase locks, agent adapters, approval gates, generated specs/slices/handoffs/PR body, execution waves, controlled slice execution, worktree/PR lifecycle, validation hardening, export, and migration live in `specs/quiver-v25-ai-first-lifecycle-orchestrator/`.
- **v26 — 0.12.1 Smoke Hardening** (shipped in `0.12.1`): first-use hardening from clean npm smoke testing, covering CLI help/version output, generated doc links, AI approval/review guidance, local validation, slice brief validation, demo readiness, scoped plan/graph performance, and release smoke coverage live in `specs/quiver-v26-0121-smoke-hardening/`.
- **v27 — Reliability and AI Workflow Hardening** (shipped in `0.13.0`): Pixel Quiver dogfooding follow-up covering resolver/export/spec-create/AI-artifact/worktree/validation/context/DX hardening lives in `specs/quiver-v27-reliability-ai-workflow-hardening/`.
- **v28 — Pixel Quiver Feedback Reconciliation** (unreleased): active-slice reconciliation, stale inspect recovery, structured review closure, validation/worktree hardening, agent-safe commands, GitHub auth guidance, and release-readiness evidence live in `specs/quiver-v28-pixel-quiver-feedback-reconciliation/`.

The shipped v20/v21/v22/v23 work is no longer pending. The older context-diagnostics and slice-archaeology ideas remain deferred until real demand justifies them.

### v0.8 — Slice Orchestration Commands (shipped 2026-05-13)

- `quiver:plan` — pending slices in dependency order with critical path and estimated hours
- `quiver:graph` — dependency graph in ASCII tree, Mermaid, and DOT formats
- `quiver:next` — next ready slice with `--all-ready`, `--json`, and `--auto-start`
- Slice graph library (`slice-graph.js`) with `readAllSlices`, `buildGraph`, `topoSort`, `computeLevels`, `detectFileConflicts`
- `depends_on` and `parallel_safe` validation in `check-slice`
- Fix: `quiver:plan` no longer crashes on repos with legacy bare spec deps

### v0.9 — Auto-Install as Dev Dependency (shipped 2026-05-14)

- After `init` or `migrate`, Quiver installs itself as a dev dependency automatically
- Detects package manager via lockfile (bun → pnpm → yarn → npm)
- Resolves npx cache issues: `npx create-quiver plan` works without `@version`
- `--skip-install` flag for CI environments

### Block A — Zero-Question First Use (proposed)

- `npx create-quiver` with no args auto-detects name, stack, runs analyze + doctor
- `--lite` template variant for small projects
- Optional `--interactive` wizard
- Auto-regenerate context pack on every `start-slice`

### Block B — Multi-Model Context Adapters (proposed, only if users ask)

- Additional adapters beyond `AGENTS.md`: `.cursorrules`, `.cursor/rules/*.mdc`, `copilot-instructions.md`, `PROMPT_FOR_EXECUTOR.md`
- Decision driven by which tools actual users adopt

### Block C — Convincing Example (proposed)

- Real end-to-end example in `examples/full-crud/` with 3 merged slices
- 30-second hello-world asciinema at top of README
- "When NOT to use Quiver" section

### Block D — Polish Debt (proposed)

- Actionable error messages (replace stack traces)
- Embedded JSON Schema validation for `slice.json`
- `start-slice` without arguments auto-detects active slice by branch
- `create-quiver status` dashboard

### Deferred Until Real Demand

- Killing Bash entirely (breaking change — needs user base first)
- `@quiver/cli` / `@quiver/template` package split
- Git hooks auto-install
- Metrics/telemetry

## Decision Rules

- No new spec is written until the previous spec's checkpoint passes
- Specs respond to observed friction, not pre-planned lists
- Breaking changes require at least one confirmed external user
- Prefer recording "we decided not to do X" over silently dropping ideas
- Emerging patterns that are not yet ready for a spec live in [`BACKLOG.md`](./BACKLOG.md) — review it before writing a new spec
