# Quiver v32 - npx Installation Guidance

## Objective

Clarify the expected installation behavior of Quiver when users run it with `npx`, especially why it does not appear in project `node_modules` unless installed explicitly as a development dependency.

## Problem

Users can run:

```bash
npx --yes create-quiver@latest ...
```

and expect the package to appear in `node_modules`. That is not how `npx` works, but the repository documentation did not explain the distinction clearly enough.

## Scope

- Add concise public-facing guidance to `README.md`.
- Add a deeper installation guide under `docs/getting-started/`.
- Add troubleshooting guidance for the common `node_modules` confusion.
- Update generated-project troubleshooting and command templates.
- Keep `README_FOR_AI.md` synchronized as the AI source of truth.

## Non-Scope

- No product code changes.
- No npm publication.
- No changes to package installation behavior.
- No automatic local install changes.

## Acceptance Criteria

- Given a user runs Quiver with `npx --yes create-quiver@latest`, when they read the README, then they understand why Quiver may not appear in `node_modules`.
- Given a team wants a pinned Quiver version, when they read the installation guide, then they can install `create-quiver` as a `devDependency`.
- Given a user searches troubleshooting, when they see the `node_modules` entry, then they get the expected behavior, recovery path, and relevant links.
- Given generated project docs are created from templates, when troubleshooting and command docs are inspected, then the same `npx` vs local install contract is represented.
- Given an AI agent uses `README_FOR_AI.md`, when it explains installation, then it does not recommend global install and correctly distinguishes `npx` from local devDependency usage.

## Files

- `README.md`
- `README_FOR_AI.md`
- `docs/getting-started/installation.md`
- `docs/reference/commands.md`
- `docs/TROUBLESHOOTING.md`
- `docs/TROUBLESHOOTING.md.template`
- `docs/COMMANDS.md.template`
- `specs/quiver-v32-npx-installation-guidance/**`

## Validation

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v32-npx-installation-guidance`
- Documentation review for link consistency and scope.
