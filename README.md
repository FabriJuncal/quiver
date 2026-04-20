# Quiver Docs Template

Quiver is a documentation-first starter for projects that use specs, slices, and AI-assisted implementation.

Slice numbering is local to each spec: every new spec starts at `slice-01`.

## Quick Start

1. Copy this folder as `docs-template/` into the root of the target project.
2. Run:

```bash
./docs-template/scripts/init-docs.sh "Project Name"
```

3. Edit the generated docs in `docs/` and the project spec in `specs/[project-name]/`.

## What You Get

- Project documentation templates
- Spec and slice templates
- Slice lifecycle scripts
- AI guidance files
- A portable MIT license

## Required Files in a Generated Project

- `docs/INDEX.md`
- `docs/CONTEXTO.md`
- `docs/WORKFLOW.md`
- `docs/TESTING_GUIDE_FOR_AI.md`
- `docs/ai/PRINCIPLES.md`
- `docs/ai/RULES.yaml`

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
6. `docs/TESTING_GUIDE_FOR_AI.md`

## License

MIT
