# Execution plan — Initiative A

State: SPEC_DRAFT. All specs must pass independent cross-review before runtime.

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

PR branch: `feature/QUIVER-INIT-A-engine-trust`, base: `main`. Merge remains human after global validation.
