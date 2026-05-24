# Coverage Matrix - Quiver v27 Reliability and AI Workflow Hardening

## Purpose

This matrix maps every Pixel Quiver dogfooding problem (`QP-*`) and improvement suggestion (`QIS-*`) to the v27 implementation slice that must close it.

The source files are evidence inputs, not fixtures. Do not copy unsanitized local paths, user names, command output, or project-specific data into committed fixtures without explicit sanitization.

## Problem Coverage

| Evidence | Area | Primary Slice | Risk if missed | Validation strategy |
|---|---|---|---|---|
| QP-001 | `flow` source discovery and stale examples | slice-07 | Users and agents follow incorrect next steps. | Fixture with current and stale spec state; `flow` output checked against resolver state. |
| QP-002 | Paths with spaces and copy-safe examples | slice-08 | Commands fail in common macOS/Linux/Windows project paths. | Cross-platform path formatting snapshots for macOS, Linux, PowerShell, Git Bash, and WSL examples. |
| QP-003 | Classic and AI commands disagree about completed slices | slice-01, slice-02 | Agents act on incomplete or stale lifecycle state. | Shared resolver tests plus export tests with completed, planned, blocked, and active slices. |
| QP-004 | GitHub authentication and alias guidance | slice-08 | PR creation or preflight fails late with unclear recovery. | `ai doctor` and PR preflight fixtures for missing `gh`, wrong account, missing scopes, and alias expectations. |
| QP-005 | Analyzer misdetects React/Vite context | slice-07 | Context docs are wrong, causing bad onboarding and bad prompts. | React/Vite fixture with expected stack detection and no false Vue classification. |
| QP-006 | `prepare-context` lacks evidence and next-step clarity | slice-07 | Agents cannot trust generated context or understand what to do next. | Snapshot output includes evidence, stale/missing docs, and next safe command. |
| QP-007 | Agent docs gaps and missing prompts | slice-07, slice-08 | Users manually invent onboarding and execution prompts. | Docs/help tests confirm planner, executor, and handoff guidance exists and links to generated files. |
| QP-008 | Source-of-truth docs drift | slice-00, slice-07 | README, roadmap, and AI docs contradict product state. | Documentation audit plus docs sync checks in final release slice. |
| QP-009 | `ai revise` grows context without compaction | slice-04 | Planner calls exceed provider limits or waste tokens. | Token-limit fixture validates compacted feedback or safe refusal before provider overflow. |
| QP-010 | Prompt echo and raw logs mix into final drafts | slice-04 | Specs and plans contain unusable provider noise. | AI artifact fixture separates clean draft from raw transcript and redacts secrets. |
| QP-011 | `spec create` ignores approved plan structure | slice-03 | Quiver creates generic or incomplete scaffolds after approval. | Approved-plan fixture creates expected spec, slices, handoffs, execution plan, and PR body. |
| QP-012 | Failed `spec create` leaves empty dirs | slice-03 | Repo state becomes dirty and confusing after failure. | Failure fixture asserts no partial writes or exact recovery report. |
| QP-013 | `check-slice --local` misses execution preconditions | slice-06 | Later execution fails after a passing local check. | Local check fixture validates required git, worktree, brief, dependency, and scope preconditions or lists skipped checks. |
| QP-014 | `analyze --dry-run` writes files | slice-07 | Users cannot safely inspect impact before generating docs. | Dry-run test asserts no file changes, including `.quiver/`, `docs/`, and `specs/`. |
| QP-015 | `doctor` points to wrong spec/slice examples | slice-07 | First-use guidance sends users to stale work. | Doctor fixture derives active spec/slice from resolver state. |
| QP-016 | `check-scope` assumes wrong base branch | slice-06 | Valid branches fail scope checks or bad diffs are compared. | Scope fixtures cover `--base`, `git.base_branch`, remote default, and fallback order. |
| QP-017 | `check-handoff` missing actionable template/aliases | slice-06 | Users cannot quickly fix invalid briefs. | Handoff fixture prints missing headings, minimal template, and supported aliases. |
| QP-018 | Worktree lifecycle causes nested/conflicting worktrees | slice-05 | Spec work becomes scattered, dirty, or unsafe to merge. | Worktree fixtures cover persistent spec worktree, locks, stale state, dirty state, and recovery. |
| QP-019 | JSON export not dashboard-ready | slice-02 | UIs and agents need custom parsing or cannot consume Quiver state. | JSON schema and fixture parse tests with deterministic output. |

## Suggestion Coverage

| Evidence | Area | Primary Slice | Risk if missed | Validation strategy |
|---|---|---|---|---|
| QIS-001 | Improve `flow` source references | slice-07 | Flow output remains untrustworthy. | Flow snapshot includes source file, status, and active target. |
| QIS-002 | Quote/copy-safe command examples | slice-08 | Users with spaces in paths hit preventable failures. | Help snapshot validates quoted examples per shell family. |
| QIS-003 | Add/strengthen `spec validate` | slice-06 | Broken specs/slices pass until later commands fail. | Spec validation fixture covers schema, dependencies, briefs, worktree hints, and source metadata. |
| QIS-004 | Export canonical dashboard data | slice-02 | Dashboard and agents keep using unstable ad-hoc output. | Export schema fixture validates required top-level datasets and aggregates. |
| QIS-005 | Generate executor handoff packages | slice-06 | Executors need too much context and burn tokens. | Handoff package fixture includes only selected slice, briefs, constraints, evidence, and validation commands. |
| QIS-006 | One resolver for classic and AI commands | slice-01 | Commands keep disagreeing about lifecycle state. | Unit tests require classic and AI command adapters to consume the same resolver output. |
| QIS-007 | Improve framework detection | slice-07 | Context docs misrepresent stack and workflow. | Analyzer fixtures for React/Vite, package-manager variants, and unknown stack. |
| QIS-008 | Evidence-backed context generation | slice-07 | Generated docs cannot be trusted or maintained. | `prepare-context` output references source files and marks assumptions. |
| QIS-009 | GitHub/PR readiness diagnostics | slice-08 | PR creation fails late. | Doctor/preflight output includes `gh`, auth, account, scopes, alias, remote, and next action. |
| QIS-010 | Agent onboarding guide | slice-07, slice-08 | Users manually paste long prompts repeatedly. | README/help docs expose planner/executor/doctor/reviewer flows with minimal-context guidance. |
| QIS-011 | `ai agent set --dry-run` or equivalent preflight | slice-08 | Users configure agents without seeing effect or missing dependencies. | Dry-run setup output lists provider command, availability, and files that would change without writing. |
| QIS-012 | Token compaction for revisions | slice-04 | Iteration becomes expensive and brittle. | Revision fixture compacts accepted history and preserves required decisions. |
| QIS-013 | Separate clean draft and raw transcript | slice-04 | Prompt echo corrupts committed docs. | Artifact tests assert separate files and redacted raw output. |
| QIS-014 | Approved-plan parser | slice-03 | Structured human approvals cannot become accurate slices. | Parser fixtures cover valid, invalid, partial, and ambiguous slice blocks. |
| QIS-015 | Deterministic slug/path generation | slice-03 | Repeated `spec create` creates inconsistent names or collisions. | Slug fixtures cover accents, spaces, punctuation, long titles, and collisions. |
| QIS-016 | Stronger slice execution gate | slice-06 | Execution starts with missing dependencies or invalid scope. | `start-slice`/`check-slice` fixture blocks unsafe execution and prints recovery. |
| QIS-017 | Strict dry-run contract | slice-07 | Trust in Quiver inspection commands is lost. | Dry-run mutation guard across analysis/context commands. |
| QIS-018 | Doctor active-state awareness | slice-07 | Doctor suggests stale examples. | Doctor fixture uses resolver current state and reports stale docs. |
| QIS-019 | Base branch configuration | slice-06 | Scope checks fail in repos using `main`, `develop`, or custom branches. | Base resolution fixture covers CLI option, slice config, git config, remote HEAD, fallback. |
| QIS-020 | Handoff template guidance | slice-06 | Invalid briefs are hard to fix. | `check-handoff` output includes minimal copyable template. |
| QIS-021 | Persistent spec worktree lifecycle | slice-05 | One-spec-per-worktree model remains manual and error-prone. | Worktree commands create/reuse/report one persistent worktree per spec. |
| QIS-022 | Machine-readable output contract | slice-02 | Agents cannot parse command output safely. | `--format json` tests validate stdout-only JSON, stderr diagnostics, schema versioning, and deterministic ordering. |

## Slice Responsibility Summary

| Slice | Responsibility |
|---|---|
| slice-00 | Documentary foundation, evidence mapping, command contracts, v24/v25/v26 audit. |
| slice-01 | Shared state resolver and canonical statuses for specs, slices, runs, approvals, agents, evidence, and worktrees. |
| slice-02 | Stable JSON export and pure machine-readable command output. |
| slice-03 | Approved technical plan parsing and reliable spec/slice generation. |
| slice-04 | AI draft storage, raw logs, redaction, and token compaction. |
| slice-05 | Persistent spec worktree lifecycle, locks, recovery, and no nested worktrees. |
| slice-06 | Validation gates, scope safety, handoff packages, and local execution preconditions. |
| slice-07 | Context analysis, prepare-context, flow, doctor, dry-run safety, and source-backed docs. |
| slice-08 | Cross-platform help, GitHub auth, agent setup guidance, and first-use DX. |
| slice-09 | Fixtures, smoke tests, docs sync, package smoke, and release readiness. |

