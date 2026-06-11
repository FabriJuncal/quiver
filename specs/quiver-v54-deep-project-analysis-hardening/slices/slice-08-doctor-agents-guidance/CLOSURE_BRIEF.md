# CLOSURE_BRIEF - slice-08 doctor agents guidance

## Summary

Completed. `doctor` now gives a concrete AGENTS.md repair path and `doctor --fix` safely creates or appends missing AGENTS.md contract sections without replacing manual content.

## Validation

- PASS: `node --test tests/commands/doctor.test.js tests/lib/doctor.test.js`
