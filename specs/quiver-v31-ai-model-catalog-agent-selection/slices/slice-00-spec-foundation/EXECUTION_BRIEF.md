# EXECUTION_BRIEF - slice-00 Spec foundation and source-of-truth sync

## Context

The v31 requirements and technical plan were approved to improve AI agent model selection after a real Codex failure caused by `model: "GPT 5.5"` instead of `model: "gpt-5.5"`.

## Objective

Publish the approved v31 spec package and synchronize source-of-truth docs without implementing product code.

## Scope

- `specs/quiver-v31-ai-model-catalog-agent-selection/**`
- `README_FOR_AI.md`
- `ROADMAP.md`

## Acceptance Criteria

- The v31 spec package exists and validates.
- Every slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Source-of-truth docs mention v31 as planned.
- No product code is modified.

## Technical Plan Summary

Create the documentation foundation first so later executors can work from bounded slice handoffs.

## Suggested Steps

1. Review this spec package for completeness.
2. Update `README_FOR_AI.md` and `ROADMAP.md` to mark v31 as planned.
3. Run spec validation.
4. Update `EVIDENCE_REPORT.md`, `STATUS.md`, and this closure brief.

## Restrictions

- Do not implement product code.
- Do not change package version.
- Do not claim npm publication.

## Risks

- Source-of-truth docs can drift if v31 is not mentioned.
- The local repo may contain a pending release commit; do not alter it unless explicitly requested.

## Completion Checklist

- [ ] Source-of-truth docs synchronized.
- [ ] Spec validation passes.
- [ ] Evidence recorded.
- [ ] No product code changed.
