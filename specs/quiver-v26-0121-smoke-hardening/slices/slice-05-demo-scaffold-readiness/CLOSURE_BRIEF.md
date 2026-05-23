# CLOSURE BRIEF - slice-05: Demo scaffold readiness

## Summary of Work

- Made `demo create spec-viewer` generate a minimal Quiver-initialized demo scaffold with `.quiver` metadata, AGENTS, docs, scripts, specs, slices, and validation.
- Added dependency-free server port fallback when the starting port is occupied.
- Strengthened demo validation and tests for doctor, plan, graph, next, and brief validation.
- Updated stale smoke expectations that still required `COMMANDS.md` links to optional `docs/examples/*` files.

## Validation Against Acceptance Criteria

- [x] Demo generation verified.
- [x] Demo validation verified.
- [x] Doctor behavior verified.
- [x] Port behavior verified.

## Relevant Changes

- Updated `src/create-quiver/lib/demo.js`.
- Updated `tests/commands/demo.test.js`.
- Updated smoke fixtures in `scripts/ci/`.
- Updated README and command template docs.

## Pending

- No pending work for this slice.

## Remaining Risks

- The server fallback is covered by generated contract tests instead of opening real sockets because the sandbox blocks local listening.

## Future Recommendations

- Use the demo as a recurring dogfooding fixture after each release.
