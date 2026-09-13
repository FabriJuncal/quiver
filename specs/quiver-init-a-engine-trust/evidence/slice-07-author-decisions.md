# A07 author decisions — bounded context selection

Source base: `26fc2db1d0f72f40333d1269ec0a4e148f53057c`.
State: implemented and author-tested; final independent review pending.

## Deterministic selection contract

- A Task is the exact strict CONTRACTS.md shape. Relevance is structural only:
  record payloads may declare `requirement_ids` and `module_paths` arrays, and
  matching uses exact IDs/relative paths. Question or arbitrary prose never
  promotes a record.
- Mandatory refs bind canonical Brain record ID and digest. An optional locator,
  when supplied, must match the canonical locator. Alias duplicates with the same
  ID and digest are rejected.
- Candidates are ordered by mandatory status, normative authority precedence and
  ordinal canonical-ref bytes. Every canonical record ref appears exactly once
  in selected or excluded; excluded records contribute metadata and a reason,
  never content.
- `ContextContent.content` is the canonical JSON record payload. Entry bytes are
  the UTF-8 length of that canonical payload. Mandatory content is budgeted first
  and blocks with `CONTEXT_BUDGET_EXCEEDED`; optional relevant content is omitted
  with an explicit reason rather than truncated.
- Confidence never invents a numeric score. Deterministic sources use null score;
  basis is `evidence` only when exact record/authority evidence refs exist and is
  otherwise `unknown`.

## Time and authority

- `created_at` is sampled exactly once from the context service's injected clock
  for each successfully constructed manifest and participates in its canonical
  digest. With identical input, authorized snapshot and frozen clock, the entire
  manifest repeats exactly. Calls at different real times truthfully receive a
  different timestamp/digest; no cache or backdating pretends otherwise.
- `context.select` requests the exact `context.read` grant through the A05/A06
  complete authorized snapshot. Receipt authority is resolved afresh for every
  selection. A current receipt-backed approved decision may be trusted; revoked,
  stale or unavailable optional knowledge is excluded, while a mandatory
  approved record blocks with the safe authority reason.
- Trusted instructions contain only active policy, requirement or revalidated
  approved-decision authority. Other selected payloads remain untrusted content.
  Prompt JSON escapes delimiter characters, so source text cannot close its
  untrusted section.

## Context-pack compatibility and boundaries

- The existing synchronous `buildContextPackMetadata` result is unchanged when
  no manifest is supplied. The new async Result-v1 adapter calls the context
  selector, then gives its in-process digest brand to the existing builder.
  Cloned, caller-created or post-selection-mutated manifests cannot enter the
  trusted prompt path.
- Legacy fallback occurs only when the selector reports capability unavailable
  and the canonical Brain namespace is safely verified absent. An initialized
  but missing/corrupt record, unsafe/symlinked namespace, policy failure or a
  quarantined Brain never falls back. Legacy results use `manifest:null` and
  `evidence_status:unverified`; they are not labelled Brain-verified.
- A08 owns contradictions, context verification, source-staleness enforcement and
  executor/provider wiring. A07 emits an empty contradictions array and the
  manifest-aware pack seam that A08 can consume after fresh verification.

## Review findings closed

- ROOT-A07-01 (static): the initial internal manifest builder was exported and
  could issue the private authorization brand without a real selector call. It
  is now private; only `context.select` can brand after an authorized snapshot.
- ROOT-A07-02 (static): schema validation cloned a branded manifest, and the
  renderer then rejected that unbranded clone. Validation now preserves and
  returns the original verified identity; no brand is propagated to clones.
- ROOT-A07-03 (runtime): an A-authorized context service could attach its trusted
  manifest to a B-root pack. The private provenance now binds digest, canonical
  project root and Brain project UUID. Both sync and async pack paths validate
  scope before reading project scan metadata. The independent [failure
  probe](./slice-07-project-binding-before.md) and [passing
  retest](./slice-07-project-binding-after.md) preserve the observed transition.

## Executed evidence

- [Focal first pass](./slice-07-author-targeted-01.md): 15/15 passed.
- [Focal retest after author review](./slice-07-author-targeted-02.md): 15/15 passed.
- [Focal retest after ROOT-A07-03](./slice-07-author-targeted-03.md): 16/16 passed.
- [Legacy consumer first pass](./slice-07-author-consumers-01.md): 89/89 passed.
- [Legacy consumer final author retest](./slice-07-author-consumers-02.md): 89/89 passed.

These are fixture-backed Engine tests, not evidence of live Cloud authority or a
provider invocation. No full-suite or independent-review claim is made here.
