# CLOSURE_BRIEF — slice-06 Integration, Migration, and Documentation

Status: Preimplementation closure template

## Summary

At closure, summarize the cross-command projection, machine contract, redaction, legacy migration, rollback, directed integration, and documentation behavior actually delivered.

## Criteria to verify

- AC-13 shared CLI and machine contract.
- AC-14 complete redaction and bounded reason storage.
- AC-15 additive migration with no false advancement.
- AC-16 rollback, downgrade guard, and directed validation.
- No regression in the previously evidenced AC-01 through AC-12 paths.

## Evidence to record

- Human/JSON parity samples and clean stdout checks.
- Stable code, status, enum, and exit mapping.
- Redaction samples for every new surface.
- Legacy read proving no writes.
- Migration dry-run, apply, verification, and idempotent reapply artifacts.
- Rollback mode and unsafe-downgrade outcomes.
- Each directed AC-16 fixture and result.
- Documentation validation and changed public-doc links.

## Validation

Report exact commands, exit codes, and results for directed integration tests, docs checks, schema checks, slice/spec validation, and git diff --check. Record any narrower regression command added because implementation changed a shared boundary.

## Deviations

Record every approved change to migration, rollback, machine output, or public operational contract.

## Risks and pending work

Declare unresolved compatibility, recovery, privacy, or operational risks. Release and deployment remain out of scope and must not be reported as completed.
