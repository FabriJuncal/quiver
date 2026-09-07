# Quiver Evidence

- Command: `/Users/fabrijk/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node --test tests/lib/brain-store.test.js`
- Exit code: 0
- Duration ms: 1431
- Started at: 2026-09-07T02:47:39.388Z
- Finished at: 2026-09-07T02:47:40.820Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: empty Brain initialization is stable and idempotent
ok 1 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 62.268583
  type: 'test'
  ...
# Subtest: protected operations do not lazily recreate an absent Brain
ok 2 - protected operations do not lazily recreate an absent Brain
  ---
  duration_ms: 3.324166
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 3 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 448.091208
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 4 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 109.971792
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 5 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 79.326
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 6 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 43.942375
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 7 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 21.587083
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 8 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 31.779042
  type: 'test'
  ...
# Subtest: the supported local v58 decision representation binds the exact approved artifact
ok 9 - the supported local v58 decision representation binds the exact approved artifact
  ---
  duration_ms: 0.570042
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 10 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 28.4315
  type: 'test'
  ...
# Subtest: concurrent appends either serialize or return an explicit lock conflict
ok 11 - concurrent appends either serialize or return an explicit lock conflict
  ---
  duration_ms: 59.529417
  type: 'test'
  ...
# Subtest: read-only v58 compatibility blocks every Brain writer before mutation
ok 12 - read-only v58 compatibility blocks every Brain writer before mutation
  ---
  duration_ms: 27.306709
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 13 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 35.629375
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 14 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 18.24575
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 15 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 67.396125
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 16 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 66.690916
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 17 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 78.999792
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 18 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 69.526459
  type: 'test'
  ...
1..18
# tests 18
# suites 0
# pass 18
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1389.58225

````

## Stderr

````text

````
