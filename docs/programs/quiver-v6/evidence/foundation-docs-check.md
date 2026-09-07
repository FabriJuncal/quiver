# Quiver Evidence

- Command: `npm run docs:check`
- Exit code: 0
- Duration ms: 5851
- Started at: 2026-09-07T01:48:57.074Z
- Finished at: 2026-09-07T01:49:02.928Z
- Signal: -
- Output truncated: no

## Stdout

````text

> create-quiver@0.17.6 docs:check
> npm run docs:lint && npm run docs:links && npm run docs:commands:check


> create-quiver@0.17.6 docs:lint
> node scripts/ci/check-docs-markdown.js

Markdown lint scope: 23 files
markdownlint-cli2 v0.22.1 (markdownlint v0.40.0)
Finding: .github/pull_request_template.md ARCHITECTURE.md CONTRIBUTING.md README.md SECURITY.md docs/CLI_UX_GUIDE.md docs/GITFLOW_PR_GUIDE.md docs/INDEX.md docs/TROUBLESHOOTING.md docs/ai/PRINCIPLES.md docs/getting-started/installation.md docs/getting-started/linux.md docs/getting-started/macos.md docs/getting-started/windows-git-bash-wsl.md docs/getting-started/windows-powershell.md docs/reference/commands.md docs/reference/slice-schema.md docs/workflows/existing-project-ai-quiver-setup.md docs/workflows/existing-project.md docs/workflows/full-ai-spec-to-pr.md docs/workflows/legacy-quiver-project.md docs/workflows/new-project.md docs/workflows/requirements-and-plans.md
Linting: 23 file(s)
Summary: 0 error(s)

> create-quiver@0.17.6 docs:links
> node scripts/ci/check-doc-links.js

Markdown link scope: 23 files

> create-quiver@0.17.6 docs:commands:check
> node scripts/ci/check-command-reference.js --check

CLI command reference
Mode: check
Docs file: docs/reference/commands.md
Groups: 7
Commands: 62
PASS: command reference is synchronized.

````

## Stderr

````text

````
