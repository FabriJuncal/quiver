# Inventory and execution waves — Quiver v6

State: IN_PROGRESS. Baseline: `75fef298`.

## Current plan inventory

| Plan | Version | Source blocks | RQs | Status at source | Execution disposition |
|---|---|---|---:|---|---|
| A | 1.0.2 | V58, V59, V60, V61, V62 | 46 | approved | Reviewed foundation; runtime pending |
| B | 1.0.2 | V63, V64, V65, V66, V67, V68, V69, V70 | 80 | approved | Reviewed foundation; runtime pending |
| C | 1.0.2 | V71, V72, V73, V74, V75, V76 | 48 | approved | Reviewed foundation; runtime pending |
| D | 1.0.2 | V77, V78, V79, V80, V81 | 46 | approved | Reviewed foundation; runtime pending |
| E | 1.0.2 | V82, V83, V84, V85 | 40 | approved | Reviewed foundation; runtime pending |
| F | 1.0.3 | V86, V87, V88 | 22 | approved | Reviewed foundation; runtime pending |
| G | 1.0.2 | V89, V90, V91, V92 | 32 | approved | Reviewed foundation; runtime pending |
| Master | 6.0.22 | Global dependencies | 314 referenced | proposed | Program input, not duplicate implementation |
| WORKFLOW-001 | 1.0.0 | Documentary governance | separate historical scope | completed | Existing contract inventoried; docs checks passed |

Superseded revisions are historical audit inputs. The 314 unique RQ headings were
independently counted with no sequence gaps. V58 has 8 inherited implemented RQs;
34 source blocks and 306 RQs require new behavior. Historical v36/v44 source specs
remain separately pending; they are not additional current docs/plans entries
and must not be marked complete or silently removed by this program.

## Execution waves

| Wave | Source scope | Required inputs | Parallel work | Synchronization |
|---|---|---|---|---|
| 0 | Seven documentary foundations | All current plans, V58 baseline | Root A; architect B–D; delivery planner E–G; independent auditor | All-spec audit and foundation commits |
| 1 | A: V59 and V60 | V58 verification | Draft modules and Brain modules in isolated worktrees | Serialize CLI/registry; preserve single writers |
| 2 | A: V61 then V62 | Brain then effective drafts/context | Independent test/review against fixed revisions | Freeze Engine facade before B |
| 3 | B: V63 → V70 | Verified A facade | Tests/review and bounded independent feature views only | Identity, store, QA/PR/preview SHA and Brain reconciliation |
| 4 | C: V71 → V76 | B plus actual G1/G2 evidence for activation/readiness | Read-only adapter fixtures vs reviewer | Tenant scope, provenance, findings, Check authority |
| 5 | D: V77 → V81 | C plus actual G3 and runtimes | Adapter conformance tests vs review | Runtime generations, grants, leases, evals, cost |
| 6 | E: V82 → V85; F: V86 research | D, G4/demand evidence where required | E builder modules and F comparison if write sets disjoint | E release contract; evidence-backed G5 |
| 7 | F: V87 if justified; V88 | G5; V74/V79/V85; V87 only if consumed | Operations with existing mechanism may be independent | No false V87 completion for DO_NOT_BUILD |
| 8 | G: V89–V92 | Each declared technical dependency and demand | G blocks independent only after own gates; shared router serialized | Cross-plan and simulated merge-order audit |

A wave is not permission to claim passed business gates. Program preparation and
inactive code readiness are distinguished from complete requirement acceptance.
If prerequisite evidence is unavailable, that obligation stays explicitly open.

## Shared-file ownership

- Root owns global program manifests, decision log, root docs/index and final
  branch integration. Drafting agents own only assigned spec directories.
- A owns approval storage, immutable envelopes/digests, Brain, context and the
  Engine facade. Later plans consume these contracts rather than duplicate them.
- B owns Cloud platform storage, auth/ActorContext, routing and visual baseline.
- C owns ingest/provenance, findings, policy/check adapters and evidence bundles.
- D owns runtime capabilities, grants, generations, checkpoints, fencing and cost.
- E/F/G own their feature modules and explicit platform extensions. They request
  serialized shared-file changes through the coordinator.

## Baseline validation

Executed on the original unchanged main checkout:

Baseline logs are committed as lossless .log.gz artifacts to keep PR diffs
reviewable. Read one with `gzip -dc <artifact.log.gz>`; original uncompressed
copies remain in the local evidence directory and are ignored by Git.

| Command | Observed result | Evidence |
|---|---|---|
| npm run test:ci with inherited es_AR locale | Exit 1; English assertions received Spanish; 86s | [Original raw log](./evidence/baseline/test-ci.log.gz) |
| LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm run test:ci | Exit 0; 944 tests passed, 0 failed/skipped; 91s wall | [Raw log](./evidence/baseline/test-ci-en.log.gz), [metadata](./evidence/baseline/test-ci-en-summary.json) |
| npm run docs:check | Exit 0; 13s | [Log](./evidence/baseline/docs-check.log.gz) |
| npm run schema:slice:check | Exit 0; 309 valid, 1 historical skipped, 4 expected invalid fixtures | [Log](./evidence/baseline/schema-slice-check.log.gz) |
| English locale; npx --yes --package=node@20.12.0 node scripts/ci/run-node-tests.js | Exit 1; 943/944 pass, ux-flags plan --json child exit mismatch; 82s | [Log](./evidence/baseline/test-ci-node20.log.gz), [metadata](./evidence/baseline/test-ci-node20-summary.json) |
| English locale; Node 20 isolated ux-flags | Exit 0; 8/8 pass | [Log](./evidence/baseline/node20-ux-flags-rerun.log.gz) |
| English locale; Node 20 full suite with --test-concurrency=1 | Exit 0; 944/944 pass, no failed/skipped/cancelled; 207s wall | [Log](./evidence/baseline/test-ci-node20-serial.log.gz), [metadata](./evidence/baseline/test-ci-node20-serial-summary.json) |

Initial failure example: assertion expected /AI agent profile saved/ but actual
output was Perfil de agente IA guardado. The English rerun passed without source
changes. Treat English locale as a reproducible baseline-test precondition.
Raw marker counts from the failed log are not treated as authoritative TAP totals.

Environment observed: Node v25.9.0, npm 11.12.1, gh 2.92.0; package supports
Node >=20.12.0. Node 20.12 was checked as above; Node 22 remains a later check.
The Node 20 parallel-only failure was not reproduced in isolation or in the full
serial run. Shared-root interference is inferred from test source and timing,
not established as a proven root cause or fixed. No tests were disabled or
product source changed. Preserve both the failed and successful evidence.
Known token/private-key patterns were scanned in 13 baseline artifacts before
publication; no pattern hits were found. This bounded scan is not proof that no
possible sensitive information exists.
General build/typecheck/ESLint commands are absent at baseline, so none are claimed.
No real provider run, Cloud deployment or live service account verification was
performed by these baseline checks.

## Merge strategy

```text
PR-A → PR-B → PR-C → PR-D → PR-E → PR-F → PR-G
```

PR numbers are assigned only after gh actually creates them. Each PR targets the
previous branch during development. Preserve slice commits when merging (avoid
squashing several slices into one). After each merge, retarget the next PR to main,
verify its upstream SHA and rerun its directed checks. Resolve conflicts on the
owning branch and repeat review of the affected contract. Final integration tests
run on the full G stack and in a clean merge-order worktree before handoff.
