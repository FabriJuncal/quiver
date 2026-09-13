# Quiver Evidence

- Command: `/opt/homebrew/Cellar/node@22/22.22.2_2/bin/node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js tests/commands/ai-draft-recovery.test.js`
- Exit code: 0
- Duration ms: 1845
- Started at: 2026-09-13T00:15:38.311Z
- Finished at: 2026-09-13T00:15:40.157Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
ok 1 - compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
  ---
  duration_ms: 238.057542
  type: 'test'
  ...
# Subtest: run-owned selection rejects a foreign run canonical input without any projection write
ok 2 - run-owned selection rejects a foreign run canonical input without any projection write
  ---
  duration_ms: 169.476291
  type: 'test'
  ...
# Subtest: run-owned acceptance selection requires canonical input path identity, not equal bytes
ok 3 - run-owned acceptance selection requires canonical input path identity, not equal bytes
  ---
  duration_ms: 144.332583
  type: 'test'
  ...
# Subtest: digest-bound save never infers a latest run from equal requirement bytes
ok 4 - digest-bound save never infers a latest run from equal requirement bytes
  ---
  duration_ms: 113.0485
  type: 'test'
  ...
# Subtest: restore recovers the valid predecessor of a corrupted last candidate without erasing either version
ok 5 - restore recovers the valid predecessor of a corrupted last candidate without erasing either version
  ---
  duration_ms: 116.397417
  type: 'test'
  ...
# Subtest: unsupported acknowledgement can select bytes but remains unverified and unapprovable
ok 6 - unsupported acknowledgement can select bytes but remains unverified and unapprovable
  ---
  duration_ms: 72.804958
  type: 'test'
  ...
# Subtest: planner approvals persist draft and approved metadata with status summaries
ok 7 - planner approvals persist draft and approved metadata with status summaries
  ---
  duration_ms: 108.994667
  type: 'test'
  ...
# Subtest: planner approvals keep multiple drafts and only approve the current version
ok 8 - planner approvals keep multiple drafts and only approve the current version
  ---
  duration_ms: 105.295667
  type: 'test'
  ...
# Subtest: legacy planner approval writer rejects approved-with-conditions without creating approved.md
ok 9 - legacy planner approval writer rejects approved-with-conditions without creating approved.md
  ---
  duration_ms: 61.873375
  type: 'test'
  ...
# Subtest: planner approval candidates expose current draft, history, and safe previews
ok 10 - planner approval candidates expose current draft, history, and safe previews
  ---
  duration_ms: 98.807333
  type: 'test'
  ...
# Subtest: planner approvals block unapproved or stale inputs before later phases
ok 11 - planner approvals block unapproved or stale inputs before later phases
  ---
  duration_ms: 194.229167
  type: 'test'
  ...
# Subtest: planner drafts persist exact artifact and input byte digests
ok 12 - planner drafts persist exact artifact and input byte digests
  ---
  duration_ms: 54.950625
  type: 'test'
  ...
# Subtest: digest-bound projection rejects artifact and input tampering without approving
ok 13 - digest-bound projection rejects artifact and input tampering without approving
  ---
  duration_ms: 57.490458
  type: 'test'
  ...
# Subtest: content loss persists a corrupted immutable candidate without replacing current or approval history
ok 14 - content loss persists a corrupted immutable candidate without replacing current or approval history
  ---
  duration_ms: 99.020167
  type: 'test'
  ...
# Subtest: unsupported free text remains inspectable but never becomes current automatically
ok 15 - unsupported free text remains inspectable but never becomes current automatically
  ---
  duration_ms: 35.27125
  type: 'test'
  ...
# Subtest: draft projection journal rolls forward deterministically from every committed crash point
ok 16 - draft projection journal rolls forward deterministically from every committed crash point
  ---
  duration_ms: 344.360959
  type: 'test'
  ...
# Subtest: a crash before journal publication leaves an immutable orphan and unchanged projections
ok 17 - a crash before journal publication leaves an immutable orphan and unchanged projections
  ---
  duration_ms: 51.254416
  type: 'test'
  ...
# Subtest: corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
ok 18 - corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
  ---
  duration_ms: 122.215167
  type: 'test'
  ...
# Subtest: v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
ok 19 - v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
  ---
  duration_ms: 218.136375
  type: 'test'
  ...
# Subtest: draft recovery respects governance read-only mode without changing marker or projections
ok 20 - draft recovery respects governance read-only mode without changing marker or projections
  ---
  duration_ms: 63.768959
  type: 'test'
  ...
# Subtest: project file byte reader rejects path traversal outside the project root
ok 21 - project file byte reader rejects path traversal outside the project root
  ---
  duration_ms: 0.949459
  type: 'test'
  ...
# Subtest: project file byte reader rejects symlinks that resolve outside the project root
ok 22 - project file byte reader rejects symlinks that resolve outside the project root
  ---
  duration_ms: 0.744042
  type: 'test'
  ...
# Subtest: project file byte reader rejects in-project symlink aliases
ok 23 - project file byte reader rejects in-project symlink aliases
  ---
  duration_ms: 0.491834
  type: 'test'
  ...
# Subtest: draft lifecycle vocabulary is explicit and bounded
ok 24 - draft lifecycle vocabulary is explicit and bounded
  ---
  duration_ms: 2.403042
  type: 'test'
  ...
# Subtest: markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
ok 25 - markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
  ---
  duration_ms: 0.977625
  type: 'test'
  ...
# Subtest: structured extraction supports exact collections, references, and v58 acceptance arrays
ok 26 - structured extraction supports exact collections, references, and v58 acceptance arrays
  ---
  duration_ms: 0.383917
  type: 'test'
  ...
# Subtest: preservation compares structural identity rather than word count
ok 27 - preservation compares structural identity rather than word count
  ---
  duration_ms: 0.232708
  type: 'test'
  ...
# Subtest: missing identity and required collection are diagnosed as corruption
ok 28 - missing identity and required collection are diagnosed as corruption
  ---
  duration_ms: 0.205459
  type: 'test'
  ...
# Subtest: explicit deletion is accepted only when the exact identity and references are removed
ok 29 - explicit deletion is accepted only when the exact identity and references are removed
  ---
  duration_ms: 0.456833
  type: 'test'
  ...
# Subtest: duplicates, broken references, malformed structured content, and free text fail closed
ok 30 - duplicates, broken references, malformed structured content, and free text fail closed
  ---
  duration_ms: 0.301292
  type: 'test'
  ...
1..30
# tests 30
# suites 0
# pass 30
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1779.871792

````

## Stderr

````text

````
