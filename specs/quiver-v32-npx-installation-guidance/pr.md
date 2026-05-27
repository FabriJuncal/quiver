## Title

Quiver v32: clarify npx vs local installation

## Summary

- Explains why `npx --yes create-quiver@latest` does not install Quiver into project `node_modules`.
- Adds a dedicated installation guide for `npx` vs local `devDependency` usage.
- Adds troubleshooting guidance for users who expect Quiver in `node_modules`.
- Aligns generated docs templates and `README_FOR_AI.md`.

## Scope

- Public README guidance.
- Installation guide under `docs/getting-started/`.
- Troubleshooting entry.
- Command reference and generated docs template notes.
- Documentation-only WDD/SDD traceability.

## Files

- `README.md`
- `README_FOR_AI.md`
- `docs/getting-started/installation.md`
- `docs/reference/commands.md`
- `docs/TROUBLESHOOTING.md`
- `docs/TROUBLESHOOTING.md.template`
- `docs/COMMANDS.md.template`
- `specs/quiver-v32-npx-installation-guidance/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- Local Quiver source checkout.

### Worktree Access

- Use a dedicated docs branch for this PR.
- No product-code changes are expected.

### Run the Project

This is a documentation-only change. No app runtime is needed.

### Use Cases

- Read the README and confirm it explains why `npx` does not populate `node_modules`.
- Read `docs/getting-started/installation.md` and confirm it explains when to use `npx` and when to install `create-quiver` as a `devDependency`.
- Read `docs/TROUBLESHOOTING.md` and confirm it covers the `node_modules` confusion.
- Inspect templates to confirm generated projects inherit the same explanation.

### Technical Verification

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v32-npx-installation-guidance`

## Evidence

- Documentation updated in public, reference, troubleshooting, template, and AI source-of-truth surfaces.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v32-npx-installation-guidance` passed.

## Rollback

Revert this documentation slice commit. No runtime behavior or package installation behavior changed.

## Risks / Notes

- This PR does not change how `init` or `migrate` may install local dev dependencies.
- The guidance intentionally keeps `npx --yes create-quiver@latest` as the recommended bootstrap path.
