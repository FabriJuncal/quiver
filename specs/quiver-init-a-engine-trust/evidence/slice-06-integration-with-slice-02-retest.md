# Quiver Evidence

- Command: `/opt/homebrew/Cellar/node@22/22.22.2_2/bin/node scripts/ci/run-node-tests.js`
- Exit code: 0
- Duration ms: 97653
- Started at: 2026-09-13T00:24:50.807Z
- Finished at: 2026-09-13T00:26:28.461Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: extractUnreleasedSection returns only the current unreleased body
ok 1 - extractUnreleasedSection returns only the current unreleased body
  ---
  duration_ms: 1.579792
  type: 'test'
  ...
# Subtest: collectUnreleasedEntries reads categorized changelog bullets
ok 2 - collectUnreleasedEntries reads categorized changelog bullets
  ---
  duration_ms: 1.256542
  type: 'test'
  ...
# Subtest: runChangelogCheck requires an unreleased section with entries
ok 3 - runChangelogCheck requires an unreleased section with entries
  ---
  duration_ms: 2.7785
  type: 'test'
  ...
# Subtest: ai agent set, list, and show persist reusable profile settings
ok 4 - ai agent set, list, and show persist reusable profile settings
  ---
  duration_ms: 636.4365
  type: 'test'
  ...
# Subtest: ai agent supports named planner profiles and default selection
ok 5 - ai agent supports named planner profiles and default selection
  ---
  duration_ms: 849.542666
  type: 'test'
  ...
# Subtest: ai agent set --dry-run previews the profile without writing state
ok 6 - ai agent set --dry-run previews the profile without writing state
  ---
  duration_ms: 216.18325
  type: 'test'
  ...
# Subtest: ai agent commands render Spanish human output while preserving profile state
ok 7 - ai agent commands render Spanish human output while preserving profile state
  ---
  duration_ms: 755.534167
  type: 'test'
  ...
# Subtest: ai agent supports doctor profiles and rejects researcher profiles
ok 8 - ai agent supports doctor profiles and rejects researcher profiles
  ---
  duration_ms: 615.983834
  type: 'test'
  ...
# Subtest: ai agent rejects unsupported providers with guidance
ok 9 - ai agent rejects unsupported providers with guidance
  ---
  duration_ms: 193.933458
  type: 'test'
  ...
# Subtest: ai agent show reports missing profile with actionable guidance
ok 10 - ai agent show reports missing profile with actionable guidance
  ---
  duration_ms: 197.422125
  type: 'test'
  ...
# Subtest: ai agent actionable errors render Spanish wrappers while preserving commands
ok 11 - ai agent actionable errors render Spanish wrappers while preserving commands
  ---
  duration_ms: 440.611167
  type: 'test'
  ...
# Subtest: ai onboard uses planner profile provider when provider is not explicit
ok 12 - ai onboard uses planner profile provider when provider is not explicit
  ---
  duration_ms: 412.066333
  type: 'test'
  ...
# Subtest: ai onboard can select a named planner profile for provider and model
ok 13 - ai onboard can select a named planner profile for provider and model
  ---
  duration_ms: 606.606125
  type: 'test'
  ...
# Subtest: ai agent set requires provider and model when prompts are unavailable
ok 14 - ai agent set requires provider and model when prompts are unavailable
  ---
  duration_ms: 203.059584
  type: 'test'
  ...
# Subtest: ai agent interactive set resolves provider and catalog model selections
ok 15 - ai agent interactive set resolves provider and catalog model selections
  ---
  duration_ms: 5.364166
  type: 'test'
  ...
# Subtest: ai agent interactive set can create an additional named profile
ok 16 - ai agent interactive set can create an additional named profile
  ---
  duration_ms: 181.862583
  type: 'test'
  ...
# Subtest: ai agent interactive set supports custom model id and display name
ok 17 - ai agent interactive set supports custom model id and display name
  ---
  duration_ms: 1.637
  type: 'test'
  ...
# Subtest: ai agent doctor reports profile errors and warnings as JSON
ok 18 - ai agent doctor reports profile errors and warnings as JSON
  ---
  duration_ms: 468.941792
  type: 'test'
  ...
# Subtest: ai agent doctor human output uses checks and suggested fixes sections
ok 19 - ai agent doctor human output uses checks and suggested fixes sections
  ---
  duration_ms: 577.903666
  type: 'test'
  ...
# Subtest: ai agent repair --dry-run previews alias normalization without writing
ok 20 - ai agent repair --dry-run previews alias normalization without writing
  ---
  duration_ms: 245.213584
  type: 'test'
  ...
# Subtest: ai agent repair without dry-run refuses to write
ok 21 - ai agent repair without dry-run refuses to write
  ---
  duration_ms: 215.482917
  type: 'test'
  ...
# Subtest: runAnalyzeProject executes provider and applies validated docs by default
ok 22 - runAnalyzeProject executes provider and applies validated docs by default
  ---
  duration_ms: 80.042958
  type: 'test'
  ...
# Subtest: runAnalyzeProject default auto-apply preserves existing docs with managed block
ok 23 - runAnalyzeProject default auto-apply preserves existing docs with managed block
  ---
  duration_ms: 24.168208
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
ok 24 - runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
  ---
  duration_ms: 23.425416
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal --json emits clean parseable proposal result
ok 25 - runAnalyzeProject --save-proposal --json emits clean parseable proposal result
  ---
  duration_ms: 13.6965
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows human TTY progress during live provider execution
ok 26 - runAnalyzeProject shows human TTY progress during live provider execution
  ---
  duration_ms: 16.124209
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows linear progress without TTY during live provider execution
ok 27 - runAnalyzeProject shows linear progress without TTY during live provider execution
  ---
  duration_ms: 57.392417
  type: 'test'
  ...
# Subtest: runAnalyzeProject --dry-run does not call provider
ok 28 - runAnalyzeProject --dry-run does not call provider
  ---
  duration_ms: 1.635458
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid provider JSON without writing final docs
ok 29 - runAnalyzeProject rejects invalid provider JSON without writing final docs
  ---
  duration_ms: 11.094292
  type: 'test'
  ...
# Subtest: runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
ok 30 - runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
  ---
  duration_ms: 20.617292
  type: 'test'
  ...
# Subtest: runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
ok 31 - runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
  ---
  duration_ms: 13.143375
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
ok 32 - runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
  ---
  duration_ms: 18.628334
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
ok 33 - runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
  ---
  duration_ms: 19.731666
  type: 'test'
  ...
# Subtest: runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
ok 34 - runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
  ---
  duration_ms: 45.549042
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
ok 35 - runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
  ---
  duration_ms: 43.74425
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
ok 36 - runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
  ---
  duration_ms: 8.320292
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
ok 37 - runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
  ---
  duration_ms: 17.956458
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects truncated-json provider fixture without writing final docs
ok 38 - runAnalyzeProject rejects truncated-json provider fixture without writing final docs
  ---
  duration_ms: 20.098375
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
ok 39 - runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
  ---
  duration_ms: 8.838958
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
ok 40 - runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
  ---
  duration_ms: 19.013625
  type: 'test'
  ...
# Subtest: runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
ok 41 - runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
  ---
  duration_ms: 21.31125
  type: 'test'
  ...
# Subtest: provider retry fixtures define recoverable and exhausted attempt sequences
ok 42 - provider retry fixtures define recoverable and exhausted attempt sequences
  ---
  duration_ms: 1.501583
  type: 'test'
  ...
# Subtest: runAnalyzeProject retries retryable schema drift once and succeeds
ok 43 - runAnalyzeProject retries retryable schema drift once and succeeds
  ---
  duration_ms: 31.246208
  type: 'test'
  ...
# Subtest: runAnalyzeProject fails safely after default retry exhaustion
ok 44 - runAnalyzeProject fails safely after default retry exhaustion
  ---
  duration_ms: 12.9325
  type: 'test'
  ...
# Subtest: runAnalyzeProject caps retries at two even when configured higher
ok 45 - runAnalyzeProject caps retries at two even when configured higher
  ---
  duration_ms: 7.509875
  type: 'test'
  ...
# Subtest: runAnalyzeProject reports provider schema issues with actionable detail
ok 46 - runAnalyzeProject reports provider schema issues with actionable detail
  ---
  duration_ms: 21.328458
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects provider failure without writing final docs
ok 47 - runAnalyzeProject rejects provider failure without writing final docs
  ---
  duration_ms: 9.1895
  type: 'test'
  ...
# Subtest: ai analyze-project --review writes approved docs with snapshot manifest
ok 48 - ai analyze-project --review writes approved docs with snapshot manifest
  ---
  duration_ms: 104.155166
  type: 'test'
  ...
# Subtest: ai analyze-project review cancellation writes nothing
ok 49 - ai analyze-project review cancellation writes nothing
  ---
  duration_ms: 17.231459
  type: 'test'
  ...
# Subtest: ai analyze-project review confirmation decline writes nothing
ok 50 - ai analyze-project review confirmation decline writes nothing
  ---
  duration_ms: 18.603791
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects no-TTY review without writing
ok 51 - ai analyze-project --review rejects no-TTY review without writing
  ---
  duration_ms: 7.392833
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects invalid edited proposal without writing
ok 52 - ai analyze-project --review rejects invalid edited proposal without writing
  ---
  duration_ms: 10.353417
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
ok 53 - ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
  ---
  duration_ms: 59.677916
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
ok 54 - ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
  ---
  duration_ms: 8.702083
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
ok 55 - ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
  ---
  duration_ms: 32.190708
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run applies a saved proposal without executing provider
ok 56 - ai analyze-project apply --run applies a saved proposal without executing provider
  ---
  duration_ms: 26.97575
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
ok 57 - ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
  ---
  duration_ms: 18.68925
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks stale saved proposals before writing
ok 58 - ai analyze-project apply --run blocks stale saved proposals before writing
  ---
  duration_ms: 32.7495
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run accepts revalidated manual proposal edits and records them
ok 59 - ai analyze-project apply --run accepts revalidated manual proposal edits and records them
  ---
  duration_ms: 14.27875
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
ok 60 - ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
  ---
  duration_ms: 6.494666
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs without TTY fails before provider
ok 61 - ai analyze-project --apply-docs without TTY fails before provider
  ---
  duration_ms: 4.334375
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY cancel writes no final docs
ok 62 - ai analyze-project --apply-docs TTY cancel writes no final docs
  ---
  duration_ms: 15.92275
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY save proposal writes artifacts only
ok 63 - ai analyze-project --apply-docs TTY save proposal writes artifacts only
  ---
  duration_ms: 13.231458
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY view diff requires second decision
ok 64 - ai analyze-project --apply-docs TTY view diff requires second decision
  ---
  duration_ms: 12.400583
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY edit reuses review flow
ok 65 - ai analyze-project --apply-docs TTY edit reuses review flow
  ---
  duration_ms: 33.291291
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY apply writes docs through apply engine
ok 66 - ai analyze-project --apply-docs TTY apply writes docs through apply engine
  ---
  duration_ms: 9.648666
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY renders Spanish selector copy
ok 67 - ai analyze-project --apply-docs TTY renders Spanish selector copy
  ---
  duration_ms: 13.077041
  type: 'test'
  ...
# Subtest: ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
ok 68 - ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
  ---
  duration_ms: 279.974917
  type: 'test'
  ...
# Subtest: ai analyze-project --json emits clean machine-readable output
ok 69 - ai analyze-project --json emits clean machine-readable output
  ---
  duration_ms: 243.75725
  type: 'test'
  ...
# Subtest: ai analyze-project rejects analysis flags on other ai subcommands
ok 70 - ai analyze-project rejects analysis flags on other ai subcommands
  ---
  duration_ms: 220.890792
  type: 'test'
  ...
# Subtest: ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
ok 71 - ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
  ---
  duration_ms: 668.714417
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
ok 72 - ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
  ---
  duration_ms: 1174.920208
  type: 'test'
  ...
# Subtest: ai analyze-project --review remains a supported UX flag at CLI boundary
ok 73 - ai analyze-project --review remains a supported UX flag at CLI boundary
  ---
  duration_ms: 221.35
  type: 'test'
  ...
# Subtest: compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
ok 74 - compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer
  ---
  duration_ms: 318.52
  type: 'test'
  ...
# Subtest: run-owned selection rejects a foreign run canonical input without any projection write
ok 75 - run-owned selection rejects a foreign run canonical input without any projection write
  ---
  duration_ms: 145.23775
  type: 'test'
  ...
# Subtest: run-owned acceptance selection requires canonical input path identity, not equal bytes
ok 76 - run-owned acceptance selection requires canonical input path identity, not equal bytes
  ---
  duration_ms: 134.923042
  type: 'test'
  ...
# Subtest: digest-bound save never infers a latest run from equal requirement bytes
ok 77 - digest-bound save never infers a latest run from equal requirement bytes
  ---
  duration_ms: 74.309208
  type: 'test'
  ...
# Subtest: restore recovers the valid predecessor of a corrupted last candidate without erasing either version
ok 78 - restore recovers the valid predecessor of a corrupted last candidate without erasing either version
  ---
  duration_ms: 99.659375
  type: 'test'
  ...
# Subtest: unsupported acknowledgement can select bytes but remains unverified and unapprovable
ok 79 - unsupported acknowledgement can select bytes but remains unverified and unapprovable
  ---
  duration_ms: 63.9965
  type: 'test'
  ...
# AI execute-plan completed
# Slices executed: 2
# Subtest: ai execute-plan CLI dry-run prints commands without calling providers
ok 80 - ai execute-plan CLI dry-run prints commands without calling providers
  ---
  duration_ms: 251.064791
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run supports manual mode
ok 81 - ai execute-plan CLI dry-run supports manual mode
  ---
  duration_ms: 216.523667
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
ok 82 - ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
  ---
  duration_ms: 212.083917
  type: 'test'
  ...
# Subtest: ai execute-plan CLI JSON exposes downstream wave and scope metadata
ok 83 - ai execute-plan CLI JSON exposes downstream wave and scope metadata
  ---
  duration_ms: 216.577709
  type: 'test'
  ...
# Subtest: runExecutePlan executes slices with commit enabled and stops on failure
ok 84 - runExecutePlan executes slices with commit enabled and stops on failure
  ---
  duration_ms: 7.150125
  type: 'test'
  ...
# Subtest: runExecutePlan requires --commit for real execution
ok 85 - runExecutePlan requires --commit for real execution
  ---
  duration_ms: 5.507084
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
ok 86 - runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
  ---
  duration_ms: 560.362625
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode rejects a concurrent run lock
ok 87 - runExecutePlan delegated mode rejects a concurrent run lock
  ---
  duration_ms: 152.832708
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run prints executor context and does not call provider
ok 88 - ai execute-slice CLI dry-run prints executor context and does not call provider
  ---
  duration_ms: 233.458167
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run shows opt-in commit mode
ok 89 - ai execute-slice CLI dry-run shows opt-in commit mode
  ---
  duration_ms: 224.354375
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run normalizes CLI display model aliases
ok 90 - ai execute-slice CLI dry-run normalizes CLI display model aliases
  ---
  duration_ms: 217.464292
  type: 'test'
  ...
# Subtest: ai execute-slice blocks legacy profile display aliases before provider execution
ok 91 - ai execute-slice blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 10.149417
  type: 'test'
  ...
# Subtest: ai prompt-slice CLI prints a minimal manual executor prompt
ok 92 - ai prompt-slice CLI prints a minimal manual executor prompt
  ---
  duration_ms: 204.302334
  type: 'test'
  ...
# Subtest: ai execute-slice dry-run renders Spanish wrapper without translating paths
ok 93 - ai execute-slice dry-run renders Spanish wrapper without translating paths
  ---
  duration_ms: 224.752791
  type: 'test'
  ...
# Subtest: ai execute-slice requires --slice
ok 94 - ai execute-slice requires --slice
  ---
  duration_ms: 0.642833
  type: 'test'
  ...
# Subtest: ai inspect, export, specs, slices, and trace expose lifecycle state
ok 95 - ai inspect, export, specs, slices, and trace expose lifecycle state
  ---
  duration_ms: 1961.965417
  type: 'test'
  ...
# Subtest: ai inspection commands render Spanish human output without localizing JSON
ok 96 - ai inspection commands render Spanish human output without localizing JSON
  ---
  duration_ms: 1335.935291
  type: 'test'
  ...
# Subtest: ai export rejects unsupported formats with a clear error
ok 97 - ai export rejects unsupported formats with a clear error
  ---
  duration_ms: 215.997458
  type: 'test'
  ...
# Subtest: ai export JSON writes parseable JSON to stdout and diagnostics to stderr
ok 98 - ai export JSON writes parseable JSON to stdout and diagnostics to stderr
  ---
  duration_ms: 491.448542
  type: 'test'
  ...
# Subtest: ai active-slice reconcile dry-run reports conflicts without writing files
ok 99 - ai active-slice reconcile dry-run reports conflicts without writing files
  ---
  duration_ms: 251.486125
  type: 'test'
  ...
# Subtest: ai active-slice reconcile requires dry-run before writes exist
ok 100 - ai active-slice reconcile requires dry-run before writes exist
  ---
  duration_ms: 225.880458
  type: 'test'
  ...
# Subtest: ai models list groups models by provider in human output
ok 101 - ai models list groups models by provider in human output
  ---
  duration_ms: 203.535375
  type: 'test'
  ...
# Subtest: ai models list filters by provider
ok 102 - ai models list filters by provider
  ---
  duration_ms: 210.031792
  type: 'test'
  ...
# Subtest: ai models list --json emits clean parseable catalog metadata
ok 103 - ai models list --json emits clean parseable catalog metadata
  ---
  duration_ms: 214.438292
  type: 'test'
  ...
# Subtest: ai models list localizes Spanish human output without changing JSON
ok 104 - ai models list localizes Spanish human output without changing JSON
  ---
  duration_ms: 405.756209
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters with guidance
ok 105 - ai models list rejects unsupported provider filters with guidance
  ---
  duration_ms: 280.452583
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters in Spanish
ok 106 - ai models list rejects unsupported provider filters in Spanish
  ---
  duration_ms: 212.231708
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
# AI prepare-context write plan
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Planned writes: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260522T120000Z
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260522T120000Z
# Subtest: ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
ok 107 - ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
  ---
  duration_ms: 231.248625
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run supports Spanish human output without translating commands
ok 108 - ai onboard CLI dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 231.389167
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run reads the configured project language by default
ok 109 - ai onboard CLI dry-run reads the configured project language by default
  ---
  duration_ms: 225.264875
  type: 'test'
  ...
# Subtest: ai onboard print-prompt prints the exact prompt without invoking provider auth
ok 110 - ai onboard print-prompt prints the exact prompt without invoking provider auth
  ---
  duration_ms: 290.548333
  type: 'test'
  ...
# Subtest: ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
ok 111 - ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
  ---
  duration_ms: 6.186917
  type: 'test'
  ...
# Subtest: ai onboard surfaces provider failures with actionable context
ok 112 - ai onboard surfaces provider failures with actionable context
  ---
  duration_ms: 1.635083
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
ok 113 - ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
  ---
  duration_ms: 253.464458
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run supports Spanish human output without translating paths
ok 114 - ai prepare-context dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 201.985834
  type: 'test'
  ...
# Subtest: ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
ok 115 - ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
  ---
  duration_ms: 214.4135
  type: 'test'
  ...
# Subtest: ai prepare-context writes docs-only drafts and keeps product code untouched
ok 116 - ai prepare-context writes docs-only drafts and keeps product code untouched
  ---
  duration_ms: 44.167042
  type: 'test'
  ...
# Subtest: ai prepare-context preserves human-authored docs and snapshots before updating
ok 117 - ai prepare-context preserves human-authored docs and snapshots before updating
  ---
  duration_ms: 40.634
  type: 'test'
  ...
# Subtest: ai prepare-context reports contradictions between project map and current root signals
ok 118 - ai prepare-context reports contradictions between project map and current root signals
  ---
  duration_ms: 206.174
  type: 'test'
  ...
# Subtest: ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
ok 119 - ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
  ---
  duration_ms: 8.398375
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
  duration_ms: 663.633958
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
ok 121 - ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
  ---
  duration_ms: 545.939875
  type: 'test'
  ...
# Subtest: ai plan print-prompt localizes wrappers but keeps provider prompt body stable
ok 122 - ai plan print-prompt localizes wrappers but keeps provider prompt body stable
  ---
  duration_ms: 433.297417
  type: 'test'
  ...
# Subtest: ai review-plan dry-run renders Spanish wrapper fields without changing draft path
ok 123 - ai review-plan dry-run renders Spanish wrapper fields without changing draft path
  ---
  duration_ms: 244.897792
  type: 'test'
  ...
# Subtest: ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
ok 124 - ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
  ---
  duration_ms: 560.09525
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects unapproved technical-plan input
ok 125 - ai plan spec phase rejects unapproved technical-plan input
  ---
  duration_ms: 217.975167
  type: 'test'
  ...
# Subtest: ai approve dry-run and missing-version guidance render Spanish wrappers
ok 126 - ai approve dry-run and missing-version guidance render Spanish wrappers
  ---
  duration_ms: 493.906375
  type: 'test'
  ...
# \# Reviewed acceptance
# - AC-01 Edited criterion.
# [?25l
# │
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
  duration_ms: 266.853542
  type: 'test'
  ...
# Subtest: ai plan accepts UX flags in dry-run without changing planner draft behavior
ok 128 - ai plan accepts UX flags in dry-run without changing planner draft behavior
  ---
  duration_ms: 217.68575
  type: 'test'
  ...
# Subtest: ai plan --review lets a human edit the provider draft before saving
ok 129 - ai plan --review lets a human edit the provider draft before saving
  ---
  duration_ms: 66.895291
  type: 'test'
  ...
# Subtest: ai plan --interactive can decline saving the provider draft
ok 130 - ai plan --interactive can decline saving the provider draft
  ---
  duration_ms: 15.604625
  type: 'test'
  ...
# Subtest: ai plan print-prompt renders acceptance prompt without provider auth
ok 131 - ai plan print-prompt renders acceptance prompt without provider auth
  ---
  duration_ms: 199.418542
  type: 'test'
  ...
# Subtest: ai plan acceptance persists a draft approval state
ok 132 - ai plan acceptance persists a draft approval state
  ---
  duration_ms: 70.003709
  type: 'test'
  ...
# Subtest: ai plan redacts likely secrets before saving provider output drafts
ok 133 - ai plan redacts likely secrets before saving provider output drafts
  ---
  duration_ms: 71.284958
  type: 'test'
  ...
# Subtest: ai plan stores clean drafts and separates redacted raw provider logs
ok 134 - ai plan stores clean drafts and separates redacted raw provider logs
  ---
  duration_ms: 67.41275
  type: 'test'
  ...
# Subtest: ai plan prints clean provider output without raw prompt echo or stderr logs
ok 135 - ai plan prints clean provider output without raw prompt echo or stderr logs
  ---
  duration_ms: 70.397041
  type: 'test'
  ...
# Subtest: ai approve only approves the current draft version
ok 136 - ai approve only approves the current draft version
  ---
  duration_ms: 795.983666
  type: 'test'
  ...
# Subtest: ai approve requires a version and rejects direct input files
ok 137 - ai approve requires a version and rejects direct input files
  ---
  duration_ms: 466.065625
  type: 'test'
  ...
# Subtest: ai revise creates a new draft version without approving the phase
ok 138 - ai revise creates a new draft version without approving the phase
  ---
  duration_ms: 397.750417
  type: 'test'
  ...
# Subtest: ai revise compacts oversized feedback before provider execution
ok 139 - ai revise compacts oversized feedback before provider execution
  ---
  duration_ms: 153.777542
  type: 'test'
  ...
# Subtest: ai plan rejects oversized prompts before provider execution
ok 140 - ai plan rejects oversized prompts before provider execution
  ---
  duration_ms: 0.841584
  type: 'test'
  ...
# Subtest: ai revise technical-plan includes approved acceptance, current draft, and feedback
ok 141 - ai revise technical-plan includes approved acceptance, current draft, and feedback
  ---
  duration_ms: 458.768667
  type: 'test'
  ...
# Subtest: governed technical-plan revise keeps acceptance and draft input isolated to the selected run
ok 142 - governed technical-plan revise keeps acceptance and draft input isolated to the selected run
  ---
  duration_ms: 435.395333
  type: 'test'
  ...
# Subtest: ai revise requires an existing draft
ok 143 - ai revise requires an existing draft
  ---
  duration_ms: 0.753875
  type: 'test'
  ...
# Subtest: ai revise rejects missing input values for acceptance and technical-plan before provider execution
ok 144 - ai revise rejects missing input values for acceptance and technical-plan before provider execution
  ---
  duration_ms: 510.071666
  type: 'test'
  ...
# Subtest: ai revise rejects nonexistent feedback files and accidental extra arguments
ok 145 - ai revise rejects nonexistent feedback files and accidental extra arguments
  ---
  duration_ms: 599.748875
  type: 'test'
  ...
# Subtest: ai plan shows human TTY progress during live provider execution
ok 146 - ai plan shows human TTY progress during live provider execution
  ---
  duration_ms: 67.772292
  type: 'test'
  ...
# Subtest: ai plan dry-run does not show provider progress
ok 147 - ai plan dry-run does not show provider progress
  ---
  duration_ms: 0.80825
  type: 'test'
  ...
# Subtest: ai approve writes an approved acceptance artifact with metadata
ok 148 - ai approve writes an approved acceptance artifact with metadata
  ---
  duration_ms: 345.339875
  type: 'test'
  ...
# Subtest: governed ai approve CLI publishes one digest-bound acceptance decision atomically
ok 149 - governed ai approve CLI publishes one digest-bound acceptance decision atomically
  ---
  duration_ms: 787.184042
  type: 'test'
  ...
# Subtest: digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
ok 150 - digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
  ---
  duration_ms: 235.155958
  type: 'test'
  ...
# Subtest: digest-bound acceptance rejects a requirement path redirected to another run
ok 151 - digest-bound acceptance rejects a requirement path redirected to another run
  ---
  duration_ms: 146.788666
  type: 'test'
  ...
# Subtest: governed review WAL rejects secrets hidden in canonical authorization evidence
ok 152 - governed review WAL rejects secrets hidden in canonical authorization evidence
  ---
  duration_ms: 334.741417
  type: 'test'
  ...
# Subtest: digest-bound approval rechecks policy after asynchronous actor resolution
ok 153 - digest-bound approval rechecks policy after asynchronous actor resolution
  ---
  duration_ms: 120.135958
  type: 'test'
  ...
# Subtest: conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
ok 154 - conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
  ---
  duration_ms: 1649.736083
  type: 'test'
  ...
# Subtest: ai approvals prints draft and approved status
ok 155 - ai approvals prints draft and approved status
  ---
  duration_ms: 579.821
  type: 'test'
  ...
# Subtest: ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
ok 156 - ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
  ---
  duration_ms: 370.903875
  type: 'test'
  ...
# Subtest: ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
ok 157 - ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
  ---
  duration_ms: 148.206584
  type: 'test'
  ...
# Subtest: ai repair-plan shows human TTY progress during live provider execution
ok 158 - ai repair-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 132.076209
  type: 'test'
  ...
# Subtest: ai repair-plan dry-run previews repair without mutating approval state
ok 159 - ai repair-plan dry-run previews repair without mutating approval state
  ---
  duration_ms: 286.822042
  type: 'test'
  ...
# Subtest: ai plan technical-plan uses approved acceptance by default and rejects drafts
ok 160 - ai plan technical-plan uses approved acceptance by default and rejects drafts
  ---
  duration_ms: 647.514666
  type: 'test'
  ...
# Subtest: ai plan fails with a clear missing-input error
ok 161 - ai plan fails with a clear missing-input error
  ---
  duration_ms: 236.153375
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run reports spec generation instead of provider invocation
ok 162 - ai plan spec phase dry-run reports spec generation instead of provider invocation
  ---
  duration_ms: 582.371875
  type: 'test'
  ...
# Subtest: ai plan surfaces provider failures with phase context
ok 163 - ai plan surfaces provider failures with phase context
  ---
  duration_ms: 0.909583
  type: 'test'
  ...
# GitHub pr dry-run
# Remote: upstream
# Branch: feature/ai-pr-preflight
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/ai-pr-preflight --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-SMPHn0/specs/demo/pr.md
# SSH host alias: github-work
# Identity file: /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-SMPHn0/ssh/github-work
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-SMPHn0/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-SMPHn0/specs/demo/pr.md
# No PR will be created in dry-run mode.
# GitHub pr dry-run
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Edited PR
# Command: gh pr create --base main --head feature/demo --title "Edited PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-kB2x5y/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-kB2x5y/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-kB2x5y/specs/demo/pr.md
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
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-vqrHNn/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-vqrHNn/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-vqrHNn/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# GitHub pr created
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-dVJJ3H/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-dVJJ3H/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-dVJJ3H/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# Subtest: ai pr dry-run forwards git and ssh options to the GitHub preflight
ok 164 - ai pr dry-run forwards git and ssh options to the GitHub preflight
  ---
  duration_ms: 83.524625
  type: 'test'
  ...
# Subtest: ai doctor annotates GitHub preflight failures
ok 165 - ai doctor annotates GitHub preflight failures
  ---
  duration_ms: 0.387542
  type: 'test'
  ...
# Subtest: ai pr json emits one machine report without human prose
ok 166 - ai pr json emits one machine report without human prose
  ---
  duration_ms: 78.805667
  type: 'test'
  ...
# Subtest: ai pr with an explicit run rejects an ungoverned PR surface
ok 167 - ai pr with an explicit run rejects an ungoverned PR surface
  ---
  duration_ms: 75.498291
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run wires through the new router and avoids opening a PR
ok 168 - ai pr CLI dry-run wires through the new router and avoids opening a PR
  ---
  duration_ms: 1222.9775
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run renders Spanish wrappers while preserving gh command
ok 169 - ai pr CLI dry-run renders Spanish wrappers while preserving gh command
  ---
  duration_ms: 913.779125
  type: 'test'
  ...
# Subtest: ai pr --review lets a human edit pr.md before the PR plan is built
ok 170 - ai pr --review lets a human edit pr.md before the PR plan is built
  ---
  duration_ms: 164.98875
  type: 'test'
  ...
# Subtest: ai pr --interactive can decline PR creation before gh runs
ok 171 - ai pr --interactive can decline PR creation before gh runs
  ---
  duration_ms: 77.310083
  type: 'test'
  ...
# Subtest: ai pr create runs gh pr create with pr.md after preflight
ok 172 - ai pr create runs gh pr create with pr.md after preflight
  ---
  duration_ms: 63.698792
  type: 'test'
  ...
# Subtest: ai pr create shows TTY progress for preflight and gh creation
ok 173 - ai pr create shows TTY progress for preflight and gh creation
  ---
  duration_ms: 62.033375
  type: 'test'
  ...
# Subtest: ai pr revalidates governed PR evidence after editor changes
ok 174 - ai pr revalidates governed PR evidence after editor changes
  ---
  duration_ms: 105.692667
  type: 'test'
  ...
# Subtest: ai pr revalidates canonical parity immediately before gh create
ok 175 - ai pr revalidates canonical parity immediately before gh create
  ---
  duration_ms: 49.604792
  type: 'test'
  ...
# Subtest: ai pr fails closed when a PR-phase finding is neither closed nor accepted
ok 176 - ai pr fails closed when a PR-phase finding is neither closed nor accepted
  ---
  duration_ms: 58.271375
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
# AI prepare-context write plan
# Mode: live
# Project: planner-write-demo
# Project slug: planner-write-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
# AI prepare-context write plan
# Mode: live
# Project: planner-review-edit
# Project slug: planner-review-edit
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
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
# Snapshot: .quiver/runs/run-2026-09-13t00-24-54z/snapshots/20260913T002454Z
# [?25l
# │
# ◇  Agent finished
# [?25h
# Subtest: ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
ok 177 - ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
  ---
  duration_ms: 195.25825
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
ok 178 - ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
  ---
  duration_ms: 202.376541
  type: 'test'
  ...
# Subtest: ai prepare-context blocks legacy profile display aliases before provider execution
ok 179 - ai prepare-context blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 9.038125
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
ok 180 - ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
  ---
  duration_ms: 186.116084
  type: 'test'
  ...
# Subtest: planner prepare-context shows human TTY progress with selected profile name
ok 181 - planner prepare-context shows human TTY progress with selected profile name
  ---
  duration_ms: 38.232958
  type: 'test'
  ...
# Subtest: planner prepare-context stops progress spinner on provider failure
ok 182 - planner prepare-context stops progress spinner on provider failure
  ---
  duration_ms: 2.022334
  type: 'test'
  ...
# Subtest: planner prepare-context writes validated docs-only proposal and snapshots before writes
ok 183 - planner prepare-context writes validated docs-only proposal and snapshots before writes
  ---
  duration_ms: 26.611459
  type: 'test'
  ...
# Subtest: provider failure during planner prepare-context writes no docs
ok 184 - provider failure during planner prepare-context writes no docs
  ---
  duration_ms: 6.046542
  type: 'test'
  ...
# Subtest: invalid planner output writes no docs
ok 185 - invalid planner output writes no docs
  ---
  duration_ms: 4.564
  type: 'test'
  ...
# Subtest: review cancellation leaves docs untouched
ok 186 - review cancellation leaves docs untouched
  ---
  duration_ms: 7.166542
  type: 'test'
  ...
# Subtest: review flow revalidates edited proposal before writing docs
ok 187 - review flow revalidates edited proposal before writing docs
  ---
  duration_ms: 26.879542
  type: 'test'
  ...
# Subtest: interactive planner approval can decline without writes
ok 188 - interactive planner approval can decline without writes
  ---
  duration_ms: 20.574
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
# Timestamp: 2026-09-13T00:24:56.614Z
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
# Timestamp: 2026-09-13T00:25:02.757Z
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
# Timestamp: 2026-09-13T00:25:04.754Z
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
  duration_ms: 252.482542
  type: 'test'
  ...
# Subtest: ai review-plan print-prompt renders review prompt without provider auth
ok 190 - ai review-plan print-prompt renders review prompt without provider auth
  ---
  duration_ms: 245.405
  type: 'test'
  ...
# Subtest: ai review-plan rejects missing technical-plan draft
ok 191 - ai review-plan rejects missing technical-plan draft
  ---
  duration_ms: 199.497
  type: 'test'
  ...
# Subtest: ai review-plan persists review state and becomes valid after approving the reviewed draft
ok 192 - ai review-plan persists review state and becomes valid after approving the reviewed draft
  ---
  duration_ms: 653.498416
  type: 'test'
  ...
# Subtest: governed review preserves the last valid state and omission does not close an open blocker
ok 193 - governed review preserves the last valid state and omission does not close an open blocker
  ---
  duration_ms: 485.549958
  type: 'test'
  ...
# Subtest: governed approval is default-deny before mutation and records explicit authorization
ok 194 - governed approval is default-deny before mutation and records explicit authorization
  ---
  duration_ms: 307.332792
  type: 'test'
  ...
# Subtest: conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
ok 195 - conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
  ---
  duration_ms: 344.267625
  type: 'test'
  ...
# Subtest: conditioned approval preserves authorization and protected-critical precedence without mutation
ok 196 - conditioned approval preserves authorization and protected-critical precedence without mutation
  ---
  duration_ms: 339.08225
  type: 'test'
  ...
# Subtest: conditioned approval preserves a sanitized identity failure code without mutation
ok 197 - conditioned approval preserves a sanitized identity failure code without mutation
  ---
  duration_ms: 206.461917
  type: 'test'
  ...
# Subtest: governed approval rechecks canonical blockers under the run lock after identity resolution
ok 198 - governed approval rechecks canonical blockers under the run lock after identity resolution
  ---
  duration_ms: 269.041583
  type: 'test'
  ...
# Subtest: governed blocking review can revise to an owned draft and review again
ok 199 - governed blocking review can revise to an owned draft and review again
  ---
  duration_ms: 353.174792
  type: 'test'
  ...
# Subtest: governed review exhaustion blocks provider preflight and execution with five explicit actions
ok 200 - governed review exhaustion blocks provider preflight and execution with five explicit actions
  ---
  duration_ms: 146.685209
  type: 'test'
  ...
# Subtest: governed review validates immutable candidate and targeted scope before provider invocation
ok 201 - governed review validates immutable candidate and targeted scope before provider invocation
  ---
  duration_ms: 144.149042
  type: 'test'
  ...
# Subtest: governed pre-payload timeout retries the same envelope and consumes one semantic review on success
ok 202 - governed pre-payload timeout retries the same envelope and consumes one semantic review on success
  ---
  duration_ms: 179.635917
  type: 'test'
  ...
# Subtest: missing provider CLI releases the semantic slot as a transport retry
ok 203 - missing provider CLI releases the semantic slot as a transport retry
  ---
  duration_ms: 141.537083
  type: 'test'
  ...
# Subtest: governed review rejects diagnostic-only success as a pre-payload transport retry
ok 204 - governed review rejects diagnostic-only success as a pre-payload transport retry
  ---
  duration_ms: 167.412084
  type: 'test'
  ...
# Subtest: canonical reviews without ledger outcomes fail closed before provider or extension mutation
ok 205 - canonical reviews without ledger outcomes fail closed before provider or extension mutation
  ---
  duration_ms: 127.362375
  type: 'test'
  ...
# Subtest: governed review WAL recovers every interrupted commit point and exact reviewed lifecycle once
ok 206 - governed review WAL recovers every interrupted commit point and exact reviewed lifecycle once
  ---
  duration_ms: 1494.554083
  type: 'test'
  ...
# Subtest: corrupt or foreign governed review WAL fails closed without publishing state
ok 207 - corrupt or foreign governed review WAL fails closed without publishing state
  ---
  duration_ms: 177.183417
  type: 'test'
  ...
# Subtest: run close rejects an in-flight provider reservation and remains isolated by run
ok 208 - run close rejects an in-flight provider reservation and remains isolated by run
  ---
  duration_ms: 185.03975
  type: 'test'
  ...
# Subtest: provider payload failures consume budget consistently in TTY and non-TTY modes
ok 209 - provider payload failures consume budget consistently in TTY and non-TTY modes
  ---
  duration_ms: 150.498625
  type: 'test'
  ...
# Subtest: governed review rejects a candidate that changes while the provider is running and consumes the received payload
ok 210 - governed review rejects a candidate that changes while the provider is running and consumes the received payload
  ---
  duration_ms: 76.332917
  type: 'test'
  ...
# Subtest: review budget extension action resolves identity and rejects caller-supplied actor claims
ok 211 - review budget extension action resolves identity and rejects caller-supplied actor claims
  ---
  duration_ms: 164.606458
  type: 'test'
  ...
# Subtest: governed review inherits the active profile and renders the effective policy in its prompt
ok 212 - governed review inherits the active profile and renders the effective policy in its prompt
  ---
  duration_ms: 503.988042
  type: 'test'
  ...
# Subtest: governed runs fail closed when governance config disappears before review or approval
ok 213 - governed runs fail closed when governance config disappears before review or approval
  ---
  duration_ms: 70.696375
  type: 'test'
  ...
# Subtest: an explicit governance profile without config fails before creating a run or invoking a provider
ok 214 - an explicit governance profile without config fails before creating a run or invoking a provider
  ---
  duration_ms: 37.818375
  type: 'test'
  ...
# Subtest: governed review without a run-owned versioned draft fails before provider invocation
ok 215 - governed review without a run-owned versioned draft fails before provider invocation
  ---
  duration_ms: 40.122458
  type: 'test'
  ...
# Subtest: governed reviews and approvals cannot consume another run artifact or review
ok 216 - governed reviews and approvals cannot consume another run artifact or review
  ---
  duration_ms: 317.932666
  type: 'test'
  ...
# Subtest: governed mutations reject a closed explicit run before provider, identity, or artifact writes
ok 217 - governed mutations reject a closed explicit run before provider, identity, or artifact writes
  ---
  duration_ms: 110.035334
  type: 'test'
  ...
# Subtest: governed review commit rejects profile downgrade and foreign-run canonical state under the lock
ok 218 - governed review commit rejects profile downgrade and foreign-run canonical state under the lock
  ---
  duration_ms: 36.070875
  type: 'test'
  ...
# Subtest: ai review-plan shows human TTY progress during live provider execution
ok 219 - ai review-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 197.000417
  type: 'test'
  ...
# Subtest: ai approve selects acceptance draft interactively when version is omitted
ok 220 - ai approve selects acceptance draft interactively when version is omitted
  ---
  duration_ms: 154.428333
  type: 'test'
  ...
# Subtest: ai approve without version remains explicit in no-TTY mode
ok 221 - ai approve without version remains explicit in no-TTY mode
  ---
  duration_ms: 277.206917
  type: 'test'
  ...
# Subtest: ai approve interactive selection refuses non-current acceptance drafts
ok 222 - ai approve interactive selection refuses non-current acceptance drafts
  ---
  duration_ms: 86.033417
  type: 'test'
  ...
# Subtest: ai review-plan marks review stale when the technical-plan draft changes
ok 223 - ai review-plan marks review stale when the technical-plan draft changes
  ---
  duration_ms: 160.055625
  type: 'test'
  ...
# Subtest: ai approve blocks technical-plan approval when the latest review is stale
ok 224 - ai approve blocks technical-plan approval when the latest review is stale
  ---
  duration_ms: 415.427125
  type: 'test'
  ...
# Subtest: ai review-plan persists approve recommendation metadata
ok 225 - ai review-plan persists approve recommendation metadata
  ---
  duration_ms: 415.7765
  type: 'test'
  ...
# Subtest: ai review-plan approve-with-risk recommendation still allows explicit approval
ok 226 - ai review-plan approve-with-risk recommendation still allows explicit approval
  ---
  duration_ms: 367.025959
  type: 'test'
  ...
# Subtest: technical-plan approval candidates expose review recommendation and approvability
ok 227 - technical-plan approval candidates expose review recommendation and approvability
  ---
  duration_ms: 110.961416
  type: 'test'
  ...
# Subtest: ai approve selects technical-plan draft interactively with review context
ok 228 - ai approve selects technical-plan draft interactively with review context
  ---
  duration_ms: 139.850083
  type: 'test'
  ...
# Subtest: ai review-plan revise recommendation blocks technical-plan approval
ok 229 - ai review-plan revise recommendation blocks technical-plan approval
  ---
  duration_ms: 364.31325
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects approved technical plans that were not reviewed
ok 230 - ai plan spec phase rejects approved technical plans that were not reviewed
  ---
  duration_ms: 293.547125
  type: 'test'
  ...
# Subtest: ai review-plan surfaces provider failures with task context
ok 231 - ai review-plan surfaces provider failures with task context
  ---
  duration_ms: 44.529792
  type: 'test'
  ...
# create-quiver: ai run create requiere --input <requirements.md>
# create-quiver: subcomando ai run no soportado: watch. Tareas soportadas: create, close
# Subtest: ai run create creates persistent run state and ai status can inspect it
ok 232 - ai run create creates persistent run state and ai status can inspect it
  ---
  duration_ms: 698.886917
  type: 'test'
  ...
# Subtest: ai status and resume render Spanish human output while preserving commands
ok 233 - ai status and resume render Spanish human output while preserving commands
  ---
  duration_ms: 637.615708
  type: 'test'
  ...
# Subtest: ai status and resume use current approval candidate versions
ok 234 - ai status and resume use current approval candidate versions
  ---
  duration_ms: 954.138375
  type: 'test'
  ...
# Subtest: ai status makes multiple open runs visible
ok 235 - ai status makes multiple open runs visible
  ---
  duration_ms: 766.62475
  type: 'test'
  ...
# Subtest: ai run close archives a selected run without deleting evidence
ok 236 - ai run close archives a selected run without deleting evidence
  ---
  duration_ms: 712.260667
  type: 'test'
  ...
# Subtest: ai run create and close render Spanish human wrappers while preserving ids
ok 237 - ai run create and close render Spanish human wrappers while preserving ids
  ---
  duration_ms: 457.017667
  type: 'test'
  ...
# Subtest: ai run command errors render Spanish without translating commands
ok 238 - ai run command errors render Spanish without translating commands
  ---
  duration_ms: 399.478958
  type: 'test'
  ...
# Subtest: ai approvals separates run-scoped approvals from global planner approvals
ok 239 - ai approvals separates run-scoped approvals from global planner approvals
  ---
  duration_ms: 679.405333
  type: 'test'
  ...
# Subtest: ai approvals fails closed when a run projection points at another run
ok 240 - ai approvals fails closed when a run projection points at another run
  ---
  duration_ms: 849.622666
  type: 'test'
  ...
# Subtest: status, resume, approvals, export, and flow share one canonical governance projection
ok 241 - status, resume, approvals, export, and flow share one canonical governance projection
  ---
  duration_ms: 1282.145792
  type: 'test'
  ...
# Subtest: ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
ok 242 - ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
  ---
  duration_ms: 722.939541
  type: 'test'
  ...
# Subtest: ai status reports no active run without creating files
ok 243 - ai status reports no active run without creating files
  ---
  duration_ms: 441.683917
  type: 'test'
  ...
# Subtest: ai approval show, verify, and export consume the same canonical decision
ok 244 - ai approval show, verify, and export consume the same canonical decision
  ---
  duration_ms: 1184.16075
  type: 'test'
  ...
# Subtest: ai approval verify fails closed with one JSON document after artifact or projection tampering
ok 245 - ai approval verify fails closed with one JSON document after artifact or projection tampering
  ---
  duration_ms: 1004.510042
  type: 'test'
  ...
# Subtest: ai approval requires an explicit run when more than one active run exists
ok 246 - ai approval requires an explicit run when more than one active run exists
  ---
  duration_ms: 594.461042
  type: 'test'
  ...
# Subtest: two active runs publish only their own approval candidate and canonical counts
ok 247 - two active runs publish only their own approval candidate and canonical counts
  ---
  duration_ms: 379.571042
  type: 'test'
  ...
# Subtest: a run in approval recovery cannot break explicit status or close for another run
ok 248 - a run in approval recovery cannot break explicit status or close for another run
  ---
  duration_ms: 748.552542
  type: 'test'
  ...
# Subtest: rollback recovers a prepared approval WAL before blocking the requested writer
ok 249 - rollback recovers a prepared approval WAL before blocking the requested writer
  ---
  duration_ms: 612.524708
  type: 'test'
  ...
# Subtest: analyze writes raw scan under .quiver and keeps project map visible
ok 250 - analyze writes raw scan under .quiver and keeps project map visible
  ---
  duration_ms: 255.091083
  type: 'test'
  ...
# Subtest: analyze shows transient progress only in safe TTY mode
ok 251 - analyze shows transient progress only in safe TTY mode
  ---
  duration_ms: 13.063958
  type: 'test'
  ...
# Subtest: analyze suppresses transient progress when no-color opts out
ok 252 - analyze suppresses transient progress when no-color opts out
  ---
  duration_ms: 4.630584
  type: 'test'
  ...
# Subtest: analyze dry-run reports planned artifacts without writing files
ok 253 - analyze dry-run reports planned artifacts without writing files
  ---
  duration_ms: 200.099084
  type: 'test'
  ...
# Subtest: analyze dry-run supports Spanish human output without translating paths
ok 254 - analyze dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 190.095875
  type: 'test'
  ...
# Subtest: analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
ok 255 - analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
  ---
  duration_ms: 228.671209
  type: 'test'
  ...
# Subtest: analyze recognizes React plus Vite without misclassifying it as Vue
ok 256 - analyze recognizes React plus Vite without misclassifying it as Vue
  ---
  duration_ms: 216.253583
  type: 'test'
  ...
# Subtest: brain add and export dry-runs validate fully without writing any bytes
ok 257 - brain add and export dry-runs validate fully without writing any bytes
  ---
  duration_ms: 78.090167
  type: 'test'
  ...
# Subtest: brain status, list, show, add, export, and delete return Result v1
ok 258 - brain status, list, show, add, export, and delete return Result v1
  ---
  duration_ms: 171.326625
  type: 'test'
  ...
# Subtest: every Brain command fails closed without a trusted actor adapter
ok 259 - every Brain command fails closed without a trusted actor adapter
  ---
  duration_ms: 51.444125
  type: 'test'
  ...
# Subtest: CLI brain namespace emits canonical JSON and stable policy exit class
ok 260 - CLI brain namespace emits canonical JSON and stable policy exit class
  ---
  duration_ms: 690.807292
  type: 'test'
  ...
# Subtest: Brain writer compatibility failures stay inside Result v1 with capability exit class
ok 261 - Brain writer compatibility failures stay inside Result v1 with capability exit class
  ---
  duration_ms: 299.65775
  type: 'test'
  ...
# Subtest: top-level --version prints the installed package version
ok 262 - top-level --version prints the installed package version
  ---
  duration_ms: 206.9045
  type: 'test'
  ...
# Subtest: top-level -V prints the installed package version
ok 263 - top-level -V prints the installed package version
  ---
  duration_ms: 216.465167
  type: 'test'
  ...
# Subtest: version command prints human and JSON metadata without changing semver flags
ok 264 - version command prints human and JSON metadata without changing semver flags
  ---
  duration_ms: 451.155625
  type: 'test'
  ...
# Subtest: local quiver alias points to the same CLI entrypoint
ok 265 - local quiver alias points to the same CLI entrypoint
  ---
  duration_ms: 0.149291
  type: 'test'
  ...
# Subtest: top-level help command prints grouped command descriptions
ok 266 - top-level help command prints grouped command descriptions
  ---
  duration_ms: 252.444875
  type: 'test'
  ...
# Subtest: help output documents important public commands
ok 267 - help output documents important public commands
  ---
  duration_ms: 221.445917
  type: 'test'
  ...
# Subtest: ai approval accepts the singular verify contract and emits a clean JSON runtime error
ok 268 - ai approval accepts the singular verify contract and emits a clean JSON runtime error
  ---
  duration_ms: 207.00675
  type: 'test'
  ...
# Subtest: ai approval rejects missing or unsupported singular subcommands
ok 269 - ai approval rejects missing or unsupported singular subcommands
  ---
  duration_ms: 396.27025
  type: 'test'
  ...
# Subtest: ai approvals --json emits one canonical projection without stderr
ok 270 - ai approvals --json emits one canonical projection without stderr
  ---
  duration_ms: 226.057166
  type: 'test'
  ...
# Subtest: spec create --json emits one machine error document without stderr
ok 271 - spec create --json emits one machine error document without stderr
  ---
  duration_ms: 217.854042
  type: 'test'
  ...
# Subtest: approval value flags reject a following flag as a missing value
ok 272 - approval value flags reject a following flag as a missing value
  ---
  duration_ms: 1263.726375
  type: 'test'
  ...
# Subtest: findings namespace validates its public subcommands and value flags before mutation
ok 273 - findings namespace validates its public subcommands and value flags before mutation
  ---
  duration_ms: 1607.419541
  type: 'test'
  ...
# Subtest: findings JSON runtime failures use one machine envelope and no stderr prose
ok 274 - findings JSON runtime failures use one machine envelope and no stderr prose
  ---
  duration_ms: 227.355375
  type: 'test'
  ...
# Subtest: ai approve rejects decisions outside the public approval vocabulary
ok 275 - ai approve rejects decisions outside the public approval vocabulary
  ---
  duration_ms: 233.265292
  type: 'test'
  ...
# Subtest: governance profile flag rejects unknown profile names before command execution
ok 276 - governance profile flag rejects unknown profile names before command execution
  ---
  duration_ms: 202.644334
  type: 'test'
  ...
# Subtest: global --lang works before and after command names without changing JSON output
ok 277 - global --lang works before and after command names without changing JSON output
  ---
  duration_ms: 606.93225
  type: 'test'
  ...
# Subtest: unsupported global --lang falls back without polluting JSON output
ok 278 - unsupported global --lang falls back without polluting JSON output
  ---
  duration_ms: 217.057292
  type: 'test'
  ...
# Subtest: global --lang before help is accepted
ok 279 - global --lang before help is accepted
  ---
  duration_ms: 197.959958
  type: 'test'
  ...
# Subtest: help uses configured project language without requiring --lang
ok 280 - help uses configured project language without requiring --lang
  ---
  duration_ms: 190.74375
  type: 'test'
  ...
# Subtest: ai approve --version remains a draft-version option
ok 281 - ai approve --version remains a draft-version option
  ---
  duration_ms: 253.049125
  type: 'test'
  ...
# Subtest: global --lang requires a value
ok 282 - global --lang requires a value
  ---
  duration_ms: 240.653917
  type: 'test'
  ...
# Subtest: early parser errors use the resolved language and keep JSON stdout empty
ok 283 - early parser errors use the resolved language and keep JSON stdout empty
  ---
  duration_ms: 384.170208
  type: 'test'
  ...
# Subtest: unsupported commands fail with localized actionable guidance
ok 284 - unsupported commands fail with localized actionable guidance
  ---
  duration_ms: 509.743583
  type: 'test'
  ...
# Subtest: config language set writes project config and preserves existing keys
ok 285 - config language set writes project config and preserves existing keys
  ---
  duration_ms: 257.06925
  type: 'test'
  ...
# Subtest: config language refuses to overwrite an invalid governance namespace
ok 286 - config language refuses to overwrite an invalid governance namespace
  ---
  duration_ms: 298.312208
  type: 'test'
  ...
# Subtest: config language show reports effective project language in human and JSON modes
ok 287 - config language show reports effective project language in human and JSON modes
  ---
  duration_ms: 609.133208
  type: 'test'
  ...
# Subtest: config language set --global writes user config without project config
ok 288 - config language set --global writes user config without project config
  ---
  duration_ms: 441.293
  type: 'test'
  ...
# Subtest: config language set --json emits stable machine output
ok 289 - config language set --json emits stable machine output
  ---
  duration_ms: 232.854042
  type: 'test'
  ...
# Subtest: config language show respects overrides without polluting JSON
ok 290 - config language show respects overrides without polluting JSON
  ---
  duration_ms: 622.550666
  type: 'test'
  ...
# Subtest: config language rejects invalid values and unsupported --global usage
ok 291 - config language rejects invalid values and unsupported --global usage
  ---
  duration_ms: 674.399625
  type: 'test'
  ...
# Subtest: config language errors localize and keep JSON stdout clean
ok 292 - config language errors localize and keep JSON stdout clean
  ---
  duration_ms: 589.363542
  type: 'test'
  ...
# Subtest: dashboard human output shows consolidated project status
ok 293 - dashboard human output shows consolidated project status
  ---
  duration_ms: 251.401
  type: 'test'
  ...
# Subtest: dashboard JSON output is parseable and stable
ok 294 - dashboard JSON output is parseable and stable
  ---
  duration_ms: 258.719167
  type: 'test'
  ...
# Subtest: dashboard human output renders Spanish with flag or project config
ok 295 - dashboard human output renders Spanish with flag or project config
  ---
  duration_ms: 506.243125
  type: 'test'
  ...
# Subtest: dashboard --include-completed changes only the visible slice set
ok 296 - dashboard --include-completed changes only the visible slice set
  ---
  duration_ms: 260.045
  type: 'test'
  ...
# Subtest: dashboard keeps JSON error payloads stable with Spanish language
ok 297 - dashboard keeps JSON error payloads stable with Spanish language
  ---
  duration_ms: 224.454833
  type: 'test'
  ...
# Subtest: dashboard missing spec keeps JSON stdout parseable on failure
ok 298 - dashboard missing spec keeps JSON stdout parseable on failure
  ---
  duration_ms: 238.060666
  type: 'test'
  ...
# Subtest: dashboard localized details and section views preserve exact commands
ok 299 - dashboard localized details and section views preserve exact commands
  ---
  duration_ms: 514.06125
  type: 'test'
  ...
# Subtest: dashboard supports details, section, and limit human views
ok 300 - dashboard supports details, section, and limit human views
  ---
  duration_ms: 519.288583
  type: 'test'
  ...
# Subtest: dashboard rejects ambiguous and invalid human flags
ok 301 - dashboard rejects ambiguous and invalid human flags
  ---
  duration_ms: 420.362375
  type: 'test'
  ...
# Subtest: dashboard invalid section errors are localized and list supported sections
ok 302 - dashboard invalid section errors are localized and list supported sections
  ---
  duration_ms: 483.953792
  type: 'test'
  ...
# Subtest: dashboard human-only flags keep JSON failures parseable
ok 303 - dashboard human-only flags keep JSON failures parseable
  ---
  duration_ms: 247.978333
  type: 'test'
  ...
# Subtest: dashboard invalid section keeps JSON error payload parseable and English
ok 304 - dashboard invalid section keeps JSON error payload parseable and English
  ---
  duration_ms: 223.535666
  type: 'test'
  ...
# Subtest: dashboard-only flags fail clearly outside dashboard command
ok 305 - dashboard-only flags fail clearly outside dashboard command
  ---
  duration_ms: 234.551292
  type: 'test'
  ...
# Subtest: dashboard reports graph errors without crashing JSON output
ok 306 - dashboard reports graph errors without crashing JSON output
  ---
  duration_ms: 299.502125
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run prints planned files without writing
ok 307 - demo create spec-viewer dry-run prints planned files without writing
  ---
  duration_ms: 221.971958
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run supports Spanish human output without translating paths
ok 308 - demo create spec-viewer dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 214.913625
  type: 'test'
  ...
# Subtest: demo create spec-viewer reads the configured project language by default
ok 309 - demo create spec-viewer reads the configured project language by default
  ---
  duration_ms: 227.503667
  type: 'test'
  ...
# Subtest: demo create spec-viewer defaults to a nested target on dry-run
ok 310 - demo create spec-viewer defaults to a nested target on dry-run
  ---
  duration_ms: 209.038667
  type: 'test'
  ...
# Subtest: demo create spec-viewer writes a small runnable demo
ok 311 - demo create spec-viewer writes a small runnable demo
  ---
  duration_ms: 3049.071375
  type: 'test'
  ...
# Subtest: generated demo documents and implements occupied-port fallback without network fixtures
ok 312 - generated demo documents and implements occupied-port fallback without network fixtures
  ---
  duration_ms: 238.101292
  type: 'test'
  ...
# Subtest: demo create spec-viewer preserves existing files
ok 313 - demo create spec-viewer preserves existing files
  ---
  duration_ms: 273.738625
  type: 'test'
  ...
# Subtest: demo rejects unsupported names and subcommands clearly
ok 314 - demo rejects unsupported names and subcommands clearly
  ---
  duration_ms: 419.460833
  type: 'test'
  ...
# Subtest: doctor accepts the new default init layout before specs exist
ok 315 - doctor accepts the new default init layout before specs exist
  ---
  duration_ms: 5510.725916
  type: 'test'
  ...
# Subtest: doctor localizes human output while preserving command snippets
ok 316 - doctor localizes human output while preserving command snippets
  ---
  duration_ms: 5328.885625
  type: 'test'
  ...
# Subtest: doctor json emits parseable diagnostics with human parity
ok 317 - doctor json emits parseable diagnostics with human parity
  ---
  duration_ms: 7243.8655
  type: 'test'
  ...
# Subtest: doctor json exits deterministically for blocking layout errors
ok 318 - doctor json exits deterministically for blocking layout errors
  ---
  duration_ms: 1352.79825
  type: 'test'
  ...
# Subtest: doctor warns when package scripts target unsupported create-quiver commands
ok 319 - doctor warns when package scripts target unsupported create-quiver commands
  ---
  duration_ms: 3288.504042
  type: 'test'
  ...
# Subtest: doctor fix dry-run previews safe repairs without writing
ok 320 - doctor fix dry-run previews safe repairs without writing
  ---
  duration_ms: 2181.2665
  type: 'test'
  ...
# Subtest: doctor fix applies safe repairs idempotently
ok 321 - doctor fix applies safe repairs idempotently
  ---
  duration_ms: 4296.211375
  type: 'test'
  ...
# Subtest: doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
ok 322 - doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
  ---
  duration_ms: 5515.507291
  type: 'test'
  ...
# Subtest: doctor diagnoses missing governance and requires explicit migration without rewriting config
ok 323 - doctor diagnoses missing governance and requires explicit migration without rewriting config
  ---
  duration_ms: 3238.566708
  type: 'test'
  ...
# Subtest: doctor reports invalid governance without overwriting authorization policy
ok 324 - doctor reports invalid governance without overwriting authorization policy
  ---
  duration_ms: 3261.080041
  type: 'test'
  ...
# Subtest: doctor gives actionable AGENTS.md repair guidance
ok 325 - doctor gives actionable AGENTS.md repair guidance
  ---
  duration_ms: 3082.92
  type: 'test'
  ...
# Subtest: doctor fix repairs AGENTS.md contract without replacing manual content
ok 326 - doctor fix repairs AGENTS.md contract without replacing manual content
  ---
  duration_ms: 4404.23475
  type: 'test'
  ...
# Subtest: doctor warns about missing local markdown links in generated docs
ok 327 - doctor warns about missing local markdown links in generated docs
  ---
  duration_ms: 3207.906
  type: 'test'
  ...
# Subtest: doctor reports a legacy layout with migration guidance
ok 328 - doctor reports a legacy layout with migration guidance
  ---
  duration_ms: 1178.338042
  type: 'test'
  ...
# Subtest: doctor accepts the minimal init layout before specs exist
ok 329 - doctor accepts the minimal init layout before specs exist
  ---
  duration_ms: 3462.773292
  type: 'test'
  ...
# Subtest: doctor reports a hybrid layout when explicit full compatibility assets exist
ok 330 - doctor reports a hybrid layout when explicit full compatibility assets exist
  ---
  duration_ms: 4704.370042
  type: 'test'
  ...
# Subtest: doctor examples prefer an active slice over the first spec alphabetically
ok 331 - doctor examples prefer an active slice over the first spec alphabetically
  ---
  duration_ms: 4993.703792
  type: 'test'
  ...
# Subtest: doctor uses generic examples when multiple specs have no active slice
ok 332 - doctor uses generic examples when multiple specs have no active slice
  ---
  duration_ms: 3417.357834
  type: 'test'
  ...
# Subtest: doctor reports stale generated context when scan is newer than project map
ok 333 - doctor reports stale generated context when scan is newer than project map
  ---
  duration_ms: 2392.405125
  type: 'test'
  ...
# Subtest: doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
ok 334 - doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
  ---
  duration_ms: 3897.737416
  type: 'test'
  ...
# Subtest: evidence run records successful command output
ok 335 - evidence run records successful command output
  ---
  duration_ms: 306.479791
  type: 'test'
  ...
# Subtest: evidence run supports Spanish human output without translating command or path
ok 336 - evidence run supports Spanish human output without translating command or path
  ---
  duration_ms: 270.418833
  type: 'test'
  ...
# Subtest: evidence run preserves failing command exit code
ok 337 - evidence run preserves failing command exit code
  ---
  duration_ms: 316.009375
  type: 'test'
  ...
# Subtest: evidence run truncates long output
ok 338 - evidence run truncates long output
  ---
  duration_ms: 277.270459
  type: 'test'
  ...
# Subtest: evidence list and show emit parseable JSON
ok 339 - evidence list and show emit parseable JSON
  ---
  duration_ms: 750.32975
  type: 'test'
  ...
# Subtest: evidence run rejects traversal output before running child command
ok 340 - evidence run rejects traversal output before running child command
  ---
  duration_ms: 190.583667
  type: 'test'
  ...
# Subtest: evidence run requires a command after separator
ok 341 - evidence run requires a command after separator
  ---
  duration_ms: 255.308375
  type: 'test'
  ...
# Subtest: evidence run missing command error localizes without stdout noise
ok 342 - evidence run missing command error localizes without stdout noise
  ---
  duration_ms: 268.612292
  type: 'test'
  ...
# Subtest: formatOutputPath keeps external outputs absolute
ok 343 - formatOutputPath keeps external outputs absolute
  ---
  duration_ms: 0.861708
  type: 'test'
  ...
# Subtest: individual transfer preserves exact criterion bytes and writes one canonical disposition
ok 344 - individual transfer preserves exact criterion bytes and writes one canonical disposition
  ---
  duration_ms: 121.64025
  type: 'test'
  ...
# Subtest: invocation files stay scoped to the invoking worktree while run state stays canonical
ok 345 - invocation files stay scoped to the invoking worktree while run state stays canonical
  ---
  duration_ms: 48.144334
  type: 'test'
  ...
# Subtest: batch keyed-map and canonical-envelope forms require explicit supersession
ok 346 - batch keyed-map and canonical-envelope forms require explicit supersession
  ---
  duration_ms: 124.809
  type: 'test'
  ...
# Subtest: batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
ok 347 - batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
  ---
  duration_ms: 117.430541
  type: 'test'
  ...
# Subtest: complete batch validation and unsafe contractual data fail before mutation
ok 348 - complete batch validation and unsafe contractual data fail before mutation
  ---
  duration_ms: 29.4845
  type: 'test'
  ...
# Subtest: criterion binding must resolve uniquely to the current technical-plan criterion before mutation
ok 349 - criterion binding must resolve uniquely to the current technical-plan criterion before mutation
  ---
  duration_ms: 66.381375
  type: 'test'
  ...
# Subtest: unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
ok 350 - unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
  ---
  duration_ms: 84.104875
  type: 'test'
  ...
# Subtest: ambiguous slice aliases and post-review phases are rejected without writes
ok 351 - ambiguous slice aliases and post-review phases are rejected without writes
  ---
  duration_ms: 94.69975
  type: 'test'
  ...
# Subtest: direct findings errors redact invocation, canonical, and secret values without changing contracts
ok 352 - direct findings errors redact invocation, canonical, and secret values without changing contracts
  ---
  duration_ms: 29.364167
  type: 'test'
  ...
# Subtest: findings CLI redacts failures consistently in human and JSON modes
ok 353 - findings CLI redacts failures consistently in human and JSON modes
  ---
  duration_ms: 499.199292
  type: 'test'
  ...
# Subtest: package exposes quiver as an alias to the create-quiver binary
ok 354 - package exposes quiver as an alias to the create-quiver binary
  ---
  duration_ms: 0.868833
  type: 'test'
  ...
# Subtest: generated package scripts include the flow entrypoint
ok 355 - generated package scripts include the flow entrypoint
  ---
  duration_ms: 0.181958
  type: 'test'
  ...
# Subtest: flow command is read-only and guides uninitialized projects to init
ok 356 - flow command is read-only and guides uninitialized projects to init
  ---
  duration_ms: 210.467334
  type: 'test'
  ...
# Subtest: flow command localizes uninitialized guidance while preserving commands
ok 357 - flow command localizes uninitialized guidance while preserving commands
  ---
  duration_ms: 235.868667
  type: 'test'
  ...
# Subtest: flow command reports analysis guidance when initialized context docs are missing
ok 358 - flow command reports analysis guidance when initialized context docs are missing
  ---
  duration_ms: 260.798833
  type: 'test'
  ...
# Subtest: flow command reports agent profile guidance before planning when context docs exist
ok 359 - flow command reports agent profile guidance before planning when context docs exist
  ---
  duration_ms: 265.750667
  type: 'test'
  ...
# Subtest: flow command reports package-manager-aware generated script guidance
ok 360 - flow command reports package-manager-aware generated script guidance
  ---
  duration_ms: 268.012666
  type: 'test'
  ...
# Subtest: flow command uses the generated project map after analyze
ok 361 - flow command uses the generated project map after analyze
  ---
  duration_ms: 3816.935042
  type: 'test'
  ...
# Subtest: flow command reports criteria draft approval guidance
ok 362 - flow command reports criteria draft approval guidance
  ---
  duration_ms: 310.495917
  type: 'test'
  ...
# Subtest: flow command asks for production review before technical-plan approval
ok 363 - flow command asks for production review before technical-plan approval
  ---
  duration_ms: 392.935875
  type: 'test'
  ...
# Subtest: flow command asks for technical-plan approval after production review
ok 364 - flow command asks for technical-plan approval after production review
  ---
  duration_ms: 400.665458
  type: 'test'
  ...
# Subtest: flow command points to revise when plan review blocks technical-plan approval
ok 365 - flow command points to revise when plan review blocks technical-plan approval
  ---
  duration_ms: 390.24925
  type: 'test'
  ...
# Subtest: flow command reports spec create after reviewed and approved technical plan
ok 366 - flow command reports spec create after reviewed and approved technical plan
  ---
  duration_ms: 398.946959
  type: 'test'
  ...
# Subtest: flow command does not suggest re-approving a technical plan that still needs review
ok 367 - flow command does not suggest re-approving a technical plan that still needs review
  ---
  duration_ms: 327.878875
  type: 'test'
  ...
# Subtest: flow command reports ready slice execution after approved plan and completed slice-00
ok 368 - flow command reports ready slice execution after approved plan and completed slice-00
  ---
  duration_ms: 342.794708
  type: 'test'
  ...
# Subtest: flow command supports machine-readable output
ok 369 - flow command supports machine-readable output
  ---
  duration_ms: 229.581166
  type: 'test'
  ...
# Subtest: flow JSON preserves camelCase and snake_case next command fields for ready slices
ok 370 - flow JSON preserves camelCase and snake_case next command fields for ready slices
  ---
  duration_ms: 336.0665
  type: 'test'
  ...
# Subtest: collectGraph returns pending levels and conflicts
ok 371 - collectGraph returns pending levels and conflicts
  ---
  duration_ms: 23.422875
  type: 'test'
  ...
# Subtest: graph can include completed slices and filter by spec
ok 372 - graph can include completed slices and filter by spec
  ---
  duration_ms: 265.400875
  type: 'test'
  ...
# Subtest: scoped graph does not parse unrelated historical slice artifacts
ok 373 - scoped graph does not parse unrelated historical slice artifacts
  ---
  duration_ms: 3.174917
  type: 'test'
  ...
# Subtest: graph CLI renders an ASCII tree by default
ok 374 - graph CLI renders an ASCII tree by default
  ---
  duration_ms: 250.507583
  type: 'test'
  ...
# Subtest: graph CLI localizes tree output without changing refs
ok 375 - graph CLI localizes tree output without changing refs
  ---
  duration_ms: 266.804958
  type: 'test'
  ...
# Subtest: graph CLI can show conflicts and filter a single level
ok 376 - graph CLI can show conflicts and filter a single level
  ---
  duration_ms: 255.413125
  type: 'test'
  ...
# Subtest: graph CLI reports an empty level in human output and keeps JSON clean
ok 377 - graph CLI reports an empty level in human output and keeps JSON clean
  ---
  duration_ms: 675.528583
  type: 'test'
  ...
# Subtest: graph --json keeps JSON output even when --format selects a human renderer
ok 378 - graph --json keeps JSON output even when --format selects a human renderer
  ---
  duration_ms: 259.770875
  type: 'test'
  ...
# Subtest: graph CLI emits valid JSON
ok 379 - graph CLI emits valid JSON
  ---
  duration_ms: 257.777042
  type: 'test'
  ...
# Subtest: graph CLI prefers Unicode when requested
ok 380 - graph CLI prefers Unicode when requested
  ---
  duration_ms: 298.805833
  type: 'test'
  ...
# Subtest: graph CLI renders Mermaid and DOT formats
ok 381 - graph CLI renders Mermaid and DOT formats
  ---
  duration_ms: 440.676958
  type: 'test'
  ...
# Subtest: graph unsupported format error localizes and keeps JSON stdout clean
ok 382 - graph unsupported format error localizes and keeps JSON stdout clean
  ---
  duration_ms: 193.906834
  type: 'test'
  ...
# Subtest: handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
ok 383 - handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
  ---
  duration_ms: 495.236833
  type: 'test'
  ...
# Subtest: handoff new namespace matches legacy new-handoff output and artifacts
ok 384 - handoff new namespace matches legacy new-handoff output and artifacts
  ---
  duration_ms: 422.748667
  type: 'test'
  ...
# Subtest: handoff namespace rejects unsupported subcommands before execution
ok 385 - handoff namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 210.696583
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix covers every documented command
ok 386 - v43 i18n audit matrix covers every documented command
  ---
  duration_ms: 2.194625
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix records actionable mode and exception status
ok 387 - v43 i18n audit matrix records actionable mode and exception status
  ---
  duration_ms: 0.530667
  type: 'test'
  ...
# Subtest: init --dry-run prints the planned layout and does not write files
ok 388 - init --dry-run prints the planned layout and does not write files
  ---
  duration_ms: 260.168209
  type: 'test'
  ...
# Subtest: legacy --name alias supports dry-run without writing files
ok 389 - legacy --name alias supports dry-run without writing files
  ---
  duration_ms: 219.245334
  type: 'test'
  ...
# Subtest: unsupported subcommands fail clearly instead of initializing a project
ok 390 - unsupported subcommands fail clearly instead of initializing a project
  ---
  duration_ms: 201.431792
  type: 'test'
  ...
# Subtest: init --dry-run reports requested profiles and optional assets
ok 391 - init --dry-run reports requested profiles and optional assets
  ---
  duration_ms: 644.050792
  type: 'test'
  ...
# Subtest: init --interactive resolves guided choices without writing by itself
ok 392 - init --interactive resolves guided choices without writing by itself
  ---
  duration_ms: 5.324958
  type: 'test'
  ...
# Subtest: init --interactive keeps or changes existing project language without dropping config keys
ok 393 - init --interactive keeps or changes existing project language without dropping config keys
  ---
  duration_ms: 2.985792
  type: 'test'
  ...
# Subtest: init --interactive dry-run resolves intended language without writing config
ok 394 - init --interactive dry-run resolves intended language without writing config
  ---
  duration_ms: 0.434708
  type: 'test'
  ...
# Subtest: init --interactive rejects non-TTY automation with explicit flag guidance
ok 395 - init --interactive rejects non-TTY automation with explicit flag guidance
  ---
  duration_ms: 0.689875
  type: 'test'
  ...
# Subtest: init rejects incompatible profile flags before writing files
ok 396 - init rejects incompatible profile flags before writing files
  ---
  duration_ms: 230.435709
  type: 'test'
  ...
# Subtest: init command without dry-run writes the default clean AI-first layout
ok 397 - init command without dry-run writes the default clean AI-first layout
  ---
  duration_ms: 4020.894375
  type: 'test'
  ...
# Subtest: explicit init preserves an existing empty Brain byte-for-byte
ok 398 - explicit init preserves an existing empty Brain byte-for-byte
  ---
  duration_ms: 7905.709292
  type: 'test'
  ...
# Subtest: init generated human docs follow --lang and keep machine artifacts stable
ok 399 - init generated human docs follow --lang and keep machine artifacts stable
  ---
  duration_ms: 4553.231209
  type: 'test'
  ...
# Subtest: init uses existing project language config for generated docs without --lang
ok 400 - init uses existing project language config for generated docs without --lang
  ---
  duration_ms: 2048.195334
  type: 'test'
  ...
# Subtest: init --minimal writes only the essential onboarding contract
ok 401 - init --minimal writes only the essential onboarding contract
  ---
  duration_ms: 2038.414667
  type: 'test'
  ...
# Subtest: init --full preserves the historical compatibility layout explicitly
ok 402 - init --full preserves the historical compatibility layout explicitly
  ---
  duration_ms: 2414.827584
  type: 'test'
  ...
# Subtest: init --legacy-scripts writes compatibility wrappers and package scripts without full extras
ok 403 - init --legacy-scripts writes compatibility wrappers and package scripts without full extras
  ---
  duration_ms: 2078.013333
  type: 'test'
  ...
# Subtest: init --include-templates exports packaged templates under .quiver/templates only
ok 404 - init --include-templates exports packaged templates under .quiver/templates only
  ---
  duration_ms: 2321.288416
  type: 'test'
  ...
# Subtest: init preserves existing project files by default
ok 405 - init preserves existing project files by default
  ---
  duration_ms: 2025.104083
  type: 'test'
  ...
# Subtest: init merges root gitignore defaults without deleting existing entries
ok 406 - init merges root gitignore defaults without deleting existing entries
  ---
  duration_ms: 2006.365292
  type: 'test'
  ...
# Subtest: migrate --yes reports legacy layout paths and preserves existing legacy files
ok 407 - migrate --yes reports legacy layout paths and preserves existing legacy files
  ---
  duration_ms: 4504.983125
  type: 'test'
  ...
# Subtest: migrate without --yes is safe and actionable in no-TTY automation
ok 408 - migrate without --yes is safe and actionable in no-TTY automation
  ---
  duration_ms: 8688.993709
  type: 'test'
  ...
# Subtest: migrate cancellation leaves the tree unchanged before side effects
ok 409 - migrate cancellation leaves the tree unchanged before side effects
  ---
  duration_ms: 4732.089792
  type: 'test'
  ...
# Subtest: migrate --dry-run reports planned changes without writing
ok 410 - migrate --dry-run reports planned changes without writing
  ---
  duration_ms: 5417.101417
  type: 'test'
  ...
# Subtest: migrate --dry-run supports Spanish human output without translating commands
ok 411 - migrate --dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 6492.555625
  type: 'test'
  ...
# Subtest: migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
ok 412 - migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
  ---
  duration_ms: 19897.019833
  type: 'test'
  ...
# Started: spec-a/slice-01-alpha
# Subtest: collectNext returns the first ready slice and the ready set
ok 413 - collectNext returns the first ready slice and the ready set
  ---
  duration_ms: 16.6555
  type: 'test'
  ...
# Subtest: next CLI emits parseable JSON
ok 414 - next CLI emits parseable JSON
  ---
  duration_ms: 264.962
  type: 'test'
  ...
# Subtest: next CLI prints the top ready slice and the copy-paste command
ok 415 - next CLI prints the top ready slice and the copy-paste command
  ---
  duration_ms: 232.744584
  type: 'test'
  ...
# Subtest: next CLI localizes human output while preserving start command
ok 416 - next CLI localizes human output while preserving start command
  ---
  duration_ms: 225.812625
  type: 'test'
  ...
# Subtest: next CLI can list all ready slices
ok 417 - next CLI can list all ready slices
  ---
  duration_ms: 220.845791
  type: 'test'
  ...
# Subtest: next include-completed reports history without suggesting completed work
ok 418 - next include-completed reports history without suggesting completed work
  ---
  duration_ms: 459.901541
  type: 'test'
  ...
# Subtest: next auto-start rejects non-TTY sessions and can start through an injected prompt
ok 419 - next auto-start rejects non-TTY sessions and can start through an injected prompt
  ---
  duration_ms: 5.4185
  type: 'test'
  ...
# Subtest: next formatter keeps the ready slice command visible
ok 420 - next formatter keeps the ready slice command visible
  ---
  duration_ms: 2.534042
  type: 'test'
  ...
# Subtest: parser adapter requires and delegates to legacy parser
ok 421 - parser adapter requires and delegates to legacy parser
  ---
  duration_ms: 1.4585
  type: 'test'
  ...
# Subtest: command registry reflects supported command surface with explicit changelog wrapper
ok 422 - command registry reflects supported command surface with explicit changelog wrapper
  ---
  duration_ms: 0.091916
  type: 'test'
  ...
# Subtest: baseline parser contracts stay stable for high-risk entry points
ok 423 - baseline parser contracts stay stable for high-risk entry points
  ---
  duration_ms: 1302.791125
  type: 'test'
  ...
# Slice graph contains a cycle: spec-a/slice-01-alpha -> spec-a/slice-02-beta -> spec-a/slice-01-alpha
# Subtest: collectPlan returns pending slices, critical path, and total hours
ok 424 - collectPlan returns pending slices, critical path, and total hours
  ---
  duration_ms: 25.236333
  type: 'test'
  ...
# Subtest: plan can include completed slices for history without changing defaults
ok 425 - plan can include completed slices for history without changing defaults
  ---
  duration_ms: 260.129417
  type: 'test'
  ...
# Subtest: collectPlan respects --only-ready and --spec filtering
ok 426 - collectPlan respects --only-ready and --spec filtering
  ---
  duration_ms: 4.086042
  type: 'test'
  ...
# Subtest: scoped plan does not parse unrelated historical slice artifacts
ok 427 - scoped plan does not parse unrelated historical slice artifacts
  ---
  duration_ms: 1.836917
  type: 'test'
  ...
# Subtest: scoped plan keeps explicit external dependencies for readiness
ok 428 - scoped plan keeps explicit external dependencies for readiness
  ---
  duration_ms: 2.704833
  type: 'test'
  ...
# Subtest: plan CLI emits parseable JSON
ok 429 - plan CLI emits parseable JSON
  ---
  duration_ms: 218.993917
  type: 'test'
  ...
# Subtest: plan missing-estimates note is human-only and JSON-safe
ok 430 - plan missing-estimates note is human-only and JSON-safe
  ---
  duration_ms: 584.158166
  type: 'test'
  ...
# Subtest: plan CLI localizes human output without altering slice refs
ok 431 - plan CLI localizes human output without altering slice refs
  ---
  duration_ms: 208.618666
  type: 'test'
  ...
# Subtest: plan CLI stays ASCII by default and can opt into Unicode
ok 432 - plan CLI stays ASCII by default and can opt into Unicode
  ---
  duration_ms: 434.886125
  type: 'test'
  ...
# Subtest: plan CLI fails on cycles with the cycle path in the error
ok 433 - plan CLI fails on cycles with the cycle path in the error
  ---
  duration_ms: 219.067416
  type: 'test'
  ...
# Subtest: prepare dry-run reports checks and does not write files
ok 434 - prepare dry-run reports checks and does not write files
  ---
  duration_ms: 947.503625
  type: 'test'
  ...
# Subtest: prepare reports missing gh with cross-platform guidance
ok 435 - prepare reports missing gh with cross-platform guidance
  ---
  duration_ms: 201.264708
  type: 'test'
  ...
# Subtest: prepare reports a missing provider CLI with actionable guidance
ok 436 - prepare reports a missing provider CLI with actionable guidance
  ---
  duration_ms: 557.525416
  type: 'test'
  ...
# Subtest: prepare reports SSH identity and auth recovery steps
ok 437 - prepare reports SSH identity and auth recovery steps
  ---
  duration_ms: 580.448625
  type: 'test'
  ...
# Subtest: prepare success recommends the next safe command
ok 438 - prepare success recommends the next safe command
  ---
  duration_ms: 822.86225
  type: 'test'
  ...
# Subtest: prepare treats missing README_FOR_AI.md as framework guidance, not project debt
ok 439 - prepare treats missing README_FOR_AI.md as framework guidance, not project debt
  ---
  duration_ms: 491.227333
  type: 'test'
  ...
# Subtest: slice namespace matches legacy check-slice behavior and keeps warning on stderr
ok 440 - slice namespace matches legacy check-slice behavior and keeps warning on stderr
  ---
  duration_ms: 566.935708
  type: 'test'
  ...
# Subtest: legacy slice warning is suppressed when json mode is requested
ok 441 - legacy slice warning is suppressed when json mode is requested
  ---
  duration_ms: 289.142708
  type: 'test'
  ...
# Subtest: slice check json failure emits one machine envelope without human prose
ok 442 - slice check json failure emits one machine envelope without human prose
  ---
  duration_ms: 293.147292
  type: 'test'
  ...
# Subtest: slice namespace rejects unsupported subcommands before execution
ok 443 - slice namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 188.861084
  type: 'test'
  ...
# create-quiver: spec branch feature/example-spec is not merged into main. Merge the PR before cleanup, or pass --discard intentionally.
# create-quiver: spec worktree is dirty: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-close-F2Vf0U/feature-example-spec. Commit or stash before closing, or pass --discard intentionally.
# Subtest: spec close blocks when spec branch is not merged
ok 444 - spec close blocks when spec branch is not merged
  ---
  duration_ms: 794.143917
  type: 'test'
  ...
# Subtest: spec start dry-run does not create a worktree
ok 445 - spec start dry-run does not create a worktree
  ---
  duration_ms: 369.838625
  type: 'test'
  ...
# Subtest: spec close blocks dirty spec worktrees by default
ok 446 - spec close blocks dirty spec worktrees by default
  ---
  duration_ms: 747.82525
  type: 'test'
  ...
# Subtest: spec close dry-run keeps merged clean worktree in place
ok 447 - spec close dry-run keeps merged clean worktree in place
  ---
  duration_ms: 1017.449209
  type: 'test'
  ...
# Subtest: spec close dry-run renders Spanish labels while preserving command details
ok 448 - spec close dry-run renders Spanish labels while preserving command details
  ---
  duration_ms: 871.795333
  type: 'test'
  ...
# Subtest: spec close removes a merged clean spec worktree
ok 449 - spec close removes a merged clean spec worktree
  ---
  duration_ms: 972.675709
  type: 'test'
  ...
# Subtest: spec close renders Spanish completion labels
ok 450 - spec close renders Spanish completion labels
  ---
  duration_ms: 917.579625
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
# Decision digest: sha256:8e4c203018003d32ef505c1033b7bfad451b9a47329290a011153433527ab18b
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
# Decision digest: sha256:c1bcd9e9a98a8316c0ec711243296f7db5ea2e7f7a60f10ebd05d96f993ce4af
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
  duration_ms: 619.530958
  type: 'test'
  ...
# Subtest: spec create --review dry-run advertises review without opening an editor or writing
ok 452 - spec create --review dry-run advertises review without opening an editor or writing
  ---
  duration_ms: 625.178458
  type: 'test'
  ...
# Subtest: spec create dry-run renders Spanish from explicit language without translating commands
ok 453 - spec create dry-run renders Spanish from explicit language without translating commands
  ---
  duration_ms: 615.595625
  type: 'test'
  ...
# Subtest: spec create review dry-run renders Spanish review wrapper safely
ok 454 - spec create review dry-run renders Spanish review wrapper safely
  ---
  duration_ms: 542.912041
  type: 'test'
  ...
# Subtest: spec create dry-run uses configured project language when no flag is provided
ok 455 - spec create dry-run uses configured project language when no flag is provided
  ---
  duration_ms: 609.0905
  type: 'test'
  ...
# Subtest: spec create --review cancellation blocks writes
ok 456 - spec create --review cancellation blocks writes
  ---
  duration_ms: 322.476667
  type: 'test'
  ...
# Subtest: spec create --interactive can decline writes
ok 457 - spec create --interactive can decline writes
  ---
  duration_ms: 344.025417
  type: 'test'
  ...
# Subtest: spec create --interactive writes after guided summary approval
ok 458 - spec create --interactive writes after guided summary approval
  ---
  duration_ms: 351.302334
  type: 'test'
  ...
# Subtest: spec create writes the generated spec tree and refuses collisions
ok 459 - spec create writes the generated spec tree and refuses collisions
  ---
  duration_ms: 691.716541
  type: 'test'
  ...
# Subtest: spec create collision error localizes
ok 460 - spec create collision error localizes
  ---
  duration_ms: 860.754833
  type: 'test'
  ...
# Subtest: spec create blocks when the approved technical plan was not reviewed
ok 461 - spec create blocks when the approved technical plan was not reviewed
  ---
  duration_ms: 275.2675
  type: 'test'
  ...
# Subtest: spec create fails before writing when approved plan lacks structured slices
ok 462 - spec create fails before writing when approved plan lacks structured slices
  ---
  duration_ms: 358.550875
  type: 'test'
  ...
# Subtest: spec create accepts a canonical unconditional decision and publishes its governance manifest
ok 463 - spec create accepts a canonical unconditional decision and publishes its governance manifest
  ---
  duration_ms: 27.449583
  type: 'test'
  ...
# Subtest: spec create resolves an on-disk canonical ledger without an injected governance resolver
ok 464 - spec create resolves an on-disk canonical ledger without an injected governance resolver
  ---
  duration_ms: 574.2025
  type: 'test'
  ...
# Subtest: spec create revalidates governance after preview and fails before publication when parity changes
ok 465 - spec create revalidates governance after preview and fails before publication when parity changes
  ---
  duration_ms: 2.111208
  type: 'test'
  ...
# Subtest: spec validate checks a complete spec package
ok 466 - spec validate checks a complete spec package
  ---
  duration_ms: 231.944875
  type: 'test'
  ...
# Subtest: spec validate renders Spanish report labels without translating paths
ok 467 - spec validate renders Spanish report labels without translating paths
  ---
  duration_ms: 218.599167
  type: 'test'
  ...
# Subtest: spec validate fails on unsafe paths and incomplete briefs
ok 468 - spec validate fails on unsafe paths and incomplete briefs
  ---
  duration_ms: 173.690917
  type: 'test'
  ...
# Subtest: spec validate fails when slice execution git metadata is missing
ok 469 - spec validate fails when slice execution git metadata is missing
  ---
  duration_ms: 244.433
  type: 'test'
  ...
# Subtest: spec validate strict mode promotes status and evidence warnings
ok 470 - spec validate strict mode promotes status and evidence warnings
  ---
  duration_ms: 235.47075
  type: 'test'
  ...
# Subtest: spec validate strict mode renders Spanish failure wrapper while preserving warning text
ok 471 - spec validate strict mode renders Spanish failure wrapper while preserving warning text
  ---
  duration_ms: 226.109458
  type: 'test'
  ...
# Subtest: spec validate missing directory error localizes
ok 472 - spec validate missing directory error localizes
  ---
  duration_ms: 225.816417
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
  duration_ms: 423.046583
  type: 'test'
  ...
# Subtest: spec status renders Spanish labels while preserving ids and statuses
ok 474 - spec status renders Spanish labels while preserving ids and statuses
  ---
  duration_ms: 338.435875
  type: 'test'
  ...
# Subtest: spec status blocks later slices until slice-00 is completed
ok 475 - spec status blocks later slices until slice-00 is completed
  ---
  duration_ms: 399.135958
  type: 'test'
  ...
# Subtest: spec status reports an expected worktree path that exists but is not registered as stale
ok 476 - spec status reports an expected worktree path that exists but is not registered as stale
  ---
  duration_ms: 363.894459
  type: 'test'
  ...
# Subtest: spec start creates and then reuses a dedicated worktree from main
ok 477 - spec start creates and then reuses a dedicated worktree from main
  ---
  duration_ms: 790.075667
  type: 'test'
  ...
# Subtest: spec start dry-run renders Spanish labels while preserving branch and paths
ok 478 - spec start dry-run renders Spanish labels while preserving branch and paths
  ---
  duration_ms: 392.178458
  type: 'test'
  ...
# Subtest: spec start refuses a dirty checkout
ok 479 - spec start refuses a dirty checkout
  ---
  duration_ms: 361.488958
  type: 'test'
  ...
# Subtest: UX flag matrix documents supported commands
ok 480 - UX flag matrix documents supported commands
  ---
  duration_ms: 1.352667
  type: 'test'
  ...
# Subtest: resolveUxCommandKey handles top-level, ai, and spec commands
ok 481 - resolveUxCommandKey handles top-level, ai, and spec commands
  ---
  duration_ms: 0.150084
  type: 'test'
  ...
# Subtest: supported UX flags validate for planner-capable and PR commands
ok 482 - supported UX flags validate for planner-capable and PR commands
  ---
  duration_ms: 0.193916
  type: 'test'
  ...
# Subtest: unsupported UX flags fail with actionable guidance before command execution
ok 483 - unsupported UX flags fail with actionable guidance before command execution
  ---
  duration_ms: 175.920041
  type: 'test'
  ...
# Subtest: ai pr rejects --with-planner while keeping review flags available
ok 484 - ai pr rejects --with-planner while keeping review flags available
  ---
  duration_ms: 195.195583
  type: 'test'
  ...
# Subtest: JSON mode rejects interactive and review flows without partial JSON stdout
ok 485 - JSON mode rejects interactive and review flows without partial JSON stdout
  ---
  duration_ms: 459.56325
  type: 'test'
  ...
# Subtest: read-only ai inspect rejects UX flags early
ok 486 - read-only ai inspect rejects UX flags early
  ---
  duration_ms: 198.099125
  type: 'test'
  ...
# Subtest: existing JSON command output stays parseable when no UX flags are requested
ok 487 - existing JSON command output stays parseable when no UX flags are requested
  ---
  duration_ms: 296.924167
  type: 'test'
  ...
# Subtest: version command renders English and Spanish human labels
ok 488 - version command renders English and Spanish human labels
  ---
  duration_ms: 417.086209
  type: 'test'
  ...
# Subtest: version command uses configured project language without --lang
ok 489 - version command uses configured project language without --lang
  ---
  duration_ms: 190.002042
  type: 'test'
  ...
# Subtest: version JSON and top-level semver output remain stable with language overrides
ok 490 - version JSON and top-level semver output remain stable with language overrides
  ---
  duration_ms: 393.79375
  type: 'test'
  ...
# Subtest: generated command metadata is present in runtime help
ok 491 - generated command metadata is present in runtime help
  ---
  duration_ms: 212.609708
  type: 'test'
  ...
# Subtest: docs command reference generated block is synchronized
ok 492 - docs command reference generated block is synchronized
  ---
  duration_ms: 179.102959
  type: 'test'
  ...
# Subtest: generated block replacement preserves manual content outside markers
ok 493 - generated block replacement preserves manual content outside markers
  ---
  duration_ms: 0.192584
  type: 'test'
  ...
# Subtest: agent profiles persist provider and technical model ids without secrets
ok 494 - agent profiles persist provider and technical model ids without secrets
  ---
  duration_ms: 3.896959
  type: 'test'
  ...
# Subtest: agent profiles normalize known visual model aliases to technical ids
ok 495 - agent profiles normalize known visual model aliases to technical ids
  ---
  duration_ms: 1.056
  type: 'test'
  ...
# Subtest: agent profiles support multiple named profiles per role with a default
ok 496 - agent profiles support multiple named profiles per role with a default
  ---
  duration_ms: 2.070166
  type: 'test'
  ...
# Subtest: agent profiles list and resolve configured provider defaults
ok 497 - agent profiles list and resolve configured provider defaults
  ---
  duration_ms: 2.330333
  type: 'test'
  ...
# Subtest: agent profiles reject unsupported providers and secret-like values
ok 498 - agent profiles reject unsupported providers and secret-like values
  ---
  duration_ms: 0.491208
  type: 'test'
  ...
# Subtest: agent profile doctor classifies aliases, custom models, and unsupported providers
ok 499 - agent profile doctor classifies aliases, custom models, and unsupported providers
  ---
  duration_ms: 1.125292
  type: 'test'
  ...
# Subtest: agent profile repair plan previews alias normalization without writes
ok 500 - agent profile repair plan previews alias normalization without writes
  ---
  duration_ms: 1.530667
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
ok 501 - assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
  ---
  duration_ms: 2.586292
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
ok 502 - assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
  ---
  duration_ms: 1.86575
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
ok 503 - assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
  ---
  duration_ms: 0.306917
  type: 'test'
  ...
# Subtest: project discovery reports workspace roots and safety exclusions without reading unsafe paths
ok 504 - project discovery reports workspace roots and safety exclusions without reading unsafe paths
  ---
  duration_ms: 25.954333
  type: 'test'
  ...
# Subtest: semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
ok 505 - semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
  ---
  duration_ms: 5.131375
  type: 'test'
  ...
# Subtest: project discovery handles unknown stack, no package manager, symlinks, and large samples safely
ok 506 - project discovery handles unknown stack, no package manager, symlinks, and large samples safely
  ---
  duration_ms: 38.940416
  type: 'test'
  ...
# Subtest: semantic sampling respects source, test, db, and budget options
ok 507 - semantic sampling respects source, test, db, and budget options
  ---
  duration_ms: 4.208875
  type: 'test'
  ...
# Subtest: project discovery can restrict analysis to a workspace name
ok 508 - project discovery can restrict analysis to a workspace name
  ---
  duration_ms: 2.840708
  type: 'test'
  ...
# Subtest: mergeManagedBlock preserves human content and replaces prior analyze-project block
ok 509 - mergeManagedBlock preserves human content and replaces prior analyze-project block
  ---
  duration_ms: 0.853792
  type: 'test'
  ...
# Subtest: collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
ok 510 - collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
  ---
  duration_ms: 0.424
  type: 'test'
  ...
# Subtest: classifyAnalyzeProjectDoc detects scaffold and human content conservatively
ok 511 - classifyAnalyzeProjectDoc detects scaffold and human content conservatively
  ---
  duration_ms: 0.848292
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
ok 512 - mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
  ---
  duration_ms: 0.21075
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
ok 513 - mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
  ---
  duration_ms: 0.512042
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
ok 514 - mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
  ---
  duration_ms: 0.102042
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
ok 515 - mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
  ---
  duration_ms: 0.145958
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc is idempotent for the same proposal
ok 516 - mergeAnalyzeProjectDoc is idempotent for the same proposal
  ---
  duration_ms: 0.138167
  type: 'test'
  ...
# Subtest: doc proposal validation allows only approved Markdown docs
ok 517 - doc proposal validation allows only approved Markdown docs
  ---
  duration_ms: 1.466917
  type: 'test'
  ...
# Subtest: write plan preserves human content and snapshot manifest records hashes
ok 518 - write plan preserves human content and snapshot manifest records hashes
  ---
  duration_ms: 6.695875
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
ok 519 - parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
  ---
  duration_ms: 3.879375
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects missing selected evidence paths
ok 520 - parseAnalyzeProjectOutput rejects missing selected evidence paths
  ---
  duration_ms: 0.566958
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
ok 521 - parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
  ---
  duration_ms: 0.175292
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects unapproved doc update paths
ok 522 - parseAnalyzeProjectOutput rejects unapproved doc update paths
  ---
  duration_ms: 0.223958
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects malformed provider output
ok 523 - parseAnalyzeProjectOutput rejects malformed provider output
  ---
  duration_ms: 0.426625
  type: 'test'
  ...
# Subtest: analyze-project proposal artifact paths follow the v55 contract
ok 524 - analyze-project proposal artifact paths follow the v55 contract
  ---
  duration_ms: 0.752417
  type: 'test'
  ...
# Subtest: analyze-project proposal run ids reject unsafe path segments
ok 525 - analyze-project proposal run ids reject unsafe path segments
  ---
  duration_ms: 0.2795
  type: 'test'
  ...
# Subtest: proposal and write manifests validate strict safe paths
ok 526 - proposal and write manifests validate strict safe paths
  ---
  duration_ms: 3.0015
  type: 'test'
  ...
# Subtest: proposal manifest rejects traversal and extra keys
ok 527 - proposal manifest rejects traversal and extra keys
  ---
  duration_ms: 0.146542
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
ok 528 - writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
  ---
  duration_ms: 8.344583
  type: 'test'
  ...
# Subtest: readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
ok 529 - readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
  ---
  duration_ms: 12.952833
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectWriteManifest writes final normalized apply manifest
ok 530 - writeAnalyzeProjectWriteManifest writes final normalized apply manifest
  ---
  duration_ms: 3.637625
  type: 'test'
  ...
# Subtest: normalizes project-relative evidence paths and rejects outside-scope paths
ok 531 - normalizes project-relative evidence paths and rejects outside-scope paths
  ---
  duration_ms: 1.916791
  type: 'test'
  ...
# Subtest: classifies env examples as metadata-only and real env files as security-excluded
ok 532 - classifies env examples as metadata-only and real env files as security-excluded
  ---
  duration_ms: 4.560583
  type: 'test'
  ...
# Subtest: recognizes metadata-only env template names
ok 533 - recognizes metadata-only env template names
  ---
  duration_ms: 0.269542
  type: 'test'
  ...
# Subtest: classifies generated dependency paths and binary files as excluded
ok 534 - classifies generated dependency paths and binary files as excluded
  ---
  duration_ms: 7.36625
  type: 'test'
  ...
# Subtest: classifies omitted budget files as safe-to-include without reading content
ok 535 - classifies omitted budget files as safe-to-include without reading content
  ---
  duration_ms: 1.073834
  type: 'test'
  ...
# Subtest: classifies lockfile omissions as metadata-only
ok 536 - classifies lockfile omissions as metadata-only
  ---
  duration_ms: 0.501333
  type: 'test'
  ...
# Subtest: classifies omitted binary-file records as generated dependency exclusions
ok 537 - classifies omitted binary-file records as generated dependency exclusions
  ---
  duration_ms: 0.778375
  type: 'test'
  ...
# Subtest: classifies missing and not-discovered safe text files without throwing
ok 538 - classifies missing and not-discovered safe text files without throwing
  ---
  duration_ms: 0.847791
  type: 'test'
  ...
# Subtest: classifies evidence-not-selected issues deterministically and deduplicates paths
ok 539 - classifies evidence-not-selected issues deterministically and deduplicates paths
  ---
  duration_ms: 9.425833
  type: 'test'
  ...
# Subtest: extracts evidence path from provider validation issue message
ok 540 - extracts evidence path from provider validation issue message
  ---
  duration_ms: 0.333667
  type: 'test'
  ...
# Subtest: calculates recovery budgets from safe classified evidence only
ok 541 - calculates recovery budgets from safe classified evidence only
  ---
  duration_ms: 0.283917
  type: 'test'
  ...
# Subtest: never lowers existing budgets and detects category flags from omission reasons
ok 542 - never lowers existing budgets and detects category flags from omission reasons
  ---
  duration_ms: 0.067333
  type: 'test'
  ...
# Subtest: returns scope-required when recommendation exceeds recovery caps
ok 543 - returns scope-required when recommendation exceeds recovery caps
  ---
  duration_ms: 0.048209
  type: 'test'
  ...
# Subtest: builds one-line recovery command preserving relevant flags and dropping transient flags
ok 544 - builds one-line recovery command preserving relevant flags and dropping transient flags
  ---
  duration_ms: 0.178416
  type: 'test'
  ...
# Subtest: builds recovery payload with command or safe fallback warning
ok 545 - builds recovery payload with command or safe fallback warning
  ---
  duration_ms: 0.110834
  type: 'test'
  ...
# Subtest: analyze-project schema accepts the required top-level contract
ok 546 - analyze-project schema accepts the required top-level contract
  ---
  duration_ms: 4.413375
  type: 'test'
  ...
# Subtest: analyze-project schema rejects invalid confidence levels and unknown top-level fields
ok 547 - analyze-project schema rejects invalid confidence levels and unknown top-level fields
  ---
  duration_ms: 1.36
  type: 'test'
  ...
# Subtest: analyze-project schema allows unknown findings without evidence
ok 548 - analyze-project schema allows unknown findings without evidence
  ---
  duration_ms: 1.356375
  type: 'test'
  ...
# Subtest: post-write validation passes clean managed docs
ok 549 - post-write validation passes clean managed docs
  ---
  duration_ms: 14.407667
  type: 'test'
  ...
# Subtest: post-write validation rejects critical placeholders in managed docs
ok 550 - post-write validation rejects critical placeholders in managed docs
  ---
  duration_ms: 8.754083
  type: 'test'
  ...
# Subtest: post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
ok 551 - post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
  ---
  duration_ms: 6.341792
  type: 'test'
  ...
# Subtest: post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
ok 552 - post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
  ---
  duration_ms: 10.566458
  type: 'test'
  ...
# Subtest: post-write validation rechecks evidence paths against the selected sample
ok 553 - post-write validation rechecks evidence paths against the selected sample
  ---
  duration_ms: 3.013541
  type: 'test'
  ...
# Subtest: limitRawProviderStream preserves head, tail, hash, and byte cap
ok 554 - limitRawProviderStream preserves head, tail, hash, and byte cap
  ---
  duration_ms: 2.544792
  type: 'test'
  ...
# Subtest: redactSensitiveValue recursively redacts structured secrets without mutating input
ok 555 - redactSensitiveValue recursively redacts structured secrets without mutating input
  ---
  duration_ms: 1.266125
  type: 'test'
  ...
# Subtest: writeRawProviderArtifact stores redacted and size-controlled provider streams
ok 556 - writeRawProviderArtifact stores redacted and size-controlled provider streams
  ---
  duration_ms: 7.2975
  type: 'test'
  ...
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 557 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 2.18625
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 558 - executor defaults to slice and never full
  ---
  duration_ms: 0.251166
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 559 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 1.277959
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 560 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 0.082958
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 561 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.149625
  type: 'test'
  ...
# Subtest: valid planner context proposal parses into a normalized docs-only write plan
ok 562 - valid planner context proposal parses into a normalized docs-only write plan
  ---
  duration_ms: 5.225334
  type: 'test'
  ...
# Subtest: fenced JSON planner output is accepted when schema and paths are safe
ok 563 - fenced JSON planner output is accepted when schema and paths are safe
  ---
  duration_ms: 0.84825
  type: 'test'
  ...
# Subtest: legacy files alias is normalized to docs for planner proposals
ok 564 - legacy files alias is normalized to docs for planner proposals
  ---
  duration_ms: 0.176791
  type: 'test'
  ...
# Subtest: planner proposal rejects product code, dependency files, and unapproved docs
ok 565 - planner proposal rejects product code, dependency files, and unapproved docs
  ---
  duration_ms: 0.736875
  type: 'test'
  ...
# Subtest: planner proposal rejects absolute and traversal paths before writes
ok 566 - planner proposal rejects absolute and traversal paths before writes
  ---
  duration_ms: 0.481208
  type: 'test'
  ...
# Subtest: invalid schema, duplicate paths, empty content, and malformed output are actionable
ok 567 - invalid schema, duplicate paths, empty content, and malformed output are actionable
  ---
  duration_ms: 0.853666
  type: 'test'
  ...
# Subtest: context proposal path allowlist is explicit and validates safe paths
ok 568 - context proposal path allowlist is explicit and validates safe paths
  ---
  duration_ms: 0.175875
  type: 'test'
  ...
# Subtest: invalid planner proposal artifacts are redacted and stored under the run raw directory
ok 569 - invalid planner proposal artifacts are redacted and stored under the run raw directory
  ---
  duration_ms: 3.176584
  type: 'test'
  ...
# Subtest: collectExecutionPlan groups slice-00 first and parallel slices by ready level
ok 570 - collectExecutionPlan groups slice-00 first and parallel slices by ready level
  ---
  duration_ms: 30.264167
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when same-level files overlap
ok 571 - collectExecutionPlan falls back to sequential mode when same-level files overlap
  ---
  duration_ms: 3.810625
  type: 'test'
  ...
# Subtest: collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
ok 572 - collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
  ---
  duration_ms: 2.581625
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when file scope is unknown
ok 573 - collectExecutionPlan falls back to sequential mode when file scope is unknown
  ---
  duration_ms: 3.157458
  type: 'test'
  ...
# Subtest: formatHumanExecutionPlan includes worktree guidance and level ordering
ok 574 - formatHumanExecutionPlan includes worktree guidance and level ordering
  ---
  duration_ms: 4.769208
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun prints commands without executing providers
ok 575 - formatExecutePlanDryRun prints commands without executing providers
  ---
  duration_ms: 9.891875
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun manual mode prints prompts without execute commands
ok 576 - formatExecutePlanDryRun manual mode prints prompts without execute commands
  ---
  duration_ms: 4.471375
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on missing dependencies with a clear diagnostic
ok 577 - collectExecutionPlan fails on missing dependencies with a clear diagnostic
  ---
  duration_ms: 2.669334
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on dependency cycles with a clear diagnostic
ok 578 - collectExecutionPlan fails on dependency cycles with a clear diagnostic
  ---
  duration_ms: 2.683667
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
# Commit: created 11301fa
# Commit message: feat: QUIVER-01 Demo slice
# Subtest: resolveSliceJsonPath accepts a slice directory and reports missing slice.json
ok 579 - resolveSliceJsonPath accepts a slice directory and reports missing slice.json
  ---
  duration_ms: 127.140041
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext uses executor slice context without onboarding content
ok 580 - buildExecuteSliceContext uses executor slice context without onboarding content
  ---
  duration_ms: 115.381041
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext prefers allowed_write_paths over legacy files
ok 581 - buildExecuteSliceContext prefers allowed_write_paths over legacy files
  ---
  duration_ms: 120.32475
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
ok 582 - buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
  ---
  duration_ms: 163.759042
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt uses minimal slice context and final report format
ok 583 - buildManualExecutorPrompt uses minimal slice context and final report format
  ---
  duration_ms: 136.482208
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
ok 584 - buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
  ---
  duration_ms: 262.370084
  type: 'test'
  ...
# Subtest: runExecuteSlice dry-run does not execute the provider
ok 585 - runExecuteSlice dry-run does not execute the provider
  ---
  duration_ms: 180.848167
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive mode selects a ready slice and executor profile
ok 586 - runExecuteSlice interactive mode selects a ready slice and executor profile
  ---
  duration_ms: 347.189333
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive progress renders Spanish when language is es
ok 587 - runExecuteSlice interactive progress renders Spanish when language is es
  ---
  duration_ms: 410.720042
  type: 'test'
  ...
# Subtest: runExecuteSlice fails clearly when the provider fails
ok 588 - runExecuteSlice fails clearly when the provider fails
  ---
  duration_ms: 231.054583
  type: 'test'
  ...
# Subtest: runExecuteSlice does not close a slice when provider makes no changes
ok 589 - runExecuteSlice does not close a slice when provider makes no changes
  ---
  duration_ms: 413.533375
  type: 'test'
  ...
# Subtest: runExecuteSlice detects files outside slice scope after provider execution
ok 590 - runExecuteSlice detects files outside slice scope after provider execution
  ---
  duration_ms: 460.5855
  type: 'test'
  ...
# Subtest: runExecuteSlice passes scope validation for allowed files
ok 591 - runExecuteSlice passes scope validation for allowed files
  ---
  duration_ms: 413.597709
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks execution from the wrong slice worktree branch
ok 592 - runExecuteSlice blocks execution from the wrong slice worktree branch
  ---
  duration_ms: 230.505166
  type: 'test'
  ...
# Subtest: runExecuteSlice supports allowed_write_paths-only slice scope
ok 593 - runExecuteSlice supports allowed_write_paths-only slice scope
  ---
  duration_ms: 360.412917
  type: 'test'
  ...
# Subtest: runExecuteSlice updates closure, evidence, command log, and status with redacted logs
ok 594 - runExecuteSlice updates closure, evidence, command log, and status with redacted logs
  ---
  duration_ms: 298.679375
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks commit when validation fails
ok 595 - runExecuteSlice blocks commit when validation fails
  ---
  duration_ms: 273.223875
  type: 'test'
  ...
# Subtest: runExecuteSlice creates one slice commit when commit is enabled
ok 596 - runExecuteSlice creates one slice commit when commit is enabled
  ---
  duration_ms: 357.481959
  type: 'test'
  ...
# Subtest: runExecuteSlice requires a clean worktree before execution
ok 597 - runExecuteSlice requires a clean worktree before execution
  ---
  duration_ms: 119.545083
  type: 'test'
  ...
# Subtest: runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
ok 598 - runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
  ---
  duration_ms: 167.653292
  type: 'test'
  ...
# Subtest: collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
ok 599 - collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
  ---
  duration_ms: 69.746625
  type: 'test'
  ...
# Subtest: lifecycle export formatters produce human-readable inspection and markdown
ok 600 - lifecycle export formatters produce human-readable inspection and markdown
  ---
  duration_ms: 44.908916
  type: 'test'
  ...
# Subtest: lifecycle inspect prefers existing spec commands over stale spec create guidance
ok 601 - lifecycle inspect prefers existing spec commands over stale spec create guidance
  ---
  duration_ms: 61.743291
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports a missing gh with cross-platform install guidance
ok 602 - preflightGitHubPr reports a missing gh with cross-platform install guidance
  ---
  duration_ms: 120.087958
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the gh probe exits non-zero
ok 603 - preflightGitHubPr stops when the gh probe exits non-zero
  ---
  duration_ms: 102.414959
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
ok 604 - preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
  ---
  duration_ms: 100.68775
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the GitFlow guide is missing
ok 605 - preflightGitHubPr stops when the GitFlow guide is missing
  ---
  duration_ms: 141.566083
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports missing SSH host alias with platform guidance
ok 606 - preflightGitHubPr reports missing SSH host alias with platform guidance
  ---
  duration_ms: 163.162959
  type: 'test'
  ...
# Subtest: formatSshAliasGuidance gives shell-specific alias setup and verification
ok 607 - formatSshAliasGuidance gives shell-specific alias setup and verification
  ---
  duration_ms: 0.142875
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports the reviewed identity file path when it is missing
ok 608 - preflightGitHubPr reports the reviewed identity file path when it is missing
  ---
  duration_ms: 276.715
  type: 'test'
  ...
# Subtest: formatPreflightReport prints shell-specific path guidance for paths with spaces
ok 609 - formatPreflightReport prints shell-specific path guidance for paths with spaces
  ---
  duration_ms: 1.221375
  type: 'test'
  ...
# Subtest: preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
ok 610 - preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
  ---
  duration_ms: 207.180792
  type: 'test'
  ...
# Subtest: resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
ok 611 - resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
  ---
  duration_ms: 239.888292
  type: 'test'
  ...
# Subtest: buildPrCreatePlan reads pr.md title and builds safe gh args
ok 612 - buildPrCreatePlan reads pr.md title and builds safe gh args
  ---
  duration_ms: 231.871583
  type: 'test'
  ...
# Subtest: buildPrCreatePlan uses remote HEAD as default base when --base is omitted
ok 613 - buildPrCreatePlan uses remote HEAD as default base when --base is omitted
  ---
  duration_ms: 215.772042
  type: 'test'
  ...
# Subtest: formatPrCreateReport prints shell-specific command examples for paths with spaces
ok 614 - formatPrCreateReport prints shell-specific command examples for paths with spaces
  ---
  duration_ms: 0.41475
  type: 'test'
  ...
# Subtest: buildPrCreatePlan refuses PR creation while spec slices are open
ok 615 - buildPrCreatePlan refuses PR creation while spec slices are open
  ---
  duration_ms: 211.622167
  type: 'test'
  ...
# Subtest: runGhPrCreate reports gh pr create failures without merging
ok 616 - runGhPrCreate reports gh pr create failures without merging
  ---
  duration_ms: 0.300208
  type: 'test'
  ...
# Subtest: extractPrTitle falls back predictably
ok 617 - extractPrTitle falls back predictably
  ---
  duration_ms: 0.116375
  type: 'test'
  ...
# Subtest: preparePromptTransport defaults to stdin and preserves the prompt text
ok 618 - preparePromptTransport defaults to stdin and preserves the prompt text
  ---
  duration_ms: 2.092125
  type: 'test'
  ...
# Subtest: createTempFilePromptTransport writes a prompt file in a path that may contain spaces
ok 619 - createTempFilePromptTransport writes a prompt file in a path that may contain spaces
  ---
  duration_ms: 3.384209
  type: 'test'
  ...
# Subtest: createStdinPromptTransport is a lightweight wrapper
ok 620 - createStdinPromptTransport is a lightweight wrapper
  ---
  duration_ms: 0.071959
  type: 'test'
  ...
# Subtest: assertSupportedProvider rejects unknown providers with a clear list
ok 621 - assertSupportedProvider rejects unknown providers with a clear list
  ---
  duration_ms: 1.741875
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
ok 622 - resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
  ---
  duration_ms: 0.330958
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
ok 623 - resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
  ---
  duration_ms: 0.504292
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
ok 624 - resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
  ---
  duration_ms: 0.080292
  type: 'test'
  ...
# Subtest: buildProviderInvocation keeps command arguments separate from the prompt
ok 625 - buildProviderInvocation keeps command arguments separate from the prompt
  ---
  duration_ms: 0.325584
  type: 'test'
  ...
# Subtest: buildProviderInvocation adds model args when provider supports model selection
ok 626 - buildProviderInvocation adds model args when provider supports model selection
  ---
  duration_ms: 0.715583
  type: 'test'
  ...
# Subtest: buildProviderInvocation normalizes known display model aliases by default
ok 627 - buildProviderInvocation normalizes known display model aliases by default
  ---
  duration_ms: 0.645042
  type: 'test'
  ...
# Subtest: buildProviderInvocation can block profile display aliases before provider execution
ok 628 - buildProviderInvocation can block profile display aliases before provider execution
  ---
  duration_ms: 0.297583
  type: 'test'
  ...
# Subtest: resolveProviderModelSelection preserves custom models
ok 629 - resolveProviderModelSelection preserves custom models
  ---
  duration_ms: 0.35825
  type: 'test'
  ...
# Subtest: buildProviderModelArgs blocks unsupported enforced model selection
ok 630 - buildProviderModelArgs blocks unsupported enforced model selection
  ---
  duration_ms: 0.383167
  type: 'test'
  ...
# Subtest: preflightProvider reports a missing CLI with an install hint
ok 631 - preflightProvider reports a missing CLI with an install hint
  ---
  duration_ms: 0.18675
  type: 'test'
  ...
# Subtest: runProvider dry-run returns a structured plan without invoking spawn
ok 632 - runProvider dry-run returns a structured plan without invoking spawn
  ---
  duration_ms: 0.173208
  type: 'test'
  ...
# Subtest: runProvider dry-run exposes selected provider model without auth preflight
ok 633 - runProvider dry-run exposes selected provider model without auth preflight
  ---
  duration_ms: 0.093917
  type: 'test'
  ...
# Subtest: runProvider dry-run shows normalized technical model ids
ok 634 - runProvider dry-run shows normalized technical model ids
  ---
  duration_ms: 0.079292
  type: 'test'
  ...
# Subtest: runProvider uses an argument array and writes the prompt through stdin
ok 635 - runProvider uses an argument array and writes the prompt through stdin
  ---
  duration_ms: 1.221709
  type: 'test'
  ...
# Subtest: runProvider redacts likely secrets from stdout, stderr, and serialized errors
ok 636 - runProvider redacts likely secrets from stdout, stderr, and serialized errors
  ---
  duration_ms: 0.683042
  type: 'test'
  ...
# Subtest: runProvider times out and terminates a hung provider
ok 637 - runProvider times out and terminates a hung provider
  ---
  duration_ms: 5.488875
  type: 'test'
  ...
# Subtest: provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
ok 638 - provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
  ---
  duration_ms: 13.168083
  type: 'test'
  ...
# Subtest: prompt delivery failures return an explicit pre-payload transport result
ok 639 - prompt delivery failures return an explicit pre-payload transport result
  ---
  duration_ms: 0.482833
  type: 'test'
  ...
# Subtest: runProvider returns structured metadata when preflight fails
ok 640 - runProvider returns structured metadata when preflight fails
  ---
  duration_ms: 0.120875
  type: 'test'
  ...
# Subtest: runProvider prioritizes invalid model errors over secondary provider noise
ok 641 - runProvider prioritizes invalid model errors over secondary provider noise
  ---
  duration_ms: 0.6795
  type: 'test'
  ...
# Subtest: extractProviderErrorCause redacts secrets from surfaced errors
ok 642 - extractProviderErrorCause redacts secrets from surfaced errors
  ---
  duration_ms: 0.151833
  type: 'test'
  ...
# Subtest: review intent classification is explicit and rejects selectable retry or stale targets
ok 643 - review intent classification is explicit and rejects selectable retry or stale targets
  ---
  duration_ms: 8.643208
  type: 'test'
  ...
# Subtest: atomic reservation exhausts fast delivery before a second provider attempt
ok 644 - atomic reservation exhausts fast delivery before a second provider attempt
  ---
  duration_ms: 83.855333
  type: 'test'
  ...
# Subtest: reservation rejects a request snapshot that changed before the atomic commit
ok 645 - reservation rejects a request snapshot that changed before the atomic commit
  ---
  duration_ms: 27.977041
  type: 'test'
  ...
# Subtest: a semantic review may reserve the same envelope again after invalid output when capacity remains
ok 646 - a semantic review may reserve the same envelope again after invalid output when capacity remains
  ---
  duration_ms: 47.636958
  type: 'test'
  ...
# Subtest: a policy change cannot be masked by a stale profile object
ok 647 - a policy change cannot be masked by a stale profile object
  ---
  duration_ms: 18.877167
  type: 'test'
  ...
# Subtest: pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
ok 648 - pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
  ---
  duration_ms: 37.036917
  type: 'test'
  ...
# Subtest: a reviewed candidate cannot be relabeled as a later full review
ok 649 - a reviewed candidate cannot be relabeled as a later full review
  ---
  duration_ms: 33.626958
  type: 'test'
  ...
# Subtest: all counters and human output derive from one canonical event fold
ok 650 - all counters and human output derive from one canonical event fold
  ---
  duration_ms: 0.853708
  type: 'test'
  ...
# Subtest: budget extension is default-deny without mutating the ledger
ok 651 - budget extension is default-deny without mutating the ledger
  ---
  duration_ms: 29.814791
  type: 'test'
  ...
# Subtest: authorized extension preserves policy bytes and ledger audit while increasing only review capacity
ok 652 - authorized extension preserves policy bytes and ledger audit while increasing only review capacity
  ---
  duration_ms: 53.591208
  type: 'test'
  ...
# Subtest: fast delivery permits an explicitly bound local actor to extend budget with an audit label
ok 653 - fast delivery permits an explicitly bound local actor to extend budget with an audit label
  ---
  duration_ms: 74.145125
  type: 'test'
  ...
# Subtest: review budgets are isolated by run and foreign ledger events fail closed
ok 654 - review budgets are isolated by run and foreign ledger events fail closed
  ---
  duration_ms: 84.14775
  type: 'test'
  ...
# Subtest: cross-process reservations cannot overspend one run budget
ok 655 - cross-process reservations cannot overspend one run budget
  ---
  duration_ms: 215.221375
  type: 'test'
  ...
# Subtest: default governance config is valid, secret-free, and merge preserves compatible keys
ok 656 - default governance config is valid, secret-free, and merge preserves compatible keys
  ---
  duration_ms: 8.33175
  type: 'test'
  ...
# Subtest: compatibility metadata is strict, monotonic, and blocks read-only or older writers
ok 657 - compatibility metadata is strict, monotonic, and blocks read-only or older writers
  ---
  duration_ms: 6.143584
  type: 'test'
  ...
# Subtest: versioned disposition, review-event, and decision envelopes are strict
ok 658 - versioned disposition, review-event, and decision envelopes are strict
  ---
  duration_ms: 3.67
  type: 'test'
  ...
# Subtest: criterion bindings preserve exact UTF-8 content and reject digest drift
ok 659 - criterion bindings preserve exact UTF-8 content and reject digest drift
  ---
  duration_ms: 0.957375
  type: 'test'
  ...
# Subtest: transfer target normalization is canonical and rejects ambiguous short slice ids
ok 660 - transfer target normalization is canonical and rejects ambiguous short slice ids
  ---
  duration_ms: 0.219792
  type: 'test'
  ...
# Subtest: keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
ok 661 - keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
  ---
  duration_ms: 0.729083
  type: 'test'
  ...
# Subtest: legacy run governance state reads additively without inventing decisions
ok 662 - legacy run governance state reads additively without inventing decisions
  ---
  duration_ms: 0.995583
  type: 'test'
  ...
# Subtest: canonical approval records bind and verify their complete decision digest
ok 663 - canonical approval records bind and verify their complete decision digest
  ---
  duration_ms: 1.45675
  type: 'test'
  ...
# Subtest: approval parity distinguishes structured-count drift from binding drift
ok 664 - approval parity distinguishes structured-count drift from binding drift
  ---
  duration_ms: 2.421834
  type: 'test'
  ...
# Subtest: profile and disposition approval digests are deterministic across equivalent ordering
ok 665 - profile and disposition approval digests are deterministic across equivalent ordering
  ---
  duration_ms: 1.108958
  type: 'test'
  ...
# Subtest: approval criteria preserve the raw acceptance collections used for bound counts
ok 666 - approval criteria preserve the raw acceptance collections used for bound counts
  ---
  duration_ms: 0.387
  type: 'test'
  ...
# Subtest: condition policy is default-deny, uses allow-only union matching, and keeps release denied
ok 667 - condition policy is default-deny, uses allow-only union matching, and keeps release denied
  ---
  duration_ms: 4.23
  type: 'test'
  ...
# Subtest: condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
ok 668 - condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
  ---
  duration_ms: 2.023625
  type: 'test'
  ...
# Subtest: condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
ok 669 - condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
  ---
  duration_ms: 3.766542
  type: 'test'
  ...
# Subtest: condition disposition replacement is explicit and never becomes current implicitly
ok 670 - condition disposition replacement is explicit and never becomes current implicitly
  ---
  duration_ms: 1.099041
  type: 'test'
  ...
# Subtest: condition eligibility keeps transfer-blocker and final approval authorizations independent
ok 671 - condition eligibility keeps transfer-blocker and final approval authorizations independent
  ---
  duration_ms: 0.532333
  type: 'test'
  ...
# Subtest: conditioned candidates are explicitly non-final publication records
ok 672 - conditioned candidates are explicitly non-final publication records
  ---
  duration_ms: 0.983042
  type: 'test'
  ...
# Subtest: governance config rejects secret-bearing compatible keys
ok 673 - governance config rejects secret-bearing compatible keys
  ---
  duration_ms: 4.831084
  type: 'test'
  ...
# Subtest: governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
ok 674 - governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
  ---
  duration_ms: 6.073875
  type: 'test'
  ...
# Subtest: readGovernanceConfig distinguishes absent namespace from default resolution
ok 675 - readGovernanceConfig distinguishes absent namespace from default resolution
  ---
  duration_ms: 5.895791
  type: 'test'
  ...
# Subtest: stable policy digest ignores object key insertion order and excludes a stored digest
ok 676 - stable policy digest ignores object key insertion order and excludes a stored digest
  ---
  duration_ms: 0.168917
  type: 'test'
  ...
# Subtest: profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
ok 677 - profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
  ---
  duration_ms: 1.138375
  type: 'test'
  ...
# Subtest: authorization uses only explicit bindings and defaults to deny
ok 678 - authorization uses only explicit bindings and defaults to deny
  ---
  duration_ms: 0.635125
  type: 'test'
  ...
# Subtest: local actors are labeled and cannot authorize high-assurance mutations
ok 679 - local actors are labeled and cannot authorize high-assurance mutations
  ---
  duration_ms: 0.39625
  type: 'test'
  ...
# Subtest: authorization independence compares the canonical actor bound to provider subjects
ok 680 - authorization independence compares the canonical actor bound to provider subjects
  ---
  duration_ms: 0.1245
  type: 'test'
  ...
# Subtest: authorization selects bindings only by exact provider subject or explicit local actor key
ok 681 - authorization selects bindings only by exact provider subject or explicit local actor key
  ---
  duration_ms: 0.805875
  type: 'test'
  ...
# Subtest: strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
ok 682 - strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
  ---
  duration_ms: 2.0045
  type: 'test'
  ...
# Subtest: strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
ok 683 - strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
  ---
  duration_ms: 1.391625
  type: 'test'
  ...
# Subtest: phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
ok 684 - phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
  ---
  duration_ms: 0.103166
  type: 'test'
  ...
# Subtest: phase-aware projection applies the versioned review policy deterministically to both profiles
ok 685 - phase-aware projection applies the versioned review policy deterministically to both profiles
  ---
  duration_ms: 0.492709
  type: 'test'
  ...
# Subtest: finding fingerprint uses only normalized invariant identity fields
ok 686 - finding fingerprint uses only normalized invariant identity fields
  ---
  duration_ms: 0.228125
  type: 'test'
  ...
# Subtest: reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
ok 687 - reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
  ---
  duration_ms: 3.094708
  type: 'test'
  ...
# Subtest: supersession creates lineage without silently closing the prior finding
ok 688 - supersession creates lineage without silently closing the prior finding
  ---
  duration_ms: 0.412625
  type: 'test'
  ...
# Subtest: reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
ok 689 - reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
  ---
  duration_ms: 1.813708
  type: 'test'
  ...
# Subtest: AI run state can be created, read, updated, and rendered
ok 690 - AI run state can be created, read, updated, and rendered
  ---
  duration_ms: 54.824708
  type: 'test'
  ...
# Subtest: AI run listing fails closed when a run namespace is a symlink
ok 691 - AI run listing fails closed when a run namespace is a symlink
  ---
  duration_ms: 42.9935
  type: 'test'
  ...
# Subtest: AI run phase guard blocks future-phase commands with next-step guidance
ok 692 - AI run phase guard blocks future-phase commands with next-step guidance
  ---
  duration_ms: 50.652709
  type: 'test'
  ...
# Subtest: an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
ok 693 - an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
  ---
  duration_ms: 72.829125
  type: 'test'
  ...
# Subtest: AI run approvals metadata and locks are persisted safely
ok 694 - AI run approvals metadata and locks are persisted safely
  ---
  duration_ms: 30.276292
  type: 'test'
  ...
# Subtest: governed run selection is unambiguous and profile binding cannot downgrade
ok 695 - governed run selection is unambiguous and profile binding cannot downgrade
  ---
  duration_ms: 69.307625
  type: 'test'
  ...
# Subtest: run governance state is correlated and written inside the run lock
ok 696 - run governance state is correlated and written inside the run lock
  ---
  duration_ms: 24.633541
  type: 'test'
  ...
# Subtest: run lock remains held until an asynchronous callback settles
ok 697 - run lock remains held until an asynchronous callback settles
  ---
  duration_ms: 22.150791
  type: 'test'
  ...
# Subtest: run locks normalize aliases and release only the lock instance they own
ok 698 - run locks normalize aliases and release only the lock instance they own
  ---
  duration_ms: 2.150792
  type: 'test'
  ...
# Subtest: governed phase transitions share the run lock with governance commits
ok 699 - governed phase transitions share the run lock with governance commits
  ---
  duration_ms: 29.476083
  type: 'test'
  ...
# Subtest: digest-bound approval commit rolls back every injected write failure without partial state
ok 700 - digest-bound approval commit rolls back every injected write failure without partial state
  ---
  duration_ms: 765.868833
  type: 'test'
  ...
# Subtest: approval WAL makes readers fail closed and recovery rolls back idempotently
ok 701 - approval WAL makes readers fail closed and recovery rolls back idempotently
  ---
  duration_ms: 144.920209
  type: 'test'
  ...
# Subtest: canonical run readers reject copied or foreign run identities
ok 702 - canonical run readers reject copied or foreign run identities
  ---
  duration_ms: 63.64725
  type: 'test'
  ...
# Subtest: approval recovery rejects a validly rehashed WAL with a non-canonical target
ok 703 - approval recovery rejects a validly rehashed WAL with a non-canonical target
  ---
  duration_ms: 78.036542
  type: 'test'
  ...
# Subtest: normal approval commit validates its exact target allowlist before writing the WAL
ok 704 - normal approval commit validates its exact target allowlist before writing the WAL
  ---
  duration_ms: 74.20225
  type: 'test'
  ...
# Subtest: digest-bound approval commit rejects an in-project symlinked run target
ok 705 - digest-bound approval commit rejects an in-project symlinked run target
  ---
  duration_ms: 164.560125
  type: 'test'
  ...
# Subtest: digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
ok 706 - digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
  ---
  duration_ms: 110.64575
  type: 'test'
  ...
# Subtest: digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
ok 707 - digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
  ---
  duration_ms: 254.327916
  type: 'test'
  ...
# Subtest: safety excludes secrets, generated outputs, caches, and ssh material
ok 708 - safety excludes secrets, generated outputs, caches, and ssh material
  ---
  duration_ms: 0.883375
  type: 'test'
  ...
# Subtest: normalizeContextPath handles windows separators and paths with spaces
ok 709 - normalizeContextPath handles windows separators and paths with spaces
  ---
  duration_ms: 0.115917
  type: 'test'
  ...
# Subtest: filterContextPaths keeps safe entries and returns exclusion reasons
ok 710 - filterContextPaths keeps safe entries and returns exclusion reasons
  ---
  duration_ms: 0.835875
  type: 'test'
  ...
# Subtest: prompt safety text establishes instruction hierarchy and repo-data boundary
ok 711 - prompt safety text establishes instruction hierarchy and repo-data boundary
  ---
  duration_ms: 0.091958
  type: 'test'
  ...
# Subtest: parseApprovedManifest falls back to markdown headings when JSON is unavailable
ok 712 - parseApprovedManifest falls back to markdown headings when JSON is unavailable
  ---
  duration_ms: 2.395208
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
ok 713 - buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
  ---
  duration_ms: 1.961334
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest preserves every approved implementation slice
ok 714 - buildSpecGenerationManifest preserves every approved implementation slice
  ---
  duration_ms: 0.6985
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
ok 715 - buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
  ---
  duration_ms: 0.408458
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects plans without structured slices
ok 716 - buildSpecGenerationManifest rejects plans without structured slices
  ---
  duration_ms: 0.244208
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
ok 717 - buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
  ---
  duration_ms: 0.407458
  type: 'test'
  ...
# Subtest: generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
ok 718 - generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
  ---
  duration_ms: 58.50375
  type: 'test'
  ...
# Subtest: generateSpecArtifacts fails before writing when structured slices are missing
ok 719 - generateSpecArtifacts fails before writing when structured slices are missing
  ---
  duration_ms: 0.850209
  type: 'test'
  ...
# Subtest: governed spec generation publishes one digest-bound manifest and derives all projections from it
ok 720 - governed spec generation publishes one digest-bound manifest and derives all projections from it
  ---
  duration_ms: 49.375958
  type: 'test'
  ...
# Subtest: governance projections escape marker, newline, and backtick injection without changing the manifest
ok 721 - governance projections escape marker, newline, and backtick injection without changing the manifest
  ---
  duration_ms: 15.220041
  type: 'test'
  ...
# Subtest: criterion binding preserves exact bytes while resolving parser-normalized approved content
ok 722 - criterion binding preserves exact bytes while resolving parser-normalized approved content
  ---
  duration_ms: 1.618375
  type: 'test'
  ...
# Subtest: governance target ambiguity fails before any spec artifact is published
ok 723 - governance target ambiguity fails before any spec artifact is published
  ---
  duration_ms: 0.394959
  type: 'test'
  ...
# Subtest: canonical governance root resolves the primary checkout from a linked worktree
ok 724 - canonical governance root resolves the primary checkout from a linked worktree
  ---
  duration_ms: 251.016083
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
ok 725 - parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
  ---
  duration_ms: 5.961709
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
ok 726 - parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
  ---
  duration_ms: 0.613875
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
ok 727 - parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
  ---
  duration_ms: 0.510542
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
ok 728 - parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
  ---
  duration_ms: 1.612291
  type: 'test'
  ...
# Subtest: repairAnalyzeProjectValue refuses unsafe additional properties
ok 729 - repairAnalyzeProjectValue refuses unsafe additional properties
  ---
  duration_ms: 0.200542
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectRepairManifest writes an auditable run artifact
ok 730 - writeAnalyzeProjectRepairManifest writes an auditable run artifact
  ---
  duration_ms: 13.764042
  type: 'test'
  ...
# Subtest: planner approvals persist draft and approved metadata with status summaries
ok 731 - planner approvals persist draft and approved metadata with status summaries
  ---
  duration_ms: 78.524583
  type: 'test'
  ...
# Subtest: planner approvals keep multiple drafts and only approve the current version
ok 732 - planner approvals keep multiple drafts and only approve the current version
  ---
  duration_ms: 175.144708
  type: 'test'
  ...
# Subtest: legacy planner approval writer rejects approved-with-conditions without creating approved.md
ok 733 - legacy planner approval writer rejects approved-with-conditions without creating approved.md
  ---
  duration_ms: 76.140333
  type: 'test'
  ...
# Subtest: planner approval candidates expose current draft, history, and safe previews
ok 734 - planner approval candidates expose current draft, history, and safe previews
  ---
  duration_ms: 206.134291
  type: 'test'
  ...
# Subtest: planner approvals block unapproved or stale inputs before later phases
ok 735 - planner approvals block unapproved or stale inputs before later phases
  ---
  duration_ms: 342.105625
  type: 'test'
  ...
# Subtest: planner drafts persist exact artifact and input byte digests
ok 736 - planner drafts persist exact artifact and input byte digests
  ---
  duration_ms: 83.595583
  type: 'test'
  ...
# Subtest: digest-bound projection rejects artifact and input tampering without approving
ok 737 - digest-bound projection rejects artifact and input tampering without approving
  ---
  duration_ms: 67.699542
  type: 'test'
  ...
# Subtest: content loss persists a corrupted immutable candidate without replacing current or approval history
ok 738 - content loss persists a corrupted immutable candidate without replacing current or approval history
  ---
  duration_ms: 128.662708
  type: 'test'
  ...
# Subtest: unsupported free text remains inspectable but never becomes current automatically
ok 739 - unsupported free text remains inspectable but never becomes current automatically
  ---
  duration_ms: 69.114
  type: 'test'
  ...
# Subtest: draft projection journal rolls forward deterministically from every committed crash point
ok 740 - draft projection journal rolls forward deterministically from every committed crash point
  ---
  duration_ms: 552.016917
  type: 'test'
  ...
# Subtest: a crash before journal publication leaves an immutable orphan and unchanged projections
ok 741 - a crash before journal publication leaves an immutable orphan and unchanged projections
  ---
  duration_ms: 96.271208
  type: 'test'
  ...
# Subtest: corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
ok 742 - corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
  ---
  duration_ms: 195.987
  type: 'test'
  ...
# Subtest: v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
ok 743 - v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
  ---
  duration_ms: 325.398834
  type: 'test'
  ...
# Subtest: draft recovery respects governance read-only mode without changing marker or projections
ok 744 - draft recovery respects governance read-only mode without changing marker or projections
  ---
  duration_ms: 71.113541
  type: 'test'
  ...
# Subtest: project file byte reader rejects path traversal outside the project root
ok 745 - project file byte reader rejects path traversal outside the project root
  ---
  duration_ms: 0.630209
  type: 'test'
  ...
# Subtest: project file byte reader rejects symlinks that resolve outside the project root
ok 746 - project file byte reader rejects symlinks that resolve outside the project root
  ---
  duration_ms: 1.383833
  type: 'test'
  ...
# Subtest: project file byte reader rejects in-project symlink aliases
ok 747 - project file byte reader rejects in-project symlink aliases
  ---
  duration_ms: 0.691583
  type: 'test'
  ...
# Subtest: empty Brain initialization is stable and idempotent
ok 748 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 80.2385
  type: 'test'
  ...
# Subtest: protected operations do not lazily recreate an absent Brain
ok 749 - protected operations do not lazily recreate an absent Brain
  ---
  duration_ms: 11.916708
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 750 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 940.623208
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 751 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 200.615583
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 752 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 160.510042
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 753 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 70.888708
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 754 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 49.225542
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 755 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 55.818208
  type: 'test'
  ...
# Subtest: the supported local v58 decision representation binds the exact approved artifact
ok 756 - the supported local v58 decision representation binds the exact approved artifact
  ---
  duration_ms: 0.694042
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 757 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 56.15875
  type: 'test'
  ...
# Subtest: concurrent appends either serialize or return an explicit lock conflict
ok 758 - concurrent appends either serialize or return an explicit lock conflict
  ---
  duration_ms: 106.33775
  type: 'test'
  ...
# Subtest: read-only v58 compatibility blocks every Brain writer before mutation
ok 759 - read-only v58 compatibility blocks every Brain writer before mutation
  ---
  duration_ms: 46.853542
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 760 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 67.587208
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 761 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 30.188208
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 762 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 116.990833
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 763 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 116.628125
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 764 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 110.544625
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 765 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 127.452625
  type: 'test'
  ...
# Subtest: default export is deterministic, complete, portable, and keeps safe record links
ok 766 - default export is deterministic, complete, portable, and keeps safe record links
  ---
  duration_ms: 352.484083
  type: 'test'
  ...
# Subtest: an edited Markdown vault imports only a non-effective proposal
ok 767 - an edited Markdown vault imports only a non-effective proposal
  ---
  duration_ms: 293.686042
  type: 'test'
  ...
# Subtest: proposal bodies cannot grant authority and require the explicit propose grant
ok 768 - proposal bodies cannot grant authority and require the explicit propose grant
  ---
  duration_ms: 50.632833
  type: 'test'
  ...
# Subtest: an interrupted proposal commit recovers without activating proposal records
ok 769 - an interrupted proposal commit recovers without activating proposal records
  ---
  duration_ms: 137.8395
  type: 'test'
  ...
# Subtest: export validates secrets, destinations, references, and symlinks before writes
ok 770 - export validates secrets, destinations, references, and symlinks before writes
  ---
  duration_ms: 134.885417
  type: 'test'
  ...
# Subtest: export revalidates a destination changed to a symlink during authorization
ok 771 - export revalidates a destination changed to a symlink during authorization
  ---
  duration_ms: 58.372
  type: 'test'
  ...
# Subtest: export stays coherent when the Brain advances during authorization
ok 772 - export stays coherent when the Brain advances during authorization
  ---
  duration_ms: 138.94875
  type: 'test'
  ...
# Subtest: delete dry-run is byte-preserving and real delete quarantines only the Brain
ok 773 - delete dry-run is byte-preserving and real delete quarantines only the Brain
  ---
  duration_ms: 146.057167
  type: 'test'
  ...
# Subtest: complete snapshot is not constrained by the public query limit
ok 774 - complete snapshot is not constrained by the public query limit
  ---
  duration_ms: 1331.204375
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
ok 775 - check-slice passes for a completed slice without optional dependency fields
  ---
  duration_ms: 231.964459
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring remote or base branches
ok 776 - check-slice --local validates structure without requiring remote or base branches
  ---
  duration_ms: 253.401917
  type: 'test'
  ...
# Subtest: check-slice --local renders English output when requested
ok 777 - check-slice --local renders English output when requested
  ---
  duration_ms: 116.579417
  type: 'test'
  ...
# Subtest: check-slice --local rejects missing execution git metadata
ok 778 - check-slice --local rejects missing execution git metadata
  ---
  duration_ms: 47.608958
  type: 'test'
  ...
# Subtest: check-slice --local rejects scope paths outside the project
ok 779 - check-slice --local rejects scope paths outside the project
  ---
  duration_ms: 59.101416
  type: 'test'
  ...
# Subtest: check-slice rejects an external absolute slice path even if it contains specs
ok 780 - check-slice rejects an external absolute slice path even if it contains specs
  ---
  duration_ms: 23.981958
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring a Git repository
ok 781 - check-slice --local validates structure without requiring a Git repository
  ---
  duration_ms: 56.624416
  type: 'test'
  ...
# Subtest: check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
ok 782 - check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
  ---
  duration_ms: 63.361041
  type: 'test'
  ...
# Subtest: check-slice default mode gives local/base guidance when no base exists
ok 783 - check-slice default mode gives local/base guidance when no base exists
  ---
  duration_ms: 126.972667
  type: 'test'
  ...
# Subtest: check-slice supports an explicit local base branch
ok 784 - check-slice supports an explicit local base branch
  ---
  duration_ms: 223.462291
  type: 'test'
  ...
# Subtest: check-pr uses slice base branch instead of hardcoded origin/develop
ok 785 - check-pr uses slice base branch instead of hardcoded origin/develop
  ---
  duration_ms: 362.205542
  type: 'test'
  ...
# Subtest: check-slice rejects missing depends_on targets
ok 786 - check-slice rejects missing depends_on targets
  ---
  duration_ms: 151.488
  type: 'test'
  ...
# Subtest: check-slice rejects cycles introduced by depends_on
ok 787 - check-slice rejects cycles introduced by depends_on
  ---
  duration_ms: 179.347167
  type: 'test'
  ...
# Subtest: check-slice requires a parallel_safe_reason when parallel_safe is never
ok 788 - check-slice requires a parallel_safe_reason when parallel_safe is never
  ---
  duration_ms: 287.260792
  type: 'test'
  ...
# Subtest: check-slice projects governed pending findings from one verified manifest
ok 789 - check-slice projects governed pending findings from one verified manifest
  ---
  duration_ms: 71.505708
  type: 'test'
  ...
# Subtest: check-slice verifies a real manifest self-digest against the primary canonical run store
ok 790 - check-slice verifies a real manifest self-digest against the primary canonical run store
  ---
  duration_ms: 210.028083
  type: 'test'
  ...
# Subtest: check-slice with an explicit run cannot degrade to legacy when the manifest is absent
ok 791 - check-slice with an explicit run cannot degrade to legacy when the manifest is absent
  ---
  duration_ms: 102.123416
  type: 'test'
  ...
# Subtest: a generated manifest declaration prevents legacy downgrade for slices and PRs
ok 792 - a generated manifest declaration prevents legacy downgrade for slices and PRs
  ---
  duration_ms: 68.46275
  type: 'test'
  ...
# Subtest: check-slice rejects stale, unknown, and reordered SPEC traceability projections
ok 793 - check-slice rejects stale, unknown, and reordered SPEC traceability projections
  ---
  duration_ms: 314.545375
  type: 'test'
  ...
# Subtest: check-slice rejects omitted and unknown governed finding projections
ok 794 - check-slice rejects omitted and unknown governed finding projections
  ---
  duration_ms: 142.912958
  type: 'test'
  ...
# Subtest: check-slice rejects canonical governance field drift in execution briefs
ok 795 - check-slice rejects canonical governance field drift in execution briefs
  ---
  duration_ms: 381.289875
  type: 'test'
  ...
# Subtest: check-slice requires the canonical governance heading inside marked blocks
ok 796 - check-slice requires the canonical governance heading inside marked blocks
  ---
  duration_ms: 80.891042
  type: 'test'
  ...
# Subtest: check-slice fails closed when a target finding is neither closed nor accepted
ok 797 - check-slice fails closed when a target finding is neither closed nor accepted
  ---
  duration_ms: 58.740875
  type: 'test'
  ...
# Subtest: check-slice propagates orphaned, stale, and unresolved governance failures
ok 798 - check-slice propagates orphaned, stale, and unresolved governance failures
  ---
  duration_ms: 126.450292
  type: 'test'
  ...
# Subtest: check-pr rejects a governed slice PR that omits its finding block
ok 799 - check-pr rejects a governed slice PR that omits its finding block
  ---
  duration_ms: 204.734791
  type: 'test'
  ...
# Subtest: PR governance readiness rejects canonical field drift with unchanged finding ids
ok 800 - PR governance readiness rejects canonical field drift with unchanged finding ids
  ---
  duration_ms: 2.120167
  type: 'test'
  ...
# Subtest: splitEditorCommand handles quoted commands and arguments
ok 801 - splitEditorCommand handles quoted commands and arguments
  ---
  duration_ms: 1.658875
  type: 'test'
  ...
# Subtest: resolveEditor prefers VISUAL over EDITOR and keeps arguments
ok 802 - resolveEditor prefers VISUAL over EDITOR and keeps arguments
  ---
  duration_ms: 0.21175
  type: 'test'
  ...
# Subtest: resolveEditor falls back to platform editor when env is empty
ok 803 - resolveEditor falls back to platform editor when env is empty
  ---
  duration_ms: 0.138125
  type: 'test'
  ...
# Subtest: defaultEditorForPlatform uses notepad on Windows and vi elsewhere
ok 804 - defaultEditorForPlatform uses notepad on Windows and vi elsewhere
  ---
  duration_ms: 0.0635
  type: 'test'
  ...
# Subtest: openEditor invokes the resolved editor without a shell
ok 805 - openEditor invokes the resolved editor without a shell
  ---
  duration_ms: 0.118792
  type: 'test'
  ...
# Subtest: openEditor reports cancellation for missing or failed editor execution
ok 806 - openEditor reports cancellation for missing or failed editor execution
  ---
  duration_ms: 0.075
  type: 'test'
  ...
# Subtest: normalizeSelectorOptions keeps labels human-friendly and values stable
ok 807 - normalizeSelectorOptions keeps labels human-friendly and values stable
  ---
  duration_ms: 1.523708
  type: 'test'
  ...
# Subtest: selectOption returns explicit non-interactive choice
ok 808 - selectOption returns explicit non-interactive choice
  ---
  duration_ms: 0.502042
  type: 'test'
  ...
# Subtest: selectOption uses default without prompting in no-TTY mode
ok 809 - selectOption uses default without prompting in no-TTY mode
  ---
  duration_ms: 0.536917
  type: 'test'
  ...
# Subtest: selectOption fails actionably when no default is available outside interactive mode
ok 810 - selectOption fails actionably when no default is available outside interactive mode
  ---
  duration_ms: 0.435167
  type: 'test'
  ...
# Subtest: selectOption uses injected prompt selector only in interactive TTY mode
ok 811 - selectOption uses injected prompt selector only in interactive TTY mode
  ---
  duration_ms: 1.547167
  type: 'test'
  ...
# Subtest: promptText returns explicit values without prompting
ok 812 - promptText returns explicit values without prompting
  ---
  duration_ms: 0.20925
  type: 'test'
  ...
# Subtest: promptText uses injected prompt text in interactive TTY mode
ok 813 - promptText uses injected prompt text in interactive TTY mode
  ---
  duration_ms: 1.191916
  type: 'test'
  ...
# Subtest: promptText fails actionably without TTY or explicit value
ok 814 - promptText fails actionably without TTY or explicit value
  ---
  duration_ms: 0.14825
  type: 'test'
  ...
# Subtest: Quiver theme exposes the approved brand color tokens
ok 815 - Quiver theme exposes the approved brand color tokens
  ---
  duration_ms: 1.48025
  type: 'test'
  ...
# Subtest: color output is disabled for machine and unsupported modes
ok 816 - color output is disabled for machine and unsupported modes
  ---
  duration_ms: 0.374917
  type: 'test'
  ...
# Subtest: color output uses ANSI truecolor only for human TTY mode
ok 817 - color output uses ANSI truecolor only for human TTY mode
  ---
  duration_ms: 0.254167
  type: 'test'
  ...
# Subtest: theme falls back to plain ASCII when unicode is unavailable
ok 818 - theme falls back to plain ASCII when unicode is unavailable
  ---
  duration_ms: 0.098458
  type: 'test'
  ...
# Subtest: theme keeps text readable when color is disabled
ok 819 - theme keeps text readable when color is disabled
  ---
  duration_ms: 0.064958
  type: 'test'
  ...
# Subtest: resolveUxMode disables decoration, prompts, and spinners for machine modes
ok 820 - resolveUxMode disables decoration, prompts, and spinners for machine modes
  ---
  duration_ms: 2.011459
  type: 'test'
  ...
# Subtest: resolveUxMode enables prompts only for explicit interactive TTY use
ok 821 - resolveUxMode enables prompts only for explicit interactive TTY use
  ---
  duration_ms: 0.181792
  type: 'test'
  ...
# Subtest: withSpinner uses clack spinner only in human TTY mode
ok 822 - withSpinner uses clack spinner only in human TTY mode
  ---
  duration_ms: 2.01075
  type: 'test'
  ...
# Subtest: withSpinner prints plain text without symbols for no-TTY mode
ok 823 - withSpinner prints plain text without symbols for no-TTY mode
  ---
  duration_ms: 0.173416
  type: 'test'
  ...
# Subtest: JSON mode suppresses UX text output
ok 824 - JSON mode suppresses UX text output
  ---
  duration_ms: 0.195208
  type: 'test'
  ...
# Subtest: human output helpers render branded hierarchy in TTY mode
ok 825 - human output helpers render branded hierarchy in TTY mode
  ---
  duration_ms: 0.248583
  type: 'test'
  ...
# Subtest: human output helpers fall back to plain text in no-TTY mode
ok 826 - human output helpers fall back to plain text in no-TTY mode
  ---
  duration_ms: 0.082333
  type: 'test'
  ...
# Subtest: taskGroup runs real stages and writes checks for non-spinner stages
ok 827 - taskGroup runs real stages and writes checks for non-spinner stages
  ---
  duration_ms: 0.2595
  type: 'test'
  ...
# Subtest: promptConfirm requires explicit interactive TTY mode
ok 828 - promptConfirm requires explicit interactive TTY mode
  ---
  duration_ms: 0.690375
  type: 'test'
  ...
# Subtest: promptConfirm uses injected confirmation in interactive TTY mode
ok 829 - promptConfirm uses injected confirmation in interactive TTY mode
  ---
  duration_ms: 0.340792
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends apply for clean creates
ok 830 - analyze-project apply selector recommends apply for clean creates
  ---
  duration_ms: 0.4045
  type: 'test'
  ...
# Subtest: analyze-project apply selector is disabled in CI even with TTY streams
ok 831 - analyze-project apply selector is disabled in CI even with TTY streams
  ---
  duration_ms: 0.076709
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends diff for dirty updates
ok 832 - analyze-project apply selector recommends diff for dirty updates
  ---
  duration_ms: 0.117959
  type: 'test'
  ...
# Subtest: analyze-project apply diff preview is bounded and marks truncation
ok 833 - analyze-project apply diff preview is bounded and marks truncation
  ---
  duration_ms: 0.111708
  type: 'test'
  ...
# Subtest: collectDashboardReport separates global progress from visible filtered progress
ok 834 - collectDashboardReport separates global progress from visible filtered progress
  ---
  duration_ms: 36.77375
  type: 'test'
  ...
# Subtest: collectDashboardReport includes completed slices only when requested and never leaks evidence values
ok 835 - collectDashboardReport includes completed slices only when requested and never leaks evidence values
  ---
  duration_ms: 9.404375
  type: 'test'
  ...
# Subtest: collectDashboardReport handles zero-slice specs
ok 836 - collectDashboardReport handles zero-slice specs
  ---
  duration_ms: 5.874
  type: 'test'
  ...
# Subtest: collectDashboardReport reports graph errors without throwing
ok 837 - collectDashboardReport reports graph errors without throwing
  ---
  duration_ms: 20.231709
  type: 'test'
  ...
# Subtest: collectDashboardReport rejects an explicit unknown spec
ok 838 - collectDashboardReport rejects an explicit unknown spec
  ---
  duration_ms: 8.451917
  type: 'test'
  ...
# Subtest: formatHumanDashboard exposes the core dashboard sections
ok 839 - formatHumanDashboard exposes the core dashboard sections
  ---
  duration_ms: 7.70325
  type: 'test'
  ...
# Subtest: formatHumanDashboard keeps large default output compact and actionable
ok 840 - formatHumanDashboard keeps large default output compact and actionable
  ---
  duration_ms: 14.504666
  type: 'test'
  ...
# Subtest: formatHumanDashboard supports details and section views
ok 841 - formatHumanDashboard supports details and section views
  ---
  duration_ms: 11.809375
  type: 'test'
  ...
# Subtest: normalizeDashboardOptions rejects ambiguous or invalid human flags
ok 842 - normalizeDashboardOptions rejects ambiguous or invalid human flags
  ---
  duration_ms: 0.426083
  type: 'test'
  ...
# Subtest: collectLayoutReport detects a new no-spec layout as valid
ok 843 - collectLayoutReport detects a new no-spec layout as valid
  ---
  duration_ms: 12.079458
  type: 'test'
  ...
# Subtest: collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
ok 844 - collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
  ---
  duration_ms: 19.169208
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing tools, auth, and spaced paths
ok 845 - collectEnvironmentWarnings reports missing tools, auth, and spaced paths
  ---
  duration_ms: 1.797834
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing gh with cross-platform guidance
ok 846 - collectEnvironmentWarnings reports missing gh with cross-platform guidance
  ---
  duration_ms: 0.344292
  type: 'test'
  ...
# Subtest: formatActionableError includes failure, impact, fix, and next command
ok 847 - formatActionableError includes failure, impact, fix, and next command
  ---
  duration_ms: 0.115125
  type: 'test'
  ...
# Subtest: draft lifecycle vocabulary is explicit and bounded
ok 848 - draft lifecycle vocabulary is explicit and bounded
  ---
  duration_ms: 1.301208
  type: 'test'
  ...
# Subtest: markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
ok 849 - markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
  ---
  duration_ms: 1.086083
  type: 'test'
  ...
# Subtest: structured extraction supports exact collections, references, and v58 acceptance arrays
ok 850 - structured extraction supports exact collections, references, and v58 acceptance arrays
  ---
  duration_ms: 0.934333
  type: 'test'
  ...
# Subtest: preservation compares structural identity rather than word count
ok 851 - preservation compares structural identity rather than word count
  ---
  duration_ms: 0.940917
  type: 'test'
  ...
# Subtest: missing identity and required collection are diagnosed as corruption
ok 852 - missing identity and required collection are diagnosed as corruption
  ---
  duration_ms: 0.246166
  type: 'test'
  ...
# Subtest: explicit deletion is accepted only when the exact identity and references are removed
ok 853 - explicit deletion is accepted only when the exact identity and references are removed
  ---
  duration_ms: 0.444625
  type: 'test'
  ...
# Subtest: duplicates, broken references, malformed structured content, and free text fail closed
ok 854 - duplicates, broken references, malformed structured content, and free text fail closed
  ---
  duration_ms: 0.328875
  type: 'test'
  ...
# Subtest: redactSecrets removes common token and password patterns
ok 855 - redactSecrets removes common token and password patterns
  ---
  duration_ms: 1.048833
  type: 'test'
  ...
# Subtest: truncateText marks long output without changing short output
ok 856 - truncateText marks long output without changing short output
  ---
  duration_ms: 0.768292
  type: 'test'
  ...
# Subtest: defaultEvidencePath writes under .quiver evidence
ok 857 - defaultEvidencePath writes under .quiver evidence
  ---
  duration_ms: 4.148375
  type: 'test'
  ...
# Subtest: runEvidenceCommand records redacted and truncated output
ok 858 - runEvidenceCommand records redacted and truncated output
  ---
  duration_ms: 1.80725
  type: 'test'
  ...
# Subtest: runEvidenceCommand rejects traversal output before spawning child
ok 859 - runEvidenceCommand rejects traversal output before spawning child
  ---
  duration_ms: 0.535666
  type: 'test'
  ...
# Subtest: evidence path policy rejects symlink output and read escapes
ok 860 - evidence path policy rejects symlink output and read escapes
  ---
  duration_ms: 1.389417
  type: 'test'
  ...
# Subtest: runEvidenceCommand records signal metadata and signal exit code
ok 861 - runEvidenceCommand records signal metadata and signal exit code
  ---
  duration_ms: 1.607167
  type: 'test'
  ...
# Subtest: listEvidenceFiles and showEvidenceFile return parseable safe records
ok 862 - listEvidenceFiles and showEvidenceFile return parseable safe records
  ---
  duration_ms: 3.076917
  type: 'test'
  ...
# Subtest: withWindowsLongPaths enables core.longpaths on Windows git commands
ok 863 - withWindowsLongPaths enables core.longpaths on Windows git commands
  ---
  duration_ms: 1.281
  type: 'test'
  ...
# Subtest: withWindowsLongPaths leaves non-Windows git commands unchanged
ok 864 - withWindowsLongPaths leaves non-Windows git commands unchanged
  ---
  duration_ms: 0.069791
  type: 'test'
  ...
# Subtest: base branch candidates keep explicit override before all defaults
ok 865 - base branch candidates keep explicit override before all defaults
  ---
  duration_ms: 79.217917
  type: 'test'
  ...
# Subtest: base branch resolution uses remote HEAD when available
ok 866 - base branch resolution uses remote HEAD when available
  ---
  duration_ms: 160.894
  type: 'test'
  ...
# Subtest: base branch resolution falls back to local main, master, then develop
ok 867 - base branch resolution falls back to local main, master, then develop
  ---
  duration_ms: 240.159958
  type: 'test'
  ...
# Subtest: check-handoff keeps validating the legacy spec handoff contract
ok 868 - check-handoff keeps validating the legacy spec handoff contract
  ---
  duration_ms: 2.511583
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice execution briefs
ok 869 - check-handoff validates per-slice execution briefs
  ---
  duration_ms: 1.348792
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice closure briefs
ok 870 - check-handoff validates per-slice closure briefs
  ---
  duration_ms: 1.274292
  type: 'test'
  ...
# Subtest: check-handoff rejects incomplete per-slice execution briefs with an actionable error
ok 871 - check-handoff rejects incomplete per-slice execution briefs with an actionable error
  ---
  duration_ms: 2.386416
  type: 'test'
  ...
# Subtest: check-handoff renders Spanish missing-section guidance when requested
ok 872 - check-handoff renders Spanish missing-section guidance when requested
  ---
  duration_ms: 2.062167
  type: 'test'
  ...
# Subtest: catalogs expose supported languages and version metadata
ok 873 - catalogs expose supported languages and version metadata
  ---
  duration_ms: 0.993083
  type: 'test'
  ...
# Subtest: catalog completeness is enforced across en and es
ok 874 - catalog completeness is enforced across en and es
  ---
  duration_ms: 34.362708
  type: 'test'
  ...
# Subtest: translate supports interpolation and predictable missing params
ok 875 - translate supports interpolation and predictable missing params
  ---
  duration_ms: 3.111375
  type: 'test'
  ...
# Subtest: translate sanitizes unsafe interpolation values
ok 876 - translate sanitizes unsafe interpolation values
  ---
  duration_ms: 0.17175
  type: 'test'
  ...
# Subtest: translate supports one and other plural forms
ok 877 - translate supports one and other plural forms
  ---
  duration_ms: 0.390834
  type: 'test'
  ...
# Subtest: fallback to en is explicit and deterministic
ok 878 - fallback to en is explicit and deterministic
  ---
  duration_ms: 0.265
  type: 'test'
  ...
# Subtest: translator keeps command snippets and flags exact
ok 879 - translator keeps command snippets and flags exact
  ---
  duration_ms: 0.251416
  type: 'test'
  ...
# Subtest: normalizes supported language and locale values
ok 880 - normalizes supported language and locale values
  ---
  duration_ms: 1.071
  type: 'test'
  ...
# Subtest: resolves language by approved precedence order
ok 881 - resolves language by approved precedence order
  ---
  duration_ms: 3.309875
  type: 'test'
  ...
# Subtest: uses global config when project config is missing
ok 882 - uses global config when project config is missing
  ---
  duration_ms: 2.267208
  type: 'test'
  ...
# Subtest: uses locale detection before default fallback
ok 883 - uses locale detection before default fallback
  ---
  duration_ms: 1.323709
  type: 'test'
  ...
# Subtest: unsupported explicit language falls back to en with actionable warning
ok 884 - unsupported explicit language falls back to en with actionable warning
  ---
  duration_ms: 0.9305
  type: 'test'
  ...
# Subtest: language config writes preserve existing keys and reject unsupported persisted values
ok 885 - language config writes preserve existing keys and reject unsupported persisted values
  ---
  duration_ms: 2.567458
  type: 'test'
  ...
# Subtest: extracts global --lang before or after command names
ok 886 - extracts global --lang before or after command names
  ---
  duration_ms: 0.240708
  type: 'test'
  ...
# Subtest: template paths normalize safely
ok 887 - template paths normalize safely
  ---
  duration_ms: 0.841917
  type: 'test'
  ...
# Subtest: human template classification excludes machine artifacts
ok 888 - human template classification excludes machine artifacts
  ---
  duration_ms: 0.167333
  type: 'test'
  ...
# Subtest: localized template convention inserts language before .template
ok 889 - localized template convention inserts language before .template
  ---
  duration_ms: 0.135792
  type: 'test'
  ...
# Subtest: template language resolution uses project config and explicit overrides
ok 890 - template language resolution uses project config and explicit overrides
  ---
  duration_ms: 1.860458
  type: 'test'
  ...
# Subtest: localized human templates resolve by language and fall back explicitly to en
ok 891 - localized human templates resolve by language and fall back explicitly to en
  ---
  duration_ms: 4.367333
  type: 'test'
  ...
# Subtest: machine artifacts are never routed through localized human templates
ok 892 - machine artifacts are never routed through localized human templates
  ---
  duration_ms: 1.941
  type: 'test'
  ...
# Subtest: localized template coverage reports missing human templates and skips machine artifacts
ok 893 - localized template coverage reports missing human templates and skips machine artifacts
  ---
  duration_ms: 2.440917
  type: 'test'
  ...
# /bin/sh: npm: No such file or directory
# Subtest: migration blocks compatibility evidence drift before its first project write
ok 894 - migration blocks compatibility evidence drift before its first project write
  ---
  duration_ms: 130.66525
  type: 'test'
  ...
# Subtest: legacy migration blocks declared older dependency drift before its first project write
ok 895 - legacy migration blocks declared older dependency drift before its first project write
  ---
  duration_ms: 77.27325
  type: 'test'
  ...
# Subtest: detectPackageManager returns npm when no lockfile exists
ok 896 - detectPackageManager returns npm when no lockfile exists
  ---
  duration_ms: 0.344
  type: 'test'
  ...
# Subtest: detectPackageManager returns yarn when yarn.lock exists
ok 897 - detectPackageManager returns yarn when yarn.lock exists
  ---
  duration_ms: 0.394
  type: 'test'
  ...
# Subtest: detectPackageManager returns pnpm when pnpm-lock.yaml exists
ok 898 - detectPackageManager returns pnpm when pnpm-lock.yaml exists
  ---
  duration_ms: 0.441916
  type: 'test'
  ...
# Subtest: detectPackageManager returns bun when bun.lockb exists
ok 899 - detectPackageManager returns bun when bun.lockb exists
  ---
  duration_ms: 0.343791
  type: 'test'
  ...
# Subtest: detectPackageManager prefers bun over pnpm over yarn over npm
ok 900 - detectPackageManager prefers bun over pnpm over yarn over npm
  ---
  duration_ms: 1.623208
  type: 'test'
  ...
# Subtest: formatInstallSelfCommand respects detected package managers
ok 901 - formatInstallSelfCommand respects detected package managers
  ---
  duration_ms: 2.755958
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-no-package-json when no package.json
ok 902 - installSelfAsDevDep returns skipped-no-package-json when no package.json
  ---
  duration_ms: 0.485958
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
ok 903 - installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
  ---
  duration_ms: 0.797917
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns failed when install command fails
ok 904 - installSelfAsDevDep returns failed when install command fails
  ---
  duration_ms: 6.974959
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes legacy scripts and exports templates only when requested
ok 905 - initializeProjectDocs writes legacy scripts and exports templates only when requested
  ---
  duration_ms: 75.242209
  type: 'test'
  ...
# Subtest: initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
ok 906 - initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
  ---
  duration_ms: 187.755333
  type: 'test'
  ...
# Subtest: initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
ok 907 - initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
  ---
  duration_ms: 164.474334
  type: 'test'
  ...
# Subtest: initializeProjectDocs fails closed without overwriting invalid governance config
ok 908 - initializeProjectDocs fails closed without overwriting invalid governance config
  ---
  duration_ms: 7.528541
  type: 'test'
  ...
# Subtest: resolveInitProfile selects default, minimal, and full profiles
ok 909 - resolveInitProfile selects default, minimal, and full profiles
  ---
  duration_ms: 0.745167
  type: 'test'
  ...
# Subtest: normalizeInitLayoutOptions rejects mutually exclusive profiles
ok 910 - normalizeInitLayoutOptions rejects mutually exclusive profiles
  ---
  duration_ms: 0.224208
  type: 'test'
  ...
# Subtest: buildInitLayout creates a default AI-first plan without legacy visible roots
ok 911 - buildInitLayout creates a default AI-first plan without legacy visible roots
  ---
  duration_ms: 3.52225
  type: 'test'
  ...
# Subtest: buildInitLayout reports preserved files instead of overwriting them
ok 912 - buildInitLayout reports preserved files instead of overwriting them
  ---
  duration_ms: 1.939625
  type: 'test'
  ...
# Subtest: buildInitLayout includes compatibility assets for full profile
ok 913 - buildInitLayout includes compatibility assets for full profile
  ---
  duration_ms: 0.443166
  type: 'test'
  ...
# Subtest: buildInitLayout includes optional legacy scripts and template export only when requested
ok 914 - buildInitLayout includes optional legacy scripts and template export only when requested
  ---
  duration_ms: 0.397542
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan prints core dry-run sections
ok 915 - formatInitLayoutPlan prints core dry-run sections
  ---
  duration_ms: 0.495042
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan reports planned language config writes
ok 916 - formatInitLayoutPlan reports planned language config writes
  ---
  duration_ms: 0.4475
  type: 'test'
  ...
# Subtest: default generated package scripts target supported CLI commands
ok 917 - default generated package scripts target supported CLI commands
  ---
  duration_ms: 0.524208
  type: 'test'
  ...
# Subtest: stripJsonComments preserves comment-like markers inside strings
ok 918 - stripJsonComments preserves comment-like markers inside strings
  ---
  duration_ms: 1.369208
  type: 'test'
  ...
# Subtest: stripJsonComments removes comments outside strings
ok 919 - stripJsonComments removes comments outside strings
  ---
  duration_ms: 0.111
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
# Worktree: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-tSX55Z/feature-QUIVER-22-05-spec-worktree-lifecycle
# Context: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-tSX55Z/feature-QUIVER-22-05-spec-worktree-lifecycle/WORKTREE_CONTEXT.md
# Subtest: startSpecWorktree creates and reuses a spec worktree on main
ok 920 - startSpecWorktree creates and reuses a spec worktree on main
  ---
  duration_ms: 427.432333
  type: 'test'
  ...
# Subtest: startSpecWorktree dry-run reports planned worktree without creating it
ok 921 - startSpecWorktree dry-run reports planned worktree without creating it
  ---
  duration_ms: 204.902875
  type: 'test'
  ...
# Subtest: startSpecWorktree supports develop as the base branch
ok 922 - startSpecWorktree supports develop as the base branch
  ---
  duration_ms: 293.275834
  type: 'test'
  ...
# Subtest: startSpecWorktree refuses to reuse a dirty existing worktree
ok 923 - startSpecWorktree refuses to reuse a dirty existing worktree
  ---
  duration_ms: 261.001459
  type: 'test'
  ...
# Subtest: startSpecWorktree reports a stale registered worktree with recovery steps
ok 924 - startSpecWorktree reports a stale registered worktree with recovery steps
  ---
  duration_ms: 233.059042
  type: 'test'
  ...
# Subtest: startSpecWorktree rejects concurrent spec operations with a lock
ok 925 - startSpecWorktree rejects concurrent spec operations with a lock
  ---
  duration_ms: 112.459709
  type: 'test'
  ...
# Subtest: startSlice refuses to create nested worktrees from an existing worktree
ok 926 - startSlice refuses to create nested worktrees from an existing worktree
  ---
  duration_ms: 237.515041
  type: 'test'
  ...
# Subtest: startSlice renders English lifecycle output when requested
ok 927 - startSlice renders English lifecycle output when requested
  ---
  duration_ms: 210.270292
  type: 'test'
  ...
# Subtest: cleanupSlice dry-run renders English lifecycle output when requested
ok 928 - cleanupSlice dry-run renders English lifecycle output when requested
  ---
  duration_ms: 228.059792
  type: 'test'
  ...
# Subtest: describeSpecState reports slice-00 status and pending slices
ok 929 - describeSpecState reports slice-00 status and pending slices
  ---
  duration_ms: 90.457875
  type: 'test'
  ...
# Subtest: ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
ok 930 - ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
  ---
  duration_ms: 84.098209
  type: 'test'
  ...
# Subtest: startSlice blocks later slices until slice-00 is completed
ok 931 - startSlice blocks later slices until slice-00 is completed
  ---
  duration_ms: 126.769458
  type: 'test'
  ...
# Subtest: model catalog exposes versioned providers and required model entries
ok 932 - model catalog exposes versioned providers and required model entries
  ---
  duration_ms: 1.35625
  type: 'test'
  ...
# Subtest: model aliases are case-insensitive and tolerant of spaces and dashes
ok 933 - model aliases are case-insensitive and tolerant of spaces and dashes
  ---
  duration_ms: 0.271
  type: 'test'
  ...
# Subtest: model catalog sorts known models by requested role and includes custom choice
ok 934 - model catalog sorts known models by requested role and includes custom choice
  ---
  duration_ms: 0.124209
  type: 'test'
  ...
# Subtest: custom model resolution remains allowed but marked as custom
ok 935 - custom model resolution remains allowed but marked as custom
  ---
  duration_ms: 0.135
  type: 'test'
  ...
# Subtest: ambiguous aliases are reported without selecting a model
ok 936 - ambiguous aliases are reported without selecting a model
  ---
  duration_ms: 0.065166
  type: 'test'
  ...
# Subtest: normalizeTarballPath and stripPackagePrefix support tarball entries
ok 937 - normalizeTarballPath and stripPackagePrefix support tarball entries
  ---
  duration_ms: 0.734
  type: 'test'
  ...
# Subtest: collectPackageSafetyViolations flags sensitive local files in package tarball paths
ok 938 - collectPackageSafetyViolations flags sensitive local files in package tarball paths
  ---
  duration_ms: 1.688084
  type: 'test'
  ...
# Subtest: assertPackageSafety passes safe tarball paths
ok 939 - assertPackageSafety passes safe tarball paths
  ---
  duration_ms: 0.091167
  type: 'test'
  ...
# Subtest: assertPackageSafety fails with a clear code when unsafe tarball paths are present
ok 940 - assertPackageSafety fails with a clear code when unsafe tarball paths are present
  ---
  duration_ms: 0.246
  type: 'test'
  ...
# Subtest: toPosixPath normalizes explicit Windows separators
ok 941 - toPosixPath normalizes explicit Windows separators
  ---
  duration_ms: 1.001917
  type: 'test'
  ...
# Subtest: relativePosixPath handles Git Bash drive paths on Windows
ok 942 - relativePosixPath handles Git Bash drive paths on Windows
  ---
  duration_ms: 0.64475
  type: 'test'
  ...
# Subtest: relativePosixPath handles extended Windows path prefixes
ok 943 - relativePosixPath handles extended Windows path prefixes
  ---
  duration_ms: 0.162625
  type: 'test'
  ...
# Subtest: isPathInsideRoot accepts equivalent Windows realpath aliases
ok 944 - isPathInsideRoot accepts equivalent Windows realpath aliases
  ---
  duration_ms: 1.11975
  type: 'test'
  ...
# Subtest: isPathInsideRoot rejects targets that realpath outside the root
ok 945 - isPathInsideRoot rejects targets that realpath outside the root
  ---
  duration_ms: 0.131875
  type: 'test'
  ...
# Subtest: normalizeGitBashDrivePath leaves non-Windows path libs untouched
ok 946 - normalizeGitBashDrivePath leaves non-Windows path libs untouched
  ---
  duration_ms: 0.0625
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs paths from absolute Windows paths
ok 947 - specRelativePathFromPath extracts specs paths from absolute Windows paths
  ---
  duration_ms: 0.083917
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs-fix paths from Git Bash paths
ok 948 - specRelativePathFromPath extracts specs-fix paths from Git Bash paths
  ---
  duration_ms: 0.048541
  type: 'test'
  ...
# Subtest: specRelativePathFromPath returns empty string when no spec family exists
ok 949 - specRelativePathFromPath returns empty string when no spec family exists
  ---
  duration_ms: 0.24275
  type: 'test'
  ...
# Subtest: validateProjectRelativePath rejects absolute and traversal paths
ok 950 - validateProjectRelativePath rejects absolute and traversal paths
  ---
  duration_ms: 0.618375
  type: 'test'
  ...
# Subtest: writeProjectScanJson writes the current internal scan path
ok 951 - writeProjectScanJson writes the current internal scan path
  ---
  duration_ms: 3.994209
  type: 'test'
  ...
# Subtest: readProjectScanArtifact prefers current scan over legacy scan
ok 952 - readProjectScanArtifact prefers current scan over legacy scan
  ---
  duration_ms: 5.450125
  type: 'test'
  ...
# Subtest: readProjectScanArtifact falls back to legacy scan path
ok 953 - readProjectScanArtifact falls back to legacy scan path
  ---
  duration_ms: 3.492959
  type: 'test'
  ...
# Subtest: context pack metadata reports current or legacy scan source when repoRoot is provided
ok 954 - context pack metadata reports current or legacy scan source when repoRoot is provided
  ---
  duration_ms: 7.477833
  type: 'test'
  ...
# Subtest: readProjectScanStatus reports source and missing visible map state
ok 955 - readProjectScanStatus reports source and missing visible map state
  ---
  duration_ms: 2.998167
  type: 'test'
  ...
# Subtest: normalizes statuses through the canonical catalogs
ok 956 - normalizes statuses through the canonical catalogs
  ---
  duration_ms: 1.415542
  type: 'test'
  ...
# Subtest: resolver keeps scoped reads away from unrelated invalid historical specs
ok 957 - resolver keeps scoped reads away from unrelated invalid historical specs
  ---
  duration_ms: 8.114708
  type: 'test'
  ...
# Subtest: plan and AI export consume the same resolver state for completed slices
ok 958 - plan and AI export consume the same resolver state for completed slices
  ---
  duration_ms: 37.613666
  type: 'test'
  ...
# Subtest: active slice reconciliation blocks conflicting active sources
ok 959 - active slice reconciliation blocks conflicting active sources
  ---
  duration_ms: 5.140959
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes replacing a missing active doc from board state
ok 960 - active slice reconciliation proposes replacing a missing active doc from board state
  ---
  duration_ms: 7.806208
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes closing completed active slice state
ok 961 - active slice reconciliation proposes closing completed active slice state
  ---
  duration_ms: 5.191667
  type: 'test'
  ...
# Subtest: quiverInternalPaths centralizes internal paths
ok 962 - quiverInternalPaths centralizes internal paths
  ---
  duration_ms: 0.713209
  type: 'test'
  ...
# Subtest: buildQuiverInternalGitignore ignores runtime-only folders
ok 963 - buildQuiverInternalGitignore ignores runtime-only folders
  ---
  duration_ms: 0.215875
  type: 'test'
  ...
# Subtest: buildQuiverConfig documents internal and visible artifact paths
ok 964 - buildQuiverConfig documents internal and visible artifact paths
  ---
  duration_ms: 0.683125
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes internal config and gitignore using explicit template root
ok 965 - initializeProjectDocs writes internal config and gitignore using explicit template root
  ---
  duration_ms: 70.75025
  type: 'test'
  ...
# Subtest: renderDotGraph emits valid DOT source with nodes and edges
ok 966 - renderDotGraph emits valid DOT source with nodes and edges
  ---
  duration_ms: 9.973416
  type: 'test'
  ...
# Subtest: renderMermaidGraph emits a fenced flowchart with nodes and edges
ok 967 - renderMermaidGraph emits a fenced flowchart with nodes and edges
  ---
  duration_ms: 9.123083
  type: 'test'
  ...
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Subtest: parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
ok 968 - parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
  ---
  duration_ms: 1.397291
  type: 'test'
  ...
# Subtest: validateScopeSnapshot reports only files changed after the before snapshot
ok 969 - validateScopeSnapshot reports only files changed after the before snapshot
  ---
  duration_ms: 0.454791
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports simple glob write scopes
ok 970 - validateScopeSnapshot supports simple glob write scopes
  ---
  duration_ms: 0.261125
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
ok 971 - validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
  ---
  duration_ms: 0.077625
  type: 'test'
  ...
# Subtest: checkScope uses slice git.base_branch instead of hardcoded develop
ok 972 - checkScope uses slice git.base_branch instead of hardcoded develop
  ---
  duration_ms: 179.879792
  type: 'test'
  ...
# Subtest: checkScope respects an explicit base branch before slice git.base_branch
ok 973 - checkScope respects an explicit base branch before slice git.base_branch
  ---
  duration_ms: 188.629667
  type: 'test'
  ...
# Subtest: readAllSlices returns an empty array for an empty repo
ok 974 - readAllSlices returns an empty array for an empty repo
  ---
  duration_ms: 2.324708
  type: 'test'
  ...
# Subtest: readAllSlices reads real slices from the current repo
ok 975 - readAllSlices reads real slices from the current repo
  ---
  duration_ms: 76.218791
  type: 'test'
  ...
# Subtest: inferDependencies honors explicit dependencies and heuristic overlap
ok 976 - inferDependencies honors explicit dependencies and heuristic overlap
  ---
  duration_ms: 3.679542
  type: 'test'
  ...
# Subtest: readAllSlices uses allowed_write_paths as write scope when present
ok 977 - readAllSlices uses allowed_write_paths as write scope when present
  ---
  duration_ms: 1.204042
  type: 'test'
  ...
# Subtest: buildGraph and topoSort preserve explicit cross-spec order
ok 978 - buildGraph and topoSort preserve explicit cross-spec order
  ---
  duration_ms: 2.454291
  type: 'test'
  ...
# Subtest: topoSort throws a typed error with the full cycle path
ok 979 - topoSort throws a typed error with the full cycle path
  ---
  duration_ms: 2.189
  type: 'test'
  ...
# Subtest: computeLevels puts disjoint slices in the same level and detects conflicts
ok 980 - computeLevels puts disjoint slices in the same level and detects conflicts
  ---
  duration_ms: 2.725334
  type: 'test'
  ...
# Subtest: buildGraph drops legacy bare spec-name deps and produces zero edges
ok 981 - buildGraph drops legacy bare spec-name deps and produces zero edges
  ---
  duration_ms: 1.209541
  type: 'test'
  ...
# Subtest: buildGraph drops slash deps whose second segment is not a slice-id (regression)
ok 982 - buildGraph drops slash deps whose second segment is not a slice-id (regression)
  ---
  duration_ms: 1.959541
  type: 'test'
  ...
# Subtest: buildGraph preserves depends_on with full spec/slice-id format (regression)
ok 983 - buildGraph preserves depends_on with full spec/slice-id format (regression)
  ---
  duration_ms: 2.126208
  type: 'test'
  ...
# Subtest: normalizeDeclaredDependencies expands bare slice ids within the same spec
ok 984 - normalizeDeclaredDependencies expands bare slice ids within the same spec
  ---
  duration_ms: 0.112125
  type: 'test'
  ...
# Subtest: foundation slice helpers recognize slice-00 ids
ok 985 - foundation slice helpers recognize slice-00 ids
  ---
  duration_ms: 0.052833
  type: 'test'
  ...
# Subtest: templateRootExists validates a minimal Quiver template root
ok 986 - templateRootExists validates a minimal Quiver template root
  ---
  duration_ms: 2.36225
  type: 'test'
  ...
# Subtest: resolveTemplateRoot prefers packaged templates by default
ok 987 - resolveTemplateRoot prefers packaged templates by default
  ---
  duration_ms: 2.435292
  type: 'test'
  ...
# Subtest: resolveTemplateRoot can prefer exported templates when requested
ok 988 - resolveTemplateRoot can prefer exported templates when requested
  ---
  duration_ms: 2.218292
  type: 'test'
  ...
# Subtest: resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
ok 989 - resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
  ---
  duration_ms: 1.159417
  type: 'test'
  ...
# Subtest: resolveTemplatePath returns the concrete template file path
ok 990 - resolveTemplatePath returns the concrete template file path
  ---
  duration_ms: 1.214417
  type: 'test'
  ...
# Subtest: resolveTemplateRoot reports every searched location when templates are missing
ok 991 - resolveTemplateRoot reports every searched location when templates are missing
  ---
  duration_ms: 0.618416
  type: 'test'
  ...
# Subtest: collectVersionReport works outside an initialized project
ok 992 - collectVersionReport works outside an initialized project
  ---
  duration_ms: 1.663666
  type: 'test'
  ...
# Subtest: detectPackageManager uses package.json before lockfiles and env
ok 993 - detectPackageManager uses package.json before lockfiles and env
  ---
  duration_ms: 1.620833
  type: 'test'
  ...
# Subtest: formatHumanVersionReport is readable without color and fits the banner budget
ok 994 - formatHumanVersionReport is readable without color and fits the banner budget
  ---
  duration_ms: 0.746791
  type: 'test'
  ...
# Subtest: formatHumanVersionReport uses Quiver palette when color is enabled
ok 995 - formatHumanVersionReport uses Quiver palette when color is enabled
  ---
  duration_ms: 0.468125
  type: 'test'
  ...
# Subtest: slice schema is declared as JSON Schema Draft-07
ok 996 - slice schema is declared as JSON Schema Draft-07
  ---
  duration_ms: 1.224834
  type: 'test'
  ...
# Subtest: slice schema validates real runtime-valid fixtures and rejects invalid fixtures
ok 997 - slice schema validates real runtime-valid fixtures and rejects invalid fixtures
  ---
  duration_ms: 152.964
  type: 'test'
  ...
1..997
# tests 997
# suites 0
# pass 997
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 97519.0565

````

## Stderr

````text

````
