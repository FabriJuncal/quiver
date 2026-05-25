# Command Contracts - Quiver v27 Reliability and AI Workflow Hardening

## Purpose

These contracts apply to every command touched by v27. A slice may add stricter behavior, but it must not weaken these defaults without documenting a migration path.

## Output Streams

- Human-readable progress, hints, warnings, and debug text go to `stderr` when `--format json` is used.
- Machine-readable JSON goes to `stdout` only.
- A successful JSON command must produce valid JSON parseable without stripping banners, logs, colors, prompts, or extra lines.
- Non-JSON human commands may use `stdout` for primary content and `stderr` for warnings/errors.
- Error details must be actionable and include the command area, failing precondition, and next safe step when known.

## Exit Codes

| Code | Meaning |
|---:|---|
| 0 | Success. Requested operation completed or dry-run was valid. |
| 1 | General command failure with no more specific category. |
| 2 | Invalid user input, unsupported option, missing required argument, or schema validation failure. |
| 3 | Unsafe repository state, missing dependency, dirty worktree, stale lock, or failed precondition. |
| 4 | External tool/provider failure, including AI provider, `gh`, git, npm, or package manager failures. |
| 5 | Partial state was detected and recovery is required. The command must report exact files/state involved. |

## Dry-Run

- `--dry-run` is strictly read-only.
- A dry-run command must not write, create, delete, rename, stage, commit, or modify files anywhere in the repository.
- This includes `.quiver/`, `docs/`, `specs/`, generated logs, cache files, lock files, and package artifacts.
- Dry-run output must clearly state what would change, where it would be written, and which validations would run.
- If a command cannot guarantee read-only behavior, it must fail before doing work and explain why dry-run is unsupported.

## Write Classes

Every writing command must fit one of these classes:

| Class | Meaning | Requirements |
|---|---|---|
| inspect | Read-only command. | Must not write. Supports JSON when useful. |
| generate | Creates new files from validated input. | Must preflight collisions and fail atomically where possible. |
| update | Modifies existing files or state. | Must backup or preserve recoverable previous valid state when practical. |
| execute | Performs implementation or lifecycle action. | Must validate dependencies, scope, git state, and target worktree first. |
| external | Calls git, GitHub, package manager, or AI provider. | Must report external command failure clearly and preserve local state. |

## Atomicity and Partial State

- Commands that write multiple files must validate all inputs before the first write whenever possible.
- If partial writes can occur, the command must report exactly which files were written and how to recover.
- Failed generation must not leave empty directories unless they are explicitly reported as recoverable partial state.
- Existing valid files must not be replaced with invalid output.

## Idempotency

- Re-running a successful command with the same inputs should either produce the same result or report that no change is needed.
- Collision handling must be deterministic and documented.
- Commands that create slugs, spec ids, slice ids, branches, or worktree paths must use stable generation rules.

## Path Safety

- All write paths must resolve inside the project root unless the command explicitly documents an external target.
- Path traversal (`..`), symlink escape, absolute-path injection, and writing into parent directories must be rejected.
- Paths printed in help or next-step examples must be copy-safe when project paths include spaces.
- Shell examples must be safe for the target shell family: macOS/Linux POSIX shells, Windows PowerShell, Git Bash, and WSL.

## Root Detection

- Commands must resolve and report the project root used for reads and writes.
- Running from a subdirectory, a worktree, or a simple monorepo package must produce deterministic root resolution.
- If multiple plausible roots exist, the command must stop and ask for an explicit root or print the safe command to run.

## Package Manager Detection

- Quiver must prefer the package manager indicated by lockfiles and package metadata.
- Detection priority must be deterministic and documented.
- Suggested commands must match the detected package manager: npm, pnpm, yarn, or bun.
- If detection is ambiguous, Quiver must report the ambiguity and use the safest explicit command form.

## Deterministic Ordering

- JSON arrays for specs, slices, agents, runs, approvals, blockers, evidence, and next steps must be sorted deterministically.
- Stable order should prefer declared dependency order, numeric slice order, created timestamp, and then id as a tiebreaker.
- Human summaries must follow the same order where practical.

## Status Catalogs

Commands must use shared canonical statuses from the resolver once slice-01 introduces them. Until then, commands must not invent one-off lifecycle names.

Minimum canonical families:

- Spec: `draft`, `planned`, `approved`, `in-progress`, `blocked`, `review`, `done`, `archived`
- Slice: `planned`, `ready`, `in-progress`, `blocked`, `review`, `completed`, `skipped`
- Run: `draft`, `waiting-approval`, `approved`, `running`, `blocked`, `done`, `failed`
- Agent: `idle`, `planning`, `reading`, `coding`, `reviewing`, `blocked`, `waiting-approval`, `done`
- Approval: `pending`, `approved`, `rejected`, `superseded`

## JSON Schema and Versioning

- Machine-readable exports must include `schema_version`.
- Breaking changes require a new schema version and migration guidance.
- Payloads must include `generated_at`, `project_root`, `source`, and `warnings`.
- Optional fields must be present as empty arrays/objects when that makes downstream parsing simpler and stable.

## Legacy and Strict Modes

- Existing commands should preserve legacy behavior by default when changing output would break users.
- New strict behavior may be introduced behind explicit flags or by adding new command variants.
- When legacy behavior is used, output should point to the stricter command or flag where appropriate.

## Security and Redaction

- Secrets, tokens, auth headers, provider keys, private URLs, and unnecessary absolute local paths must be redacted from committed fixtures and generated evidence.
- Raw AI transcripts must be stored separately from clean drafts.
- Redaction must happen before writing logs that may be committed.

## Validation Expectations

Each implementation slice must add or update tests for the contracts it touches. At minimum:

- Successful `--format json` output parses as JSON.
- Failing commands write diagnostics to `stderr` and exit non-zero.
- Dry-run commands leave the git diff unchanged.
- Path safety rejects writes outside the project root.
- Fixtures preserve deterministic order.

