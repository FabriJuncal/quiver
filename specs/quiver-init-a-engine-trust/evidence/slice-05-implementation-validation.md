# Slice 05 implementation validation

Date: 2026-09-06

Runtime: Node.js 22.22.2 (native Homebrew Node 22)

## Required combined command

Command:

`PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 /opt/homebrew/opt/node@22/bin/node --test tests/lib/brain-store.test.js tests/commands/init-profiles.test.js`

Final result after all X03 vectors were added: PASS — 43 tests, 43 passed,
0 failed, 0 skipped, 0 todo; 65.3 seconds.

Coverage includes explicit stable init, missing-store no-write behavior, all typed
records, immutable supersession, CAS/idempotency, exact grants, secret and runtime
state rejection, fact and approval binding, mutex conflict, read-only writer gates,
symlink containment, index rebuild, journal recovery and Cloud receipt revocation.

The final focal Brain command used the same Node 22 and locale prefix with
`tests/lib/brain-store.test.js` only. Result: PASS — 18/18, 0 failed/skipped;
1.48 seconds. The final Cloud vectors explicitly cover fresh authorization on
successful replay, revoked replay denial, missing resolver, foreign project and
forged actor evidence that is absent from the receipt evidence set.

## Direct init consumers

Command:

`PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 /opt/homebrew/opt/node@22/bin/node --test tests/lib/init-layout.test.js tests/lib/init-docs.test.js`

Result: PASS — 24 tests, 24 passed, 0 failed, 0 skipped, 0 todo; 0.59 seconds.

## Actual cycles and failures

1. Initial schema, authority, store and init integration reached 14/14 focal tests.
2. Independent review found two required security defects: arbitrary facts could
   rely on unrelated valid bytes, and symlinked canonical directories could receive
   writes before detection. Exact observed-digest facts, exact v58 artifact binding,
   pre-write namespace validation and negative regressions closed both findings.
3. The first combined init run passed 41/43. Both failures showed migration
   postflight repeatedly planning Brain because the safe simulation snapshot omitted
   the existing store. Copying `.quiver/brain` only after canonical namespace
   validation closed the issue; focal rerun passed 2/2 and full rerun passed 43/43.
4. Final test-only acceptance augmentation added the explicit X03 replay,
   missing-resolver, foreign-scope and forged-actor-evidence vectors. Runtime
   product source remained frozen; focal 18/18 and combined 43/43 passed.

## Independent regression

The coordinator's frozen-source full Node 22 run passed 963/963 with no failures
or skips in 78.3 seconds. Raw evidence is stored in
`slice-05-independent-ci-cycle-1.md`.

## Final source fingerprint

SHA-256 fingerprints at final validation:

- `schema.js`: `b882af25f1f5df30c6728ea828f7406e12668e4992122f91e4d272781162fee1`
- `authority.js`: `4cc4336b2b6901d233db4ce9ff43673414e2f25c2031549f57e895f6d78c721a`
- `store.js`: `5da4f2e808590893c7ee8e0e357c57d918f2cff5be5c8a9dead93e1fc8338ee2`
- `init-layout.js`: `9a1ff871c72341843932133bb5159dda3d322985cb90e3341b156637afdba5af`
- `init-docs.js`: `beec9e1f2d95a9fba8f9985fa83ad34d21b28c3c861892fa69d961b6a2e4d4a9`
- `brain-store.test.js`: `3dd1c73ee85846891d1a26d5798809b626635353202151836206efcdbceabf4e`
- `init-profiles.test.js`: `0dfd038a134bf4a32db6d5b41b6a0fbf24258e308b7a1635f70c0d073bbdbb5e`
- `init-layout.test.js`: `92845d38157de508a4282baf42ed4a7434ceb43e2cee6c166da0bd103d48a44e`

`git diff --check` passed after the evidence and slice-document updates.
