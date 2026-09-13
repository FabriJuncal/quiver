# CLOSURE_BRIEF — slice-06-brain-vault

Status: DONE for slice scope. Runtime status: tested. Independent review: APPROVED.
Author/review/fix cycles: 4. Combined CI attempts: 2, final 997/997 passed.

## Summary

Implemented the complete portable Open Knowledge Vault projection, non-effective
proposal import, explicit Brain inspection/management commands and recoverable
quarantine deletion. Independent frozen-source review approved the slice and
combined A01+A02+A05+A06 verification passed. The exact commit is identified by
`Slice: quiver-init-a-engine-trust/slice-06-brain-vault` in Git history.

## Delivered

- Deterministic UTF-8 Markdown with YAML front matter, safe relative record/source
  links, canonical JSON bytes and a digest-bound vault manifest.
- Complete default snapshots include every manifest record, proposal and operation;
  explicit `include_history:false` declares record-history omissions. The export
  path uses the store's unbounded authorized snapshot instead of query limit 1000.
- Export rejects protected/existing destinations, symlinks, broken refs, secrets
  and revision drift before destination writes. Add/export/delete dry-runs perform
  their validations without writing bytes.
- Edited vault blocks import only as immutable `proposed` artifacts under the
  `brain.propose` grant. Proposal bodies cannot create active records or grants;
  proposal manifest commits have validated crash recovery.
- `brain status|list|show|add|export|delete` returns Result v1, fails closed without
  the trusted actor adapter and uses stable exit classes. Human output derives
  from the same canonical result and has English/Spanish catalog coverage.
- Confirmed delete requires the exact project UUID and `brain.delete`, then under
  the Brain lock atomically renames only `.quiver/brain` into the recoverable
  `.quiver/brain-trash/<project>-<operation>` location. It never purges or touches
  exported/unrelated state, and reads after deletion do not auto-initialize.

## Validation

- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-vault.test.js tests/commands/brain.test.js`: PASS, 14/14, 0 skipped, 1.64 s on 2026-09-12 (working tree over `039ffe5`).
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-store.test.js`: PASS, 18/18, 0 skipped, 1.40 s.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/cli-contract.test.js tests/commands/parser-contract.test.js tests/docs/command-reference.test.js tests/lib/i18n-catalog.test.js`: PASS, 36/36, 0 skipped, 5.67 s.
- Tool-observed author run, `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node scripts/ci/run-node-tests.js`: PASS, 991/991, 0 skipped, 118.82 s. No standalone log artifact was captured for this run.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node scripts/ci/check-command-reference.js --check`: PASS, 7 groups and 63 commands synchronized.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node scripts/ci/check-docs-markdown.js`: PASS, 23 files, 0 errors.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node scripts/ci/check-slice-schema.js`: PASS, 322 valid runtime fixtures and expected negative fixtures retained.
- `git diff --check`: PASS.
- [Independent review](../../evidence/slice-06-independent-review.md): APPROVED.
  Its [final test evidence](../../evidence/slice-06-independent-final-tests.md)
  records 68/68 passing store/vault/CLI and consumer tests. ROOT-A06-01 through
  ROOT-A06-04 reproduced destination, concurrency, dry-run and machine-error
  failures, then passed after fixes; the report links the canonical lossless
  gzip archives for every failure and retest.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

The generic skill's `docs/specs/` layout is superseded here by project decision
DEC-PROGRAM-005; the canonical package remains under `specs/quiver-init-a-engine-trust/`.

## Risks and pending work

- Both rebases preserved the approved product/test bytes; combined CI passed.
  Whole-initiative and cross-plan gates remain assigned to later integration.
- A10/A11 own public Engine construction/configuration. This slice proves the
  injected trusted adapter seams and intentionally leaves the default CLI actor
  unverified/fail-closed rather than inventing local grants.
- Explicit reinitialization after a delete is owned by the existing project init
  flow. Query behavior after delete is covered here; no auto-init or purge exists.

## Definition of done

All declared slice acceptance is covered by passing focal tests, independent
review and the [combined CI retest](../../evidence/slice-06-integration-with-slice-02-retest.md):
997/997 passed with zero failures/skips. The first integration attempt's failed
downstream fixture was fixed in A02, without changing this slice's frozen source.
This closure is included in the single logical A06 commit. Full initiative and
cross-plan integration remain later and are not claimed by this slice status.
