# EXECUTION_BRIEF - slice-02 Budget + Command Recommendation

## Objective

Calculate safe budget recommendations and a rerun command from the slice-01 recovery classification output.

## Context

This slice consumes classification data only. It must not decide path safety or read raw evidence paths directly.

## Scope

- Calculate `recommended_max_files` and `recommended_max_bytes`.
- Preserve original budgets and never lower them.
- Apply caps and return `scope_required` when recommendations exceed caps.
- Prefer enabling category flags when appropriate.
- Build a one-line portable command preserving relevant flags.
- Add unit tests for budget math and command preservation.

## Acceptance Criteria

- Recommendations only use safe-to-include evidence.
- Unsafe and metadata-only evidence do not increase budget.
- Existing budget values are never reduced.
- Caps prevent runaway recommendations.
- Recommended command preserves `--deep`, provider/model, scope/category/lang/strict flags.
- Transient flags such as `--json` and `--dry-run` are not preserved.

## Expected Files

- `src/create-quiver/lib/ai/analyze-project-recovery.js`
- `tests/lib/ai-analyze-project-recovery.test.js`
- `specs/quiver-v57-evidence-budget-recovery-ux/**`

## Validation

```bash
node --test tests/lib/ai-analyze-project-recovery.test.js
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```

## Completion Checklist

- Budget formula is implemented from classification output only.
- Caps are enforced and tested.
- Command builder preserves relevant flags and drops transient flags.
- Unsafe and metadata-only evidence do not increase budgets.
- Slice closure brief records validation evidence.

## Constraints

- Do not alter CLI rendering in this slice.
- Do not recalculate security.
