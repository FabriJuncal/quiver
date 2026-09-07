# EXECUTION_BRIEF — slice-11-machine-facade

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Publish the canonical Engine facade and machine command results.

## Scope

- Publish createEngine({projectRoot,actorResolver,evidenceResolver,clock}) with version:'1' and envelope/policy/brain/context services specified in SPEC.md.
- Give new A commands canonical result schema version 1 with stable code/data/errors/evidence_status, human projection from same result and no banner in JSON.
- Classes: validation=2, policy=3, capability=4, runtime=5, security=6, conflict=7, budget=8; retain legacy command exit compatibility unless explicitly enveloped.
- Support artifact verify and policy explain entrypoints and complete brain/context/draft result parity.
- Core service never imports Cloud; adapters use this facade rather than internal storage.

- Pass the optional trusted evidenceResolver only from the Engine constructor to authority, query/export and context services; method inputs cannot replace it. Freeze Cloud receipt success, unavailable, tamper, revocation and idempotent-retry consumer vectors without changing Result or legacy behavior.

## Acceptance Criteria

- Facade methods share same canonical values as human/JSON CLI; JSON keys unaffected by locale.
- All error classes mapped reproducibly with actual negative cases and exits.
- Cloud-style caller cannot choose authenticated actor by request body; resolver context binds identity.
- Legacy commands preserve existing tests and exit expectations.

- CASE-A-11-X03: Installed facade consumers validate a scoped allowed receipt through an injected fixture resolver; missing/body-supplied resolver, rejected or revoked receipt and changed knowledge digest fail closed. A later revocation invalidates context even when all source bytes remain unchanged.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/engine.js`
- `src/create-quiver/lib/protocol/result.js`
- `src/create-quiver/commands/brain.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/command-registry.js`
- `src/create-quiver/lib/i18n/**`
- `tests/lib/engine.test.js`
- `tests/commands/engine-contract.test.js`
- `docs/reference/commands.md`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/engine.test.js tests/commands/engine-contract.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
