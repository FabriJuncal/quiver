# CLOSURE_BRIEF - slice-02 Flow, doctor, next, graph, and plan

## Summary

Implemented shared read-only i18n helpers and localized human output for `flow`, `doctor`, `next`, `graph`, and `plan` while preserving JSON contracts and exact command snippets.

## Validation

- [x] `node --test tests/commands/flow.test.js tests/commands/doctor.test.js tests/commands/next.test.js tests/commands/graph.test.js tests/commands/plan.test.js tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/**/*.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v38-cli-i18n-read-only-commands/slices/slice-02-flow-doctor-next-graph/slice.json --local`
