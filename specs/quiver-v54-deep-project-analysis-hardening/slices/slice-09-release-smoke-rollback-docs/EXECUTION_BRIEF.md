# EXECUTION_BRIEF - slice-09 release smoke rollback docs

## Context

Live provider behavior is useful release evidence but too unstable for deterministic CI. Release docs must separate fixture gates, live smoke, npm publish, and rollback.

## Objective

Document the release smoke and rollback procedure for the hardened deep analysis flow.

## Scope

- Document deterministic CI gates.
- Document optional live `nika-erp` smoke commands and expected evidence.
- Document canary/latest publish guidance if applicable to existing release docs.
- Document rollback criteria and steps.
- Keep docs direct and command-oriented.

## Acceptance Criteria

- Docs state live provider smoke is release evidence, not CI gate.
- Docs include `nika-erp` smoke commands for dry-run, provider mode, and review mode.
- Docs include expected pass/fail evidence and artifacts.
- Docs include rollback trigger and next action.
- Docs do not instruct users to write docs without review.

## Completion Checklist

- [ ] Release smoke docs updated.
- [ ] Rollback guidance added.
- [ ] Evidence report updated with final validation commands.
- [ ] Closure brief records doc paths and validation.

## Expected Files To Modify

- `docs/reference/commands.md`
- `docs/workflows/existing-project.md`
- `docs/TROUBLESHOOTING.md`
- `specs/quiver-v54-deep-project-analysis-hardening/EVIDENCE_REPORT.md`
- This slice's closure/status files.

## Validation Required

```bash
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v54-deep-project-analysis-hardening --strict
git diff --check
```

## Constraints

- Do not make live provider smoke mandatory in CI.
- Do not publish npm from this slice unless explicitly requested.
- Do not add commands that write final docs without review.
