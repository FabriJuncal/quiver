# Quiver v0.20 Evidence Report

**Spec:** quiver-v20-context-diagnostics
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec makes the v14 tiered context pack observable and reproducible. `quiver:cost` quantifies how expensive each slice is to load, `quiver:diff-pack` summarizes what changed in `docs/ai/` between refs, and `quiver:replay <slice>` reproduces the exact bundle an agent would see. Numbers are heuristic (≈4 chars/token) unless `tiktoken` or `@anthropic-ai/tokenizer` is installed.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Draft | `quiver:cost` prints per-slice ranges with disclaimer; over-budget warnings fire; optional tokenizer detected automatically |
| slice-02 | Draft | `quiver:diff-pack` summarizes added/removed files, front-matter field changes, and section changes between HEAD and a ref |
| slice-03 | Draft | `quiver:replay <slice>` prints the bundle and `--out <dir>` writes files deterministically; re-running on the same commit yields byte-identical output |

## Required Final Evidence

- `npx create-quiver cost` returns a range per slice with an explicit disclaimer
- With `@anthropic-ai/tokenizer` installed, `cost` uses it automatically and notes the source in the output
- `npx create-quiver diff-pack --since main` summarizes changes in `docs/ai/` and exits 0
- `npx create-quiver replay <slice>` produces a bundle whose SHA-256 is stable across reruns on the same commit
- `docs/examples/cost.md`, `docs/examples/diff-pack.md`, and `docs/examples/replay.md` exist
- `docs/COMMANDS.md` has rows for all three
- CI matrix green on macOS, Linux, Windows

## Validation Checkpoint (Post-Merge)

- `quiver:cost` drives at least one documented decision (exclude a file, split a slice, shrink QUICK.md)
- A human actually pastes a `replay --out` bundle into another agent at least once
- Decision to scope v21 is made with this evidence
