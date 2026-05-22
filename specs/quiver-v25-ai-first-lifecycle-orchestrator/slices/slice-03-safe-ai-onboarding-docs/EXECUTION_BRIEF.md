# EXECUTION BRIEF - slice-03: Safe AI onboarding documentation

## Context

Quiver should reduce manual onboarding work by letting AI complete project context docs, but this must be safe in existing projects.

## Objective

Generate and update onboarding documentation with dry-run, snapshots, assumptions, and conflict reporting.

## Scope

- Docs-only onboarding generation.
- New project and existing project behavior.
- Dry-run previews and snapshots.
- Uncertainty markers and contradiction reports.

## Acceptance Criteria

- New projects get generated onboarding docs.
- Existing docs are preserved unless explicitly updated.
- `--dry-run` writes nothing.
- Snapshots are saved before writes.
- Unknowns and contradictions are visible.

## Technical Plan Summary

Extend analyzer/context preparation into a safe doc writer that separates inferred facts from assumptions and uses the run state created in slice-02.

## Suggested Execution Steps

1. Define allowed docs and write policy.
2. Add dry-run diff output.
3. Add snapshot creation.
4. Add uncertainty/conflict reporting.
5. Cover project-new, project-existing, and old-Quiver fixtures.

## Restrictions

- Do not modify product code in target projects.
- Do not read or log secret values from `.env` files.

## Risks

- AI text may sound more certain than evidence supports. Force uncertainty labels.

## Completion Checklist

- [ ] Dry-run implemented.
- [ ] Snapshot behavior implemented.
- [ ] Existing docs preservation tested.
- [ ] Conflict reporting tested.
- [ ] Evidence appended.
