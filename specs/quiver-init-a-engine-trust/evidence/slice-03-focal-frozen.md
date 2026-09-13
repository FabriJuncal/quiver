# Quiver Evidence

- Command: `/opt/homebrew/Cellar/node@22/22.22.2_2/bin/node --test tests/lib/effective-contract.test.js`
- Exit code: 0
- Duration ms: 1906
- Started at: 2026-09-13T00:57:36.672Z
- Finished at: 2026-09-13T00:57:38.578Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# Subtest: addenda are immutable, deterministic, parent/input-bound and idempotent
ok 1 - addenda are immutable, deterministic, parent/input-bound and idempotent
  ---
  duration_ms: 230.633333
  type: 'test'
  ...
# Subtest: amendments require explicit removals and reject dangling depends_on before any write
ok 2 - amendments require explicit removals and reject dangling depends_on before any write
  ---
  duration_ms: 134.657541
  type: 'test'
  ...
# Subtest: malformed operations, stale parents, Markdown patching and forged or unverified authority fail closed
ok 3 - malformed operations, stale parents, Markdown patching and forged or unverified authority fail closed
  ---
  duration_ms: 203.371542
  type: 'test'
  ...
# Subtest: lineage verification rejects tamper, missing parents, cycles and duplicate-parent branches
ok 4 - lineage verification rejects tamper, missing parents, cycles and duplicate-parent branches
  ---
  duration_ms: 432.65025
  type: 'test'
  ...
# Subtest: effective-contract store symlinks fail before writing outside the project
ok 5 - effective-contract store symlinks fail before writing outside the project
  ---
  duration_ms: 73.504834
  type: 'test'
  ...
# Subtest: runReviewPlan reviews exact effective bytes and separates retry identity from a new semantic revision
ok 6 - runReviewPlan reviews exact effective bytes and separates retry identity from a new semantic revision
  ---
  duration_ms: 595.5245
  type: 'test'
  ...
1..6
# tests 6
# suites 0
# pass 6
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1841.341833

````

## Stderr

````text

````
