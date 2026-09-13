# Independent review — A07 context selection

Reviewer: root, independent of `brain_vault_impl`. Source base: `26fc2db`.
State: APPROVED for slice scope. One complete source/test review, followed only
by verification of required corrections. No mandatory findings remain.

## Required findings and closure

| Finding | Evidence and consequence | Correction verified |
|---|---|---|
| ROOT-A07-01 | Static review found an exported builder able to brand a raw snapshot without authorized selection. | Builder is private; trusted manifests originate only from the authorized selector. |
| ROOT-A07-02 | Static review found schema parsing cloned the manifest and lost its private identity before prompt rendering. | Validation checks the parsed shape but returns the original branded object; real selected-pack positive tests pass. |
| ROOT-A07-03 | Independent runtime probe selected policy from project A while requesting a pack for B; only A had been authorized. | Private brand binds canonical root and project UUID. Selector validates its snapshot scope; pack building rejects a foreign root before project metadata reads. The same probe now returns POLICY_DENIED with null data and no trusted records. |

The first two findings were fixed within the first author cycle before its first
test run; no runtime failure is claimed for those static findings. The third
finding was reproduced and retested with the same retained independent probe.
Only the asserted retest is closure evidence; the diagnostic's original exit 0
merely indicates the probe executed.

## Executed and checked

- [Independent frozen focal and consumer tests](./slice-07-independent-final.md):
  105/105 passed, zero failures/cancellations/skips/todo, 8,882 ms command time.
  These include 16 context/pack cases and 89 existing scan, onboarding, planning
  and execution consumers. The log records the exact command and timestamps.
- [Cross-project failure](./slice-07-project-binding-before.md) and
  [asserted retest](./slice-07-project-binding-after.md), using the retained
  [portable isolated probe](./slice-07-project-binding-probe.cjs).
- Source inspection covered strict Task/Manifest shape, deterministic structural
  relevance, exact payload-byte budgets, mandatory overflow, trusted/untrusted
  separation, current receipt checks, absent-only legacy fallback and actual
  context-pack consumption. Tests exercise malformed/forged/modified manifests,
  wrong grants, revoked/unavailable authority and injection delimiter escaping.

## Limits and handoff

Three author implement/test/review/fix cycles are recorded in the author logs.
The final independent 105-test command ran once. Per-agent token usage and full
development duration are unavailable from reliable telemetry.

A08 owns contradiction/impact analysis, persisted verification and fresh executor
checks before providers/writes. This approval does not claim that later behavior,
live Cloud receipt verification, empirical gates or whole-plan integration.
Coordinator metadata, scope checks and integration precede the one logical commit.
