# Quiver Evidence

- Command: `/usr/bin/env LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js`
- Exit code: 0
- Duration ms: 1515
- Started at: 2026-09-07T02:36:52.874Z
- Finished at: 2026-09-07T02:36:54.390Z
- Signal: -
- Output truncated: no

## Stdout

````text
✔ planner approvals persist draft and approved metadata with status summaries (60.807667ms)
✔ planner approvals keep multiple drafts and only approve the current version (81.873125ms)
✔ legacy planner approval writer rejects approved-with-conditions without creating approved.md (30.16275ms)
✔ planner approval candidates expose current draft, history, and safe previews (70.194875ms)
✔ planner approvals block unapproved or stale inputs before later phases (140.160666ms)
✔ planner drafts persist exact artifact and input byte digests (35.261458ms)
✔ digest-bound projection rejects artifact and input tampering without approving (38.305625ms)
✔ content loss persists a corrupted immutable candidate without replacing current or approval history (68.857083ms)
✔ unsupported free text remains inspectable but never becomes current automatically (23.501458ms)
✔ draft projection journal rolls forward deterministically from every committed crash point (298.502208ms)
✔ a crash before journal publication leaves an immutable orphan and unchanged projections (53.693625ms)
✔ corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed (115.736625ms)
✔ v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths (233.233291ms)
✔ draft recovery respects governance read-only mode without changing marker or projections (72.054209ms)
✔ project file byte reader rejects path traversal outside the project root (0.776792ms)
✔ project file byte reader rejects symlinks that resolve outside the project root (0.846ms)
✔ project file byte reader rejects in-project symlink aliases (0.574042ms)
✔ draft lifecycle vocabulary is explicit and bounded (1.371667ms)
✔ markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities (0.953667ms)
✔ structured extraction supports exact collections, references, and v58 acceptance arrays (0.2795ms)
✔ preservation compares structural identity rather than word count (0.253583ms)
✔ missing identity and required collection are diagnosed as corruption (0.647041ms)
✔ explicit deletion is accepted only when the exact identity and references are removed (0.215417ms)
✔ duplicates, broken references, malformed structured content, and free text fail closed (0.276ms)
ℹ tests 24
ℹ suites 0
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1445.175875

````

## Stderr

````text

````
