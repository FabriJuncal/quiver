# Quiver v0.8 - Agent Onboarding Analysis

**Date:** 2026-04-21
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make Quiver adoption plug-and-play after installation by adding a deterministic local analysis step that helps an AI agent understand an existing project and fill the generated context docs without guessing.

## Scope

### Included

- Add a local `create-quiver analyze --dir <project>` command that scans a project without calling an AI provider
- Generate a structured scan artifact and human-readable project map for AI onboarding
- Generate an exact AI onboarding prompt that tells an agent how to complete Quiver context docs safely
- Update README, doctor output, and smoke tests so the recommended onboarding flow is install, analyze, validate, then run the prompt with an AI agent
- Preserve Quiver's existing workflow rules: one commit per slice and one PR per spec

### Excluded

- Calling OpenAI, Claude, or any other AI provider from the CLI
- Reading or exposing secrets from `.env` files or private local configuration
- Making product-code changes in the target project during analysis
- Replacing `docs/AI_CONTEXT.md`, `docs/CONTEXTO.md`, or the existing spec/slice workflow
- Windows-specific shell UX fixes beyond using portable Node.js path handling in the analyzer

## Proposed Onboarding Flow

1. Install or run Quiver in an existing project.
2. Run `npx create-quiver analyze --dir .`.
3. Run `npx create-quiver doctor --dir .`.
4. Open the AI agent and run the generated prompt from `docs/AI_ONBOARDING_PROMPT.md`.
5. Review the documentation-only changes and create the first Quiver onboarding PR.

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Project Scan Command | Completed | [slice-01](./slices/slice-01-project-scan-command/slice.json) |
| 02 | AI Onboarding Prompt | Pending | [slice-02-ai-onboarding-prompt/slice.json](./slices/slice-02-ai-onboarding-prompt/slice.json) |
| 03 | Doctor and README Adoption Flow | Pending | [slice-03-doctor-readme-adoption-flow/slice.json](./slices/slice-03-doctor-readme-adoption-flow/slice.json) |

## Definition of Done

- `create-quiver analyze --dir .` creates safe onboarding artifacts in a generated project
- The analyzer ignores heavy/generated folders and never reads real secret files
- Generated artifacts give an AI agent enough project structure to fill Quiver context docs
- README and doctor output expose the exact post-install flow and do not imply that "Run" is part of a command
- Smoke tests prove the installer/package includes the analyzer and generated onboarding prompt
- All slices are completed with one commit per slice and one PR for this spec
