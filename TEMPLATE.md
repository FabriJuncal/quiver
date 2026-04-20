# Template Customization Guide

Use this guide to adapt the template to a specific project.

## Setup

1. Run:

```bash
./scripts/init-docs.sh "Project Name"
```

2. Edit the generated core files:

- `docs/CONTEXTO.md`
- `docs/STATUS.md` if the project needs status tracking
- `specs/[project-name]/SPEC.md`

## What to Update

### `docs/CONTEXTO.md`

- what the project is
- who it is for
- what problem it solves
- the tech stack

### `docs/STATUS.md`

- progress
- next milestone
- slice status

### `docs/WORKFLOW.md`

- project-specific commands
- stack assumptions
- directory structure

### `specs/[project-name]/SPEC.md`

- project objective
- scope
- timeline
- dependencies

## AI Files

- Keep `docs/ai/PRINCIPLES.md` as the base policy and add only project-specific notes when needed.
- Update `docs/ai/RULES.yaml` when the workflow changes.
- Keep `docs/ai/LESSONS.md` empty until the first lesson is worth recording.

## Optional Files

Add these only when they apply:

- `docs/api/` for backend/API docs
- `docs/tools/` for tool-specific docs
- `docs/UI_STANDARDS.md` for UI-heavy projects
- `docs/MOCK_DATA_GUIDE.md` for mock-driven work

## Common Mistakes

- Overloading `CONTEXTO.md` with historical narrative
- Letting `STATUS.md` drift out of date
- Editing the template files directly instead of the generated project files

## Time Budget

- Setup: 30 minutes
- AI configuration: 15 minutes
- First slice: 20 minutes
- Total: about 1 hour
