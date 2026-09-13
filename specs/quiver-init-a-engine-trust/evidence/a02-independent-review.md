# A02 independent review — draft recovery

Date: 2026-09-13

Reviewer role: independent technical/functional reviewer

Baseline HEAD: `039ffe5` (A01 + A05 validated)

Scope: slice-02 draft recovery changes in approvals, governed plan review,
digest-bound approval/run state, candidate correlation, and owned tests.

Verdict: **APPROVED**

## Contract checked

- V59-RQ-02: select, review, and approve an older version only while its exact
  inputs remain current.
- V59-RQ-03: move the selected-current projection without deleting immutable
  versions or canonical approval history.
- Draft transition protocol: selected version, artifact/input digest checks,
  rejected/corrupted/unverified fail-closed states, existing v58 actor/findings/
  policy/review-budget gates, run-lock before phase-lock, and recoverable
  projection commits.
- The bounded DEC-A-013 scheduling change was also checked against actual
  allowlists: 02/03 are disjoint from 06/07/08; 04 overlaps 06 only at
  `index.js`, `command-registry.js`, `lib/i18n/**`, and
  `docs/reference/commands.md`; declared dependencies remain intact.

## Review result

One full core pass was performed on review version 1. Later passes were limited
to mandatory findings and modified residue.

| Finding | Severity | Result | Closure evidence |
|---|---:|---|---|
| F-A02-01: equal-byte noncanonical acceptance input path could be selected for a run | High | Closed | Selection now requires canonical run requirement path identity plus digest; exact repro now returns `APPROVAL_BINDING_MISMATCH/input_path`. |
| F-A02-02: approved-with-conditions lifecycle lacked the exact final v58 decision identity | High | Closed | Final legacy metadata projection is built after canonical decision construction and committed in the same approval WAL with `decision_id` and `decision_sha256`; no `approved.md` is created for the conditioned decision. |
| F-A02-03: review WAL could be removed before the reviewed lifecycle projection | High | Closed | Reviewed lifecycle projection now completes before WAL deletion; seven injected commit points recover to exactly one `R-001` lifecycle event with evidence digest. |
| F-A02-04: digest-bound compatibility path silently inferred the latest active run | High | Closed | Latest-run inference was removed. An unscoped digest-bound acceptance save fails when active runs exist; explicit run ownership persists only that run's canonical requirement binding. |

No material findings remain. Rejected selected versions block `readPhaseApproval`,
`resolveApprovedPlannerInput`, candidate selection, and approval writers while
retaining prior approved bytes/history. Explicit valid restore re-enables the
matching approved version. Corrupted newest candidates preserve and permit
restoration of the valid predecessor. Unsupported acknowledgements remain
unverified and cannot satisfy approval. Mutations preserve writer-mode checks,
symlink/path containment, and run-lock to phase-lock ordering.

## Independently observed evidence

- [`a02-review-core-v1.log.gz`](./a02-review-core-v1.log.gz): 28/28 passed for
  draft integrity, approvals, and the initial A02 recovery suite. Compressed
  bytes: 1641; SHA-256: `edaceb3da4ee7ec073ac4b31cc8b6767b7b0ded24179330c46a13fd19ec480fe`.
- [`a02-review-binding-v1.log.gz`](./a02-review-binding-v1.log.gz): original
  canonical-path defect reproduced. Compressed bytes: 244; SHA-256:
  `884075724bf9ab8636d43c227360c0bc923321c0205f33e55a802bf82cc3cb9c`.
- [`a02-review-binding-v2.log.gz`](./a02-review-binding-v2.log.gz): exact defect
  repro blocked after the fix. Compressed bytes: 95; SHA-256:
  `0769240690f8d028c54a5b0fea8165c36ea01d86a0ab612aa86d261b73458bc2`.
- [`a02-review-recovery-v2.log.gz`](./a02-review-recovery-v2.log.gz): 5/5
  modified recovery tests passed after F-A02-01. Compressed bytes: 482;
  SHA-256: `07564f95fe3262d667bfb00845df47a6085fde310b4bfa24c4d299ce62edbcea`.
- [`a02-review-adoption-v2.log.gz`](./a02-review-adoption-v2.log.gz): original
  latest-run inference defect reproduced. Compressed bytes: 120; SHA-256:
  `5d7e0f85efabeea3c70b5422580c687eb9cf6b7232904b00d9244c8b407b60c5`.
- [`a02-review-recovery-v3.log.gz`](./a02-review-recovery-v3.log.gz): 6/6 final
  recovery/ownership residue passed. Compressed bytes: 540; SHA-256:
  `0e27f5cf6248e3ad5da0f42ad8d1979a3937370c3882b8cfdbe49297dfe2bb0a`.
- [`a02-review-reviewed-wal-v3.log.gz`](./a02-review-reviewed-wal-v3.log.gz):
  seven-point governed review WAL lifecycle test passed. Compressed bytes: 226;
  SHA-256: `90ac83705d6d50f092ebe62b7e372303ba0d4a52ffa66aff653a757d8751ff20`.
- [`a02-review-conditioned-v3.log.gz`](./a02-review-conditioned-v3.log.gz):
  exact conditioned-decision lifecycle test passed. Compressed bytes: 238;
  SHA-256: `43d6943a5733f4f50b96afa9305a7500fb61eb6952f54c4ee42f554ed79430c4`.
- [`a02-review-diff-check-final.log.gz`](./a02-review-diff-check-final.log.gz):
  final frozen-tree `git diff --check` exited 0 (empty output). Compressed bytes:
  20; SHA-256: `59869db34853933b239f1e2219cf7d431da006aa919635478511fabbfc8849d2`.

All nine archives use deterministic gzip headers. Each decompressed byte stream
was compared with its source log using `cmp`; all matched exactly. The bounded
repository redactors detected no recognized secret pattern in any source log;
the scan emitted only per-file boolean results and no matched values.

The author additionally reported the frozen affected-suite matrix as: targeted
A02 + integrity + approvals 30/30, `ai-plan` 37/37, `ai-review-plan` 43/43,
`ai-run-state` 18/18, and `git diff --check` passed. Those aggregate counts are
author-run evidence; the focused results above were independently executed.

## Terminal decision

APPROVED — A02 satisfies the reviewed V59 recovery and non-destructive history
contract, preserves v58 governance authority, and closes the material
run-binding and crash-recovery risks found during review.
