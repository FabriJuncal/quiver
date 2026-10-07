# Experimental Development and Research Dry-run Planner

Date: 2026-10-07
Status: Documentary foundation operationally reviewed; no Director approval recorded

## Objective

Add a small headless planning module under the existing CommonJS library. Two
closed, deterministic adapters translate structured Development and Research
requests into outlines governed by one pure controller. This experiment does
not replace the CLI, planner, executor, pipeline, or any historical spec gate.

## Scope

- Version 1 JSON task and separate trusted policy/permission snapshots
- Objective, task/run/action IDs, revision, criteria, input references and hashes
- Literal resource allowlists, closed capabilities, and preventive planning budgets
- Action-level risk decisions, reasons, approval requirements, and content binding
- Deterministic examples, adversarial tests, and reproducible evidence

No filesystem or network operations, subprocesses, state creation, runtime
agents, providers, models, dynamic loaders, new dependencies, UI, commands,
execution, approval consumption, merge, deployment, or release are included.

## Contract and authority

The API is `planDryRun(task, trustedContext)`. Both arguments must contain JSON
data only. Unknown fields and malformed values fail closed. Task text and claimed
risk are untrusted. The caller is responsible for supplying authentic, current
policy, permission, resource hash/size, and classification snapshots separately;
the module does not authenticate them or read current resource contents.

Task fields: `schema_version`, `task_id`, `run_id`, `revision`, `domain`,
`objective`, `criteria`, `inputs`, `actions`, and `budgets`. Each action contains
`action_id`, `capability`, `resource_id`, `input_ids`, `criterion_ids`, `phase`,
and `claimed_risk`. Criteria have `id` and `text`; input references have `id`,
`resource_id`, and `sha256`. Arrays have unique IDs and valid internal references.

Trusted context fields: `schema_version`, `policy_id`, `policy_revision`,
`task_id`, `run_id`, `task_revision`, `resources`, `allowed_capabilities`,
`permissions`, and `budgets`. Resource entries contain `resource_id`, `path`,
`classification`, `sha256`, and `size_bytes`. Permission snapshots contain
`snapshot_id`, `revision`, and exact capability/resource grants. No wildcard or
implicit grant exists. All input resources and the action resource need grants.

The adapters support only `development.inspect`, `development.propose-change`,
`research.compare`, and `research.propose-report`, within their named domain.
They return outlines, never execute the capabilities. Inspect/compare have a
low baseline; proposed changes/reports have an intermediate baseline. Resource
classification can raise this to shared/intermediate, critical, or unknown.
Critical classes are production, data, permissions, credentials, payments,
deletion, core-architecture, and external-commitment. The model's risk claim
never lowers this classification. A higher claimed risk elevates caution; a claimed
`unknown` always requires approval even when trusted resource classification is
low. Claimed risk cannot create permissions. An invalid risk label is a malformed
contract.

Low means eligibility within the supplied snapshots only. Intermediate means
preparation only with review required before apply. Critical and unknown require
approval before the contemplated action. Missing grants, unsafe paths, missing
resources, unsupported capabilities, stale identity/hash bindings, or exceeded
budgets deny eligibility. Approval cannot override these denials.

Planning budgets are maximum action count and aggregate referenced input bytes;
each action counts its inputs, including repeated use across actions. Effective
limits are the minimum of requested and trusted limits. They are estimates from
supplied sizes, never spent-cost counters or durable reservations.

All outputs and action decisions carry `execution_authorized: false`,
`executed: false`, and `accepted: false`. Invalid contracts return stable issues
and no plan. Valid contracts expose a normalized task, closed adapter ID,
action decisions/outlines, and SHA-256 content bindings. Verification is always
`not-performed`, with every criterion `not-verified`. Planning, verification,
and human acceptance remain different states.

Binding covers normalized task content, full trusted context, controller and
adapter revisions, adapter semantics, and decisions. Object key order does not
matter; array order remains significant. Any protected content change requires
a different binding. A digest is not authentication, consent, or an execution
token. No approval store exists. Future behavioral changes must revise the
controller contract; a future executor needs separately approved safeguards.

## Acceptance criteria

- AC-01: Both domain examples pass the same controller with domain-specific outlines
- AC-02: Unknown fields, malformed/non-JSON data, duplicate IDs, and broken references fail closed
- AC-03: Missing permissions and forged low-risk claims cannot grant eligibility; critical and unknown require approval
- AC-04: Missing resources, path escapes, sensitive paths, cross-domain/unknown capabilities, and stale bindings deny
- AC-05: Requested and trusted budgets both cap all actions; aggregate overflow cannot bypass a limit
- AC-06: Deterministic content/action bindings change with protected inputs and ignore object key ordering
- AC-07: Calls do not mutate inputs and imports/calls perform zero application IO or runtime dispatch
- AC-08: All flags remain false, including eligible paths; verification and acceptance are never inferred
- AC-09: Existing tests, spec/docs/package gates pass or report exact verified blockers

## Reuse and provenance

Source baseline: Quiver `ea95409f151310f7496d99cefa2ffd9a72dd515f`.
Reuse the pure `ai/safety.js` path-exclusion helper after stricter canonical-path
validation. Reuse existing CommonJS, Zod strict-schema, Node-test, and spec/slice
conventions. The controller carries forward Quiver's default-deny and canonical
content-binding invariants without importing stateful governance modules.
`review-governance.js` reads package metadata on import; approval projection and
draft helpers create directories. Those paths are deliberately excluded.

Selected V2 provenance is the separation of proposed work, evidence-backed
verification, and acceptance, and the refusal to treat unknown results as
success. The reference is the
[V2 checker](https://github.com/FabriJuncal/quiver-v2/blob/44dcd3fd914a7344edd26c2c6c10575a2469fa5e/scripts/lib/check_execution.py).
No V2 runtime or schema compatibility is claimed and no external code is copied.

## Limits

This is a pure planner for cooperative JSON callers, not a sandbox, permission
service, content verifier, approval authority, or durable orchestrator. Paths are
checked lexically; symlinks, hardlinks, live filesystem races, and actual bytes
cannot be checked without IO. Policy freshness and authenticity are caller
obligations. There is no resource read, output artifact write, evidence ledger,
retry, reconciliation, concurrency, cancellation, or exactly-once claim.

## Slices

- `slice-00-planning-contract`: documentary foundation and operational review
- `slice-01-headless-planner`: bounded implementation, tests, examples, and evidence

One commit and draft PR per slice. Slice 01 depends on the reviewed documentary
foundation. Repository merge, Director approval, and product acceptance are not
asserted by local validation or operational review.
