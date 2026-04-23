# Quiver v0.14 - Tiered Context Pack

**Date:** 2026-04-22
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Restructure the generated AI context pack so execution-oriented models (Sonnet, GPT-5.4 Mini, Qwen Code) can operate with a minimal, predictable token footprint, while planning-oriented models (Opus, GPT-5.4) can still opt into deeper context when needed. Do this without adding retrieval infrastructure or model-specific adapters.

## Context

v13 introduces token-efficient AI modes as guidance, but leaves context artifacts flat and undifferentiated. In a typical execution session a model still loads several hundred lines of `AI_CONTEXT.md`, `CONTEXTO.md`, and `WORKFLOW.md` even when it only needs the active slice boundaries. This spec turns the mode guidance into concrete, stratified artifacts that agents can load selectively.

This spec is the operational counterpart to v13: v13 defined the modes, v14 materializes the pack that each mode consumes.

## Scope

### Included

- Generate a three-tier context pack: `docs/ai/QUICK.md` (≤50 lines), `docs/ai/STANDARD.md` (≤300 lines), `docs/ai/DEEP.md` (unbounded)
- Generate a single root `AGENTS.md` that routes agents to the appropriate tier and declares a reading budget and output policy
- Auto-generate `docs/ai/ACTIVE_SLICE.md` on `start-slice` and remove it on `cleanup-slice`
- Add structured YAML front-matter (`purpose`, `applies_when`, `token_cost`, `supersedes`, `last_updated`) to every generated context file
- Deduplicate stack and command information so a single file is authoritative (`PROJECT_MAP.md` owns stack/commands; other files link to it)
- Add `doctor` warnings and smoke tests that verify the pack is well-formed
- Preserve backward compatibility: existing templates stay generated, but consolidated via links instead of duplication

### Excluded

- A new `token-cost` diagnostic command (deferred to v15)
- A `diff-pack` command (deferred to v15)
- Model-specific adapters such as `.cursorrules` or `copilot-instructions.md` (only AGENTS.md for now)
- Exact tokenizer-aware counting (estimates only, via heuristic)
- Embeddings, vector search, or retrieval augmentation
- Automatic pruning of context without human review
- A new orchestration command such as `create-quiver context`

## Tiered Context Pack

Quiver will generate three tiers, each with a bounded purpose:

- **QUICK (`docs/ai/QUICK.md`, ≤50 lines):** the minimum viable briefing. Stack, primary commands, hard rules, pointer to STANDARD and DEEP. Targeted at execution models that must start acting in under 2k tokens.
- **STANDARD (`docs/ai/STANDARD.md`, ≤300 lines):** conventions, workflow overview, testing expectations, mode guidance from v13, links to slice lifecycle. Targeted at mid-sized tasks and default planning.
- **DEEP (`docs/ai/DEEP.md`, unbounded):** project history, past decisions, cultural context, legacy notes. Targeted at planning models that explicitly need depth.

AGENTS.md is the router: every agent reads AGENTS.md first, and AGENTS.md decides which tier to load based on declared task mode.

## Active Slice Contract

`start-slice` will generate `docs/ai/ACTIVE_SLICE.md` containing, in order:

1. Slice objective (one line)
2. `allowed_files` (verbatim from slice.json)
3. Validation commands (from slice.json `tests`)
4. Definition of Done checklist (from slice.json `acceptance`)
5. Explicit prohibition against editing files outside `allowed_files`

`cleanup-slice` will remove `docs/ai/ACTIVE_SLICE.md` as part of the existing cleanup lifecycle. AGENTS.md will instruct agents: when ACTIVE_SLICE.md exists, it is the single source of truth for execution — do not read SPEC.md unless ACTIVE_SLICE.md points to it.

## Deduplication Contract

- `docs/PROJECT_MAP.md` remains the single authoritative source for detected stack, package manager, commands, and structure.
- `docs/AI_CONTEXT.md` stops repeating that information and links to PROJECT_MAP.md instead.
- `docs/CONTEXTO.md` becomes a thin alias/summary that links to AI_CONTEXT.md for new projects. Existing generated `CONTEXTO.md` files are preserved on migration.
- Every generated context file declares a `supersedes` field in its front-matter when it replaces another file, so agents can follow the chain without guessing.

## Front-Matter Contract

Every file in `docs/ai/` and the generated context pack carries this YAML header:

```yaml
---
purpose: <one-line description of what the file is for>
applies_when: <task modes or conditions where this file is relevant>
token_cost: <integer, heuristic estimate at generation time>
last_updated: <YYYY-MM-DD>
supersedes: <path or null>
---
```

This lets agents skip files without reading the body.

## Principles

- The default loadout for execution tasks should fit in under 1000 estimated tokens
- Tiers should never duplicate each other; deeper tiers only add, never restate
- AGENTS.md must declare an explicit reading budget per mode and an anti-verbosity output policy
- Generated artifacts should be few, bounded, and easy to maintain
- Backward compatibility over aggressive cleanup: deprecate silently via `supersedes`, do not delete

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Tiered Context Pack | Completed | [slice-01](./slices/slice-01-tiered-context-pack/slice.json) |
| 02 | AGENTS.md Router | Draft | [slice-02](./slices/slice-02-agents-md-router/slice.json) |
| 03 | Active Slice Lifecycle | Draft | [slice-03](./slices/slice-03-active-slice-lifecycle/slice.json) |
| 04 | Dedup and Front-Matter | Draft | [slice-04](./slices/slice-04-dedup-frontmatter/slice.json) |
| 05 | Doctor and Smokes for Tiered Pack | Draft | [slice-05](./slices/slice-05-doctor-smokes-tiered-pack/slice.json) |

## Definition of Done

- A freshly generated project contains `docs/ai/QUICK.md`, `docs/ai/STANDARD.md`, `docs/ai/DEEP.md`, and root `AGENTS.md`
- `start-slice` creates `docs/ai/ACTIVE_SLICE.md` and `cleanup-slice` removes it
- AGENTS.md declares a reading budget, an output policy, and points to QUICK first
- Every file in `docs/ai/` has valid YAML front-matter with the five declared fields
- `PROJECT_MAP.md` is the only generated file that lists stack and commands; other files link to it
- `doctor` warns when QUICK exceeds 50 lines, STANDARD exceeds 300 lines, or a context file is missing front-matter
- Smoke tests verify tier bounds, AGENTS.md sections, ACTIVE_SLICE creation and cleanup, and no duplicated stack data across files
- Backward compatibility: existing projects running `migrate` gain the new artifacts without losing existing content

## Validation Checkpoint

Before v15 is scoped, v14 must be used in at least one real project for at least one week, with a measurable reduction in execution-mode token loadout (before vs. after). If measurement is inconclusive or the tiered pack adds more friction than value, v15 is rescoped before it is written.
