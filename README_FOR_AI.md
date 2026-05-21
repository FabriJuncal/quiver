# AI Guide for Quiver

Use this guide when initializing a new project with Quiver or when explaining the workflow to another agent.

The first AI job in a generated project is context preparation, not product implementation.

Important: slice numbering resets inside each spec. `slice-01` is the first slice of that spec, not a global repo counter.
The canonical installer entrypoint is `npx create-quiver` run from the target project root.
Do not recommend global installation; use `npx` or a project-local devDependency when the team needs a pinned version.
The post-init contract is validated with `npx create-quiver doctor` from the project root.
If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate` before `analyze` from the project root.
If the project was never initialized by Quiver, do not use `migrate` as bootstrap; run `npx create-quiver init --name "Project Name"` first.
The v20 and v21 specs are already completed; `specs/quiver-v22-guided-ai-workflow/` is planned work and must not be described as shipped until its slices are complete.
Generated projects also get `quiver:*` npm scripts that call the Node CLI directly; prefer those for repeatable project workflows, including `quiver:plan` for sequential planning, `quiver:graph` for parallel-level inspection, `quiver:next` for the next ready slice, and the AI family `quiver:ai:onboard`, `quiver:ai:plan`, `quiver:ai:execute-slice`, `quiver:ai:pr`, and `quiver:ai:doctor`. Use `quiver:graph --format mermaid` for PR-ready Markdown or `quiver:graph --format dot` for Graphviz source.
Maintain release notes and package publishing with `scripts/release-quiver.sh`.
The primary generated project context for agents is `docs/AI_CONTEXT.md`.
The project map is the single source of truth for stack, package manager, commands, and file hints: `docs/PROJECT_MAP.md`.
The raw analyzer output is internal machinery at `.quiver/scans/PROJECT_SCAN.json`; read it only when the visible map is not enough.
The universal router for generated projects is `AGENTS.md`; read it before `docs/AI_CONTEXT.md` and `docs/AI_ONBOARDING_PROMPT.md`.
Generated projects also get `docs/DECISIONS.md`; use it for durable choices that should not be re-litigated.
If a generated project has been analyzed, the exact agent handoff prompt is `docs/AI_ONBOARDING_PROMPT.md`.
Keep README copy-paste prompts short; the detailed onboarding contract lives in `docs/AI_ONBOARDING_PROMPT.md` generated from `docs/AI_ONBOARDING_PROMPT.md.template`.
If a new bounded transfer is needed, scaffold `specs/<project-slug>/HANDOFF.md` with `npx create-quiver new-handoff <spec-slug>` and validate it with `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md`.
Use `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md` to validate a transferred handoff before execution.
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
- The cross-platform work targets native macOS, Linux, and Windows shells; Bash is a legacy compatibility path until the runtime slices land, and Windows support is only considered verified once the CI matrix is green.
- The support contract lives in `docs/SUPPORT_MATRIX.md` and `docs/TROUBLESHOOTING.md`.
- Generated project npm scripts should prefer `quiver:*` names such as `quiver:analyze`, `quiver:plan`, `quiver:graph`, `quiver:next`, `quiver:doctor`, `quiver:start-slice`, `quiver:check-slice`, and `quiver:check-pr`.
- `quiver:graph` defaults to the tree view; choose `--format mermaid` or `--format dot` when you need exportable graph artifacts.
- `quiver:next` prints the next ready slice and can auto-start it behind a confirmation prompt.
- `quiver:next --all-ready` prints the whole ready level when you want to inspect every actionable slice at once.

## Initialization Flow

1. From the target project root, run the default AI-first initializer:

```bash
npx create-quiver init --name "Project Name"
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

1. Fill in `docs/AI_CONTEXT.md`
2. Fill in `docs/AI_ONBOARDING_PROMPT.md`
3. Fill in `docs/CONTEXTO.md`
4. Fill in `docs/STATUS.md`
5. Run `npx create-quiver analyze` if `docs/PROJECT_MAP.md` or `.quiver/scans/PROJECT_SCAN.json` is missing
6. If the project already exists from an older Quiver version and was previously initialized by Quiver, run `npx create-quiver migrate`
7. If the project was never initialized by Quiver, run `npx create-quiver init --name "Project Name"` instead of `migrate`
8. Ask the AI agent to execute `docs/AI_ONBOARDING_PROMPT.md`
9. Review context docs before creating the first implementation slice
10. Open and merge the documentation PR that establishes the workflow files
11. Use `npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run`
12. After human approval, use `npx create-quiver ai plan --phase technical-plan --input acceptance-approved.md --dry-run`
13. After human approval, use `npx create-quiver ai plan --phase spec --input technical-plan-approved.md --dry-run` to create the real spec, slices, handoffs, execution plan, and PR body
14. Run `npx create-quiver plan` or `npm run quiver:plan`
15. Run `npx create-quiver next` or `npm run quiver:next`
16. Run `npx create-quiver start-slice [--allow-draft] <slice.json>` or `npm run quiver:start-slice -- [--allow-draft] <slice.json>`
17. Make one commit per slice
18. Open one PR per spec
19. Validate the slice and the final PR with the workflow gates

Bootstrap note: `start-slice` should resolve paths canonically, prefer a local `develop` or `main` base branch before reaching for `origin`, and reject `draft` slices unless `--allow-draft` is passed intentionally.

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
