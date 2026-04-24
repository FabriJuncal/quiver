# AI Guide for Quiver Docs Template

Use this guide when initializing a new project from the template or when explaining the workflow to another agent.

The first AI job in a generated project is context preparation, not product implementation.

Important: slice numbering resets inside each spec. `slice-01` is the first slice of that spec, not a global repo counter.
The canonical installer entrypoint is `npx create-quiver` run from the target project root.
Do not recommend global installation; use `npx` or a project-local devDependency when the team needs a pinned version.
The post-init contract is validated with `npx create-quiver doctor` from the project root.
If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate` before `analyze` from the project root.
If the project was never initialized by Quiver, do not use `migrate` as bootstrap; run `npx create-quiver --name "Project Name"` first.
Generated projects also get `quiver:*` npm scripts that call the Node CLI directly; prefer those for repeatable project workflows, including `quiver:plan` for sequential planning.
Maintain release notes and package publishing with `scripts/release-quiver.sh`.
The primary generated project context for agents is `docs/AI_CONTEXT.md`.
The project map is the single source of truth for stack, package manager, commands, and file hints: `docs/PROJECT_MAP.md`.
The universal router for generated projects is `AGENTS.md`; read it before `docs/AI_CONTEXT.md` and `docs/AI_ONBOARDING_PROMPT.md`.
Generated projects also get `docs/DECISIONS.md`; use it for durable choices that should not be re-litigated.
If a generated project has been analyzed, the exact agent handoff prompt is `docs/AI_ONBOARDING_PROMPT.md`.
If a new bounded transfer is needed, scaffold `specs/<project-slug>/HANDOFF.md` with `npx create-quiver new-handoff <spec-slug>` and validate it with `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md`.
Use `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md` to validate a transferred handoff before execution.
During onboarding, after reading `ROADMAP.md`, also read `BACKLOG.md` in the repository root: it tracks emerging patterns that are not yet scoped as specs. Before proposing a new spec, confirm the idea is not already parked or emerging there.

## Token-Efficient Reading Rules

Use the smallest context that still answers the current task.

- **Onboarding:** start from `docs/PROJECT_MAP.md`, `docs/PROJECT_SCAN.json`, `docs/AI_CONTEXT.md`, and `docs/AI_ONBOARDING_PROMPT.md` before opening source files.
- **Onboarding router:** start from `AGENTS.md` first, then the onboarding files above.
- **Implementation:** start from `docs/ai/ACTIVE_SLICE.md` when it exists; otherwise start from `specs/<project-slug>/slices/<slice-id>/slice.json`, then read only the declared files, nearby tests, and directly related source.
- **Handoff:** start from `specs/<project-slug>/HANDOFF.md` when the work was explicitly transferred through a handoff artifact.
- **Handoff scaffold:** if no handoff exists yet and the work needs one, use `npx create-quiver new-handoff <spec-slug>` first.
- **Review:** start from `git diff` and the slice scope before opening full files.
- **Debug:** start from the command, exit code, first relevant error, stacktrace, and the nearest changed code before reading long logs.

Prefer maps, metadata, diffs, and summaries over full file reads when they are enough. Treat front-matter as a skim-first signal: if the header is enough, do not open the body.

## Core Rules

- Never customize `docs-template/` for a specific project.
- Always use `init-docs.sh` instead of copying files by hand.
- Treat `docs-template/` as generic and `docs/` as generated project-specific output.
- Not every project needs every optional file.
- The AI context pack lives in `docs/AI_CONTEXT.md`; `docs/CONTEXTO.md` is the broader project overview; `docs/PROJECT_MAP.md` owns stack and command facts.
- The onboarding prompt lives in `docs/AI_ONBOARDING_PROMPT.md` and should reference the analyzer outputs.
- `specs/<project-slug>/HANDOFF.md` is reserved for exceptional context transfers between agents or phases.
- Initial onboarding should complete context docs and report assumptions before any feature work starts.
- The normal workflow runs from the project root without `--dir`; use `--dir` only when targeting another directory explicitly.
- The cross-platform work targets native macOS, Linux, and Windows shells; Bash is a legacy compatibility path until the runtime slices land, and Windows support is only considered verified once the CI matrix is green.
- The support contract lives in `docs/SUPPORT_MATRIX.md` and `docs/TROUBLESHOOTING.md`.
- Generated project npm scripts should prefer `quiver:*` names such as `quiver:analyze`, `quiver:doctor`, `quiver:start-slice`, `quiver:check-slice`, and `quiver:check-pr`.

## Initialization Flow

1. Copy the template folder into the target project as `docs-template/`.
2. Run:

```bash
./docs-template/scripts/init-docs.sh "Project Name"
```

3. Tell the user to edit:
  - `docs/AI_CONTEXT.md`
  - `docs/AI_ONBOARDING_PROMPT.md`
  - `docs/CONTEXTO.md`
  - `docs/STATUS.md`
  - `docs/SUPPORT_MATRIX.md`
  - `docs/TROUBLESHOOTING.md`
  - `specs/{{PROJECT_SLUG}}/SPEC.md`

## What the Script Creates

- `docs/`
- `docs/ai/`
- `docs/AI_CONTEXT.md`
- `docs/AI_ONBOARDING_PROMPT.md`
- `specs/{{PROJECT_SLUG}}/`
- `tools/scripts/`
- `docs/SEARCH.md`
- a merged or copied `package.json` with the required npm scripts
- the default OSS baseline when those files are missing:
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `docs/SUPPORT_MATRIX.md`
- `docs/TROUBLESHOOTING.md`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/workflows/ci.yml`

`init-docs.sh` preserves any existing target files and reports skipped copies instead of overwriting them.

## Required Follow-Up

After initialization, the user should:

1. Fill in `docs/AI_CONTEXT.md`
2. Fill in `docs/AI_ONBOARDING_PROMPT.md`
3. Fill in `docs/CONTEXTO.md`
4. Fill in `docs/STATUS.md`
5. Run `npx create-quiver analyze` if scan artifacts are missing
6. If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate`
7. If the project was never initialized by Quiver, run `npx create-quiver --name "Project Name"` instead of `migrate`
8. Ask the AI agent to execute `docs/AI_ONBOARDING_PROMPT.md`
9. Review context docs before creating the first implementation slice
10. Open and merge the documentation PR that establishes the workflow files
11. Create the first slice in `specs/{{PROJECT_SLUG}}/slices/[slice-id]/`
12. Add `ticket` and `git.*`
13. Run `npx create-quiver plan` or `npm run quiver:plan`
14. Run `npx create-quiver start-slice [--allow-draft] <slice.json>` or `npm run quiver:start-slice -- [--allow-draft] <slice.json>`
15. Make one commit per slice
16. Open one PR per spec
17. Validate the slice and the final PR with the workflow gates

Bootstrap note: `start-slice` should resolve paths canonically, prefer a local `develop` or `main` base branch before reaching for `origin`, and reject `draft` slices unless `--allow-draft` is passed intentionally.

## Optional Files

- `docs/MOCK_DATA_GUIDE.md` if the project uses mock data
- `docs/UI_STANDARDS.md` if the project has UI
- `docs/GITFLOW_PR_GUIDE.md` if the team wants a stricter branch workflow
- `docs/SUPPORT_MATRIX.md` and `docs/TROUBLESHOOTING.md` for first-run support
- `docs/ai/LESSONS.md` after each slice
- `docs/AI_ONBOARDING_PROMPT.md` after analysis

## Good Defaults

- Simple project: `INDEX`, `CONTEXTO`, `WORKFLOW`, and the AI files
- Medium project: add `STATUS.md`
- Complex project: use the full documentation set

## Reminder

If a file does not exist in the generated project, do not invent it. Either create it from the template or tell the user what is missing.
