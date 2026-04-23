# Quiver v0.13 Evidence Report

**Spec:** quiver-v13-token-efficient-ai-context
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec will reduce AI token usage by improving Quiver's context contracts, generated prompts, analyzer map, and minimal doctor guidance without adding heavy retrieval infrastructure.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | README_FOR_AI.md, AI_ONBOARDING_PROMPT.md.template, WORKFLOW.md.template, and GITFLOW_PR_GUIDE.md.template now name onboarding, implementation, review, and debugging modes explicitly |
| slice-02 | Completed | docs/DECISIONS.md.template added; docs/INDEX.md.template, README guidance, AI context, workflow, and PR guide now link or route to the decision log |
| slice-03 | Completed | create-quiver analyze now writes Suggested Reading Order, Entry Points, Primary Config Files, Likely Test Commands, High-Signal Files, and Do Not Read First sections into PROJECT_MAP.md |

## Required Final Evidence

- Generated docs include the four token-efficient modes
- Generated `docs/DECISIONS.md` exists and is linked from the docs index
- Generated `docs/PROJECT_MAP.md` includes suggested reading order and high-signal files
- Review guidance instructs agents to inspect `git diff` before opening full files
- Implementation guidance instructs agents to start from `slice.json` and declared files
- Debug guidance preserves command, exit code, first relevant error, stacktrace, and log path when available
- `doctor` prints a concise token-efficient next step after analysis succeeds
- Smokes validate the new generated artifacts and key sections
