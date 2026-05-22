# CLOSURE BRIEF - slice-01: CLI contract and compatibility

## Summary of Work

- Added top-level CLI version support for `--version` and `-V`.
- Preserved `ai approve --version <n>` as the planner draft-version option.
- Added CLI contract tests for version output and unsupported command guidance.
- Documented `npx create-quiver --version` in the README command table and generated commands template.

## Validation Against Acceptance Criteria

- [x] Version commands verified.
- [x] Alias behavior verified through shared binary entrypoint and package bin contract.
- [x] Unknown command behavior verified.
- [x] Docs updated.
- [x] Tests run.

## Relevant Changes

- `src/create-quiver/index.js`
- `tests/commands/cli-contract.test.js`
- `README.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/slice-01-cli-contract-compatibility/slice.json`

## Pending

- None.

## Remaining Risks

- The `quiver` alias itself is covered through package bin metadata and shared entrypoint behavior, not by installing a real local package binary during the test.

## Future Recommendations

- Keep top-level `--version` limited to the commandless case so `ai approve --version <n>` remains unambiguous.
