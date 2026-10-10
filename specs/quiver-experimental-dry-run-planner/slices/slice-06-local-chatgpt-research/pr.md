## Title

feat(research): prepare local ChatGPT consent and cited reports

## Summary

Add optional local OSS session and report layers with default simulation, exact source checks and explicit consent.

## PR Policy

Local development only. No PR or push authorized by this task.

## Scope

Only slice.json paths; pure Core and existing adapters unchanged.

## Files

See slice.json for the exact paths.

## How to Test (DETAILED - REQUIRED)

Run slice.json commands sequentially. Never run --live during automated validation.

## Evidence

See EVIDENCE_REPORT.md; tests use fictitious OAuth and inference.

## Rollback

Revert this optional slice and its jose dependency; no credentials or migrations were created.
