# Quiver Evidence

- Command: `/opt/homebrew/opt/node@22/bin/node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`
- Exit code: 0
- Duration ms: 799
- Started at: 2026-09-13T00:45:38.048Z
- Finished at: 2026-09-13T00:45:38.848Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 1 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 1.00975
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 2 - executor defaults to slice and never full
  ---
  duration_ms: 0.321125
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 3 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 0.965125
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 4 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 0.130041
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 5 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.077833
  type: 'test'
  ...
# Subtest: authorized selector output augments the existing pack with injection-safe structured context
ok 6 - authorized selector output augments the existing pack with injection-safe structured context
  ---
  duration_ms: 122.832583
  type: 'test'
  ...
# Subtest: new async pack adapter falls back only for a verified absent Brain namespace
ok 7 - new async pack adapter falls back only for a verified absent Brain namespace
  ---
  duration_ms: 1.508666
  type: 'test'
  ...
# Subtest: initialized Brain corruption never downgrades to a legacy context pack
ok 8 - initialized Brain corruption never downgrades to a legacy context pack
  ---
  duration_ms: 37.816792
  type: 'test'
  ...
# Subtest: async pack adapter preserves policy and schema failures instead of falling back
ok 9 - async pack adapter preserves policy and schema failures instead of falling back
  ---
  duration_ms: 25.142208
  type: 'test'
  ...
# Subtest: context selection is deterministic, bounded, explainable, and trust-separated
ok 10 - context selection is deterministic, bounded, explainable, and trust-separated
  ---
  duration_ms: 230.092958
  type: 'test'
  ...
# Subtest: mandatory overflow blocks while optional relevant knowledge is explicitly excluded
ok 11 - mandatory overflow blocks while optional relevant knowledge is explicitly excluded
  ---
  duration_ms: 155.331834
  type: 'test'
  ...
# Subtest: task and Context Manifest schemas reject unknown, unsafe, and forged values
ok 12 - task and Context Manifest schemas reject unknown, unsafe, and forged values
  ---
  duration_ms: 61.91675
  type: 'test'
  ...
# Subtest: context selection fails closed and requests the exact context.read grant
ok 13 - context selection fails closed and requests the exact context.read grant
  ---
  duration_ms: 22.658333
  type: 'test'
  ...
# Subtest: receipt authority is refreshed for every selection and revocation cannot remain trusted
ok 14 - receipt authority is refreshed for every selection and revocation cannot remain trusted
  ---
  duration_ms: 69.280375
  type: 'test'
  ...
# Subtest: invalid selection metadata is never interpreted semantically or promoted by free text
ok 15 - invalid selection metadata is never interpreted semantically or promoted by free text
  ---
  duration_ms: 62.889584
  type: 'test'
  ...
1..15
# tests 15
# suites 0
# pass 15
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 732.099209

````

## Stderr

````text

````
