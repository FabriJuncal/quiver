# AI Guide for Quiver Docs Template

Use this guide when initializing a new project from the template or when explaining the workflow to another agent.

Important: slice numbering resets inside each spec. `slice-01` is the first slice of that spec, not a global repo counter.

## Core Rules

- Never customize `docs-template/` for a specific project.
- Always use `init-docs.sh` instead of copying files by hand.
- Treat `docs-template/` as generic and `docs/` as generated project-specific output.
- Not every project needs every optional file.

## Initialization Flow

1. Copy the template folder into the target project as `docs-template/`.
2. Run:

```bash
./docs-template/scripts/init-docs.sh "Project Name"
```

3. Tell the user to edit:
   - `docs/CONTEXTO.md`
   - `docs/STATUS.md`
   - `specs/{{PROJECT_SLUG}}/SPEC.md`

## What the Script Creates

- `docs/`
- `docs/ai/`
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
  - `.github/pull_request_template.md`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/feature_request.md`
  - `.github/workflows/ci.yml`

`init-docs.sh` preserves any existing target files and reports skipped copies instead of overwriting them.

## Required Follow-Up

After initialization, the user should:

1. Fill in `docs/CONTEXTO.md`
2. Fill in `docs/STATUS.md`
3. Open and merge the documentation PR that establishes the workflow files
4. Create the first slice in `specs/{{PROJECT_SLUG}}/slices/[slice-id]/`
5. Add `ticket` and `git.*`
6. Run `tools/scripts/start-slice.sh [--allow-draft] <slice.json>`
7. Make one commit per slice
8. Open one PR per spec
9. Validate the slice and the final PR with the workflow gates

Bootstrap note: `start-slice.sh` should resolve paths canonically, prefer a local `develop` or `main` base branch before reaching for `origin`, and reject `draft` slices unless `--allow-draft` is passed intentionally.

## Optional Files

- `docs/MOCK_DATA_GUIDE.md` if the project uses mock data
- `docs/UI_STANDARDS.md` if the project has UI
- `docs/GITFLOW_PR_GUIDE.md` if the team wants a stricter branch workflow
- `docs/ai/LESSONS.md` after each slice

## Good Defaults

- Simple project: `INDEX`, `CONTEXTO`, `WORKFLOW`, and the AI files
- Medium project: add `STATUS.md`
- Complex project: use the full documentation set

## Reminder

If a file does not exist in the generated project, do not invent it. Either create it from the template or tell the user what is missing.
