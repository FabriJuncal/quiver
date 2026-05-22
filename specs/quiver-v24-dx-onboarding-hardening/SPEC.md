# Quiver v24 - DX Onboarding Hardening

**Date:** 2026-05-22
**Status:** In progress

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver's guided AI workflow is now capable, but real dogfooding with a small project, Quiver Spec Viewer, exposed friction that can confuse new users and agents:

- `init` can leave noisy or incorrect generated project metadata.
- Generated docs can point at files that are not present in the selected profile.
- Modern subcommands can be ambiguous when an older installed package is used.
- `prepare --dry-run` reports `README_FOR_AI.md missing` in a way that sounds like project debt.
- `check-slice` assumes remote/base branch behavior that does not fit new local repos.
- `plan`, `graph`, and `next` are not useful for completed demo histories.
- `analyze` under-describes simple Node/JavaScript projects and command surfaces.
- Context preparation, evidence capture, and demo scaffolding still require manual glue.

## Objective

Harden Quiver's first-use and dogfooding experience so a new project can be initialized, analyzed, prepared for AI, validated locally, demonstrated, and documented with fewer manual commands, clearer errors, safer fixes, and better tests.

## Core Decisions

- `npx create-quiver` remains the canonical bootstrap entrypoint.
- The `quiver` binary remains a local alias to the same CLI behavior.
- Fixes must be non-destructive by default and previewable with `--dry-run`.
- Generated project docs must reflect the selected init profile and must not link to files that do not exist.
- Local validation and PR/base-branch validation are different modes and must be reported separately.
- AI context preparation may produce drafts and assumptions; it must not invent confirmed project facts.
- `slice-00` publishes this planning package only. Product implementation starts in later slices.

## Scope

### Included

- Init/template hygiene for `.gitignore`, `package.json.name`, scripts, and generated docs.
- Safer CLI command routing and actionable errors for unknown subcommands.
- Version mismatch detection between generator, installed package, and generated scripts.
- `doctor --fix --dry-run` and safe `doctor --fix` for non-destructive repairs.
- Documentation link checking for generated docs.
- Clearer `prepare --dry-run` output around framework vs generated-project sources.
- `ai prepare-context` for project context drafts and assumption/risk reporting.
- Local slice validation with `check-slice --local` and better base/remote guidance.
- Historical/demonstration views for `plan`, `graph`, and `next`.
- Analyzer improvements for simple Node/JavaScript projects, scripts, and deduplicated language output.
- Evidence capture with `evidence run`.
- Optional `demo create spec-viewer` scaffolding.
- README, `README_FOR_AI.md`, templates, release notes, smokes, and tests.

### Excluded

- Building a persistent web UI or local IDE.
- Publishing a package version.
- Silent installation of provider CLIs, GitHub CLI, SSH keys, or credentials.
- Direct provider API integrations.
- Replacing human approval gates.
- Changing the core spec/slice schema unless a slice explicitly proves it is required.

## Acceptance Criteria

1. Given an empty directory, when `init --name "Mi Proyecto"` runs, then generated `package.json.name` is derived from the project slug and is not `quiver-docs-template`.
2. Given a project without `.gitignore`, when `init` runs, then Quiver creates a root `.gitignore` with safe defaults including `node_modules/`, `.DS_Store`, `dist/`, and `coverage/`.
3. Given a project with an existing `.gitignore`, when `init` or `doctor --fix` runs, then Quiver merges missing defaults without deleting existing entries or duplicating lines.
4. Given a generated profile, when `docs/INDEX.md` is created, then it only links to files present in that profile or clearly marks optional files.
5. Given a subcommand is unknown to the installed CLI, when it runs, then Quiver fails clearly and does not treat it as a legacy project name.
6. Given generated `quiver:*` scripts exist, when `doctor` runs, then it can detect scripts that target commands unsupported by the installed CLI version.
7. Given `prepare --dry-run` runs in a generated project without root `README_FOR_AI.md`, then the output distinguishes framework source guidance from generated project docs and does not report false project debt.
8. Given a local repo has valid slices but no remote, when `check-slice --local` runs, then structural validation passes without requiring `origin/develop`.
9. Given normal `check-slice` needs a remote/base branch but none exists, then it recommends `--local`, `--base`, or config instead of a misleading merge message.
10. Given a spec contains completed slices, when `plan`, `graph`, or `next` runs with `--include-completed`, then completed slices are visible for demos and audits.
11. Given `plan`, `graph`, or `next` receives `--spec <slug>`, then output is restricted to that spec and does not include slices from other specs.
12. Given a slice has a `ticket` field, when `plan` renders human or JSON output, then the ticket is preserved instead of displayed as `-`.
13. Given all slices are complete, when the default planning commands run without history flags, then they still report that no work is pending.
14. Given a simple Node/JavaScript project, when `analyze` runs, then `PROJECT_MAP.md` identifies it more precisely than `unknown`, deduplicates languages, and surfaces useful scripts such as `validate`, `start`, `dev`, and `test`.
15. Given a project has been analyzed, when `ai prepare-context --dry-run` runs, then Quiver reports proposed docs, assumptions, risks, and omitted paths without writing files.
16. Given `ai prepare-context` writes docs, then it only touches approved docs and marks uncertain statements as `TODO`, `Assumption`, or `Pending confirmation`.
17. Given `evidence run -- <command>` runs, then Quiver captures command, exit code, duration, truncated output summary, and a safe evidence record.
18. Given a command output contains likely secrets, when evidence is recorded, then Quiver redacts common token and secret patterns.
19. Given `demo create spec-viewer --dry-run` runs, then Quiver shows the demo files it would create without writing.
20. Given `demo create spec-viewer` runs in an empty or safe target, then it creates a small demo app, spec, slices, and validation scripts without adding heavy dependencies.
21. Given docs and CLI behavior change, when tests and smokes run, then they cover init hygiene, command routing, prepare output, local slice validation, analyzer, evidence, and demo scaffolding.
22. Given the implementation is complete, when package safety runs, then no local AI state, secrets, generated demo noise, or worktree state is included in the npm tarball.

## Approved Technical Plan

### Objective

Create a cohesive DX hardening layer that fixes the observed dogfooding issues while preserving Quiver's WDD + SDD flow and cross-platform Node CLI contract.

### Approach

Implement in small vertical slices:

1. Foundation docs and source-of-truth sync.
2. Init/template hygiene.
3. CLI routing and version mismatch errors.
4. Doctor fixes and docs link checks.
5. Prepare output and AI context drafts.
6. Local slice validation.
7. Historical planning views.
8. Analyzer improvements.
9. Evidence capture.
10. Demo scaffolding.
11. Final documentation, smokes, and release readiness.

### Production Review Decisions

- `doctor --fix` must ship with `--dry-run` and non-destructive behavior.
- `check-slice --local` must state which remote/base checks were omitted.
- `ai prepare-context` must write only documentation/context files and mark uncertainty explicitly.
- `evidence run` must preserve the wrapped command exit code and redact common secret patterns.
- `demo create spec-viewer` is optional and must not become part of default `init`.

## Slicing Strategy

`slice-00` lands first and only publishes planning artifacts. Implementation slices are ordered so low-level safety and routing fixes land before commands that depend on them. Demo scaffolding is intentionally late because it depends on clean init behavior, better validation, and evidence capture.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Spec foundation and source-of-truth sync | Completed | none |
| slice-01 | Init and generated template hygiene | Completed | slice-00 |
| slice-02 | CLI command routing and version mismatch errors | Completed | slice-00 |
| slice-03 | Doctor fixes and documentation link checks | Completed | slice-01, slice-02 |
| slice-04 | Prepare output and AI context preparation drafts | Planned | slice-01, slice-02 |
| slice-05 | Local slice validation and base branch guidance | Completed | slice-02 |
| slice-06 | Historical plan, graph, and next views | Completed | slice-05 |
| slice-07 | Analyzer command map hardening | Completed | slice-01 |
| slice-08 | Evidence run command | Completed | slice-03 |
| slice-09 | Spec Viewer demo scaffolding | Completed | slice-01, slice-06, slice-08 |
| slice-10 | Docs, smokes, and release readiness | Planned | all implementation slices |

## Risks

- Fix commands can damage user-owned files if not strictly non-destructive.
- New commands can increase surface area unless docs keep the main path simple.
- Version mismatch detection may be hard when running through `npx` caches.
- Secret redaction in evidence can never be perfect; package safety and docs must still warn users.
- Demo scaffolding can drift into an app product; it must remain optional and small.

## Open Questions

- Should `doctor --fix` require `--yes` in non-interactive mode?
- Should `ai prepare-context` default to writing drafts or require `--write`?
- Resolved in `slice-08`: evidence records live under `.quiver/evidence/` by default, with `--output <file>` for explicit destinations.
