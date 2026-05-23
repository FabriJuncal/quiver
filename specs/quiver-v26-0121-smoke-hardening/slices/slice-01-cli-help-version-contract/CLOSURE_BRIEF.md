# CLOSURE BRIEF - slice-01: CLI help and version contract

## Summary of Work

- Added grouped command descriptions to `--help`.
- Added `npx create-quiver help` as an alias for complete help.
- Preserved top-level version output and AI draft-version approval behavior.
- Added tests for help coverage, local alias metadata, and command discovery.
- Updated README and generated command reference docs.

## Validation Against Acceptance Criteria

- [x] Version commands verified.
- [x] AI draft version behavior verified.
- [x] Help output verified.
- [x] Help drift coverage added.

## Relevant Changes

- `src/create-quiver/index.js`
- `tests/commands/cli-contract.test.js`
- `README.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v26-0121-smoke-hardening/EVIDENCE_REPORT.md`
- `specs/quiver-v26-0121-smoke-hardening/STATUS.md`
- `specs/quiver-v26-0121-smoke-hardening/slices/slice-01-cli-help-version-contract/slice.json`

## Pending

- None.

## Remaining Risks

- Help output is still maintained in code, but coverage now checks important public commands.

## Future Recommendations

- Consider moving command help metadata into a shared command registry in a future non-hotfix slice.
