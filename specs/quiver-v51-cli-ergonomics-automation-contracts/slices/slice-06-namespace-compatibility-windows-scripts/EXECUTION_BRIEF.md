# EXECUTION_BRIEF - slice-06 namespace compatibility and Windows npm scripts

## Context

Canonical `slice` and `handoff` namespaces exist. This slice protects compatibility and provides a portable path for Windows users.

## Objective

Preserve canonical/legacy namespace compatibility and make recommended npm scripts portable.

## Scope

- Slice/handoff namespace parity.
- Legacy alias warnings.
- JSON stdout cleanliness.
- Package scripts and docs.
- Windows `pwsh` validation.

## Acceptance Criteria

- Canonical commands and aliases remain behaviorally equivalent.
- Legacy warnings go only to stderr and are suppressed for JSON where required.
- Recommended npm/CLI paths work under Windows PowerShell.
- Bash-only scripts are replaced, wrapped, or clearly documented as legacy.
- Lockfile is synchronized if package metadata changes.

## Expected Files To Modify

- `package.json`
- `package-lock.json`
- `src/create-quiver/index.js`
- `src/create-quiver/commands/slice.js`
- `src/create-quiver/commands/handoff.js`
- `tests/commands/slice-namespace.test.js`
- `tests/commands/handoff-namespace.test.js`
- `tests/commands/parser-contract.test.js`
- `.github/workflows/ci.yml`
- `README.md`
- `CONTRIBUTING.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/slice-namespace.test.js`
- `node --test tests/commands/handoff-namespace.test.js`
- `node --test tests/commands/parser-contract.test.js`
- `npm ci`
- `node --test`
- `git diff --check`

## Risks

- Breaking legacy users.
- Marking Bash scripts portable when they are not.
- Lockfile drift.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Treat current namespace behavior as compatibility contract.
2. Validate stdout/stderr behavior.
3. Provide a Windows PowerShell-supported command path.
4. Do not remove aliases.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Namespace compatibility is protected and Windows users have a supported path.
