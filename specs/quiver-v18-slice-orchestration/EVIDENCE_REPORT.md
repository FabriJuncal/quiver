# Quiver v0.18 Evidence Report

**Spec:** quiver-v18-slice-orchestration
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec delivers the first three user-facing orchestration commands: `plan`, `graph`, and `next`. All are read-only by default; `next --auto-start` is the only path that mutates state, and only under TTY confirmation. The measurable outcome is that a maintainer coordinating multiple agents can identify the correct next slice and the current parallel-safe lots without running custom scripts.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | `quiver:plan` prints the topological order of pending slices; `--json` is a valid parseable payload; critical path is calculated; docs/examples/plan.md exists |
| slice-02 | Draft | `quiver:graph --format tree` prints an ASCII tree; `--show-conflicts` flags intersecting files; ASCII fallback works without UTF-8 locale |
| slice-03 | Draft | `quiver:graph --format mermaid` output renders in a GitHub markdown preview; `--format dot` output compiles with Graphviz |
| slice-04 | Draft | `quiver:next` prints one slice; `--all-ready` prints the whole first level; `--auto-start` requires confirmation on TTY and refuses on non-TTY |

## Required Final Evidence

- `npx create-quiver plan` returns exit 0 on the Quiver repo and prints the expected number of pending slices
- `npx create-quiver plan --json` returns valid JSON with `plan`, `critical_path`, and `total_hours` keys
- `npx create-quiver graph --format tree` renders an ASCII tree on macOS, Linux, and Windows CI
- `npx create-quiver graph --format mermaid` output pastes directly into a GitHub issue comment and renders
- `npx create-quiver next` prints a slice without side effects; running it twice returns the same slice
- `npx create-quiver next --auto-start` on a TTY prompts before running `start-slice`; on non-TTY returns a non-zero exit
- `docs/examples/plan.md`, `docs/examples/graph.md`, and `docs/examples/next.md` contain real input and output
- `docs/COMMANDS.md` has rows for all three commands with OS columns showing macOS/Linux/Windows
- `README.md` "Project NPM Scripts" lists `quiver:plan`, `quiver:graph`, `quiver:next`

## Validation Checkpoint (Post-Merge)

- `quiver:plan` is used at least once per day for one week of real work on Quiver
- At least one external user reports whether `quiver:graph --format mermaid` matches their expectations
- Decision to scope v19 (`status`, `estimate`, `lint-spec`) is made only after this evidence is collected
