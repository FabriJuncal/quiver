# Evidence — Initiative A

State: IN_PROGRESS. Slice evidence is not whole-plan or cross-plan readiness.

## X03 documentary contract correction — 2026-09-06

At this contract-draft snapshot the additive approval receipt/resolver and outbox
were documentation only; their independent documentary closure is recorded below
in the foundation review, while runtime acceptance remains separate. A01–A05
closed risk coverage, source criteria, primary owners and product gates are intact.

After the patch, strict spec validation passed for A and B; Ajv validated all 28
A/B slice schemas and checkHandoff validated 56 briefs. The initial local harness
incorrectly expected checkHandoff.ok; the corrected call uses its actual
throw-on-error contract and passed. Markdown lint and git diff --check returned
exit 0. The read-only program validator passed 314 exact source requirements,
314 unique primary owners and the 85-slice DAG. These checks do not validate
derived branch metadata or any runtime/approval behavior. No code, source plan,
requirement, gate ledger or commit was changed by this correction.

## Executed and checked

Slice 01 implements structural preservation, immutable draft publication,
explicit current selection metadata, guarded recovery and existing-writer handling.
Independent code review is terminal APPROVED. The frozen-source Node 22 CI retest
passed all 958 tests with no failures or skips; exact evidence is linked below.

## Inferred

The existing v58 architecture can support additive draft integrity and Brain
services. This inference requires the slice tests below.

## Could not verify

Remaining runtime slices, downstream integration and PR readiness. Full lifecycle
selection/review operations and CLI exposure remain owned by their later slices;
slice 01 does not claim their acceptance merely by declaring lifecycle states.

## Slice evidence

- slice-00-foundation: documentary checks passed; runtime cycles 0;
  commit `ad494a0ccd4f61957db22490db3c00bfb8fafd26`.
- slice-01-draft-integrity: implemented and independently approved; two full-CI
  verification attempts (initial failed, frozen-source retest passed). Focal
  implementation/review attempts are itemized in its closure, not inferred from
  these two full-suite attempts. Commit is identified by the exact trailer
  `Slice: quiver-init-a-engine-trust/slice-01-draft-integrity`.
- slice-02-draft-recovery: not-tested; cycles 0; commit not created.
- slice-03-effective-amendments: not-tested; cycles 0; commit not created.
- slice-04-draft-cli: not-tested; cycles 0; commit not created.
- slice-05-brain-store: not-tested; cycles 0; commit not created.
- slice-06-brain-vault: not-tested; cycles 0; commit not created.
- slice-07-context-selection: not-tested; cycles 0; commit not created.
- slice-08-context-impact: not-tested; cycles 0; commit not created.
- slice-09-artifact-envelopes: not-tested; cycles 0; commit not created.
- slice-10-actor-policy: not-tested; cycles 0; commit not created.
- slice-11-machine-facade: not-tested; cycles 0; commit not created.
- slice-12-integration-evidence: not-tested; cycles 0; commit not created.

Token counts: unavailable with current agent telemetry.

## Runtime closure — slice-01-draft-integrity

- [Full CI attempt 1](./evidence/slice-01-independent-ci-cycle-1.md): Node 22,
  958 tests, 956 passed, two failed, no skips; 83,541 ms. The governed-run and
  invalid structured-plan fixtures no longer reached their intended assertions.
  Source/fixture corrections overlapped this attempt, so it is not frozen-source
  acceptance evidence. The failed output is retained.
- Corrections preserved the original assertions: isolation markers moved inside
  valid JSON; the invalid spec-create fixture gained a Markdown identity but still
  has no structured slices array and must fail without writes.
- [Frozen-source full CI retest](./evidence/slice-01-independent-ci-cycle-2.md):
  Node 22, 958/958 passed, zero failed/cancelled/skipped/todo; 82,328 ms.
- Independent reviewer `scope_auditor` closed CR-A01-01 through CR-A01-07:
  metadata/projection integrity, canonical paths, writer guards, duplicate IDs,
  compatibility with later acknowledged selection, unknown schemas and consumer
  fixture semantics. Final targeted checks passed 24/24 core and 122/122 consumer
  tests, plus the two focused cases and `git diff --check`.

No source requirement, failed assertion or empirical gate was removed. Exact
slice-to-commit hashes are resolved from Git trailers and consolidated after
publication in the plan's integration report; no self-referential hash is invented.

## Foundation closure — slice-00-foundation

Documentary foundation completed at 2026-09-07T02:07:32.880Z; committed as this slice's
one logical foundation commit. The independent global review is terminal
READY_FOR_IMPLEMENTATION. This does not claim runtime or external acceptance.

Executed evidence: [global review and checks](../../docs/programs/quiver-v6/FOUNDATION_REVIEW.md),
[85 local gates](../../docs/programs/quiver-v6/evidence/all-slices-local-retest.md),
[schema](../../docs/programs/quiver-v6/evidence/foundation-schema-check.md),
[documentation](../../docs/programs/quiver-v6/evidence/foundation-docs-check.md).
The initial pre-commit completed-status validation required completed_at and this
explicit completed-slice reference; both metadata omissions were corrected and
its failed log retained. New runtime implement/test/review cycles: 0.
