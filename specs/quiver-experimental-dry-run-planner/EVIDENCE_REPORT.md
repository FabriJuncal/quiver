# Experimental Planner Evidence

## slice-00-planning-contract

Documentary foundation operationally reviewed on 2026-10-07. Clarification:
higher or unknown claimed risk can raise caution and never reduce it. There is
no Director approval, product acceptance, repository merge, or real execution.

Validation on Linux / Node v24.19.0 (all exit 0):

- `node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict`: two valid slices, no warnings
- `npm run schema:slice:check`: pass; one existing legacy v18 fixture skipped
- `node bin/create-quiver.js slice check --local specs/quiver-experimental-dry-run-planner/slices/slice-00-planning-contract/slice.json`: pass
- `node_modules/.bin/markdownlint-cli2 'specs/quiver-experimental-dry-run-planner/**/*.md'`: 11 files, zero errors
- `git diff --check`: pass

## slice-01-headless-planner

Candidate implementation validation on Linux / Node v24.19.0:

- `node --test tests/lib/planning-dry-run.test.js`: 138 passed, zero failed
- Independent read-only review: 21 adversarial probes passed, including 116 risk/budget combinations; original malformed-array, proxy, reserved-key, and expansion repros are now covered by integrated regression tests
- `npm run docs:check`: exit 0; Markdown, local links, and 62-command reference synchronized
- `npm run changelog:check`: exit 0
- Explicit Markdown checks across this spec and the API reference: 12 files, zero errors
- `npm run schema:slice:check`: exit 0; existing legacy v18 fixture remains skipped
- `npm run package:quiver`: exit 0; package boundary and installed CLI smoke passed
- `git diff --check`: exit 0

First full-suite run: 1,104 passed, one migration-idempotence failure. Repository
documentation was being edited concurrently, so that run is not final evidence.
The unchanged isolated migration-idempotence test then passed. The next frozen full-suite run passed all runtime tests but found a slice
metadata enum mistake: `in_progress` is unsupported. The metadata was corrected
to `ready` during validation and is now `completed` for implementation closure.
The final frozen full-suite run passed: 1,105 tests, zero failures or skips,
exit 0 (`npm run test:ci`). The final source and test files are identical to
the independently reviewed candidate.
The scope check also required exact example filenames rather than a glob in
the legacy readiness checker; the slice now declares both exact paths.

The isolated import test allows only Node crypto/util/path, installed Zod, and
the existing pure safety helper. It cannot import filesystem, network, process,
providers, executors, state, or timers. Both domain calls pass in that isolated
context. Host process/dependencies remain trusted; this is not an OS sandbox.

All task output execution and acceptance flags remain false. Test success
verifies this module's behavior, not the example tasks or supplied file bytes.
No provider, model, network research, runtime task execution, merge, deployment,
or release was performed.


## Final candidate review and traceability

Independent review found no remaining blocking findings after regression fixes.
The runtime source SHA-256 is
`d0fe5e776ceb9ea8c23b8efa8f624c088519359575361b814f9f31cd1dea5389`;
the integrated test SHA-256 is
`87c1f94d94c95461584183fb312ea7806fab29a88e4368528727290835eaec5e`.

- AC-01: both example domains and all four capabilities use the shared controller
- AC-02: strict fields, proxies, accessors, custom/sparse arrays, aliases, reserved keys, duplicate IDs, and reference coverage fail closed
- AC-03: every critical classification, unknown/higher claims, prepare/apply phases, and missing grants are covered
- AC-04: unsafe paths, absent resources, cross-domain/unknown capabilities, and stale identity/hash bindings deny
- AC-05: both budget sources, aggregate repeated inputs, and integer overflow are covered
- AC-06: protected-field mutation, object-key order, array order, and action identity binding tests pass
- AC-07: deep-frozen input/alias tests and isolated import/call checks pass
- AC-08: all execution/acceptance flags remain false and verification remains unperformed
- AC-09: focused/full suite, schema, strict spec, scope, docs, Markdown, changelog, and installed package smoke pass

Documentary PR [#148](https://github.com/FabriJuncal/quiver/pull/148) remains draft.
Its exact SHA `f2c20206434e12806fec3cad7de5f9b6254b93f6` passed all seven CI jobs
in [run 37629498311](https://github.com/FabriJuncal/quiver/actions/runs/37629498311).
Implementation publication and remote CI are recorded separately in its draft
PR; this source commit does not predict a future remote result.


## Reproducible user smoke guide

The API reference includes an isolated-checkout guide for the exact experimental
branch and a five-case command covering Development, Research, intermediate
risk, unknown risk, and missing permissions. The command was extracted verbatim
from the Markdown and executed against the final library. Its five JSON lines
matched the documented expected output exactly. Source/test hashes did not
change. Setup creates a separate checkout/dependencies/cache; the planner and
manual cases do not modify user projects or perform the contemplated tasks.
