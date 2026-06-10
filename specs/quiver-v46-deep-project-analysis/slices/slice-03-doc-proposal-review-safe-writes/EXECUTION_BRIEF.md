# EXECUTION_BRIEF - slice-03 Doc proposal review and safe writes

## Context

The provider can return validated project analysis JSON after slice-02. This slice is the first one allowed to write docs, but only through review and safe snapshots.

## Objective

Turn validated analysis into reviewable documentation updates and write them safely after explicit approval.

## Acceptance Criteria

- Only approved Markdown docs can be updated.
- `docs/PROJECT_MAP.md` remains deterministic or receives only constrained managed-block content.
- Human-authored content is preserved.
- `--review` opens an editable proposal, revalidates it, shows a final diff, and asks for confirmation.
- Canceling review writes nothing.
- Non-TTY review fails with actionable guidance.
- Writes create `.quiver/runs` snapshots, manifest, before/after hashes, and redacted artifacts.
- Dirty target docs are reported before writing.

## Production Guardrails

- Product code, lockfiles, configs, and dependency files are denylisted for writes.
- Path traversal and oversized doc updates must fail closed.
- Raw provider artifacts must be redacted before persistence.

## Completion Checklist

- [ ] Doc proposal conversion added.
- [ ] Review/edit/final-diff flow added.
- [ ] Safe write and snapshot logic added.
- [ ] Cancel/no-TTY/dirty path behavior tested.
