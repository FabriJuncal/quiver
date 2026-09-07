# Quiver Evidence

- Command: `/usr/bin/env LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test --test-name-pattern=spec.create.fails.before.writing.when.approved.plan.lacks.structured.slices tests/commands/spec-create.test.js`
- Exit code: 0
- Duration ms: 477
- Started at: 2026-09-07T02:38:04.207Z
- Finished at: 2026-09-07T02:38:04.685Z
- Signal: -
- Output truncated: no

## Stdout

````text
create-quiver: approved technical plan must include a structured slices array. Expected JSON: { "spec": { "slices": [{ "slice_id": "slice-01-name", "title": "...", "objective": "...", "files": [] }] } }
✔ spec create fails before writing when approved plan lacks structured slices (251.9545ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 401.008542

````

## Stderr

````text

````
