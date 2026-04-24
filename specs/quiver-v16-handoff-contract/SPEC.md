# Quiver v0.16 - Handoff Contract

**Date:** 2026-04-23
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Formalize a lightweight `HANDOFF.md` contract for exceptional context transfers between humans and agents without turning handoffs into a new slice type or a heavier orchestration system.

## Scope

### Included

- Define a canonical `HANDOFF.md` template and required sections
- Define the canonical location and lifecycle for handoff artifacts
- Add a lightweight `check-handoff` command that validates structure and placement
- Optionally add a `new-handoff` scaffold command for faster creation
- Document when a handoff should be used and when a normal spec or slice update is enough

### Excluded

- Adding a new `type` to `slice.json`
- Integrating handoff checks into `doctor`
- Persisting handoff state in `.quiver/state.json`
- Automatic handoff resolution, merging, or workflow orchestration
- Publishing a release as part of this spec

## Organic Evidence

- One real handoff already exists at [specs/quiver-v14-tiered-context-pack/HANDOFF.md](../quiver-v14-tiered-context-pack/HANDOFF.md)
- This spec promotes that pattern into a documented contract without assuming broader automation than the evidence supports

## Preconditions

- Before executing `slice-01`, align [ROADMAP.md](../../ROADMAP.md) and [BACKLOG.md](../../BACKLOG.md) so they reflect the already completed `v14` and `v15` work

## Proposed Contract

- Canonical path: `specs/<spec-slug>/HANDOFF.md`
- Canonical template source: `specs/[project-name]/HANDOFF.md.template`
- Required sections:
  - `## Background`
  - `## What you will change`
  - `## Validation checklist`
  - `## Out of scope`
  - `## Expected deliverable`
  - `## Constraints`
- Handoffs are exceptional artifacts for cross-cutting reconciliation, redirection, or bounded transfer of execution context
- A handoff must not replace `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, or `slice.json`

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Handoff Template and Contract | Completed | [slice-01](./slices/slice-01-handoff-template-and-contract/slice.json) |
| 02 | Check Handoff Command | Completed | [slice-02](./slices/slice-02-check-handoff-command/slice.json) |
| 03 | Handoff Scaffold Optional | Completed | [slice-03](./slices/slice-03-handoff-scaffold-optional/slice.json) |

## Definition of Done

- Quiver ships a canonical `HANDOFF.md.template` with the required sections
- The documentation explains where handoffs live, when to create one, and when not to
- `create-quiver check-handoff <path>` validates the contract and fails clearly on missing sections or wrong placement
- `create-quiver new-handoff <spec-slug>` can create a handoff from the template without overwriting an existing file
- No new `slice.json` type or handoff state machine is introduced
- Smokes cover the validator and, if implemented, the scaffold flow
