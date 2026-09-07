# EXECUTION_BRIEF — slice-06-brain-vault

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Export, inspect and manage the open knowledge vault.

## Scope

- Render deterministic Markdown+YAML records and safe relative links retaining ID, source, lineage, authority and validity.
- Export complete canonical snapshot with manifest/digests and reject unsafe existing destinations, secrets and broken refs.
- Expose brain status/list/show/add/export/delete via explicit commands; describe active memory, inclusions/exclusions and full export/delete behavior.
- Deletion requires explicit caller action and operates only on validated Brain target, preserving unrelated project data; report what is removed. External vault edits enter importProposal, never active policy.

## Acceptance Criteria

- Export/reopen as ordinary Markdown folder retains every ID and link without plugin.
- Edited vault imports as non-effective proposal; reviewed authority is not forged.
- Security fixtures absent from all exported bytes; unusual titles cannot escape destination.
- Dry-run deletion preserves all bytes; delete only Brain; app remains usable with empty/recreated memory.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/brain/vault.js`
- `src/create-quiver/lib/brain/store.js`
- `src/create-quiver/commands/brain.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/command-registry.js`
- `src/create-quiver/lib/i18n/**`
- `tests/lib/brain-vault.test.js`
- `tests/commands/brain.test.js`
- `docs/reference/commands.md`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-vault.test.js tests/commands/brain.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
