# Execution plan — Initiative A

State: IN_PROGRESS. All seven specs passed independent cross-review before
runtime. Slices 01 and 05 are closed in their logical commits; remaining runtime dependencies
and whole-plan integration acceptance are still required.

| Slice | Purpose | Depends on |
|---|---|---|
| slice-00-foundation | Executable foundation and inherited V58 verification | none |
| slice-01-draft-integrity | Preserve draft history and detect structural content loss | slice-00-foundation |
| slice-02-draft-recovery | Recover and approve an earlier still-valid draft | slice-01-draft-integrity |
| slice-03-effective-amendments | Build deterministic addendum and amendment contracts | slice-02-draft-recovery |
| slice-04-draft-cli | Expose complete draft lifecycle through the CLI | slice-03-effective-amendments |
| slice-05-brain-store | Create typed and governed Project Brain records | slice-00-foundation |
| slice-06-brain-vault | Export, inspect and manage the open knowledge vault | slice-05-brain-store |
| slice-07-context-selection | Select bounded explainable and trust-separated context | slice-06-brain-vault |
| slice-08-context-impact | Detect contradictions, affected areas and stale context | slice-07-context-selection |
| slice-09-artifact-envelopes | Version artifacts, lineage and offline verification | slice-04-draft-cli, slice-08-context-impact |
| slice-10-actor-policy | Expose verifiable actor authorization and policy explanation | slice-09-artifact-envelopes |
| slice-11-machine-facade | Publish the canonical Engine facade and machine command results | slice-10-actor-policy |
| slice-12-integration-evidence | Verify A as an integrated dependency and prepare its PR | slice-11-machine-facade |

Parallel opportunity: slices 01 and 05 after documentary foundation; separate
worktrees and explicit file ownership. The dispatcher work in 04 and 06 is
serialized. Metadata and final docs have a single coordinator. Each slice owns
one logical commit; fixes are folded into that commit before dependent work.

DEC-A-011 (2026-09-07): after 01 and 05 pass integration, 02 and 06 may run in
parallel. Their product write sets are disjoint: draft/approval services and
`commands/ai.js` versus Brain/vault services and the top-level command registry.
Each agent owns only its slice documentation/evidence; the coordinator serializes
shared status/traceability updates. No dependency is removed. Slices 04 and 06
still serialize their shared dispatcher surface. Reason: verified ownership
permits safe overlap without treating shared code as artificially independent.

DEC-A-012 (2026-09-12): recover the existing program branches into persistent,
already excluded project-local worktrees after the former temporary directories
were observed missing. Preserve the missing worktrees' Git metadata and all
committed history. Reimplement only the uncommitted A02/A06 work not retained by
Git, and revalidate committed A01/A05 before integration. Reason: avoid dependence
on temporary-directory lifetime without changing scope or acceptance.
See [recovery evidence](./evidence/recovery-20260912.md).

DEC-A-013 (2026-09-12): extend the verified ownership rule to the remaining two
pre-envelope tracks: draft 02 → 03 → 04 and Brain/context 06 → 07 → 08.
All declared dependencies remain prerequisites. Comparing their actual
allowed_write_paths shows that 04/06 share the dispatcher, registry, i18n and
command reference and must serialize. Other cross-track pairs have disjoint
product write sets; shared spec files still have one coordinator. This permits
03 to start after 02 even if 06 is unfinished, and 04 to overlap 07/08 only after
06 has integrated. Slice 09 remains the synchronization barrier for both tracks.
Each integrated slice receives directed regression on its actual upstream;
file disjointness is not a claim of already verified behavioral compatibility.
Reason: continue the dependency-critical path without waiting on unrelated
implementation, while retaining the real CLI contention constraint.
Independent reviewer `draft_recovery_review` checked the modified metadata and
computed cross-track product allowlist intersections: only 04/06 overlaps at
the four declared surfaces. Dependencies are unchanged; bounded scheduling
review approved without reopening the terminal specification review.

PR branch: `feature/QUIVER-INIT-A-engine-trust`, base: `main`. Merge remains human after global validation.
