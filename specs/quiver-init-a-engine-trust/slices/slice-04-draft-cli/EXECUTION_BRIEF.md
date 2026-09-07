# EXECUTION_BRIEF — slice-04-draft-cli

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Expose complete draft lifecycle through the CLI.

## Scope

- Expose ai draft list/show/compare/select/reject/restore/addendum/amend with explicit phase/version/input-file and --json/--dry-run.
- Wire existing plan/revise writes through structural integrity; no bypass through provider output.
- Make dry-run read-only and provide selected version plus preserved/removed IDs in human/JSON views.
- Regenerate actual command reference only after registry reflects implemented commands.

## Acceptance Criteria

- CLI create/revise candidate with content loss, inspect it, recover v1, apply addendum and inspect effective contract end to end.
- All supported phases preserve historical approvals and existing compatibility.
- JSON parses without banners; no-TTY prompts absent; dry-run writes nothing.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/command-registry.js`
- `src/create-quiver/lib/i18n/**`
- `tests/commands/ai-draft-recovery.test.js`
- `docs/reference/commands.md`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/ai-draft-recovery.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
