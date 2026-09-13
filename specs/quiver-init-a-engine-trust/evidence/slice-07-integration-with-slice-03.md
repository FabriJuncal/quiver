# Quiver Evidence

- Command: `/opt/homebrew/Cellar/node@22/22.22.2_2/bin/node scripts/ci/run-node-tests.js`
- Exit code: 0
- Duration ms: 100232
- Started at: 2026-09-13T01:03:06.062Z
- Finished at: 2026-09-13T01:04:46.295Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: extractUnreleasedSection returns only the current unreleased body
ok 1 - extractUnreleasedSection returns only the current unreleased body
  ---
  duration_ms: 0.908375
  type: 'test'
  ...
# Subtest: collectUnreleasedEntries reads categorized changelog bullets
ok 2 - collectUnreleasedEntries reads categorized changelog bullets
  ---
  duration_ms: 1.616292
  type: 'test'
  ...
# Subtest: runChangelogCheck requires an unreleased section with entries
ok 3 - runChangelogCheck requires an unreleased section with entries
  ---
  duration_ms: 7.3745
  type: 'test'
  ...
# Subtest: ai agent set, list, and show persist reusable profile settings
ok 4 - ai agent set, list, and show persist reusable profile settings
  ---
  duration_ms: 658.410667
  type: 'test'
  ...
# Subtest: ai agent supports named planner profiles and default selection
ok 5 - ai agent supports named planner profiles and default selection
  ---
  duration_ms: 962.932
  type: 'test'
  ...
# Subtest: ai agent set --dry-run previews the profile without writing state
ok 6 - ai agent set --dry-run previews the profile without writing state
  ---
  duration_ms: 222.142292
  type: 'test'
  ...
# Subtest: ai agent commands render Spanish human output while preserving profile state
ok 7 - ai agent commands render Spanish human output while preserving profile state
  ---
  duration_ms: 664.955542
  type: 'test'
  ...
# Subtest: ai agent supports doctor profiles and rejects researcher profiles
ok 8 - ai agent supports doctor profiles and rejects researcher profiles
  ---
  duration_ms: 706.89575
  type: 'test'
  ...
# Subtest: ai agent rejects unsupported providers with guidance
ok 9 - ai agent rejects unsupported providers with guidance
  ---
  duration_ms: 229.622167
  type: 'test'
  ...
# Subtest: ai agent show reports missing profile with actionable guidance
ok 10 - ai agent show reports missing profile with actionable guidance
  ---
  duration_ms: 198.301958
  type: 'test'
  ...
# Subtest: ai agent actionable errors render Spanish wrappers while preserving commands
ok 11 - ai agent actionable errors render Spanish wrappers while preserving commands
  ---
  duration_ms: 460.478459
  type: 'test'
  ...
# Subtest: ai onboard uses planner profile provider when provider is not explicit
ok 12 - ai onboard uses planner profile provider when provider is not explicit
  ---
  duration_ms: 399.068959
  type: 'test'
  ...
# Subtest: ai onboard can select a named planner profile for provider and model
ok 13 - ai onboard can select a named planner profile for provider and model
  ---
  duration_ms: 675.390792
  type: 'test'
  ...
# Subtest: ai agent set requires provider and model when prompts are unavailable
ok 14 - ai agent set requires provider and model when prompts are unavailable
  ---
  duration_ms: 192.0995
  type: 'test'
  ...
# Subtest: ai agent interactive set resolves provider and catalog model selections
ok 15 - ai agent interactive set resolves provider and catalog model selections
  ---
  duration_ms: 4.904958
  type: 'test'
  ...
# Subtest: ai agent interactive set can create an additional named profile
ok 16 - ai agent interactive set can create an additional named profile
  ---
  duration_ms: 212.68075
  type: 'test'
  ...
# Subtest: ai agent interactive set supports custom model id and display name
ok 17 - ai agent interactive set supports custom model id and display name
  ---
  duration_ms: 0.621375
  type: 'test'
  ...
# Subtest: ai agent doctor reports profile errors and warnings as JSON
ok 18 - ai agent doctor reports profile errors and warnings as JSON
  ---
  duration_ms: 489.071584
  type: 'test'
  ...
# Subtest: ai agent doctor human output uses checks and suggested fixes sections
ok 19 - ai agent doctor human output uses checks and suggested fixes sections
  ---
  duration_ms: 566.609125
  type: 'test'
  ...
# Subtest: ai agent repair --dry-run previews alias normalization without writing
ok 20 - ai agent repair --dry-run previews alias normalization without writing
  ---
  duration_ms: 210.839833
  type: 'test'
  ...
# Subtest: ai agent repair without dry-run refuses to write
ok 21 - ai agent repair without dry-run refuses to write
  ---
  duration_ms: 194.740958
  type: 'test'
  ...
# Subtest: runAnalyzeProject executes provider and applies validated docs by default
ok 22 - runAnalyzeProject executes provider and applies validated docs by default
  ---
  duration_ms: 75.6435
  type: 'test'
  ...
# Subtest: runAnalyzeProject default auto-apply preserves existing docs with managed block
ok 23 - runAnalyzeProject default auto-apply preserves existing docs with managed block
  ---
  duration_ms: 25.104083
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
ok 24 - runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
  ---
  duration_ms: 22.220083
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal --json emits clean parseable proposal result
ok 25 - runAnalyzeProject --save-proposal --json emits clean parseable proposal result
  ---
  duration_ms: 8.433667
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows human TTY progress during live provider execution
ok 26 - runAnalyzeProject shows human TTY progress during live provider execution
  ---
  duration_ms: 14.14525
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows linear progress without TTY during live provider execution
ok 27 - runAnalyzeProject shows linear progress without TTY during live provider execution
  ---
  duration_ms: 18.62225
  type: 'test'
  ...
# Subtest: runAnalyzeProject --dry-run does not call provider
ok 28 - runAnalyzeProject --dry-run does not call provider
  ---
  duration_ms: 2.449625
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid provider JSON without writing final docs
ok 29 - runAnalyzeProject rejects invalid provider JSON without writing final docs
  ---
  duration_ms: 8.249167
  type: 'test'
  ...
# Subtest: runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
ok 30 - runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
  ---
  duration_ms: 24.507625
  type: 'test'
  ...
# Subtest: runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
ok 31 - runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
  ---
  duration_ms: 24.05725
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
ok 32 - runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
  ---
  duration_ms: 10.390042
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
ok 33 - runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
  ---
  duration_ms: 24.948416
  type: 'test'
  ...
# Subtest: runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
ok 34 - runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
  ---
  duration_ms: 31.090958
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
ok 35 - runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
  ---
  duration_ms: 48.349625
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
ok 36 - runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
  ---
  duration_ms: 10.070375
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
ok 37 - runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
  ---
  duration_ms: 28.927
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects truncated-json provider fixture without writing final docs
ok 38 - runAnalyzeProject rejects truncated-json provider fixture without writing final docs
  ---
  duration_ms: 9.048792
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
ok 39 - runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
  ---
  duration_ms: 6.745
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
ok 40 - runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
  ---
  duration_ms: 43.490125
  type: 'test'
  ...
# Subtest: runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
ok 41 - runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
  ---
  duration_ms: 17.79575
  type: 'test'
  ...
# Subtest: provider retry fixtures define recoverable and exhausted attempt sequences
ok 42 - provider retry fixtures define recoverable and exhausted attempt sequences
  ---
  duration_ms: 2.052958
  type: 'test'
  ...
# Subtest: runAnalyzeProject retries retryable schema drift once and succeeds
ok 43 - runAnalyzeProject retries retryable schema drift once and succeeds
  ---
  duration_ms: 25.966
  type: 'test'
  ...
# Subtest: runAnalyzeProject fails safely after default retry exhaustion
ok 44 - runAnalyzeProject fails safely after default retry exhaustion
  ---
  duration_ms: 22.8095
  type: 'test'
  ...
# Subtest: runAnalyzeProject caps retries at two even when configured higher
ok 45 - runAnalyzeProject caps retries at two even when configured higher
  ---
  duration_ms: 8.5925
  type: 'test'
  ...
# Subtest: runAnalyzeProject reports provider schema issues with actionable detail
ok 46 - runAnalyzeProject reports provider schema issues with actionable detail
  ---
  duration_ms: 6.421959
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects provider failure without writing final docs
ok 47 - runAnalyzeProject rejects provider failure without writing final docs
  ---
  duration_ms: 13.76025
  type: 'test'
  ...
# Subtest: ai analyze-project --review writes approved docs with snapshot manifest
ok 48 - ai analyze-project --review writes approved docs with snapshot manifest
  ---
  duration_ms: 117.835125
  type: 'test'
  ...
# Subtest: ai analyze-project review cancellation writes nothing
ok 49 - ai analyze-project review cancellation writes nothing
  ---
  duration_ms: 8.041334
  type: 'test'
  ...
# Subtest: ai analyze-project review confirmation decline writes nothing
ok 50 - ai analyze-project review confirmation decline writes nothing
  ---
  duration_ms: 8.873041
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects no-TTY review without writing
ok 51 - ai analyze-project --review rejects no-TTY review without writing
  ---
  duration_ms: 10.811042
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects invalid edited proposal without writing
ok 52 - ai analyze-project --review rejects invalid edited proposal without writing
  ---
  duration_ms: 13.540292
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
ok 53 - ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
  ---
  duration_ms: 16.685083
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
ok 54 - ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
  ---
  duration_ms: 24.031792
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
ok 55 - ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
  ---
  duration_ms: 32.4805
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run applies a saved proposal without executing provider
ok 56 - ai analyze-project apply --run applies a saved proposal without executing provider
  ---
  duration_ms: 23.737541
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
ok 57 - ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
  ---
  duration_ms: 42.585459
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks stale saved proposals before writing
ok 58 - ai analyze-project apply --run blocks stale saved proposals before writing
  ---
  duration_ms: 22.980875
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run accepts revalidated manual proposal edits and records them
ok 59 - ai analyze-project apply --run accepts revalidated manual proposal edits and records them
  ---
  duration_ms: 16.814
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
ok 60 - ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
  ---
  duration_ms: 8.541625
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs without TTY fails before provider
ok 61 - ai analyze-project --apply-docs without TTY fails before provider
  ---
  duration_ms: 4.407542
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY cancel writes no final docs
ok 62 - ai analyze-project --apply-docs TTY cancel writes no final docs
  ---
  duration_ms: 13.453583
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY save proposal writes artifacts only
ok 63 - ai analyze-project --apply-docs TTY save proposal writes artifacts only
  ---
  duration_ms: 10.97425
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY view diff requires second decision
ok 64 - ai analyze-project --apply-docs TTY view diff requires second decision
  ---
  duration_ms: 11.594083
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY edit reuses review flow
ok 65 - ai analyze-project --apply-docs TTY edit reuses review flow
  ---
  duration_ms: 65.026583
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY apply writes docs through apply engine
ok 66 - ai analyze-project --apply-docs TTY apply writes docs through apply engine
  ---
  duration_ms: 12.887375
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY renders Spanish selector copy
ok 67 - ai analyze-project --apply-docs TTY renders Spanish selector copy
  ---
  duration_ms: 10.305625
  type: 'test'
  ...
# Subtest: ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
ok 68 - ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
  ---
  duration_ms: 297.482542
  type: 'test'
  ...
# Subtest: ai analyze-project --json emits clean machine-readable output
ok 69 - ai analyze-project --json emits clean machine-readable output
  ---
  duration_ms: 225.378125
  type: 'test'
  ...
# Subtest: ai analyze-project rejects analysis flags on other ai subcommands
ok 70 - ai analyze-project rejects analysis flags on other ai subcommands
  ---
  duration_ms: 239.6985
  type: 'test'
  ...
# Subtest: ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
ok 71 - ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
  ---
  duration_ms: 713.194542
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
ok 72 - ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
  ---
  duration_ms: 1125.519667
  type: 'test'
  ...
# Subtest: ai analyze-project --review remains a supported UX flag at CLI boundary
ok 73 - ai analyze-project --review remains a supported UX flag at CLI boundary
  ---
  duration_ms: 205.038417
  type: 'test'
  ...
# Subtest: compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
ok 74 - compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
  ---
  duration_ms: 274.831708
  type: 'test'
  ...
# Subtest: run-owned selection rejects a foreign run canonical input without any projection write
ok 75 - run-owned selection rejects a foreign run canonical input without any projection write
  ---
  duration_ms: 148.76375
  type: 'test'
  ...
# Subtest: run-owned acceptance selection requires canonical input path identity, not equal bytes
ok 76 - run-owned acceptance selection requires canonical input path identity, not equal bytes
  ---
  duration_ms: 170.412208
  type: 'test'
  ...
# Subtest: digest-bound save never infers a latest run from equal requirement bytes
ok 77 - digest-bound save never infers a latest run from equal requirement bytes
  ---
  duration_ms: 92.926791
  type: 'test'
  ...
# Subtest: restore recovers the valid predecessor of a corrupted last candidate without erasing either version
ok 78 - restore recovers the valid predecessor of a corrupted last candidate without erasing either version
  ---
  duration_ms: 106.981834
  type: 'test'
  ...
# Subtest: unsupported acknowledgement can select bytes but remains unverified and unapprovable
ok 79 - unsupported acknowledgement can select bytes but remains unverified and unapprovable
  ---
  duration_ms: 60.86475
  type: 'test'
  ...
# AI execute-plan completed
# Slices executed: 2
# Subtest: ai execute-plan CLI dry-run prints commands without calling providers
ok 80 - ai execute-plan CLI dry-run prints commands without calling providers
  ---
  duration_ms: 232.456084
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run supports manual mode
ok 81 - ai execute-plan CLI dry-run supports manual mode
  ---
  duration_ms: 229.382083
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
ok 82 - ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
  ---
  duration_ms: 223.581667
  type: 'test'
  ...
# Subtest: ai execute-plan CLI JSON exposes downstream wave and scope metadata
ok 83 - ai execute-plan CLI JSON exposes downstream wave and scope metadata
  ---
  duration_ms: 203.849958
  type: 'test'
  ...
# Subtest: runExecutePlan executes slices with commit enabled and stops on failure
ok 84 - runExecutePlan executes slices with commit enabled and stops on failure
  ---
  duration_ms: 5.383625
  type: 'test'
  ...
# Subtest: runExecutePlan requires --commit for real execution
ok 85 - runExecutePlan requires --commit for real execution
  ---
  duration_ms: 2.283792
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
ok 86 - runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
  ---
  duration_ms: 534.535625
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode rejects a concurrent run lock
ok 87 - runExecutePlan delegated mode rejects a concurrent run lock
  ---
  duration_ms: 162.418167
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run prints executor context and does not call provider
ok 88 - ai execute-slice CLI dry-run prints executor context and does not call provider
  ---
  duration_ms: 211.40175
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run shows opt-in commit mode
ok 89 - ai execute-slice CLI dry-run shows opt-in commit mode
  ---
  duration_ms: 227.746209
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run normalizes CLI display model aliases
ok 90 - ai execute-slice CLI dry-run normalizes CLI display model aliases
  ---
  duration_ms: 248.5785
  type: 'test'
  ...
# Subtest: ai execute-slice blocks legacy profile display aliases before provider execution
ok 91 - ai execute-slice blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 12.642167
  type: 'test'
  ...
# Subtest: ai prompt-slice CLI prints a minimal manual executor prompt
ok 92 - ai prompt-slice CLI prints a minimal manual executor prompt
  ---
  duration_ms: 226.960834
  type: 'test'
  ...
# Subtest: ai execute-slice dry-run renders Spanish wrapper without translating paths
ok 93 - ai execute-slice dry-run renders Spanish wrapper without translating paths
  ---
  duration_ms: 268.32125
  type: 'test'
  ...
# Subtest: ai execute-slice requires --slice
ok 94 - ai execute-slice requires --slice
  ---
  duration_ms: 0.593667
  type: 'test'
  ...
# Subtest: ai inspect, export, specs, slices, and trace expose lifecycle state
ok 95 - ai inspect, export, specs, slices, and trace expose lifecycle state
  ---
  duration_ms: 2051.199791
  type: 'test'
  ...
# Subtest: ai inspection commands render Spanish human output without localizing JSON
ok 96 - ai inspection commands render Spanish human output without localizing JSON
  ---
  duration_ms: 1512.161375
  type: 'test'
  ...
# Subtest: ai export rejects unsupported formats with a clear error
ok 97 - ai export rejects unsupported formats with a clear error
  ---
  duration_ms: 246.6875
  type: 'test'
  ...
# Subtest: ai export JSON writes parseable JSON to stdout and diagnostics to stderr
ok 98 - ai export JSON writes parseable JSON to stdout and diagnostics to stderr
  ---
  duration_ms: 477.382459
  type: 'test'
  ...
# Subtest: ai active-slice reconcile dry-run reports conflicts without writing files
ok 99 - ai active-slice reconcile dry-run reports conflicts without writing files
  ---
  duration_ms: 246.804
  type: 'test'
  ...
# Subtest: ai active-slice reconcile requires dry-run before writes exist
ok 100 - ai active-slice reconcile requires dry-run before writes exist
  ---
  duration_ms: 249.660167
  type: 'test'
  ...
# Subtest: ai models list groups models by provider in human output
ok 101 - ai models list groups models by provider in human output
  ---
  duration_ms: 214.388667
  type: 'test'
  ...
# Subtest: ai models list filters by provider
ok 102 - ai models list filters by provider
  ---
  duration_ms: 271.882708
  type: 'test'
  ...
# Subtest: ai models list --json emits clean parseable catalog metadata
ok 103 - ai models list --json emits clean parseable catalog metadata
  ---
  duration_ms: 212.4695
  type: 'test'
  ...
# Subtest: ai models list localizes Spanish human output without changing JSON
ok 104 - ai models list localizes Spanish human output without changing JSON
  ---
  duration_ms: 491.12725
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters with guidance
ok 105 - ai models list rejects unsupported provider filters with guidance
  ---
  duration_ms: 230.643792
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters in Spanish
ok 106 - ai models list rejects unsupported provider filters in Spanish
  ---
  duration_ms: 218.008417
  type: 'test'
  ...
# onboard output
# AI prepare-context write plan
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Planned writes: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-09z/snapshots/20260913T010309Z
# Proposed changes:
# - docs/INDEX.md: create (missing approved context doc)
# - docs/PROJECT_MAP.md: create (missing approved context doc)
# - docs/AI_CONTEXT.md: create (missing approved context doc)
# - docs/AI_ONBOARDING_PROMPT.md: create (missing approved context doc)
# - docs/CONTEXTO.md: create (missing approved context doc)
# - docs/WORKFLOW.md: create (missing approved context doc)
# - docs/ARCHITECTURE.md: create (missing approved context doc)
# - docs/STATUS.md: create (missing approved context doc)
# - docs/DECISIONS.md: create (missing approved context doc)
# Diff preview:
# --- docs/INDEX.md (current)
# +++ docs/INDEX.md (proposed)
# + \# demo-project Documentation Index
# + **Last updated:** 2026-09-13
# + \#\# Start Here
# + - **Context** - `./CONTEXTO.md`
# + - **AI Context** - `./AI_CONTEXT.md`
# + - **Decision Log** - `./DECISIONS.md`
# + - **AI Onboarding Prompt** - `./AI_ONBOARDING_PROMPT.md`
# --- docs/PROJECT_MAP.md (current)
# +++ docs/PROJECT_MAP.md (proposed)
# + \# Project Map
# + This file was prepared by `npx create-quiver ai prepare-context`.
# + Run `npx create-quiver analyze` to refresh it with a deeper repository scan.
# + \#\# Project
# + - Name: demo-project
# + - Slug: demo-project
# + - Package manager: npm
# + - package.json present: yes
# --- docs/AI_CONTEXT.md (current)
# +++ docs/AI_CONTEXT.md (proposed)
# + \# demo-project AI Context Pack
# + This file is the main context pack after `AGENTS.md` and `docs/PROJECT_MAP.md`. It compresses the working contract into one place and points to the canonical docs when deeper context is required.
# + \#\# What This Project Is
# + [Short project summary.]
# + \#\# Read First
# --- docs/AI_ONBOARDING_PROMPT.md (current)
# +++ docs/AI_ONBOARDING_PROMPT.md (proposed)
# + \# demo-project AI Onboarding Prompt
# + **Fecha:** 2026-09-13
# + **Estado:** En preparación
# + Lee este archivo y ejecútalo como fuente principal de verdad para incorporarte a este repositorio.
# + Actúa como asistente de onboarding de IA para este proyecto. Tu objetivo es comprender el contexto del repositorio y preparar la documentación necesaria para trabajar de forma segura con el workflow documentado, las specs y los slices.
# + \#\# Reglas de ejecución
# --- docs/CONTEXTO.md (current)
# +++ docs/CONTEXTO.md (proposed)
# + \# demo-project Context
# + \#\# What Is demo-project?
# + [One or two paragraphs that explain the project.]
# + \#\# Value Proposition
# + > "[Project tagline]"
# --- docs/WORKFLOW.md (current)
# +++ docs/WORKFLOW.md (proposed)
# + \# Workflow
# + **Date:** 2026-09-13
# + This document is the canonical implementation workflow for the project.
# + \#\# Core Rules
# + - Do not implement without a slice.
# + - One slice maps to one commit.
# --- docs/ARCHITECTURE.md (current)
# +++ docs/ARCHITECTURE.md (proposed)
# + \# demo-project Architecture
# + This document captures only what Quiver can infer safely from repository structure and docs.
# + \#\# Current Understanding
# + - Stack: Pending confirmation: no primary stack could be inferred from root signals.
# + - Source directories: src
# + - Package manager: npm
# + \#\# Boundaries
# --- docs/STATUS.md (current)
# +++ docs/STATUS.md (proposed)
# + \# demo-project Status
# + This page tracks progress, blockers, and the current slice. Stack and command details live in `docs/PROJECT_MAP.md`.
# + \#\# Overall Status
# + - Progress: 0% complete
# + - Current phase: Fase 0
# + - Next milestone: [Description]
# --- docs/DECISIONS.md (current)
# +++ docs/DECISIONS.md (proposed)
# + \# demo-project Decision Log
# + **Date:** 2026-09-13
# + **Status:** En preparación
# + This file records durable project decisions so AI agents do not re-litigate choices that were already made.
# + Use it for durable context-preparation choices too, especially when a missing generated doc is guidance-only rather than debt.
# + \#\# Log
# Files considered:
# - README.md: present (project entrypoint and human summary)
# - AGENTS.md: absent (agent router and reading rules)
# - README_FOR_AI.md: absent (framework guidance source; not project debt when absent)
# - docs/INDEX.md: absent (index-first navigation map)
# - docs/PROJECT_MAP.md: absent (stack, commands, and structure facts)
# - docs/WORKFLOW.md: absent (workflow rules and execution contract)
# - docs/AI_CONTEXT.md: absent (agent-facing project context pack)
# - docs/AI_ONBOARDING_PROMPT.md: absent (project-specific onboarding contract)
# - docs/CONTEXTO.md: absent (human-readable project context)
# - docs/STATUS.md: absent (current state and open risks)
# - docs/DECISIONS.md: absent (durable decisions log)
# Assumptions:
# - Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.
# Risks:
# - Pending confirmation: docs/INDEX.md is missing, so the planner cannot use index-first navigation.
# - Pending confirmation: docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.
# - Pending confirmation: docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.
# - Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.
# - Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.
# Contradictions:
# - none
# Omitted paths:
# - Do not read all docs/ recursively by default.
# - Do not read source trees until the selected docs identify relevant files.
# - Do not read dependency folders, generated outputs, caches, secrets, or local AI state.
# - Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.
# Uncertainty markers: TODO | Assumption | Pending confirmation
# AI prepare-context completed
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Written docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-09z/snapshots/20260913T010309Z
# AI prepare-context write plan
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Planned writes: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-09z/snapshots/20260522T120000Z
# Proposed changes:
# - docs/INDEX.md: create (missing approved context doc)
# - docs/PROJECT_MAP.md: create (missing approved context doc)
# - docs/AI_CONTEXT.md: create (missing approved context doc)
# - docs/AI_ONBOARDING_PROMPT.md: create (missing approved context doc)
# - docs/CONTEXTO.md: update (human content preserved; Quiver block appended or refreshed)
# - docs/WORKFLOW.md: create (missing approved context doc)
# - docs/ARCHITECTURE.md: create (missing approved context doc)
# - docs/STATUS.md: create (missing approved context doc)
# - docs/DECISIONS.md: create (missing approved context doc)
# Diff preview:
# --- docs/INDEX.md (current)
# +++ docs/INDEX.md (proposed)
# + \# demo-project Documentation Index
# + **Last updated:** 2026-09-13
# + \#\# Start Here
# + - **Context** - `./CONTEXTO.md`
# + - **AI Context** - `./AI_CONTEXT.md`
# + - **Decision Log** - `./DECISIONS.md`
# + - **AI Onboarding Prompt** - `./AI_ONBOARDING_PROMPT.md`
# --- docs/PROJECT_MAP.md (current)
# +++ docs/PROJECT_MAP.md (proposed)
# + \# Project Map
# + This file was prepared by `npx create-quiver ai prepare-context`.
# + Run `npx create-quiver analyze` to refresh it with a deeper repository scan.
# + \#\# Project
# + - Name: demo-project
# + - Slug: demo-project
# + - Package manager: npm
# + - package.json present: yes
# --- docs/AI_CONTEXT.md (current)
# +++ docs/AI_CONTEXT.md (proposed)
# + \# demo-project AI Context Pack
# + This file is the main context pack after `AGENTS.md` and `docs/PROJECT_MAP.md`. It compresses the working contract into one place and points to the canonical docs when deeper context is required.
# + \#\# What This Project Is
# + [Short project summary.]
# + \#\# Read First
# --- docs/AI_ONBOARDING_PROMPT.md (current)
# +++ docs/AI_ONBOARDING_PROMPT.md (proposed)
# + \# demo-project AI Onboarding Prompt
# + **Fecha:** 2026-09-13
# + **Estado:** En preparación
# + Lee este archivo y ejecútalo como fuente principal de verdad para incorporarte a este repositorio.
# + Actúa como asistente de onboarding de IA para este proyecto. Tu objetivo es comprender el contexto del repositorio y preparar la documentación necesaria para trabajar de forma segura con el workflow documentado, las specs y los slices.
# + \#\# Reglas de ejecución
# --- docs/CONTEXTO.md (current)
# +++ docs/CONTEXTO.md (proposed)
# - This paragraph was written by a human.
# + This paragraph was written by a human.
# + <!-- quiver:context-prep:start -->
# + \# demo-project Context
# + \#\# What Is demo-project?
# + [One or two paragraphs that explain the project.]
# + \#\# Value Proposition
# --- docs/WORKFLOW.md (current)
# +++ docs/WORKFLOW.md (proposed)
# + \# Workflow
# + **Date:** 2026-09-13
# + This document is the canonical implementation workflow for the project.
# + \#\# Core Rules
# + - Do not implement without a slice.
# + - One slice maps to one commit.
# --- docs/ARCHITECTURE.md (current)
# +++ docs/ARCHITECTURE.md (proposed)
# + \# demo-project Architecture
# + This document captures only what Quiver can infer safely from repository structure and docs.
# + \#\# Current Understanding
# + - Stack: Pending confirmation: no primary stack could be inferred from root signals.
# + - Source directories: Pending confirmation: no common source directory detected.
# + - Package manager: npm
# + \#\# Boundaries
# --- docs/STATUS.md (current)
# +++ docs/STATUS.md (proposed)
# + \# demo-project Status
# + This page tracks progress, blockers, and the current slice. Stack and command details live in `docs/PROJECT_MAP.md`.
# + \#\# Overall Status
# + - Progress: 0% complete
# + - Current phase: Fase 0
# + - Next milestone: [Description]
# --- docs/DECISIONS.md (current)
# +++ docs/DECISIONS.md (proposed)
# + \# demo-project Decision Log
# + **Date:** 2026-09-13
# + **Status:** En preparación
# + This file records durable project decisions so AI agents do not re-litigate choices that were already made.
# + Use it for durable context-preparation choices too, especially when a missing generated doc is guidance-only rather than debt.
# + \#\# Log
# Files considered:
# - README.md: present (project entrypoint and human summary)
# - AGENTS.md: absent (agent router and reading rules)
# - README_FOR_AI.md: absent (framework guidance source; not project debt when absent)
# - docs/INDEX.md: absent (index-first navigation map)
# - docs/PROJECT_MAP.md: absent (stack, commands, and structure facts)
# - docs/WORKFLOW.md: absent (workflow rules and execution contract)
# - docs/AI_CONTEXT.md: absent (agent-facing project context pack)
# - docs/AI_ONBOARDING_PROMPT.md: absent (project-specific onboarding contract)
# - docs/CONTEXTO.md: present (human-readable project context)
# - docs/STATUS.md: absent (current state and open risks)
# - docs/DECISIONS.md: absent (durable decisions log)
# Assumptions:
# - Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.
# Risks:
# - Pending confirmation: docs/INDEX.md is missing, so the planner cannot use index-first navigation.
# - Pending confirmation: docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.
# - Pending confirmation: docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.
# - Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.
# - Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.
# Contradictions:
# - none
# Omitted paths:
# - Do not read all docs/ recursively by default.
# - Do not read source trees until the selected docs identify relevant files.
# - Do not read dependency folders, generated outputs, caches, secrets, or local AI state.
# - Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.
# Uncertainty markers: TODO | Assumption | Pending confirmation
# AI prepare-context completed
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Written docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-09z/snapshots/20260522T120000Z
# Subtest: ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
ok 107 - ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
  ---
  duration_ms: 327.902875
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run supports Spanish human output without translating commands
ok 108 - ai onboard CLI dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 239.665417
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run reads the configured project language by default
ok 109 - ai onboard CLI dry-run reads the configured project language by default
  ---
  duration_ms: 221.171375
  type: 'test'
  ...
# Subtest: ai onboard print-prompt prints the exact prompt without invoking provider auth
ok 110 - ai onboard print-prompt prints the exact prompt without invoking provider auth
  ---
  duration_ms: 231.105042
  type: 'test'
  ...
# Subtest: ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
ok 111 - ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
  ---
  duration_ms: 4.095834
  type: 'test'
  ...
# Subtest: ai onboard surfaces provider failures with actionable context
ok 112 - ai onboard surfaces provider failures with actionable context
  ---
  duration_ms: 0.977291
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
ok 113 - ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
  ---
  duration_ms: 244.204416
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run supports Spanish human output without translating paths
ok 114 - ai prepare-context dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 258.431084
  type: 'test'
  ...
# Subtest: ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
ok 115 - ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
  ---
  duration_ms: 203.642042
  type: 'test'
  ...
# Subtest: ai prepare-context writes docs-only drafts and keeps product code untouched
ok 116 - ai prepare-context writes docs-only drafts and keeps product code untouched
  ---
  duration_ms: 56.854583
  type: 'test'
  ...
# Subtest: ai prepare-context preserves human-authored docs and snapshots before updating
ok 117 - ai prepare-context preserves human-authored docs and snapshots before updating
  ---
  duration_ms: 35.355542
  type: 'test'
  ...
# Subtest: ai prepare-context reports contradictions between project map and current root signals
ok 118 - ai prepare-context reports contradictions between project map and current root signals
  ---
  duration_ms: 276.987417
  type: 'test'
  ...
# Subtest: ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
ok 119 - ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
  ---
  duration_ms: 2.802041
  type: 'test'
  ...
# create-quiver: ai plan phase 'spec' requires approved technical-plan input; current status: missing. Run `npx create-quiver ai approve --phase technical-plan --version <n>`.
# create-quiver: ai approve --phase acceptance requiere --version <n> cuando los prompts no estan disponibles.
# Impacto: Quiver no puede adivinar de forma segura que draft de planner aprobo la persona.
# Arreglo: Revisa drafts con `npx create-quiver ai approvals` y despues pasa la version explicitamente.
# Siguiente comando: npx create-quiver ai approve --phase acceptance --version 1
# Subtest: ai plan spec phase dry-run reports the generated spec tree and does not write files
ok 120 - ai plan spec phase dry-run reports the generated spec tree and does not write files
  ---
  duration_ms: 614.455584
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
ok 121 - ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
  ---
  duration_ms: 616.457208
  type: 'test'
  ...
# Subtest: ai plan print-prompt localizes wrappers but keeps provider prompt body stable
ok 122 - ai plan print-prompt localizes wrappers but keeps provider prompt body stable
  ---
  duration_ms: 461.52425
  type: 'test'
  ...
# Subtest: ai review-plan dry-run renders Spanish wrapper fields without changing draft path
ok 123 - ai review-plan dry-run renders Spanish wrapper fields without changing draft path
  ---
  duration_ms: 301.438417
  type: 'test'
  ...
# Subtest: ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
ok 124 - ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
  ---
  duration_ms: 618.173583
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects unapproved technical-plan input
ok 125 - ai plan spec phase rejects unapproved technical-plan input
  ---
  duration_ms: 217.785584
  type: 'test'
  ...
# Subtest: ai approve dry-run and missing-version guidance render Spanish wrappers
ok 126 - ai approve dry-run and missing-version guidance render Spanish wrappers
  ---
  duration_ms: 479.637959
  type: 'test'
  ...
# \# Reviewed acceptance
# - AC-01 Edited criterion.
# [?25l│
# ◇  Agent finished
# [?25h
# AC-01 acceptance draft
# AC-01
# token=[REDACTED]
# criteria draft
# \# Acceptance
# - AC-01 Clear criterion.
# AC-01 acceptance draft v1
# AC-01 acceptance draft v2
# create-quiver: acceptance draft version 1 is not current; latest draft version is 2. Approve the latest version or revise again.
# AC-01 acceptance draft v1
# create-quiver: ai approve --phase acceptance requires --version <n> when prompts are not available.
# Impact: Quiver cannot safely guess which saved planner draft the human approved.
# Fix: Review drafts with `npx create-quiver ai approvals`, then pass the version explicitly.
# Next command: npx create-quiver ai approve --phase acceptance --version 1
# create-quiver: ai approve --phase acceptance approves saved draft versions only. Use `npx create-quiver ai revise --phase acceptance --input accepted.md` to create a new draft first.
# AC-01 acceptance draft v1
# AC-01 acceptance draft v2
# AC-01 acceptance draft v1
# AC-01 acceptance draft v2
# \# Acceptance
# - AC-01 Approved criteria.
# \# Technical plan v2
# slice-01-plan
# create-quiver: missing feedback input file for ai revise --phase acceptance. Use: npx create-quiver ai revise --phase acceptance --input <feedback.md> --dry-run
# create-quiver: missing feedback input file for ai revise --phase technical-plan. Use: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# create-quiver: missing input file: missing-feedback.md
# create-quiver: ai does not accept extra positional arguments
# AC-01 acceptance draft
# \# Acceptance
# - AC-01 Approved criteria.
# \# Acceptance
# - AC-01 Approved criteria.
# create-quiver: technical-plan draft v1 cannot be approved because it cannot create specs.
# approved technical plan must include a structured slices array. Expected JSON: { "spec": { "slices": [{ "slice_id": "slice-01-name", "title": "...", "objective": "...", "files": [] }] } }
# Required contract: include a structured JSON block with `spec.slices[]` before approval.
# Next safe command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# {
#   "spec": {
#     "slug": "repair-progress-plan",
#     "title": "Repairable spec",
#     "objective": "Create specs from a structured technical plan.",
#     "slices": [
#       {
#         "slice_id": "slice-01-structured-plan",
#         "title": "Structured plan slice",
#         "objective": "Implement the structured technical plan.",
#         "files": [
#           "src/app.js"
#         ]
#       }
#     ]
#   }
# }
# AI technical-plan repair draft saved
# Draft: .quiver/approvals/technical-plan/draft.md
# Version: v2
# Source approved artifact: .quiver/approvals/technical-plan/approved.md
# Original approved artifact: preserved
# Next safe commands:
# - npx create-quiver ai review-plan --dry-run
# - npx create-quiver ai review-plan
# - npx create-quiver ai approve --phase technical-plan --version 2
# \# Acceptance
# - AC-01 Approved criteria.
# slice-01-plan technical-plan draft
# create-quiver: ai plan phase 'technical-plan' requires approved acceptance input; current status: missing. Run `npx create-quiver ai approve --phase acceptance --version <n>`.
# create-quiver: missing input file for ai plan phase 'acceptance'
# Subtest: ai plan CLI dry-run defaults to acceptance phase and planning context
ok 127 - ai plan CLI dry-run defaults to acceptance phase and planning context
  ---
  duration_ms: 268.577208
  type: 'test'
  ...
# Subtest: ai plan accepts UX flags in dry-run without changing planner draft behavior
ok 128 - ai plan accepts UX flags in dry-run without changing planner draft behavior
  ---
  duration_ms: 237.94525
  type: 'test'
  ...
# Subtest: ai plan --review lets a human edit the provider draft before saving
ok 129 - ai plan --review lets a human edit the provider draft before saving
  ---
  duration_ms: 70.002875
  type: 'test'
  ...
# Subtest: ai plan --interactive can decline saving the provider draft
ok 130 - ai plan --interactive can decline saving the provider draft
  ---
  duration_ms: 18.506542
  type: 'test'
  ...
# Subtest: ai plan print-prompt renders acceptance prompt without provider auth
ok 131 - ai plan print-prompt renders acceptance prompt without provider auth
  ---
  duration_ms: 218.169542
  type: 'test'
  ...
# Subtest: ai plan acceptance persists a draft approval state
ok 132 - ai plan acceptance persists a draft approval state
  ---
  duration_ms: 72.059209
  type: 'test'
  ...
# Subtest: ai plan redacts likely secrets before saving provider output drafts
ok 133 - ai plan redacts likely secrets before saving provider output drafts
  ---
  duration_ms: 73.262625
  type: 'test'
  ...
# Subtest: ai plan stores clean drafts and separates redacted raw provider logs
ok 134 - ai plan stores clean drafts and separates redacted raw provider logs
  ---
  duration_ms: 70.373125
  type: 'test'
  ...
# Subtest: ai plan prints clean provider output without raw prompt echo or stderr logs
ok 135 - ai plan prints clean provider output without raw prompt echo or stderr logs
  ---
  duration_ms: 65.457792
  type: 'test'
  ...
# Subtest: ai approve only approves the current draft version
ok 136 - ai approve only approves the current draft version
  ---
  duration_ms: 853.428458
  type: 'test'
  ...
# Subtest: ai approve requires a version and rejects direct input files
ok 137 - ai approve requires a version and rejects direct input files
  ---
  duration_ms: 506.445125
  type: 'test'
  ...
# Subtest: ai revise creates a new draft version without approving the phase
ok 138 - ai revise creates a new draft version without approving the phase
  ---
  duration_ms: 329.798042
  type: 'test'
  ...
# Subtest: ai revise compacts oversized feedback before provider execution
ok 139 - ai revise compacts oversized feedback before provider execution
  ---
  duration_ms: 133.515291
  type: 'test'
  ...
# Subtest: ai plan rejects oversized prompts before provider execution
ok 140 - ai plan rejects oversized prompts before provider execution
  ---
  duration_ms: 0.919083
  type: 'test'
  ...
# Subtest: ai revise technical-plan includes approved acceptance, current draft, and feedback
ok 141 - ai revise technical-plan includes approved acceptance, current draft, and feedback
  ---
  duration_ms: 412.774667
  type: 'test'
  ...
# Subtest: governed technical-plan revise keeps acceptance and draft input isolated to the selected run
ok 142 - governed technical-plan revise keeps acceptance and draft input isolated to the selected run
  ---
  duration_ms: 387.723125
  type: 'test'
  ...
# Subtest: ai revise requires an existing draft
ok 143 - ai revise requires an existing draft
  ---
  duration_ms: 3.262917
  type: 'test'
  ...
# Subtest: ai revise rejects missing input values for acceptance and technical-plan before provider execution
ok 144 - ai revise rejects missing input values for acceptance and technical-plan before provider execution
  ---
  duration_ms: 600.722167
  type: 'test'
  ...
# Subtest: ai revise rejects nonexistent feedback files and accidental extra arguments
ok 145 - ai revise rejects nonexistent feedback files and accidental extra arguments
  ---
  duration_ms: 615.812042
  type: 'test'
  ...
# Subtest: ai plan shows human TTY progress during live provider execution
ok 146 - ai plan shows human TTY progress during live provider execution
  ---
  duration_ms: 90.70225
  type: 'test'
  ...
# Subtest: ai plan dry-run does not show provider progress
ok 147 - ai plan dry-run does not show provider progress
  ---
  duration_ms: 4.643917
  type: 'test'
  ...
# Subtest: ai approve writes an approved acceptance artifact with metadata
ok 148 - ai approve writes an approved acceptance artifact with metadata
  ---
  duration_ms: 355.84375
  type: 'test'
  ...
# Subtest: governed ai approve CLI publishes one digest-bound acceptance decision atomically
ok 149 - governed ai approve CLI publishes one digest-bound acceptance decision atomically
  ---
  duration_ms: 790.186667
  type: 'test'
  ...
# Subtest: digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
ok 150 - digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
  ---
  duration_ms: 231.88375
  type: 'test'
  ...
# Subtest: digest-bound acceptance rejects a requirement path redirected to another run
ok 151 - digest-bound acceptance rejects a requirement path redirected to another run
  ---
  duration_ms: 118.778875
  type: 'test'
  ...
# Subtest: governed review WAL rejects secrets hidden in canonical authorization evidence
ok 152 - governed review WAL rejects secrets hidden in canonical authorization evidence
  ---
  duration_ms: 295.784458
  type: 'test'
  ...
# Subtest: digest-bound approval rechecks policy after asynchronous actor resolution
ok 153 - digest-bound approval rechecks policy after asynchronous actor resolution
  ---
  duration_ms: 139.298125
  type: 'test'
  ...
# Subtest: conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
ok 154 - conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
  ---
  duration_ms: 1487.988292
  type: 'test'
  ...
# Subtest: ai approvals prints draft and approved status
ok 155 - ai approvals prints draft and approved status
  ---
  duration_ms: 613.454667
  type: 'test'
  ...
# Subtest: ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
ok 156 - ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
  ---
  duration_ms: 324.141417
  type: 'test'
  ...
# Subtest: ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
ok 157 - ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
  ---
  duration_ms: 175.996542
  type: 'test'
  ...
# Subtest: ai repair-plan shows human TTY progress during live provider execution
ok 158 - ai repair-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 143.32725
  type: 'test'
  ...
# Subtest: ai repair-plan dry-run previews repair without mutating approval state
ok 159 - ai repair-plan dry-run previews repair without mutating approval state
  ---
  duration_ms: 340.217834
  type: 'test'
  ...
# Subtest: ai plan technical-plan uses approved acceptance by default and rejects drafts
ok 160 - ai plan technical-plan uses approved acceptance by default and rejects drafts
  ---
  duration_ms: 693.655625
  type: 'test'
  ...
# Subtest: ai plan fails with a clear missing-input error
ok 161 - ai plan fails with a clear missing-input error
  ---
  duration_ms: 209.000166
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run reports spec generation instead of provider invocation
ok 162 - ai plan spec phase dry-run reports spec generation instead of provider invocation
  ---
  duration_ms: 601.10625
  type: 'test'
  ...
# Subtest: ai plan surfaces provider failures with phase context
ok 163 - ai plan surfaces provider failures with phase context
  ---
  duration_ms: 4.014166
  type: 'test'
  ...
# GitHub pr dry-run
# Remote: upstream
# Branch: feature/ai-pr-preflight
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/ai-pr-preflight --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-z5WBKz/specs/demo/pr.md
# SSH host alias: github-work
# Identity file: /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-z5WBKz/ssh/github-work
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-z5WBKz/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-z5WBKz/specs/demo/pr.md
# No PR will be created in dry-run mode.
# GitHub pr dry-run
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Edited PR
# Command: gh pr create --base main --head feature/demo --title "Edited PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-eW40wK/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-eW40wK/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-eW40wK/specs/demo/pr.md
# No PR will be created in dry-run mode.
# [?25l
# │
# ◇  GitHub preflight ready
# [?25h
# GitHub pr created
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-qOVpw1/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-qOVpw1/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-qOVpw1/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# GitHub pr created
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-jSKTah/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-jSKTah/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-jSKTah/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# Subtest: ai pr dry-run forwards git and ssh options to the GitHub preflight
ok 164 - ai pr dry-run forwards git and ssh options to the GitHub preflight
  ---
  duration_ms: 87.182333
  type: 'test'
  ...
# Subtest: ai doctor annotates GitHub preflight failures
ok 165 - ai doctor annotates GitHub preflight failures
  ---
  duration_ms: 0.835541
  type: 'test'
  ...
# Subtest: ai pr json emits one machine report without human prose
ok 166 - ai pr json emits one machine report without human prose
  ---
  duration_ms: 75.399542
  type: 'test'
  ...
# Subtest: ai pr with an explicit run rejects an ungoverned PR surface
ok 167 - ai pr with an explicit run rejects an ungoverned PR surface
  ---
  duration_ms: 66.108333
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run wires through the new router and avoids opening a PR
ok 168 - ai pr CLI dry-run wires through the new router and avoids opening a PR
  ---
  duration_ms: 1330.406292
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run renders Spanish wrappers while preserving gh command
ok 169 - ai pr CLI dry-run renders Spanish wrappers while preserving gh command
  ---
  duration_ms: 868.056667
  type: 'test'
  ...
# Subtest: ai pr --review lets a human edit pr.md before the PR plan is built
ok 170 - ai pr --review lets a human edit pr.md before the PR plan is built
  ---
  duration_ms: 128.868708
  type: 'test'
  ...
# Subtest: ai pr --interactive can decline PR creation before gh runs
ok 171 - ai pr --interactive can decline PR creation before gh runs
  ---
  duration_ms: 69.211125
  type: 'test'
  ...
# Subtest: ai pr create runs gh pr create with pr.md after preflight
ok 172 - ai pr create runs gh pr create with pr.md after preflight
  ---
  duration_ms: 57.296167
  type: 'test'
  ...
# Subtest: ai pr create shows TTY progress for preflight and gh creation
ok 173 - ai pr create shows TTY progress for preflight and gh creation
  ---
  duration_ms: 52.210417
  type: 'test'
  ...
# Subtest: ai pr revalidates governed PR evidence after editor changes
ok 174 - ai pr revalidates governed PR evidence after editor changes
  ---
  duration_ms: 100.056125
  type: 'test'
  ...
# Subtest: ai pr revalidates canonical parity immediately before gh create
ok 175 - ai pr revalidates canonical parity immediately before gh create
  ---
  duration_ms: 71.328042
  type: 'test'
  ...
# Subtest: ai pr fails closed when a PR-phase finding is neither closed nor accepted
ok 176 - ai pr fails closed when a PR-phase finding is neither closed nor accepted
  ---
  duration_ms: 59.71925
  type: 'test'
  ...
# AI prepare-context write plan
# Mode: live
# Project: planner-progress-demo
# Project slug: planner-progress-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# Proposed changes:
# - docs/AI_CONTEXT.md: create (Refresh AI context from planner output.)
# - docs/STATUS.md: create (Capture current status from planner output.)
# Diff preview:
# --- docs/AI_CONTEXT.md (current)
# +++ docs/AI_CONTEXT.md (proposed)
# + \# AI Context
# + Planner-generated context.
# --- docs/STATUS.md (current)
# +++ docs/STATUS.md (proposed)
# + \# Status
# + Planner-generated status.
# Files considered:
# - README.md: present (project entrypoint and human summary)
# - AGENTS.md: absent (agent router and reading rules)
# - README_FOR_AI.md: absent (framework guidance source; not project debt when absent)
# - docs/INDEX.md: absent (index-first navigation map)
# - docs/PROJECT_MAP.md: absent (stack, commands, and structure facts)
# - docs/WORKFLOW.md: absent (workflow rules and execution contract)
# - docs/AI_CONTEXT.md: absent (agent-facing project context pack)
# - docs/AI_ONBOARDING_PROMPT.md: absent (project-specific onboarding contract)
# - docs/CONTEXTO.md: absent (human-readable project context)
# - docs/STATUS.md: absent (current state and open risks)
# - docs/DECISIONS.md: absent (durable decisions log)
# Assumptions:
# - Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.
# Risks:
# - Pending confirmation: docs/INDEX.md is missing, so the planner cannot use index-first navigation.
# - Pending confirmation: docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.
# - Pending confirmation: docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.
# - Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.
# - Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.
# Contradictions:
# - none
# Omitted paths:
# - Do not read all docs/ recursively by default.
# - Do not read source trees until the selected docs identify relevant files.
# - Do not read dependency folders, generated outputs, caches, secrets, or local AI state.
# - Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.
# Uncertainty markers: TODO | Assumption | Pending confirmation
# AI prepare-context completed
# Mode: live
# Project: planner-progress-demo
# Project slug: planner-progress-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Written docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# AI prepare-context write plan
# Mode: live
# Project: planner-write-demo
# Project slug: planner-write-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# Proposed changes:
# - docs/AI_CONTEXT.md: create (Refresh AI context from planner output.)
# - docs/STATUS.md: create (Capture current status from planner output.)
# Diff preview:
# --- docs/AI_CONTEXT.md (current)
# +++ docs/AI_CONTEXT.md (proposed)
# + \# AI Context
# + Planner-generated context.
# --- docs/STATUS.md (current)
# +++ docs/STATUS.md (proposed)
# + \# Status
# + Planner-generated status.
# Files considered:
# - README.md: present (project entrypoint and human summary)
# - AGENTS.md: absent (agent router and reading rules)
# - README_FOR_AI.md: absent (framework guidance source; not project debt when absent)
# - docs/INDEX.md: absent (index-first navigation map)
# - docs/PROJECT_MAP.md: absent (stack, commands, and structure facts)
# - docs/WORKFLOW.md: absent (workflow rules and execution contract)
# - docs/AI_CONTEXT.md: absent (agent-facing project context pack)
# - docs/AI_ONBOARDING_PROMPT.md: absent (project-specific onboarding contract)
# - docs/CONTEXTO.md: absent (human-readable project context)
# - docs/STATUS.md: absent (current state and open risks)
# - docs/DECISIONS.md: absent (durable decisions log)
# Assumptions:
# - Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.
# Risks:
# - Pending confirmation: docs/INDEX.md is missing, so the planner cannot use index-first navigation.
# - Pending confirmation: docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.
# - Pending confirmation: docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.
# - Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.
# - Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.
# Contradictions:
# - none
# Omitted paths:
# - Do not read all docs/ recursively by default.
# - Do not read source trees until the selected docs identify relevant files.
# - Do not read dependency folders, generated outputs, caches, secrets, or local AI state.
# - Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.
# Uncertainty markers: TODO | Assumption | Pending confirmation
# AI prepare-context completed
# Mode: live
# Project: planner-write-demo
# Project slug: planner-write-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Written docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# AI prepare-context write plan
# Mode: live
# Project: planner-review-edit
# Project slug: planner-review-edit
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# Proposed changes:
# - docs/AI_CONTEXT.md: create (Refresh AI context from planner output.)
# - docs/STATUS.md: create (Capture current status from planner output.)
# Diff preview:
# --- docs/AI_CONTEXT.md (current)
# +++ docs/AI_CONTEXT.md (proposed)
# + \# AI Context
# + Edited during review.
# --- docs/STATUS.md (current)
# +++ docs/STATUS.md (proposed)
# + \# Status
# + Planner-generated status.
# Files considered:
# - README.md: present (project entrypoint and human summary)
# - AGENTS.md: absent (agent router and reading rules)
# - README_FOR_AI.md: absent (framework guidance source; not project debt when absent)
# - docs/INDEX.md: absent (index-first navigation map)
# - docs/PROJECT_MAP.md: absent (stack, commands, and structure facts)
# - docs/WORKFLOW.md: absent (workflow rules and execution contract)
# - docs/AI_CONTEXT.md: absent (agent-facing project context pack)
# - docs/AI_ONBOARDING_PROMPT.md: absent (project-specific onboarding contract)
# - docs/CONTEXTO.md: absent (human-readable project context)
# - docs/STATUS.md: absent (current state and open risks)
# - docs/DECISIONS.md: absent (durable decisions log)
# Assumptions:
# - Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.
# Risks:
# - Pending confirmation: docs/INDEX.md is missing, so the planner cannot use index-first navigation.
# - Pending confirmation: docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.
# - Pending confirmation: docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.
# - Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.
# - Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.
# Contradictions:
# - none
# Omitted paths:
# - Do not read all docs/ recursively by default.
# - Do not read source trees until the selected docs identify relevant files.
# - Do not read dependency folders, generated outputs, caches, secrets, or local AI state.
# - Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.
# Uncertainty markers: TODO | Assumption | Pending confirmation
# AI prepare-context completed
# Mode: live
# Project: planner-review-edit
# Project slug: planner-review-edit
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Written docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t01-03-10z/snapshots/20260913T010310Z
# [?25l
# │
# ◇  Agent finished
# [?25h
# Subtest: ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
ok 177 - ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
  ---
  duration_ms: 283.334208
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
ok 178 - ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
  ---
  duration_ms: 254.991
  type: 'test'
  ...
# Subtest: ai prepare-context blocks legacy profile display aliases before provider execution
ok 179 - ai prepare-context blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 11.040459
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
ok 180 - ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
  ---
  duration_ms: 221.075583
  type: 'test'
  ...
# Subtest: planner prepare-context shows human TTY progress with selected profile name
ok 181 - planner prepare-context shows human TTY progress with selected profile name
  ---
  duration_ms: 29.580958
  type: 'test'
  ...
# Subtest: planner prepare-context stops progress spinner on provider failure
ok 182 - planner prepare-context stops progress spinner on provider failure
  ---
  duration_ms: 3.725125
  type: 'test'
  ...
# Subtest: planner prepare-context writes validated docs-only proposal and snapshots before writes
ok 183 - planner prepare-context writes validated docs-only proposal and snapshots before writes
  ---
  duration_ms: 44.90225
  type: 'test'
  ...
# Subtest: provider failure during planner prepare-context writes no docs
ok 184 - provider failure during planner prepare-context writes no docs
  ---
  duration_ms: 1.82075
  type: 'test'
  ...
# Subtest: invalid planner output writes no docs
ok 185 - invalid planner output writes no docs
  ---
  duration_ms: 2.198083
  type: 'test'
  ...
# Subtest: review cancellation leaves docs untouched
ok 186 - review cancellation leaves docs untouched
  ---
  duration_ms: 5.5105
  type: 'test'
  ...
# Subtest: review flow revalidates edited proposal before writing docs
ok 187 - review flow revalidates edited proposal before writing docs
  ---
  duration_ms: 30.057542
  type: 'test'
  ...
# Subtest: interactive planner approval can decline without writes
ok 188 - interactive planner approval can decline without writes
  ---
  duration_ms: 34.723208
  type: 'test'
  ...
# create-quiver: ai review-plan requires a generated technical-plan draft. Run `npx create-quiver ai plan --phase technical-plan`.
# review output
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 0
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 0
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# Review budget:
# - Reviews: 6/6
# - Full revisions: 0/1
# - Targeted amendments: 5
# - External reviews: 0
# - Invalid outputs: 4
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 4
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI approval saved
# Phase: technical-plan
# Status: approved
# Artifact: .quiver/approvals/technical-plan/approved.md
# Source file: draft version 1
# Timestamp: 2026-09-13T01:03:12.125Z
# Version: v1
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 0
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# Review budget:
# - Reviews: 2/2
# - Full revisions: 0/1
# - Targeted amendments: 1
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 0
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# {
#   "spec": {
#     "slug": "review-cycle-plan-v2",
#     "title": "Reviewed plan",
#     "objective": "Create specs from a reviewed technical plan.",
#     "slices": [
#       {
#         "slice_id": "slice-01-reviewed-plan",
#         "title": "Reviewed plan implementation",
#         "objective": "Implement the reviewed plan.",
#         "files": [
#           "src/app.js"
#         ]
#       }
#     ]
#   }
# }
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/002.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 0
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# Review budget:
# - Reviews: 2/2
# - Full revisions: 1/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 1
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 1
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 1
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI run closed
# AI run status
# Run: run-close-independent
# Status: closed
# Phase: closed
# Spec: (not generated)
# Requirement: .quiver/runs/run-close-independent/requirement.md
# State: .quiver/runs/run-close-independent/state.json
# Approvals: .quiver/runs/run-close-independent/approvals.json
# Open runs: 1
# Other open runs:
# - run-close-in-flight: technical-plan-draft (active) -> npx create-quiver ai approvals
# Next safe command: No next command: lifecycle run is closed.
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI run closed
# AI run status
# Run: run-close-in-flight
# Status: closed
# Phase: closed
# Spec: (not generated)
# Requirement: .quiver/runs/run-close-in-flight/requirement.md
# State: .quiver/runs/run-close-in-flight/state.json
# Approvals: .quiver/runs/run-close-in-flight/approvals.json
# Open runs: 0
# Next safe command: npx create-quiver ai approvals
# {"partial":
# {"partial":
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# Review budget extension recorded
# Run: run-extension-action
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 1
# Review budget extension recorded
# Run: run-extension-action
# Review budget:
# - Reviews: 1/3
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 2
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# An active high-assurance run cannot be silently downgraded.
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/002.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 2
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# review output
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# AI approval saved
# Phase: acceptance
# Status: approved
# Artifact: .quiver/approvals/acceptance/approved.md
# Source file: draft version 2
# Timestamp: 2026-09-13T01:03:18.092Z
# Version: v2
# create-quiver: ai approve --phase acceptance requires --version <n> when prompts are not available.
# Impact: Quiver cannot safely guess which saved planner draft the human approved.
# Fix: Review drafts with `npx create-quiver ai approvals`, then pass the version explicitly.
# Next command: npx create-quiver ai approve --phase acceptance --version 1
# review v1
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# review v1
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# create-quiver: ai approve --phase technical-plan requires a production review for the current draft; current review status is stale. Run `npx create-quiver ai review-plan --dry-run`, then `npx create-quiver ai review-plan`.
# ```json
# {"review":{"blocking":false,"approvalRecommendation":"approve","requiredFixes":[],"optionalHardening":[],"risks":[]}}
# ```
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# ```json
# {"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}
# ```
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# ```json
# {"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}
# ```
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# ```json
# {"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}
# ```
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve-with-risk
# Blocking: no
# Required fixes: 0
# Optional hardening: 1
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# AI approval saved
# Phase: technical-plan
# Status: approved
# Artifact: .quiver/approvals/technical-plan/approved.md
# Source file: draft version 1
# Timestamp: 2026-09-13T01:03:20.169Z
# Version: v1
# ```json
# {"review":{"blocking":true,"approvalRecommendation":"revise","requiredFixes":["Define rollback validation"],"optionalHardening":["Add screenshots"],"risks":["Plan cannot be tested safely yet"]}}
# ```
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: revise
# Blocking: yes
# Required fixes: 1
# Optional hardening: 1
# Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# create-quiver: ai approve --phase technical-plan is blocked by plan review; approval recommendation is revise. Required fixes: 1. Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run
# create-quiver: ai plan phase 'spec' requires a reviewed and approved technical-plan input; current review status: missing. Run `npx create-quiver ai review-plan --dry-run`. Preview the review first, then run `npx create-quiver ai review-plan` to persist it.
# Subtest: ai review-plan dry-run uses the latest technical-plan draft
ok 189 - ai review-plan dry-run uses the latest technical-plan draft
  ---
  duration_ms: 265.845167
  type: 'test'
  ...
# Subtest: ai review-plan print-prompt renders review prompt without provider auth
ok 190 - ai review-plan print-prompt renders review prompt without provider auth
  ---
  duration_ms: 275.026583
  type: 'test'
  ...
# Subtest: ai review-plan rejects missing technical-plan draft
ok 191 - ai review-plan rejects missing technical-plan draft
  ---
  duration_ms: 273.017541
  type: 'test'
  ...
# Subtest: ai review-plan persists review state and becomes valid after approving the reviewed draft
ok 192 - ai review-plan persists review state and becomes valid after approving the reviewed draft
  ---
  duration_ms: 597.556083
  type: 'test'
  ...
# Subtest: governed review preserves the last valid state and omission does not close an open blocker
ok 193 - governed review preserves the last valid state and omission does not close an open blocker
  ---
  duration_ms: 430.422375
  type: 'test'
  ...
# Subtest: governed approval is default-deny before mutation and records explicit authorization
ok 194 - governed approval is default-deny before mutation and records explicit authorization
  ---
  duration_ms: 275.181
  type: 'test'
  ...
# Subtest: conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
ok 195 - conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
  ---
  duration_ms: 319.977
  type: 'test'
  ...
# Subtest: conditioned approval preserves authorization and protected-critical precedence without mutation
ok 196 - conditioned approval preserves authorization and protected-critical precedence without mutation
  ---
  duration_ms: 304.023
  type: 'test'
  ...
# Subtest: conditioned approval preserves a sanitized identity failure code without mutation
ok 197 - conditioned approval preserves a sanitized identity failure code without mutation
  ---
  duration_ms: 192.261916
  type: 'test'
  ...
# Subtest: governed approval rechecks canonical blockers under the run lock after identity resolution
ok 198 - governed approval rechecks canonical blockers under the run lock after identity resolution
  ---
  duration_ms: 252.830833
  type: 'test'
  ...
# Subtest: governed blocking review can revise to an owned draft and review again
ok 199 - governed blocking review can revise to an owned draft and review again
  ---
  duration_ms: 372.348292
  type: 'test'
  ...
# Subtest: governed review exhaustion blocks provider preflight and execution with five explicit actions
ok 200 - governed review exhaustion blocks provider preflight and execution with five explicit actions
  ---
  duration_ms: 151.924917
  type: 'test'
  ...
# Subtest: governed review validates immutable candidate and targeted scope before provider invocation
ok 201 - governed review validates immutable candidate and targeted scope before provider invocation
  ---
  duration_ms: 179.014375
  type: 'test'
  ...
# Subtest: governed pre-payload timeout retries the same envelope and consumes one semantic review on success
ok 202 - governed pre-payload timeout retries the same envelope and consumes one semantic review on success
  ---
  duration_ms: 186.215208
  type: 'test'
  ...
# Subtest: missing provider CLI releases the semantic slot as a transport retry
ok 203 - missing provider CLI releases the semantic slot as a transport retry
  ---
  duration_ms: 168.95425
  type: 'test'
  ...
# Subtest: governed review rejects diagnostic-only success as a pre-payload transport retry
ok 204 - governed review rejects diagnostic-only success as a pre-payload transport retry
  ---
  duration_ms: 143.937291
  type: 'test'
  ...
# Subtest: canonical reviews without ledger outcomes fail closed before provider or extension mutation
ok 205 - canonical reviews without ledger outcomes fail closed before provider or extension mutation
  ---
  duration_ms: 143.890666
  type: 'test'
  ...
# Subtest: governed review WAL recovers every interrupted commit point and exact reviewed lifecycle once
ok 206 - governed review WAL recovers every interrupted commit point and exact reviewed lifecycle once
  ---
  duration_ms: 1407.677833
  type: 'test'
  ...
# Subtest: corrupt or foreign governed review WAL fails closed without publishing state
ok 207 - corrupt or foreign governed review WAL fails closed without publishing state
  ---
  duration_ms: 190.864541
  type: 'test'
  ...
# Subtest: run close rejects an in-flight provider reservation and remains isolated by run
ok 208 - run close rejects an in-flight provider reservation and remains isolated by run
  ---
  duration_ms: 178.433584
  type: 'test'
  ...
# Subtest: provider payload failures consume budget consistently in TTY and non-TTY modes
ok 209 - provider payload failures consume budget consistently in TTY and non-TTY modes
  ---
  duration_ms: 151.632459
  type: 'test'
  ...
# Subtest: governed review rejects a candidate that changes while the provider is running and consumes the received payload
ok 210 - governed review rejects a candidate that changes while the provider is running and consumes the received payload
  ---
  duration_ms: 79.319041
  type: 'test'
  ...
# Subtest: review budget extension action resolves identity and rejects caller-supplied actor claims
ok 211 - review budget extension action resolves identity and rejects caller-supplied actor claims
  ---
  duration_ms: 152.22825
  type: 'test'
  ...
# Subtest: governed review inherits the active profile and renders the effective policy in its prompt
ok 212 - governed review inherits the active profile and renders the effective policy in its prompt
  ---
  duration_ms: 461.333417
  type: 'test'
  ...
# Subtest: governed runs fail closed when governance config disappears before review or approval
ok 213 - governed runs fail closed when governance config disappears before review or approval
  ---
  duration_ms: 77.428875
  type: 'test'
  ...
# Subtest: an explicit governance profile without config fails before creating a run or invoking a provider
ok 214 - an explicit governance profile without config fails before creating a run or invoking a provider
  ---
  duration_ms: 47.385916
  type: 'test'
  ...
# Subtest: governed review without a run-owned versioned draft fails before provider invocation
ok 215 - governed review without a run-owned versioned draft fails before provider invocation
  ---
  duration_ms: 49.100792
  type: 'test'
  ...
# Subtest: governed reviews and approvals cannot consume another run artifact or review
ok 216 - governed reviews and approvals cannot consume another run artifact or review
  ---
  duration_ms: 332.737708
  type: 'test'
  ...
# Subtest: governed mutations reject a closed explicit run before provider, identity, or artifact writes
ok 217 - governed mutations reject a closed explicit run before provider, identity, or artifact writes
  ---
  duration_ms: 83.537208
  type: 'test'
  ...
# Subtest: governed review commit rejects profile downgrade and foreign-run canonical state under the lock
ok 218 - governed review commit rejects profile downgrade and foreign-run canonical state under the lock
  ---
  duration_ms: 57.29375
  type: 'test'
  ...
# Subtest: ai review-plan shows human TTY progress during live provider execution
ok 219 - ai review-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 126.914917
  type: 'test'
  ...
# Subtest: ai approve selects acceptance draft interactively when version is omitted
ok 220 - ai approve selects acceptance draft interactively when version is omitted
  ---
  duration_ms: 165.931625
  type: 'test'
  ...
# Subtest: ai approve without version remains explicit in no-TTY mode
ok 221 - ai approve without version remains explicit in no-TTY mode
  ---
  duration_ms: 274.217083
  type: 'test'
  ...
# Subtest: ai approve interactive selection refuses non-current acceptance drafts
ok 222 - ai approve interactive selection refuses non-current acceptance drafts
  ---
  duration_ms: 73.664125
  type: 'test'
  ...
# Subtest: ai review-plan marks review stale when the technical-plan draft changes
ok 223 - ai review-plan marks review stale when the technical-plan draft changes
  ---
  duration_ms: 165.166292
  type: 'test'
  ...
# Subtest: ai approve blocks technical-plan approval when the latest review is stale
ok 224 - ai approve blocks technical-plan approval when the latest review is stale
  ---
  duration_ms: 393.19825
  type: 'test'
  ...
# Subtest: ai review-plan persists approve recommendation metadata
ok 225 - ai review-plan persists approve recommendation metadata
  ---
  duration_ms: 453.01325
  type: 'test'
  ...
# Subtest: ai review-plan approve-with-risk recommendation still allows explicit approval
ok 226 - ai review-plan approve-with-risk recommendation still allows explicit approval
  ---
  duration_ms: 437.289292
  type: 'test'
  ...
# Subtest: technical-plan approval candidates expose review recommendation and approvability
ok 227 - technical-plan approval candidates expose review recommendation and approvability
  ---
  duration_ms: 106.435375
  type: 'test'
  ...
# Subtest: ai approve selects technical-plan draft interactively with review context
ok 228 - ai approve selects technical-plan draft interactively with review context
  ---
  duration_ms: 154.351083
  type: 'test'
  ...
# Subtest: ai review-plan revise recommendation blocks technical-plan approval
ok 229 - ai review-plan revise recommendation blocks technical-plan approval
  ---
  duration_ms: 460.740583
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects approved technical plans that were not reviewed
ok 230 - ai plan spec phase rejects approved technical plans that were not reviewed
  ---
  duration_ms: 292.289625
  type: 'test'
  ...
# Subtest: ai review-plan surfaces provider failures with task context
ok 231 - ai review-plan surfaces provider failures with task context
  ---
  duration_ms: 44.412833
  type: 'test'
  ...
# create-quiver: ai run create requiere --input <requirements.md>
# create-quiver: subcomando ai run no soportado: watch. Tareas soportadas: create, close
# Subtest: ai run create creates persistent run state and ai status can inspect it
ok 232 - ai run create creates persistent run state and ai status can inspect it
  ---
  duration_ms: 643.747292
  type: 'test'
  ...
# Subtest: ai status and resume render Spanish human output while preserving commands
ok 233 - ai status and resume render Spanish human output while preserving commands
  ---
  duration_ms: 686.092541
  type: 'test'
  ...
# Subtest: ai status and resume use current approval candidate versions
ok 234 - ai status and resume use current approval candidate versions
  ---
  duration_ms: 884.456167
  type: 'test'
  ...
# Subtest: ai status makes multiple open runs visible
ok 235 - ai status makes multiple open runs visible
  ---
  duration_ms: 734.78725
  type: 'test'
  ...
# Subtest: ai run close archives a selected run without deleting evidence
ok 236 - ai run close archives a selected run without deleting evidence
  ---
  duration_ms: 678.42325
  type: 'test'
  ...
# Subtest: ai run create and close render Spanish human wrappers while preserving ids
ok 237 - ai run create and close render Spanish human wrappers while preserving ids
  ---
  duration_ms: 445.341958
  type: 'test'
  ...
# Subtest: ai run command errors render Spanish without translating commands
ok 238 - ai run command errors render Spanish without translating commands
  ---
  duration_ms: 372.289584
  type: 'test'
  ...
# Subtest: ai approvals separates run-scoped approvals from global planner approvals
ok 239 - ai approvals separates run-scoped approvals from global planner approvals
  ---
  duration_ms: 641.060167
  type: 'test'
  ...
# Subtest: ai approvals fails closed when a run projection points at another run
ok 240 - ai approvals fails closed when a run projection points at another run
  ---
  duration_ms: 861.295625
  type: 'test'
  ...
# Subtest: status, resume, approvals, export, and flow share one canonical governance projection
ok 241 - status, resume, approvals, export, and flow share one canonical governance projection
  ---
  duration_ms: 1214.977
  type: 'test'
  ...
# Subtest: ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
ok 242 - ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
  ---
  duration_ms: 766.689125
  type: 'test'
  ...
# Subtest: ai status reports no active run without creating files
ok 243 - ai status reports no active run without creating files
  ---
  duration_ms: 422.573
  type: 'test'
  ...
# Subtest: ai approval show, verify, and export consume the same canonical decision
ok 244 - ai approval show, verify, and export consume the same canonical decision
  ---
  duration_ms: 1314.462416
  type: 'test'
  ...
# Subtest: ai approval verify fails closed with one JSON document after artifact or projection tampering
ok 245 - ai approval verify fails closed with one JSON document after artifact or projection tampering
  ---
  duration_ms: 1023.001958
  type: 'test'
  ...
# Subtest: ai approval requires an explicit run when more than one active run exists
ok 246 - ai approval requires an explicit run when more than one active run exists
  ---
  duration_ms: 608.791916
  type: 'test'
  ...
# Subtest: two active runs publish only their own approval candidate and canonical counts
ok 247 - two active runs publish only their own approval candidate and canonical counts
  ---
  duration_ms: 407.143708
  type: 'test'
  ...
# Subtest: a run in approval recovery cannot break explicit status or close for another run
ok 248 - a run in approval recovery cannot break explicit status or close for another run
  ---
  duration_ms: 788.141042
  type: 'test'
  ...
# Subtest: rollback recovers a prepared approval WAL before blocking the requested writer
ok 249 - rollback recovers a prepared approval WAL before blocking the requested writer
  ---
  duration_ms: 686.11475
  type: 'test'
  ...
# Subtest: analyze writes raw scan under .quiver and keeps project map visible
ok 250 - analyze writes raw scan under .quiver and keeps project map visible
  ---
  duration_ms: 272.567458
  type: 'test'
  ...
# Subtest: analyze shows transient progress only in safe TTY mode
ok 251 - analyze shows transient progress only in safe TTY mode
  ---
  duration_ms: 13.705667
  type: 'test'
  ...
# Subtest: analyze suppresses transient progress when no-color opts out
ok 252 - analyze suppresses transient progress when no-color opts out
  ---
  duration_ms: 1.474375
  type: 'test'
  ...
# Subtest: analyze dry-run reports planned artifacts without writing files
ok 253 - analyze dry-run reports planned artifacts without writing files
  ---
  duration_ms: 179.546625
  type: 'test'
  ...
# Subtest: analyze dry-run supports Spanish human output without translating paths
ok 254 - analyze dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 202.059667
  type: 'test'
  ...
# Subtest: analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
ok 255 - analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
  ---
  duration_ms: 275.76625
  type: 'test'
  ...
# Subtest: analyze recognizes React plus Vite without misclassifying it as Vue
ok 256 - analyze recognizes React plus Vite without misclassifying it as Vue
  ---
  duration_ms: 223.188958
  type: 'test'
  ...
# Subtest: brain add and export dry-runs validate fully without writing any bytes
ok 257 - brain add and export dry-runs validate fully without writing any bytes
  ---
  duration_ms: 76.273125
  type: 'test'
  ...
# Subtest: brain status, list, show, add, export, and delete return Result v1
ok 258 - brain status, list, show, add, export, and delete return Result v1
  ---
  duration_ms: 139.902291
  type: 'test'
  ...
# Subtest: every Brain command fails closed without a trusted actor adapter
ok 259 - every Brain command fails closed without a trusted actor adapter
  ---
  duration_ms: 53.922292
  type: 'test'
  ...
# Subtest: CLI brain namespace emits canonical JSON and stable policy exit class
ok 260 - CLI brain namespace emits canonical JSON and stable policy exit class
  ---
  duration_ms: 668.892
  type: 'test'
  ...
# Subtest: Brain writer compatibility failures stay inside Result v1 with capability exit class
ok 261 - Brain writer compatibility failures stay inside Result v1 with capability exit class
  ---
  duration_ms: 302.28275
  type: 'test'
  ...
# Subtest: top-level --version prints the installed package version
ok 262 - top-level --version prints the installed package version
  ---
  duration_ms: 205.835042
  type: 'test'
  ...
# Subtest: top-level -V prints the installed package version
ok 263 - top-level -V prints the installed package version
  ---
  duration_ms: 212.446958
  type: 'test'
  ...
# Subtest: version command prints human and JSON metadata without changing semver flags
ok 264 - version command prints human and JSON metadata without changing semver flags
  ---
  duration_ms: 464.533292
  type: 'test'
  ...
# Subtest: local quiver alias points to the same CLI entrypoint
ok 265 - local quiver alias points to the same CLI entrypoint
  ---
  duration_ms: 0.13975
  type: 'test'
  ...
# Subtest: top-level help command prints grouped command descriptions
ok 266 - top-level help command prints grouped command descriptions
  ---
  duration_ms: 283.755583
  type: 'test'
  ...
# Subtest: help output documents important public commands
ok 267 - help output documents important public commands
  ---
  duration_ms: 192.106417
  type: 'test'
  ...
# Subtest: ai approval accepts the singular verify contract and emits a clean JSON runtime error
ok 268 - ai approval accepts the singular verify contract and emits a clean JSON runtime error
  ---
  duration_ms: 219.869166
  type: 'test'
  ...
# Subtest: ai approval rejects missing or unsupported singular subcommands
ok 269 - ai approval rejects missing or unsupported singular subcommands
  ---
  duration_ms: 414.986458
  type: 'test'
  ...
# Subtest: ai approvals --json emits one canonical projection without stderr
ok 270 - ai approvals --json emits one canonical projection without stderr
  ---
  duration_ms: 190.332625
  type: 'test'
  ...
# Subtest: spec create --json emits one machine error document without stderr
ok 271 - spec create --json emits one machine error document without stderr
  ---
  duration_ms: 203.714459
  type: 'test'
  ...
# Subtest: approval value flags reject a following flag as a missing value
ok 272 - approval value flags reject a following flag as a missing value
  ---
  duration_ms: 1214.437458
  type: 'test'
  ...
# Subtest: findings namespace validates its public subcommands and value flags before mutation
ok 273 - findings namespace validates its public subcommands and value flags before mutation
  ---
  duration_ms: 1477.514583
  type: 'test'
  ...
# Subtest: findings JSON runtime failures use one machine envelope and no stderr prose
ok 274 - findings JSON runtime failures use one machine envelope and no stderr prose
  ---
  duration_ms: 261.397167
  type: 'test'
  ...
# Subtest: ai approve rejects decisions outside the public approval vocabulary
ok 275 - ai approve rejects decisions outside the public approval vocabulary
  ---
  duration_ms: 217.641458
  type: 'test'
  ...
# Subtest: governance profile flag rejects unknown profile names before command execution
ok 276 - governance profile flag rejects unknown profile names before command execution
  ---
  duration_ms: 221.1075
  type: 'test'
  ...
# Subtest: global --lang works before and after command names without changing JSON output
ok 277 - global --lang works before and after command names without changing JSON output
  ---
  duration_ms: 588.339041
  type: 'test'
  ...
# Subtest: unsupported global --lang falls back without polluting JSON output
ok 278 - unsupported global --lang falls back without polluting JSON output
  ---
  duration_ms: 224.303125
  type: 'test'
  ...
# Subtest: global --lang before help is accepted
ok 279 - global --lang before help is accepted
  ---
  duration_ms: 207.937792
  type: 'test'
  ...
# Subtest: help uses configured project language without requiring --lang
ok 280 - help uses configured project language without requiring --lang
  ---
  duration_ms: 211.88225
  type: 'test'
  ...
# Subtest: ai approve --version remains a draft-version option
ok 281 - ai approve --version remains a draft-version option
  ---
  duration_ms: 236.188708
  type: 'test'
  ...
# Subtest: global --lang requires a value
ok 282 - global --lang requires a value
  ---
  duration_ms: 193.917083
  type: 'test'
  ...
# Subtest: early parser errors use the resolved language and keep JSON stdout empty
ok 283 - early parser errors use the resolved language and keep JSON stdout empty
  ---
  duration_ms: 458.034125
  type: 'test'
  ...
# Subtest: unsupported commands fail with localized actionable guidance
ok 284 - unsupported commands fail with localized actionable guidance
  ---
  duration_ms: 565.344666
  type: 'test'
  ...
# Subtest: config language set writes project config and preserves existing keys
ok 285 - config language set writes project config and preserves existing keys
  ---
  duration_ms: 218.647042
  type: 'test'
  ...
# Subtest: config language refuses to overwrite an invalid governance namespace
ok 286 - config language refuses to overwrite an invalid governance namespace
  ---
  duration_ms: 227.5345
  type: 'test'
  ...
# Subtest: config language show reports effective project language in human and JSON modes
ok 287 - config language show reports effective project language in human and JSON modes
  ---
  duration_ms: 625.669959
  type: 'test'
  ...
# Subtest: config language set --global writes user config without project config
ok 288 - config language set --global writes user config without project config
  ---
  duration_ms: 429.726417
  type: 'test'
  ...
# Subtest: config language set --json emits stable machine output
ok 289 - config language set --json emits stable machine output
  ---
  duration_ms: 202.276375
  type: 'test'
  ...
# Subtest: config language show respects overrides without polluting JSON
ok 290 - config language show respects overrides without polluting JSON
  ---
  duration_ms: 590.696041
  type: 'test'
  ...
# Subtest: config language rejects invalid values and unsupported --global usage
ok 291 - config language rejects invalid values and unsupported --global usage
  ---
  duration_ms: 635.9855
  type: 'test'
  ...
# Subtest: config language errors localize and keep JSON stdout clean
ok 292 - config language errors localize and keep JSON stdout clean
  ---
  duration_ms: 583.589667
  type: 'test'
  ...
# Subtest: dashboard human output shows consolidated project status
ok 293 - dashboard human output shows consolidated project status
  ---
  duration_ms: 307.207292
  type: 'test'
  ...
# Subtest: dashboard JSON output is parseable and stable
ok 294 - dashboard JSON output is parseable and stable
  ---
  duration_ms: 239.331875
  type: 'test'
  ...
# Subtest: dashboard human output renders Spanish with flag or project config
ok 295 - dashboard human output renders Spanish with flag or project config
  ---
  duration_ms: 470.42525
  type: 'test'
  ...
# Subtest: dashboard --include-completed changes only the visible slice set
ok 296 - dashboard --include-completed changes only the visible slice set
  ---
  duration_ms: 215.755209
  type: 'test'
  ...
# Subtest: dashboard keeps JSON error payloads stable with Spanish language
ok 297 - dashboard keeps JSON error payloads stable with Spanish language
  ---
  duration_ms: 233.904125
  type: 'test'
  ...
# Subtest: dashboard missing spec keeps JSON stdout parseable on failure
ok 298 - dashboard missing spec keeps JSON stdout parseable on failure
  ---
  duration_ms: 242.856542
  type: 'test'
  ...
# Subtest: dashboard localized details and section views preserve exact commands
ok 299 - dashboard localized details and section views preserve exact commands
  ---
  duration_ms: 522.154709
  type: 'test'
  ...
# Subtest: dashboard supports details, section, and limit human views
ok 300 - dashboard supports details, section, and limit human views
  ---
  duration_ms: 437.598583
  type: 'test'
  ...
# Subtest: dashboard rejects ambiguous and invalid human flags
ok 301 - dashboard rejects ambiguous and invalid human flags
  ---
  duration_ms: 419.411917
  type: 'test'
  ...
# Subtest: dashboard invalid section errors are localized and list supported sections
ok 302 - dashboard invalid section errors are localized and list supported sections
  ---
  duration_ms: 474.437417
  type: 'test'
  ...
# Subtest: dashboard human-only flags keep JSON failures parseable
ok 303 - dashboard human-only flags keep JSON failures parseable
  ---
  duration_ms: 261.349
  type: 'test'
  ...
# Subtest: dashboard invalid section keeps JSON error payload parseable and English
ok 304 - dashboard invalid section keeps JSON error payload parseable and English
  ---
  duration_ms: 263.911125
  type: 'test'
  ...
# Subtest: dashboard-only flags fail clearly outside dashboard command
ok 305 - dashboard-only flags fail clearly outside dashboard command
  ---
  duration_ms: 210.509292
  type: 'test'
  ...
# Subtest: dashboard reports graph errors without crashing JSON output
ok 306 - dashboard reports graph errors without crashing JSON output
  ---
  duration_ms: 247.152708
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run prints planned files without writing
ok 307 - demo create spec-viewer dry-run prints planned files without writing
  ---
  duration_ms: 221.051166
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run supports Spanish human output without translating paths
ok 308 - demo create spec-viewer dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 218.264584
  type: 'test'
  ...
# Subtest: demo create spec-viewer reads the configured project language by default
ok 309 - demo create spec-viewer reads the configured project language by default
  ---
  duration_ms: 201.688542
  type: 'test'
  ...
# Subtest: demo create spec-viewer defaults to a nested target on dry-run
ok 310 - demo create spec-viewer defaults to a nested target on dry-run
  ---
  duration_ms: 216.345833
  type: 'test'
  ...
# Subtest: demo create spec-viewer writes a small runnable demo
ok 311 - demo create spec-viewer writes a small runnable demo
  ---
  duration_ms: 2982.231459
  type: 'test'
  ...
# Subtest: generated demo documents and implements occupied-port fallback without network fixtures
ok 312 - generated demo documents and implements occupied-port fallback without network fixtures
  ---
  duration_ms: 236.444666
  type: 'test'
  ...
# Subtest: demo create spec-viewer preserves existing files
ok 313 - demo create spec-viewer preserves existing files
  ---
  duration_ms: 264.407708
  type: 'test'
  ...
# Subtest: demo rejects unsupported names and subcommands clearly
ok 314 - demo rejects unsupported names and subcommands clearly
  ---
  duration_ms: 420.707334
  type: 'test'
  ...
# Subtest: doctor accepts the new default init layout before specs exist
ok 315 - doctor accepts the new default init layout before specs exist
  ---
  duration_ms: 5475.663875
  type: 'test'
  ...
# Subtest: doctor localizes human output while preserving command snippets
ok 316 - doctor localizes human output while preserving command snippets
  ---
  duration_ms: 5680.759417
  type: 'test'
  ...
# Subtest: doctor json emits parseable diagnostics with human parity
ok 317 - doctor json emits parseable diagnostics with human parity
  ---
  duration_ms: 7373.1725
  type: 'test'
  ...
# Subtest: doctor json exits deterministically for blocking layout errors
ok 318 - doctor json exits deterministically for blocking layout errors
  ---
  duration_ms: 1257.06025
  type: 'test'
  ...
# Subtest: doctor warns when package scripts target unsupported create-quiver commands
ok 319 - doctor warns when package scripts target unsupported create-quiver commands
  ---
  duration_ms: 4425.331625
  type: 'test'
  ...
# Subtest: doctor fix dry-run previews safe repairs without writing
ok 320 - doctor fix dry-run previews safe repairs without writing
  ---
  duration_ms: 2169.610333
  type: 'test'
  ...
# Subtest: doctor fix applies safe repairs idempotently
ok 321 - doctor fix applies safe repairs idempotently
  ---
  duration_ms: 4243.466625
  type: 'test'
  ...
# Subtest: doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
ok 322 - doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
  ---
  duration_ms: 5470.05475
  type: 'test'
  ...
# Subtest: doctor diagnoses missing governance and requires explicit migration without rewriting config
ok 323 - doctor diagnoses missing governance and requires explicit migration without rewriting config
  ---
  duration_ms: 3336.633208
  type: 'test'
  ...
# Subtest: doctor reports invalid governance without overwriting authorization policy
ok 324 - doctor reports invalid governance without overwriting authorization policy
  ---
  duration_ms: 3323.261833
  type: 'test'
  ...
# Subtest: doctor gives actionable AGENTS.md repair guidance
ok 325 - doctor gives actionable AGENTS.md repair guidance
  ---
  duration_ms: 3187.2145
  type: 'test'
  ...
# Subtest: doctor fix repairs AGENTS.md contract without replacing manual content
ok 326 - doctor fix repairs AGENTS.md contract without replacing manual content
  ---
  duration_ms: 4456.919834
  type: 'test'
  ...
# Subtest: doctor warns about missing local markdown links in generated docs
ok 327 - doctor warns about missing local markdown links in generated docs
  ---
  duration_ms: 3646.375708
  type: 'test'
  ...
# Subtest: doctor reports a legacy layout with migration guidance
ok 328 - doctor reports a legacy layout with migration guidance
  ---
  duration_ms: 1057.338958
  type: 'test'
  ...
# Subtest: doctor accepts the minimal init layout before specs exist
ok 329 - doctor accepts the minimal init layout before specs exist
  ---
  duration_ms: 3105.829292
  type: 'test'
  ...
# Subtest: doctor reports a hybrid layout when explicit full compatibility assets exist
ok 330 - doctor reports a hybrid layout when explicit full compatibility assets exist
  ---
  duration_ms: 3874.732583
  type: 'test'
  ...
# Subtest: doctor examples prefer an active slice over the first spec alphabetically
ok 331 - doctor examples prefer an active slice over the first spec alphabetically
  ---
  duration_ms: 3174.353542
  type: 'test'
  ...
# Subtest: doctor uses generic examples when multiple specs have no active slice
ok 332 - doctor uses generic examples when multiple specs have no active slice
  ---
  duration_ms: 3225.498125
  type: 'test'
  ...
# Subtest: doctor reports stale generated context when scan is newer than project map
ok 333 - doctor reports stale generated context when scan is newer than project map
  ---
  duration_ms: 2409.760791
  type: 'test'
  ...
# Subtest: doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
ok 334 - doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
  ---
  duration_ms: 3714.7715
  type: 'test'
  ...
# Subtest: evidence run records successful command output
ok 335 - evidence run records successful command output
  ---
  duration_ms: 302.47175
  type: 'test'
  ...
# Subtest: evidence run supports Spanish human output without translating command or path
ok 336 - evidence run supports Spanish human output without translating command or path
  ---
  duration_ms: 276.048
  type: 'test'
  ...
# Subtest: evidence run preserves failing command exit code
ok 337 - evidence run preserves failing command exit code
  ---
  duration_ms: 308.474917
  type: 'test'
  ...
# Subtest: evidence run truncates long output
ok 338 - evidence run truncates long output
  ---
  duration_ms: 293.329083
  type: 'test'
  ...
# Subtest: evidence list and show emit parseable JSON
ok 339 - evidence list and show emit parseable JSON
  ---
  duration_ms: 789.457834
  type: 'test'
  ...
# Subtest: evidence run rejects traversal output before running child command
ok 340 - evidence run rejects traversal output before running child command
  ---
  duration_ms: 301.921916
  type: 'test'
  ...
# Subtest: evidence run requires a command after separator
ok 341 - evidence run requires a command after separator
  ---
  duration_ms: 259.028
  type: 'test'
  ...
# Subtest: evidence run missing command error localizes without stdout noise
ok 342 - evidence run missing command error localizes without stdout noise
  ---
  duration_ms: 214.976958
  type: 'test'
  ...
# Subtest: formatOutputPath keeps external outputs absolute
ok 343 - formatOutputPath keeps external outputs absolute
  ---
  duration_ms: 0.854875
  type: 'test'
  ...
# Subtest: individual transfer preserves exact criterion bytes and writes one canonical disposition
ok 344 - individual transfer preserves exact criterion bytes and writes one canonical disposition
  ---
  duration_ms: 90.260292
  type: 'test'
  ...
# Subtest: invocation files stay scoped to the invoking worktree while run state stays canonical
ok 345 - invocation files stay scoped to the invoking worktree while run state stays canonical
  ---
  duration_ms: 44.829458
  type: 'test'
  ...
# Subtest: batch keyed-map and canonical-envelope forms require explicit supersession
ok 346 - batch keyed-map and canonical-envelope forms require explicit supersession
  ---
  duration_ms: 75.094334
  type: 'test'
  ...
# Subtest: batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
ok 347 - batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
  ---
  duration_ms: 172.348167
  type: 'test'
  ...
# Subtest: complete batch validation and unsafe contractual data fail before mutation
ok 348 - complete batch validation and unsafe contractual data fail before mutation
  ---
  duration_ms: 43.57575
  type: 'test'
  ...
# Subtest: criterion binding must resolve uniquely to the current technical-plan criterion before mutation
ok 349 - criterion binding must resolve uniquely to the current technical-plan criterion before mutation
  ---
  duration_ms: 93.868125
  type: 'test'
  ...
# Subtest: unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
ok 350 - unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
  ---
  duration_ms: 41.072583
  type: 'test'
  ...
# Subtest: ambiguous slice aliases and post-review phases are rejected without writes
ok 351 - ambiguous slice aliases and post-review phases are rejected without writes
  ---
  duration_ms: 48.95325
  type: 'test'
  ...
# Subtest: direct findings errors redact invocation, canonical, and secret values without changing contracts
ok 352 - direct findings errors redact invocation, canonical, and secret values without changing contracts
  ---
  duration_ms: 27.801666
  type: 'test'
  ...
# Subtest: findings CLI redacts failures consistently in human and JSON modes
ok 353 - findings CLI redacts failures consistently in human and JSON modes
  ---
  duration_ms: 483.362458
  type: 'test'
  ...
# Subtest: package exposes quiver as an alias to the create-quiver binary
ok 354 - package exposes quiver as an alias to the create-quiver binary
  ---
  duration_ms: 0.762625
  type: 'test'
  ...
# Subtest: generated package scripts include the flow entrypoint
ok 355 - generated package scripts include the flow entrypoint
  ---
  duration_ms: 0.15675
  type: 'test'
  ...
# Subtest: flow command is read-only and guides uninitialized projects to init
ok 356 - flow command is read-only and guides uninitialized projects to init
  ---
  duration_ms: 293.304042
  type: 'test'
  ...
# Subtest: flow command localizes uninitialized guidance while preserving commands
ok 357 - flow command localizes uninitialized guidance while preserving commands
  ---
  duration_ms: 269.046042
  type: 'test'
  ...
# Subtest: flow command reports analysis guidance when initialized context docs are missing
ok 358 - flow command reports analysis guidance when initialized context docs are missing
  ---
  duration_ms: 252.741584
  type: 'test'
  ...
# Subtest: flow command reports agent profile guidance before planning when context docs exist
ok 359 - flow command reports agent profile guidance before planning when context docs exist
  ---
  duration_ms: 242.164959
  type: 'test'
  ...
# Subtest: flow command reports package-manager-aware generated script guidance
ok 360 - flow command reports package-manager-aware generated script guidance
  ---
  duration_ms: 266.817542
  type: 'test'
  ...
# Subtest: flow command uses the generated project map after analyze
ok 361 - flow command uses the generated project map after analyze
  ---
  duration_ms: 4458.007541
  type: 'test'
  ...
# Subtest: flow command reports criteria draft approval guidance
ok 362 - flow command reports criteria draft approval guidance
  ---
  duration_ms: 343.540542
  type: 'test'
  ...
# Subtest: flow command asks for production review before technical-plan approval
ok 363 - flow command asks for production review before technical-plan approval
  ---
  duration_ms: 393.790167
  type: 'test'
  ...
# Subtest: flow command asks for technical-plan approval after production review
ok 364 - flow command asks for technical-plan approval after production review
  ---
  duration_ms: 366.12025
  type: 'test'
  ...
# Subtest: flow command points to revise when plan review blocks technical-plan approval
ok 365 - flow command points to revise when plan review blocks technical-plan approval
  ---
  duration_ms: 365.630791
  type: 'test'
  ...
# Subtest: flow command reports spec create after reviewed and approved technical plan
ok 366 - flow command reports spec create after reviewed and approved technical plan
  ---
  duration_ms: 442.386875
  type: 'test'
  ...
# Subtest: flow command does not suggest re-approving a technical plan that still needs review
ok 367 - flow command does not suggest re-approving a technical plan that still needs review
  ---
  duration_ms: 488.560916
  type: 'test'
  ...
# Subtest: flow command reports ready slice execution after approved plan and completed slice-00
ok 368 - flow command reports ready slice execution after approved plan and completed slice-00
  ---
  duration_ms: 451.332792
  type: 'test'
  ...
# Subtest: flow command supports machine-readable output
ok 369 - flow command supports machine-readable output
  ---
  duration_ms: 366.118459
  type: 'test'
  ...
# Subtest: flow JSON preserves camelCase and snake_case next command fields for ready slices
ok 370 - flow JSON preserves camelCase and snake_case next command fields for ready slices
  ---
  duration_ms: 435.402583
  type: 'test'
  ...
# Subtest: collectGraph returns pending levels and conflicts
ok 371 - collectGraph returns pending levels and conflicts
  ---
  duration_ms: 69.116
  type: 'test'
  ...
# Subtest: graph can include completed slices and filter by spec
ok 372 - graph can include completed slices and filter by spec
  ---
  duration_ms: 272.872792
  type: 'test'
  ...
# Subtest: scoped graph does not parse unrelated historical slice artifacts
ok 373 - scoped graph does not parse unrelated historical slice artifacts
  ---
  duration_ms: 6.987291
  type: 'test'
  ...
# Subtest: graph CLI renders an ASCII tree by default
ok 374 - graph CLI renders an ASCII tree by default
  ---
  duration_ms: 260.466666
  type: 'test'
  ...
# Subtest: graph CLI localizes tree output without changing refs
ok 375 - graph CLI localizes tree output without changing refs
  ---
  duration_ms: 237.530834
  type: 'test'
  ...
# Subtest: graph CLI can show conflicts and filter a single level
ok 376 - graph CLI can show conflicts and filter a single level
  ---
  duration_ms: 289.216041
  type: 'test'
  ...
# Subtest: graph CLI reports an empty level in human output and keeps JSON clean
ok 377 - graph CLI reports an empty level in human output and keeps JSON clean
  ---
  duration_ms: 700.38375
  type: 'test'
  ...
# Subtest: graph --json keeps JSON output even when --format selects a human renderer
ok 378 - graph --json keeps JSON output even when --format selects a human renderer
  ---
  duration_ms: 273.98475
  type: 'test'
  ...
# Subtest: graph CLI emits valid JSON
ok 379 - graph CLI emits valid JSON
  ---
  duration_ms: 271.250125
  type: 'test'
  ...
# Subtest: graph CLI prefers Unicode when requested
ok 380 - graph CLI prefers Unicode when requested
  ---
  duration_ms: 264.641417
  type: 'test'
  ...
# Subtest: graph CLI renders Mermaid and DOT formats
ok 381 - graph CLI renders Mermaid and DOT formats
  ---
  duration_ms: 463.868375
  type: 'test'
  ...
# Subtest: graph unsupported format error localizes and keeps JSON stdout clean
ok 382 - graph unsupported format error localizes and keeps JSON stdout clean
  ---
  duration_ms: 220.792208
  type: 'test'
  ...
# Subtest: handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
ok 383 - handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
  ---
  duration_ms: 493.916958
  type: 'test'
  ...
# Subtest: handoff new namespace matches legacy new-handoff output and artifacts
ok 384 - handoff new namespace matches legacy new-handoff output and artifacts
  ---
  duration_ms: 442.260417
  type: 'test'
  ...
# Subtest: handoff namespace rejects unsupported subcommands before execution
ok 385 - handoff namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 215.341708
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix covers every documented command
ok 386 - v43 i18n audit matrix covers every documented command
  ---
  duration_ms: 1.821292
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix records actionable mode and exception status
ok 387 - v43 i18n audit matrix records actionable mode and exception status
  ---
  duration_ms: 0.532916
  type: 'test'
  ...
# Subtest: init --dry-run prints the planned layout and does not write files
ok 388 - init --dry-run prints the planned layout and does not write files
  ---
  duration_ms: 211.342834
  type: 'test'
  ...
# Subtest: legacy --name alias supports dry-run without writing files
ok 389 - legacy --name alias supports dry-run without writing files
  ---
  duration_ms: 248.650625
  type: 'test'
  ...
# Subtest: unsupported subcommands fail clearly instead of initializing a project
ok 390 - unsupported subcommands fail clearly instead of initializing a project
  ---
  duration_ms: 232.990584
  type: 'test'
  ...
# Subtest: init --dry-run reports requested profiles and optional assets
ok 391 - init --dry-run reports requested profiles and optional assets
  ---
  duration_ms: 721.668083
  type: 'test'
  ...
# Subtest: init --interactive resolves guided choices without writing by itself
ok 392 - init --interactive resolves guided choices without writing by itself
  ---
  duration_ms: 3.614209
  type: 'test'
  ...
# Subtest: init --interactive keeps or changes existing project language without dropping config keys
ok 393 - init --interactive keeps or changes existing project language without dropping config keys
  ---
  duration_ms: 2.152458
  type: 'test'
  ...
# Subtest: init --interactive dry-run resolves intended language without writing config
ok 394 - init --interactive dry-run resolves intended language without writing config
  ---
  duration_ms: 0.452458
  type: 'test'
  ...
# Subtest: init --interactive rejects non-TTY automation with explicit flag guidance
ok 395 - init --interactive rejects non-TTY automation with explicit flag guidance
  ---
  duration_ms: 0.697125
  type: 'test'
  ...
# Subtest: init rejects incompatible profile flags before writing files
ok 396 - init rejects incompatible profile flags before writing files
  ---
  duration_ms: 257.099875
  type: 'test'
  ...
# Subtest: init command without dry-run writes the default clean AI-first layout
ok 397 - init command without dry-run writes the default clean AI-first layout
  ---
  duration_ms: 4332.842875
  type: 'test'
  ...
# Subtest: explicit init preserves an existing empty Brain byte-for-byte
ok 398 - explicit init preserves an existing empty Brain byte-for-byte
  ---
  duration_ms: 9097.797292
  type: 'test'
  ...
# Subtest: init generated human docs follow --lang and keep machine artifacts stable
ok 399 - init generated human docs follow --lang and keep machine artifacts stable
  ---
  duration_ms: 5219.151333
  type: 'test'
  ...
# Subtest: init uses existing project language config for generated docs without --lang
ok 400 - init uses existing project language config for generated docs without --lang
  ---
  duration_ms: 2017.482416
  type: 'test'
  ...
# Subtest: init --minimal writes only the essential onboarding contract
ok 401 - init --minimal writes only the essential onboarding contract
  ---
  duration_ms: 1993.975208
  type: 'test'
  ...
# Subtest: init --full preserves the historical compatibility layout explicitly
ok 402 - init --full preserves the historical compatibility layout explicitly
  ---
  duration_ms: 2474.435125
  type: 'test'
  ...
# Subtest: init --legacy-scripts writes compatibility wrappers and package scripts without full extras
ok 403 - init --legacy-scripts writes compatibility wrappers and package scripts without full extras
  ---
  duration_ms: 2072.022542
  type: 'test'
  ...
# Subtest: init --include-templates exports packaged templates under .quiver/templates only
ok 404 - init --include-templates exports packaged templates under .quiver/templates only
  ---
  duration_ms: 2402.788083
  type: 'test'
  ...
# Subtest: init preserves existing project files by default
ok 405 - init preserves existing project files by default
  ---
  duration_ms: 2123.104917
  type: 'test'
  ...
# Subtest: init merges root gitignore defaults without deleting existing entries
ok 406 - init merges root gitignore defaults without deleting existing entries
  ---
  duration_ms: 2043.871375
  type: 'test'
  ...
# Subtest: migrate --yes reports legacy layout paths and preserves existing legacy files
ok 407 - migrate --yes reports legacy layout paths and preserves existing legacy files
  ---
  duration_ms: 4780.9965
  type: 'test'
  ...
# Subtest: migrate without --yes is safe and actionable in no-TTY automation
ok 408 - migrate without --yes is safe and actionable in no-TTY automation
  ---
  duration_ms: 8983.924583
  type: 'test'
  ...
# Subtest: migrate cancellation leaves the tree unchanged before side effects
ok 409 - migrate cancellation leaves the tree unchanged before side effects
  ---
  duration_ms: 4396.398292
  type: 'test'
  ...
# Subtest: migrate --dry-run reports planned changes without writing
ok 410 - migrate --dry-run reports planned changes without writing
  ---
  duration_ms: 4464.754042
  type: 'test'
  ...
# Subtest: migrate --dry-run supports Spanish human output without translating commands
ok 411 - migrate --dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 4554.423167
  type: 'test'
  ...
# Subtest: migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
ok 412 - migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
  ---
  duration_ms: 22277.212
  type: 'test'
  ...
# Started: spec-a/slice-01-alpha
# Subtest: collectNext returns the first ready slice and the ready set
ok 413 - collectNext returns the first ready slice and the ready set
  ---
  duration_ms: 38.843042
  type: 'test'
  ...
# Subtest: next CLI emits parseable JSON
ok 414 - next CLI emits parseable JSON
  ---
  duration_ms: 233.908542
  type: 'test'
  ...
# Subtest: next CLI prints the top ready slice and the copy-paste command
ok 415 - next CLI prints the top ready slice and the copy-paste command
  ---
  duration_ms: 255.429625
  type: 'test'
  ...
# Subtest: next CLI localizes human output while preserving start command
ok 416 - next CLI localizes human output while preserving start command
  ---
  duration_ms: 265.127416
  type: 'test'
  ...
# Subtest: next CLI can list all ready slices
ok 417 - next CLI can list all ready slices
  ---
  duration_ms: 268.868208
  type: 'test'
  ...
# Subtest: next include-completed reports history without suggesting completed work
ok 418 - next include-completed reports history without suggesting completed work
  ---
  duration_ms: 490.840542
  type: 'test'
  ...
# Subtest: next auto-start rejects non-TTY sessions and can start through an injected prompt
ok 419 - next auto-start rejects non-TTY sessions and can start through an injected prompt
  ---
  duration_ms: 8.263709
  type: 'test'
  ...
# Subtest: next formatter keeps the ready slice command visible
ok 420 - next formatter keeps the ready slice command visible
  ---
  duration_ms: 2.577916
  type: 'test'
  ...
# Subtest: parser adapter requires and delegates to legacy parser
ok 421 - parser adapter requires and delegates to legacy parser
  ---
  duration_ms: 1.43525
  type: 'test'
  ...
# Subtest: command registry reflects supported command surface with explicit changelog wrapper
ok 422 - command registry reflects supported command surface with explicit changelog wrapper
  ---
  duration_ms: 0.085542
  type: 'test'
  ...
# Subtest: baseline parser contracts stay stable for high-risk entry points
ok 423 - baseline parser contracts stay stable for high-risk entry points
  ---
  duration_ms: 1461.266417
  type: 'test'
  ...
# Slice graph contains a cycle: spec-a/slice-01-alpha -> spec-a/slice-02-beta -> spec-a/slice-01-alpha
# Subtest: collectPlan returns pending slices, critical path, and total hours
ok 424 - collectPlan returns pending slices, critical path, and total hours
  ---
  duration_ms: 26.502375
  type: 'test'
  ...
# Subtest: plan can include completed slices for history without changing defaults
ok 425 - plan can include completed slices for history without changing defaults
  ---
  duration_ms: 227.813958
  type: 'test'
  ...
# Subtest: collectPlan respects --only-ready and --spec filtering
ok 426 - collectPlan respects --only-ready and --spec filtering
  ---
  duration_ms: 6.486916
  type: 'test'
  ...
# Subtest: scoped plan does not parse unrelated historical slice artifacts
ok 427 - scoped plan does not parse unrelated historical slice artifacts
  ---
  duration_ms: 4.392833
  type: 'test'
  ...
# Subtest: scoped plan keeps explicit external dependencies for readiness
ok 428 - scoped plan keeps explicit external dependencies for readiness
  ---
  duration_ms: 2.407208
  type: 'test'
  ...
# Subtest: plan CLI emits parseable JSON
ok 429 - plan CLI emits parseable JSON
  ---
  duration_ms: 259.502083
  type: 'test'
  ...
# Subtest: plan missing-estimates note is human-only and JSON-safe
ok 430 - plan missing-estimates note is human-only and JSON-safe
  ---
  duration_ms: 773.33825
  type: 'test'
  ...
# Subtest: plan CLI localizes human output without altering slice refs
ok 431 - plan CLI localizes human output without altering slice refs
  ---
  duration_ms: 253.138375
  type: 'test'
  ...
# Subtest: plan CLI stays ASCII by default and can opt into Unicode
ok 432 - plan CLI stays ASCII by default and can opt into Unicode
  ---
  duration_ms: 523.450167
  type: 'test'
  ...
# Subtest: plan CLI fails on cycles with the cycle path in the error
ok 433 - plan CLI fails on cycles with the cycle path in the error
  ---
  duration_ms: 218.430791
  type: 'test'
  ...
# Subtest: prepare dry-run reports checks and does not write files
ok 434 - prepare dry-run reports checks and does not write files
  ---
  duration_ms: 884.7215
  type: 'test'
  ...
# Subtest: prepare reports missing gh with cross-platform guidance
ok 435 - prepare reports missing gh with cross-platform guidance
  ---
  duration_ms: 332.62925
  type: 'test'
  ...
# Subtest: prepare reports a missing provider CLI with actionable guidance
ok 436 - prepare reports a missing provider CLI with actionable guidance
  ---
  duration_ms: 550.69825
  type: 'test'
  ...
# Subtest: prepare reports SSH identity and auth recovery steps
ok 437 - prepare reports SSH identity and auth recovery steps
  ---
  duration_ms: 572.951667
  type: 'test'
  ...
# Subtest: prepare success recommends the next safe command
ok 438 - prepare success recommends the next safe command
  ---
  duration_ms: 829.503958
  type: 'test'
  ...
# Subtest: prepare treats missing README_FOR_AI.md as framework guidance, not project debt
ok 439 - prepare treats missing README_FOR_AI.md as framework guidance, not project debt
  ---
  duration_ms: 511.9735
  type: 'test'
  ...
# Subtest: slice namespace matches legacy check-slice behavior and keeps warning on stderr
ok 440 - slice namespace matches legacy check-slice behavior and keeps warning on stderr
  ---
  duration_ms: 711.939667
  type: 'test'
  ...
# Subtest: legacy slice warning is suppressed when json mode is requested
ok 441 - legacy slice warning is suppressed when json mode is requested
  ---
  duration_ms: 317.968292
  type: 'test'
  ...
# Subtest: slice check json failure emits one machine envelope without human prose
ok 442 - slice check json failure emits one machine envelope without human prose
  ---
  duration_ms: 334.049708
  type: 'test'
  ...
# Subtest: slice namespace rejects unsupported subcommands before execution
ok 443 - slice namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 189.529792
  type: 'test'
  ...
# create-quiver: spec branch feature/example-spec is not merged into main. Merge the PR before cleanup, or pass --discard intentionally.
# create-quiver: spec worktree is dirty: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-close-sNVRoH/feature-example-spec. Commit or stash before closing, or pass --discard intentionally.
# Subtest: spec close blocks when spec branch is not merged
ok 444 - spec close blocks when spec branch is not merged
  ---
  duration_ms: 932.012709
  type: 'test'
  ...
# Subtest: spec start dry-run does not create a worktree
ok 445 - spec start dry-run does not create a worktree
  ---
  duration_ms: 415.885166
  type: 'test'
  ...
# Subtest: spec close blocks dirty spec worktrees by default
ok 446 - spec close blocks dirty spec worktrees by default
  ---
  duration_ms: 776.098875
  type: 'test'
  ...
# Subtest: spec close dry-run keeps merged clean worktree in place
ok 447 - spec close dry-run keeps merged clean worktree in place
  ---
  duration_ms: 944.373417
  type: 'test'
  ...
# Subtest: spec close dry-run renders Spanish labels while preserving command details
ok 448 - spec close dry-run renders Spanish labels while preserving command details
  ---
  duration_ms: 984.938042
  type: 'test'
  ...
# Subtest: spec close removes a merged clean spec worktree
ok 449 - spec close removes a merged clean spec worktree
  ---
  duration_ms: 1319.832125
  type: 'test'
  ...
# Subtest: spec close renders Spanish completion labels
ok 450 - spec close renders Spanish completion labels
  ---
  duration_ms: 1179.325667
  type: 'test'
  ...
# Spec de Quiver creada
# Slug de spec: quiver-v23-created-spec
# Destino: specs/quiver-v23-created-spec
# Archivos escritos: 11
# - specs/quiver-v23-created-spec/SPEC.md
# - specs/quiver-v23-created-spec/STATUS.md
# - specs/quiver-v23-created-spec/EVIDENCE_REPORT.md
# - specs/quiver-v23-created-spec/EXECUTION_PLAN.md
# - specs/quiver-v23-created-spec/pr.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/slice.json
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/CLOSURE_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/slice.json
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/CLOSURE_BRIEF.md
# Proximos comandos seguros:
# - npx create-quiver spec start specs/quiver-v23-created-spec
# - npx create-quiver spec status specs/quiver-v23-created-spec
# - npx create-quiver next
# - npx create-quiver ai execute-plan --dry-run --commit
# create-quiver: spec directory already exists: specs/quiver-v23-created-spec
# create-quiver: el directorio de spec ya existe: specs/quiver-v23-created-spec
# create-quiver: ai plan phase 'spec' requires a reviewed and approved technical-plan input; current review status: missing. Run `npx create-quiver ai review-plan --dry-run`. Preview the review first, then run `npx create-quiver ai review-plan` to persist it.
# create-quiver: approved technical plan must include a structured slices array. Expected JSON: { "spec": { "slices": [{ "slice_id": "slice-01-name", "title": "...", "objective": "...", "files": [] }] } }
# Quiver spec created
# Spec slug: quiver-v23-created-spec
# Target: specs/quiver-v23-created-spec
# Files written: 12
# - specs/quiver-v23-created-spec/GOVERNANCE_MANIFEST.json
# - specs/quiver-v23-created-spec/SPEC.md
# - specs/quiver-v23-created-spec/STATUS.md
# - specs/quiver-v23-created-spec/EVIDENCE_REPORT.md
# - specs/quiver-v23-created-spec/EXECUTION_PLAN.md
# - specs/quiver-v23-created-spec/pr.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/slice.json
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/CLOSURE_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/slice.json
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/CLOSURE_BRIEF.md
# Next safe commands:
# - npx create-quiver spec start specs/quiver-v23-created-spec
# - npx create-quiver spec status specs/quiver-v23-created-spec
# - npx create-quiver next
# - npx create-quiver ai execute-plan --dry-run --commit
# AI digest-bound approval saved
# Run: run-spec-create-ledger
# Phase: acceptance
# Decision: approved
# Version: v1
# Artifact: .quiver/runs/run-spec-create-ledger/approvals/acceptance/v001.md
# Artifact digest: sha256:b187ba1bb3546781fcf8f55cdd70745231cc28c9838fbb9acf7b3cde88534eac
# Input digest: sha256:a7788841655d33f59c2160e49e16fc3cb550fbe6f4c3054961b7616a422ed3fd
# Criteria: 1
# Findings: 0
# Decision digest: sha256:dbf1d4ba808411510c51879c384e431a088c2a3d9b172e460ac8442d8e459dba
# {
#   "spec": {
#     "slug": "quiver-v23-created-spec",
#     "title": "Quiver v23 created spec",
#     "ticket": "QUIVER-23-CREATE",
#     "objective": "Create a spec from a reviewed approved plan.",
#     "acceptance": [
#       "slice-00 exists",
#       "pr.md exists"
#     ],
#     "slices": [
#       {
#         "slice_id": "slice-01-create-core",
#         "ticket": "QUIVER-23-CREATE",
#         "title": "Create core",
#         "objective": "Render the spec tree from the approved plan.",
#         "description": "Generate the expected files.",
#         "files": [
#           "src/create-quiver/commands/spec.js"
#         ],
#         "acceptance": [
#           "Spec create writes a valid spec tree."
#         ]
#       }
#     ]
#   }
# }
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/1
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# - Codes: REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED
# - Governed next actions: approve-with-conditions, reject, transfer-findings, create-follow-up, targeted-amendment
# AI digest-bound approval saved
# Run: run-spec-create-ledger
# Phase: technical-plan
# Decision: approved
# Version: v1
# Artifact: .quiver/runs/run-spec-create-ledger/approvals/technical-plan/v001.md
# Artifact digest: sha256:de98081c3524ba4b09190bd19263da1f80fd845afed96584afe1ca32f52a2827
# Input digest: sha256:b187ba1bb3546781fcf8f55cdd70745231cc28c9838fbb9acf7b3cde88534eac
# Criteria: 1
# Findings: 0
# Decision digest: sha256:cb4b9507bbd5fb658602364f9b6650e6823b65839aaea23a5751219bba04d3c2
# Quiver spec created
# Spec slug: quiver-v23-created-spec
# Target: specs/quiver-v23-created-spec
# Files written: 12
# - specs/quiver-v23-created-spec/GOVERNANCE_MANIFEST.json
# - specs/quiver-v23-created-spec/SPEC.md
# - specs/quiver-v23-created-spec/STATUS.md
# - specs/quiver-v23-created-spec/EVIDENCE_REPORT.md
# - specs/quiver-v23-created-spec/EXECUTION_PLAN.md
# - specs/quiver-v23-created-spec/pr.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/slice.json
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-00-spec-foundation/CLOSURE_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/slice.json
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/EXECUTION_BRIEF.md
# - specs/quiver-v23-created-spec/slices/slice-01-create-core/CLOSURE_BRIEF.md
# Next safe commands:
# - npx create-quiver spec start specs/quiver-v23-created-spec
# - npx create-quiver spec status specs/quiver-v23-created-spec
# - npx create-quiver next
# - npx create-quiver ai execute-plan --dry-run --commit
# Subtest: spec create dry-run previews files and next safe commands without writing
ok 451 - spec create dry-run previews files and next safe commands without writing
  ---
  duration_ms: 686.813709
  type: 'test'
  ...
# Subtest: spec create --review dry-run advertises review without opening an editor or writing
ok 452 - spec create --review dry-run advertises review without opening an editor or writing
  ---
  duration_ms: 575.013333
  type: 'test'
  ...
# Subtest: spec create dry-run renders Spanish from explicit language without translating commands
ok 453 - spec create dry-run renders Spanish from explicit language without translating commands
  ---
  duration_ms: 619.4025
  type: 'test'
  ...
# Subtest: spec create review dry-run renders Spanish review wrapper safely
ok 454 - spec create review dry-run renders Spanish review wrapper safely
  ---
  duration_ms: 682.546042
  type: 'test'
  ...
# Subtest: spec create dry-run uses configured project language when no flag is provided
ok 455 - spec create dry-run uses configured project language when no flag is provided
  ---
  duration_ms: 695.749417
  type: 'test'
  ...
# Subtest: spec create --review cancellation blocks writes
ok 456 - spec create --review cancellation blocks writes
  ---
  duration_ms: 572.231041
  type: 'test'
  ...
# Subtest: spec create --interactive can decline writes
ok 457 - spec create --interactive can decline writes
  ---
  duration_ms: 470.78025
  type: 'test'
  ...
# Subtest: spec create --interactive writes after guided summary approval
ok 458 - spec create --interactive writes after guided summary approval
  ---
  duration_ms: 606.770541
  type: 'test'
  ...
# Subtest: spec create writes the generated spec tree and refuses collisions
ok 459 - spec create writes the generated spec tree and refuses collisions
  ---
  duration_ms: 1110.838333
  type: 'test'
  ...
# Subtest: spec create collision error localizes
ok 460 - spec create collision error localizes
  ---
  duration_ms: 929.048375
  type: 'test'
  ...
# Subtest: spec create blocks when the approved technical plan was not reviewed
ok 461 - spec create blocks when the approved technical plan was not reviewed
  ---
  duration_ms: 350.79875
  type: 'test'
  ...
# Subtest: spec create fails before writing when approved plan lacks structured slices
ok 462 - spec create fails before writing when approved plan lacks structured slices
  ---
  duration_ms: 349.411542
  type: 'test'
  ...
# Subtest: spec create accepts a canonical unconditional decision and publishes its governance manifest
ok 463 - spec create accepts a canonical unconditional decision and publishes its governance manifest
  ---
  duration_ms: 22.919584
  type: 'test'
  ...
# Subtest: spec create resolves an on-disk canonical ledger without an injected governance resolver
ok 464 - spec create resolves an on-disk canonical ledger without an injected governance resolver
  ---
  duration_ms: 620.899166
  type: 'test'
  ...
# Subtest: spec create revalidates governance after preview and fails before publication when parity changes
ok 465 - spec create revalidates governance after preview and fails before publication when parity changes
  ---
  duration_ms: 4.218417
  type: 'test'
  ...
# Subtest: spec validate checks a complete spec package
ok 466 - spec validate checks a complete spec package
  ---
  duration_ms: 217.897709
  type: 'test'
  ...
# Subtest: spec validate renders Spanish report labels without translating paths
ok 467 - spec validate renders Spanish report labels without translating paths
  ---
  duration_ms: 273.591458
  type: 'test'
  ...
# Subtest: spec validate fails on unsafe paths and incomplete briefs
ok 468 - spec validate fails on unsafe paths and incomplete briefs
  ---
  duration_ms: 269.854375
  type: 'test'
  ...
# Subtest: spec validate fails when slice execution git metadata is missing
ok 469 - spec validate fails when slice execution git metadata is missing
  ---
  duration_ms: 194.434625
  type: 'test'
  ...
# Subtest: spec validate strict mode promotes status and evidence warnings
ok 470 - spec validate strict mode promotes status and evidence warnings
  ---
  duration_ms: 238.366
  type: 'test'
  ...
# Subtest: spec validate strict mode renders Spanish failure wrapper while preserving warning text
ok 471 - spec validate strict mode renders Spanish failure wrapper while preserving warning text
  ---
  duration_ms: 204.652
  type: 'test'
  ...
# Subtest: spec validate missing directory error localizes
ok 472 - spec validate missing directory error localizes
  ---
  duration_ms: 235.762709
  type: 'test'
  ...
# create-quiver: current checkout is not clean. Starting a spec worktree needs a clean main checkout.
# Dirty files:
# - dirty.txt
# Safe options:
# - Commit the current changes if they belong to the active slice.
# - Stash changes manually after reviewing them.
# - Move this work to a separate worktree before starting the spec.
# - Abort and rerun from a clean checkout.
# Subtest: spec status shows slice-00 status and pending slices
ok 473 - spec status shows slice-00 status and pending slices
  ---
  duration_ms: 367.842542
  type: 'test'
  ...
# Subtest: spec status renders Spanish labels while preserving ids and statuses
ok 474 - spec status renders Spanish labels while preserving ids and statuses
  ---
  duration_ms: 384.465042
  type: 'test'
  ...
# Subtest: spec status blocks later slices until slice-00 is completed
ok 475 - spec status blocks later slices until slice-00 is completed
  ---
  duration_ms: 486.447791
  type: 'test'
  ...
# Subtest: spec status reports an expected worktree path that exists but is not registered as stale
ok 476 - spec status reports an expected worktree path that exists but is not registered as stale
  ---
  duration_ms: 447.716583
  type: 'test'
  ...
# Subtest: spec start creates and then reuses a dedicated worktree from main
ok 477 - spec start creates and then reuses a dedicated worktree from main
  ---
  duration_ms: 1107.113416
  type: 'test'
  ...
# Subtest: spec start dry-run renders Spanish labels while preserving branch and paths
ok 478 - spec start dry-run renders Spanish labels while preserving branch and paths
  ---
  duration_ms: 480.921708
  type: 'test'
  ...
# Subtest: spec start refuses a dirty checkout
ok 479 - spec start refuses a dirty checkout
  ---
  duration_ms: 621.903125
  type: 'test'
  ...
# Subtest: UX flag matrix documents supported commands
ok 480 - UX flag matrix documents supported commands
  ---
  duration_ms: 1.466125
  type: 'test'
  ...
# Subtest: resolveUxCommandKey handles top-level, ai, and spec commands
ok 481 - resolveUxCommandKey handles top-level, ai, and spec commands
  ---
  duration_ms: 0.171125
  type: 'test'
  ...
# Subtest: supported UX flags validate for planner-capable and PR commands
ok 482 - supported UX flags validate for planner-capable and PR commands
  ---
  duration_ms: 0.204084
  type: 'test'
  ...
# Subtest: unsupported UX flags fail with actionable guidance before command execution
ok 483 - unsupported UX flags fail with actionable guidance before command execution
  ---
  duration_ms: 230.627
  type: 'test'
  ...
# Subtest: ai pr rejects --with-planner while keeping review flags available
ok 484 - ai pr rejects --with-planner while keeping review flags available
  ---
  duration_ms: 265.540375
  type: 'test'
  ...
# Subtest: JSON mode rejects interactive and review flows without partial JSON stdout
ok 485 - JSON mode rejects interactive and review flows without partial JSON stdout
  ---
  duration_ms: 531.3045
  type: 'test'
  ...
# Subtest: read-only ai inspect rejects UX flags early
ok 486 - read-only ai inspect rejects UX flags early
  ---
  duration_ms: 244.278458
  type: 'test'
  ...
# Subtest: existing JSON command output stays parseable when no UX flags are requested
ok 487 - existing JSON command output stays parseable when no UX flags are requested
  ---
  duration_ms: 502.017333
  type: 'test'
  ...
# Subtest: version command renders English and Spanish human labels
ok 488 - version command renders English and Spanish human labels
  ---
  duration_ms: 439.361875
  type: 'test'
  ...
# Subtest: version command uses configured project language without --lang
ok 489 - version command uses configured project language without --lang
  ---
  duration_ms: 213.472167
  type: 'test'
  ...
# Subtest: version JSON and top-level semver output remain stable with language overrides
ok 490 - version JSON and top-level semver output remain stable with language overrides
  ---
  duration_ms: 387.479417
  type: 'test'
  ...
# Subtest: generated command metadata is present in runtime help
ok 491 - generated command metadata is present in runtime help
  ---
  duration_ms: 201.315459
  type: 'test'
  ...
# Subtest: docs command reference generated block is synchronized
ok 492 - docs command reference generated block is synchronized
  ---
  duration_ms: 166.136667
  type: 'test'
  ...
# Subtest: generated block replacement preserves manual content outside markers
ok 493 - generated block replacement preserves manual content outside markers
  ---
  duration_ms: 1.104083
  type: 'test'
  ...
# Subtest: agent profiles persist provider and technical model ids without secrets
ok 494 - agent profiles persist provider and technical model ids without secrets
  ---
  duration_ms: 8.268917
  type: 'test'
  ...
# Subtest: agent profiles normalize known visual model aliases to technical ids
ok 495 - agent profiles normalize known visual model aliases to technical ids
  ---
  duration_ms: 1.069917
  type: 'test'
  ...
# Subtest: agent profiles support multiple named profiles per role with a default
ok 496 - agent profiles support multiple named profiles per role with a default
  ---
  duration_ms: 2.025792
  type: 'test'
  ...
# Subtest: agent profiles list and resolve configured provider defaults
ok 497 - agent profiles list and resolve configured provider defaults
  ---
  duration_ms: 3.456042
  type: 'test'
  ...
# Subtest: agent profiles reject unsupported providers and secret-like values
ok 498 - agent profiles reject unsupported providers and secret-like values
  ---
  duration_ms: 1.153208
  type: 'test'
  ...
# Subtest: agent profile doctor classifies aliases, custom models, and unsupported providers
ok 499 - agent profile doctor classifies aliases, custom models, and unsupported providers
  ---
  duration_ms: 3.264625
  type: 'test'
  ...
# Subtest: agent profile repair plan previews alias normalization without writes
ok 500 - agent profile repair plan previews alias normalization without writes
  ---
  duration_ms: 1.116708
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
ok 501 - assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
  ---
  duration_ms: 18.455292
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
ok 502 - assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
  ---
  duration_ms: 1.154
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
ok 503 - assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
  ---
  duration_ms: 12.558792
  type: 'test'
  ...
# Subtest: project discovery reports workspace roots and safety exclusions without reading unsafe paths
ok 504 - project discovery reports workspace roots and safety exclusions without reading unsafe paths
  ---
  duration_ms: 121.404542
  type: 'test'
  ...
# Subtest: semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
ok 505 - semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
  ---
  duration_ms: 7.409709
  type: 'test'
  ...
# Subtest: project discovery handles unknown stack, no package manager, symlinks, and large samples safely
ok 506 - project discovery handles unknown stack, no package manager, symlinks, and large samples safely
  ---
  duration_ms: 132.544208
  type: 'test'
  ...
# Subtest: semantic sampling respects source, test, db, and budget options
ok 507 - semantic sampling respects source, test, db, and budget options
  ---
  duration_ms: 6.597083
  type: 'test'
  ...
# Subtest: project discovery can restrict analysis to a workspace name
ok 508 - project discovery can restrict analysis to a workspace name
  ---
  duration_ms: 4.16975
  type: 'test'
  ...
# Subtest: mergeManagedBlock preserves human content and replaces prior analyze-project block
ok 509 - mergeManagedBlock preserves human content and replaces prior analyze-project block
  ---
  duration_ms: 0.993208
  type: 'test'
  ...
# Subtest: collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
ok 510 - collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
  ---
  duration_ms: 1.011833
  type: 'test'
  ...
# Subtest: classifyAnalyzeProjectDoc detects scaffold and human content conservatively
ok 511 - classifyAnalyzeProjectDoc detects scaffold and human content conservatively
  ---
  duration_ms: 1.935875
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
ok 512 - mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
  ---
  duration_ms: 0.553583
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
ok 513 - mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
  ---
  duration_ms: 1.449333
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
ok 514 - mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
  ---
  duration_ms: 0.148583
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
ok 515 - mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
  ---
  duration_ms: 0.1755
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc is idempotent for the same proposal
ok 516 - mergeAnalyzeProjectDoc is idempotent for the same proposal
  ---
  duration_ms: 0.155458
  type: 'test'
  ...
# Subtest: doc proposal validation allows only approved Markdown docs
ok 517 - doc proposal validation allows only approved Markdown docs
  ---
  duration_ms: 1.70025
  type: 'test'
  ...
# Subtest: write plan preserves human content and snapshot manifest records hashes
ok 518 - write plan preserves human content and snapshot manifest records hashes
  ---
  duration_ms: 89.431667
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
ok 519 - parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
  ---
  duration_ms: 5.973833
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects missing selected evidence paths
ok 520 - parseAnalyzeProjectOutput rejects missing selected evidence paths
  ---
  duration_ms: 0.629041
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
ok 521 - parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
  ---
  duration_ms: 0.197542
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects unapproved doc update paths
ok 522 - parseAnalyzeProjectOutput rejects unapproved doc update paths
  ---
  duration_ms: 0.242708
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects malformed provider output
ok 523 - parseAnalyzeProjectOutput rejects malformed provider output
  ---
  duration_ms: 0.284834
  type: 'test'
  ...
# Subtest: analyze-project proposal artifact paths follow the v55 contract
ok 524 - analyze-project proposal artifact paths follow the v55 contract
  ---
  duration_ms: 0.7785
  type: 'test'
  ...
# Subtest: analyze-project proposal run ids reject unsafe path segments
ok 525 - analyze-project proposal run ids reject unsafe path segments
  ---
  duration_ms: 0.315791
  type: 'test'
  ...
# Subtest: proposal and write manifests validate strict safe paths
ok 526 - proposal and write manifests validate strict safe paths
  ---
  duration_ms: 3.668666
  type: 'test'
  ...
# Subtest: proposal manifest rejects traversal and extra keys
ok 527 - proposal manifest rejects traversal and extra keys
  ---
  duration_ms: 0.158541
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
ok 528 - writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
  ---
  duration_ms: 13.263667
  type: 'test'
  ...
# Subtest: readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
ok 529 - readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
  ---
  duration_ms: 4.431416
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectWriteManifest writes final normalized apply manifest
ok 530 - writeAnalyzeProjectWriteManifest writes final normalized apply manifest
  ---
  duration_ms: 3.046208
  type: 'test'
  ...
# Subtest: normalizes project-relative evidence paths and rejects outside-scope paths
ok 531 - normalizes project-relative evidence paths and rejects outside-scope paths
  ---
  duration_ms: 1.76025
  type: 'test'
  ...
# Subtest: classifies env examples as metadata-only and real env files as security-excluded
ok 532 - classifies env examples as metadata-only and real env files as security-excluded
  ---
  duration_ms: 2.096125
  type: 'test'
  ...
# Subtest: recognizes metadata-only env template names
ok 533 - recognizes metadata-only env template names
  ---
  duration_ms: 0.242542
  type: 'test'
  ...
# Subtest: classifies generated dependency paths and binary files as excluded
ok 534 - classifies generated dependency paths and binary files as excluded
  ---
  duration_ms: 5.603708
  type: 'test'
  ...
# Subtest: classifies omitted budget files as safe-to-include without reading content
ok 535 - classifies omitted budget files as safe-to-include without reading content
  ---
  duration_ms: 2.251125
  type: 'test'
  ...
# Subtest: classifies lockfile omissions as metadata-only
ok 536 - classifies lockfile omissions as metadata-only
  ---
  duration_ms: 0.894125
  type: 'test'
  ...
# Subtest: classifies omitted binary-file records as generated dependency exclusions
ok 537 - classifies omitted binary-file records as generated dependency exclusions
  ---
  duration_ms: 2.05575
  type: 'test'
  ...
# Subtest: classifies missing and not-discovered safe text files without throwing
ok 538 - classifies missing and not-discovered safe text files without throwing
  ---
  duration_ms: 1.697
  type: 'test'
  ...
# Subtest: classifies evidence-not-selected issues deterministically and deduplicates paths
ok 539 - classifies evidence-not-selected issues deterministically and deduplicates paths
  ---
  duration_ms: 12.212333
  type: 'test'
  ...
# Subtest: extracts evidence path from provider validation issue message
ok 540 - extracts evidence path from provider validation issue message
  ---
  duration_ms: 0.4365
  type: 'test'
  ...
# Subtest: calculates recovery budgets from safe classified evidence only
ok 541 - calculates recovery budgets from safe classified evidence only
  ---
  duration_ms: 1.07225
  type: 'test'
  ...
# Subtest: never lowers existing budgets and detects category flags from omission reasons
ok 542 - never lowers existing budgets and detects category flags from omission reasons
  ---
  duration_ms: 0.085084
  type: 'test'
  ...
# Subtest: returns scope-required when recommendation exceeds recovery caps
ok 543 - returns scope-required when recommendation exceeds recovery caps
  ---
  duration_ms: 0.052334
  type: 'test'
  ...
# Subtest: builds one-line recovery command preserving relevant flags and dropping transient flags
ok 544 - builds one-line recovery command preserving relevant flags and dropping transient flags
  ---
  duration_ms: 0.183583
  type: 'test'
  ...
# Subtest: builds recovery payload with command or safe fallback warning
ok 545 - builds recovery payload with command or safe fallback warning
  ---
  duration_ms: 0.142292
  type: 'test'
  ...
# Subtest: analyze-project schema accepts the required top-level contract
ok 546 - analyze-project schema accepts the required top-level contract
  ---
  duration_ms: 2.269333
  type: 'test'
  ...
# Subtest: analyze-project schema rejects invalid confidence levels and unknown top-level fields
ok 547 - analyze-project schema rejects invalid confidence levels and unknown top-level fields
  ---
  duration_ms: 0.730541
  type: 'test'
  ...
# Subtest: analyze-project schema allows unknown findings without evidence
ok 548 - analyze-project schema allows unknown findings without evidence
  ---
  duration_ms: 0.6935
  type: 'test'
  ...
# Subtest: post-write validation passes clean managed docs
ok 549 - post-write validation passes clean managed docs
  ---
  duration_ms: 28.049375
  type: 'test'
  ...
# Subtest: post-write validation rejects critical placeholders in managed docs
ok 550 - post-write validation rejects critical placeholders in managed docs
  ---
  duration_ms: 8.361708
  type: 'test'
  ...
# Subtest: post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
ok 551 - post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
  ---
  duration_ms: 3.872209
  type: 'test'
  ...
# Subtest: post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
ok 552 - post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
  ---
  duration_ms: 6.753833
  type: 'test'
  ...
# Subtest: post-write validation rechecks evidence paths against the selected sample
ok 553 - post-write validation rechecks evidence paths against the selected sample
  ---
  duration_ms: 5.844792
  type: 'test'
  ...
# Subtest: limitRawProviderStream preserves head, tail, hash, and byte cap
ok 554 - limitRawProviderStream preserves head, tail, hash, and byte cap
  ---
  duration_ms: 1.526916
  type: 'test'
  ...
# Subtest: redactSensitiveValue recursively redacts structured secrets without mutating input
ok 555 - redactSensitiveValue recursively redacts structured secrets without mutating input
  ---
  duration_ms: 2.096375
  type: 'test'
  ...
# Subtest: writeRawProviderArtifact stores redacted and size-controlled provider streams
ok 556 - writeRawProviderArtifact stores redacted and size-controlled provider streams
  ---
  duration_ms: 52.831584
  type: 'test'
  ...
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 557 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 1.160666
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 558 - executor defaults to slice and never full
  ---
  duration_ms: 0.796041
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 559 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 1.335292
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 560 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 0.207375
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 561 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.486791
  type: 'test'
  ...
# Subtest: authorized selector output augments the existing pack with injection-safe structured context
ok 562 - authorized selector output augments the existing pack with injection-safe structured context
  ---
  duration_ms: 253.957459
  type: 'test'
  ...
# Subtest: manifest brands bind both canonical project root and Brain project identity
ok 563 - manifest brands bind both canonical project root and Brain project identity
  ---
  duration_ms: 126.663167
  type: 'test'
  ...
# Subtest: new async pack adapter falls back only for a verified absent Brain namespace
ok 564 - new async pack adapter falls back only for a verified absent Brain namespace
  ---
  duration_ms: 6.109208
  type: 'test'
  ...
# Subtest: initialized Brain corruption never downgrades to a legacy context pack
ok 565 - initialized Brain corruption never downgrades to a legacy context pack
  ---
  duration_ms: 46.55125
  type: 'test'
  ...
# Subtest: async pack adapter preserves policy and schema failures instead of falling back
ok 566 - async pack adapter preserves policy and schema failures instead of falling back
  ---
  duration_ms: 62.516334
  type: 'test'
  ...
# Subtest: valid planner context proposal parses into a normalized docs-only write plan
ok 567 - valid planner context proposal parses into a normalized docs-only write plan
  ---
  duration_ms: 7.560167
  type: 'test'
  ...
# Subtest: fenced JSON planner output is accepted when schema and paths are safe
ok 568 - fenced JSON planner output is accepted when schema and paths are safe
  ---
  duration_ms: 2.864333
  type: 'test'
  ...
# Subtest: legacy files alias is normalized to docs for planner proposals
ok 569 - legacy files alias is normalized to docs for planner proposals
  ---
  duration_ms: 1.767833
  type: 'test'
  ...
# Subtest: planner proposal rejects product code, dependency files, and unapproved docs
ok 570 - planner proposal rejects product code, dependency files, and unapproved docs
  ---
  duration_ms: 2.960917
  type: 'test'
  ...
# Subtest: planner proposal rejects absolute and traversal paths before writes
ok 571 - planner proposal rejects absolute and traversal paths before writes
  ---
  duration_ms: 2.574
  type: 'test'
  ...
# Subtest: invalid schema, duplicate paths, empty content, and malformed output are actionable
ok 572 - invalid schema, duplicate paths, empty content, and malformed output are actionable
  ---
  duration_ms: 4.028333
  type: 'test'
  ...
# Subtest: context proposal path allowlist is explicit and validates safe paths
ok 573 - context proposal path allowlist is explicit and validates safe paths
  ---
  duration_ms: 0.224875
  type: 'test'
  ...
# Subtest: invalid planner proposal artifacts are redacted and stored under the run raw directory
ok 574 - invalid planner proposal artifacts are redacted and stored under the run raw directory
  ---
  duration_ms: 16.803083
  type: 'test'
  ...
# Subtest: collectExecutionPlan groups slice-00 first and parallel slices by ready level
ok 575 - collectExecutionPlan groups slice-00 first and parallel slices by ready level
  ---
  duration_ms: 47.573625
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when same-level files overlap
ok 576 - collectExecutionPlan falls back to sequential mode when same-level files overlap
  ---
  duration_ms: 53.766584
  type: 'test'
  ...
# Subtest: collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
ok 577 - collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
  ---
  duration_ms: 34.000417
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when file scope is unknown
ok 578 - collectExecutionPlan falls back to sequential mode when file scope is unknown
  ---
  duration_ms: 9.147791
  type: 'test'
  ...
# Subtest: formatHumanExecutionPlan includes worktree guidance and level ordering
ok 579 - formatHumanExecutionPlan includes worktree guidance and level ordering
  ---
  duration_ms: 5.105667
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun prints commands without executing providers
ok 580 - formatExecutePlanDryRun prints commands without executing providers
  ---
  duration_ms: 5.658166
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun manual mode prints prompts without execute commands
ok 581 - formatExecutePlanDryRun manual mode prints prompts without execute commands
  ---
  duration_ms: 4.836083
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on missing dependencies with a clear diagnostic
ok 582 - collectExecutionPlan fails on missing dependencies with a clear diagnostic
  ---
  duration_ms: 2.185042
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on dependency cycles with a clear diagnostic
ok 583 - collectExecutionPlan fails on dependency cycles with a clear diagnostic
  ---
  duration_ms: 2.849667
  type: 'test'
  ...
# AI execute-slice dry-run
# Provider: codex
# Role: executor
# Context pack: slice
# Slice: slice-01-demo
# Spec: demo
# Execution brief: specs/demo/slices/slice-01-demo/EXECUTION_BRIEF.md
# Command: codex exec
# Timeout: 600000ms
# Prompt transport: stdin
# Prompt length: 1446 bytes
# Commit after validation: disabled
# Allowed files:
# - src/app.js
# Validation commands:
# - node --test tests/demo.test.js
# AI execute-slice completed
# Slice: slice-01-demo
# Spec: demo
# Changed files: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Scope validation: passed
# Validation commands: passed (1)
# Commit: skipped
# AI execute-slice completado
# Slice: slice-01-demo
# Spec: demo
# Archivos modificados: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Validacion de scope: aprobado
# Comandos de validacion: aprobados (1)
# Commit: omitido
# AI execute-slice completed
# Slice: slice-01-demo
# Spec: demo
# Changed files: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Scope validation: passed
# Validation commands: passed (1)
# Commit: skipped
# AI execute-slice completed
# Slice: slice-01-demo
# Spec: demo
# Changed files: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Scope validation: passed
# Validation commands: passed (1)
# Commit: skipped
# token=[REDACTED]
# changed file
# password=[REDACTED]
# AI execute-slice completed
# Slice: slice-01-demo
# Spec: demo
# Changed files: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Scope validation: passed
# Validation commands: passed (1)
# Commit: skipped
# AI execute-slice completed
# Slice: slice-01-demo
# Spec: demo
# Changed files: 6
# - specs/demo/EVIDENCE_REPORT.md
# - specs/demo/STATUS.md
# - specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md
# - specs/demo/slices/slice-01-demo/slice.json
# - src/app.js
# - specs/demo/COMMAND_LOG.md
# Scope validation: passed
# Validation commands: passed (1)
# Commit: created 330149a
# Commit message: feat: QUIVER-01 Demo slice
# Subtest: resolveSliceJsonPath accepts a slice directory and reports missing slice.json
ok 584 - resolveSliceJsonPath accepts a slice directory and reports missing slice.json
  ---
  duration_ms: 246.419208
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext uses executor slice context without onboarding content
ok 585 - buildExecuteSliceContext uses executor slice context without onboarding content
  ---
  duration_ms: 182.333625
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext prefers allowed_write_paths over legacy files
ok 586 - buildExecuteSliceContext prefers allowed_write_paths over legacy files
  ---
  duration_ms: 127.279084
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
ok 587 - buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
  ---
  duration_ms: 166.699208
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt uses minimal slice context and final report format
ok 588 - buildManualExecutorPrompt uses minimal slice context and final report format
  ---
  duration_ms: 222.116083
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
ok 589 - buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
  ---
  duration_ms: 207.7785
  type: 'test'
  ...
# Subtest: runExecuteSlice dry-run does not execute the provider
ok 590 - runExecuteSlice dry-run does not execute the provider
  ---
  duration_ms: 199.972459
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive mode selects a ready slice and executor profile
ok 591 - runExecuteSlice interactive mode selects a ready slice and executor profile
  ---
  duration_ms: 341.740042
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive progress renders Spanish when language is es
ok 592 - runExecuteSlice interactive progress renders Spanish when language is es
  ---
  duration_ms: 368.114458
  type: 'test'
  ...
# Subtest: runExecuteSlice fails clearly when the provider fails
ok 593 - runExecuteSlice fails clearly when the provider fails
  ---
  duration_ms: 186.823791
  type: 'test'
  ...
# Subtest: runExecuteSlice does not close a slice when provider makes no changes
ok 594 - runExecuteSlice does not close a slice when provider makes no changes
  ---
  duration_ms: 310.260583
  type: 'test'
  ...
# Subtest: runExecuteSlice detects files outside slice scope after provider execution
ok 595 - runExecuteSlice detects files outside slice scope after provider execution
  ---
  duration_ms: 394.126291
  type: 'test'
  ...
# Subtest: runExecuteSlice passes scope validation for allowed files
ok 596 - runExecuteSlice passes scope validation for allowed files
  ---
  duration_ms: 671.252375
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks execution from the wrong slice worktree branch
ok 597 - runExecuteSlice blocks execution from the wrong slice worktree branch
  ---
  duration_ms: 350.345125
  type: 'test'
  ...
# Subtest: runExecuteSlice supports allowed_write_paths-only slice scope
ok 598 - runExecuteSlice supports allowed_write_paths-only slice scope
  ---
  duration_ms: 434.096625
  type: 'test'
  ...
# Subtest: runExecuteSlice updates closure, evidence, command log, and status with redacted logs
ok 599 - runExecuteSlice updates closure, evidence, command log, and status with redacted logs
  ---
  duration_ms: 249.855792
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks commit when validation fails
ok 600 - runExecuteSlice blocks commit when validation fails
  ---
  duration_ms: 361.213375
  type: 'test'
  ...
# Subtest: runExecuteSlice creates one slice commit when commit is enabled
ok 601 - runExecuteSlice creates one slice commit when commit is enabled
  ---
  duration_ms: 373.263959
  type: 'test'
  ...
# Subtest: runExecuteSlice requires a clean worktree before execution
ok 602 - runExecuteSlice requires a clean worktree before execution
  ---
  duration_ms: 148.803958
  type: 'test'
  ...
# Subtest: runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
ok 603 - runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
  ---
  duration_ms: 195.244125
  type: 'test'
  ...
# Subtest: collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
ok 604 - collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
  ---
  duration_ms: 82.636458
  type: 'test'
  ...
# Subtest: lifecycle export formatters produce human-readable inspection and markdown
ok 605 - lifecycle export formatters produce human-readable inspection and markdown
  ---
  duration_ms: 57.600666
  type: 'test'
  ...
# Subtest: lifecycle inspect prefers existing spec commands over stale spec create guidance
ok 606 - lifecycle inspect prefers existing spec commands over stale spec create guidance
  ---
  duration_ms: 73.295709
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports a missing gh with cross-platform install guidance
ok 607 - preflightGitHubPr reports a missing gh with cross-platform install guidance
  ---
  duration_ms: 175.837916
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the gh probe exits non-zero
ok 608 - preflightGitHubPr stops when the gh probe exits non-zero
  ---
  duration_ms: 106.743041
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
ok 609 - preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
  ---
  duration_ms: 108.020875
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the GitFlow guide is missing
ok 610 - preflightGitHubPr stops when the GitFlow guide is missing
  ---
  duration_ms: 157.522625
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports missing SSH host alias with platform guidance
ok 611 - preflightGitHubPr reports missing SSH host alias with platform guidance
  ---
  duration_ms: 270.964833
  type: 'test'
  ...
# Subtest: formatSshAliasGuidance gives shell-specific alias setup and verification
ok 612 - formatSshAliasGuidance gives shell-specific alias setup and verification
  ---
  duration_ms: 0.618584
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports the reviewed identity file path when it is missing
ok 613 - preflightGitHubPr reports the reviewed identity file path when it is missing
  ---
  duration_ms: 230.547416
  type: 'test'
  ...
# Subtest: formatPreflightReport prints shell-specific path guidance for paths with spaces
ok 614 - formatPreflightReport prints shell-specific path guidance for paths with spaces
  ---
  duration_ms: 0.547458
  type: 'test'
  ...
# Subtest: preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
ok 615 - preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
  ---
  duration_ms: 197.055209
  type: 'test'
  ...
# Subtest: resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
ok 616 - resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
  ---
  duration_ms: 157.417333
  type: 'test'
  ...
# Subtest: buildPrCreatePlan reads pr.md title and builds safe gh args
ok 617 - buildPrCreatePlan reads pr.md title and builds safe gh args
  ---
  duration_ms: 192.603208
  type: 'test'
  ...
# Subtest: buildPrCreatePlan uses remote HEAD as default base when --base is omitted
ok 618 - buildPrCreatePlan uses remote HEAD as default base when --base is omitted
  ---
  duration_ms: 233.338667
  type: 'test'
  ...
# Subtest: formatPrCreateReport prints shell-specific command examples for paths with spaces
ok 619 - formatPrCreateReport prints shell-specific command examples for paths with spaces
  ---
  duration_ms: 0.879167
  type: 'test'
  ...
# Subtest: buildPrCreatePlan refuses PR creation while spec slices are open
ok 620 - buildPrCreatePlan refuses PR creation while spec slices are open
  ---
  duration_ms: 186.361084
  type: 'test'
  ...
# Subtest: runGhPrCreate reports gh pr create failures without merging
ok 621 - runGhPrCreate reports gh pr create failures without merging
  ---
  duration_ms: 0.273
  type: 'test'
  ...
# Subtest: extractPrTitle falls back predictably
ok 622 - extractPrTitle falls back predictably
  ---
  duration_ms: 0.106125
  type: 'test'
  ...
# Subtest: preparePromptTransport defaults to stdin and preserves the prompt text
ok 623 - preparePromptTransport defaults to stdin and preserves the prompt text
  ---
  duration_ms: 2.175583
  type: 'test'
  ...
# Subtest: createTempFilePromptTransport writes a prompt file in a path that may contain spaces
ok 624 - createTempFilePromptTransport writes a prompt file in a path that may contain spaces
  ---
  duration_ms: 1.70925
  type: 'test'
  ...
# Subtest: createStdinPromptTransport is a lightweight wrapper
ok 625 - createStdinPromptTransport is a lightweight wrapper
  ---
  duration_ms: 0.068625
  type: 'test'
  ...
# Subtest: assertSupportedProvider rejects unknown providers with a clear list
ok 626 - assertSupportedProvider rejects unknown providers with a clear list
  ---
  duration_ms: 1.607666
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
ok 627 - resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
  ---
  duration_ms: 0.297833
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
ok 628 - resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
  ---
  duration_ms: 0.4845
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
ok 629 - resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
  ---
  duration_ms: 0.081625
  type: 'test'
  ...
# Subtest: buildProviderInvocation keeps command arguments separate from the prompt
ok 630 - buildProviderInvocation keeps command arguments separate from the prompt
  ---
  duration_ms: 0.313542
  type: 'test'
  ...
# Subtest: buildProviderInvocation adds model args when provider supports model selection
ok 631 - buildProviderInvocation adds model args when provider supports model selection
  ---
  duration_ms: 0.739209
  type: 'test'
  ...
# Subtest: buildProviderInvocation normalizes known display model aliases by default
ok 632 - buildProviderInvocation normalizes known display model aliases by default
  ---
  duration_ms: 0.181833
  type: 'test'
  ...
# Subtest: buildProviderInvocation can block profile display aliases before provider execution
ok 633 - buildProviderInvocation can block profile display aliases before provider execution
  ---
  duration_ms: 0.1335
  type: 'test'
  ...
# Subtest: resolveProviderModelSelection preserves custom models
ok 634 - resolveProviderModelSelection preserves custom models
  ---
  duration_ms: 0.430333
  type: 'test'
  ...
# Subtest: buildProviderModelArgs blocks unsupported enforced model selection
ok 635 - buildProviderModelArgs blocks unsupported enforced model selection
  ---
  duration_ms: 0.408958
  type: 'test'
  ...
# Subtest: preflightProvider reports a missing CLI with an install hint
ok 636 - preflightProvider reports a missing CLI with an install hint
  ---
  duration_ms: 0.513917
  type: 'test'
  ...
# Subtest: runProvider dry-run returns a structured plan without invoking spawn
ok 637 - runProvider dry-run returns a structured plan without invoking spawn
  ---
  duration_ms: 0.405292
  type: 'test'
  ...
# Subtest: runProvider dry-run exposes selected provider model without auth preflight
ok 638 - runProvider dry-run exposes selected provider model without auth preflight
  ---
  duration_ms: 0.250583
  type: 'test'
  ...
# Subtest: runProvider dry-run shows normalized technical model ids
ok 639 - runProvider dry-run shows normalized technical model ids
  ---
  duration_ms: 0.172
  type: 'test'
  ...
# Subtest: runProvider uses an argument array and writes the prompt through stdin
ok 640 - runProvider uses an argument array and writes the prompt through stdin
  ---
  duration_ms: 1.7095
  type: 'test'
  ...
# Subtest: runProvider redacts likely secrets from stdout, stderr, and serialized errors
ok 641 - runProvider redacts likely secrets from stdout, stderr, and serialized errors
  ---
  duration_ms: 0.738667
  type: 'test'
  ...
# Subtest: runProvider times out and terminates a hung provider
ok 642 - runProvider times out and terminates a hung provider
  ---
  duration_ms: 8.137208
  type: 'test'
  ...
# Subtest: provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
ok 643 - provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
  ---
  duration_ms: 12.219584
  type: 'test'
  ...
# Subtest: prompt delivery failures return an explicit pre-payload transport result
ok 644 - prompt delivery failures return an explicit pre-payload transport result
  ---
  duration_ms: 0.494209
  type: 'test'
  ...
# Subtest: runProvider returns structured metadata when preflight fails
ok 645 - runProvider returns structured metadata when preflight fails
  ---
  duration_ms: 0.118875
  type: 'test'
  ...
# Subtest: runProvider prioritizes invalid model errors over secondary provider noise
ok 646 - runProvider prioritizes invalid model errors over secondary provider noise
  ---
  duration_ms: 0.82225
  type: 'test'
  ...
# Subtest: extractProviderErrorCause redacts secrets from surfaced errors
ok 647 - extractProviderErrorCause redacts secrets from surfaced errors
  ---
  duration_ms: 0.192958
  type: 'test'
  ...
# Subtest: review intent classification is explicit and rejects selectable retry or stale targets
ok 648 - review intent classification is explicit and rejects selectable retry or stale targets
  ---
  duration_ms: 4.073417
  type: 'test'
  ...
# Subtest: atomic reservation exhausts fast delivery before a second provider attempt
ok 649 - atomic reservation exhausts fast delivery before a second provider attempt
  ---
  duration_ms: 67.860625
  type: 'test'
  ...
# Subtest: reservation rejects a request snapshot that changed before the atomic commit
ok 650 - reservation rejects a request snapshot that changed before the atomic commit
  ---
  duration_ms: 42.398458
  type: 'test'
  ...
# Subtest: a semantic review may reserve the same envelope again after invalid output when capacity remains
ok 651 - a semantic review may reserve the same envelope again after invalid output when capacity remains
  ---
  duration_ms: 67.5225
  type: 'test'
  ...
# Subtest: a policy change cannot be masked by a stale profile object
ok 652 - a policy change cannot be masked by a stale profile object
  ---
  duration_ms: 29.575292
  type: 'test'
  ...
# Subtest: pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
ok 653 - pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
  ---
  duration_ms: 77.052209
  type: 'test'
  ...
# Subtest: a reviewed candidate cannot be relabeled as a later full review
ok 654 - a reviewed candidate cannot be relabeled as a later full review
  ---
  duration_ms: 43.787042
  type: 'test'
  ...
# Subtest: all counters and human output derive from one canonical event fold
ok 655 - all counters and human output derive from one canonical event fold
  ---
  duration_ms: 1.797166
  type: 'test'
  ...
# Subtest: budget extension is default-deny without mutating the ledger
ok 656 - budget extension is default-deny without mutating the ledger
  ---
  duration_ms: 47.767334
  type: 'test'
  ...
# Subtest: authorized extension preserves policy bytes and ledger audit while increasing only review capacity
ok 657 - authorized extension preserves policy bytes and ledger audit while increasing only review capacity
  ---
  duration_ms: 51.221541
  type: 'test'
  ...
# Subtest: fast delivery permits an explicitly bound local actor to extend budget with an audit label
ok 658 - fast delivery permits an explicitly bound local actor to extend budget with an audit label
  ---
  duration_ms: 55.265166
  type: 'test'
  ...
# Subtest: review budgets are isolated by run and foreign ledger events fail closed
ok 659 - review budgets are isolated by run and foreign ledger events fail closed
  ---
  duration_ms: 80.684042
  type: 'test'
  ...
# Subtest: cross-process reservations cannot overspend one run budget
ok 660 - cross-process reservations cannot overspend one run budget
  ---
  duration_ms: 248.206709
  type: 'test'
  ...
# Subtest: default governance config is valid, secret-free, and merge preserves compatible keys
ok 661 - default governance config is valid, secret-free, and merge preserves compatible keys
  ---
  duration_ms: 8.523583
  type: 'test'
  ...
# Subtest: compatibility metadata is strict, monotonic, and blocks read-only or older writers
ok 662 - compatibility metadata is strict, monotonic, and blocks read-only or older writers
  ---
  duration_ms: 6.681792
  type: 'test'
  ...
# Subtest: versioned disposition, review-event, and decision envelopes are strict
ok 663 - versioned disposition, review-event, and decision envelopes are strict
  ---
  duration_ms: 6.164917
  type: 'test'
  ...
# Subtest: criterion bindings preserve exact UTF-8 content and reject digest drift
ok 664 - criterion bindings preserve exact UTF-8 content and reject digest drift
  ---
  duration_ms: 2.025833
  type: 'test'
  ...
# Subtest: transfer target normalization is canonical and rejects ambiguous short slice ids
ok 665 - transfer target normalization is canonical and rejects ambiguous short slice ids
  ---
  duration_ms: 0.505958
  type: 'test'
  ...
# Subtest: keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
ok 666 - keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
  ---
  duration_ms: 1.708417
  type: 'test'
  ...
# Subtest: legacy run governance state reads additively without inventing decisions
ok 667 - legacy run governance state reads additively without inventing decisions
  ---
  duration_ms: 0.82825
  type: 'test'
  ...
# Subtest: canonical approval records bind and verify their complete decision digest
ok 668 - canonical approval records bind and verify their complete decision digest
  ---
  duration_ms: 5.488875
  type: 'test'
  ...
# Subtest: approval parity distinguishes structured-count drift from binding drift
ok 669 - approval parity distinguishes structured-count drift from binding drift
  ---
  duration_ms: 0.907459
  type: 'test'
  ...
# Subtest: profile and disposition approval digests are deterministic across equivalent ordering
ok 670 - profile and disposition approval digests are deterministic across equivalent ordering
  ---
  duration_ms: 0.903708
  type: 'test'
  ...
# Subtest: approval criteria preserve the raw acceptance collections used for bound counts
ok 671 - approval criteria preserve the raw acceptance collections used for bound counts
  ---
  duration_ms: 0.856709
  type: 'test'
  ...
# Subtest: condition policy is default-deny, uses allow-only union matching, and keeps release denied
ok 672 - condition policy is default-deny, uses allow-only union matching, and keeps release denied
  ---
  duration_ms: 4.236625
  type: 'test'
  ...
# Subtest: condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
ok 673 - condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
  ---
  duration_ms: 1.619541
  type: 'test'
  ...
# Subtest: condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
ok 674 - condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
  ---
  duration_ms: 3.057167
  type: 'test'
  ...
# Subtest: condition disposition replacement is explicit and never becomes current implicitly
ok 675 - condition disposition replacement is explicit and never becomes current implicitly
  ---
  duration_ms: 1.495542
  type: 'test'
  ...
# Subtest: condition eligibility keeps transfer-blocker and final approval authorizations independent
ok 676 - condition eligibility keeps transfer-blocker and final approval authorizations independent
  ---
  duration_ms: 1.30125
  type: 'test'
  ...
# Subtest: conditioned candidates are explicitly non-final publication records
ok 677 - conditioned candidates are explicitly non-final publication records
  ---
  duration_ms: 0.903333
  type: 'test'
  ...
# Subtest: governance config rejects secret-bearing compatible keys
ok 678 - governance config rejects secret-bearing compatible keys
  ---
  duration_ms: 5.615959
  type: 'test'
  ...
# Subtest: governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
ok 679 - governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
  ---
  duration_ms: 4.228834
  type: 'test'
  ...
# Subtest: readGovernanceConfig distinguishes absent namespace from default resolution
ok 680 - readGovernanceConfig distinguishes absent namespace from default resolution
  ---
  duration_ms: 6.039
  type: 'test'
  ...
# Subtest: stable policy digest ignores object key insertion order and excludes a stored digest
ok 681 - stable policy digest ignores object key insertion order and excludes a stored digest
  ---
  duration_ms: 0.166042
  type: 'test'
  ...
# Subtest: profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
ok 682 - profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
  ---
  duration_ms: 2.561625
  type: 'test'
  ...
# Subtest: authorization uses only explicit bindings and defaults to deny
ok 683 - authorization uses only explicit bindings and defaults to deny
  ---
  duration_ms: 0.770209
  type: 'test'
  ...
# Subtest: local actors are labeled and cannot authorize high-assurance mutations
ok 684 - local actors are labeled and cannot authorize high-assurance mutations
  ---
  duration_ms: 0.447833
  type: 'test'
  ...
# Subtest: authorization independence compares the canonical actor bound to provider subjects
ok 685 - authorization independence compares the canonical actor bound to provider subjects
  ---
  duration_ms: 0.183417
  type: 'test'
  ...
# Subtest: authorization selects bindings only by exact provider subject or explicit local actor key
ok 686 - authorization selects bindings only by exact provider subject or explicit local actor key
  ---
  duration_ms: 0.211791
  type: 'test'
  ...
# Subtest: strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
ok 687 - strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
  ---
  duration_ms: 2.642125
  type: 'test'
  ...
# Subtest: strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
ok 688 - strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
  ---
  duration_ms: 3.020125
  type: 'test'
  ...
# Subtest: phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
ok 689 - phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
  ---
  duration_ms: 0.174042
  type: 'test'
  ...
# Subtest: phase-aware projection applies the versioned review policy deterministically to both profiles
ok 690 - phase-aware projection applies the versioned review policy deterministically to both profiles
  ---
  duration_ms: 0.084333
  type: 'test'
  ...
# Subtest: finding fingerprint uses only normalized invariant identity fields
ok 691 - finding fingerprint uses only normalized invariant identity fields
  ---
  duration_ms: 0.285125
  type: 'test'
  ...
# Subtest: reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
ok 692 - reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
  ---
  duration_ms: 6.041375
  type: 'test'
  ...
# Subtest: supersession creates lineage without silently closing the prior finding
ok 693 - supersession creates lineage without silently closing the prior finding
  ---
  duration_ms: 1.069209
  type: 'test'
  ...
# Subtest: reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
ok 694 - reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
  ---
  duration_ms: 1.366042
  type: 'test'
  ...
# Subtest: AI run state can be created, read, updated, and rendered
ok 695 - AI run state can be created, read, updated, and rendered
  ---
  duration_ms: 57.438167
  type: 'test'
  ...
# Subtest: AI run listing fails closed when a run namespace is a symlink
ok 696 - AI run listing fails closed when a run namespace is a symlink
  ---
  duration_ms: 22.251375
  type: 'test'
  ...
# Subtest: AI run phase guard blocks future-phase commands with next-step guidance
ok 697 - AI run phase guard blocks future-phase commands with next-step guidance
  ---
  duration_ms: 30.143666
  type: 'test'
  ...
# Subtest: an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
ok 698 - an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
  ---
  duration_ms: 71.312667
  type: 'test'
  ...
# Subtest: AI run approvals metadata and locks are persisted safely
ok 699 - AI run approvals metadata and locks are persisted safely
  ---
  duration_ms: 37.097125
  type: 'test'
  ...
# Subtest: governed run selection is unambiguous and profile binding cannot downgrade
ok 700 - governed run selection is unambiguous and profile binding cannot downgrade
  ---
  duration_ms: 109.070083
  type: 'test'
  ...
# Subtest: run governance state is correlated and written inside the run lock
ok 701 - run governance state is correlated and written inside the run lock
  ---
  duration_ms: 32.353666
  type: 'test'
  ...
# Subtest: run lock remains held until an asynchronous callback settles
ok 702 - run lock remains held until an asynchronous callback settles
  ---
  duration_ms: 29.007625
  type: 'test'
  ...
# Subtest: run locks normalize aliases and release only the lock instance they own
ok 703 - run locks normalize aliases and release only the lock instance they own
  ---
  duration_ms: 2.401917
  type: 'test'
  ...
# Subtest: governed phase transitions share the run lock with governance commits
ok 704 - governed phase transitions share the run lock with governance commits
  ---
  duration_ms: 27.662083
  type: 'test'
  ...
# Subtest: digest-bound approval commit rolls back every injected write failure without partial state
ok 705 - digest-bound approval commit rolls back every injected write failure without partial state
  ---
  duration_ms: 705.336958
  type: 'test'
  ...
# Subtest: approval WAL makes readers fail closed and recovery rolls back idempotently
ok 706 - approval WAL makes readers fail closed and recovery rolls back idempotently
  ---
  duration_ms: 145.383542
  type: 'test'
  ...
# Subtest: canonical run readers reject copied or foreign run identities
ok 707 - canonical run readers reject copied or foreign run identities
  ---
  duration_ms: 36.363792
  type: 'test'
  ...
# Subtest: approval recovery rejects a validly rehashed WAL with a non-canonical target
ok 708 - approval recovery rejects a validly rehashed WAL with a non-canonical target
  ---
  duration_ms: 71.395583
  type: 'test'
  ...
# Subtest: normal approval commit validates its exact target allowlist before writing the WAL
ok 709 - normal approval commit validates its exact target allowlist before writing the WAL
  ---
  duration_ms: 62.394708
  type: 'test'
  ...
# Subtest: digest-bound approval commit rejects an in-project symlinked run target
ok 710 - digest-bound approval commit rejects an in-project symlinked run target
  ---
  duration_ms: 115.021042
  type: 'test'
  ...
# Subtest: digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
ok 711 - digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
  ---
  duration_ms: 57.270833
  type: 'test'
  ...
# Subtest: digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
ok 712 - digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
  ---
  duration_ms: 193.654875
  type: 'test'
  ...
# Subtest: safety excludes secrets, generated outputs, caches, and ssh material
ok 713 - safety excludes secrets, generated outputs, caches, and ssh material
  ---
  duration_ms: 1.183667
  type: 'test'
  ...
# Subtest: normalizeContextPath handles windows separators and paths with spaces
ok 714 - normalizeContextPath handles windows separators and paths with spaces
  ---
  duration_ms: 0.144375
  type: 'test'
  ...
# Subtest: filterContextPaths keeps safe entries and returns exclusion reasons
ok 715 - filterContextPaths keeps safe entries and returns exclusion reasons
  ---
  duration_ms: 0.743584
  type: 'test'
  ...
# Subtest: prompt safety text establishes instruction hierarchy and repo-data boundary
ok 716 - prompt safety text establishes instruction hierarchy and repo-data boundary
  ---
  duration_ms: 0.091084
  type: 'test'
  ...
# Subtest: parseApprovedManifest falls back to markdown headings when JSON is unavailable
ok 717 - parseApprovedManifest falls back to markdown headings when JSON is unavailable
  ---
  duration_ms: 2.297208
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
ok 718 - buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
  ---
  duration_ms: 2.336
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest preserves every approved implementation slice
ok 719 - buildSpecGenerationManifest preserves every approved implementation slice
  ---
  duration_ms: 0.7425
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
ok 720 - buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
  ---
  duration_ms: 0.391833
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects plans without structured slices
ok 721 - buildSpecGenerationManifest rejects plans without structured slices
  ---
  duration_ms: 0.244625
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
ok 722 - buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
  ---
  duration_ms: 0.88525
  type: 'test'
  ...
# Subtest: generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
ok 723 - generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
  ---
  duration_ms: 23.961791
  type: 'test'
  ...
# Subtest: generateSpecArtifacts fails before writing when structured slices are missing
ok 724 - generateSpecArtifacts fails before writing when structured slices are missing
  ---
  duration_ms: 4.35425
  type: 'test'
  ...
# Subtest: governed spec generation publishes one digest-bound manifest and derives all projections from it
ok 725 - governed spec generation publishes one digest-bound manifest and derives all projections from it
  ---
  duration_ms: 19.273333
  type: 'test'
  ...
# Subtest: governance projections escape marker, newline, and backtick injection without changing the manifest
ok 726 - governance projections escape marker, newline, and backtick injection without changing the manifest
  ---
  duration_ms: 15.090792
  type: 'test'
  ...
# Subtest: criterion binding preserves exact bytes while resolving parser-normalized approved content
ok 727 - criterion binding preserves exact bytes while resolving parser-normalized approved content
  ---
  duration_ms: 1.685292
  type: 'test'
  ...
# Subtest: governance target ambiguity fails before any spec artifact is published
ok 728 - governance target ambiguity fails before any spec artifact is published
  ---
  duration_ms: 3.7705
  type: 'test'
  ...
# Subtest: canonical governance root resolves the primary checkout from a linked worktree
ok 729 - canonical governance root resolves the primary checkout from a linked worktree
  ---
  duration_ms: 204.633417
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
ok 730 - parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
  ---
  duration_ms: 5.140458
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
ok 731 - parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
  ---
  duration_ms: 0.622417
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
ok 732 - parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
  ---
  duration_ms: 0.554125
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
ok 733 - parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
  ---
  duration_ms: 0.351625
  type: 'test'
  ...
# Subtest: repairAnalyzeProjectValue refuses unsafe additional properties
ok 734 - repairAnalyzeProjectValue refuses unsafe additional properties
  ---
  duration_ms: 0.389125
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectRepairManifest writes an auditable run artifact
ok 735 - writeAnalyzeProjectRepairManifest writes an auditable run artifact
  ---
  duration_ms: 8.513584
  type: 'test'
  ...
# Subtest: planner approvals persist draft and approved metadata with status summaries
ok 736 - planner approvals persist draft and approved metadata with status summaries
  ---
  duration_ms: 94.073625
  type: 'test'
  ...
# Subtest: planner approvals keep multiple drafts and only approve the current version
ok 737 - planner approvals keep multiple drafts and only approve the current version
  ---
  duration_ms: 191.851708
  type: 'test'
  ...
# Subtest: legacy planner approval writer rejects approved-with-conditions without creating approved.md
ok 738 - legacy planner approval writer rejects approved-with-conditions without creating approved.md
  ---
  duration_ms: 67.627709
  type: 'test'
  ...
# Subtest: planner approval candidates expose current draft, history, and safe previews
ok 739 - planner approval candidates expose current draft, history, and safe previews
  ---
  duration_ms: 137.377667
  type: 'test'
  ...
# Subtest: planner approvals block unapproved or stale inputs before later phases
ok 740 - planner approvals block unapproved or stale inputs before later phases
  ---
  duration_ms: 301.625458
  type: 'test'
  ...
# Subtest: planner drafts persist exact artifact and input byte digests
ok 741 - planner drafts persist exact artifact and input byte digests
  ---
  duration_ms: 123.174958
  type: 'test'
  ...
# Subtest: digest-bound projection rejects artifact and input tampering without approving
ok 742 - digest-bound projection rejects artifact and input tampering without approving
  ---
  duration_ms: 75.022958
  type: 'test'
  ...
# Subtest: content loss persists a corrupted immutable candidate without replacing current or approval history
ok 743 - content loss persists a corrupted immutable candidate without replacing current or approval history
  ---
  duration_ms: 170.406625
  type: 'test'
  ...
# Subtest: unsupported free text remains inspectable but never becomes current automatically
ok 744 - unsupported free text remains inspectable but never becomes current automatically
  ---
  duration_ms: 83.043417
  type: 'test'
  ...
# Subtest: draft projection journal rolls forward deterministically from every committed crash point
ok 745 - draft projection journal rolls forward deterministically from every committed crash point
  ---
  duration_ms: 631.840209
  type: 'test'
  ...
# Subtest: a crash before journal publication leaves an immutable orphan and unchanged projections
ok 746 - a crash before journal publication leaves an immutable orphan and unchanged projections
  ---
  duration_ms: 80.66775
  type: 'test'
  ...
# Subtest: corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
ok 747 - corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
  ---
  duration_ms: 177.209208
  type: 'test'
  ...
# Subtest: v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
ok 748 - v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
  ---
  duration_ms: 366.374916
  type: 'test'
  ...
# Subtest: draft recovery respects governance read-only mode without changing marker or projections
ok 749 - draft recovery respects governance read-only mode without changing marker or projections
  ---
  duration_ms: 102.611167
  type: 'test'
  ...
# Subtest: project file byte reader rejects path traversal outside the project root
ok 750 - project file byte reader rejects path traversal outside the project root
  ---
  duration_ms: 2.4945
  type: 'test'
  ...
# Subtest: project file byte reader rejects symlinks that resolve outside the project root
ok 751 - project file byte reader rejects symlinks that resolve outside the project root
  ---
  duration_ms: 1.001166
  type: 'test'
  ...
# Subtest: project file byte reader rejects in-project symlink aliases
ok 752 - project file byte reader rejects in-project symlink aliases
  ---
  duration_ms: 0.56075
  type: 'test'
  ...
# Subtest: context selection is deterministic, bounded, explainable, and trust-separated
ok 753 - context selection is deterministic, bounded, explainable, and trust-separated
  ---
  duration_ms: 326.92075
  type: 'test'
  ...
# Subtest: mandatory overflow blocks while optional relevant knowledge is explicitly excluded
ok 754 - mandatory overflow blocks while optional relevant knowledge is explicitly excluded
  ---
  duration_ms: 310.387084
  type: 'test'
  ...
# Subtest: task and Context Manifest schemas reject unknown, unsafe, and forged values
ok 755 - task and Context Manifest schemas reject unknown, unsafe, and forged values
  ---
  duration_ms: 169.87625
  type: 'test'
  ...
# Subtest: context selection fails closed and requests the exact context.read grant
ok 756 - context selection fails closed and requests the exact context.read grant
  ---
  duration_ms: 45.784208
  type: 'test'
  ...
# Subtest: receipt authority is refreshed for every selection and revocation cannot remain trusted
ok 757 - receipt authority is refreshed for every selection and revocation cannot remain trusted
  ---
  duration_ms: 189.082875
  type: 'test'
  ...
# Subtest: invalid selection metadata is never interpreted semantically or promoted by free text
ok 758 - invalid selection metadata is never interpreted semantically or promoted by free text
  ---
  duration_ms: 159.472833
  type: 'test'
  ...
# Subtest: empty Brain initialization is stable and idempotent
ok 759 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 92.295375
  type: 'test'
  ...
# Subtest: protected operations do not lazily recreate an absent Brain
ok 760 - protected operations do not lazily recreate an absent Brain
  ---
  duration_ms: 7.113375
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 761 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 958.450667
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 762 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 210.635833
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 763 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 178.640917
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 764 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 87.806292
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 765 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 37.769333
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 766 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 72.576458
  type: 'test'
  ...
# Subtest: the supported local v58 decision representation binds the exact approved artifact
ok 767 - the supported local v58 decision representation binds the exact approved artifact
  ---
  duration_ms: 0.718083
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 768 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 47.810875
  type: 'test'
  ...
# Subtest: concurrent appends either serialize or return an explicit lock conflict
ok 769 - concurrent appends either serialize or return an explicit lock conflict
  ---
  duration_ms: 119.443833
  type: 'test'
  ...
# Subtest: read-only v58 compatibility blocks every Brain writer before mutation
ok 770 - read-only v58 compatibility blocks every Brain writer before mutation
  ---
  duration_ms: 50.811166
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 771 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 75.304875
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 772 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 47.721708
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 773 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 114.871958
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 774 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 111.874583
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 775 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 104.096709
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 776 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 127.643917
  type: 'test'
  ...
# Subtest: default export is deterministic, complete, portable, and keeps safe record links
ok 777 - default export is deterministic, complete, portable, and keeps safe record links
  ---
  duration_ms: 351.772084
  type: 'test'
  ...
# Subtest: an edited Markdown vault imports only a non-effective proposal
ok 778 - an edited Markdown vault imports only a non-effective proposal
  ---
  duration_ms: 273.786708
  type: 'test'
  ...
# Subtest: proposal bodies cannot grant authority and require the explicit propose grant
ok 779 - proposal bodies cannot grant authority and require the explicit propose grant
  ---
  duration_ms: 52.003834
  type: 'test'
  ...
# Subtest: an interrupted proposal commit recovers without activating proposal records
ok 780 - an interrupted proposal commit recovers without activating proposal records
  ---
  duration_ms: 121.611125
  type: 'test'
  ...
# Subtest: export validates secrets, destinations, references, and symlinks before writes
ok 781 - export validates secrets, destinations, references, and symlinks before writes
  ---
  duration_ms: 128.333291
  type: 'test'
  ...
# Subtest: export revalidates a destination changed to a symlink during authorization
ok 782 - export revalidates a destination changed to a symlink during authorization
  ---
  duration_ms: 50.38025
  type: 'test'
  ...
# Subtest: export stays coherent when the Brain advances during authorization
ok 783 - export stays coherent when the Brain advances during authorization
  ---
  duration_ms: 178.183792
  type: 'test'
  ...
# Subtest: delete dry-run is byte-preserving and real delete quarantines only the Brain
ok 784 - delete dry-run is byte-preserving and real delete quarantines only the Brain
  ---
  duration_ms: 142.143458
  type: 'test'
  ...
# Subtest: complete snapshot is not constrained by the public query limit
ok 785 - complete snapshot is not constrained by the public query limit
  ---
  duration_ms: 1473.065375
  type: 'test'
  ...
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# WARN: No se encontro la base 'develop' como rama local ni como 'origin/develop'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto 'origin'.
# PASS: No se detecto overlap con worktrees activos.
# PASS: Gate validation: slice marcado como completado y con trazabilidad minima.
# Switched to a new branch 'feature/test-slice'
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: Gate execution: metadata y precondiciones minimas OK.
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# Switched to a new branch 'feature/test-slice'
# Switched to a new branch 'feature/test-slice'
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# WARN: No se encontro la base 'develop' como rama local ni como 'origin/develop'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto 'origin'.
# PASS: No se detecto overlap con worktrees activos.
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# WARN: No se encontro la base 'develop' como rama local ni como 'origin/develop'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto 'origin'.
# PASS: No se detecto overlap con worktrees activos.
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# WARN: No se encontro la base 'develop' como rama local ni como 'origin/develop'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto 'origin'.
# PASS: No se detecto overlap con worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# WARN: No se encontro la base 'develop' como rama local ni como 'origin/develop'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto 'origin'.
# PASS: No se detecto overlap con worktrees activos.
# PASS: Gate validation: slice marcado como completado y con trazabilidad minima.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.
# PASS: slice.json declara archivos de alcance.
# PASS: slice.json declara metadata git compatible con start-slice.
# PASS: slice.json declara rutas relativas seguras dentro del proyecto.
# INFO: Modo local: se omite validacion de existencia del slice en origin/develop o develop.
# INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.
# INFO: Modo local: checks ejecutados: spec docs, briefs, metadata git, scope declarado, rutas seguras, dependencias y gate.
# INFO: Modo local: checks omitidos: existencia en base remota/local y overlap contra worktrees activos.
# Switched to a new branch 'feature/test-slice'
# PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.
# PASS: El slice ya existe en origin/main (PR base documental mergeado).
# PASS: No se detecto overlap con worktrees activos.
# PASS: Gate validation: slice marcado como completado y con trazabilidad minima.
# INFO: check-scope base: origin/main (--base).
# PASS: Todos los archivos tocados estan dentro del scope declarado en slice.json.
# PASS: La rama actual coincide con la rama declarada por el slice.
# PASS: El worktree esta limpio.
# PASS: La rama tiene commits propios contra origin/main.
# PASS: pr.md contiene las secciones obligatorias.
# PASS: How to Test incluye entorno, acceso al worktree, arranque, casos de uso y verificacion tecnica.
# PASS: Al menos un caso de uso documentado.
# PASS: Rollback incluye comando git revert.
# Subtest: check-slice passes for a completed slice without optional dependency fields
ok 786 - check-slice passes for a completed slice without optional dependency fields
  ---
  duration_ms: 209.138958
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring remote or base branches
ok 787 - check-slice --local validates structure without requiring remote or base branches
  ---
  duration_ms: 197.782833
  type: 'test'
  ...
# Subtest: check-slice --local renders English output when requested
ok 788 - check-slice --local renders English output when requested
  ---
  duration_ms: 144.112583
  type: 'test'
  ...
# Subtest: check-slice --local rejects missing execution git metadata
ok 789 - check-slice --local rejects missing execution git metadata
  ---
  duration_ms: 84.258625
  type: 'test'
  ...
# Subtest: check-slice --local rejects scope paths outside the project
ok 790 - check-slice --local rejects scope paths outside the project
  ---
  duration_ms: 62.709417
  type: 'test'
  ...
# Subtest: check-slice rejects an external absolute slice path even if it contains specs
ok 791 - check-slice rejects an external absolute slice path even if it contains specs
  ---
  duration_ms: 20.437625
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring a Git repository
ok 792 - check-slice --local validates structure without requiring a Git repository
  ---
  duration_ms: 70.23675
  type: 'test'
  ...
# Subtest: check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
ok 793 - check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
  ---
  duration_ms: 63.5705
  type: 'test'
  ...
# Subtest: check-slice default mode gives local/base guidance when no base exists
ok 794 - check-slice default mode gives local/base guidance when no base exists
  ---
  duration_ms: 177.374792
  type: 'test'
  ...
# Subtest: check-slice supports an explicit local base branch
ok 795 - check-slice supports an explicit local base branch
  ---
  duration_ms: 212.797709
  type: 'test'
  ...
# Subtest: check-pr uses slice base branch instead of hardcoded origin/develop
ok 796 - check-pr uses slice base branch instead of hardcoded origin/develop
  ---
  duration_ms: 334.713125
  type: 'test'
  ...
# Subtest: check-slice rejects missing depends_on targets
ok 797 - check-slice rejects missing depends_on targets
  ---
  duration_ms: 175.953
  type: 'test'
  ...
# Subtest: check-slice rejects cycles introduced by depends_on
ok 798 - check-slice rejects cycles introduced by depends_on
  ---
  duration_ms: 181.492291
  type: 'test'
  ...
# Subtest: check-slice requires a parallel_safe_reason when parallel_safe is never
ok 799 - check-slice requires a parallel_safe_reason when parallel_safe is never
  ---
  duration_ms: 257.798709
  type: 'test'
  ...
# Subtest: check-slice projects governed pending findings from one verified manifest
ok 800 - check-slice projects governed pending findings from one verified manifest
  ---
  duration_ms: 58.593833
  type: 'test'
  ...
# Subtest: check-slice verifies a real manifest self-digest against the primary canonical run store
ok 801 - check-slice verifies a real manifest self-digest against the primary canonical run store
  ---
  duration_ms: 243.178416
  type: 'test'
  ...
# Subtest: check-slice with an explicit run cannot degrade to legacy when the manifest is absent
ok 802 - check-slice with an explicit run cannot degrade to legacy when the manifest is absent
  ---
  duration_ms: 80.577583
  type: 'test'
  ...
# Subtest: a generated manifest declaration prevents legacy downgrade for slices and PRs
ok 803 - a generated manifest declaration prevents legacy downgrade for slices and PRs
  ---
  duration_ms: 73.128834
  type: 'test'
  ...
# Subtest: check-slice rejects stale, unknown, and reordered SPEC traceability projections
ok 804 - check-slice rejects stale, unknown, and reordered SPEC traceability projections
  ---
  duration_ms: 326.947208
  type: 'test'
  ...
# Subtest: check-slice rejects omitted and unknown governed finding projections
ok 805 - check-slice rejects omitted and unknown governed finding projections
  ---
  duration_ms: 118.615708
  type: 'test'
  ...
# Subtest: check-slice rejects canonical governance field drift in execution briefs
ok 806 - check-slice rejects canonical governance field drift in execution briefs
  ---
  duration_ms: 448.30575
  type: 'test'
  ...
# Subtest: check-slice requires the canonical governance heading inside marked blocks
ok 807 - check-slice requires the canonical governance heading inside marked blocks
  ---
  duration_ms: 72.178042
  type: 'test'
  ...
# Subtest: check-slice fails closed when a target finding is neither closed nor accepted
ok 808 - check-slice fails closed when a target finding is neither closed nor accepted
  ---
  duration_ms: 69.959916
  type: 'test'
  ...
# Subtest: check-slice propagates orphaned, stale, and unresolved governance failures
ok 809 - check-slice propagates orphaned, stale, and unresolved governance failures
  ---
  duration_ms: 200.620958
  type: 'test'
  ...
# Subtest: check-pr rejects a governed slice PR that omits its finding block
ok 810 - check-pr rejects a governed slice PR that omits its finding block
  ---
  duration_ms: 324.606375
  type: 'test'
  ...
# Subtest: PR governance readiness rejects canonical field drift with unchanged finding ids
ok 811 - PR governance readiness rejects canonical field drift with unchanged finding ids
  ---
  duration_ms: 2.747833
  type: 'test'
  ...
# Subtest: splitEditorCommand handles quoted commands and arguments
ok 812 - splitEditorCommand handles quoted commands and arguments
  ---
  duration_ms: 1.730541
  type: 'test'
  ...
# Subtest: resolveEditor prefers VISUAL over EDITOR and keeps arguments
ok 813 - resolveEditor prefers VISUAL over EDITOR and keeps arguments
  ---
  duration_ms: 0.444084
  type: 'test'
  ...
# Subtest: resolveEditor falls back to platform editor when env is empty
ok 814 - resolveEditor falls back to platform editor when env is empty
  ---
  duration_ms: 0.31225
  type: 'test'
  ...
# Subtest: defaultEditorForPlatform uses notepad on Windows and vi elsewhere
ok 815 - defaultEditorForPlatform uses notepad on Windows and vi elsewhere
  ---
  duration_ms: 0.149917
  type: 'test'
  ...
# Subtest: openEditor invokes the resolved editor without a shell
ok 816 - openEditor invokes the resolved editor without a shell
  ---
  duration_ms: 0.272708
  type: 'test'
  ...
# Subtest: openEditor reports cancellation for missing or failed editor execution
ok 817 - openEditor reports cancellation for missing or failed editor execution
  ---
  duration_ms: 0.1795
  type: 'test'
  ...
# Subtest: normalizeSelectorOptions keeps labels human-friendly and values stable
ok 818 - normalizeSelectorOptions keeps labels human-friendly and values stable
  ---
  duration_ms: 2.338542
  type: 'test'
  ...
# Subtest: selectOption returns explicit non-interactive choice
ok 819 - selectOption returns explicit non-interactive choice
  ---
  duration_ms: 0.59075
  type: 'test'
  ...
# Subtest: selectOption uses default without prompting in no-TTY mode
ok 820 - selectOption uses default without prompting in no-TTY mode
  ---
  duration_ms: 0.894125
  type: 'test'
  ...
# Subtest: selectOption fails actionably when no default is available outside interactive mode
ok 821 - selectOption fails actionably when no default is available outside interactive mode
  ---
  duration_ms: 0.798292
  type: 'test'
  ...
# Subtest: selectOption uses injected prompt selector only in interactive TTY mode
ok 822 - selectOption uses injected prompt selector only in interactive TTY mode
  ---
  duration_ms: 0.284917
  type: 'test'
  ...
# Subtest: promptText returns explicit values without prompting
ok 823 - promptText returns explicit values without prompting
  ---
  duration_ms: 0.120791
  type: 'test'
  ...
# Subtest: promptText uses injected prompt text in interactive TTY mode
ok 824 - promptText uses injected prompt text in interactive TTY mode
  ---
  duration_ms: 0.137
  type: 'test'
  ...
# Subtest: promptText fails actionably without TTY or explicit value
ok 825 - promptText fails actionably without TTY or explicit value
  ---
  duration_ms: 0.311917
  type: 'test'
  ...
# Subtest: Quiver theme exposes the approved brand color tokens
ok 826 - Quiver theme exposes the approved brand color tokens
  ---
  duration_ms: 1.265375
  type: 'test'
  ...
# Subtest: color output is disabled for machine and unsupported modes
ok 827 - color output is disabled for machine and unsupported modes
  ---
  duration_ms: 0.187541
  type: 'test'
  ...
# Subtest: color output uses ANSI truecolor only for human TTY mode
ok 828 - color output uses ANSI truecolor only for human TTY mode
  ---
  duration_ms: 0.224334
  type: 'test'
  ...
# Subtest: theme falls back to plain ASCII when unicode is unavailable
ok 829 - theme falls back to plain ASCII when unicode is unavailable
  ---
  duration_ms: 0.089334
  type: 'test'
  ...
# Subtest: theme keeps text readable when color is disabled
ok 830 - theme keeps text readable when color is disabled
  ---
  duration_ms: 0.062459
  type: 'test'
  ...
# Subtest: resolveUxMode disables decoration, prompts, and spinners for machine modes
ok 831 - resolveUxMode disables decoration, prompts, and spinners for machine modes
  ---
  duration_ms: 1.076666
  type: 'test'
  ...
# Subtest: resolveUxMode enables prompts only for explicit interactive TTY use
ok 832 - resolveUxMode enables prompts only for explicit interactive TTY use
  ---
  duration_ms: 0.092667
  type: 'test'
  ...
# Subtest: withSpinner uses clack spinner only in human TTY mode
ok 833 - withSpinner uses clack spinner only in human TTY mode
  ---
  duration_ms: 1.58025
  type: 'test'
  ...
# Subtest: withSpinner prints plain text without symbols for no-TTY mode
ok 834 - withSpinner prints plain text without symbols for no-TTY mode
  ---
  duration_ms: 0.119417
  type: 'test'
  ...
# Subtest: JSON mode suppresses UX text output
ok 835 - JSON mode suppresses UX text output
  ---
  duration_ms: 0.178917
  type: 'test'
  ...
# Subtest: human output helpers render branded hierarchy in TTY mode
ok 836 - human output helpers render branded hierarchy in TTY mode
  ---
  duration_ms: 0.2425
  type: 'test'
  ...
# Subtest: human output helpers fall back to plain text in no-TTY mode
ok 837 - human output helpers fall back to plain text in no-TTY mode
  ---
  duration_ms: 0.080417
  type: 'test'
  ...
# Subtest: taskGroup runs real stages and writes checks for non-spinner stages
ok 838 - taskGroup runs real stages and writes checks for non-spinner stages
  ---
  duration_ms: 0.249834
  type: 'test'
  ...
# Subtest: promptConfirm requires explicit interactive TTY mode
ok 839 - promptConfirm requires explicit interactive TTY mode
  ---
  duration_ms: 0.506042
  type: 'test'
  ...
# Subtest: promptConfirm uses injected confirmation in interactive TTY mode
ok 840 - promptConfirm uses injected confirmation in interactive TTY mode
  ---
  duration_ms: 0.321459
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends apply for clean creates
ok 841 - analyze-project apply selector recommends apply for clean creates
  ---
  duration_ms: 0.683791
  type: 'test'
  ...
# Subtest: analyze-project apply selector is disabled in CI even with TTY streams
ok 842 - analyze-project apply selector is disabled in CI even with TTY streams
  ---
  duration_ms: 0.262542
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends diff for dirty updates
ok 843 - analyze-project apply selector recommends diff for dirty updates
  ---
  duration_ms: 0.342167
  type: 'test'
  ...
# Subtest: analyze-project apply diff preview is bounded and marks truncation
ok 844 - analyze-project apply diff preview is bounded and marks truncation
  ---
  duration_ms: 0.132167
  type: 'test'
  ...
# Subtest: collectDashboardReport separates global progress from visible filtered progress
ok 845 - collectDashboardReport separates global progress from visible filtered progress
  ---
  duration_ms: 38.576833
  type: 'test'
  ...
# Subtest: collectDashboardReport includes completed slices only when requested and never leaks evidence values
ok 846 - collectDashboardReport includes completed slices only when requested and never leaks evidence values
  ---
  duration_ms: 12.947167
  type: 'test'
  ...
# Subtest: collectDashboardReport handles zero-slice specs
ok 847 - collectDashboardReport handles zero-slice specs
  ---
  duration_ms: 5.61175
  type: 'test'
  ...
# Subtest: collectDashboardReport reports graph errors without throwing
ok 848 - collectDashboardReport reports graph errors without throwing
  ---
  duration_ms: 11.997416
  type: 'test'
  ...
# Subtest: collectDashboardReport rejects an explicit unknown spec
ok 849 - collectDashboardReport rejects an explicit unknown spec
  ---
  duration_ms: 4.078584
  type: 'test'
  ...
# Subtest: formatHumanDashboard exposes the core dashboard sections
ok 850 - formatHumanDashboard exposes the core dashboard sections
  ---
  duration_ms: 16.064125
  type: 'test'
  ...
# Subtest: formatHumanDashboard keeps large default output compact and actionable
ok 851 - formatHumanDashboard keeps large default output compact and actionable
  ---
  duration_ms: 13.675958
  type: 'test'
  ...
# Subtest: formatHumanDashboard supports details and section views
ok 852 - formatHumanDashboard supports details and section views
  ---
  duration_ms: 15.970125
  type: 'test'
  ...
# Subtest: normalizeDashboardOptions rejects ambiguous or invalid human flags
ok 853 - normalizeDashboardOptions rejects ambiguous or invalid human flags
  ---
  duration_ms: 1.497583
  type: 'test'
  ...
# Subtest: collectLayoutReport detects a new no-spec layout as valid
ok 854 - collectLayoutReport detects a new no-spec layout as valid
  ---
  duration_ms: 9.213375
  type: 'test'
  ...
# Subtest: collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
ok 855 - collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
  ---
  duration_ms: 18.935208
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing tools, auth, and spaced paths
ok 856 - collectEnvironmentWarnings reports missing tools, auth, and spaced paths
  ---
  duration_ms: 1.271375
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing gh with cross-platform guidance
ok 857 - collectEnvironmentWarnings reports missing gh with cross-platform guidance
  ---
  duration_ms: 0.335541
  type: 'test'
  ...
# Subtest: formatActionableError includes failure, impact, fix, and next command
ok 858 - formatActionableError includes failure, impact, fix, and next command
  ---
  duration_ms: 0.135666
  type: 'test'
  ...
# Subtest: draft lifecycle vocabulary is explicit and bounded
ok 859 - draft lifecycle vocabulary is explicit and bounded
  ---
  duration_ms: 1.421583
  type: 'test'
  ...
# Subtest: markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
ok 860 - markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
  ---
  duration_ms: 3.177625
  type: 'test'
  ...
# Subtest: structured extraction supports exact collections, references, and v58 acceptance arrays
ok 861 - structured extraction supports exact collections, references, and v58 acceptance arrays
  ---
  duration_ms: 0.813792
  type: 'test'
  ...
# Subtest: preservation compares structural identity rather than word count
ok 862 - preservation compares structural identity rather than word count
  ---
  duration_ms: 0.264292
  type: 'test'
  ...
# Subtest: missing identity and required collection are diagnosed as corruption
ok 863 - missing identity and required collection are diagnosed as corruption
  ---
  duration_ms: 0.221084
  type: 'test'
  ...
# Subtest: explicit deletion is accepted only when the exact identity and references are removed
ok 864 - explicit deletion is accepted only when the exact identity and references are removed
  ---
  duration_ms: 0.436083
  type: 'test'
  ...
# Subtest: duplicates, broken references, malformed structured content, and free text fail closed
ok 865 - duplicates, broken references, malformed structured content, and free text fail closed
  ---
  duration_ms: 0.352541
  type: 'test'
  ...
# AI plan review saved
# Artifact: .quiver/approvals/plan-review/review.md
# Prompt source: packaged production-readiness plan review template
# Phase: plan-review
# Status: unapproved
# Review: .quiver/approvals/plan-review/review.md
# Source file: .quiver/approvals/technical-plan/drafts/001.md
# Approval recommendation: approve
# Blocking: no
# Required fixes: 0
# Optional hardening: 0
# Next command: npx create-quiver ai approve --phase technical-plan --version 1
# Review budget:
# - Reviews: 1/2
# - Full revisions: 0/1
# - Targeted amendments: 0
# - External reviews: 0
# - Invalid outputs: 0
# - Technical retries: 0
# - Pending reservations: 0
# - Authorized extensions: 0
# Subtest: addenda are immutable, deterministic, parent/input-bound and idempotent
ok 866 - addenda are immutable, deterministic, parent/input-bound and idempotent
  ---
  duration_ms: 323.520708
  type: 'test'
  ...
# Subtest: amendments require explicit removals and reject dangling depends_on before any write
ok 867 - amendments require explicit removals and reject dangling depends_on before any write
  ---
  duration_ms: 135.408375
  type: 'test'
  ...
# Subtest: malformed operations, stale parents, Markdown patching and forged or unverified authority fail closed
ok 868 - malformed operations, stale parents, Markdown patching and forged or unverified authority fail closed
  ---
  duration_ms: 263.161708
  type: 'test'
  ...
# Subtest: lineage verification rejects tamper, missing parents, cycles and duplicate-parent branches
ok 869 - lineage verification rejects tamper, missing parents, cycles and duplicate-parent branches
  ---
  duration_ms: 623.040625
  type: 'test'
  ...
# Subtest: effective-contract store symlinks fail before writing outside the project
ok 870 - effective-contract store symlinks fail before writing outside the project
  ---
  duration_ms: 90.443
  type: 'test'
  ...
# Subtest: runReviewPlan reviews exact effective bytes and separates retry identity from a new semantic revision
ok 871 - runReviewPlan reviews exact effective bytes and separates retry identity from a new semantic revision
  ---
  duration_ms: 717.443917
  type: 'test'
  ...
# Subtest: redactSecrets removes common token and password patterns
ok 872 - redactSecrets removes common token and password patterns
  ---
  duration_ms: 1.818458
  type: 'test'
  ...
# Subtest: truncateText marks long output without changing short output
ok 873 - truncateText marks long output without changing short output
  ---
  duration_ms: 2.599959
  type: 'test'
  ...
# Subtest: defaultEvidencePath writes under .quiver evidence
ok 874 - defaultEvidencePath writes under .quiver evidence
  ---
  duration_ms: 1.23025
  type: 'test'
  ...
# Subtest: runEvidenceCommand records redacted and truncated output
ok 875 - runEvidenceCommand records redacted and truncated output
  ---
  duration_ms: 4.850958
  type: 'test'
  ...
# Subtest: runEvidenceCommand rejects traversal output before spawning child
ok 876 - runEvidenceCommand rejects traversal output before spawning child
  ---
  duration_ms: 1.808334
  type: 'test'
  ...
# Subtest: evidence path policy rejects symlink output and read escapes
ok 877 - evidence path policy rejects symlink output and read escapes
  ---
  duration_ms: 2.439875
  type: 'test'
  ...
# Subtest: runEvidenceCommand records signal metadata and signal exit code
ok 878 - runEvidenceCommand records signal metadata and signal exit code
  ---
  duration_ms: 0.836125
  type: 'test'
  ...
# Subtest: listEvidenceFiles and showEvidenceFile return parseable safe records
ok 879 - listEvidenceFiles and showEvidenceFile return parseable safe records
  ---
  duration_ms: 1.819084
  type: 'test'
  ...
# Subtest: withWindowsLongPaths enables core.longpaths on Windows git commands
ok 880 - withWindowsLongPaths enables core.longpaths on Windows git commands
  ---
  duration_ms: 1.257833
  type: 'test'
  ...
# Subtest: withWindowsLongPaths leaves non-Windows git commands unchanged
ok 881 - withWindowsLongPaths leaves non-Windows git commands unchanged
  ---
  duration_ms: 0.069333
  type: 'test'
  ...
# Subtest: base branch candidates keep explicit override before all defaults
ok 882 - base branch candidates keep explicit override before all defaults
  ---
  duration_ms: 88.607125
  type: 'test'
  ...
# Subtest: base branch resolution uses remote HEAD when available
ok 883 - base branch resolution uses remote HEAD when available
  ---
  duration_ms: 198.256833
  type: 'test'
  ...
# Subtest: base branch resolution falls back to local main, master, then develop
ok 884 - base branch resolution falls back to local main, master, then develop
  ---
  duration_ms: 251.477209
  type: 'test'
  ...
# Subtest: check-handoff keeps validating the legacy spec handoff contract
ok 885 - check-handoff keeps validating the legacy spec handoff contract
  ---
  duration_ms: 2.73625
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice execution briefs
ok 886 - check-handoff validates per-slice execution briefs
  ---
  duration_ms: 1.925
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice closure briefs
ok 887 - check-handoff validates per-slice closure briefs
  ---
  duration_ms: 1.294375
  type: 'test'
  ...
# Subtest: check-handoff rejects incomplete per-slice execution briefs with an actionable error
ok 888 - check-handoff rejects incomplete per-slice execution briefs with an actionable error
  ---
  duration_ms: 2.389959
  type: 'test'
  ...
# Subtest: check-handoff renders Spanish missing-section guidance when requested
ok 889 - check-handoff renders Spanish missing-section guidance when requested
  ---
  duration_ms: 3.511958
  type: 'test'
  ...
# Subtest: catalogs expose supported languages and version metadata
ok 890 - catalogs expose supported languages and version metadata
  ---
  duration_ms: 0.774708
  type: 'test'
  ...
# Subtest: catalog completeness is enforced across en and es
ok 891 - catalog completeness is enforced across en and es
  ---
  duration_ms: 8.917167
  type: 'test'
  ...
# Subtest: translate supports interpolation and predictable missing params
ok 892 - translate supports interpolation and predictable missing params
  ---
  duration_ms: 0.442375
  type: 'test'
  ...
# Subtest: translate sanitizes unsafe interpolation values
ok 893 - translate sanitizes unsafe interpolation values
  ---
  duration_ms: 0.08025
  type: 'test'
  ...
# Subtest: translate supports one and other plural forms
ok 894 - translate supports one and other plural forms
  ---
  duration_ms: 0.333292
  type: 'test'
  ...
# Subtest: fallback to en is explicit and deterministic
ok 895 - fallback to en is explicit and deterministic
  ---
  duration_ms: 0.125792
  type: 'test'
  ...
# Subtest: translator keeps command snippets and flags exact
ok 896 - translator keeps command snippets and flags exact
  ---
  duration_ms: 0.118208
  type: 'test'
  ...
# Subtest: normalizes supported language and locale values
ok 897 - normalizes supported language and locale values
  ---
  duration_ms: 0.803792
  type: 'test'
  ...
# Subtest: resolves language by approved precedence order
ok 898 - resolves language by approved precedence order
  ---
  duration_ms: 5.915791
  type: 'test'
  ...
# Subtest: uses global config when project config is missing
ok 899 - uses global config when project config is missing
  ---
  duration_ms: 0.937167
  type: 'test'
  ...
# Subtest: uses locale detection before default fallback
ok 900 - uses locale detection before default fallback
  ---
  duration_ms: 0.577333
  type: 'test'
  ...
# Subtest: unsupported explicit language falls back to en with actionable warning
ok 901 - unsupported explicit language falls back to en with actionable warning
  ---
  duration_ms: 0.787125
  type: 'test'
  ...
# Subtest: language config writes preserve existing keys and reject unsupported persisted values
ok 902 - language config writes preserve existing keys and reject unsupported persisted values
  ---
  duration_ms: 1.047417
  type: 'test'
  ...
# Subtest: extracts global --lang before or after command names
ok 903 - extracts global --lang before or after command names
  ---
  duration_ms: 0.239167
  type: 'test'
  ...
# Subtest: template paths normalize safely
ok 904 - template paths normalize safely
  ---
  duration_ms: 1.210458
  type: 'test'
  ...
# Subtest: human template classification excludes machine artifacts
ok 905 - human template classification excludes machine artifacts
  ---
  duration_ms: 0.155333
  type: 'test'
  ...
# Subtest: localized template convention inserts language before .template
ok 906 - localized template convention inserts language before .template
  ---
  duration_ms: 0.165
  type: 'test'
  ...
# Subtest: template language resolution uses project config and explicit overrides
ok 907 - template language resolution uses project config and explicit overrides
  ---
  duration_ms: 1.989042
  type: 'test'
  ...
# Subtest: localized human templates resolve by language and fall back explicitly to en
ok 908 - localized human templates resolve by language and fall back explicitly to en
  ---
  duration_ms: 2.121166
  type: 'test'
  ...
# Subtest: machine artifacts are never routed through localized human templates
ok 909 - machine artifacts are never routed through localized human templates
  ---
  duration_ms: 0.838667
  type: 'test'
  ...
# Subtest: localized template coverage reports missing human templates and skips machine artifacts
ok 910 - localized template coverage reports missing human templates and skips machine artifacts
  ---
  duration_ms: 9.064375
  type: 'test'
  ...
# /bin/sh: npm: No such file or directory
# Subtest: migration blocks compatibility evidence drift before its first project write
ok 911 - migration blocks compatibility evidence drift before its first project write
  ---
  duration_ms: 149.076625
  type: 'test'
  ...
# Subtest: legacy migration blocks declared older dependency drift before its first project write
ok 912 - legacy migration blocks declared older dependency drift before its first project write
  ---
  duration_ms: 85.9825
  type: 'test'
  ...
# Subtest: detectPackageManager returns npm when no lockfile exists
ok 913 - detectPackageManager returns npm when no lockfile exists
  ---
  duration_ms: 0.280333
  type: 'test'
  ...
# Subtest: detectPackageManager returns yarn when yarn.lock exists
ok 914 - detectPackageManager returns yarn when yarn.lock exists
  ---
  duration_ms: 0.302166
  type: 'test'
  ...
# Subtest: detectPackageManager returns pnpm when pnpm-lock.yaml exists
ok 915 - detectPackageManager returns pnpm when pnpm-lock.yaml exists
  ---
  duration_ms: 0.374292
  type: 'test'
  ...
# Subtest: detectPackageManager returns bun when bun.lockb exists
ok 916 - detectPackageManager returns bun when bun.lockb exists
  ---
  duration_ms: 0.297458
  type: 'test'
  ...
# Subtest: detectPackageManager prefers bun over pnpm over yarn over npm
ok 917 - detectPackageManager prefers bun over pnpm over yarn over npm
  ---
  duration_ms: 0.49875
  type: 'test'
  ...
# Subtest: formatInstallSelfCommand respects detected package managers
ok 918 - formatInstallSelfCommand respects detected package managers
  ---
  duration_ms: 1.036875
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-no-package-json when no package.json
ok 919 - installSelfAsDevDep returns skipped-no-package-json when no package.json
  ---
  duration_ms: 0.392583
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
ok 920 - installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
  ---
  duration_ms: 0.762791
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns failed when install command fails
ok 921 - installSelfAsDevDep returns failed when install command fails
  ---
  duration_ms: 7.624875
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes legacy scripts and exports templates only when requested
ok 922 - initializeProjectDocs writes legacy scripts and exports templates only when requested
  ---
  duration_ms: 89.3695
  type: 'test'
  ...
# Subtest: initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
ok 923 - initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
  ---
  duration_ms: 204.275458
  type: 'test'
  ...
# Subtest: initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
ok 924 - initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
  ---
  duration_ms: 215.2
  type: 'test'
  ...
# Subtest: initializeProjectDocs fails closed without overwriting invalid governance config
ok 925 - initializeProjectDocs fails closed without overwriting invalid governance config
  ---
  duration_ms: 13.082167
  type: 'test'
  ...
# Subtest: resolveInitProfile selects default, minimal, and full profiles
ok 926 - resolveInitProfile selects default, minimal, and full profiles
  ---
  duration_ms: 1.403417
  type: 'test'
  ...
# Subtest: normalizeInitLayoutOptions rejects mutually exclusive profiles
ok 927 - normalizeInitLayoutOptions rejects mutually exclusive profiles
  ---
  duration_ms: 0.253666
  type: 'test'
  ...
# Subtest: buildInitLayout creates a default AI-first plan without legacy visible roots
ok 928 - buildInitLayout creates a default AI-first plan without legacy visible roots
  ---
  duration_ms: 4.587458
  type: 'test'
  ...
# Subtest: buildInitLayout reports preserved files instead of overwriting them
ok 929 - buildInitLayout reports preserved files instead of overwriting them
  ---
  duration_ms: 8.846
  type: 'test'
  ...
# Subtest: buildInitLayout includes compatibility assets for full profile
ok 930 - buildInitLayout includes compatibility assets for full profile
  ---
  duration_ms: 0.995792
  type: 'test'
  ...
# Subtest: buildInitLayout includes optional legacy scripts and template export only when requested
ok 931 - buildInitLayout includes optional legacy scripts and template export only when requested
  ---
  duration_ms: 2.390959
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan prints core dry-run sections
ok 932 - formatInitLayoutPlan prints core dry-run sections
  ---
  duration_ms: 0.612208
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan reports planned language config writes
ok 933 - formatInitLayoutPlan reports planned language config writes
  ---
  duration_ms: 0.783667
  type: 'test'
  ...
# Subtest: default generated package scripts target supported CLI commands
ok 934 - default generated package scripts target supported CLI commands
  ---
  duration_ms: 1.47125
  type: 'test'
  ...
# Subtest: stripJsonComments preserves comment-like markers inside strings
ok 935 - stripJsonComments preserves comment-like markers inside strings
  ---
  duration_ms: 2.140292
  type: 'test'
  ...
# Subtest: stripJsonComments removes comments outside strings
ok 936 - stripJsonComments removes comments outside strings
  ---
  duration_ms: 1.04075
  type: 'test'
  ...
# WARN: intentional bootstrap for a draft slice.
# WARN: intentional bootstrap for a draft slice.
# Wrote docs/ai/ACTIVE_SLICE.md
# Slice ready to work.
# Alias: QUI-05
# Spec: quiver-v22-guided-ai-workflow
# Slice: slice-05-spec-worktree-lifecycle
# Ticket: QUIVER-22-05
# Branch type: feature
# Base: main
# Slug: spec-worktree-lifecycle
# Branch: feature/QUIVER-22-05-spec-worktree-lifecycle
# Worktree: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-4jJhDQ/feature-QUIVER-22-05-spec-worktree-lifecycle
# Context: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-4jJhDQ/feature-QUIVER-22-05-spec-worktree-lifecycle/WORKTREE_CONTEXT.md
# Subtest: startSpecWorktree creates and reuses a spec worktree on main
ok 937 - startSpecWorktree creates and reuses a spec worktree on main
  ---
  duration_ms: 463.618625
  type: 'test'
  ...
# Subtest: startSpecWorktree dry-run reports planned worktree without creating it
ok 938 - startSpecWorktree dry-run reports planned worktree without creating it
  ---
  duration_ms: 241.232625
  type: 'test'
  ...
# Subtest: startSpecWorktree supports develop as the base branch
ok 939 - startSpecWorktree supports develop as the base branch
  ---
  duration_ms: 324.949333
  type: 'test'
  ...
# Subtest: startSpecWorktree refuses to reuse a dirty existing worktree
ok 940 - startSpecWorktree refuses to reuse a dirty existing worktree
  ---
  duration_ms: 386.672208
  type: 'test'
  ...
# Subtest: startSpecWorktree reports a stale registered worktree with recovery steps
ok 941 - startSpecWorktree reports a stale registered worktree with recovery steps
  ---
  duration_ms: 241.307708
  type: 'test'
  ...
# Subtest: startSpecWorktree rejects concurrent spec operations with a lock
ok 942 - startSpecWorktree rejects concurrent spec operations with a lock
  ---
  duration_ms: 112.345625
  type: 'test'
  ...
# Subtest: startSlice refuses to create nested worktrees from an existing worktree
ok 943 - startSlice refuses to create nested worktrees from an existing worktree
  ---
  duration_ms: 244.474292
  type: 'test'
  ...
# Subtest: startSlice renders English lifecycle output when requested
ok 944 - startSlice renders English lifecycle output when requested
  ---
  duration_ms: 215.422459
  type: 'test'
  ...
# Subtest: cleanupSlice dry-run renders English lifecycle output when requested
ok 945 - cleanupSlice dry-run renders English lifecycle output when requested
  ---
  duration_ms: 237.11425
  type: 'test'
  ...
# Subtest: describeSpecState reports slice-00 status and pending slices
ok 946 - describeSpecState reports slice-00 status and pending slices
  ---
  duration_ms: 98.668
  type: 'test'
  ...
# Subtest: ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
ok 947 - ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
  ---
  duration_ms: 77.6055
  type: 'test'
  ...
# Subtest: startSlice blocks later slices until slice-00 is completed
ok 948 - startSlice blocks later slices until slice-00 is completed
  ---
  duration_ms: 110.64625
  type: 'test'
  ...
# Subtest: model catalog exposes versioned providers and required model entries
ok 949 - model catalog exposes versioned providers and required model entries
  ---
  duration_ms: 1.5815
  type: 'test'
  ...
# Subtest: model aliases are case-insensitive and tolerant of spaces and dashes
ok 950 - model aliases are case-insensitive and tolerant of spaces and dashes
  ---
  duration_ms: 0.295833
  type: 'test'
  ...
# Subtest: model catalog sorts known models by requested role and includes custom choice
ok 951 - model catalog sorts known models by requested role and includes custom choice
  ---
  duration_ms: 0.127125
  type: 'test'
  ...
# Subtest: custom model resolution remains allowed but marked as custom
ok 952 - custom model resolution remains allowed but marked as custom
  ---
  duration_ms: 0.2755
  type: 'test'
  ...
# Subtest: ambiguous aliases are reported without selecting a model
ok 953 - ambiguous aliases are reported without selecting a model
  ---
  duration_ms: 0.159416
  type: 'test'
  ...
# Subtest: normalizeTarballPath and stripPackagePrefix support tarball entries
ok 954 - normalizeTarballPath and stripPackagePrefix support tarball entries
  ---
  duration_ms: 1.195333
  type: 'test'
  ...
# Subtest: collectPackageSafetyViolations flags sensitive local files in package tarball paths
ok 955 - collectPackageSafetyViolations flags sensitive local files in package tarball paths
  ---
  duration_ms: 1.446542
  type: 'test'
  ...
# Subtest: assertPackageSafety passes safe tarball paths
ok 956 - assertPackageSafety passes safe tarball paths
  ---
  duration_ms: 0.19275
  type: 'test'
  ...
# Subtest: assertPackageSafety fails with a clear code when unsafe tarball paths are present
ok 957 - assertPackageSafety fails with a clear code when unsafe tarball paths are present
  ---
  duration_ms: 0.486708
  type: 'test'
  ...
# Subtest: toPosixPath normalizes explicit Windows separators
ok 958 - toPosixPath normalizes explicit Windows separators
  ---
  duration_ms: 0.935583
  type: 'test'
  ...
# Subtest: relativePosixPath handles Git Bash drive paths on Windows
ok 959 - relativePosixPath handles Git Bash drive paths on Windows
  ---
  duration_ms: 0.357708
  type: 'test'
  ...
# Subtest: relativePosixPath handles extended Windows path prefixes
ok 960 - relativePosixPath handles extended Windows path prefixes
  ---
  duration_ms: 0.08
  type: 'test'
  ...
# Subtest: isPathInsideRoot accepts equivalent Windows realpath aliases
ok 961 - isPathInsideRoot accepts equivalent Windows realpath aliases
  ---
  duration_ms: 1.212541
  type: 'test'
  ...
# Subtest: isPathInsideRoot rejects targets that realpath outside the root
ok 962 - isPathInsideRoot rejects targets that realpath outside the root
  ---
  duration_ms: 0.140959
  type: 'test'
  ...
# Subtest: normalizeGitBashDrivePath leaves non-Windows path libs untouched
ok 963 - normalizeGitBashDrivePath leaves non-Windows path libs untouched
  ---
  duration_ms: 0.23375
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs paths from absolute Windows paths
ok 964 - specRelativePathFromPath extracts specs paths from absolute Windows paths
  ---
  duration_ms: 0.22575
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs-fix paths from Git Bash paths
ok 965 - specRelativePathFromPath extracts specs-fix paths from Git Bash paths
  ---
  duration_ms: 0.126
  type: 'test'
  ...
# Subtest: specRelativePathFromPath returns empty string when no spec family exists
ok 966 - specRelativePathFromPath returns empty string when no spec family exists
  ---
  duration_ms: 0.417541
  type: 'test'
  ...
# Subtest: validateProjectRelativePath rejects absolute and traversal paths
ok 967 - validateProjectRelativePath rejects absolute and traversal paths
  ---
  duration_ms: 0.624875
  type: 'test'
  ...
# Subtest: writeProjectScanJson writes the current internal scan path
ok 968 - writeProjectScanJson writes the current internal scan path
  ---
  duration_ms: 2.662084
  type: 'test'
  ...
# Subtest: readProjectScanArtifact prefers current scan over legacy scan
ok 969 - readProjectScanArtifact prefers current scan over legacy scan
  ---
  duration_ms: 3.966917
  type: 'test'
  ...
# Subtest: readProjectScanArtifact falls back to legacy scan path
ok 970 - readProjectScanArtifact falls back to legacy scan path
  ---
  duration_ms: 2.901417
  type: 'test'
  ...
# Subtest: context pack metadata reports current or legacy scan source when repoRoot is provided
ok 971 - context pack metadata reports current or legacy scan source when repoRoot is provided
  ---
  duration_ms: 2.519667
  type: 'test'
  ...
# Subtest: readProjectScanStatus reports source and missing visible map state
ok 972 - readProjectScanStatus reports source and missing visible map state
  ---
  duration_ms: 3.542959
  type: 'test'
  ...
# Subtest: normalizes statuses through the canonical catalogs
ok 973 - normalizes statuses through the canonical catalogs
  ---
  duration_ms: 2.172959
  type: 'test'
  ...
# Subtest: resolver keeps scoped reads away from unrelated invalid historical specs
ok 974 - resolver keeps scoped reads away from unrelated invalid historical specs
  ---
  duration_ms: 6.750917
  type: 'test'
  ...
# Subtest: plan and AI export consume the same resolver state for completed slices
ok 975 - plan and AI export consume the same resolver state for completed slices
  ---
  duration_ms: 32.5845
  type: 'test'
  ...
# Subtest: active slice reconciliation blocks conflicting active sources
ok 976 - active slice reconciliation blocks conflicting active sources
  ---
  duration_ms: 26.871666
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes replacing a missing active doc from board state
ok 977 - active slice reconciliation proposes replacing a missing active doc from board state
  ---
  duration_ms: 13.999417
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes closing completed active slice state
ok 978 - active slice reconciliation proposes closing completed active slice state
  ---
  duration_ms: 7.868875
  type: 'test'
  ...
# Subtest: quiverInternalPaths centralizes internal paths
ok 979 - quiverInternalPaths centralizes internal paths
  ---
  duration_ms: 0.677584
  type: 'test'
  ...
# Subtest: buildQuiverInternalGitignore ignores runtime-only folders
ok 980 - buildQuiverInternalGitignore ignores runtime-only folders
  ---
  duration_ms: 0.203708
  type: 'test'
  ...
# Subtest: buildQuiverConfig documents internal and visible artifact paths
ok 981 - buildQuiverConfig documents internal and visible artifact paths
  ---
  duration_ms: 0.649958
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes internal config and gitignore using explicit template root
ok 982 - initializeProjectDocs writes internal config and gitignore using explicit template root
  ---
  duration_ms: 83.125792
  type: 'test'
  ...
# Subtest: renderDotGraph emits valid DOT source with nodes and edges
ok 983 - renderDotGraph emits valid DOT source with nodes and edges
  ---
  duration_ms: 13.335958
  type: 'test'
  ...
# Subtest: renderMermaidGraph emits a fenced flowchart with nodes and edges
ok 984 - renderMermaidGraph emits a fenced flowchart with nodes and edges
  ---
  duration_ms: 12.470292
  type: 'test'
  ...
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Subtest: parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
ok 985 - parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
  ---
  duration_ms: 1.533584
  type: 'test'
  ...
# Subtest: validateScopeSnapshot reports only files changed after the before snapshot
ok 986 - validateScopeSnapshot reports only files changed after the before snapshot
  ---
  duration_ms: 0.477417
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports simple glob write scopes
ok 987 - validateScopeSnapshot supports simple glob write scopes
  ---
  duration_ms: 0.810375
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
ok 988 - validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
  ---
  duration_ms: 0.240792
  type: 'test'
  ...
# Subtest: checkScope uses slice git.base_branch instead of hardcoded develop
ok 989 - checkScope uses slice git.base_branch instead of hardcoded develop
  ---
  duration_ms: 245.264875
  type: 'test'
  ...
# Subtest: checkScope respects an explicit base branch before slice git.base_branch
ok 990 - checkScope respects an explicit base branch before slice git.base_branch
  ---
  duration_ms: 197.41125
  type: 'test'
  ...
# Subtest: readAllSlices returns an empty array for an empty repo
ok 991 - readAllSlices returns an empty array for an empty repo
  ---
  duration_ms: 2.081666
  type: 'test'
  ...
# Subtest: readAllSlices reads real slices from the current repo
ok 992 - readAllSlices reads real slices from the current repo
  ---
  duration_ms: 61.2055
  type: 'test'
  ...
# Subtest: inferDependencies honors explicit dependencies and heuristic overlap
ok 993 - inferDependencies honors explicit dependencies and heuristic overlap
  ---
  duration_ms: 17.897916
  type: 'test'
  ...
# Subtest: readAllSlices uses allowed_write_paths as write scope when present
ok 994 - readAllSlices uses allowed_write_paths as write scope when present
  ---
  duration_ms: 2.263583
  type: 'test'
  ...
# Subtest: buildGraph and topoSort preserve explicit cross-spec order
ok 995 - buildGraph and topoSort preserve explicit cross-spec order
  ---
  duration_ms: 4.883542
  type: 'test'
  ...
# Subtest: topoSort throws a typed error with the full cycle path
ok 996 - topoSort throws a typed error with the full cycle path
  ---
  duration_ms: 3.433833
  type: 'test'
  ...
# Subtest: computeLevels puts disjoint slices in the same level and detects conflicts
ok 997 - computeLevels puts disjoint slices in the same level and detects conflicts
  ---
  duration_ms: 3.981875
  type: 'test'
  ...
# Subtest: buildGraph drops legacy bare spec-name deps and produces zero edges
ok 998 - buildGraph drops legacy bare spec-name deps and produces zero edges
  ---
  duration_ms: 2.002
  type: 'test'
  ...
# Subtest: buildGraph drops slash deps whose second segment is not a slice-id (regression)
ok 999 - buildGraph drops slash deps whose second segment is not a slice-id (regression)
  ---
  duration_ms: 1.613208
  type: 'test'
  ...
# Subtest: buildGraph preserves depends_on with full spec/slice-id format (regression)
ok 1000 - buildGraph preserves depends_on with full spec/slice-id format (regression)
  ---
  duration_ms: 3.718917
  type: 'test'
  ...
# Subtest: normalizeDeclaredDependencies expands bare slice ids within the same spec
ok 1001 - normalizeDeclaredDependencies expands bare slice ids within the same spec
  ---
  duration_ms: 0.124625
  type: 'test'
  ...
# Subtest: foundation slice helpers recognize slice-00 ids
ok 1002 - foundation slice helpers recognize slice-00 ids
  ---
  duration_ms: 0.056
  type: 'test'
  ...
# Subtest: templateRootExists validates a minimal Quiver template root
ok 1003 - templateRootExists validates a minimal Quiver template root
  ---
  duration_ms: 2.979416
  type: 'test'
  ...
# Subtest: resolveTemplateRoot prefers packaged templates by default
ok 1004 - resolveTemplateRoot prefers packaged templates by default
  ---
  duration_ms: 3.780708
  type: 'test'
  ...
# Subtest: resolveTemplateRoot can prefer exported templates when requested
ok 1005 - resolveTemplateRoot can prefer exported templates when requested
  ---
  duration_ms: 2.728458
  type: 'test'
  ...
# Subtest: resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
ok 1006 - resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
  ---
  duration_ms: 1.238958
  type: 'test'
  ...
# Subtest: resolveTemplatePath returns the concrete template file path
ok 1007 - resolveTemplatePath returns the concrete template file path
  ---
  duration_ms: 2.792083
  type: 'test'
  ...
# Subtest: resolveTemplateRoot reports every searched location when templates are missing
ok 1008 - resolveTemplateRoot reports every searched location when templates are missing
  ---
  duration_ms: 0.65
  type: 'test'
  ...
# Subtest: collectVersionReport works outside an initialized project
ok 1009 - collectVersionReport works outside an initialized project
  ---
  duration_ms: 2.679333
  type: 'test'
  ...
# Subtest: detectPackageManager uses package.json before lockfiles and env
ok 1010 - detectPackageManager uses package.json before lockfiles and env
  ---
  duration_ms: 3.15475
  type: 'test'
  ...
# Subtest: formatHumanVersionReport is readable without color and fits the banner budget
ok 1011 - formatHumanVersionReport is readable without color and fits the banner budget
  ---
  duration_ms: 1.844084
  type: 'test'
  ...
# Subtest: formatHumanVersionReport uses Quiver palette when color is enabled
ok 1012 - formatHumanVersionReport uses Quiver palette when color is enabled
  ---
  duration_ms: 1.075959
  type: 'test'
  ...
# Subtest: slice schema is declared as JSON Schema Draft-07
ok 1013 - slice schema is declared as JSON Schema Draft-07
  ---
  duration_ms: 1.140916
  type: 'test'
  ...
# Subtest: slice schema validates real runtime-valid fixtures and rejects invalid fixtures
ok 1014 - slice schema validates real runtime-valid fixtures and rejects invalid fixtures
  ---
  duration_ms: 131.633208
  type: 'test'
  ...
1..1014
# tests 1014
# suites 0
# pass 1014
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 100085.206041

````

## Stderr

````text

````
