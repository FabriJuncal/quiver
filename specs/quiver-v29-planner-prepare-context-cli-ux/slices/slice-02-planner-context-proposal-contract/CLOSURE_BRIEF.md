# CLOSURE_BRIEF - slice-02 Planner context proposal contract

## Summary

Completed a strict planner context proposal contract for future `ai prepare-context --with-planner` usage.

## Validation Against Acceptance Criteria

- Valid structured JSON and fenced JSON planner outputs parse into a normalized docs-only write plan.
- Unsafe paths are rejected before writes, including product code, dependency/lockfiles, absolute paths, traversal paths, generated outputs, runtime/build config, `.quiver/`, and unapproved docs.
- Schema validation uses `zod` and reports actionable issues with safe next steps.
- Invalid raw output can be persisted as a redacted run artifact under `.quiver/runs/<run-id>/raw/`.

## Relevant Changes

- Added `src/create-quiver/lib/ai/context-proposal.schema.js`.
- Added `src/create-quiver/lib/ai/context-proposal.js`.
- Added valid, fenced, malformed, product-code, absolute-path, and traversal fixtures under `tests/fixtures/ai-context-proposals/`.
- Added focused unit tests in `tests/lib/ai-context-proposal.test.js`.

## Pending Work

- `ai prepare-context` must consume this contract in a later slice.

## Remaining Risks

- Planner output compatibility must be tested with real provider transcripts later.
- The allowlist intentionally matches current `prepare-context` docs; future docs must be added explicitly to avoid unsafe broadening.

## Future Recommendations

- Keep the schema versioned if external agents or dashboards start consuming it.
