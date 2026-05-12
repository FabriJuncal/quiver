# Quiver v0.22 Evidence Report

**Spec:** quiver-v22-deferred-tooling
**Date:** 2026-04-23
**Status:** Draft (deferred)

## Summary

This spec is deferred by design. The three commands are speculative and must be confirmed by real usage before they are built. The EVIDENCE_REPORT is started now so that, when evidence accumulates, the work can proceed without redesign.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Draft (deferred) | No evidence yet; waiting for ≥1 slice that grew beyond reasonable scope and needed splitting |
| slice-02 | Draft (deferred) | No evidence yet; waiting for `specs/_archive/` to grow enough to create noise |
| slice-03 | Draft (deferred) | No evidence yet; waiting for a handoff that needed more than `HANDOFF.md` provides |

## Required Final Evidence (when promoted)

- `npx create-quiver fork-slice <slice> --into <newId>` produces a new slice directory and updates STATUS.md
- `npx create-quiver squash-spec <spec>` operates on already-archived specs and never touches active ones
- `npx create-quiver share <slice>` produces a `.tar.gz` that unpacks to a reproducible replay bundle
- Each command has `docs/examples/<command>.md`
- `docs/COMMANDS.md` has rows for all three marked `experimental`
- CI matrix green on macOS, Linux, Windows

## Validation Checkpoint

Promotion trigger per slice:

- `fork-slice`: ≥1 documented case in BACKLOG.md of a slice that grew too big mid-execution
- `squash-spec`: archive directory ≥20 specs, maintainer records friction with `git log` noise
- `share`: ≥1 documented handoff where `HANDOFF.md` alone was insufficient
