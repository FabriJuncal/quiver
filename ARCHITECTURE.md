# Quiver Architecture

Quiver is a Node.js CLI package published as `create-quiver`. It bootstraps and
operates a WDD + SDD workflow around specs, slices, handoffs, validation
evidence, and PR readiness.

## Runtime Entrypoints

| Surface | Path | Purpose |
|---|---|---|
| CLI binary | `bin/create-quiver.js` | Package binary for `create-quiver` and `quiver`. |
| Main dispatcher | `src/create-quiver/index.js` | Parses top-level args, routes commands, renders help, and wires command modules. |
| Package scripts | `package.json` | Contributor and generated workflow shortcuts such as `quiver:plan`, `quiver:graph`, and `package:quiver`. |

The public bootstrap command is `npx create-quiver ...`. The `quiver` binary is
a local installed alias to the same entrypoint.

## Command Layer

Command modules live under `src/create-quiver/commands/`.

| Area | Representative files | Responsibility |
|---|---|---|
| Project setup | `analyze.js`, `prepare.js`, `config.js` | Project scans, diagnostics, language config, and preparation checks. |
| Read-only status | `dashboard.js`, `flow.js`, `next.js`, `plan.js`, `graph.js` | Guided status, dependency graphs, and next-slice discovery. |
| AI workflow | `ai.js`, `src/create-quiver/lib/ai/**` | Planner drafts, approvals, profiles, execution plans, provider execution, PR preflight, and export. |
| Specs and lifecycle | `spec.js`, `src/create-quiver/lib/lifecycle.js`, `src/create-quiver/lib/spec-worktrees.js` | Spec creation/validation, slice readiness, worktrees, and closure. |
| Evidence and demos | `evidence.js`, `demo.js` | Validation evidence capture and optional static Spec Viewer demo generation. |

The current `origin/main` help surface uses legacy slice/handoff commands such
as `start-slice`, `check-slice`, `check-pr`, `check-handoff`, `new-handoff`,
`cleanup-slice`, `check-scope`, and `refresh-active-slices`.

## Library Layer

Shared logic lives under `src/create-quiver/lib/`.

| Area | Representative files |
|---|---|
| Project analysis and generated docs | `analyze.js`, `project-scan.js`, `init-docs.js`, `init-layout.js`, `template-resolver.js` |
| State and safety | `state.js`, `project-state-resolver.js`, `statuses.js`, `locks.js`, `paths.js`, `scope.js` |
| UX and i18n | `cli/ux.js`, `cli/theme.js`, `cli/selectors.js`, `cli/ux-flags.js`, `i18n/**` |
| AI orchestration | `ai/artifacts.js`, `ai/context-packs.js`, `ai/executor.js`, `ai/providers.js`, `ai/spec-generator.js`, `ai/phase-gates.js` |
| Spec graphing | `slice.js`, `slice-graph.js`, `renderers/tree.js`, `renderers/mermaid.js`, `renderers/dot.js` |
| Packaging | `package-safety.js`, `version.js` |

Keep command modules thin where possible. Put reusable behavior in `lib/` so it
can be tested without spawning the full CLI.

## Specs and Slices

Quiver dogfoods its own workflow in `specs/quiver-vNN-*`.

Each spec contains:

- `SPEC.md`: problem, objective, scope, acceptance criteria, guardrails.
- `STATUS.md`: current status and per-slice state.
- `EVIDENCE_REPORT.md`: validation evidence and decisions.
- `EXECUTION_PLAN.md`: dependency-aware execution order.
- `pr.md`: PR body source.
- `slices/<slice-id>/slice.json`: machine-readable scope, dependencies, and validation.
- `slices/<slice-id>/EXECUTION_BRIEF.md`: executor instructions.
- `slices/<slice-id>/CLOSURE_BRIEF.md`: completion conditions and validation record.

Slice numbering resets inside each spec. `slice-00` is the documentary
foundation for that spec; `slice-01` is the first implementation slice in that
same spec.

## Generated Project Contract

When Quiver initializes another project, it writes visible workflow docs and
internal state:

- Visible docs: `AGENTS.md`, `docs/**`, `specs/<project-slug>/**` when specs are created.
- Internal state: `.quiver/config.json`, `.quiver/state.json`,
  `.quiver/scans/PROJECT_SCAN.json`, `.quiver/runs/**`, `.quiver/agents/**`.

Do not treat `.quiver/` as product code. It is local workflow state and must not
be published to npm.

## Templates and Localization

Human Markdown templates live under `docs/*.template`; Spanish variants use
`.es.template`. Machine-readable artifacts, command names, flags, ids,
providers, and JSON keys are not localized.

Spec templates live under `specs/[project-name]/`. Optional docs examples live
under `docs/examples/`.

## Package Boundary

`scripts/package-quiver.sh` builds and validates the npm tarball. The package
must include the CLI entrypoint, runtime source, README, public docs/templates,
community files, package scripts, and the minimal spec template.

The package must exclude tests, local examples, historical dogfooding specs that
are explicitly ignored, CI-only scripts, local PDFs, worktrees, provider state,
secrets, `.DS_Store`, and npm credentials. `src/create-quiver/lib/package-safety.js`
enforces additional unsafe-path checks against tarball contents.

## Tests and Smokes

| Command | Purpose |
|---|---|
| `node --test` | Full Node test suite. |
| `node --test tests/<file>.js` | Targeted test file. |
| `npm run package:quiver` | Build tarball and validate package contents. |
| `bash scripts/ci/smoke-create-quiver.sh` | Package-installed CLI smoke. |
| `npm run smoke:doctor-fixtures` | Doctor/preflight fixture smoke. |
| `npm run smoke:tiered-pack` | Tiered packaging smoke. |
| `npm run smoke:guided-workflow` | Guided workflow smoke. |

Run `node bin/create-quiver.js --help` after changing command surfaces or docs
that mention command names.

## CI

`.github/workflows/ci.yml` currently validates shell scripts, selected slice
templates, cross-platform smoke behavior on Ubuntu/macOS/Windows, and package
smoke coverage.

CI should stay deterministic and local-first. Avoid adding blocking network link
checks or publish steps unless a slice explicitly provides the safety contract.

## Design Constraints

- Keep JSON stdout clean and machine-readable.
- Keep prompts and spinners out of CI, no-TTY, `--json`, and `--no-color` flows.
- Preserve existing command compatibility unless a slice explicitly scopes a
  breaking change.
- Prefer additive fields and aliases over removing established contracts.
- Do not publish local audit files, generated PDFs, worktrees, secrets, or AI
  raw provider state.
