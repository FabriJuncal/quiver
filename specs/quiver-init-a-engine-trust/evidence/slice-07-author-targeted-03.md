# Quiver Evidence

- Command: `/opt/homebrew/opt/node@22/bin/node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`
- Exit code: 0
- Duration ms: 855
- Started at: 2026-09-13T00:52:06.602Z
- Finished at: 2026-09-13T00:52:07.458Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 1 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 0.993667
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 2 - executor defaults to slice and never full
  ---
  duration_ms: 0.266959
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 3 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 0.727625
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 4 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 0.061208
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 5 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.069625
  type: 'test'
  ...
# Subtest: authorized selector output augments the existing pack with injection-safe structured context
ok 6 - authorized selector output augments the existing pack with injection-safe structured context
  ---
  duration_ms: 135.027583
  type: 'test'
  ...
# Subtest: manifest brands bind both canonical project root and Brain project identity
ok 7 - manifest brands bind both canonical project root and Brain project identity
  ---
  duration_ms: 128.924959
  type: 'test'
  ...
# Subtest: new async pack adapter falls back only for a verified absent Brain namespace
ok 8 - new async pack adapter falls back only for a verified absent Brain namespace
  ---
  duration_ms: 2.34575
  type: 'test'
  ...
# Subtest: initialized Brain corruption never downgrades to a legacy context pack
ok 9 - initialized Brain corruption never downgrades to a legacy context pack
  ---
  duration_ms: 30.934709
  type: 'test'
  ...
# Subtest: async pack adapter preserves policy and schema failures instead of falling back
ok 10 - async pack adapter preserves policy and schema failures instead of falling back
  ---
  duration_ms: 33.666958
  type: 'test'
  ...
# Subtest: context selection is deterministic, bounded, explainable, and trust-separated
ok 11 - context selection is deterministic, bounded, explainable, and trust-separated
  ---
  duration_ms: 263.354292
  type: 'test'
  ...
# Subtest: mandatory overflow blocks while optional relevant knowledge is explicitly excluded
ok 12 - mandatory overflow blocks while optional relevant knowledge is explicitly excluded
  ---
  duration_ms: 161.733584
  type: 'test'
  ...
# Subtest: task and Context Manifest schemas reject unknown, unsafe, and forged values
ok 13 - task and Context Manifest schemas reject unknown, unsafe, and forged values
  ---
  duration_ms: 69.616625
  type: 'test'
  ...
# Subtest: context selection fails closed and requests the exact context.read grant
ok 14 - context selection fails closed and requests the exact context.read grant
  ---
  duration_ms: 23.83675
  type: 'test'
  ...
# Subtest: receipt authority is refreshed for every selection and revocation cannot remain trusted
ok 15 - receipt authority is refreshed for every selection and revocation cannot remain trusted
  ---
  duration_ms: 76.533584
  type: 'test'
  ...
# Subtest: invalid selection metadata is never interpreted semantically or promoted by free text
ok 16 - invalid selection metadata is never interpreted semantically or promoted by free text
  ---
  duration_ms: 65.585917
  type: 'test'
  ...
1..16
# tests 16
# suites 0
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 791.592875

````

## Stderr

````text

````
