# EXECUTION_BRIEF — slice-05-brain-store

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Create typed and governed Project Brain records.

## Scope

- Automatically initialize a usable Brain in newly initialized projects; provide lazy additive setup for existing projects without rewriting user files.
- Implement canonical append-only typed records with stable IDs, source refs/digests, ISO time, authority, validity, supersedes and provenance.
- Store durable knowledge separately from disposable search index and execution state. One lock-protected writer updates projections atomically.
- Enforce policy > approved decision > requirement > authorized input > agent assumption; replacement never silently changes authority.
- Implement the CONTRACTS.md authority bootstrap with an injected trusted resolver; absent resolver or v58 unverified local identity cannot write privileged records. Initial setup creates an empty store only.
- Reject secret-bearing input before any persistence using shared secret checks, structured credential fields and explicit exclusion of operational state; never silently sanitize a contractual record.

- Implement CloudDecisionReceipt validation and the optional trusted read-only evidenceResolver from CONTRACTS.md alongside the unchanged v58 verifier; bind the exact proposed record digest, subject, actor and policy before authority elevation.
- Revalidate receipt authority for read/export projections and idempotent replays; preserve historical bytes while revoked, expired, stale or unavailable authority cannot remain effectively active.

## Acceptance Criteria

- Init creates Brain without Obsidian and does not overwrite existing knowledge.
- Replacement decision is current; previous record remains historical; broken/cyclic supersedes rejected.
- Credential fixtures, ephemeral leases/tool logs and traversal/symlink targets never persisted.
- Concurrent appends preserve both records or return lock conflict; stale index rebuild never changes authority.

- CASE-A-05-X03-1: A current allowed receipt for the exact record/subject/project/policy permits an append by a separately authorized writer; the stored record retains its approval_ref and original deciding actor provenance.
- CASE-A-05-X03-2: Missing resolver, rejected/revoked/expired receipt, changed payload, foreign scope, forged actor evidence or a valid checksum without canonical source evidence fails before record/journal writes.
- CASE-A-05-X03-3: Revocation after append remains visible through historical reads but cannot appear active; operation replay after authorization refresh does not create a second record.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/brain/store.js`
- `src/create-quiver/lib/brain/schema.js`
- `src/create-quiver/lib/brain/authority.js`
- `src/create-quiver/lib/init-layout.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/index.js`
- `tests/lib/brain-store.test.js`
- `tests/lib/init-layout.test.js`
- `tests/commands/init-profiles.test.js`
- `specs/quiver-init-a-engine-trust/**`

The direct init-layout inventory test is in scope because Brain manifest, index,
and record-directory entries became part of the minimal init plan. This verifies
the same bounded initialization surface without expanding runtime ownership.

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-store.test.js tests/commands/init-profiles.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
