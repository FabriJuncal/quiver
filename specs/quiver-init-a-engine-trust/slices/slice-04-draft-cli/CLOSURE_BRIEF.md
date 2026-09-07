# CLOSURE_BRIEF — slice-04-draft-cli

Status: SPEC_DRAFT. Runtime status: not-tested. Cycles: 0.

## Summary

Expose complete draft lifecycle through the CLI. Implementation and validation pending.

## Delivered

Contract only; no runtime or test success claimed.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/ai-draft-recovery.test.js`: not executed for this slice.
- `git diff --check`: not executed for this slice.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- Not verified: CLI create/revise candidate with content loss, inspect it, recover v1, apply addendum and inspect effective contract end to end.
- Not verified: All supported phases preserve historical approvals and existing compatibility.
- Not verified: JSON parses without banners; no-TTY prompts absent; dry-run writes nothing.

## Definition of done

Acceptance passes, independent review closes, evidence captured, one logical
commit exists and the initiative's final integration evidence includes the slice.
