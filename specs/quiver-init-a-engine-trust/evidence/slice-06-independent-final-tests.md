# Quiver Evidence

- Command: `/opt/homebrew/Cellar/node@22/22.22.2_2/bin/node --test tests/lib/brain-store.test.js tests/lib/brain-vault.test.js tests/commands/brain.test.js tests/commands/cli-contract.test.js tests/commands/parser-contract.test.js tests/docs/command-reference.test.js tests/lib/i18n-catalog.test.js`
- Exit code: 0
- Duration ms: 6443
- Started at: 2026-09-13T00:12:41.427Z
- Finished at: 2026-09-13T00:12:47.871Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: brain add and export dry-runs validate fully without writing any bytes
ok 1 - brain add and export dry-runs validate fully without writing any bytes
  ---
  duration_ms: 115.889458
  type: 'test'
  ...
# Subtest: brain status, list, show, add, export, and delete return Result v1
ok 2 - brain status, list, show, add, export, and delete return Result v1
  ---
  duration_ms: 154.397875
  type: 'test'
  ...
# Subtest: every Brain command fails closed without a trusted actor adapter
ok 3 - every Brain command fails closed without a trusted actor adapter
  ---
  duration_ms: 63.728041
  type: 'test'
  ...
# Subtest: CLI brain namespace emits canonical JSON and stable policy exit class
ok 4 - CLI brain namespace emits canonical JSON and stable policy exit class
  ---
  duration_ms: 591.229666
  type: 'test'
  ...
# Subtest: Brain writer compatibility failures stay inside Result v1 with capability exit class
ok 5 - Brain writer compatibility failures stay inside Result v1 with capability exit class
  ---
  duration_ms: 294.049958
  type: 'test'
  ...
# Subtest: top-level --version prints the installed package version
ok 6 - top-level --version prints the installed package version
  ---
  duration_ms: 231.7965
  type: 'test'
  ...
# Subtest: top-level -V prints the installed package version
ok 7 - top-level -V prints the installed package version
  ---
  duration_ms: 213.214917
  type: 'test'
  ...
# Subtest: version command prints human and JSON metadata without changing semver flags
ok 8 - version command prints human and JSON metadata without changing semver flags
  ---
  duration_ms: 377.19425
  type: 'test'
  ...
# Subtest: local quiver alias points to the same CLI entrypoint
ok 9 - local quiver alias points to the same CLI entrypoint
  ---
  duration_ms: 0.316167
  type: 'test'
  ...
# Subtest: top-level help command prints grouped command descriptions
ok 10 - top-level help command prints grouped command descriptions
  ---
  duration_ms: 190.935291
  type: 'test'
  ...
# Subtest: help output documents important public commands
ok 11 - help output documents important public commands
  ---
  duration_ms: 185.863208
  type: 'test'
  ...
# Subtest: ai approval accepts the singular verify contract and emits a clean JSON runtime error
ok 12 - ai approval accepts the singular verify contract and emits a clean JSON runtime error
  ---
  duration_ms: 196.959708
  type: 'test'
  ...
# Subtest: ai approval rejects missing or unsupported singular subcommands
ok 13 - ai approval rejects missing or unsupported singular subcommands
  ---
  duration_ms: 323.096875
  type: 'test'
  ...
# Subtest: ai approvals --json emits one canonical projection without stderr
ok 14 - ai approvals --json emits one canonical projection without stderr
  ---
  duration_ms: 164.285666
  type: 'test'
  ...
# Subtest: spec create --json emits one machine error document without stderr
ok 15 - spec create --json emits one machine error document without stderr
  ---
  duration_ms: 167.321708
  type: 'test'
  ...
# Subtest: approval value flags reject a following flag as a missing value
ok 16 - approval value flags reject a following flag as a missing value
  ---
  duration_ms: 953.208834
  type: 'test'
  ...
# Subtest: findings namespace validates its public subcommands and value flags before mutation
ok 17 - findings namespace validates its public subcommands and value flags before mutation
  ---
  duration_ms: 1001.469791
  type: 'test'
  ...
# Subtest: findings JSON runtime failures use one machine envelope and no stderr prose
ok 18 - findings JSON runtime failures use one machine envelope and no stderr prose
  ---
  duration_ms: 141.567084
  type: 'test'
  ...
# Subtest: ai approve rejects decisions outside the public approval vocabulary
ok 19 - ai approve rejects decisions outside the public approval vocabulary
  ---
  duration_ms: 142.179334
  type: 'test'
  ...
# Subtest: governance profile flag rejects unknown profile names before command execution
ok 20 - governance profile flag rejects unknown profile names before command execution
  ---
  duration_ms: 139.091166
  type: 'test'
  ...
# Subtest: global --lang works before and after command names without changing JSON output
ok 21 - global --lang works before and after command names without changing JSON output
  ---
  duration_ms: 425.337166
  type: 'test'
  ...
# Subtest: unsupported global --lang falls back without polluting JSON output
ok 22 - unsupported global --lang falls back without polluting JSON output
  ---
  duration_ms: 149.424958
  type: 'test'
  ...
# Subtest: global --lang before help is accepted
ok 23 - global --lang before help is accepted
  ---
  duration_ms: 145.658875
  type: 'test'
  ...
# Subtest: help uses configured project language without requiring --lang
ok 24 - help uses configured project language without requiring --lang
  ---
  duration_ms: 144.97825
  type: 'test'
  ...
# Subtest: ai approve --version remains a draft-version option
ok 25 - ai approve --version remains a draft-version option
  ---
  duration_ms: 141.404791
  type: 'test'
  ...
# Subtest: global --lang requires a value
ok 26 - global --lang requires a value
  ---
  duration_ms: 157.318417
  type: 'test'
  ...
# Subtest: early parser errors use the resolved language and keep JSON stdout empty
ok 27 - early parser errors use the resolved language and keep JSON stdout empty
  ---
  duration_ms: 300.597417
  type: 'test'
  ...
# Subtest: unsupported commands fail with localized actionable guidance
ok 28 - unsupported commands fail with localized actionable guidance
  ---
  duration_ms: 338.69325
  type: 'test'
  ...
# Subtest: parser adapter requires and delegates to legacy parser
ok 29 - parser adapter requires and delegates to legacy parser
  ---
  duration_ms: 1.421625
  type: 'test'
  ...
# Subtest: command registry reflects supported command surface with explicit changelog wrapper
ok 30 - command registry reflects supported command surface with explicit changelog wrapper
  ---
  duration_ms: 0.085584
  type: 'test'
  ...
# Subtest: baseline parser contracts stay stable for high-risk entry points
ok 31 - baseline parser contracts stay stable for high-risk entry points
  ---
  duration_ms: 1199.007792
  type: 'test'
  ...
# Subtest: generated command metadata is present in runtime help
ok 32 - generated command metadata is present in runtime help
  ---
  duration_ms: 227.528
  type: 'test'
  ...
# Subtest: docs command reference generated block is synchronized
ok 33 - docs command reference generated block is synchronized
  ---
  duration_ms: 213.575416
  type: 'test'
  ...
# Subtest: generated block replacement preserves manual content outside markers
ok 34 - generated block replacement preserves manual content outside markers
  ---
  duration_ms: 0.093042
  type: 'test'
  ...
# Subtest: empty Brain initialization is stable and idempotent
ok 35 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 91.087166
  type: 'test'
  ...
# Subtest: protected operations do not lazily recreate an absent Brain
ok 36 - protected operations do not lazily recreate an absent Brain
  ---
  duration_ms: 4.11925
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 37 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 686.234625
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 38 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 194.086666
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 39 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 124.128208
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 40 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 75.491542
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 41 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 44.148834
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 42 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 55.743583
  type: 'test'
  ...
# Subtest: the supported local v58 decision representation binds the exact approved artifact
ok 43 - the supported local v58 decision representation binds the exact approved artifact
  ---
  duration_ms: 0.770458
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 44 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 56.37875
  type: 'test'
  ...
# Subtest: concurrent appends either serialize or return an explicit lock conflict
ok 45 - concurrent appends either serialize or return an explicit lock conflict
  ---
  duration_ms: 97.556875
  type: 'test'
  ...
# Subtest: read-only v58 compatibility blocks every Brain writer before mutation
ok 46 - read-only v58 compatibility blocks every Brain writer before mutation
  ---
  duration_ms: 39.895583
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 47 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 50.845459
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 48 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 31.97575
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 49 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 117.560708
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 50 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 123.772916
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 51 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 120.192292
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 52 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 152.500083
  type: 'test'
  ...
# Subtest: default export is deterministic, complete, portable, and keeps safe record links
ok 53 - default export is deterministic, complete, portable, and keeps safe record links
  ---
  duration_ms: 296.306625
  type: 'test'
  ...
# Subtest: an edited Markdown vault imports only a non-effective proposal
ok 54 - an edited Markdown vault imports only a non-effective proposal
  ---
  duration_ms: 179.155708
  type: 'test'
  ...
# Subtest: proposal bodies cannot grant authority and require the explicit propose grant
ok 55 - proposal bodies cannot grant authority and require the explicit propose grant
  ---
  duration_ms: 36.467209
  type: 'test'
  ...
# Subtest: an interrupted proposal commit recovers without activating proposal records
ok 56 - an interrupted proposal commit recovers without activating proposal records
  ---
  duration_ms: 110.841125
  type: 'test'
  ...
# Subtest: export validates secrets, destinations, references, and symlinks before writes
ok 57 - export validates secrets, destinations, references, and symlinks before writes
  ---
  duration_ms: 96.395625
  type: 'test'
  ...
# Subtest: export revalidates a destination changed to a symlink during authorization
ok 58 - export revalidates a destination changed to a symlink during authorization
  ---
  duration_ms: 36.578791
  type: 'test'
  ...
# Subtest: export stays coherent when the Brain advances during authorization
ok 59 - export stays coherent when the Brain advances during authorization
  ---
  duration_ms: 122.521208
  type: 'test'
  ...
# Subtest: delete dry-run is byte-preserving and real delete quarantines only the Brain
ok 60 - delete dry-run is byte-preserving and real delete quarantines only the Brain
  ---
  duration_ms: 143.295625
  type: 'test'
  ...
# Subtest: complete snapshot is not constrained by the public query limit
ok 61 - complete snapshot is not constrained by the public query limit
  ---
  duration_ms: 1254.973042
  type: 'test'
  ...
# Subtest: catalogs expose supported languages and version metadata
ok 62 - catalogs expose supported languages and version metadata
  ---
  duration_ms: 0.704459
  type: 'test'
  ...
# Subtest: catalog completeness is enforced across en and es
ok 63 - catalog completeness is enforced across en and es
  ---
  duration_ms: 12.635625
  type: 'test'
  ...
# Subtest: translate supports interpolation and predictable missing params
ok 64 - translate supports interpolation and predictable missing params
  ---
  duration_ms: 0.301416
  type: 'test'
  ...
# Subtest: translate sanitizes unsafe interpolation values
ok 65 - translate sanitizes unsafe interpolation values
  ---
  duration_ms: 0.066958
  type: 'test'
  ...
# Subtest: translate supports one and other plural forms
ok 66 - translate supports one and other plural forms
  ---
  duration_ms: 0.138583
  type: 'test'
  ...
# Subtest: fallback to en is explicit and deterministic
ok 67 - fallback to en is explicit and deterministic
  ---
  duration_ms: 0.119125
  type: 'test'
  ...
# Subtest: translator keeps command snippets and flags exact
ok 68 - translator keeps command snippets and flags exact
  ---
  duration_ms: 0.166958
  type: 'test'
  ...
1..68
# tests 68
# suites 0
# pass 68
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 6374.507542

````

## Stderr

````text

````
