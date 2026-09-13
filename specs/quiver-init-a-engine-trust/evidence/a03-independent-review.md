# A03 Independent Technical and Functional Review

- Slice: `quiver-init-a-engine-trust/slice-03-effective-amendments`
- Reviewed base: `26fc2db`
- Disposition: **APPROVED**
- Open material findings: 0
- Independent full affected pass: 68/68 passed
- Independent post-fix focal residue: 6/6 passed
- Frozen-tree whitespace check: passed

## Reviewed contract surface

The review covered the immutable effective-contract store, deterministic
add/replace/remove operations, parent/root/input digest bindings, lineage
resolution, cycle/missing-parent/duplicate-parent detection, explicit removals
and remaining-reference validation. It also followed the actual
`runReviewPlan` call path through v58 budget reservation, technical retry,
semantic revision, governed review commit and WAL recovery.

The coordinator-authorized review-path scope expansion is recorded in the slice
JSON and execution brief. The frozen implementation derives effective review
identity from the current immutable record and reviews the resolved effective
bytes. The effective branch acquires the planner phase lock inside the run lock
and holds both across revalidation, governed persistence, phase advancement and
WAL cleanup; the ordinary root-draft branch does not enter that added lock path.
It persists the same `{phase,record_id,record_sha256,effective_sha256,input_sha256}` binding in
the budget ledger, canonical governance review, review metadata and recovery
WAL. A recovered effective review does not project its review identity onto the
unchanged root draft, and the unchanged root draft remains unapprovable from
that effective review. Ordinary root-draft review behavior remained covered by
the existing 43-command-test consumer suite within the independent full pass.

## Closed findings

| Finding | Severity | Resolution and verification |
|---|---:|---|
| F-A03-01: explicit slice removal left canonical `depends_on` references unchecked | High | Shared structured reference analysis now recognizes collection-specific `depends_on`, `slice_refs`, requirement refs and acceptance refs. The exact dangling dependency fails with `REFERENCE_BROKEN`/`REMOVED_ID_STILL_REFERENCED`; repairing the dependency succeeds. |
| F-A03-02: default-locale ordering could change canonical operation order and effective digest | Medium | Identity and operation normalization use explicit code-unit comparison. Reversed operation inputs with case-sensitive stable IDs produce identical effective and record digests. |
| F-A03-03: effective review integration initially omitted the production content path, then recursively reacquired owned locks | High | `runReviewPlan` now resolves and prompts with exact effective bytes; budget reservation derives and compares the immutable intent. Envelope factories receive explicit run/phase lock ownership during reservation and finalization. The real consumer test proves pre-payload timeout, same-record retry, WAL recovery, canonical evidence and a separately budgeted new semantic record. |
| F-A03-04: a symlinked effective store could write outside the project before rejection | High | Store ancestors and the exact target are validated before read and immediately before immutable write under the phase lock. The original repro wrote `records/000001.json` externally before failing; the fixed repro returns `UNSAFE_PATH` with an empty external directory. |

## Independent evidence

- [Full affected pass](a03-independent-core-v1.log.gz): native Node 22;
  `effective-contract`, `draft-integrity`, `ai-review-budget`, and
  `ai-review-plan`; 68/68 passed. SHA-256
  `37093596a3dcff35c98100654dcaea1ad20d508c5f2b3b8feadabec0193b0e4f`.
- [Pre-fix symlink reproduction](a03-independent-symlink-repro-v1.log.gz):
  rejection occurred after external `records/000001.json` was created. SHA-256
  `11a1c26e42fcf29cef507c759041aed1f28d830a0a758c3b02adfa27ee1080d4`.
- [Post-fix symlink reproduction](a03-independent-symlink-repro-v2.log.gz):
  `UNSAFE_PATH`, external file list empty. SHA-256
  `e9111044b227d0503b8b584b49b946327f1ee6a7e0f28e17796dcae078b153c3`.
- [Post-fix effective-contract residue](a03-independent-effective-residue-v2.log.gz):
  6/6 passed, including the no-write symlink case and actual review/WAL/retry
  consumer. SHA-256
  `b5d1fbefde9d831ba3608a6a0462c87d430da144ff06b0a93445044772ec2949`.
- [Frozen diff check](a03-independent-diff-check-v3.log.gz): passed with no
  output. SHA-256
  `59869db34853933b239f1e2219cf7d431da006aa919635478511fabbfc8849d2`.

All five gzip artifacts were created with deterministic gzip headers and
verified byte-for-byte against their source logs. A bounded credential-pattern
scan reported no candidate artifact; it did not print candidate values.

## Terminal statement

The frozen A03 tree satisfies the declared deterministic amendment, immutable
lineage, reference integrity and v58 review-budget integration requirements.
All material findings from the single full review pass are closed. No commit or
push was performed by the reviewer.
