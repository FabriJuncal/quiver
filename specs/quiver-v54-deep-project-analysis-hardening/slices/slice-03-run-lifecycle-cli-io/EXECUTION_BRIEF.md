# EXECUTION_BRIEF - slice-03 run lifecycle cli io

## Context

The live no-TTY run did not show progress until the command failed, while TTY output showed spinner progress. Run state and CLI IO need a production contract.

## Objective

Add a run lifecycle state machine, deterministic progress behavior, timeout scaffolding, and cancellation cleanup.

## Scope

- Persist run states such as `started`, `discovering`, `sampling`, `provider_running`, `validating`, `repairing`, `retrying`, `writing_artifacts`, `review_pending`, `succeeded`, `failed`, and `canceled`.
- Ensure progress goes to stderr and `--json` stdout stays clean.
- Add no-TTY line progress.
- Handle `SIGINT`/`SIGTERM` and terminate provider child processes.

## Acceptance Criteria

- First progress output appears before provider execution.
- TTY mode keeps readable loader behavior.
- No-TTY mode prints line-based progress to stderr.
- `--json` stdout remains parseable.
- Cancellation records `canceled` status and leaves no provider child process running.

## Completion Checklist

- [ ] State machine implemented.
- [ ] TTY/no-TTY tests added.
- [ ] Cancellation test added or documented if platform-limited.
- [ ] Closure brief records IO evidence.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/providers.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/commands/ai-analyze-project.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js
git diff --check
```

## Constraints

- Do not write final docs in provider mode without review.
- Do not send human progress to stdout in `--json`.
- Do not implement repair or retry logic in this slice beyond lifecycle hooks.
