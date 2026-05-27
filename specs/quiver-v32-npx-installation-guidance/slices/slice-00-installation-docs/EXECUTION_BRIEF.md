# Execution Brief - slice-00-installation-docs

## Context

Users can run Quiver with `npx --yes create-quiver@latest` and expect the package to appear in project `node_modules`. The expected npm behavior is that `npx` runs the CLI from npm's execution cache unless the package is explicitly installed locally.

## Objective

Document the `npx` vs local installation behavior clearly across public docs, troubleshooting, templates, and AI source-of-truth guidance.

## Scope

- Root README summary.
- Dedicated installation guide.
- Troubleshooting entry.
- Command reference note.
- Generated docs template note.
- `README_FOR_AI.md` synchronization.

## Criterios de aceptación

- README includes a concise explanation of why Quiver may not appear in `node_modules`.
- Installation guide explains `npx`, npm cache execution, and `devDependency` installation.
- Troubleshooting covers the user confusion as a recoverable expected behavior.
- Templates include the same guidance for generated projects.
- No product code is modified.

## Plan técnico resumido

1. Add the public README section and link.
2. Add `docs/getting-started/installation.md`.
3. Add `docs/TROUBLESHOOTING.md`.
4. Update generated troubleshooting and command templates.
5. Update `README_FOR_AI.md`.
6. Validate docs and spec package.

## Restricciones

- Do not recommend global installation.
- Do not change runtime behavior.
- Do not change npm package metadata.

## Riesgos

- Duplicating too much setup guidance in the root README.
- Confusing `npx create-quiver` local resolution with `npx --yes create-quiver@latest` latest resolution.

## Checklist de finalización

- [x] README updated.
- [x] Installation guide added.
- [x] Troubleshooting added.
- [x] Templates updated.
- [x] `README_FOR_AI.md` updated.
- [x] Validation commands run.
- [ ] PR opened.
