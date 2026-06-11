# EXECUTION_BRIEF - slice-08 doctor agents guidance

## Context

`init` preserves existing `AGENTS.md`, but `doctor` can then warn that required Quiver sections are missing without offering a clear repair path.

## Objective

Make `doctor` provide a safe, actionable path for incomplete existing `AGENTS.md` without overwriting human content.

## Scope

- Improve diagnostic wording for incomplete `AGENTS.md`.
- Provide next safe command or action.
- If a repair command already exists, route to it; otherwise document the planned command/action without implementing unrelated CLI.
- Preserve human-authored content by default.

## Acceptance Criteria

- `doctor` identifies missing Quiver sections in `AGENTS.md`.
- Output provides an actionable next step.
- Any proposed repair uses managed blocks or review/confirmation.
- Tests prove existing `AGENTS.md` content is not overwritten by default.

## Completion Checklist

- [ ] Doctor guidance updated.
- [ ] Tests added or updated.
- [ ] Docs updated if command guidance changes.
- [ ] Closure brief records user-facing output.

## Expected Files To Modify

- `src/create-quiver/commands/doctor.js`
- `tests/commands/doctor.test.js`
- `docs/TROUBLESHOOTING.md`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/doctor.test.js
npm run docs:check
git diff --check
```

## Constraints

- Do not make this slice block provider hardening.
- Do not overwrite human `AGENTS.md`.
- Do not invent a destructive repair flow.
