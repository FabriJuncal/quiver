# EXECUTION_BRIEF - slice-02 generated CLI reference

## Context

`docs/reference/commands.md` can drift from runtime help. Generation must not erase curated explanations.

## Objective

Generate or drift-check CLI command reference without overwriting curated documentation.

## Scope

- Generated docs blocks or separate generated file.
- Drift check.
- Local script.
- CI/release integration point.

## Acceptance Criteria

- Manual content outside generated blocks is untouched.
- Generated content matches runtime help or registry metadata.
- Drift check can fail CI/release without rewriting files.
- Generation/check command is documented.

## Expected Files To Modify

- `docs/reference/commands.md`
- `scripts/**`
- `package.json`
- `package-lock.json`
- `tests/**`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`

## Validations Required

- `npm ci`
- `node --test`
- `node bin/create-quiver.js --help`
- docs generation check command
- `git diff --check`

## Risks

- Destroying curated docs.
- Generating unstable output.
- Lockfile drift after adding scripts/dependencies.

## Dependencies

- Depends on `slice-00-schema-docs-release-baseline`.

## Instructions For Executor

1. Use generated blocks or a separate file.
2. Add a check mode for CI.
3. Keep manual docs protected.
4. Record drift validation evidence.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- CLI reference drift is detectable without losing curated content.
