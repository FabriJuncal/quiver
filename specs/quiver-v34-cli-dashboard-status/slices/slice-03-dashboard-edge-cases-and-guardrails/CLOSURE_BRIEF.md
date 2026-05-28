# CLOSURE_BRIEF - slice-03 Dashboard edge cases and guardrails

## Summary

Hardened dashboard behavior for explicit missing specs, zero-slice specs, graph cycles, JSON failure output, evidence summary leakage, and no-crash graph fallback. Fixed `project-state-resolver` so `allowGraphErrors` also tolerates cycle errors raised during topological sorting.

## Validation

- [x] `node --test tests/lib/dashboard.test.js tests/commands/dashboard.test.js`
- [x] Full `node --test` passed.
- [x] `git diff --check`

## Pending

- None for this slice.

## Remaining Risks

- None critical.
