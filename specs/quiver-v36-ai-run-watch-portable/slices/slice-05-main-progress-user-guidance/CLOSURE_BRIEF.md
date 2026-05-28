# CLOSURE_BRIEF - slice-05 Main progress and user guidance

## Summary

Pending implementation.

## Validation

- [ ] `node --test tests/commands/ai-plan.test.js tests/commands/ai-revise.test.js tests/commands/ai-run-watch.test.js`
- [ ] `git diff --check`

## Pending

- Implement main command UX integration after provider streaming and watcher slices are complete.

## Remaining Risks

- Human progress can accidentally leak into JSON/no-TTY paths if output routing is not isolated.
