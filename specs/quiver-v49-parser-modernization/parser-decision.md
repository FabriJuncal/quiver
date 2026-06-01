# Parser Strategy Decision - Quiver v49

## Decision

Use an internal declarative command registry with a compatibility adapter.

Do not adopt Commander.js or yargs in v49. The current CLI has compatibility behavior that is already covered by golden tests and is more important than parser-library convenience.

## Context

Quiver's parser currently lives in `src/create-quiver/index.js` and owns root command detection, global flags, command-scoped flags, aliases, deprecation warnings, positional validation, help rendering, `--lang` extraction, JSON-safe errors, and `--` separator handling.

The v49 registry and golden tests now lock behavior for:

- Top-level `--version` and `-V` semver-only output.
- `version --json`.
- `--lang` before commands, after commands, and inline as `--lang=<value>`.
- JSON-safe early errors with empty stdout.
- `--` passthrough for `evidence run`.
- Deprecated aliases and stderr-only warnings.
- Missing values, invalid values, unknown flags, unsupported subcommands, and positional errors.
- Existing parser ambiguities that must not change accidentally during migration.

## Options Considered

| Option | Strengths | Weaknesses | Production fit |
|---|---|---|---|
| Commander.js | Mature command/subcommand model, help generation, common Node CLI dependency, alias support. | Would require careful override of help, error formatting, `--lang` preprocessing, JSON-safe errors, and top-level `--version`; likely changes error timing and positional behavior unless wrapped heavily. | Medium. Useful for conventional CLIs, but Quiver's compatibility edge cases would still require a custom adapter. |
| yargs | Strong option parsing, nested commands, coercion, validation hooks, generated help. | Larger conceptual/runtime surface than needed, opinionated parsing, risk of changed `--` and unknown-flag behavior, more work to keep localized errors and stderr/stdout contracts stable. | Low to medium. Good for broad CLI apps, but higher migration risk for this package. |
| Internal declarative registry | No new dependency, exact control over compatibility, can migrate incrementally from current parser, can keep current error timing, localized messages, JSON cleanliness, aliases, and `--` behavior. | Requires Quiver to maintain parser logic, help rendering, and validation discipline; less off-the-shelf shell/completion support. | High. Best preserves current contracts while allowing help scoping and parser ownership cleanup. |

## Decision Drivers

| Driver | Requirement | Best fit |
|---|---|---|
| Dependency and package impact | Avoid package-size and lockfile churn unless clearly justified. Current dependencies are only `@clack/prompts` and `zod`. | Internal registry. |
| Migration reversibility | Runtime migration must be incremental and reversible behind an adapter. | Internal registry. |
| Help scoping | Help must distinguish global flags from command-scoped flags without changing behavior. | Internal registry. |
| Alias compatibility | Legacy aliases and AI aliases must preserve warning behavior and stdout cleanliness. | Internal registry. |
| i18n behavior | `--lang` must remain pre-parsed and parser errors must localize correctly. | Internal registry. |
| JSON-safe errors | Early errors must keep stdout empty and warnings out of JSON output. | Internal registry. |
| `--` behavior | `evidence run -- <command>` must preserve current passthrough semantics. | Internal registry. |
| Golden-test alignment | Migration should satisfy current golden tests with minimal compatibility shims. | Internal registry. |

## Chosen Architecture

Introduce a small internal parser layer in the migration slice:

- `src/create-quiver/lib/cli/command-registry.js`: declarative command metadata, aliases, scoped flags, positionals, UX support references, and help grouping inputs.
- `src/create-quiver/lib/cli/parser.js`: parser adapter that consumes the registry and returns the same args object shape used by current dispatch.
- `src/create-quiver/index.js`: remains the runtime entrypoint and dispatch owner during migration; parser calls move behind an adapter only after golden tests are green.

The first migration should be compatibility-first:

- Keep `extractCliLanguageFlag()` before parser execution.
- Keep top-level `--version` and `-V` special-cased before normal command parsing.
- Keep `formatError()` and `localizeParserMessage()` behavior.
- Keep current args object fields until dispatch is separately refactored.
- Keep current deprecation warning emission in `run()` unless the adapter can reproduce it exactly.

## Compatibility Requirements For Migration

- No aliases are removed.
- No command semantics change.
- No parser dependency is added in v49.
- Existing `tests/commands/parser-contract.test.js` and `tests/commands/cli-contract.test.js` must pass before and after migration.
- Any cleanup of registered parser ambiguities must be a later explicit compatibility change, not an incidental parser migration side effect.

## Rejected Paths

### Commander.js

Rejected for v49 because preserving Quiver's current parser contract would require substantial custom wrapping. Commander could still be reconsidered in a future major parser rewrite if Quiver intentionally drops legacy parser ambiguities and accepts generated-help conventions.

### yargs

Rejected for v49 because it introduces more parser behavior than needed and increases risk around error timing, unknown flags, localized parser messages, and package surface.

## Consequences

Positive:

- Lowest compatibility risk.
- No dependency or lockfile changes.
- Help scoping can be driven directly from the registry.
- Golden tests can map one-to-one to registry entries.
- Migration can be paused or reverted at adapter boundaries.

Negative:

- Quiver continues owning parser maintenance.
- Shell completion remains out of scope unless explicitly implemented from the registry later.
- The internal registry must avoid becoming a second source of truth during migration; current parser and registry must converge in `slice-04`.

## Follow-Up Work

- `slice-04`: implement registry-backed parser adapter while preserving current args shape.
- `slice-05`: drive scoped help from registry metadata after parser behavior is stable.
- `slice-06`: run package-installed smoke for both `create-quiver` and `quiver`.
