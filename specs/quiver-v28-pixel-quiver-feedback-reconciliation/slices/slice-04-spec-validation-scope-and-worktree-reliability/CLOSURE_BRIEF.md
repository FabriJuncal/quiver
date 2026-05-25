# CLOSURE BRIEF - slice-04: Spec validation, scope, and worktree reliability

## Summary

Completed the validation and worktree reliability hardening for v28. `spec validate` now catches missing execution git metadata, `spec status` reports expected but unregistered worktree paths as stale, `spec start --dry-run` gives actionable dirty-checkout recovery, and scope matching has regression coverage for exact paths plus supported globs.

## Validation

Passed:

- `node --test tests/commands/spec-validate.test.js tests/commands/spec-worktree.test.js`
- `node --test tests/lib/check-slice.test.js tests/lib/scope.test.js tests/lib/paths.test.js`

## Relevant Changes

- `src/create-quiver/commands/spec.js` validates required `git.*` execution metadata in every slice.
- `src/create-quiver/lib/spec-worktrees.js` detects unregistered expected worktree directories and improves dirty-checkout recovery output.
- `tests/commands/spec-validate.test.js` covers missing execution git metadata.
- `tests/commands/spec-worktree.test.js` covers unregistered expected worktree paths and actionable dirty checkout output.
- `tests/lib/scope.test.js` covers exact path plus supported glob write scopes.

## Pending Work

None for this slice.

## Remaining Risks

- Tightened validation may surface older specs that do not declare execution git metadata. This is intentional for local execution readiness and is covered by v28 release-readiness follow-up.

## Future Recommendations

- Consider adding a dedicated migration/check command for older specs if users report friction after release.
