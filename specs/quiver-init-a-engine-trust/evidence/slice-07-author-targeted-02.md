# Quiver Evidence

- Command: `/opt/homebrew/opt/node@22/bin/node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`
- Exit code: 0
- Duration ms: 800
- Started at: 2026-09-13T00:47:37.509Z
- Finished at: 2026-09-13T00:47:38.310Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 1 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 1.000875
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 2 - executor defaults to slice and never full
  ---
  duration_ms: 0.314291
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 3 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 1.052125
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 4 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 0.135417
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 5 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.070583
  type: 'test'
  ...
# Subtest: authorized selector output augments the existing pack with injection-safe structured context
ok 6 - authorized selector output augments the existing pack with injection-safe structured context
  ---
  duration_ms: 124.308042
  type: 'test'
  ...
# Subtest: new async pack adapter falls back only for a verified absent Brain namespace
ok 7 - new async pack adapter falls back only for a verified absent Brain namespace
  ---
  duration_ms: 2.48875
  type: 'test'
  ...
# Subtest: initialized Brain corruption never downgrades to a legacy context pack
ok 8 - initialized Brain corruption never downgrades to a legacy context pack
  ---
  duration_ms: 37.50725
  type: 'test'
  ...
# Subtest: async pack adapter preserves policy and schema failures instead of falling back
ok 9 - async pack adapter preserves policy and schema failures instead of falling back
  ---
  duration_ms: 25.880292
  type: 'test'
  ...
# Subtest: context selection is deterministic, bounded, explainable, and trust-separated
ok 10 - context selection is deterministic, bounded, explainable, and trust-separated
  ---
  duration_ms: 237.780458
  type: 'test'
  ...
# Subtest: mandatory overflow blocks while optional relevant knowledge is explicitly excluded
ok 11 - mandatory overflow blocks while optional relevant knowledge is explicitly excluded
  ---
  duration_ms: 148.753042
  type: 'test'
  ...
# Subtest: task and Context Manifest schemas reject unknown, unsafe, and forged values
ok 12 - task and Context Manifest schemas reject unknown, unsafe, and forged values
  ---
  duration_ms: 64.997667
  type: 'test'
  ...
# Subtest: context selection fails closed and requests the exact context.read grant
ok 13 - context selection fails closed and requests the exact context.read grant
  ---
  duration_ms: 20.858125
  type: 'test'
  ...
# Subtest: receipt authority is refreshed for every selection and revocation cannot remain trusted
ok 14 - receipt authority is refreshed for every selection and revocation cannot remain trusted
  ---
  duration_ms: 69.405708
  type: 'test'
  ...
# Subtest: invalid selection metadata is never interpreted semantically or promoted by free text
ok 15 - invalid selection metadata is never interpreted semantically or promoted by free text
  ---
  duration_ms: 60.769833
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
# duration_ms 732.549125

````

## Stderr

````text

````
