# CLOSURE_BRIEF - slice-01 flow JSON compatibility

## Summary

Implemented additive `flow --json` compatibility by emitting `next_command` with the same value as the existing `nextCommand` field. Human output semantics are unchanged.

## Validation

- [x] `node --test tests/commands/flow.test.js`
- [x] `node --test`
- [x] `git diff --check`

## Closure Conditions

- [x] `next_command` added.
- [x] `nextCommand` preserved.
- [x] Compatibility documented and tested.

## Open Items

- None.
