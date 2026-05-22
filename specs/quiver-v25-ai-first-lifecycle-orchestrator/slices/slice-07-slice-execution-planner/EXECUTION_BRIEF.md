# EXECUTION BRIEF - slice-07: Slice execution planning and parallel safety

## Context

After specs and slices exist, Quiver must tell the human and agents what can run now, what must wait, and what can safely run in parallel.

## Objective

Generate execution plans with waves, dependencies, file conflicts, and JSON output.

## Scope

- Execution waves.
- Dependency validation.
- Parallel-safety rules.
- File scope conflict checks.
- Human and machine-readable output.

## Acceptance Criteria

- `slice-00` is always Wave 0.
- Parallel waves exclude conflicting slices.
- Blocked slices explain why.
- JSON output is available.
- Existing planning commands remain compatible.

## Technical Plan Summary

Extend current slice graph/planning machinery with file-scope-aware waves and clearer output.

## Suggested Execution Steps

1. Inspect current slice graph utilities.
2. Add file conflict handling based on declared paths.
3. Add wave output.
4. Add JSON output tests.
5. Validate with fixtures.

## Restrictions

- Do not execute slices.
- Do not create commits.

## Risks

- False parallel safety can cause agents to edit the same files. Prefer conservative blocking.

## Completion Checklist

- [ ] Wave planning tested.
- [ ] Conflict detection tested.
- [ ] JSON output tested.
- [ ] Docs updated.
- [ ] Evidence appended.
