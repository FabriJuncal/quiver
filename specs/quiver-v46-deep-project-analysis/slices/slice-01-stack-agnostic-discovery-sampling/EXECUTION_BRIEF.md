# EXECUTION_BRIEF - slice-01 Stack-agnostic discovery and sampling

## Context

This slice starts runtime implementation for the new `ai analyze-project` command but keeps it deterministic and read-only. It must not execute a provider and must not write files.

## Objective

Create the command shell, dry-run output, discovery, sampling, budgets, scope handling, and safety exclusions needed before any AI provider work can be added.

## Acceptance Criteria

- `ai analyze-project` exists and is read-only by default.
- `--dry-run` writes no files and runs no provider.
- Human output lists selected files, omitted files, budgets, roots, scope, safety exclusions, and next commands.
- `--json` produces clean machine-readable output.
- Sampling respects `--max-files`, `--max-bytes`, `--include-source`, `--include-tests`, `--include-db`, and `--scope`.
- Secrets, dependencies, caches, build outputs, `.git`, binary files, and outside-repo symlinks are excluded.
- Monorepo/workspace roots are reported.

## Production Guardrails

- `--json` is format only; it must not imply writes or provider execution.
- No-TTY behavior must not wait for interaction.
- Symlinks must be omitted unless they resolve inside the repo and an explicit future mode supports following them.

## Completion Checklist

- [ ] Parser and command dispatch added.
- [ ] Discovery/sampling module added.
- [ ] Dry-run report implemented.
- [ ] Fixtures and tests added.
- [ ] No provider or write path introduced.
