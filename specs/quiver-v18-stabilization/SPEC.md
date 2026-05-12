# Quiver v0.18 Stabilization

**Date:** 2026-05-12
**Status:** Ready

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Close the three loose ends left after v18 merged: fix a crash in `slice-graph.js` that blocks the v18 validation checkpoint, clean up stale local branches and an unclosed ROADMAP entry, and publish the parked draft specs to origin once the checkpoint passes.

## Context

v17 and v18 shipped all planned slices and closed their PRs. During the post-merge smoke test, `npx create-quiver plan` was found to crash on the Quiver repo itself with `SliceGraphError: Missing dependency reference(s)`. The root cause is a one-line normalization bug in `slice-graph.js`: slices with the legacy `"dependencies"` field using bare spec names (e.g. `"quiver-v01"`) get expanded to an invalid ref that the graph validator then rejects. The fix is minimal and non-breaking.

The remaining two slices are housekeeping: one commit to close the `v0.6 (unreleased)` entry in ROADMAP and delete stale local branches; one `git push` to publish the parked v19–v22 draft specs once the v18 human checkpoint is confirmed.

## Scope

### Included

- Fix `normalizeDependencyRef` in `src/create-quiver/lib/slice-graph.js` to silently drop legacy spec-name bare deps.
- Add a test case covering the legacy format.
- Close `v0.6 (unreleased)` in `ROADMAP.md`.
- Delete local stale branches (merged + backup branches).
- Publish `drafts/v19-v22-orchestration-followups` to origin (gated by human checkpoint).

### Excluded

- Any change to the output or behavior of `plan`, `graph`, or `next` beyond the crash fix.
- Changes to slice.json schema or validation rules beyond the legacy-dep case.
- Version bump — this spec does not increment the package version.
- Any v19 work — that starts only after the checkpoint of this spec passes.

## Slices

| Slice | Title | Status | Estimated hours |
|-------|-------|--------|-----------------|
| slice-01 | Fix legacy dependency resolution in `slice-graph.js` | Ready | 0.5 |
| slice-02 | Close v0.6 in ROADMAP and clean stale branches | Ready | 0.3 |
| [GATE] | Human checkpoint: v18 real-use validation | — | 1–2 weeks |
| slice-03 | Publish `drafts/v19-v22-orchestration-followups` to origin | Blocked by gate | 0.1 |

## Gate — Human Checkpoint

slice-03 is blocked until the maintainer:
1. Uses `quiver:plan`, `quiver:graph`, and `quiver:next` in at least one real work cycle.
2. Records an observation in `specs/quiver-v18-slice-orchestration/EVIDENCE_REPORT.md`.
3. Confirms the checkpoint explicitly before delegating slice-03.

## Definition of Done

- `npx create-quiver plan` exits 0 on the Quiver repo.
- `npx create-quiver plan --json` returns valid JSON.
- `ROADMAP.md` no longer has `v0.6 (unreleased)`.
- `git branch` has no backup or already-merged stale branches.
- `origin/drafts/v19-v22-orchestration-followups` exists and matches local SHA.
- All existing tests pass.

## Validation Checkpoint

This spec's checkpoint passes when all three slices are merged/executed and the human gate is confirmed. There is no usage-time requirement beyond the gate — this is stabilization, not a new feature.
