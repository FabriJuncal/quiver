# Quiver v0.21 Evidence Report

**Spec:** quiver-v21-slice-archaeology
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec introduces two commands to manage historical work: `quiver:archive` reduces noise in `specs/` by relocating fully completed specs, and `quiver:blame-slice` identifies which slice(s) touched a file. `quiver:bisect-slice` was dropped in favor of a `docs/TROUBLESHOOTING.md` section explaining `git bisect run`.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Draft | `quiver:archive` refuses incomplete specs, moves complete specs, writes SUMMARY.md, updates ROADMAP.md, and requires confirmation on TTY without `--yes` |
| slice-02 | Draft | `quiver:blame-slice <file>` returns every slice that mentioned the file path and the corresponding PR merge commit |

## Required Final Evidence

- `npx create-quiver archive <incomplete-spec>` exits non-zero with a clear message
- `npx create-quiver archive <completed-spec> --yes` moves the directory, writes SUMMARY.md, and appends `(archived YYYY-MM-DD)` to ROADMAP.md
- `npx create-quiver blame-slice <existing-file>` returns at least one slice for a file known to have been touched by v14
- `docs/examples/archive.md` and `docs/examples/blame-slice.md` exist
- `docs/TROUBLESHOOTING.md` has a section named `Finding the slice that introduced a regression` with `git bisect run` instructions
- `docs/COMMANDS.md` has rows for both commands
- CI matrix green on macOS, Linux, Windows

## Validation Checkpoint (Post-Merge)

- At least 10 completed specs exist in the repo before this spec is started
- At least one real question is answered by `blame-slice` that previously required manual grep + git log
- Decision to scope v22 based on this evidence
