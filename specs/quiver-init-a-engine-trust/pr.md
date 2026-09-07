## Title

feat: deliver initiative A Engine and trust foundation

## Summary

Recover valid drafts, manage portable Project Brain knowledge, block contradictory
or stale execution context, and expose canonical Engine contracts. Implementation
and evidence are pending; this file is a planned PR body, not an opened PR.

## PR Policy

One initiative spec per PR; one logical commit per slice, explicitly authorized
by the owner on 2026-09-06. Keep all source requirement IDs and independent review.

## Scope

V58 inherited verification and V59–V62, as specified in SPEC.md.

## Files

See per-slice allowed_write_paths and the eventual git diff.

## How to Test (DETAILED - REQUIRED)

### Required Environment

Node >=20.12.0, npm dependencies installed, Git; LANG=en_US.UTF-8.

### Worktree Access

Check out feature/QUIVER-INIT-A-engine-trust in an isolated worktree.

### Run the Project

Run node bin/create-quiver.js --help from the worktree.

### Use Cases

Execute each slice's declared positive and negative cases. Final acceptance runs
the complete draft recovery, vault export, context stale/contradiction and
human/JSON legacy-parity flows against temporary projects.

### Technical Verification

LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm run test:ci

npm run docs:check

npm run schema:slice:check

node bin/create-quiver.js spec validate specs/quiver-init-a-engine-trust --strict

## Evidence

EVIDENCE_REPORT.md and per-slice CLOSURE_BRIEF.md; currently not-tested.

## Rollback

Revert responsible commits after checking forward reader compatibility. Preserve
immutable histories and v58 fail-closed/read-only behavior.

## Risks / Notes

No release, publish, customer validation or downstream success claimed. Global
integration must be independently validated before this PR becomes ready.
