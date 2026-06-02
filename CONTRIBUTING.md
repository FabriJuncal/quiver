# Contributing

Thanks for contributing to Quiver. This repository is the source for the
`create-quiver` CLI, the generated workflow templates, and the public docs used
by teams adopting WDD + SDD.

## Prerequisites

- Node.js and npm. Use the version declared in `package.json` when present; if
  no runtime metadata is present on your branch, match the Node version used by
  CI.
- Git and GitHub CLI (`gh`) for PR workflows.
- ShellCheck when changing Bash scripts under `scripts/`.

## Setup

```bash
git clone git@github.com:FabriJuncal/quiver.git
cd quiver
npm ci
node bin/create-quiver.js --help
```

Quiver is normally executed through `npx create-quiver` by users. Contributors
can run the local checkout directly with `node bin/create-quiver.js ...`.

## Repository Workflow

1. Open or reference an issue, audit finding, or approved requirement.
2. Work from the relevant spec under `specs/quiver-vNN-*`.
3. Execute one slice at a time and keep one commit per slice.
4. Keep changes inside the slice `files` or `allowed_write_paths`.
5. Record validation evidence in the spec's `EVIDENCE_REPORT.md`.
6. Update the slice `CLOSURE_BRIEF.md`, `STATUS.md`, and `slice.json` when a
   slice is completed.
7. Open one PR per slice by default using the relevant `pr.md`.
8. Group slices in one PR only when the grouped PR policy in
   `docs/GITFLOW_PR_GUIDE.md` allows it.

Use the branch and base metadata in the target `slice.json`. If a branch guide
and `slice.json` disagree, prefer the current slice metadata and document the
decision in the PR notes.

## Specs and Slices

The real convention in this repository is:

```text
specs/quiver-vNN-short-name/
├─ SPEC.md
├─ STATUS.md
├─ EVIDENCE_REPORT.md
├─ EXECUTION_PLAN.md
├─ pr.md
└─ slices/
   └─ slice-XX-short-name/
      ├─ slice.json
      ├─ EXECUTION_BRIEF.md
      └─ CLOSURE_BRIEF.md
```

Do not document `docs/specs` as the canonical source for this repo. Generated
projects may receive their own `specs/<project-slug>/...` tree, but Quiver's
own dogfooding specs live under `specs/quiver-vNN-*`.

## Useful Commands

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js spec validate specs/<spec-dir>
node bin/create-quiver.js check-slice specs/<spec-dir>/slices/<slice-id>/slice.json --local
node bin/create-quiver.js check-scope specs/<spec-dir>/slices/<slice-id>/slice.json --base origin/main --strict
npm run test:ci
npm run docs:check
npm run package:quiver
bash scripts/ci/smoke-create-quiver.sh
```

Current public CLI commands include legacy workflow names such as
`start-slice`, `check-slice`, `check-pr`, `check-handoff`, `new-handoff`,
`cleanup-slice`, `check-scope`, and `refresh-active-slices`. Do not document
newer namespace aliases unless they appear in `node bin/create-quiver.js --help`
on the branch you are changing.

## Validation Expectations

Run the smallest test set that proves the slice, then run broader gates when
the slice affects shared CLI behavior, package metadata, templates, or release
checks.

Recommended validation by change type:

| Change type | Minimum validation |
|---|---|
| Spec or slice docs only | `node bin/create-quiver.js spec validate specs/<spec-dir>` and `git diff --check` |
| CLI behavior | Targeted `npm run test:ci -- tests/...`, then `npm run test:ci` when shared paths change |
| Templates/generated docs | Init/analyze/doctor targeted tests plus `npm run docs:check` when docs links or public docs change |
| Package boundary | `npm run package:quiver` and installed CLI smoke when package contents change |
| Scripts | Relevant smoke script and ShellCheck for Bash scripts |

CI uses the same local equivalents:

- `npm ci` installs from the committed lockfile.
- `npm run test:ci` runs Node's native test runner through `scripts/ci/run-node-tests.js` without shell glob expansion.
- `npm run docs:lint` checks a controlled public-docs markdown scope.
- `npm run docs:links` checks local documentation links and ignores external URLs to avoid flaky network gates.
- `npm run package:quiver` validates the npm package boundary.

Always record commands, exit codes, and meaningful output in the relevant
`EVIDENCE_REPORT.md`.

## PR Requirements

Follow `docs/GITFLOW_PR_GUIDE.md` for PR structure, PR sizing, and merge
policy. Slice PR bodies must use:

- `## Title`
- `## Summary`
- `## PR Policy`
- `## Scope`
- `## Files`
- `## How to Test (DETAILED - REQUIRED)`
- `## Evidence`
- `## Rollback`
- `## Risks / Notes`

Use draft PRs while a spec or slice still needs review. Do not include local
audit inputs, PDFs, `.DS_Store`, worktrees, provider state, or secrets.

Open an individual PR when a slice changes functional code, UI/UX, Supabase,
Edge Functions, auth, storage, preview, performance/code-splitting, refactors,
or tests/CI gates. Grouped PRs are limited to at most 2-3 docs-only,
research-only, or low-risk mechanical-cleanup slices, with separate evidence
and no behavior changes.

Human merge is the default. Agents may create PRs, fix CI, monitor checks, and
mark PRs as ready. Assisted auto-merge requires explicit human authorization and
is limited to low-risk docs-only or chore-only PRs with green checks, no runtime
or production configuration changes, and no pending comments.

## Templates and Examples

- Human docs templates live under `docs/*.template` and localized variants use
  `.es.template`.
- Machine templates such as `slice.json` are not localized.
- Spec templates live under `specs/[project-name]/`.
- Optional examples live under `docs/examples/`; generated demo output must not
  be committed unless the slice explicitly asks for it.

## Package Boundary

The npm package is validated by `scripts/package-quiver.sh`. It requires the
runtime CLI, docs/templates, public metadata, community files, and package
scripts. It excludes tests, examples, old historical specs, CI-only scripts,
local PDFs, local AI state, worktrees, env files, npm credentials, and other
developer-only artifacts.

If a contribution changes what should be published, update the package smoke and
package-safety expectations in the same slice.
