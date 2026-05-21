# Quiver Backlog

> **Purpose:** Emerging patterns and ideas that are not yet scoped as specs.
> Reviewed periodically to decide which ones graduate into a spec.
>
> **Audience:** The Quiver maintainer and any AI agent doing project onboarding.
> **Not to be confused with:** `ROADMAP.md` (committed work with versions) or
> active specs in `specs/quiver-vNN-*/` (in-progress or completed work).

## How this file works

- Each entry is an **idea, pattern, or methodology** observed in real use.
- Entries stay here until one of three things happens:
  1. Enough evidence accumulates to promote it to a spec (move to `ROADMAP.md`).
  2. Evidence shows it is not worth formalizing (mark `parked` with reasoning).
  3. It turns out to already exist elsewhere (mark `resolved` with the link).
- **Do not delete parked entries.** The reasoning is valuable when the idea comes back.
- **Do not auto-promote.** A pattern graduates to a spec only when the maintainer confirms it is time.

## Entry template

```
### [Short name]

- **Observed:** YYYY-MM-DD
- **Status:** emerging | evaluating | promoted | parked | resolved
- **Evidence so far:** <how often has this pattern appeared in real work>
- **Problem it solves:** <one or two sentences>
- **Proposed shape:** <what a formalization would look like>
- **Cost to formalize:** <rough estimate in slices/hours>
- **Reasons to wait:** <what would count as insufficient evidence>
- **Trigger to promote:** <concrete threshold to move into ROADMAP.md>
- **Related:** <links to specs, conversations, or handoffs>
```

---

## Active Entries

### Slice Orchestration and Tooling Commands

- **Observed:** 2026-04-23
- **Status:** promoted
- **Evidence so far:** The core orchestration line shipped through v18, v20, v21, and v22. Guided workflow is implemented in `specs/quiver-v22-guided-ai-workflow/`.
- **Problem it solves:** Coordinating multiple agents across slices needs canonical answers for what runs next, what can run in parallel, what context each agent needs, and when work is ready for PR.
- **Proposed shape:**
  - v18 Slice Orchestration (`plan`, `graph`, `next`) shipped.
  - v20 AI CLI Orchestration shipped.
  - v21 AI-First Layout shipped.
  - v22 Guided AI Workflow shipped in this branch.
- **Cost to formalize:** Completed in `specs/quiver-v22-guided-ai-workflow/` as 11 slices including mandatory `slice-00`.
- **Reasons to wait:** No wait for the guided workflow; it has been implemented. Deferred tooling such as `fork-slice`, `squash-spec`, and `share` still requires real demand before separate implementation.
- **Trigger to promote:** Fulfilled for guided workflow on 2026-05-21.
- **Related:**
  - `specs/quiver-v18-slice-orchestration/`
  - `specs/quiver-v20-ai-cli-orchestration/`
  - `specs/quiver-v21-ai-first-layout/`
  - `specs/quiver-v22-guided-ai-workflow/`

### Handoff Contract

- **Observed:** 2026-04-23
- **Status:** emerging
- **Evidence so far:** 1 real case. `specs/quiver-v14-tiered-context-pack/HANDOFF.md`, written to reconcile v13 and v14 before either could execute. Used to delegate meta-work to a separate agent with self-contained context, explicit validation, and negative constraints.
- **Problem it solves:** Today Quiver has no first-class vehicle for work that is neither a slice (product code) nor a spec (planning document). Examples: reconciling two in-flight specs, delegating a cleanup task to a different agent, transferring planning context from a planning-tier model (Opus, GPT-5.4) to an execution-tier model (Sonnet, GPT-5.4 Mini, Qwen Code). Without a vehicle, these tasks happen in ad-hoc chats or untracked commits and lose reproducibility.
- **Proposed shape:**
  - `HANDOFF.md.template` with canonical sections (Background, What you will change, Validation checklist, Out of scope, Expected deliverable, Constraints)
  - Convention for location (for example `specs/<spec>/HANDOFF-<slug>.md` or `specs/handoffs/<date>-<slug>.md`)
  - Convention for lifecycle (created when needed, deleted after validation passes)
  - Optional `create-quiver new-handoff <slug>` command
  - Optional `create-quiver check-handoff <path>` that validates canonical sections
  - Optional smoke that confirms merged handoffs followed the contract
  - **Explicitly not** a new `type` in `slice.json` — handoffs are orthogonal to slices, not a variant of them
- **Cost to formalize:** ~2-3 slices, ~8-10 hours
- **Reasons to wait:** A single occurrence is not enough evidence that this needs tooling. The ad-hoc `HANDOFF.md` already works. Formalizing now risks building infrastructure for a case that may not repeat often enough to justify the surface area.
- **Trigger to promote:** 3 or more organic handoffs appear in real work over 2-3 months without this backlog entry being revisited. Or: one external user reports they wrote a handoff-like artifact for their own spec.
- **Related:**
  - `specs/quiver-v14-tiered-context-pack/HANDOFF.md` (the first real handoff)
  - `specs/quiver-v16-handoff-contract/SPEC.md` (draft spec created, pending evidence and execution)
  - `ROADMAP.md` "Post-Checkpoint Plan" section
  - Multi-model setup context: planning models (Opus, GPT-5.4) to execution models (Sonnet, GPT-5.4 Mini, Qwen Code)

---

## Parked Entries

### Local Web Console for Slice Visualization

- **Observed:** 2026-05-12
- **Status:** parked
- **Evidence so far:** 0 real cases. Standalone prototype explored (`devflow-console`, Express + WebSocket + React, ~350 LoC, lives outside this repo at `/Users/fabrijk/Downloads/devflow-console`).
- **Problem it would solve:** Visual graph of slices (parallel vs sequential, file-level conflicts), button-driven workflow, in-browser terminal, reusable prompts panel.
- **Why parked:**
  - Breaks Quiver's CLI-first identity; turns a scaffolder into a mini-IDE.
  - ~80% of visible value duplicates planned CLI work in v19–v22 (`quiver:status`, `quiver:estimate`, etc.) and already-shipped v18 (`quiver:plan`, `quiver:graph`, `quiver:next`).
  - Real security surface: arbitrary command execution via HTTP, DNS rebinding against localhost, open CORS, no auth, race conditions on shared filesystem state.
  - Adds heavy maintenance cost (React + Vite + Express + ws) to a package distributed as a lightweight `npx create-quiver`.
  - Multi-model agents (the actual audience for Quiver workflows) do not use UI.
- **Cheaper alternatives identified first:**
  - `quiver:graph --html` static export (no server, single self-contained file). Explore as subflag of v18 if Mermaid proves insufficient.
  - Mermaid output shipped in v18 slice-03, renders natively in VSCode/IntelliJ.
  - Optional VSCode extension as companion if UI is ever justified.
- **Trigger to promote:**
  1. v18 (`plan`, `graph`, `next`) is used in real work for ≥3 weeks after its checkpoint passes.
  2. Mermaid/ASCII output of `quiver:graph` is documented as insufficient with concrete friction examples.
  3. `quiver:graph --html` static export is built and also proves insufficient.
  4. If ever implemented: must be a separate companion package (e.g. `@quiver/console`) or VSCode extension — never integrated into `create-quiver` core.
- **Related:**
  - Reference prototype: outside repo (not tracked)
  - `specs/quiver-v18-slice-orchestration/` — CLI alternative already shipped

## Resolved Entries

_None yet._

---

## Review cadence

Revisit this file:

- After each spec reaches its validation checkpoint
- Before writing a new spec (to confirm the work is not already an emerging backlog pattern)
- When adding a new entry (check if it overlaps with an existing one)

## Discovery hooks

This file is referenced from:

- `README.md` References section
- `README_FOR_AI.md` onboarding guidance
- `ROADMAP.md` Post-Checkpoint Plan

If you are an AI agent doing onboarding, read this file after `ROADMAP.md` and
before proposing any new spec. Ideas that look novel may already be tracked
here with documented reasons not to formalize them yet.
