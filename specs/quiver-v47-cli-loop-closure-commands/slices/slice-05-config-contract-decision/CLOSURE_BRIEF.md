# CLOSURE_BRIEF - slice-05 config contract decision

## Summary

Completed. The v47 config contract is documented: `config language show|set` remains canonical, generic config aliases are deferred, and future simplification must be additive and compatibility-preserving.

## Validation

- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`

## Closure Conditions

- [x] Config decision is explicit.
- [x] Runtime behavior remains unchanged.

## Open Items

- None.
