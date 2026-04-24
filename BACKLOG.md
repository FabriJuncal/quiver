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

_None yet._

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
