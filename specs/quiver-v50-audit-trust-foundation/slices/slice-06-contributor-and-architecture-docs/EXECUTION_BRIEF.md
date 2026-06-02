# EXECUTION_BRIEF - slice-06 contributor and architecture docs

## Context

Contributor documentation must reflect the real CLI, package, test, and spec structure. This repo uses `specs/quiver-vNN-*`, not `docs/specs`.

## Objective

Make contribution and architecture documentation accurate enough for external contributors.

## Scope

- `CONTRIBUTING.md`.
- `ARCHITECTURE.md`.
- Public docs cleanup.
- Templates/examples explanation.
- Package boundary explanation.

## Acceptance Criteria

- A new contributor can set up and run tests using `CONTRIBUTING.md`.
- `ARCHITECTURE.md` documents real entrypoints and layers.
- Spec convention is documented as `specs/quiver-vNN-*`.
- Commands mentioned exist in current `--help`.
- Public docs avoid unexplained internal `vNN` references.

## Expected Files To Modify

- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `README.md`
- `ROADMAP.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `node bin/create-quiver.js --help`
- `git diff --check`

## Risks

- Documenting idealized architecture instead of actual code.
- Introducing stale command references.
- Mixing internal dogfooding details into public docs.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.

## Instructions For Executor

1. Inspect code and package scripts before writing docs.
2. Distinguish user npm behavior from contributor repo behavior.
3. Keep docs actionable and concise.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- External contributors can understand and work on Quiver without reverse-engineering the repo.
