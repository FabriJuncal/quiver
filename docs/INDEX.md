# Quiver Documentation Index

**Last updated:** 2026-05-29

Use this file as the first documentation map before planning, implementing, reviewing, or opening PRs in this repository. Prefer the smallest set of linked documents that fits the task.

## Start Here

- **Public overview:** [`../README.md`](../README.md)
- **AI guide:** [`../README_FOR_AI.md`](../README_FOR_AI.md)
- **CLI UX standards:** [`./CLI_UX_GUIDE.md`](./CLI_UX_GUIDE.md)
- **Command reference:** [`./reference/commands.md`](./reference/commands.md)
- **Troubleshooting:** [`./TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)
- **Git and PR workflow:** [`./GITFLOW_PR_GUIDE.md`](./GITFLOW_PR_GUIDE.md)

## Getting Started

- **Install and npx behavior:** [`./getting-started/installation.md`](./getting-started/installation.md)
- **macOS setup:** [`./getting-started/macos.md`](./getting-started/macos.md)
- **Linux setup:** [`./getting-started/linux.md`](./getting-started/linux.md)
- **Windows PowerShell setup:** [`./getting-started/windows-powershell.md`](./getting-started/windows-powershell.md)
- **Windows Git Bash / WSL setup:** [`./getting-started/windows-git-bash-wsl.md`](./getting-started/windows-git-bash-wsl.md)

## Workflows

- **New project:** [`./workflows/new-project.md`](./workflows/new-project.md)
- **Existing project:** [`./workflows/existing-project.md`](./workflows/existing-project.md)
- **Legacy Quiver project:** [`./workflows/legacy-quiver-project.md`](./workflows/legacy-quiver-project.md)
- **Full AI spec-to-PR flow:** [`./workflows/full-ai-spec-to-pr.md`](./workflows/full-ai-spec-to-pr.md)

## AI Configuration

- **AI principles:** [`./ai/PRINCIPLES.md`](./ai/PRINCIPLES.md)
- **AI rules:** [`./ai/RULES.yaml`](./ai/RULES.yaml)

## Specs

Canonical specs live outside `docs/` in [`../specs/`](../specs/).

Recent specs:

- [`../specs/quiver-v45-ci-actions-node24-readiness/SPEC.md`](../specs/quiver-v45-ci-actions-node24-readiness/SPEC.md)
- [`../specs/quiver-v44-provider-live-output-tui-lite/SPEC.md`](../specs/quiver-v44-provider-live-output-tui-lite/SPEC.md)
- [`../specs/quiver-v43-cli-i18n-audit-release-readiness/SPEC.md`](../specs/quiver-v43-cli-i18n-audit-release-readiness/SPEC.md)
- [`../specs/quiver-v42-cli-i18n-generated-docs/SPEC.md`](../specs/quiver-v42-cli-i18n-generated-docs/SPEC.md)
- [`../specs/quiver-v41-cli-i18n-ai-lifecycle/SPEC.md`](../specs/quiver-v41-cli-i18n-ai-lifecycle/SPEC.md)
- [`../specs/quiver-v40-cli-i18n-spec-slice-workflows/SPEC.md`](../specs/quiver-v40-cli-i18n-spec-slice-workflows/SPEC.md)
- [`../specs/quiver-v39-cli-i18n-setup-onboarding/SPEC.md`](../specs/quiver-v39-cli-i18n-setup-onboarding/SPEC.md)
- [`../specs/quiver-v38-cli-i18n-read-only-commands/SPEC.md`](../specs/quiver-v38-cli-i18n-read-only-commands/SPEC.md)
- [`../specs/quiver-v37-cli-i18n-foundation/SPEC.md`](../specs/quiver-v37-cli-i18n-foundation/SPEC.md)
- [`../specs/quiver-v36-ai-run-watch-portable/SPEC.md`](../specs/quiver-v36-ai-run-watch-portable/SPEC.md)
- [`../specs/quiver-v35-compact-dashboard-version-ux/SPEC.md`](../specs/quiver-v35-compact-dashboard-version-ux/SPEC.md)
- [`../specs/quiver-v34-cli-dashboard-status/SPEC.md`](../specs/quiver-v34-cli-dashboard-status/SPEC.md)

For implementation work, read the target spec and the target slice's `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md` only.

## Templates

These files are templates for generated projects or optional profiles. Do not treat them as concrete project state unless the task is about templates or init output:

- [`./AI_CONTEXT.md.template`](./AI_CONTEXT.md.template)
- [`./AI_ONBOARDING_PROMPT.md.template`](./AI_ONBOARDING_PROMPT.md.template)
- [`./COMMANDS.md.template`](./COMMANDS.md.template)
- [`./CONTEXTO.md.template`](./CONTEXTO.md.template)
- [`./DECISIONS.md.template`](./DECISIONS.md.template)
- [`./DOCUMENTATION_GUIDE.md.template`](./DOCUMENTATION_GUIDE.md.template)
- [`./STATUS.md.template`](./STATUS.md.template)
- [`./SUPPORT_MATRIX.md.template`](./SUPPORT_MATRIX.md.template)
- [`./TESTING_GUIDE_FOR_AI.md.template`](./TESTING_GUIDE_FOR_AI.md.template)
- [`./WORKFLOW.md.template`](./WORKFLOW.md.template)
- [`./ai/LESSONS.md.template`](./ai/LESSONS.md.template)

## Task Routing

- **Documentation/index work:** read this index, then the affected docs only.
- **CLI UX, output, dashboard, or version work:** read [`./CLI_UX_GUIDE.md`](./CLI_UX_GUIDE.md), [`./reference/commands.md`](./reference/commands.md), and the relevant spec.
- **Spec or slice execution:** read the relevant [`../specs/`](../specs/) package, especially the target slice files.
- **PR creation:** read [`./GITFLOW_PR_GUIDE.md`](./GITFLOW_PR_GUIDE.md) and the relevant `pr.md`.
- **Troubleshooting or install issues:** read [`./TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) and the matching getting-started guide.
- **AI agent behavior:** read [`../README_FOR_AI.md`](../README_FOR_AI.md), [`./ai/PRINCIPLES.md`](./ai/PRINCIPLES.md), and [`./ai/RULES.yaml`](./ai/RULES.yaml).

## Known Documentation Debt

The following concrete docs are referenced by templates or generated-project guidance but do not currently exist as repository docs:

- `docs/CONTEXTO.md`
- `docs/WORKFLOW.md`
- `docs/STATUS.md`
- `docs/SUPPORT_MATRIX.md`
- `docs/TESTING_GUIDE_FOR_AI.md`
- `docs/AI_CONTEXT.md`
- `docs/AI_ONBOARDING_PROMPT.md`
- `docs/DECISIONS.md`
- `docs/ai/LESSONS.md`

Use the `.template` files only when the task is about generated project output or template maintenance.
