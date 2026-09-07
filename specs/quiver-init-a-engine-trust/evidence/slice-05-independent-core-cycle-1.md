# Quiver Evidence

- Command: `/Users/fabrijk/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node --test tests/lib/brain-store.test.js`
- Exit code: 0
- Duration ms: 2632
- Started at: 2026-09-07T02:29:53.837Z
- Finished at: 2026-09-07T02:29:56.471Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: empty Brain initialization is stable and idempotent
ok 1 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 56.173167
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 2 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 877.613833
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 3 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 239.055958
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 4 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 193.453541
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 5 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 116.201041
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 6 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 74.25525
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 7 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 68.946542
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 8 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 66.54425
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 9 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 101.361542
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 10 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 56.116708
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 11 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 153.297625
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 12 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 142.969708
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 13 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 115.637041
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 14 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 136.687292
  type: 'test'
  ...
1..14
# tests 14
# suites 0
# pass 14
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2584.464541

````

## Stderr

````text

````
