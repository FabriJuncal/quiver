# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.12.1] - 2026-05-23

### Added

- `help` command alias and grouped top-level CLI help so `npx create-quiver --help`, `npx create-quiver help`, and local `quiver --help` expose the supported command surface.
- Current per-slice brief validation for `EXECUTION_BRIEF.md` and `CLOSURE_BRIEF.md`, while keeping legacy `HANDOFF.md` validation compatible.
- Regression coverage for scoped `plan` and `graph` loading so unrelated historical specs are not parsed when `--spec <slug>` is used.

### Changed

- Default generated docs now avoid links to optional `docs/examples/*` files unless those files are actually exported.
- `flow` and AI review/spec-create blockers now guide approved-but-unreviewed technical plans toward `ai review-plan` instead of confusing re-approval steps.
- The optional `spec-viewer` demo now includes minimal Quiver metadata, doctor-friendly docs, broader Quiver scripts, and server port fallback.
- Root development scripts for `quiver:plan` and `quiver:graph` now use the local CLI entrypoint so local validation tests the branch code.

### Fixed

- `check-slice --local` no longer fatally requires Git metadata in no-Git folders.
- Bare same-spec dependencies such as `slice-00-docs-foundation` resolve correctly during local dependency validation.
- Scoped `plan` and `graph` complete in this repository without increasing Node heap size.

## [0.12.0] - 2026-05-22

### Added

- AI-first lifecycle run state with status, resume, phase locks, approvals, prompt/draft artifacts, and dashboard-friendly exports.
- Safe AI onboarding docs with dry-run diffs, snapshots, assumptions, risks, contradictions, and human-content preservation.
- Agent profiles and prompt-only/provider adapter flows for planner, executor, reviewer, and doctor roles.
- Strict approval gates for acceptance criteria, technical plans, production-readiness reviews, and spec generation.
- Generated spec/slice artifacts with `EXECUTION_BRIEF.md`, `CLOSURE_BRIEF.md`, read paths, allowed write paths, validation hints, dependency data, execution plans, and PR body.
- Controlled slice execution with scope validation, closure/evidence/status updates, and one-commit-per-slice support.
- Worktree, PR, inspection, export, trace, migration dry-run, and lifecycle list surfaces for AI-first workflows.

### Changed

- Quiver now treats the guided AI lifecycle as durable state under `.quiver/`, not as chat-only memory.
- Generated docs and root docs describe planner/executor flows, review gates, worktree-per-spec, and release safety more explicitly.

### Fixed

- Hardened validation errors, fixture coverage, redaction, parser behavior, and migration/readiness checks around the AI lifecycle.

## [0.11.0] - 2026-05-22

### Added

- Guided AI workflow commands: `prepare`, agent profiles, planner onboarding, approval persistence, `review-plan`, `spec create`, executor prompt generation, delegated execution waves, PR creation with `gh`, spec worktree start/status/close, and package safety.
- `quiver:prepare`, `quiver:flow`, `quiver:ai:agent`, `quiver:ai:review-plan`, `quiver:ai:prompt-slice`, `quiver:ai:execute-plan`, `quiver:spec:create`, `quiver:spec:start`, `quiver:spec:status`, and `quiver:spec:close` npm scripts for generated projects.
- Guided workflow smoke coverage for flow status, profiles, onboarding, approvals, review-plan, spec create, executor prompts, delegated execution dry-runs, PR dry-run/create mocks, cleanup, and package safety.
- DX onboarding hardening for generated projects: `doctor --fix`, `check-slice --local`, `plan|graph|next --include-completed`, `ai prepare-context`, `evidence run`, and `demo create spec-viewer`.
- Generated scripts for `quiver:evidence` and `quiver:ai:prepare-context`.

### Changed

- Root and generated docs now present Quiver as AI-first guided workflow tooling, not only scaffolding.
- `ai execute-plan` now documents manual prompt mode and delegated worktree mode.
- Refreshed AI context docs keep front matter after `analyze`.
- Package smoke now fails when local AI/tool state, env files, npm credentials, or worktree state would enter the npm tarball.
- `init`, `doctor`, `prepare`, and `analyze` now produce clearer first-use guidance, safer repairs, better generated metadata, and better command maps.

### Fixed

- Unknown top-level commands now fail clearly instead of being treated as legacy project names.
- Generated docs and scripts are kept aligned with the selected init profile and supported command surface.
- Local-only repositories can run structural slice validation without a remote/base branch by using `check-slice --local`.

## [0.10.0] - 2026-05-21

### Added

- AI CLI orchestration commands for provider dry-runs, planner phases, executor slice runs, and GitHub PR preflight.
- AI-first default project layout with visible onboarding docs and internal `.quiver/` machinery.
- Generated spec/slice/handoff/PR artifacts with mandatory `slice-00`.

### Changed

- Published `create-quiver` 0.10.0 and aligned the root docs with the current release line.

## [0.9.0] - 2026-05-14

### Added

- Auto-install `create-quiver` as a dev dependency after `init` and `migrate` — detects yarn/pnpm/bun/npm via lockfiles and runs the appropriate install command
- `--skip-install` flag to suppress the dev dependency install step (useful for CI environments)

## [0.8.0] - 2026-05-13

### Added

- `quiver:plan` — lists all pending slices in dependency order with estimated hours, status, and critical path
- `quiver:graph` — visualizes the slice dependency graph in ASCII tree, Mermaid, and DOT formats
- `quiver:next` — suggests the next ready slice; supports `--all-ready`, `--json`, and `--auto-start`
- Slice graph library — `readAllSlices`, `buildGraph`, `topoSort`, `computeLevels`, `detectFileConflicts` for programmatic graph access
- `depends_on` and `parallel_safe` fields with validation in `check-slice`
- JSON-with-comments support for slice templates
- Cross-platform CI matrix covering macOS, Linux, and Windows for the Node-native runtime
- Node-native generated project npm scripts and additive migration support for existing projects

### Fixed

- `quiver:plan` no longer crashes on repos with legacy bare spec names in the `dependencies` field (e.g. `"quiver-v01"`) — these are silently dropped instead of throwing `MISSING_DEPENDENCY`

## [0.4.0] - 2026-04-21

### Added

- `create-quiver` CLI installer surface
- Post-init `doctor` validation mode
- Release helper script and packaged-installer smoke checks

## [0.1.0] - 2026-04-20

### Added

- MIT license
- Portable `init-docs.sh`
- `package.template.json`
- English canonical documentation
- `examples/01-basic-slice/`
- Community health docs and CI
