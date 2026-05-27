# Evidence Report - Quiver v32 npx Installation Guidance

## Summary

Documentation-only change. No product code was modified.

## Evidence

| Command | Status | Notes |
|---|---|---|
| `git diff --check` | Passed | No whitespace errors. |
| `node bin/create-quiver.js spec validate specs/quiver-v32-npx-installation-guidance` | Passed | Spec package validated with one completed slice. |

## Slice Evidence

| Slice | Status | Evidence |
|---|---|---|
| `slice-00-installation-docs` | Completed | README, installation guide, troubleshooting, templates, command reference, source-of-truth docs, and PR body updated. |

## Manual Review

- README now explains `npx` vs local installation.
- A dedicated installation guide explains when `node_modules` is expected.
- Troubleshooting includes the `node_modules` confusion case.
- Generated documentation templates include the same guidance.
- `README_FOR_AI.md` is synchronized.
