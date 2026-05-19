# Execution Plan - Quiver v20 AI CLI Orchestration

## Rule

`slice-00` is mandatory and must be committed first. It establishes the spec foundation in the repo.

## Sequential Foundation

1. `slice-00-spec-foundation`
   - Commit the spec, slice definitions, handoffs, execution plan, and PR body.

2. `slice-01-ai-provider-runner`
   - Build the provider abstraction and safe prompt transport.

3. `slice-02-context-packs-token-budget`
   - Can run after `slice-00`.
   - Can run in parallel with `slice-01` only if it does not modify provider-runner files.

4. `slice-03-ai-phase-gated-planner`
   - Requires `slice-01` and `slice-02`.

5. `slice-04-spec-slice-handoff-pr-generation`
   - Requires `slice-03`.

## Parallelizable Work

After `slice-04`, these can be developed in parallel if each uses a separate worktree and respects declared files:

- `slice-05-execution-plan-parallel-worktrees`
- `slice-07-github-pr-preflight`

After `slice-05`, this can start:

- `slice-06-ai-execute-slice-scope-enforcement`

## Final Integration

`slice-08-docs-smokes-release-readiness` must run last because it updates docs, generated scripts, templates, and smoke coverage across the completed feature.

## Suggested Commit Order

1. `docs(spec): add ai cli orchestration spec foundation`
2. `feat(ai): add provider runner and safe prompt transport`
3. `feat(ai): add context packs and token budgets`
4. `feat(ai): add phase gated planner commands`
5. `feat(ai): generate spec slices handoffs and pr body`
6. `feat(ai): add slice execution plan and parallel worktree support`
7. `feat(ai): execute slices with scope enforcement`
8. `feat(ai): add github pr preflight`
9. `docs(ai): document orchestration workflow and add smokes`

## Integration Notes

- Do not merge parallel slice outputs before their dependencies are committed.
- If two slices touch the same template, integrate the earlier dependency first and rebase the later worktree.
- Keep provider tests mocked. Real provider CLIs are optional local checks only.

