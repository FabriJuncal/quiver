## Title

Quiver v23 - Guided flow productization

## Summary

Productizes the current prompt-driven Quiver workflow into a guided AI-first flow. The goal is to reduce long prompt pasting, guide users through the next safe step, persist planner/executor profiles, version criteria and plan iterations, generate minimal executor prompts, and support safe delegated slice execution.

## Scope

- Short `quiver` command path or documented alias
- Guided flow/status command
- Planner, executor, reviewer, and researcher profiles
- Token-efficient context preparation and onboarding prompt templates
- Versioned criteria and technical-plan drafts
- Production-readiness plan review
- Spec creation from reviewed approved plans
- Minimal executor prompt generation
- Delegated slice execution with safe workspaces
- PR and cleanup flow polish
- Docs, templates, and smoke coverage

## Files

- `specs/quiver-v23-guided-flow-productization/SPEC.md`
- `specs/quiver-v23-guided-flow-productization/STATUS.md`
- `specs/quiver-v23-guided-flow-productization/EVIDENCE_REPORT.md`
- `specs/quiver-v23-guided-flow-productization/EXECUTION_PLAN.md`
- `specs/quiver-v23-guided-flow-productization/pr.md`
- `specs/quiver-v23-guided-flow-productization/slices/**`

Future implementation slices are expected to touch CLI routing, AI commands, provider/profile helpers, prompt templates, approval state, flow status, delegated execution, docs, tests, and smoke scripts as declared by each slice.

## How to Test (DETAILED - REQUIRED)

### Documentation-only `slice-00`

```bash
git diff --check
find specs/quiver-v23-guided-flow-productization -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;
```

### Implementation Slices

Run the validation commands declared in each slice's `slice.json` and `EXECUTION_BRIEF.md`.

Expected full validation by final slice:

```bash
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run smoke:guided-workflow
npm run smoke:tiered-pack
npm run package:quiver
```

## Use Cases

- A user asks Quiver what step comes next.
- A user configures planner and executor agent profiles.
- A planner onboards from generated context without reading unnecessary docs.
- A planner generates and revises acceptance criteria.
- A reviewer checks the technical plan for production readiness.
- A reviewed approved plan creates spec/slices/handoffs/execution plan/PR body.
- An executor receives a minimal slice prompt.
- Quiver delegates or prints safe execution commands for slices.
- Quiver opens the PR from `pr.md` after checks pass.
- Quiver closes the spec worktree after merge.

## Rollback

Revert the smallest failing slice commit. Since the spec requires one slice per commit, rollback should target the affected slice commit rather than the full PR when possible.

## Risks / Notes

- This spec does not automate PR merge.
- Real provider CLIs are not called in CI.
- `quiver` command naming must not confuse package installation.
- Delegated parallel execution must remain conservative until isolation is proven.
