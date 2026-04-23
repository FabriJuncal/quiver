# Quiver v0.13 - Token-Efficient AI Context

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Reduce AI token usage in Quiver workflows by making the generated context, prompts, analyzer output, and doctor guidance more selective, structured, and mode-aware without adding heavyweight retrieval infrastructure.

## Scope

### Included

- Define token-efficient AI work modes for onboarding, implementation, review, and debugging
- Teach generated prompts to prefer maps, metadata, diffs, and scoped files before full source reads
- Add a lightweight decision log contract
- Improve `PROJECT_MAP.md` so it becomes the first useful reading index for AI agents
- Preserve the existing spec/slice workflow and one commit per slice discipline
- Add smoke coverage for the generated token-efficiency artifacts and guidance

### Excluded

- Embeddings, vector databases, or mandatory semantic indexes
- Automatic multi-language call graph generation
- Automatic memory pruning without human review
- Exact token counting or provider-specific billing integrations
- A new orchestration command such as `create-quiver context`

## Token-Efficient Modes

Quiver should guide AI agents differently depending on the task:

- **Onboarding:** read `docs/PROJECT_MAP.md`, `docs/AI_CONTEXT.md`, and `docs/AI_ONBOARDING_PROMPT.md` before source files
- **Implementation:** read `slice.json`, declared files, nearby tests, and only then adjacent source
- **Review:** inspect `git diff` and declared slice scope before full files
- **Debug:** inspect the command, exit code, first relevant error, stacktrace, and nearest changed code before long logs

## Principles

- Prefer durable project context over repeated chat history
- Prefer deltas over full files when reviewing or iterating
- Prefer summaries with evidence over pasted logs
- Keep new artifacts few, useful, and easy to maintain
- Make analyzer output more valuable before adding infrastructure

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Token-Efficient AI Modes Guidance | Completed | [slice-01](./slices/slice-01-token-efficient-ai-modes-guidance/slice.json) |
| 02 | Decision Log | Completed | [slice-02](./slices/slice-02-decision-log-context-checkpoint/slice.json) |
| 03 | Project Map Reading Order | Completed | [slice-03](./slices/slice-03-project-map-reading-order/slice.json) |

## Definition of Done

- Generated projects document mode-aware AI reading rules
- Generated projects include `docs/DECISIONS.md`
- `create-quiver analyze` writes a `PROJECT_MAP.md` with suggested reading order and high-signal files
- `doctor` gives a minimal token-efficient next step without becoming noisy
- Smokes verify the generated artifacts and key sections

## Relationship to v14

- v13 slice-02 is narrowed to `DECISIONS.md` only; assumptions and context-efficiency content are produced by v14 slice-01 in `docs/ai/DEEP.md`
- v13 slice-04 was absorbed into v14 slice-05; doctor warnings and smoke assertions for token-efficiency artifacts live there now
- Recommended execution order: v13 slice-01 -> v13 slice-02 (narrowed) -> v13 slice-03 -> v14 slice-01 -> v14 slice-02 -> v14 slice-03 -> v14 slice-04 -> v14 slice-05
