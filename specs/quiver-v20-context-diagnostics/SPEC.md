# Quiver v0.20 - Context Diagnostics

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Ship three commands that close the loop on the token-efficient context pack introduced by v13/v14: `quiver:cost` (estimated tokens per slice), `quiver:diff-pack` (semantic diff of `docs/ai/` between refs), and `quiver:replay` (reproduce the exact context bundle an agent would see for a given slice). Together they make the context pack observable and reproducible.

## Context

v14 ships a tiered context pack but gives no way to measure or audit it. When a slice gets too expensive, there is no signal. When the pack changes, no tool summarizes what changed. When a human wants to share a slice with another agent, they copy and paste by hand. These three commands fill the gap with observability, diff summaries, and reproducible bundles.

## Scope

### Included

- `quiver:cost` — per-slice token estimate (ranges, heuristic `chars/4`, optional `tiktoken`)
- `quiver:diff-pack` — semantic diff of `docs/ai/*` between `HEAD` and a ref
- `quiver:replay <slice>` — reconstruct the exact context bundle for a slice and optionally write it out
- Docs, examples, CHANGELOG

### Excluded

- Automatic pruning of over-budget slices
- Vector search, embeddings, or retrieval
- Token counting with exact tokenizers for non-Anthropic models

## Commands

### `quiver:cost`

For each pending slice: tokens of AGENTS.md + QUICK.md + PROJECT_MAP.md + `files[]`, as a range (`~1.8k-2.4k tokens`), with a disclaimer that the heuristic is `chars/4`. Warn when a slice exceeds the budget declared in AGENTS.md.

Optional: if `tiktoken` or `@anthropic-ai/tokenizer` is installed, use it instead of the heuristic.

Flags: `--spec <slug>`, `--slice <id>`, `--json`, `--over-budget-only`.

### `quiver:diff-pack`

Semantic diff of `docs/ai/*` between the working tree and `--since <ref>` (default `main`):

- Files added / removed
- Front-matter fields changed (key-level diff)
- Sections added / removed (heading-level diff)
- Line counts changed

Flags: `--since <ref>`, `--json`.

### `quiver:replay <slice>`

Reconstruct the bundle an agent would see:

1. `AGENTS.md`
2. `docs/ai/QUICK.md`
3. `docs/PROJECT_MAP.md`
4. `docs/ai/ACTIVE_SLICE.md` (if present)
5. Files declared in `slice.json.files`

Flags: `--out <dir>` (write bundle to directory), `--with-tokens` (append estimated tokens).

Output must be byte-for-byte reproducible for the same slice and same commit.

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | `quiver:cost` Command | Draft | [slice-01](./slices/slice-01-cost-command/slice.json) |
| 02 | `quiver:diff-pack` Command | Draft | [slice-02](./slices/slice-02-diff-pack-command/slice.json) |
| 03 | `quiver:replay` Command | Draft | [slice-03](./slices/slice-03-replay-command/slice.json) |

## Definition of Done

- `npx create-quiver cost` returns a per-slice token range and warns on over-budget slices
- `npx create-quiver diff-pack` summarizes `docs/ai/` changes between `HEAD` and `main`
- `npx create-quiver replay <slice>` produces a reproducible bundle and `--out <dir>` writes the files
- Each command has `docs/examples/<command>.md`
- `docs/COMMANDS.md` has rows for all three
- CI matrix green on macOS, Linux, Windows

## Validation Checkpoint

Before v21 is scoped, `quiver:cost` must produce at least one decision (exclude a file from `files[]`, split a slice, or shrink QUICK.md) documented in BACKLOG.md or CHANGELOG.md. If nobody uses it, v20 is rolled back or commands are marked `experimental`.
