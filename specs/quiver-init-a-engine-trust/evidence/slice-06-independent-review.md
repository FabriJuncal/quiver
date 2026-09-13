# Independent review — A06 Brain vault

Reviewer: root, independent of `brain_vault_impl`. Product baseline: `039ffe5`.
Review state: APPROVED. Final frozen-source verification: 68/68 tests passed,
zero failures, skips, cancellations or todo; Node 22.22.2, elapsed 6,443 ms.
This is slice acceptance, not whole-initiative or cross-plan readiness.

## Required findings and closure

| Finding | Observed failure | Minimal correction and checked outcome |
|---|---|---|
| ROOT-A06-01 | Export accepted `.git/vault`; an authorization-time destination symlink replacement wrote outside the project. | Protected paths rejected and destination revalidated after asynchronous authorization and before writes. Both probes now return `UNSAFE_PATH` without target writes. |
| ROOT-A06-02 | Concurrent legitimate append produced advertised revision 0 but canonical revision 1 with an omitted referenced record. | Refresh after authorization and coherent canonical snapshot validation. Retest exported revision 1 consistently with no missing record references. |
| ROOT-A06-03 | Add/export ignored dry-run: revision advanced and export directory appeared. | Validated non-writing preview paths. Retest preserved revision 0 and created no destination. |
| ROOT-A06-04 | Invalid Brain JSON arguments emitted empty stdout and legacy human error with exit 1. | Brain-only Result-v1 argument failure with `VALIDATION_FAILED`, exit 2 and empty stderr. Missing input and unsupported contract version both passed. |

All four findings are materially closed. No optional findings remain. The final
delta routes Brain writer compatibility errors through its Result-v1 boundary;
the store still enforces read-only/downgrade guards before mutation. A real CLI
regression verifies capability exit 4 and unchanged project bytes.

The review also inspected proposal import/recovery, source and manifest checks,
delete locking/quarantine, trusted actor fail-closed behavior and CLI integration.
No other actionable defect was identified. Previous A01/A05 resolved findings
were not reopened.

## Executed evidence

- [Final independent tests](./slice-06-independent-final-tests.md): 32 store/vault/CLI
  tests plus 36 existing CLI/parser/reference/i18n consumers, 68/68 overall.
- [Command reference](./slice-06-final-reference.md): 7 groups, 63 synchronized commands.
- [Documentation](./slice-06-final-docs.md): 23 curated files, no Markdown errors.
- [Slice schema](./slice-06-final-schema.md): 322 valid runtime fixtures and the
  expected negative fixtures; one pre-existing historical fixture excluded.

Exact test command from the A06 worktree, using native Node 22 and English locale:

```sh
node --test tests/lib/brain-store.test.js tests/lib/brain-vault.test.js tests/commands/brain.test.js tests/commands/cli-contract.test.js tests/commands/parser-contract.test.js tests/docs/command-reference.test.js tests/lib/i18n-catalog.test.js
```

## Preserved failure and retest artifacts

The following gzip files preserve the original probe outputs byte-for-byte.
`01` records the observed defect; `02` records its passing retest. Probe process
exit 0 alone meant the diagnostic ran; closure depended on the recorded outputs
and separate assertions, not that exit code alone. Sources ran in isolated owned
temporary fixtures and never changed user project data.

- [Paths and concurrent snapshot, failure](./a06-root-probes-01.md.gz) /
  [retest](./a06-root-probes-02.md.gz).
- [Dry-run, failure](./a06-cli-dry-run-probe-01.md.gz) /
  [retest](./a06-cli-dry-run-probe-02.md.gz).
- [Missing input, failure](./a06-cli-missing-input-01.md.gz) /
  [retest](./a06-cli-missing-input-02.md.gz).
- [Unsupported version, failure](./a06-cli-unsupported-version-01.md.gz) /
  [retest](./a06-cli-unsupported-version-02.md.gz).

Decode any archive with `gzip -dc <artifact.md.gz>`. Compression round trips
were checked for exact equality. A bounded scan found no private-key, GitHub,
OpenAI, AWS-access-key or long Bearer-token signatures in these eight logs;
that scan is not a claim of exhaustive secret detection.

## Limits and handoff

Author reports four implementation/review/fix cycles in the slice closure. The
independent frozen-source test command above ran once. Per-agent tokens and
complete elapsed development time are not available from reliable telemetry.
Public actor construction belongs to A10/A11; missing actor resolution continues
to fail closed. Empirical Cloud/commercial gates are not established by fixtures.

Coordinator must still check staged scope, metadata and integration before the
single logical slice commit. A06 approval does not authorize a release or merge.
