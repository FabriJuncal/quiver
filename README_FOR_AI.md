# AI Guide for Quiver Docs Template

Use this guide when initializing a new project from the template or when explaining the workflow to another agent.

The first AI job in a generated project is context preparation, not product implementation.

Important: slice numbering resets inside each spec. `slice-01` is the first slice of that spec, not a global repo counter.
The canonical installer entrypoint is `npx create-quiver` run from the target project root.
Do not recommend global installation; use `npx` or a project-local devDependency when the team needs a pinned version.
The post-init contract is validated with `npx create-quiver doctor` from the project root.
If the project already exists from an older Quiver version, run `npx create-quiver migrate` before `analyze` from the project root.
Generated projects also get `quiver:*` npm scripts that call the Node CLI directly; prefer those for repeatable project workflows.
Maintain release notes and package publishing with `scripts/release-quiver.sh`.
The primary generated project context for agents is `docs/AI_CONTEXT.md`.
If a generated project has been analyzed, the exact agent handoff prompt is `docs/AI_ONBOARDING_PROMPT.md`.

## Core Rules

- Never customize `docs-template/` for a specific project.
- Always use `init-docs.sh` instead of copying files by hand.
- Treat `docs-template/` as generic and `docs/` as generated project-specific output.
- Not every project needs every optional file.
- The AI context pack lives in `docs/AI_CONTEXT.md`; `docs/CONTEXTO.md` is the broader project overview.
- The onboarding prompt lives in `docs/AI_ONBOARDING_PROMPT.md` and should reference the analyzer outputs.
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
6. If the project already exists from an older Quiver version, run `npx create-quiver migrate`
7. Ask the AI agent to execute `docs/AI_ONBOARDING_PROMPT.md`
8. Review context docs before creating the first implementation slice
9. Open and merge the documentation PR that establishes the workflow files
10. Create the first slice in `specs/{{PROJECT_SLUG}}/slices/[slice-id]/`
11. Add `ticket` and `git.*`
12. Run `npx create-quiver start-slice [--allow-draft] <slice.json>` or `npm run quiver:start-slice -- [--allow-draft] <slice.json>`
13. Make one commit per slice
14. Open one PR per spec
15. Validate the slice and the final PR with the workflow gates

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
