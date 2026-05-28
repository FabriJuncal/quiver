# Quiver v35 - Compact Dashboard and Version UX

**Date:** 2026-05-28
**Status:** Planned
**Source:** User-approved requirement, acceptance criteria, technical plan, and three production-readiness reviews for improving Quiver CLI UX without adding Ink/fullscreen TUI.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

`npx create-quiver dashboard` currently renders a long vertical report. When projects have many specs, slices, warnings, agents, runs, or approvals, the user must scroll and section headings disappear, making it hard to understand project state at a glance.

Quiver also has a plain semver `--version` contract, but no human-friendly version surface with Quiver identity comparable to the Angular CLI style shown by the user.

## Objective

Improve Quiver CLI human UX with:

- a compact, summary-first `dashboard` default that answers "what is happening and what should I do next?";
- explicit detail and section views for deeper inspection;
- a Quiver-branded human `version` command with a color-aware ASCII banner;
- stable machine-readable output for automation;
- no Ink, fullscreen TUI, providers, prompts, spinners, writes, or workflow side effects.

## Scope

### Included

- Improve `npx create-quiver dashboard` human default output.
- Add dashboard human-only flags:
  - `--details`
  - `--section <name>`
  - `--limit <n>`
- Preserve existing `dashboard --json` contract by default.
- Add JSON-safe errors for rejected `dashboard --json` combinations.
- Add `npx create-quiver version`.
- Add `npx create-quiver version --json`.
- Preserve `npx create-quiver --version` and `-V` as semver-only output.
- Support the `quiver` binary alias for the new command.
- Update help, references, CLI UX docs, generated guidance, tests, smokes, and package validation.
- Record the `docs/INDEX.md` documentation debt and package-publication decision.

### Excluded

- Ink/fullscreen TUI.
- Browser UI or local server.
- Interactive navigation.
- Prompt-driven dashboard flows.
- Writing project state from `dashboard` or `version`.
- Running npm, git, provider CLIs, or shell probes from `version`.
- Publishing to npm.

## Approved Acceptance Criteria

### Dashboard compact default

1. `npx create-quiver dashboard` prints a compact summary-first human report.
2. The default report prioritizes state, blockers, warnings, next safe command, progress, and summary counts.
3. The default report does not print complete repeated lists in projects with many specs, slices, warnings, agents, approvals, or runs.
4. In a large fixture, the default report is `<= 28` non-empty lines after ANSI is stripped.
5. The next safe command must remain in the compact view and must not be pushed below long lists.
6. Empty/no-spec projects still show useful state, warnings, and the next planning command without repeated empty sections.

### Dashboard detail and section views

7. `dashboard --details` renders the full report for human inspection.
8. `dashboard --section <name>` renders only the requested supported section.
9. Supported sections are `overview`, `specs`, `slices`, `blockers`, `warnings`, `agents`, `approvals`, `runs`, `active-slice`, and `next-steps`.
10. Unsupported sections fail with an actionable error that lists valid values.
11. `dashboard --limit <n>` accepts integers from `1` to `100`.
12. `dashboard --limit <n>` without `--section` applies to all compact repeated lists.
13. `dashboard --limit 0`, negative values, decimals, text, or missing values fail with actionable guidance.
14. Truncated lists show how many entries are hidden and the exact command to inspect them, for example `+ 12 more. Run: npx create-quiver dashboard --section slices`.
15. Long descriptive text is truncated with `...` to protect horizontal readability.
16. Critical next-step commands should not be truncated; if too long, show a shorter inspection command in compact output and leave exact detail in `--details`.

### Dashboard JSON and flag safety

17. `dashboard --json` remains parseable JSON with no colors, prompts, spinners, or human prose.
18. `dashboard --json` keeps the existing schema shape by default.
19. `dashboard --json --section specs`, `dashboard --json --details`, and equivalent human-only combinations are rejected with JSON in stdout, empty stderr, and non-zero exit code.
20. `dashboard --details --section specs` is rejected rather than relying on implicit precedence.
21. New dashboard flags are command-scoped: using them outside `dashboard` fails with clear guidance.
22. `dashboard` remains read-only and does not write files, start slices, open worktrees, run providers, or prompt.
23. `dashboard` collects state once and renders from the in-memory report; section rendering must not introduce a second state collection path.

### Version command

24. `npx create-quiver version` prints a human-readable Quiver version report.
25. The human report includes an ASCII `Quiver` banner that uses the approved Quiver palette when color is available: `#86C8F2`, `#6BADEB`, `#7F9EE8`, `#9B82E6`, `#D56AB0`.
26. The banner and human report remain readable without color and fit within `<= 80` columns.
27. Color is disabled for `--no-color`, `NO_COLOR`, `FORCE_COLOR=0`, CI, no-TTY, and dumb terminals.
28. `version` works outside initialized Quiver projects; project metadata is best-effort and uses `Project: none` when unavailable.
29. `version` does not execute external processes such as `npm --version`, `git`, or provider CLIs.
30. `version --json` emits parseable JSON with `version_schema_version: 1`, `cli.version`, `runtime.node`, `runtime.platform`, `runtime.arch`, `package_manager`, and `project`.
31. `version --json` emits no banner, ANSI, or human prose.
32. `npx create-quiver --version`, `npx create-quiver -V`, `quiver --version`, and `quiver -V` continue to print only the package semver.
33. `quiver version` behaves like `create-quiver version`.

### Documentation, packaging, and validation

34. Help output documents the new command and dashboard flags.
35. `docs/reference/commands.md`, `docs/CLI_UX_GUIDE.md`, and `README_FOR_AI.md` are updated if their public contracts change.
36. If a real root `docs/INDEX.md` is added to this repository, package contents and `.npmignore` are reviewed so npm output is intentional.
37. Tests cover compact dashboard, details, section rendering, limit validation, rejected flag combinations, JSON cleanliness, no-color/CI/no-TTY, version human output, version JSON, semver-only `--version`, and alias behavior.
38. Smokes validate the package tarball installed into a temporary project and execute both `create-quiver` and `quiver` binaries.
39. Final validation includes `node --test`, `git diff --check`, `npx create-quiver spec validate specs/quiver-v35-compact-dashboard-version-ux`, `npm run package:quiver`, and relevant smoke suites.

## Approved Technical Plan

1. Create the spec package and document the `docs/INDEX.md` debt without implementing product code.
2. Add dashboard parsing and contract validation for `--details`, `--section`, and `--limit`.
3. Keep human-only dashboard validations JSON-safe when `--json` is present.
4. Build compact dashboard formatting on top of the existing report, not by creating a second state source.
5. Add detail and section renderers after the flag contract is stable.
6. Add a new `version` command that reuses Quiver theme helpers and best-effort local metadata only.
7. Preserve semver-only top-level `--version` and `-V`.
8. Update docs, generated guidance, and CLI help after command behavior stabilizes.
9. Add focused tests first, then full tests and package-installed smokes.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Foundation and doc router decision | completed | none |
| slice-01 | Dashboard CLI contract | ready | slice-00 |
| slice-02 | Dashboard compact renderer | planned | slice-01 |
| slice-03 | Dashboard details and sections | planned | slice-01, slice-02 |
| slice-04 | Version command and banner | planned | slice-01 |
| slice-05 | Docs, help, and generated guidance | planned | slice-02, slice-03, slice-04 |
| slice-06 | Tests, smokes, and release readiness | planned | slice-02, slice-03, slice-04, slice-05 |
| slice-07 | Package and cross-platform smoke | planned | slice-05, slice-06 |

## Risks and Guardrails

- `--version` is automation-sensitive and must stay semver-only.
- `--version` is also used as an AI approval flag; the new rich output must use `version`, not overload `--version`.
- Parser-level errors currently produce human stderr, so JSON-safe dashboard combination errors need deliberate routing.
- Terminal width, CI, no-TTY, and Windows behavior must be tested rather than assumed.
- Adding a real `docs/INDEX.md` to this repo could change npm package contents.
- The implementation must not introduce Ink or fullscreen TUI before there is evidence the compact renderer is insufficient.

## Assumptions

- This repository's canonical spec location is `specs/quiver-vNN-*`, not the generic `docs/specs` path from reusable skills.
- The current dashboard report contract from v34 remains the source of truth for dashboard data.
- `docs/INDEX.md` is missing in this checkout while `docs/INDEX.md.template` exists; this is documented debt, not a blocker for this spec package.
