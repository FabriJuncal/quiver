# PR - QUIVER-51-04 - Next/plan/graph UX edge cases

## Title

QUIVER-51-04 next plan graph UX edge cases

## Summary

Closes secondary read-only CLI UX gaps for `next`, `plan`, and `graph` without changing scheduling or graph algorithms. Existing `next --auto-start` prompt behavior is preserved by evidence, `plan` now reports missing estimates only in human output, and `graph` now has explicit empty-level and `--json` precedence coverage.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: functional CLI UX behavior, tests, and docs.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Preserve existing `next --auto-start` TTY/injected prompt behavior with test evidence.
- Add a human-only `plan` note for slices without positive `estimated_hours`.
- Keep `plan --json` free of human notes while reporting those hours as `0`.
- Add a localized human empty state for `graph --level <n>` when the selected level has no slices.
- Keep `graph --json --level <n>` machine-readable with empty `levels` and `conflicts`.
- Verify `graph --json` takes precedence over `--format tree|mermaid|dot`.
- Update command reference, UX guide, and command template docs.

## Files

- `src/create-quiver/commands/plan.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/plan.test.js`
- `tests/commands/graph.test.js`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/slice.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/CLOSURE_BRIEF.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-51-04-v51-next-plan-graph-ux
```

### Run the Project

No runtime server is required. This is CLI behavior, tests, docs, and spec evidence.

### Use Cases

#### Case 1: plan missing estimates in human output

**Prerequisite:** a spec fixture or project slice without positive `estimated_hours`.

1. Run `node bin/create-quiver.js plan --lang en`.
2. Inspect stdout.

**Expected result:** stdout includes a human note that missing/non-positive estimates count as `0h`.

#### Case 2: plan missing estimates in JSON output

**Prerequisite:** same fixture as Case 1.

1. Run `node bin/create-quiver.js plan --json`.
2. Parse stdout as JSON.

**Expected result:** stdout is parseable JSON, affected slices report `hours: 0`, and no human note appears.

#### Case 3: graph empty level

**Prerequisite:** a project with pending slices but no selected graph level, for example level `99`.

1. Run `node bin/create-quiver.js graph --level 99 --lang es`.
2. Run `node bin/create-quiver.js graph --level 99 --json`.

**Expected result:** human output is localized empty-state text; JSON output has empty `levels` and `conflicts` arrays.

#### Case 4: graph JSON precedence over format

**Prerequisite:** a project with graphable slices.

1. Run `node bin/create-quiver.js graph --json --format mermaid`.
2. Parse stdout as JSON.

**Expected result:** stdout is JSON, not Mermaid, and contains the graph payload.

### Technical Verification

```bash
node --test tests/commands/next.test.js
node --test tests/commands/plan.test.js
node --test tests/commands/graph.test.js
node --test tests/commands/next.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/lib/i18n-catalog.test.js
node --test
npm run docs:check
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-04-next-plan-graph-ux-edge-cases/slice.json --base main
```

## Evidence

- `node --test tests/commands/next.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/lib/i18n-catalog.test.js`: passed, 37 tests.
- `node --test`: passed, 632 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm `plan` and `graph` return to the previous baseline behavior.

## Risks / Notes

- `next --auto-start` did not require runtime changes; existing prompt/no-TTY behavior is covered by tests.
- `plan` JSON does not include the human missing-estimates note.
- `graph --json` intentionally remains the machine-readable contract even when a human `--format` is also provided.
