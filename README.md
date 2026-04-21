# Quiver Docs Template

Quiver is a documentation-first starter for projects that use specs, slices, and AI-assisted implementation.

Slice numbering is local to each spec: every new spec starts at `slice-01`.

The slice bootstrap flow now prefers canonical paths and can bootstrap from a local base branch when `origin` is unavailable.
The project also ships a support matrix and troubleshooting guide so first-time adopters can self-serve common issues.

## Quick Start

1. Copy this folder as `docs-template/` into the root of the target project.
2. Run:

```bash
./docs-template/scripts/init-docs.sh "Project Name"
```

3. Edit the generated docs in `docs/` and the project spec in `specs/{{PROJECT_SLUG}}/`.

## What You Get

- Project documentation templates
- Spec and slice templates
- Slice lifecycle scripts
- AI guidance files
- A portable MIT license
- Default OSS baseline files when they are missing:
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

## Required Files in a Generated Project

- `docs/INDEX.md`
- `docs/CONTEXTO.md`
- `docs/WORKFLOW.md`
- `docs/SUPPORT_MATRIX.md`
- `docs/TROUBLESHOOTING.md`
- `docs/TESTING_GUIDE_FOR_AI.md`
- `docs/ai/PRINCIPLES.md`
- `docs/ai/RULES.yaml`

## Default Generated Files

These are copied by `init-docs.sh` when they are missing in the target repo:

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

## Optional Files

- `docs/STATUS.md`
- `docs/ai/LESSONS.md`
- `docs/MOCK_DATA_GUIDE.md`
- `docs/UI_STANDARDS.md`
- `docs/api/`

## For AI Agents

Read `README_FOR_AI.md` first. It explains initialization, generic vs project-specific files, and how to work with slices safely.

## For Humans

Recommended reading order:

1. `docs/ai/PRINCIPLES.md`
2. `docs/ai/RULES.yaml`
3. `docs/CONTEXTO.md`
4. `docs/STATUS.md`
5. `docs/WORKFLOW.md`
6. `docs/SUPPORT_MATRIX.md`
7. `docs/TROUBLESHOOTING.md`
8. `docs/TESTING_GUIDE_FOR_AI.md`

## License

MIT
