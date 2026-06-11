# CLOSURE_BRIEF - slice-09 release smoke rollback docs

## Summary

Completed. Release docs now separate deterministic gates from optional live `nika-erp` smoke, list expected pass/fail evidence, and document rollback triggers/actions.

## Validation

- PASS: live read-only `nika-erp` smoke with local CLI.
- Pending final closeout: `npm run docs:check`, strict spec validation, and `git diff --check`.
