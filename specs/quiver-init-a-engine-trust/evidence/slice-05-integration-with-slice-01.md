# Quiver Evidence

- Command: `/Users/fabrijk/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node scripts/ci/run-node-tests.js`
- Exit code: 0
- Duration ms: 82090
- Started at: 2026-09-07T02:50:39.501Z
- Finished at: 2026-09-07T02:52:01.592Z
- Signal: -
- Output truncated: no

## Stdout

````text
TAP version 13
# Subtest: extractUnreleasedSection returns only the current unreleased body
ok 1 - extractUnreleasedSection returns only the current unreleased body
  ---
  duration_ms: 0.779167
  type: 'test'
  ...
# Subtest: collectUnreleasedEntries reads categorized changelog bullets
ok 2 - collectUnreleasedEntries reads categorized changelog bullets
  ---
  duration_ms: 1.084583
  type: 'test'
  ...
# Subtest: runChangelogCheck requires an unreleased section with entries
ok 3 - runChangelogCheck requires an unreleased section with entries
  ---
  duration_ms: 3.114166
  type: 'test'
  ...
# Subtest: ai agent set, list, and show persist reusable profile settings
ok 4 - ai agent set, list, and show persist reusable profile settings
  ---
  duration_ms: 559.446125
  type: 'test'
  ...
# Subtest: ai agent supports named planner profiles and default selection
ok 5 - ai agent supports named planner profiles and default selection
  ---
  duration_ms: 700.134167
  type: 'test'
  ...
# Subtest: ai agent set --dry-run previews the profile without writing state
ok 6 - ai agent set --dry-run previews the profile without writing state
  ---
  duration_ms: 163.0365
  type: 'test'
  ...
# Subtest: ai agent commands render Spanish human output while preserving profile state
ok 7 - ai agent commands render Spanish human output while preserving profile state
  ---
  duration_ms: 511.350917
  type: 'test'
  ...
# Subtest: ai agent supports doctor profiles and rejects researcher profiles
ok 8 - ai agent supports doctor profiles and rejects researcher profiles
  ---
  duration_ms: 477.930917
  type: 'test'
  ...
# Subtest: ai agent rejects unsupported providers with guidance
ok 9 - ai agent rejects unsupported providers with guidance
  ---
  duration_ms: 150.354833
  type: 'test'
  ...
# Subtest: ai agent show reports missing profile with actionable guidance
ok 10 - ai agent show reports missing profile with actionable guidance
  ---
  duration_ms: 154.455167
  type: 'test'
  ...
# Subtest: ai agent actionable errors render Spanish wrappers while preserving commands
ok 11 - ai agent actionable errors render Spanish wrappers while preserving commands
  ---
  duration_ms: 336.807208
  type: 'test'
  ...
# Subtest: ai onboard uses planner profile provider when provider is not explicit
ok 12 - ai onboard uses planner profile provider when provider is not explicit
  ---
  duration_ms: 332.604042
  type: 'test'
  ...
# Subtest: ai onboard can select a named planner profile for provider and model
ok 13 - ai onboard can select a named planner profile for provider and model
  ---
  duration_ms: 487.972
  type: 'test'
  ...
# Subtest: ai agent set requires provider and model when prompts are unavailable
ok 14 - ai agent set requires provider and model when prompts are unavailable
  ---
  duration_ms: 153.255167
  type: 'test'
  ...
# Subtest: ai agent interactive set resolves provider and catalog model selections
ok 15 - ai agent interactive set resolves provider and catalog model selections
  ---
  duration_ms: 2.851042
  type: 'test'
  ...
# Subtest: ai agent interactive set can create an additional named profile
ok 16 - ai agent interactive set can create an additional named profile
  ---
  duration_ms: 144.707084
  type: 'test'
  ...
# Subtest: ai agent interactive set supports custom model id and display name
ok 17 - ai agent interactive set supports custom model id and display name
  ---
  duration_ms: 2.708667
  type: 'test'
  ...
# Subtest: ai agent doctor reports profile errors and warnings as JSON
ok 18 - ai agent doctor reports profile errors and warnings as JSON
  ---
  duration_ms: 324.682542
  type: 'test'
  ...
# Subtest: ai agent doctor human output uses checks and suggested fixes sections
ok 19 - ai agent doctor human output uses checks and suggested fixes sections
  ---
  duration_ms: 361.972833
  type: 'test'
  ...
# Subtest: ai agent repair --dry-run previews alias normalization without writing
ok 20 - ai agent repair --dry-run previews alias normalization without writing
  ---
  duration_ms: 159.213416
  type: 'test'
  ...
# Subtest: ai agent repair without dry-run refuses to write
ok 21 - ai agent repair without dry-run refuses to write
  ---
  duration_ms: 149.376334
  type: 'test'
  ...
# Subtest: runAnalyzeProject executes provider and applies validated docs by default
ok 22 - runAnalyzeProject executes provider and applies validated docs by default
  ---
  duration_ms: 58.274417
  type: 'test'
  ...
# Subtest: runAnalyzeProject default auto-apply preserves existing docs with managed block
ok 23 - runAnalyzeProject default auto-apply preserves existing docs with managed block
  ---
  duration_ms: 13.635209
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
ok 24 - runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs
  ---
  duration_ms: 22.075083
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal --json emits clean parseable proposal result
ok 25 - runAnalyzeProject --save-proposal --json emits clean parseable proposal result
  ---
  duration_ms: 7.87225
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows human TTY progress during live provider execution
ok 26 - runAnalyzeProject shows human TTY progress during live provider execution
  ---
  duration_ms: 12.452
  type: 'test'
  ...
# Subtest: runAnalyzeProject shows linear progress without TTY during live provider execution
ok 27 - runAnalyzeProject shows linear progress without TTY during live provider execution
  ---
  duration_ms: 9.086292
  type: 'test'
  ...
# Subtest: runAnalyzeProject --dry-run does not call provider
ok 28 - runAnalyzeProject --dry-run does not call provider
  ---
  duration_ms: 1.47575
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid provider JSON without writing final docs
ok 29 - runAnalyzeProject rejects invalid provider JSON without writing final docs
  ---
  duration_ms: 5.423958
  type: 'test'
  ...
# Subtest: runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
ok 30 - runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance
  ---
  duration_ms: 7.74725
  type: 'test'
  ...
# Subtest: runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
ok 31 - runAnalyzeProject --json prints parseable recovery payload on evidence validation failure
  ---
  duration_ms: 10.7155
  type: 'test'
  ...
# Subtest: runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
ok 32 - runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts
  ---
  duration_ms: 13.913083
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
ok 33 - runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs
  ---
  duration_ms: 14.462166
  type: 'test'
  ...
# Subtest: runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
ok 34 - runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts
  ---
  duration_ms: 17.225292
  type: 'test'
  ...
# Subtest: runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
ok 35 - runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs
  ---
  duration_ms: 29.475375
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
ok 36 - runAnalyzeProject accepts fenced-json provider fixture output and applies final docs
  ---
  duration_ms: 8.3655
  type: 'test'
  ...
# Subtest: runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
ok 37 - runAnalyzeProject accepts surrounding-text provider fixture output and applies final docs
  ---
  duration_ms: 9.407209
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects truncated-json provider fixture without writing final docs
ok 38 - runAnalyzeProject rejects truncated-json provider fixture without writing final docs
  ---
  duration_ms: 5.280792
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
ok 39 - runAnalyzeProject rejects missing-required-fields provider fixture without writing final docs
  ---
  duration_ms: 21.430042
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
ok 40 - runAnalyzeProject rejects invalid-confidence provider fixture without writing final docs
  ---
  duration_ms: 5.892583
  type: 'test'
  ...
# Subtest: runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
ok 41 - runAnalyzeProject redacts secret-like provider output fixture before artifact exposure
  ---
  duration_ms: 10.445167
  type: 'test'
  ...
# Subtest: provider retry fixtures define recoverable and exhausted attempt sequences
ok 42 - provider retry fixtures define recoverable and exhausted attempt sequences
  ---
  duration_ms: 0.609292
  type: 'test'
  ...
# Subtest: runAnalyzeProject retries retryable schema drift once and succeeds
ok 43 - runAnalyzeProject retries retryable schema drift once and succeeds
  ---
  duration_ms: 15.025583
  type: 'test'
  ...
# Subtest: runAnalyzeProject fails safely after default retry exhaustion
ok 44 - runAnalyzeProject fails safely after default retry exhaustion
  ---
  duration_ms: 11.884958
  type: 'test'
  ...
# Subtest: runAnalyzeProject caps retries at two even when configured higher
ok 45 - runAnalyzeProject caps retries at two even when configured higher
  ---
  duration_ms: 6.708917
  type: 'test'
  ...
# Subtest: runAnalyzeProject reports provider schema issues with actionable detail
ok 46 - runAnalyzeProject reports provider schema issues with actionable detail
  ---
  duration_ms: 4.780333
  type: 'test'
  ...
# Subtest: runAnalyzeProject rejects provider failure without writing final docs
ok 47 - runAnalyzeProject rejects provider failure without writing final docs
  ---
  duration_ms: 2.783625
  type: 'test'
  ...
# Subtest: ai analyze-project --review writes approved docs with snapshot manifest
ok 48 - ai analyze-project --review writes approved docs with snapshot manifest
  ---
  duration_ms: 104.225833
  type: 'test'
  ...
# Subtest: ai analyze-project review cancellation writes nothing
ok 49 - ai analyze-project review cancellation writes nothing
  ---
  duration_ms: 7.310542
  type: 'test'
  ...
# Subtest: ai analyze-project review confirmation decline writes nothing
ok 50 - ai analyze-project review confirmation decline writes nothing
  ---
  duration_ms: 9.008083
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects no-TTY review without writing
ok 51 - ai analyze-project --review rejects no-TTY review without writing
  ---
  duration_ms: 4.682542
  type: 'test'
  ...
# Subtest: ai analyze-project --review rejects invalid edited proposal without writing
ok 52 - ai analyze-project --review rejects invalid edited proposal without writing
  ---
  duration_ms: 7.944125
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
ok 53 - ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests
  ---
  duration_ms: 9.720125
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
ok 54 - ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed
  ---
  duration_ms: 8.209875
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
ok 55 - ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs
  ---
  duration_ms: 16.14575
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run applies a saved proposal without executing provider
ok 56 - ai analyze-project apply --run applies a saved proposal without executing provider
  ---
  duration_ms: 11.821959
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
ok 57 - ai analyze-project apply --run blocks dirty saved docs unless explicitly allowed
  ---
  duration_ms: 10.113208
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run blocks stale saved proposals before writing
ok 58 - ai analyze-project apply --run blocks stale saved proposals before writing
  ---
  duration_ms: 7.254958
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run accepts revalidated manual proposal edits and records them
ok 59 - ai analyze-project apply --run accepts revalidated manual proposal edits and records them
  ---
  duration_ms: 16.700625
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
ok 60 - ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs
  ---
  duration_ms: 16.647125
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs without TTY fails before provider
ok 61 - ai analyze-project --apply-docs without TTY fails before provider
  ---
  duration_ms: 1.352041
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY cancel writes no final docs
ok 62 - ai analyze-project --apply-docs TTY cancel writes no final docs
  ---
  duration_ms: 7.416417
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY save proposal writes artifacts only
ok 63 - ai analyze-project --apply-docs TTY save proposal writes artifacts only
  ---
  duration_ms: 8.428875
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY view diff requires second decision
ok 64 - ai analyze-project --apply-docs TTY view diff requires second decision
  ---
  duration_ms: 7.04475
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY edit reuses review flow
ok 65 - ai analyze-project --apply-docs TTY edit reuses review flow
  ---
  duration_ms: 25.086125
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY apply writes docs through apply engine
ok 66 - ai analyze-project --apply-docs TTY apply writes docs through apply engine
  ---
  duration_ms: 13.427959
  type: 'test'
  ...
# Subtest: ai analyze-project --apply-docs TTY renders Spanish selector copy
ok 67 - ai analyze-project --apply-docs TTY renders Spanish selector copy
  ---
  duration_ms: 6.218625
  type: 'test'
  ...
# Subtest: ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
ok 68 - ai analyze-project --deep --dry-run reports read-only sample and creates no .quiver directory
  ---
  duration_ms: 247.016042
  type: 'test'
  ...
# Subtest: ai analyze-project --json emits clean machine-readable output
ok 69 - ai analyze-project --json emits clean machine-readable output
  ---
  duration_ms: 187.258209
  type: 'test'
  ...
# Subtest: ai analyze-project rejects analysis flags on other ai subcommands
ok 70 - ai analyze-project rejects analysis flags on other ai subcommands
  ---
  duration_ms: 166.965875
  type: 'test'
  ...
# Subtest: ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
ok 71 - ai analyze-project accepts v55 doc-apply flags but rejects invalid combinations before provider
  ---
  duration_ms: 495.809166
  type: 'test'
  ...
# Subtest: ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
ok 72 - ai analyze-project apply --run is parsed without provider/model and validates saved artifacts
  ---
  duration_ms: 825.077125
  type: 'test'
  ...
# Subtest: ai analyze-project --review remains a supported UX flag at CLI boundary
ok 73 - ai analyze-project --review remains a supported UX flag at CLI boundary
  ---
  duration_ms: 167.499917
  type: 'test'
  ...
# AI execute-plan completed
# Slices executed: 2
# Subtest: ai execute-plan CLI dry-run prints commands without calling providers
ok 74 - ai execute-plan CLI dry-run prints commands without calling providers
  ---
  duration_ms: 196.700584
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run supports manual mode
ok 75 - ai execute-plan CLI dry-run supports manual mode
  ---
  duration_ms: 192.095083
  type: 'test'
  ...
# Subtest: ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
ok 76 - ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands
  ---
  duration_ms: 178.399042
  type: 'test'
  ...
# Subtest: ai execute-plan CLI JSON exposes downstream wave and scope metadata
ok 77 - ai execute-plan CLI JSON exposes downstream wave and scope metadata
  ---
  duration_ms: 160.593333
  type: 'test'
  ...
# Subtest: runExecutePlan executes slices with commit enabled and stops on failure
ok 78 - runExecutePlan executes slices with commit enabled and stops on failure
  ---
  duration_ms: 8.609083
  type: 'test'
  ...
# Subtest: runExecutePlan requires --commit for real execution
ok 79 - runExecutePlan requires --commit for real execution
  ---
  duration_ms: 4.345167
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
ok 80 - runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits
  ---
  duration_ms: 557.000042
  type: 'test'
  ...
# Subtest: runExecutePlan delegated mode rejects a concurrent run lock
ok 81 - runExecutePlan delegated mode rejects a concurrent run lock
  ---
  duration_ms: 157.155667
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run prints executor context and does not call provider
ok 82 - ai execute-slice CLI dry-run prints executor context and does not call provider
  ---
  duration_ms: 213.328292
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run shows opt-in commit mode
ok 83 - ai execute-slice CLI dry-run shows opt-in commit mode
  ---
  duration_ms: 169.078167
  type: 'test'
  ...
# Subtest: ai execute-slice CLI dry-run normalizes CLI display model aliases
ok 84 - ai execute-slice CLI dry-run normalizes CLI display model aliases
  ---
  duration_ms: 165.620834
  type: 'test'
  ...
# Subtest: ai execute-slice blocks legacy profile display aliases before provider execution
ok 85 - ai execute-slice blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 7.374167
  type: 'test'
  ...
# Subtest: ai prompt-slice CLI prints a minimal manual executor prompt
ok 86 - ai prompt-slice CLI prints a minimal manual executor prompt
  ---
  duration_ms: 208.293166
  type: 'test'
  ...
# Subtest: ai execute-slice dry-run renders Spanish wrapper without translating paths
ok 87 - ai execute-slice dry-run renders Spanish wrapper without translating paths
  ---
  duration_ms: 158.626917
  type: 'test'
  ...
# Subtest: ai execute-slice requires --slice
ok 88 - ai execute-slice requires --slice
  ---
  duration_ms: 0.273625
  type: 'test'
  ...
# Subtest: ai inspect, export, specs, slices, and trace expose lifecycle state
ok 89 - ai inspect, export, specs, slices, and trace expose lifecycle state
  ---
  duration_ms: 1512.571083
  type: 'test'
  ...
# Subtest: ai inspection commands render Spanish human output without localizing JSON
ok 90 - ai inspection commands render Spanish human output without localizing JSON
  ---
  duration_ms: 1037.040208
  type: 'test'
  ...
# Subtest: ai export rejects unsupported formats with a clear error
ok 91 - ai export rejects unsupported formats with a clear error
  ---
  duration_ms: 170.605791
  type: 'test'
  ...
# Subtest: ai export JSON writes parseable JSON to stdout and diagnostics to stderr
ok 92 - ai export JSON writes parseable JSON to stdout and diagnostics to stderr
  ---
  duration_ms: 383.172459
  type: 'test'
  ...
# Subtest: ai active-slice reconcile dry-run reports conflicts without writing files
ok 93 - ai active-slice reconcile dry-run reports conflicts without writing files
  ---
  duration_ms: 197.586333
  type: 'test'
  ...
# Subtest: ai active-slice reconcile requires dry-run before writes exist
ok 94 - ai active-slice reconcile requires dry-run before writes exist
  ---
  duration_ms: 157.986417
  type: 'test'
  ...
# Subtest: ai models list groups models by provider in human output
ok 95 - ai models list groups models by provider in human output
  ---
  duration_ms: 194.228666
  type: 'test'
  ...
# Subtest: ai models list filters by provider
ok 96 - ai models list filters by provider
  ---
  duration_ms: 186.026167
  type: 'test'
  ...
# Subtest: ai models list --json emits clean parseable catalog metadata
ok 97 - ai models list --json emits clean parseable catalog metadata
  ---
  duration_ms: 177.773834
  type: 'test'
  ...
# Subtest: ai models list localizes Spanish human output without changing JSON
ok 98 - ai models list localizes Spanish human output without changing JSON
  ---
  duration_ms: 342.997458
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters with guidance
ok 99 - ai models list rejects unsupported provider filters with guidance
  ---
  duration_ms: 162.223791
  type: 'test'
  ...
# Subtest: ai models list rejects unsupported provider filters in Spanish
ok 100 - ai models list rejects unsupported provider filters in Spanish
  ---
  duration_ms: 165.243417
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-41z/snapshots/20260907T025041Z
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
# + **Last updated:** 2026-09-07
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
# + **Fecha:** 2026-09-07
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
# + **Date:** 2026-09-07
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
# + **Date:** 2026-09-07
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-41z/snapshots/20260907T025041Z
# AI prepare-context write plan
# Mode: live
# Project: demo-project
# Project slug: demo-project
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Planned writes: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md
# Snapshot: .quiver/runs/run-2026-09-07t02-50-41z/snapshots/20260522T120000Z
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
# + **Last updated:** 2026-09-07
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
# + **Fecha:** 2026-09-07
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
# + **Date:** 2026-09-07
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
# + **Date:** 2026-09-07
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-41z/snapshots/20260522T120000Z
# Subtest: ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
ok 101 - ai onboard CLI dry-run prints provider, role, context pack, and invocation plan
  ---
  duration_ms: 211.922791
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run supports Spanish human output without translating commands
ok 102 - ai onboard CLI dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 185.793416
  type: 'test'
  ...
# Subtest: ai onboard CLI dry-run reads the configured project language by default
ok 103 - ai onboard CLI dry-run reads the configured project language by default
  ---
  duration_ms: 166.859917
  type: 'test'
  ...
# Subtest: ai onboard print-prompt prints the exact prompt without invoking provider auth
ok 104 - ai onboard print-prompt prints the exact prompt without invoking provider auth
  ---
  duration_ms: 175.675333
  type: 'test'
  ...
# Subtest: ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
ok 105 - ai onboard forwards custom provider, role, context, input, and timeout to the provider runner
  ---
  duration_ms: 7.789625
  type: 'test'
  ...
# Subtest: ai onboard surfaces provider failures with actionable context
ok 106 - ai onboard surfaces provider failures with actionable context
  ---
  duration_ms: 1.194584
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
ok 107 - ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths
  ---
  duration_ms: 174.755125
  type: 'test'
  ...
# Subtest: ai prepare-context dry-run supports Spanish human output without translating paths
ok 108 - ai prepare-context dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 170.210792
  type: 'test'
  ...
# Subtest: ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
ok 109 - ai prepare-context planner dry-run supports Spanish wrapper output without translating commands
  ---
  duration_ms: 180.071167
  type: 'test'
  ...
# Subtest: ai prepare-context writes docs-only drafts and keeps product code untouched
ok 110 - ai prepare-context writes docs-only drafts and keeps product code untouched
  ---
  duration_ms: 23.0105
  type: 'test'
  ...
# Subtest: ai prepare-context preserves human-authored docs and snapshots before updating
ok 111 - ai prepare-context preserves human-authored docs and snapshots before updating
  ---
  duration_ms: 24.689292
  type: 'test'
  ...
# Subtest: ai prepare-context reports contradictions between project map and current root signals
ok 112 - ai prepare-context reports contradictions between project map and current root signals
  ---
  duration_ms: 178.069709
  type: 'test'
  ...
# Subtest: ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
ok 113 - ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending
  ---
  duration_ms: 2.711
  type: 'test'
  ...
# create-quiver: ai plan phase 'spec' requires approved technical-plan input; current status: missing. Run `npx create-quiver ai approve --phase technical-plan --version <n>`.
# create-quiver: ai approve --phase acceptance requiere --version <n> cuando los prompts no estan disponibles.
# Impacto: Quiver no puede adivinar de forma segura que draft de planner aprobo la persona.
# Arreglo: Revisa drafts con `npx create-quiver ai approvals` y despues pasa la version explicitamente.
# Siguiente comando: npx create-quiver ai approve --phase acceptance --version 1
# Subtest: ai plan spec phase dry-run reports the generated spec tree and does not write files
ok 114 - ai plan spec phase dry-run reports the generated spec tree and does not write files
  ---
  duration_ms: 465.607625
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
ok 115 - ai plan spec phase dry-run renders Spanish wrappers while preserving generated target ids
  ---
  duration_ms: 463.163917
  type: 'test'
  ...
# Subtest: ai plan print-prompt localizes wrappers but keeps provider prompt body stable
ok 116 - ai plan print-prompt localizes wrappers but keeps provider prompt body stable
  ---
  duration_ms: 330.240833
  type: 'test'
  ...
# Subtest: ai review-plan dry-run renders Spanish wrapper fields without changing draft path
ok 117 - ai review-plan dry-run renders Spanish wrapper fields without changing draft path
  ---
  duration_ms: 176.361958
  type: 'test'
  ...
# Subtest: ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
ok 118 - ai plan spec phase can infer the spec slug from approved technical-plan input and write artifacts
  ---
  duration_ms: 434.409458
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects unapproved technical-plan input
ok 119 - ai plan spec phase rejects unapproved technical-plan input
  ---
  duration_ms: 174.5015
  type: 'test'
  ...
# Subtest: ai approve dry-run and missing-version guidance render Spanish wrappers
ok 120 - ai approve dry-run and missing-version guidance render Spanish wrappers
  ---
  duration_ms: 365.648959
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
ok 121 - ai plan CLI dry-run defaults to acceptance phase and planning context
  ---
  duration_ms: 171.405834
  type: 'test'
  ...
# Subtest: ai plan accepts UX flags in dry-run without changing planner draft behavior
ok 122 - ai plan accepts UX flags in dry-run without changing planner draft behavior
  ---
  duration_ms: 146.735167
  type: 'test'
  ...
# Subtest: ai plan --review lets a human edit the provider draft before saving
ok 123 - ai plan --review lets a human edit the provider draft before saving
  ---
  duration_ms: 96.351375
  type: 'test'
  ...
# Subtest: ai plan --interactive can decline saving the provider draft
ok 124 - ai plan --interactive can decline saving the provider draft
  ---
  duration_ms: 14.996625
  type: 'test'
  ...
# Subtest: ai plan print-prompt renders acceptance prompt without provider auth
ok 125 - ai plan print-prompt renders acceptance prompt without provider auth
  ---
  duration_ms: 167.373583
  type: 'test'
  ...
# Subtest: ai plan acceptance persists a draft approval state
ok 126 - ai plan acceptance persists a draft approval state
  ---
  duration_ms: 62.51175
  type: 'test'
  ...
# Subtest: ai plan redacts likely secrets before saving provider output drafts
ok 127 - ai plan redacts likely secrets before saving provider output drafts
  ---
  duration_ms: 66.36375
  type: 'test'
  ...
# Subtest: ai plan stores clean drafts and separates redacted raw provider logs
ok 128 - ai plan stores clean drafts and separates redacted raw provider logs
  ---
  duration_ms: 82.953958
  type: 'test'
  ...
# Subtest: ai plan prints clean provider output without raw prompt echo or stderr logs
ok 129 - ai plan prints clean provider output without raw prompt echo or stderr logs
  ---
  duration_ms: 68.50675
  type: 'test'
  ...
# Subtest: ai approve only approves the current draft version
ok 130 - ai approve only approves the current draft version
  ---
  duration_ms: 711.480667
  type: 'test'
  ...
# Subtest: ai approve requires a version and rejects direct input files
ok 131 - ai approve requires a version and rejects direct input files
  ---
  duration_ms: 433.950625
  type: 'test'
  ...
# Subtest: ai revise creates a new draft version without approving the phase
ok 132 - ai revise creates a new draft version without approving the phase
  ---
  duration_ms: 333.798166
  type: 'test'
  ...
# Subtest: ai revise compacts oversized feedback before provider execution
ok 133 - ai revise compacts oversized feedback before provider execution
  ---
  duration_ms: 189.379375
  type: 'test'
  ...
# Subtest: ai plan rejects oversized prompts before provider execution
ok 134 - ai plan rejects oversized prompts before provider execution
  ---
  duration_ms: 3.296625
  type: 'test'
  ...
# Subtest: ai revise technical-plan includes approved acceptance, current draft, and feedback
ok 135 - ai revise technical-plan includes approved acceptance, current draft, and feedback
  ---
  duration_ms: 409.077333
  type: 'test'
  ...
# Subtest: governed technical-plan revise keeps acceptance and draft input isolated to the selected run
ok 136 - governed technical-plan revise keeps acceptance and draft input isolated to the selected run
  ---
  duration_ms: 345.248458
  type: 'test'
  ...
# Subtest: ai revise requires an existing draft
ok 137 - ai revise requires an existing draft
  ---
  duration_ms: 3.640875
  type: 'test'
  ...
# Subtest: ai revise rejects missing input values for acceptance and technical-plan before provider execution
ok 138 - ai revise rejects missing input values for acceptance and technical-plan before provider execution
  ---
  duration_ms: 418.339833
  type: 'test'
  ...
# Subtest: ai revise rejects nonexistent feedback files and accidental extra arguments
ok 139 - ai revise rejects nonexistent feedback files and accidental extra arguments
  ---
  duration_ms: 467.51325
  type: 'test'
  ...
# Subtest: ai plan shows human TTY progress during live provider execution
ok 140 - ai plan shows human TTY progress during live provider execution
  ---
  duration_ms: 81.481459
  type: 'test'
  ...
# Subtest: ai plan dry-run does not show provider progress
ok 141 - ai plan dry-run does not show provider progress
  ---
  duration_ms: 0.804375
  type: 'test'
  ...
# Subtest: ai approve writes an approved acceptance artifact with metadata
ok 142 - ai approve writes an approved acceptance artifact with metadata
  ---
  duration_ms: 298.642917
  type: 'test'
  ...
# Subtest: governed ai approve CLI publishes one digest-bound acceptance decision atomically
ok 143 - governed ai approve CLI publishes one digest-bound acceptance decision atomically
  ---
  duration_ms: 783.28275
  type: 'test'
  ...
# Subtest: digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
ok 144 - digest-bound approval blocks secret-bearing artifact and input bytes before WAL publication
  ---
  duration_ms: 199.514041
  type: 'test'
  ...
# Subtest: digest-bound acceptance rejects a requirement path redirected to another run
ok 145 - digest-bound acceptance rejects a requirement path redirected to another run
  ---
  duration_ms: 116.805042
  type: 'test'
  ...
# Subtest: governed review WAL rejects secrets hidden in canonical authorization evidence
ok 146 - governed review WAL rejects secrets hidden in canonical authorization evidence
  ---
  duration_ms: 239.210917
  type: 'test'
  ...
# Subtest: digest-bound approval rechecks policy after asynchronous actor resolution
ok 147 - digest-bound approval rechecks policy after asynchronous actor resolution
  ---
  duration_ms: 113.137084
  type: 'test'
  ...
# Subtest: conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
ok 148 - conditioned digest-bound approval reuses its candidate, rejects drift, and publishes one verifiable final decision
  ---
  duration_ms: 1310.223583
  type: 'test'
  ...
# Subtest: ai approvals prints draft and approved status
ok 149 - ai approvals prints draft and approved status
  ---
  duration_ms: 430.965208
  type: 'test'
  ...
# Subtest: ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
ok 150 - ai approve rejects technical-plan drafts without structured spec slices before writing approved artifacts
  ---
  duration_ms: 259.248625
  type: 'test'
  ...
# Subtest: ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
ok 151 - ai repair-plan creates a derived structured draft and preserves the legacy approved artifact
  ---
  duration_ms: 199.513625
  type: 'test'
  ...
# Subtest: ai repair-plan shows human TTY progress during live provider execution
ok 152 - ai repair-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 178.004167
  type: 'test'
  ...
# Subtest: ai repair-plan dry-run previews repair without mutating approval state
ok 153 - ai repair-plan dry-run previews repair without mutating approval state
  ---
  duration_ms: 240.755875
  type: 'test'
  ...
# Subtest: ai plan technical-plan uses approved acceptance by default and rejects drafts
ok 154 - ai plan technical-plan uses approved acceptance by default and rejects drafts
  ---
  duration_ms: 560.310958
  type: 'test'
  ...
# Subtest: ai plan fails with a clear missing-input error
ok 155 - ai plan fails with a clear missing-input error
  ---
  duration_ms: 170.65975
  type: 'test'
  ...
# Subtest: ai plan spec phase dry-run reports spec generation instead of provider invocation
ok 156 - ai plan spec phase dry-run reports spec generation instead of provider invocation
  ---
  duration_ms: 581.733792
  type: 'test'
  ...
# Subtest: ai plan surfaces provider failures with phase context
ok 157 - ai plan surfaces provider failures with phase context
  ---
  duration_ms: 9.584042
  type: 'test'
  ...
# GitHub pr dry-run
# Remote: upstream
# Branch: feature/ai-pr-preflight
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/ai-pr-preflight --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-KP1VHt/specs/demo/pr.md
# SSH host alias: github-work
# Identity file: /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-KP1VHt/ssh/github-work
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-KP1VHt/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/ai-pr-preflight --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-unit-KP1VHt/specs/demo/pr.md
# No PR will be created in dry-run mode.
# GitHub pr dry-run
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Edited PR
# Command: gh pr create --base main --head feature/demo --title "Edited PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-9XyOMF/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-9XyOMF/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Edited PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-review-9XyOMF/specs/demo/pr.md
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
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-KoftT4/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-KoftT4/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-create-KoftT4/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# GitHub pr created
# Remote: origin
# Branch: feature/demo
# Base: main
# PR body: specs/demo/pr.md
# Title: Demo PR
# Command: gh pr create --base main --head feature/demo --title "Demo PR" --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-eIdSZh/specs/demo/pr.md
# Shell-safe command examples:
# - macOS/Linux/Git Bash/WSL: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-eIdSZh/specs/demo/pr.md
# - Windows PowerShell: gh pr create --base main --head feature/demo --title 'Demo PR' --body-file /var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/quiver-ai-pr-progress-eIdSZh/specs/demo/pr.md
# https://github.com/example/repo/pull/1
# Subtest: ai pr dry-run forwards git and ssh options to the GitHub preflight
ok 158 - ai pr dry-run forwards git and ssh options to the GitHub preflight
  ---
  duration_ms: 63.182667
  type: 'test'
  ...
# Subtest: ai doctor annotates GitHub preflight failures
ok 159 - ai doctor annotates GitHub preflight failures
  ---
  duration_ms: 0.349667
  type: 'test'
  ...
# Subtest: ai pr json emits one machine report without human prose
ok 160 - ai pr json emits one machine report without human prose
  ---
  duration_ms: 65.09825
  type: 'test'
  ...
# Subtest: ai pr with an explicit run rejects an ungoverned PR surface
ok 161 - ai pr with an explicit run rejects an ungoverned PR surface
  ---
  duration_ms: 60.723708
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run wires through the new router and avoids opening a PR
ok 162 - ai pr CLI dry-run wires through the new router and avoids opening a PR
  ---
  duration_ms: 1055.281791
  type: 'test'
  ...
# Subtest: ai pr CLI dry-run renders Spanish wrappers while preserving gh command
ok 163 - ai pr CLI dry-run renders Spanish wrappers while preserving gh command
  ---
  duration_ms: 774.410959
  type: 'test'
  ...
# Subtest: ai pr --review lets a human edit pr.md before the PR plan is built
ok 164 - ai pr --review lets a human edit pr.md before the PR plan is built
  ---
  duration_ms: 148.187208
  type: 'test'
  ...
# Subtest: ai pr --interactive can decline PR creation before gh runs
ok 165 - ai pr --interactive can decline PR creation before gh runs
  ---
  duration_ms: 66.729042
  type: 'test'
  ...
# Subtest: ai pr create runs gh pr create with pr.md after preflight
ok 166 - ai pr create runs gh pr create with pr.md after preflight
  ---
  duration_ms: 54.204125
  type: 'test'
  ...
# Subtest: ai pr create shows TTY progress for preflight and gh creation
ok 167 - ai pr create shows TTY progress for preflight and gh creation
  ---
  duration_ms: 71.320583
  type: 'test'
  ...
# Subtest: ai pr revalidates governed PR evidence after editor changes
ok 168 - ai pr revalidates governed PR evidence after editor changes
  ---
  duration_ms: 121.300209
  type: 'test'
  ...
# Subtest: ai pr revalidates canonical parity immediately before gh create
ok 169 - ai pr revalidates canonical parity immediately before gh create
  ---
  duration_ms: 56.611208
  type: 'test'
  ...
# Subtest: ai pr fails closed when a PR-phase finding is neither closed nor accepted
ok 170 - ai pr fails closed when a PR-phase finding is neither closed nor accepted
  ---
  duration_ms: 59.328
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
# AI prepare-context write plan
# Mode: live
# Project: planner-write-demo
# Project slug: planner-write-demo
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
# AI prepare-context write plan
# Mode: live
# Project: planner-review-edit
# Project slug: planner-review-edit
# Writes: docs-only
# Product code: untouched
# Proposed docs: docs/AI_CONTEXT.md, docs/STATUS.md
# Planned writes: docs/AI_CONTEXT.md, docs/STATUS.md
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
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
# Snapshot: .quiver/runs/run-2026-09-07t02-50-42z/snapshots/20260907T025042Z
# [?25l
# │
# ◇  Agent finished
# [?25h
# Subtest: ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
ok 171 - ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes
  ---
  duration_ms: 155.33225
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
ok 172 - ai prepare-context --with-planner --dry-run normalizes CLI display model aliases
  ---
  duration_ms: 136.124791
  type: 'test'
  ...
# Subtest: ai prepare-context blocks legacy profile display aliases before provider execution
ok 173 - ai prepare-context blocks legacy profile display aliases before provider execution
  ---
  duration_ms: 27.205041
  type: 'test'
  ...
# Subtest: ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
ok 174 - ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes
  ---
  duration_ms: 147.373167
  type: 'test'
  ...
# Subtest: planner prepare-context shows human TTY progress with selected profile name
ok 175 - planner prepare-context shows human TTY progress with selected profile name
  ---
  duration_ms: 47.251875
  type: 'test'
  ...
# Subtest: planner prepare-context stops progress spinner on provider failure
ok 176 - planner prepare-context stops progress spinner on provider failure
  ---
  duration_ms: 1.697083
  type: 'test'
  ...
# Subtest: planner prepare-context writes validated docs-only proposal and snapshots before writes
ok 177 - planner prepare-context writes validated docs-only proposal and snapshots before writes
  ---
  duration_ms: 21.736
  type: 'test'
  ...
# Subtest: provider failure during planner prepare-context writes no docs
ok 178 - provider failure during planner prepare-context writes no docs
  ---
  duration_ms: 8.392458
  type: 'test'
  ...
# Subtest: invalid planner output writes no docs
ok 179 - invalid planner output writes no docs
  ---
  duration_ms: 4.748375
  type: 'test'
  ...
# Subtest: review cancellation leaves docs untouched
ok 180 - review cancellation leaves docs untouched
  ---
  duration_ms: 5.352875
  type: 'test'
  ...
# Subtest: review flow revalidates edited proposal before writing docs
ok 181 - review flow revalidates edited proposal before writing docs
  ---
  duration_ms: 33.294291
  type: 'test'
  ...
# Subtest: interactive planner approval can decline without writes
ok 182 - interactive planner approval can decline without writes
  ---
  duration_ms: 25.095459
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
# Timestamp: 2026-09-07T02:50:43.578Z
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
# Timestamp: 2026-09-07T02:50:48.262Z
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
# Timestamp: 2026-09-07T02:50:49.785Z
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
ok 183 - ai review-plan dry-run uses the latest technical-plan draft
  ---
  duration_ms: 188.168625
  type: 'test'
  ...
# Subtest: ai review-plan print-prompt renders review prompt without provider auth
ok 184 - ai review-plan print-prompt renders review prompt without provider auth
  ---
  duration_ms: 200.534333
  type: 'test'
  ...
# Subtest: ai review-plan rejects missing technical-plan draft
ok 185 - ai review-plan rejects missing technical-plan draft
  ---
  duration_ms: 168.043291
  type: 'test'
  ...
# Subtest: ai review-plan persists review state and becomes valid after approving the reviewed draft
ok 186 - ai review-plan persists review state and becomes valid after approving the reviewed draft
  ---
  duration_ms: 450.274541
  type: 'test'
  ...
# Subtest: governed review preserves the last valid state and omission does not close an open blocker
ok 187 - governed review preserves the last valid state and omission does not close an open blocker
  ---
  duration_ms: 316.124292
  type: 'test'
  ...
# Subtest: governed approval is default-deny before mutation and records explicit authorization
ok 188 - governed approval is default-deny before mutation and records explicit authorization
  ---
  duration_ms: 184.622833
  type: 'test'
  ...
# Subtest: conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
ok 189 - conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible
  ---
  duration_ms: 223.5505
  type: 'test'
  ...
# Subtest: conditioned approval preserves authorization and protected-critical precedence without mutation
ok 190 - conditioned approval preserves authorization and protected-critical precedence without mutation
  ---
  duration_ms: 348.490708
  type: 'test'
  ...
# Subtest: conditioned approval preserves a sanitized identity failure code without mutation
ok 191 - conditioned approval preserves a sanitized identity failure code without mutation
  ---
  duration_ms: 105.728667
  type: 'test'
  ...
# Subtest: governed approval rechecks canonical blockers under the run lock after identity resolution
ok 192 - governed approval rechecks canonical blockers under the run lock after identity resolution
  ---
  duration_ms: 194.573792
  type: 'test'
  ...
# Subtest: governed blocking review can revise to an owned draft and review again
ok 193 - governed blocking review can revise to an owned draft and review again
  ---
  duration_ms: 329.071333
  type: 'test'
  ...
# Subtest: governed review exhaustion blocks provider preflight and execution with five explicit actions
ok 194 - governed review exhaustion blocks provider preflight and execution with five explicit actions
  ---
  duration_ms: 156.582542
  type: 'test'
  ...
# Subtest: governed review validates immutable candidate and targeted scope before provider invocation
ok 195 - governed review validates immutable candidate and targeted scope before provider invocation
  ---
  duration_ms: 113.709083
  type: 'test'
  ...
# Subtest: governed pre-payload timeout retries the same envelope and consumes one semantic review on success
ok 196 - governed pre-payload timeout retries the same envelope and consumes one semantic review on success
  ---
  duration_ms: 108.584334
  type: 'test'
  ...
# Subtest: missing provider CLI releases the semantic slot as a transport retry
ok 197 - missing provider CLI releases the semantic slot as a transport retry
  ---
  duration_ms: 132.190583
  type: 'test'
  ...
# Subtest: governed review rejects diagnostic-only success as a pre-payload transport retry
ok 198 - governed review rejects diagnostic-only success as a pre-payload transport retry
  ---
  duration_ms: 140.125333
  type: 'test'
  ...
# Subtest: canonical reviews without ledger outcomes fail closed before provider or extension mutation
ok 199 - canonical reviews without ledger outcomes fail closed before provider or extension mutation
  ---
  duration_ms: 119.958041
  type: 'test'
  ...
# Subtest: governed review WAL recovers every interrupted commit point exactly once
ok 200 - governed review WAL recovers every interrupted commit point exactly once
  ---
  duration_ms: 721.409542
  type: 'test'
  ...
# Subtest: corrupt or foreign governed review WAL fails closed without publishing state
ok 201 - corrupt or foreign governed review WAL fails closed without publishing state
  ---
  duration_ms: 180.718958
  type: 'test'
  ...
# Subtest: run close rejects an in-flight provider reservation and remains isolated by run
ok 202 - run close rejects an in-flight provider reservation and remains isolated by run
  ---
  duration_ms: 180.120375
  type: 'test'
  ...
# Subtest: provider payload failures consume budget consistently in TTY and non-TTY modes
ok 203 - provider payload failures consume budget consistently in TTY and non-TTY modes
  ---
  duration_ms: 199.033959
  type: 'test'
  ...
# Subtest: governed review rejects a candidate that changes while the provider is running and consumes the received payload
ok 204 - governed review rejects a candidate that changes while the provider is running and consumes the received payload
  ---
  duration_ms: 108.311208
  type: 'test'
  ...
# Subtest: review budget extension action resolves identity and rejects caller-supplied actor claims
ok 205 - review budget extension action resolves identity and rejects caller-supplied actor claims
  ---
  duration_ms: 135.521833
  type: 'test'
  ...
# Subtest: governed review inherits the active profile and renders the effective policy in its prompt
ok 206 - governed review inherits the active profile and renders the effective policy in its prompt
  ---
  duration_ms: 331.247833
  type: 'test'
  ...
# Subtest: governed runs fail closed when governance config disappears before review or approval
ok 207 - governed runs fail closed when governance config disappears before review or approval
  ---
  duration_ms: 86.332959
  type: 'test'
  ...
# Subtest: an explicit governance profile without config fails before creating a run or invoking a provider
ok 208 - an explicit governance profile without config fails before creating a run or invoking a provider
  ---
  duration_ms: 47.71
  type: 'test'
  ...
# Subtest: governed review without a run-owned versioned draft fails before provider invocation
ok 209 - governed review without a run-owned versioned draft fails before provider invocation
  ---
  duration_ms: 53.243417
  type: 'test'
  ...
# Subtest: governed reviews and approvals cannot consume another run artifact or review
ok 210 - governed reviews and approvals cannot consume another run artifact or review
  ---
  duration_ms: 296.057959
  type: 'test'
  ...
# Subtest: governed mutations reject a closed explicit run before provider, identity, or artifact writes
ok 211 - governed mutations reject a closed explicit run before provider, identity, or artifact writes
  ---
  duration_ms: 101.521458
  type: 'test'
  ...
# Subtest: governed review commit rejects profile downgrade and foreign-run canonical state under the lock
ok 212 - governed review commit rejects profile downgrade and foreign-run canonical state under the lock
  ---
  duration_ms: 75.736
  type: 'test'
  ...
# Subtest: ai review-plan shows human TTY progress during live provider execution
ok 213 - ai review-plan shows human TTY progress during live provider execution
  ---
  duration_ms: 56.387875
  type: 'test'
  ...
# Subtest: ai approve selects acceptance draft interactively when version is omitted
ok 214 - ai approve selects acceptance draft interactively when version is omitted
  ---
  duration_ms: 141.848917
  type: 'test'
  ...
# Subtest: ai approve without version remains explicit in no-TTY mode
ok 215 - ai approve without version remains explicit in no-TTY mode
  ---
  duration_ms: 245.861292
  type: 'test'
  ...
# Subtest: ai approve interactive selection refuses non-current acceptance drafts
ok 216 - ai approve interactive selection refuses non-current acceptance drafts
  ---
  duration_ms: 84.719
  type: 'test'
  ...
# Subtest: ai review-plan marks review stale when the technical-plan draft changes
ok 217 - ai review-plan marks review stale when the technical-plan draft changes
  ---
  duration_ms: 106.963084
  type: 'test'
  ...
# Subtest: ai approve blocks technical-plan approval when the latest review is stale
ok 218 - ai approve blocks technical-plan approval when the latest review is stale
  ---
  duration_ms: 260.485459
  type: 'test'
  ...
# Subtest: ai review-plan persists approve recommendation metadata
ok 219 - ai review-plan persists approve recommendation metadata
  ---
  duration_ms: 262.818667
  type: 'test'
  ...
# Subtest: ai review-plan approve-with-risk recommendation still allows explicit approval
ok 220 - ai review-plan approve-with-risk recommendation still allows explicit approval
  ---
  duration_ms: 314.502834
  type: 'test'
  ...
# Subtest: technical-plan approval candidates expose review recommendation and approvability
ok 221 - technical-plan approval candidates expose review recommendation and approvability
  ---
  duration_ms: 111.624792
  type: 'test'
  ...
# Subtest: ai approve selects technical-plan draft interactively with review context
ok 222 - ai approve selects technical-plan draft interactively with review context
  ---
  duration_ms: 156.614625
  type: 'test'
  ...
# Subtest: ai review-plan revise recommendation blocks technical-plan approval
ok 223 - ai review-plan revise recommendation blocks technical-plan approval
  ---
  duration_ms: 318.243458
  type: 'test'
  ...
# Subtest: ai plan spec phase rejects approved technical plans that were not reviewed
ok 224 - ai plan spec phase rejects approved technical plans that were not reviewed
  ---
  duration_ms: 247.545959
  type: 'test'
  ...
# Subtest: ai review-plan surfaces provider failures with task context
ok 225 - ai review-plan surfaces provider failures with task context
  ---
  duration_ms: 50.50275
  type: 'test'
  ...
# create-quiver: ai run create requiere --input <requirements.md>
# create-quiver: subcomando ai run no soportado: watch. Tareas soportadas: create, close
# Subtest: ai run create creates persistent run state and ai status can inspect it
ok 226 - ai run create creates persistent run state and ai status can inspect it
  ---
  duration_ms: 523.199792
  type: 'test'
  ...
# Subtest: ai status and resume render Spanish human output while preserving commands
ok 227 - ai status and resume render Spanish human output while preserving commands
  ---
  duration_ms: 511.063458
  type: 'test'
  ...
# Subtest: ai status and resume use current approval candidate versions
ok 228 - ai status and resume use current approval candidate versions
  ---
  duration_ms: 704.034875
  type: 'test'
  ...
# Subtest: ai status makes multiple open runs visible
ok 229 - ai status makes multiple open runs visible
  ---
  duration_ms: 511.332333
  type: 'test'
  ...
# Subtest: ai run close archives a selected run without deleting evidence
ok 230 - ai run close archives a selected run without deleting evidence
  ---
  duration_ms: 580.740583
  type: 'test'
  ...
# Subtest: ai run create and close render Spanish human wrappers while preserving ids
ok 231 - ai run create and close render Spanish human wrappers while preserving ids
  ---
  duration_ms: 316.9315
  type: 'test'
  ...
# Subtest: ai run command errors render Spanish without translating commands
ok 232 - ai run command errors render Spanish without translating commands
  ---
  duration_ms: 330.363916
  type: 'test'
  ...
# Subtest: ai approvals separates run-scoped approvals from global planner approvals
ok 233 - ai approvals separates run-scoped approvals from global planner approvals
  ---
  duration_ms: 477.412833
  type: 'test'
  ...
# Subtest: ai approvals fails closed when a run projection points at another run
ok 234 - ai approvals fails closed when a run projection points at another run
  ---
  duration_ms: 638.403875
  type: 'test'
  ...
# Subtest: status, resume, approvals, export, and flow share one canonical governance projection
ok 235 - status, resume, approvals, export, and flow share one canonical governance projection
  ---
  duration_ms: 909.346542
  type: 'test'
  ...
# Subtest: ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
ok 236 - ai approvals rejects foreign canonical rows and downgrade attempts while preserving legacy rows
  ---
  duration_ms: 560.131625
  type: 'test'
  ...
# Subtest: ai status reports no active run without creating files
ok 237 - ai status reports no active run without creating files
  ---
  duration_ms: 308.62975
  type: 'test'
  ...
# Subtest: ai approval show, verify, and export consume the same canonical decision
ok 238 - ai approval show, verify, and export consume the same canonical decision
  ---
  duration_ms: 903.946791
  type: 'test'
  ...
# Subtest: ai approval verify fails closed with one JSON document after artifact or projection tampering
ok 239 - ai approval verify fails closed with one JSON document after artifact or projection tampering
  ---
  duration_ms: 706.039625
  type: 'test'
  ...
# Subtest: ai approval requires an explicit run when more than one active run exists
ok 240 - ai approval requires an explicit run when more than one active run exists
  ---
  duration_ms: 594.715542
  type: 'test'
  ...
# Subtest: two active runs publish only their own approval candidate and canonical counts
ok 241 - two active runs publish only their own approval candidate and canonical counts
  ---
  duration_ms: 821.956917
  type: 'test'
  ...
# Subtest: a run in approval recovery cannot break explicit status or close for another run
ok 242 - a run in approval recovery cannot break explicit status or close for another run
  ---
  duration_ms: 617.422333
  type: 'test'
  ...
# Subtest: rollback recovers a prepared approval WAL before blocking the requested writer
ok 243 - rollback recovers a prepared approval WAL before blocking the requested writer
  ---
  duration_ms: 705.833167
  type: 'test'
  ...
# Subtest: analyze writes raw scan under .quiver and keeps project map visible
ok 244 - analyze writes raw scan under .quiver and keeps project map visible
  ---
  duration_ms: 193.453542
  type: 'test'
  ...
# Subtest: analyze shows transient progress only in safe TTY mode
ok 245 - analyze shows transient progress only in safe TTY mode
  ---
  duration_ms: 36.538708
  type: 'test'
  ...
# Subtest: analyze suppresses transient progress when no-color opts out
ok 246 - analyze suppresses transient progress when no-color opts out
  ---
  duration_ms: 1.897916
  type: 'test'
  ...
# Subtest: analyze dry-run reports planned artifacts without writing files
ok 247 - analyze dry-run reports planned artifacts without writing files
  ---
  duration_ms: 184.990833
  type: 'test'
  ...
# Subtest: analyze dry-run supports Spanish human output without translating paths
ok 248 - analyze dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 156.933792
  type: 'test'
  ...
# Subtest: analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
ok 249 - analyze recognizes a plain Node/JavaScript project and surfaces useful scripts
  ---
  duration_ms: 192.308375
  type: 'test'
  ...
# Subtest: analyze recognizes React plus Vite without misclassifying it as Vue
ok 250 - analyze recognizes React plus Vite without misclassifying it as Vue
  ---
  duration_ms: 165.279584
  type: 'test'
  ...
# Subtest: top-level --version prints the installed package version
ok 251 - top-level --version prints the installed package version
  ---
  duration_ms: 162.770542
  type: 'test'
  ...
# Subtest: top-level -V prints the installed package version
ok 252 - top-level -V prints the installed package version
  ---
  duration_ms: 133.702
  type: 'test'
  ...
# Subtest: version command prints human and JSON metadata without changing semver flags
ok 253 - version command prints human and JSON metadata without changing semver flags
  ---
  duration_ms: 295.133958
  type: 'test'
  ...
# Subtest: local quiver alias points to the same CLI entrypoint
ok 254 - local quiver alias points to the same CLI entrypoint
  ---
  duration_ms: 0.160917
  type: 'test'
  ...
# Subtest: top-level help command prints grouped command descriptions
ok 255 - top-level help command prints grouped command descriptions
  ---
  duration_ms: 153.093041
  type: 'test'
  ...
# Subtest: help output documents important public commands
ok 256 - help output documents important public commands
  ---
  duration_ms: 159.70525
  type: 'test'
  ...
# Subtest: ai approval accepts the singular verify contract and emits a clean JSON runtime error
ok 257 - ai approval accepts the singular verify contract and emits a clean JSON runtime error
  ---
  duration_ms: 151.334916
  type: 'test'
  ...
# Subtest: ai approval rejects missing or unsupported singular subcommands
ok 258 - ai approval rejects missing or unsupported singular subcommands
  ---
  duration_ms: 303.848333
  type: 'test'
  ...
# Subtest: ai approvals --json emits one canonical projection without stderr
ok 259 - ai approvals --json emits one canonical projection without stderr
  ---
  duration_ms: 140.444625
  type: 'test'
  ...
# Subtest: spec create --json emits one machine error document without stderr
ok 260 - spec create --json emits one machine error document without stderr
  ---
  duration_ms: 174.376875
  type: 'test'
  ...
# Subtest: approval value flags reject a following flag as a missing value
ok 261 - approval value flags reject a following flag as a missing value
  ---
  duration_ms: 971.043875
  type: 'test'
  ...
# Subtest: findings namespace validates its public subcommands and value flags before mutation
ok 262 - findings namespace validates its public subcommands and value flags before mutation
  ---
  duration_ms: 1048.808625
  type: 'test'
  ...
# Subtest: findings JSON runtime failures use one machine envelope and no stderr prose
ok 263 - findings JSON runtime failures use one machine envelope and no stderr prose
  ---
  duration_ms: 138.119167
  type: 'test'
  ...
# Subtest: ai approve rejects decisions outside the public approval vocabulary
ok 264 - ai approve rejects decisions outside the public approval vocabulary
  ---
  duration_ms: 152.476083
  type: 'test'
  ...
# Subtest: governance profile flag rejects unknown profile names before command execution
ok 265 - governance profile flag rejects unknown profile names before command execution
  ---
  duration_ms: 130.712583
  type: 'test'
  ...
# Subtest: global --lang works before and after command names without changing JSON output
ok 266 - global --lang works before and after command names without changing JSON output
  ---
  duration_ms: 505.354708
  type: 'test'
  ...
# Subtest: unsupported global --lang falls back without polluting JSON output
ok 267 - unsupported global --lang falls back without polluting JSON output
  ---
  duration_ms: 171.129208
  type: 'test'
  ...
# Subtest: global --lang before help is accepted
ok 268 - global --lang before help is accepted
  ---
  duration_ms: 150.478375
  type: 'test'
  ...
# Subtest: help uses configured project language without requiring --lang
ok 269 - help uses configured project language without requiring --lang
  ---
  duration_ms: 184.316583
  type: 'test'
  ...
# Subtest: ai approve --version remains a draft-version option
ok 270 - ai approve --version remains a draft-version option
  ---
  duration_ms: 151.934083
  type: 'test'
  ...
# Subtest: global --lang requires a value
ok 271 - global --lang requires a value
  ---
  duration_ms: 146.882875
  type: 'test'
  ...
# Subtest: early parser errors use the resolved language and keep JSON stdout empty
ok 272 - early parser errors use the resolved language and keep JSON stdout empty
  ---
  duration_ms: 303.921875
  type: 'test'
  ...
# Subtest: unsupported commands fail with localized actionable guidance
ok 273 - unsupported commands fail with localized actionable guidance
  ---
  duration_ms: 290.291875
  type: 'test'
  ...
# Subtest: config language set writes project config and preserves existing keys
ok 274 - config language set writes project config and preserves existing keys
  ---
  duration_ms: 170.180166
  type: 'test'
  ...
# Subtest: config language refuses to overwrite an invalid governance namespace
ok 275 - config language refuses to overwrite an invalid governance namespace
  ---
  duration_ms: 161.203541
  type: 'test'
  ...
# Subtest: config language show reports effective project language in human and JSON modes
ok 276 - config language show reports effective project language in human and JSON modes
  ---
  duration_ms: 511.772291
  type: 'test'
  ...
# Subtest: config language set --global writes user config without project config
ok 277 - config language set --global writes user config without project config
  ---
  duration_ms: 327.285167
  type: 'test'
  ...
# Subtest: config language set --json emits stable machine output
ok 278 - config language set --json emits stable machine output
  ---
  duration_ms: 173.798584
  type: 'test'
  ...
# Subtest: config language show respects overrides without polluting JSON
ok 279 - config language show respects overrides without polluting JSON
  ---
  duration_ms: 471.021541
  type: 'test'
  ...
# Subtest: config language rejects invalid values and unsupported --global usage
ok 280 - config language rejects invalid values and unsupported --global usage
  ---
  duration_ms: 492.900333
  type: 'test'
  ...
# Subtest: config language errors localize and keep JSON stdout clean
ok 281 - config language errors localize and keep JSON stdout clean
  ---
  duration_ms: 443.72225
  type: 'test'
  ...
# Subtest: dashboard human output shows consolidated project status
ok 282 - dashboard human output shows consolidated project status
  ---
  duration_ms: 215.664958
  type: 'test'
  ...
# Subtest: dashboard JSON output is parseable and stable
ok 283 - dashboard JSON output is parseable and stable
  ---
  duration_ms: 227.807875
  type: 'test'
  ...
# Subtest: dashboard human output renders Spanish with flag or project config
ok 284 - dashboard human output renders Spanish with flag or project config
  ---
  duration_ms: 370.46175
  type: 'test'
  ...
# Subtest: dashboard --include-completed changes only the visible slice set
ok 285 - dashboard --include-completed changes only the visible slice set
  ---
  duration_ms: 202.904542
  type: 'test'
  ...
# Subtest: dashboard keeps JSON error payloads stable with Spanish language
ok 286 - dashboard keeps JSON error payloads stable with Spanish language
  ---
  duration_ms: 200.927042
  type: 'test'
  ...
# Subtest: dashboard missing spec keeps JSON stdout parseable on failure
ok 287 - dashboard missing spec keeps JSON stdout parseable on failure
  ---
  duration_ms: 205.930417
  type: 'test'
  ...
# Subtest: dashboard localized details and section views preserve exact commands
ok 288 - dashboard localized details and section views preserve exact commands
  ---
  duration_ms: 357.788375
  type: 'test'
  ...
# Subtest: dashboard supports details, section, and limit human views
ok 289 - dashboard supports details, section, and limit human views
  ---
  duration_ms: 354.251833
  type: 'test'
  ...
# Subtest: dashboard rejects ambiguous and invalid human flags
ok 290 - dashboard rejects ambiguous and invalid human flags
  ---
  duration_ms: 329.188417
  type: 'test'
  ...
# Subtest: dashboard invalid section errors are localized and list supported sections
ok 291 - dashboard invalid section errors are localized and list supported sections
  ---
  duration_ms: 310.899333
  type: 'test'
  ...
# Subtest: dashboard human-only flags keep JSON failures parseable
ok 292 - dashboard human-only flags keep JSON failures parseable
  ---
  duration_ms: 171.990125
  type: 'test'
  ...
# Subtest: dashboard invalid section keeps JSON error payload parseable and English
ok 293 - dashboard invalid section keeps JSON error payload parseable and English
  ---
  duration_ms: 154.965292
  type: 'test'
  ...
# Subtest: dashboard-only flags fail clearly outside dashboard command
ok 294 - dashboard-only flags fail clearly outside dashboard command
  ---
  duration_ms: 141.927875
  type: 'test'
  ...
# Subtest: dashboard reports graph errors without crashing JSON output
ok 295 - dashboard reports graph errors without crashing JSON output
  ---
  duration_ms: 189.51425
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run prints planned files without writing
ok 296 - demo create spec-viewer dry-run prints planned files without writing
  ---
  duration_ms: 165.793292
  type: 'test'
  ...
# Subtest: demo create spec-viewer dry-run supports Spanish human output without translating paths
ok 297 - demo create spec-viewer dry-run supports Spanish human output without translating paths
  ---
  duration_ms: 180.289
  type: 'test'
  ...
# Subtest: demo create spec-viewer reads the configured project language by default
ok 298 - demo create spec-viewer reads the configured project language by default
  ---
  duration_ms: 202.535875
  type: 'test'
  ...
# Subtest: demo create spec-viewer defaults to a nested target on dry-run
ok 299 - demo create spec-viewer defaults to a nested target on dry-run
  ---
  duration_ms: 166.335666
  type: 'test'
  ...
# Subtest: demo create spec-viewer writes a small runnable demo
ok 300 - demo create spec-viewer writes a small runnable demo
  ---
  duration_ms: 2406.744458
  type: 'test'
  ...
# Subtest: generated demo documents and implements occupied-port fallback without network fixtures
ok 301 - generated demo documents and implements occupied-port fallback without network fixtures
  ---
  duration_ms: 193.403167
  type: 'test'
  ...
# Subtest: demo create spec-viewer preserves existing files
ok 302 - demo create spec-viewer preserves existing files
  ---
  duration_ms: 208.989375
  type: 'test'
  ...
# Subtest: demo rejects unsupported names and subcommands clearly
ok 303 - demo rejects unsupported names and subcommands clearly
  ---
  duration_ms: 327.106792
  type: 'test'
  ...
# Subtest: doctor accepts the new default init layout before specs exist
ok 304 - doctor accepts the new default init layout before specs exist
  ---
  duration_ms: 5143.618083
  type: 'test'
  ...
# Subtest: doctor localizes human output while preserving command snippets
ok 305 - doctor localizes human output while preserving command snippets
  ---
  duration_ms: 4820.457208
  type: 'test'
  ...
# Subtest: doctor json emits parseable diagnostics with human parity
ok 306 - doctor json emits parseable diagnostics with human parity
  ---
  duration_ms: 7194.672334
  type: 'test'
  ...
# Subtest: doctor json exits deterministically for blocking layout errors
ok 307 - doctor json exits deterministically for blocking layout errors
  ---
  duration_ms: 1006.888917
  type: 'test'
  ...
# Subtest: doctor warns when package scripts target unsupported create-quiver commands
ok 308 - doctor warns when package scripts target unsupported create-quiver commands
  ---
  duration_ms: 2894.234959
  type: 'test'
  ...
# Subtest: doctor fix dry-run previews safe repairs without writing
ok 309 - doctor fix dry-run previews safe repairs without writing
  ---
  duration_ms: 1922.881958
  type: 'test'
  ...
# Subtest: doctor fix applies safe repairs idempotently
ok 310 - doctor fix applies safe repairs idempotently
  ---
  duration_ms: 3913.498042
  type: 'test'
  ...
# Subtest: doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
ok 311 - doctor fix migrates a blanket .quiver Git exclusion to granular runtime rules
  ---
  duration_ms: 4946.792083
  type: 'test'
  ...
# Subtest: doctor diagnoses missing governance and requires explicit migration without rewriting config
ok 312 - doctor diagnoses missing governance and requires explicit migration without rewriting config
  ---
  duration_ms: 3009.24375
  type: 'test'
  ...
# Subtest: doctor reports invalid governance without overwriting authorization policy
ok 313 - doctor reports invalid governance without overwriting authorization policy
  ---
  duration_ms: 2997.204292
  type: 'test'
  ...
# Subtest: doctor gives actionable AGENTS.md repair guidance
ok 314 - doctor gives actionable AGENTS.md repair guidance
  ---
  duration_ms: 2823.557916
  type: 'test'
  ...
# Subtest: doctor fix repairs AGENTS.md contract without replacing manual content
ok 315 - doctor fix repairs AGENTS.md contract without replacing manual content
  ---
  duration_ms: 3993.319042
  type: 'test'
  ...
# Subtest: doctor warns about missing local markdown links in generated docs
ok 316 - doctor warns about missing local markdown links in generated docs
  ---
  duration_ms: 2974.91175
  type: 'test'
  ...
# Subtest: doctor reports a legacy layout with migration guidance
ok 317 - doctor reports a legacy layout with migration guidance
  ---
  duration_ms: 1041.707667
  type: 'test'
  ...
# Subtest: doctor accepts the minimal init layout before specs exist
ok 318 - doctor accepts the minimal init layout before specs exist
  ---
  duration_ms: 3010.185333
  type: 'test'
  ...
# Subtest: doctor reports a hybrid layout when explicit full compatibility assets exist
ok 319 - doctor reports a hybrid layout when explicit full compatibility assets exist
  ---
  duration_ms: 3226.029542
  type: 'test'
  ...
# Subtest: doctor examples prefer an active slice over the first spec alphabetically
ok 320 - doctor examples prefer an active slice over the first spec alphabetically
  ---
  duration_ms: 2871.181208
  type: 'test'
  ...
# Subtest: doctor uses generic examples when multiple specs have no active slice
ok 321 - doctor uses generic examples when multiple specs have no active slice
  ---
  duration_ms: 2825.541542
  type: 'test'
  ...
# Subtest: doctor reports stale generated context when scan is newer than project map
ok 322 - doctor reports stale generated context when scan is newer than project map
  ---
  duration_ms: 2069.068584
  type: 'test'
  ...
# Subtest: doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
ok 323 - doctor reports old incomplete .quiver state as migration-needed instead of init bootstrap
  ---
  duration_ms: 3393.552625
  type: 'test'
  ...
# Subtest: evidence run records successful command output
ok 324 - evidence run records successful command output
  ---
  duration_ms: 225.318792
  type: 'test'
  ...
# Subtest: evidence run supports Spanish human output without translating command or path
ok 325 - evidence run supports Spanish human output without translating command or path
  ---
  duration_ms: 220.439125
  type: 'test'
  ...
# Subtest: evidence run preserves failing command exit code
ok 326 - evidence run preserves failing command exit code
  ---
  duration_ms: 206.76875
  type: 'test'
  ...
# Subtest: evidence run truncates long output
ok 327 - evidence run truncates long output
  ---
  duration_ms: 194.897292
  type: 'test'
  ...
# Subtest: evidence list and show emit parseable JSON
ok 328 - evidence list and show emit parseable JSON
  ---
  duration_ms: 522.749833
  type: 'test'
  ...
# Subtest: evidence run rejects traversal output before running child command
ok 329 - evidence run rejects traversal output before running child command
  ---
  duration_ms: 172.575458
  type: 'test'
  ...
# Subtest: evidence run requires a command after separator
ok 330 - evidence run requires a command after separator
  ---
  duration_ms: 167.4235
  type: 'test'
  ...
# Subtest: evidence run missing command error localizes without stdout noise
ok 331 - evidence run missing command error localizes without stdout noise
  ---
  duration_ms: 133.214583
  type: 'test'
  ...
# Subtest: formatOutputPath keeps external outputs absolute
ok 332 - formatOutputPath keeps external outputs absolute
  ---
  duration_ms: 0.354292
  type: 'test'
  ...
# Subtest: individual transfer preserves exact criterion bytes and writes one canonical disposition
ok 333 - individual transfer preserves exact criterion bytes and writes one canonical disposition
  ---
  duration_ms: 66.689875
  type: 'test'
  ...
# Subtest: invocation files stay scoped to the invoking worktree while run state stays canonical
ok 334 - invocation files stay scoped to the invoking worktree while run state stays canonical
  ---
  duration_ms: 68.242292
  type: 'test'
  ...
# Subtest: batch keyed-map and canonical-envelope forms require explicit supersession
ok 335 - batch keyed-map and canonical-envelope forms require explicit supersession
  ---
  duration_ms: 116.717458
  type: 'test'
  ...
# Subtest: batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
ok 336 - batch preserves historical revise, follow-up, and optional actions but rejects accept-risk
  ---
  duration_ms: 97.179167
  type: 'test'
  ...
# Subtest: complete batch validation and unsafe contractual data fail before mutation
ok 337 - complete batch validation and unsafe contractual data fail before mutation
  ---
  duration_ms: 25.571125
  type: 'test'
  ...
# Subtest: criterion binding must resolve uniquely to the current technical-plan criterion before mutation
ok 338 - criterion binding must resolve uniquely to the current technical-plan criterion before mutation
  ---
  duration_ms: 64.041458
  type: 'test'
  ...
# Subtest: unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
ok 339 - unsafe follow-up target_issue fails before mutation while a safe issue remains persistable
  ---
  duration_ms: 99.761167
  type: 'test'
  ...
# Subtest: ambiguous slice aliases and post-review phases are rejected without writes
ok 340 - ambiguous slice aliases and post-review phases are rejected without writes
  ---
  duration_ms: 102.894
  type: 'test'
  ...
# Subtest: direct findings errors redact invocation, canonical, and secret values without changing contracts
ok 341 - direct findings errors redact invocation, canonical, and secret values without changing contracts
  ---
  duration_ms: 54.832125
  type: 'test'
  ...
# Subtest: findings CLI redacts failures consistently in human and JSON modes
ok 342 - findings CLI redacts failures consistently in human and JSON modes
  ---
  duration_ms: 395.111375
  type: 'test'
  ...
# Subtest: package exposes quiver as an alias to the create-quiver binary
ok 343 - package exposes quiver as an alias to the create-quiver binary
  ---
  duration_ms: 0.526667
  type: 'test'
  ...
# Subtest: generated package scripts include the flow entrypoint
ok 344 - generated package scripts include the flow entrypoint
  ---
  duration_ms: 0.160708
  type: 'test'
  ...
# Subtest: flow command is read-only and guides uninitialized projects to init
ok 345 - flow command is read-only and guides uninitialized projects to init
  ---
  duration_ms: 136.07675
  type: 'test'
  ...
# Subtest: flow command localizes uninitialized guidance while preserving commands
ok 346 - flow command localizes uninitialized guidance while preserving commands
  ---
  duration_ms: 143.902
  type: 'test'
  ...
# Subtest: flow command reports analysis guidance when initialized context docs are missing
ok 347 - flow command reports analysis guidance when initialized context docs are missing
  ---
  duration_ms: 181.564291
  type: 'test'
  ...
# Subtest: flow command reports agent profile guidance before planning when context docs exist
ok 348 - flow command reports agent profile guidance before planning when context docs exist
  ---
  duration_ms: 179.362584
  type: 'test'
  ...
# Subtest: flow command reports package-manager-aware generated script guidance
ok 349 - flow command reports package-manager-aware generated script guidance
  ---
  duration_ms: 201.336375
  type: 'test'
  ...
# Subtest: flow command uses the generated project map after analyze
ok 350 - flow command uses the generated project map after analyze
  ---
  duration_ms: 3545.222417
  type: 'test'
  ...
# Subtest: flow command reports criteria draft approval guidance
ok 351 - flow command reports criteria draft approval guidance
  ---
  duration_ms: 188.616958
  type: 'test'
  ...
# Subtest: flow command asks for production review before technical-plan approval
ok 352 - flow command asks for production review before technical-plan approval
  ---
  duration_ms: 291.527541
  type: 'test'
  ...
# Subtest: flow command asks for technical-plan approval after production review
ok 353 - flow command asks for technical-plan approval after production review
  ---
  duration_ms: 299.246125
  type: 'test'
  ...
# Subtest: flow command points to revise when plan review blocks technical-plan approval
ok 354 - flow command points to revise when plan review blocks technical-plan approval
  ---
  duration_ms: 302.537958
  type: 'test'
  ...
# Subtest: flow command reports spec create after reviewed and approved technical plan
ok 355 - flow command reports spec create after reviewed and approved technical plan
  ---
  duration_ms: 350.666375
  type: 'test'
  ...
# Subtest: flow command does not suggest re-approving a technical plan that still needs review
ok 356 - flow command does not suggest re-approving a technical plan that still needs review
  ---
  duration_ms: 345.257167
  type: 'test'
  ...
# Subtest: flow command reports ready slice execution after approved plan and completed slice-00
ok 357 - flow command reports ready slice execution after approved plan and completed slice-00
  ---
  duration_ms: 289.035708
  type: 'test'
  ...
# Subtest: flow command supports machine-readable output
ok 358 - flow command supports machine-readable output
  ---
  duration_ms: 155.555292
  type: 'test'
  ...
# Subtest: flow JSON preserves camelCase and snake_case next command fields for ready slices
ok 359 - flow JSON preserves camelCase and snake_case next command fields for ready slices
  ---
  duration_ms: 273.242958
  type: 'test'
  ...
# Subtest: collectGraph returns pending levels and conflicts
ok 360 - collectGraph returns pending levels and conflicts
  ---
  duration_ms: 44.494542
  type: 'test'
  ...
# Subtest: graph can include completed slices and filter by spec
ok 361 - graph can include completed slices and filter by spec
  ---
  duration_ms: 205.691334
  type: 'test'
  ...
# Subtest: scoped graph does not parse unrelated historical slice artifacts
ok 362 - scoped graph does not parse unrelated historical slice artifacts
  ---
  duration_ms: 5.115916
  type: 'test'
  ...
# Subtest: graph CLI renders an ASCII tree by default
ok 363 - graph CLI renders an ASCII tree by default
  ---
  duration_ms: 182.021083
  type: 'test'
  ...
# Subtest: graph CLI localizes tree output without changing refs
ok 364 - graph CLI localizes tree output without changing refs
  ---
  duration_ms: 165.548167
  type: 'test'
  ...
# Subtest: graph CLI can show conflicts and filter a single level
ok 365 - graph CLI can show conflicts and filter a single level
  ---
  duration_ms: 174.49075
  type: 'test'
  ...
# Subtest: graph CLI reports an empty level in human output and keeps JSON clean
ok 366 - graph CLI reports an empty level in human output and keeps JSON clean
  ---
  duration_ms: 535.07925
  type: 'test'
  ...
# Subtest: graph --json keeps JSON output even when --format selects a human renderer
ok 367 - graph --json keeps JSON output even when --format selects a human renderer
  ---
  duration_ms: 170.732917
  type: 'test'
  ...
# Subtest: graph CLI emits valid JSON
ok 368 - graph CLI emits valid JSON
  ---
  duration_ms: 225.299083
  type: 'test'
  ...
# Subtest: graph CLI prefers Unicode when requested
ok 369 - graph CLI prefers Unicode when requested
  ---
  duration_ms: 170.565291
  type: 'test'
  ...
# Subtest: graph CLI renders Mermaid and DOT formats
ok 370 - graph CLI renders Mermaid and DOT formats
  ---
  duration_ms: 288.869166
  type: 'test'
  ...
# Subtest: graph unsupported format error localizes and keeps JSON stdout clean
ok 371 - graph unsupported format error localizes and keeps JSON stdout clean
  ---
  duration_ms: 150.761334
  type: 'test'
  ...
# Subtest: handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
ok 372 - handoff namespace matches legacy check-handoff behavior and keeps warning on stderr
  ---
  duration_ms: 313.302
  type: 'test'
  ...
# Subtest: handoff new namespace matches legacy new-handoff output and artifacts
ok 373 - handoff new namespace matches legacy new-handoff output and artifacts
  ---
  duration_ms: 374.55625
  type: 'test'
  ...
# Subtest: handoff namespace rejects unsupported subcommands before execution
ok 374 - handoff namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 204.817458
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix covers every documented command
ok 375 - v43 i18n audit matrix covers every documented command
  ---
  duration_ms: 1.785
  type: 'test'
  ...
# Subtest: v43 i18n audit matrix records actionable mode and exception status
ok 376 - v43 i18n audit matrix records actionable mode and exception status
  ---
  duration_ms: 1.393917
  type: 'test'
  ...
# Subtest: init --dry-run prints the planned layout and does not write files
ok 377 - init --dry-run prints the planned layout and does not write files
  ---
  duration_ms: 182.882
  type: 'test'
  ...
# Subtest: legacy --name alias supports dry-run without writing files
ok 378 - legacy --name alias supports dry-run without writing files
  ---
  duration_ms: 162.9355
  type: 'test'
  ...
# Subtest: unsupported subcommands fail clearly instead of initializing a project
ok 379 - unsupported subcommands fail clearly instead of initializing a project
  ---
  duration_ms: 178.193125
  type: 'test'
  ...
# Subtest: init --dry-run reports requested profiles and optional assets
ok 380 - init --dry-run reports requested profiles and optional assets
  ---
  duration_ms: 428.806541
  type: 'test'
  ...
# Subtest: init --interactive resolves guided choices without writing by itself
ok 381 - init --interactive resolves guided choices without writing by itself
  ---
  duration_ms: 23.798084
  type: 'test'
  ...
# Subtest: init --interactive keeps or changes existing project language without dropping config keys
ok 382 - init --interactive keeps or changes existing project language without dropping config keys
  ---
  duration_ms: 23.0485
  type: 'test'
  ...
# Subtest: init --interactive dry-run resolves intended language without writing config
ok 383 - init --interactive dry-run resolves intended language without writing config
  ---
  duration_ms: 9.58275
  type: 'test'
  ...
# Subtest: init --interactive rejects non-TTY automation with explicit flag guidance
ok 384 - init --interactive rejects non-TTY automation with explicit flag guidance
  ---
  duration_ms: 12.249
  type: 'test'
  ...
# Subtest: init rejects incompatible profile flags before writing files
ok 385 - init rejects incompatible profile flags before writing files
  ---
  duration_ms: 137.52925
  type: 'test'
  ...
# Subtest: init command without dry-run writes the default clean AI-first layout
ok 386 - init command without dry-run writes the default clean AI-first layout
  ---
  duration_ms: 3252.272459
  type: 'test'
  ...
# Subtest: explicit init preserves an existing empty Brain byte-for-byte
ok 387 - explicit init preserves an existing empty Brain byte-for-byte
  ---
  duration_ms: 7008.867917
  type: 'test'
  ...
# Subtest: init generated human docs follow --lang and keep machine artifacts stable
ok 388 - init generated human docs follow --lang and keep machine artifacts stable
  ---
  duration_ms: 3846.90175
  type: 'test'
  ...
# Subtest: init uses existing project language config for generated docs without --lang
ok 389 - init uses existing project language config for generated docs without --lang
  ---
  duration_ms: 1818.4605
  type: 'test'
  ...
# Subtest: init --minimal writes only the essential onboarding contract
ok 390 - init --minimal writes only the essential onboarding contract
  ---
  duration_ms: 1785.546875
  type: 'test'
  ...
# Subtest: init --full preserves the historical compatibility layout explicitly
ok 391 - init --full preserves the historical compatibility layout explicitly
  ---
  duration_ms: 2189.138792
  type: 'test'
  ...
# Subtest: init --legacy-scripts writes compatibility wrappers and package scripts without full extras
ok 392 - init --legacy-scripts writes compatibility wrappers and package scripts without full extras
  ---
  duration_ms: 1775.878458
  type: 'test'
  ...
# Subtest: init --include-templates exports packaged templates under .quiver/templates only
ok 393 - init --include-templates exports packaged templates under .quiver/templates only
  ---
  duration_ms: 2182.54575
  type: 'test'
  ...
# Subtest: init preserves existing project files by default
ok 394 - init preserves existing project files by default
  ---
  duration_ms: 1783.936458
  type: 'test'
  ...
# Subtest: init merges root gitignore defaults without deleting existing entries
ok 395 - init merges root gitignore defaults without deleting existing entries
  ---
  duration_ms: 1777.688958
  type: 'test'
  ...
# Subtest: migrate --yes reports legacy layout paths and preserves existing legacy files
ok 396 - migrate --yes reports legacy layout paths and preserves existing legacy files
  ---
  duration_ms: 4345.072792
  type: 'test'
  ...
# Subtest: migrate without --yes is safe and actionable in no-TTY automation
ok 397 - migrate without --yes is safe and actionable in no-TTY automation
  ---
  duration_ms: 7994.87425
  type: 'test'
  ...
# Subtest: migrate cancellation leaves the tree unchanged before side effects
ok 398 - migrate cancellation leaves the tree unchanged before side effects
  ---
  duration_ms: 4102.406709
  type: 'test'
  ...
# Subtest: migrate --dry-run reports planned changes without writing
ok 399 - migrate --dry-run reports planned changes without writing
  ---
  duration_ms: 4106.948875
  type: 'test'
  ...
# Subtest: migrate --dry-run supports Spanish human output without translating commands
ok 400 - migrate --dry-run supports Spanish human output without translating commands
  ---
  duration_ms: 4019.361791
  type: 'test'
  ...
# Subtest: migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
ok 401 - migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe
  ---
  duration_ms: 17692.396292
  type: 'test'
  ...
# Started: spec-a/slice-01-alpha
# Subtest: collectNext returns the first ready slice and the ready set
ok 402 - collectNext returns the first ready slice and the ready set
  ---
  duration_ms: 13.225666
  type: 'test'
  ...
# Subtest: next CLI emits parseable JSON
ok 403 - next CLI emits parseable JSON
  ---
  duration_ms: 196.267708
  type: 'test'
  ...
# Subtest: next CLI prints the top ready slice and the copy-paste command
ok 404 - next CLI prints the top ready slice and the copy-paste command
  ---
  duration_ms: 193.281709
  type: 'test'
  ...
# Subtest: next CLI localizes human output while preserving start command
ok 405 - next CLI localizes human output while preserving start command
  ---
  duration_ms: 185.697875
  type: 'test'
  ...
# Subtest: next CLI can list all ready slices
ok 406 - next CLI can list all ready slices
  ---
  duration_ms: 169.244625
  type: 'test'
  ...
# Subtest: next include-completed reports history without suggesting completed work
ok 407 - next include-completed reports history without suggesting completed work
  ---
  duration_ms: 278.878833
  type: 'test'
  ...
# Subtest: next auto-start rejects non-TTY sessions and can start through an injected prompt
ok 408 - next auto-start rejects non-TTY sessions and can start through an injected prompt
  ---
  duration_ms: 4.041166
  type: 'test'
  ...
# Subtest: next formatter keeps the ready slice command visible
ok 409 - next formatter keeps the ready slice command visible
  ---
  duration_ms: 2.537583
  type: 'test'
  ...
# Subtest: parser adapter requires and delegates to legacy parser
ok 410 - parser adapter requires and delegates to legacy parser
  ---
  duration_ms: 0.807667
  type: 'test'
  ...
# Subtest: command registry reflects supported command surface with explicit changelog wrapper
ok 411 - command registry reflects supported command surface with explicit changelog wrapper
  ---
  duration_ms: 0.085167
  type: 'test'
  ...
# Subtest: baseline parser contracts stay stable for high-risk entry points
ok 412 - baseline parser contracts stay stable for high-risk entry points
  ---
  duration_ms: 766.190375
  type: 'test'
  ...
# Slice graph contains a cycle: spec-a/slice-01-alpha -> spec-a/slice-02-beta -> spec-a/slice-01-alpha
# Subtest: collectPlan returns pending slices, critical path, and total hours
ok 413 - collectPlan returns pending slices, critical path, and total hours
  ---
  duration_ms: 81.551417
  type: 'test'
  ...
# Subtest: plan can include completed slices for history without changing defaults
ok 414 - plan can include completed slices for history without changing defaults
  ---
  duration_ms: 194.545666
  type: 'test'
  ...
# Subtest: collectPlan respects --only-ready and --spec filtering
ok 415 - collectPlan respects --only-ready and --spec filtering
  ---
  duration_ms: 3.853417
  type: 'test'
  ...
# Subtest: scoped plan does not parse unrelated historical slice artifacts
ok 416 - scoped plan does not parse unrelated historical slice artifacts
  ---
  duration_ms: 1.926333
  type: 'test'
  ...
# Subtest: scoped plan keeps explicit external dependencies for readiness
ok 417 - scoped plan keeps explicit external dependencies for readiness
  ---
  duration_ms: 2.654583
  type: 'test'
  ...
# Subtest: plan CLI emits parseable JSON
ok 418 - plan CLI emits parseable JSON
  ---
  duration_ms: 148.12425
  type: 'test'
  ...
# Subtest: plan missing-estimates note is human-only and JSON-safe
ok 419 - plan missing-estimates note is human-only and JSON-safe
  ---
  duration_ms: 470.846375
  type: 'test'
  ...
# Subtest: plan CLI localizes human output without altering slice refs
ok 420 - plan CLI localizes human output without altering slice refs
  ---
  duration_ms: 186.745083
  type: 'test'
  ...
# Subtest: plan CLI stays ASCII by default and can opt into Unicode
ok 421 - plan CLI stays ASCII by default and can opt into Unicode
  ---
  duration_ms: 330.2295
  type: 'test'
  ...
# Subtest: plan CLI fails on cycles with the cycle path in the error
ok 422 - plan CLI fails on cycles with the cycle path in the error
  ---
  duration_ms: 141.240791
  type: 'test'
  ...
# Subtest: prepare dry-run reports checks and does not write files
ok 423 - prepare dry-run reports checks and does not write files
  ---
  duration_ms: 874.328334
  type: 'test'
  ...
# Subtest: prepare reports missing gh with cross-platform guidance
ok 424 - prepare reports missing gh with cross-platform guidance
  ---
  duration_ms: 172.967333
  type: 'test'
  ...
# Subtest: prepare reports a missing provider CLI with actionable guidance
ok 425 - prepare reports a missing provider CLI with actionable guidance
  ---
  duration_ms: 513.326916
  type: 'test'
  ...
# Subtest: prepare reports SSH identity and auth recovery steps
ok 426 - prepare reports SSH identity and auth recovery steps
  ---
  duration_ms: 516.139708
  type: 'test'
  ...
# Subtest: prepare success recommends the next safe command
ok 427 - prepare success recommends the next safe command
  ---
  duration_ms: 767.722292
  type: 'test'
  ...
# Subtest: prepare treats missing README_FOR_AI.md as framework guidance, not project debt
ok 428 - prepare treats missing README_FOR_AI.md as framework guidance, not project debt
  ---
  duration_ms: 496.937542
  type: 'test'
  ...
# Subtest: slice namespace matches legacy check-slice behavior and keeps warning on stderr
ok 429 - slice namespace matches legacy check-slice behavior and keeps warning on stderr
  ---
  duration_ms: 480.883167
  type: 'test'
  ...
# Subtest: legacy slice warning is suppressed when json mode is requested
ok 430 - legacy slice warning is suppressed when json mode is requested
  ---
  duration_ms: 171.846
  type: 'test'
  ...
# Subtest: slice check json failure emits one machine envelope without human prose
ok 431 - slice check json failure emits one machine envelope without human prose
  ---
  duration_ms: 220.146291
  type: 'test'
  ...
# Subtest: slice namespace rejects unsupported subcommands before execution
ok 432 - slice namespace rejects unsupported subcommands before execution
  ---
  duration_ms: 143.144833
  type: 'test'
  ...
# create-quiver: spec branch feature/example-spec is not merged into main. Merge the PR before cleanup, or pass --discard intentionally.
# create-quiver: spec worktree is dirty: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-close-NZ8bom/feature-example-spec. Commit or stash before closing, or pass --discard intentionally.
# Subtest: spec close blocks when spec branch is not merged
ok 433 - spec close blocks when spec branch is not merged
  ---
  duration_ms: 752.435292
  type: 'test'
  ...
# Subtest: spec start dry-run does not create a worktree
ok 434 - spec start dry-run does not create a worktree
  ---
  duration_ms: 357.006958
  type: 'test'
  ...
# Subtest: spec close blocks dirty spec worktrees by default
ok 435 - spec close blocks dirty spec worktrees by default
  ---
  duration_ms: 631.549333
  type: 'test'
  ...
# Subtest: spec close dry-run keeps merged clean worktree in place
ok 436 - spec close dry-run keeps merged clean worktree in place
  ---
  duration_ms: 805.388375
  type: 'test'
  ...
# Subtest: spec close dry-run renders Spanish labels while preserving command details
ok 437 - spec close dry-run renders Spanish labels while preserving command details
  ---
  duration_ms: 804.493
  type: 'test'
  ...
# Subtest: spec close removes a merged clean spec worktree
ok 438 - spec close removes a merged clean spec worktree
  ---
  duration_ms: 834.964375
  type: 'test'
  ...
# Subtest: spec close renders Spanish completion labels
ok 439 - spec close renders Spanish completion labels
  ---
  duration_ms: 889.677
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
# Decision digest: sha256:442360d60626df6dd1920a1ee040f61d903125b853161775a15b430ad720ad99
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
# Decision digest: sha256:a7ecd127f61d13279eace9922e2620dcb7159eb03b5061057983f41745bc6681
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
ok 440 - spec create dry-run previews files and next safe commands without writing
  ---
  duration_ms: 408.934417
  type: 'test'
  ...
# Subtest: spec create --review dry-run advertises review without opening an editor or writing
ok 441 - spec create --review dry-run advertises review without opening an editor or writing
  ---
  duration_ms: 407.81875
  type: 'test'
  ...
# Subtest: spec create dry-run renders Spanish from explicit language without translating commands
ok 442 - spec create dry-run renders Spanish from explicit language without translating commands
  ---
  duration_ms: 463.707167
  type: 'test'
  ...
# Subtest: spec create review dry-run renders Spanish review wrapper safely
ok 443 - spec create review dry-run renders Spanish review wrapper safely
  ---
  duration_ms: 448.964333
  type: 'test'
  ...
# Subtest: spec create dry-run uses configured project language when no flag is provided
ok 444 - spec create dry-run uses configured project language when no flag is provided
  ---
  duration_ms: 471.052916
  type: 'test'
  ...
# Subtest: spec create --review cancellation blocks writes
ok 445 - spec create --review cancellation blocks writes
  ---
  duration_ms: 268.221417
  type: 'test'
  ...
# Subtest: spec create --interactive can decline writes
ok 446 - spec create --interactive can decline writes
  ---
  duration_ms: 230.585584
  type: 'test'
  ...
# Subtest: spec create --interactive writes after guided summary approval
ok 447 - spec create --interactive writes after guided summary approval
  ---
  duration_ms: 230.869042
  type: 'test'
  ...
# Subtest: spec create writes the generated spec tree and refuses collisions
ok 448 - spec create writes the generated spec tree and refuses collisions
  ---
  duration_ms: 629.448667
  type: 'test'
  ...
# Subtest: spec create collision error localizes
ok 449 - spec create collision error localizes
  ---
  duration_ms: 645.873791
  type: 'test'
  ...
# Subtest: spec create blocks when the approved technical plan was not reviewed
ok 450 - spec create blocks when the approved technical plan was not reviewed
  ---
  duration_ms: 246.101667
  type: 'test'
  ...
# Subtest: spec create fails before writing when approved plan lacks structured slices
ok 451 - spec create fails before writing when approved plan lacks structured slices
  ---
  duration_ms: 216.232916
  type: 'test'
  ...
# Subtest: spec create accepts a canonical unconditional decision and publishes its governance manifest
ok 452 - spec create accepts a canonical unconditional decision and publishes its governance manifest
  ---
  duration_ms: 6.4265
  type: 'test'
  ...
# Subtest: spec create resolves an on-disk canonical ledger without an injected governance resolver
ok 453 - spec create resolves an on-disk canonical ledger without an injected governance resolver
  ---
  duration_ms: 450.272875
  type: 'test'
  ...
# Subtest: spec create revalidates governance after preview and fails before publication when parity changes
ok 454 - spec create revalidates governance after preview and fails before publication when parity changes
  ---
  duration_ms: 0.679209
  type: 'test'
  ...
# Subtest: spec validate checks a complete spec package
ok 455 - spec validate checks a complete spec package
  ---
  duration_ms: 161.028375
  type: 'test'
  ...
# Subtest: spec validate renders Spanish report labels without translating paths
ok 456 - spec validate renders Spanish report labels without translating paths
  ---
  duration_ms: 132.561208
  type: 'test'
  ...
# Subtest: spec validate fails on unsafe paths and incomplete briefs
ok 457 - spec validate fails on unsafe paths and incomplete briefs
  ---
  duration_ms: 144.449875
  type: 'test'
  ...
# Subtest: spec validate fails when slice execution git metadata is missing
ok 458 - spec validate fails when slice execution git metadata is missing
  ---
  duration_ms: 189.213458
  type: 'test'
  ...
# Subtest: spec validate strict mode promotes status and evidence warnings
ok 459 - spec validate strict mode promotes status and evidence warnings
  ---
  duration_ms: 167.006667
  type: 'test'
  ...
# Subtest: spec validate strict mode renders Spanish failure wrapper while preserving warning text
ok 460 - spec validate strict mode renders Spanish failure wrapper while preserving warning text
  ---
  duration_ms: 157.84675
  type: 'test'
  ...
# Subtest: spec validate missing directory error localizes
ok 461 - spec validate missing directory error localizes
  ---
  duration_ms: 165.313375
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
ok 462 - spec status shows slice-00 status and pending slices
  ---
  duration_ms: 295.265416
  type: 'test'
  ...
# Subtest: spec status renders Spanish labels while preserving ids and statuses
ok 463 - spec status renders Spanish labels while preserving ids and statuses
  ---
  duration_ms: 263.960666
  type: 'test'
  ...
# Subtest: spec status blocks later slices until slice-00 is completed
ok 464 - spec status blocks later slices until slice-00 is completed
  ---
  duration_ms: 316.67375
  type: 'test'
  ...
# Subtest: spec status reports an expected worktree path that exists but is not registered as stale
ok 465 - spec status reports an expected worktree path that exists but is not registered as stale
  ---
  duration_ms: 297.502917
  type: 'test'
  ...
# Subtest: spec start creates and then reuses a dedicated worktree from main
ok 466 - spec start creates and then reuses a dedicated worktree from main
  ---
  duration_ms: 719.8835
  type: 'test'
  ...
# Subtest: spec start dry-run renders Spanish labels while preserving branch and paths
ok 467 - spec start dry-run renders Spanish labels while preserving branch and paths
  ---
  duration_ms: 375.292792
  type: 'test'
  ...
# Subtest: spec start refuses a dirty checkout
ok 468 - spec start refuses a dirty checkout
  ---
  duration_ms: 364.251917
  type: 'test'
  ...
# Subtest: UX flag matrix documents supported commands
ok 469 - UX flag matrix documents supported commands
  ---
  duration_ms: 1.99325
  type: 'test'
  ...
# Subtest: resolveUxCommandKey handles top-level, ai, and spec commands
ok 470 - resolveUxCommandKey handles top-level, ai, and spec commands
  ---
  duration_ms: 0.243208
  type: 'test'
  ...
# Subtest: supported UX flags validate for planner-capable and PR commands
ok 471 - supported UX flags validate for planner-capable and PR commands
  ---
  duration_ms: 0.581
  type: 'test'
  ...
# Subtest: unsupported UX flags fail with actionable guidance before command execution
ok 472 - unsupported UX flags fail with actionable guidance before command execution
  ---
  duration_ms: 149.357666
  type: 'test'
  ...
# Subtest: ai pr rejects --with-planner while keeping review flags available
ok 473 - ai pr rejects --with-planner while keeping review flags available
  ---
  duration_ms: 157.077625
  type: 'test'
  ...
# Subtest: JSON mode rejects interactive and review flows without partial JSON stdout
ok 474 - JSON mode rejects interactive and review flows without partial JSON stdout
  ---
  duration_ms: 277.809708
  type: 'test'
  ...
# Subtest: read-only ai inspect rejects UX flags early
ok 475 - read-only ai inspect rejects UX flags early
  ---
  duration_ms: 136.387625
  type: 'test'
  ...
# Subtest: existing JSON command output stays parseable when no UX flags are requested
ok 476 - existing JSON command output stays parseable when no UX flags are requested
  ---
  duration_ms: 292.884125
  type: 'test'
  ...
# Subtest: version command renders English and Spanish human labels
ok 477 - version command renders English and Spanish human labels
  ---
  duration_ms: 342.694083
  type: 'test'
  ...
# Subtest: version command uses configured project language without --lang
ok 478 - version command uses configured project language without --lang
  ---
  duration_ms: 154.740292
  type: 'test'
  ...
# Subtest: version JSON and top-level semver output remain stable with language overrides
ok 479 - version JSON and top-level semver output remain stable with language overrides
  ---
  duration_ms: 303.233125
  type: 'test'
  ...
# Subtest: generated command metadata is present in runtime help
ok 480 - generated command metadata is present in runtime help
  ---
  duration_ms: 150.8095
  type: 'test'
  ...
# Subtest: docs command reference generated block is synchronized
ok 481 - docs command reference generated block is synchronized
  ---
  duration_ms: 158.863959
  type: 'test'
  ...
# Subtest: generated block replacement preserves manual content outside markers
ok 482 - generated block replacement preserves manual content outside markers
  ---
  duration_ms: 0.19475
  type: 'test'
  ...
# Subtest: agent profiles persist provider and technical model ids without secrets
ok 483 - agent profiles persist provider and technical model ids without secrets
  ---
  duration_ms: 5.281958
  type: 'test'
  ...
# Subtest: agent profiles normalize known visual model aliases to technical ids
ok 484 - agent profiles normalize known visual model aliases to technical ids
  ---
  duration_ms: 1.224875
  type: 'test'
  ...
# Subtest: agent profiles support multiple named profiles per role with a default
ok 485 - agent profiles support multiple named profiles per role with a default
  ---
  duration_ms: 3.676375
  type: 'test'
  ...
# Subtest: agent profiles list and resolve configured provider defaults
ok 486 - agent profiles list and resolve configured provider defaults
  ---
  duration_ms: 2.449875
  type: 'test'
  ...
# Subtest: agent profiles reject unsupported providers and secret-like values
ok 487 - agent profiles reject unsupported providers and secret-like values
  ---
  duration_ms: 0.548291
  type: 'test'
  ...
# Subtest: agent profile doctor classifies aliases, custom models, and unsupported providers
ok 488 - agent profile doctor classifies aliases, custom models, and unsupported providers
  ---
  duration_ms: 1.109791
  type: 'test'
  ...
# Subtest: agent profile repair plan previews alias normalization without writes
ok 489 - agent profile repair plan previews alias normalization without writes
  ---
  duration_ms: 2.237917
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
ok 490 - assertAnalyzeProjectApplyPreflight blocks dirty target docs without override
  ---
  duration_ms: 1.8845
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
ok 491 - assertAnalyzeProjectApplyPreflight blocks stale target docs even with dirty override
  ---
  duration_ms: 0.919583
  type: 'test'
  ...
# Subtest: assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
ok 492 - assertAnalyzeProjectApplyPreflight accepts create actions with unchanged missing target
  ---
  duration_ms: 0.312834
  type: 'test'
  ...
# Subtest: project discovery reports workspace roots and safety exclusions without reading unsafe paths
ok 493 - project discovery reports workspace roots and safety exclusions without reading unsafe paths
  ---
  duration_ms: 21.598625
  type: 'test'
  ...
# Subtest: semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
ok 494 - semantic sampling summarizes lockfiles as metadata and keeps product code ahead of Quiver docs
  ---
  duration_ms: 4.269375
  type: 'test'
  ...
# Subtest: project discovery handles unknown stack, no package manager, symlinks, and large samples safely
ok 495 - project discovery handles unknown stack, no package manager, symlinks, and large samples safely
  ---
  duration_ms: 67.7535
  type: 'test'
  ...
# Subtest: semantic sampling respects source, test, db, and budget options
ok 496 - semantic sampling respects source, test, db, and budget options
  ---
  duration_ms: 3.575708
  type: 'test'
  ...
# Subtest: project discovery can restrict analysis to a workspace name
ok 497 - project discovery can restrict analysis to a workspace name
  ---
  duration_ms: 3.068291
  type: 'test'
  ...
# Subtest: mergeManagedBlock preserves human content and replaces prior analyze-project block
ok 498 - mergeManagedBlock preserves human content and replaces prior analyze-project block
  ---
  duration_ms: 0.616167
  type: 'test'
  ...
# Subtest: collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
ok 499 - collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish
  ---
  duration_ms: 0.423458
  type: 'test'
  ...
# Subtest: classifyAnalyzeProjectDoc detects scaffold and human content conservatively
ok 500 - classifyAnalyzeProjectDoc detects scaffold and human content conservatively
  ---
  duration_ms: 0.824667
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
ok 501 - mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content
  ---
  duration_ms: 0.219042
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
ok 502 - mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold
  ---
  duration_ms: 1.995167
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
ok 503 - mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block
  ---
  duration_ms: 0.272208
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
ok 504 - mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content
  ---
  duration_ms: 0.589042
  type: 'test'
  ...
# Subtest: mergeAnalyzeProjectDoc is idempotent for the same proposal
ok 505 - mergeAnalyzeProjectDoc is idempotent for the same proposal
  ---
  duration_ms: 0.266334
  type: 'test'
  ...
# Subtest: doc proposal validation allows only approved Markdown docs
ok 506 - doc proposal validation allows only approved Markdown docs
  ---
  duration_ms: 1.5735
  type: 'test'
  ...
# Subtest: write plan preserves human content and snapshot manifest records hashes
ok 507 - write plan preserves human content and snapshot manifest records hashes
  ---
  duration_ms: 18.613042
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
ok 508 - parseAnalyzeProjectOutput accepts evidence-backed JSON analysis
  ---
  duration_ms: 7.775625
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects missing selected evidence paths
ok 509 - parseAnalyzeProjectOutput rejects missing selected evidence paths
  ---
  duration_ms: 0.876417
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
ok 510 - parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files
  ---
  duration_ms: 0.216459
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects unapproved doc update paths
ok 511 - parseAnalyzeProjectOutput rejects unapproved doc update paths
  ---
  duration_ms: 0.242375
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutput rejects malformed provider output
ok 512 - parseAnalyzeProjectOutput rejects malformed provider output
  ---
  duration_ms: 0.2915
  type: 'test'
  ...
# Subtest: analyze-project proposal artifact paths follow the v55 contract
ok 513 - analyze-project proposal artifact paths follow the v55 contract
  ---
  duration_ms: 0.451708
  type: 'test'
  ...
# Subtest: analyze-project proposal run ids reject unsafe path segments
ok 514 - analyze-project proposal run ids reject unsafe path segments
  ---
  duration_ms: 0.279083
  type: 'test'
  ...
# Subtest: proposal and write manifests validate strict safe paths
ok 515 - proposal and write manifests validate strict safe paths
  ---
  duration_ms: 2.694708
  type: 'test'
  ...
# Subtest: proposal manifest rejects traversal and extra keys
ok 516 - proposal manifest rejects traversal and extra keys
  ---
  duration_ms: 0.715166
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
ok 517 - writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest
  ---
  duration_ms: 7.119834
  type: 'test'
  ...
# Subtest: readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
ok 518 - readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits
  ---
  duration_ms: 4.274458
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectWriteManifest writes final normalized apply manifest
ok 519 - writeAnalyzeProjectWriteManifest writes final normalized apply manifest
  ---
  duration_ms: 1.801042
  type: 'test'
  ...
# Subtest: normalizes project-relative evidence paths and rejects outside-scope paths
ok 520 - normalizes project-relative evidence paths and rejects outside-scope paths
  ---
  duration_ms: 2.26175
  type: 'test'
  ...
# Subtest: classifies env examples as metadata-only and real env files as security-excluded
ok 521 - classifies env examples as metadata-only and real env files as security-excluded
  ---
  duration_ms: 5.002042
  type: 'test'
  ...
# Subtest: recognizes metadata-only env template names
ok 522 - recognizes metadata-only env template names
  ---
  duration_ms: 0.2215
  type: 'test'
  ...
# Subtest: classifies generated dependency paths and binary files as excluded
ok 523 - classifies generated dependency paths and binary files as excluded
  ---
  duration_ms: 3.972792
  type: 'test'
  ...
# Subtest: classifies omitted budget files as safe-to-include without reading content
ok 524 - classifies omitted budget files as safe-to-include without reading content
  ---
  duration_ms: 1.18475
  type: 'test'
  ...
# Subtest: classifies lockfile omissions as metadata-only
ok 525 - classifies lockfile omissions as metadata-only
  ---
  duration_ms: 0.555458
  type: 'test'
  ...
# Subtest: classifies omitted binary-file records as generated dependency exclusions
ok 526 - classifies omitted binary-file records as generated dependency exclusions
  ---
  duration_ms: 2.219791
  type: 'test'
  ...
# Subtest: classifies missing and not-discovered safe text files without throwing
ok 527 - classifies missing and not-discovered safe text files without throwing
  ---
  duration_ms: 1.433958
  type: 'test'
  ...
# Subtest: classifies evidence-not-selected issues deterministically and deduplicates paths
ok 528 - classifies evidence-not-selected issues deterministically and deduplicates paths
  ---
  duration_ms: 12.644833
  type: 'test'
  ...
# Subtest: extracts evidence path from provider validation issue message
ok 529 - extracts evidence path from provider validation issue message
  ---
  duration_ms: 1.679916
  type: 'test'
  ...
# Subtest: calculates recovery budgets from safe classified evidence only
ok 530 - calculates recovery budgets from safe classified evidence only
  ---
  duration_ms: 0.755834
  type: 'test'
  ...
# Subtest: never lowers existing budgets and detects category flags from omission reasons
ok 531 - never lowers existing budgets and detects category flags from omission reasons
  ---
  duration_ms: 0.287625
  type: 'test'
  ...
# Subtest: returns scope-required when recommendation exceeds recovery caps
ok 532 - returns scope-required when recommendation exceeds recovery caps
  ---
  duration_ms: 0.17075
  type: 'test'
  ...
# Subtest: builds one-line recovery command preserving relevant flags and dropping transient flags
ok 533 - builds one-line recovery command preserving relevant flags and dropping transient flags
  ---
  duration_ms: 0.273458
  type: 'test'
  ...
# Subtest: builds recovery payload with command or safe fallback warning
ok 534 - builds recovery payload with command or safe fallback warning
  ---
  duration_ms: 4.338041
  type: 'test'
  ...
# Subtest: analyze-project schema accepts the required top-level contract
ok 535 - analyze-project schema accepts the required top-level contract
  ---
  duration_ms: 2.007917
  type: 'test'
  ...
# Subtest: analyze-project schema rejects invalid confidence levels and unknown top-level fields
ok 536 - analyze-project schema rejects invalid confidence levels and unknown top-level fields
  ---
  duration_ms: 1.86525
  type: 'test'
  ...
# Subtest: analyze-project schema allows unknown findings without evidence
ok 537 - analyze-project schema allows unknown findings without evidence
  ---
  duration_ms: 0.401083
  type: 'test'
  ...
# Subtest: post-write validation passes clean managed docs
ok 538 - post-write validation passes clean managed docs
  ---
  duration_ms: 11.053084
  type: 'test'
  ...
# Subtest: post-write validation rejects critical placeholders in managed docs
ok 539 - post-write validation rejects critical placeholders in managed docs
  ---
  duration_ms: 3.676875
  type: 'test'
  ...
# Subtest: post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
ok 540 - post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders
  ---
  duration_ms: 3.464208
  type: 'test'
  ...
# Subtest: post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
ok 541 - post-write validation reports PROJECT_MAP contradictions as warnings or strict errors
  ---
  duration_ms: 6.066375
  type: 'test'
  ...
# Subtest: post-write validation rechecks evidence paths against the selected sample
ok 542 - post-write validation rechecks evidence paths against the selected sample
  ---
  duration_ms: 5.235833
  type: 'test'
  ...
# Subtest: limitRawProviderStream preserves head, tail, hash, and byte cap
ok 543 - limitRawProviderStream preserves head, tail, hash, and byte cap
  ---
  duration_ms: 0.956125
  type: 'test'
  ...
# Subtest: redactSensitiveValue recursively redacts structured secrets without mutating input
ok 544 - redactSensitiveValue recursively redacts structured secrets without mutating input
  ---
  duration_ms: 0.9835
  type: 'test'
  ...
# Subtest: writeRawProviderArtifact stores redacted and size-controlled provider streams
ok 545 - writeRawProviderArtifact stores redacted and size-controlled provider streams
  ---
  duration_ms: 7.169667
  type: 'test'
  ...
# Subtest: planner defaults to the planning pack and exposes structured metadata
ok 546 - planner defaults to the planning pack and exposes structured metadata
  ---
  duration_ms: 0.903916
  type: 'test'
  ...
# Subtest: executor defaults to slice and never full
ok 547 - executor defaults to slice and never full
  ---
  duration_ms: 0.2715
  type: 'test'
  ...
# Subtest: context pack selection preserves POSIX, Windows, and spaced paths
ok 548 - context pack selection preserves POSIX, Windows, and spaced paths
  ---
  duration_ms: 0.54775
  type: 'test'
  ...
# Subtest: planner can request the full pack explicitly while executor cannot
ok 549 - planner can request the full pack explicitly while executor cannot
  ---
  duration_ms: 1.230417
  type: 'test'
  ...
# Subtest: prepare-context only targets approved docs and never product code
ok 550 - prepare-context only targets approved docs and never product code
  ---
  duration_ms: 0.412375
  type: 'test'
  ...
# Subtest: valid planner context proposal parses into a normalized docs-only write plan
ok 551 - valid planner context proposal parses into a normalized docs-only write plan
  ---
  duration_ms: 6.723083
  type: 'test'
  ...
# Subtest: fenced JSON planner output is accepted when schema and paths are safe
ok 552 - fenced JSON planner output is accepted when schema and paths are safe
  ---
  duration_ms: 0.963583
  type: 'test'
  ...
# Subtest: legacy files alias is normalized to docs for planner proposals
ok 553 - legacy files alias is normalized to docs for planner proposals
  ---
  duration_ms: 0.134333
  type: 'test'
  ...
# Subtest: planner proposal rejects product code, dependency files, and unapproved docs
ok 554 - planner proposal rejects product code, dependency files, and unapproved docs
  ---
  duration_ms: 1.309667
  type: 'test'
  ...
# Subtest: planner proposal rejects absolute and traversal paths before writes
ok 555 - planner proposal rejects absolute and traversal paths before writes
  ---
  duration_ms: 1.965084
  type: 'test'
  ...
# Subtest: invalid schema, duplicate paths, empty content, and malformed output are actionable
ok 556 - invalid schema, duplicate paths, empty content, and malformed output are actionable
  ---
  duration_ms: 1.405583
  type: 'test'
  ...
# Subtest: context proposal path allowlist is explicit and validates safe paths
ok 557 - context proposal path allowlist is explicit and validates safe paths
  ---
  duration_ms: 0.178708
  type: 'test'
  ...
# Subtest: invalid planner proposal artifacts are redacted and stored under the run raw directory
ok 558 - invalid planner proposal artifacts are redacted and stored under the run raw directory
  ---
  duration_ms: 6.013167
  type: 'test'
  ...
# Subtest: collectExecutionPlan groups slice-00 first and parallel slices by ready level
ok 559 - collectExecutionPlan groups slice-00 first and parallel slices by ready level
  ---
  duration_ms: 35.2015
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when same-level files overlap
ok 560 - collectExecutionPlan falls back to sequential mode when same-level files overlap
  ---
  duration_ms: 7.539166
  type: 'test'
  ...
# Subtest: collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
ok 561 - collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty
  ---
  duration_ms: 4.375334
  type: 'test'
  ...
# Subtest: collectExecutionPlan falls back to sequential mode when file scope is unknown
ok 562 - collectExecutionPlan falls back to sequential mode when file scope is unknown
  ---
  duration_ms: 4.2675
  type: 'test'
  ...
# Subtest: formatHumanExecutionPlan includes worktree guidance and level ordering
ok 563 - formatHumanExecutionPlan includes worktree guidance and level ordering
  ---
  duration_ms: 4.325625
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun prints commands without executing providers
ok 564 - formatExecutePlanDryRun prints commands without executing providers
  ---
  duration_ms: 6.842833
  type: 'test'
  ...
# Subtest: formatExecutePlanDryRun manual mode prints prompts without execute commands
ok 565 - formatExecutePlanDryRun manual mode prints prompts without execute commands
  ---
  duration_ms: 8.673583
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on missing dependencies with a clear diagnostic
ok 566 - collectExecutionPlan fails on missing dependencies with a clear diagnostic
  ---
  duration_ms: 2.201916
  type: 'test'
  ...
# Subtest: collectExecutionPlan fails on dependency cycles with a clear diagnostic
ok 567 - collectExecutionPlan fails on dependency cycles with a clear diagnostic
  ---
  duration_ms: 7.381875
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
# Commit: created 1a11d00
# Commit message: feat: QUIVER-01 Demo slice
# Subtest: resolveSliceJsonPath accepts a slice directory and reports missing slice.json
ok 568 - resolveSliceJsonPath accepts a slice directory and reports missing slice.json
  ---
  duration_ms: 183.949459
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext uses executor slice context without onboarding content
ok 569 - buildExecuteSliceContext uses executor slice context without onboarding content
  ---
  duration_ms: 154.232666
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext prefers allowed_write_paths over legacy files
ok 570 - buildExecuteSliceContext prefers allowed_write_paths over legacy files
  ---
  duration_ms: 110.69825
  type: 'test'
  ...
# Subtest: buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
ok 571 - buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing
  ---
  duration_ms: 106.481625
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt uses minimal slice context and final report format
ok 572 - buildManualExecutorPrompt uses minimal slice context and final report format
  ---
  duration_ms: 192.528583
  type: 'test'
  ...
# Subtest: buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
ok 573 - buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing
  ---
  duration_ms: 177.636042
  type: 'test'
  ...
# Subtest: runExecuteSlice dry-run does not execute the provider
ok 574 - runExecuteSlice dry-run does not execute the provider
  ---
  duration_ms: 183.609417
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive mode selects a ready slice and executor profile
ok 575 - runExecuteSlice interactive mode selects a ready slice and executor profile
  ---
  duration_ms: 285.407959
  type: 'test'
  ...
# Subtest: runExecuteSlice interactive progress renders Spanish when language is es
ok 576 - runExecuteSlice interactive progress renders Spanish when language is es
  ---
  duration_ms: 356.043208
  type: 'test'
  ...
# Subtest: runExecuteSlice fails clearly when the provider fails
ok 577 - runExecuteSlice fails clearly when the provider fails
  ---
  duration_ms: 485.903958
  type: 'test'
  ...
# Subtest: runExecuteSlice does not close a slice when provider makes no changes
ok 578 - runExecuteSlice does not close a slice when provider makes no changes
  ---
  duration_ms: 276.576791
  type: 'test'
  ...
# Subtest: runExecuteSlice detects files outside slice scope after provider execution
ok 579 - runExecuteSlice detects files outside slice scope after provider execution
  ---
  duration_ms: 376.245041
  type: 'test'
  ...
# Subtest: runExecuteSlice passes scope validation for allowed files
ok 580 - runExecuteSlice passes scope validation for allowed files
  ---
  duration_ms: 281.8145
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks execution from the wrong slice worktree branch
ok 581 - runExecuteSlice blocks execution from the wrong slice worktree branch
  ---
  duration_ms: 222.836541
  type: 'test'
  ...
# Subtest: runExecuteSlice supports allowed_write_paths-only slice scope
ok 582 - runExecuteSlice supports allowed_write_paths-only slice scope
  ---
  duration_ms: 380.063166
  type: 'test'
  ...
# Subtest: runExecuteSlice updates closure, evidence, command log, and status with redacted logs
ok 583 - runExecuteSlice updates closure, evidence, command log, and status with redacted logs
  ---
  duration_ms: 212.21125
  type: 'test'
  ...
# Subtest: runExecuteSlice blocks commit when validation fails
ok 584 - runExecuteSlice blocks commit when validation fails
  ---
  duration_ms: 273.131583
  type: 'test'
  ...
# Subtest: runExecuteSlice creates one slice commit when commit is enabled
ok 585 - runExecuteSlice creates one slice commit when commit is enabled
  ---
  duration_ms: 282.442333
  type: 'test'
  ...
# Subtest: runExecuteSlice requires a clean worktree before execution
ok 586 - runExecuteSlice requires a clean worktree before execution
  ---
  duration_ms: 127.637166
  type: 'test'
  ...
# Subtest: runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
ok 587 - runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set
  ---
  duration_ms: 141.65475
  type: 'test'
  ...
# Subtest: collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
ok 588 - collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents
  ---
  duration_ms: 66.409
  type: 'test'
  ...
# Subtest: lifecycle export formatters produce human-readable inspection and markdown
ok 589 - lifecycle export formatters produce human-readable inspection and markdown
  ---
  duration_ms: 39.547125
  type: 'test'
  ...
# Subtest: lifecycle inspect prefers existing spec commands over stale spec create guidance
ok 590 - lifecycle inspect prefers existing spec commands over stale spec create guidance
  ---
  duration_ms: 58.79025
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports a missing gh with cross-platform install guidance
ok 591 - preflightGitHubPr reports a missing gh with cross-platform install guidance
  ---
  duration_ms: 140.619291
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the gh probe exits non-zero
ok 592 - preflightGitHubPr stops when the gh probe exits non-zero
  ---
  duration_ms: 90.250958
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
ok 593 - preflightGitHubPr reports an unauthenticated gh with gh auth login guidance
  ---
  duration_ms: 98.854
  type: 'test'
  ...
# Subtest: preflightGitHubPr stops when the GitFlow guide is missing
ok 594 - preflightGitHubPr stops when the GitFlow guide is missing
  ---
  duration_ms: 145.00475
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports missing SSH host alias with platform guidance
ok 595 - preflightGitHubPr reports missing SSH host alias with platform guidance
  ---
  duration_ms: 233.53225
  type: 'test'
  ...
# Subtest: formatSshAliasGuidance gives shell-specific alias setup and verification
ok 596 - formatSshAliasGuidance gives shell-specific alias setup and verification
  ---
  duration_ms: 0.159042
  type: 'test'
  ...
# Subtest: preflightGitHubPr reports the reviewed identity file path when it is missing
ok 597 - preflightGitHubPr reports the reviewed identity file path when it is missing
  ---
  duration_ms: 171.127709
  type: 'test'
  ...
# Subtest: formatPreflightReport prints shell-specific path guidance for paths with spaces
ok 598 - formatPreflightReport prints shell-specific path guidance for paths with spaces
  ---
  duration_ms: 1.000375
  type: 'test'
  ...
# Subtest: preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
ok 599 - preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs
  ---
  duration_ms: 199.704625
  type: 'test'
  ...
# Subtest: resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
ok 600 - resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies
  ---
  duration_ms: 132.859041
  type: 'test'
  ...
# Subtest: buildPrCreatePlan reads pr.md title and builds safe gh args
ok 601 - buildPrCreatePlan reads pr.md title and builds safe gh args
  ---
  duration_ms: 238.049542
  type: 'test'
  ...
# Subtest: buildPrCreatePlan uses remote HEAD as default base when --base is omitted
ok 602 - buildPrCreatePlan uses remote HEAD as default base when --base is omitted
  ---
  duration_ms: 433.289083
  type: 'test'
  ...
# Subtest: formatPrCreateReport prints shell-specific command examples for paths with spaces
ok 603 - formatPrCreateReport prints shell-specific command examples for paths with spaces
  ---
  duration_ms: 0.375125
  type: 'test'
  ...
# Subtest: buildPrCreatePlan refuses PR creation while spec slices are open
ok 604 - buildPrCreatePlan refuses PR creation while spec slices are open
  ---
  duration_ms: 378.708042
  type: 'test'
  ...
# Subtest: runGhPrCreate reports gh pr create failures without merging
ok 605 - runGhPrCreate reports gh pr create failures without merging
  ---
  duration_ms: 0.271917
  type: 'test'
  ...
# Subtest: extractPrTitle falls back predictably
ok 606 - extractPrTitle falls back predictably
  ---
  duration_ms: 0.273417
  type: 'test'
  ...
# Subtest: preparePromptTransport defaults to stdin and preserves the prompt text
ok 607 - preparePromptTransport defaults to stdin and preserves the prompt text
  ---
  duration_ms: 0.839917
  type: 'test'
  ...
# Subtest: createTempFilePromptTransport writes a prompt file in a path that may contain spaces
ok 608 - createTempFilePromptTransport writes a prompt file in a path that may contain spaces
  ---
  duration_ms: 0.823458
  type: 'test'
  ...
# Subtest: createStdinPromptTransport is a lightweight wrapper
ok 609 - createStdinPromptTransport is a lightweight wrapper
  ---
  duration_ms: 0.065958
  type: 'test'
  ...
# Subtest: assertSupportedProvider rejects unknown providers with a clear list
ok 610 - assertSupportedProvider rejects unknown providers with a clear list
  ---
  duration_ms: 2.8965
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
ok 611 - resolveGitHubCliProviderSubject returns a stable verified subject without granting roles
  ---
  duration_ms: 0.8175
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
ok 612 - resolveGitHubCliProviderSubject fails closed with stable unavailable and invalid codes
  ---
  duration_ms: 1.037334
  type: 'test'
  ...
# Subtest: resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
ok 613 - resolveGitHubCliProviderSubject distinguishes a missing GitHub CLI
  ---
  duration_ms: 0.205875
  type: 'test'
  ...
# Subtest: buildProviderInvocation keeps command arguments separate from the prompt
ok 614 - buildProviderInvocation keeps command arguments separate from the prompt
  ---
  duration_ms: 0.750292
  type: 'test'
  ...
# Subtest: buildProviderInvocation adds model args when provider supports model selection
ok 615 - buildProviderInvocation adds model args when provider supports model selection
  ---
  duration_ms: 0.95425
  type: 'test'
  ...
# Subtest: buildProviderInvocation normalizes known display model aliases by default
ok 616 - buildProviderInvocation normalizes known display model aliases by default
  ---
  duration_ms: 0.587541
  type: 'test'
  ...
# Subtest: buildProviderInvocation can block profile display aliases before provider execution
ok 617 - buildProviderInvocation can block profile display aliases before provider execution
  ---
  duration_ms: 0.236666
  type: 'test'
  ...
# Subtest: resolveProviderModelSelection preserves custom models
ok 618 - resolveProviderModelSelection preserves custom models
  ---
  duration_ms: 0.660625
  type: 'test'
  ...
# Subtest: buildProviderModelArgs blocks unsupported enforced model selection
ok 619 - buildProviderModelArgs blocks unsupported enforced model selection
  ---
  duration_ms: 0.436334
  type: 'test'
  ...
# Subtest: preflightProvider reports a missing CLI with an install hint
ok 620 - preflightProvider reports a missing CLI with an install hint
  ---
  duration_ms: 0.707958
  type: 'test'
  ...
# Subtest: runProvider dry-run returns a structured plan without invoking spawn
ok 621 - runProvider dry-run returns a structured plan without invoking spawn
  ---
  duration_ms: 0.195583
  type: 'test'
  ...
# Subtest: runProvider dry-run exposes selected provider model without auth preflight
ok 622 - runProvider dry-run exposes selected provider model without auth preflight
  ---
  duration_ms: 0.975833
  type: 'test'
  ...
# Subtest: runProvider dry-run shows normalized technical model ids
ok 623 - runProvider dry-run shows normalized technical model ids
  ---
  duration_ms: 0.213708
  type: 'test'
  ...
# Subtest: runProvider uses an argument array and writes the prompt through stdin
ok 624 - runProvider uses an argument array and writes the prompt through stdin
  ---
  duration_ms: 1.837291
  type: 'test'
  ...
# Subtest: runProvider redacts likely secrets from stdout, stderr, and serialized errors
ok 625 - runProvider redacts likely secrets from stdout, stderr, and serialized errors
  ---
  duration_ms: 0.709292
  type: 'test'
  ...
# Subtest: runProvider times out and terminates a hung provider
ok 626 - runProvider times out and terminates a hung provider
  ---
  duration_ms: 7.714625
  type: 'test'
  ...
# Subtest: provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
ok 627 - provider payload signal ignores diagnostic stderr but records contractual stdout before timeout
  ---
  duration_ms: 18.932209
  type: 'test'
  ...
# Subtest: prompt delivery failures return an explicit pre-payload transport result
ok 628 - prompt delivery failures return an explicit pre-payload transport result
  ---
  duration_ms: 0.510834
  type: 'test'
  ...
# Subtest: runProvider returns structured metadata when preflight fails
ok 629 - runProvider returns structured metadata when preflight fails
  ---
  duration_ms: 0.127625
  type: 'test'
  ...
# Subtest: runProvider prioritizes invalid model errors over secondary provider noise
ok 630 - runProvider prioritizes invalid model errors over secondary provider noise
  ---
  duration_ms: 0.687084
  type: 'test'
  ...
# Subtest: extractProviderErrorCause redacts secrets from surfaced errors
ok 631 - extractProviderErrorCause redacts secrets from surfaced errors
  ---
  duration_ms: 0.141042
  type: 'test'
  ...
# Subtest: review intent classification is explicit and rejects selectable retry or stale targets
ok 632 - review intent classification is explicit and rejects selectable retry or stale targets
  ---
  duration_ms: 10.369916
  type: 'test'
  ...
# Subtest: atomic reservation exhausts fast delivery before a second provider attempt
ok 633 - atomic reservation exhausts fast delivery before a second provider attempt
  ---
  duration_ms: 66.651959
  type: 'test'
  ...
# Subtest: reservation rejects a request snapshot that changed before the atomic commit
ok 634 - reservation rejects a request snapshot that changed before the atomic commit
  ---
  duration_ms: 28.670959
  type: 'test'
  ...
# Subtest: a semantic review may reserve the same envelope again after invalid output when capacity remains
ok 635 - a semantic review may reserve the same envelope again after invalid output when capacity remains
  ---
  duration_ms: 64.84775
  type: 'test'
  ...
# Subtest: a policy change cannot be masked by a stale profile object
ok 636 - a policy change cannot be masked by a stale profile object
  ---
  duration_ms: 37.685
  type: 'test'
  ...
# Subtest: pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
ok 637 - pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot
  ---
  duration_ms: 48.830041
  type: 'test'
  ...
# Subtest: a reviewed candidate cannot be relabeled as a later full review
ok 638 - a reviewed candidate cannot be relabeled as a later full review
  ---
  duration_ms: 52.259084
  type: 'test'
  ...
# Subtest: all counters and human output derive from one canonical event fold
ok 639 - all counters and human output derive from one canonical event fold
  ---
  duration_ms: 1.020041
  type: 'test'
  ...
# Subtest: budget extension is default-deny without mutating the ledger
ok 640 - budget extension is default-deny without mutating the ledger
  ---
  duration_ms: 26.754167
  type: 'test'
  ...
# Subtest: authorized extension preserves policy bytes and ledger audit while increasing only review capacity
ok 641 - authorized extension preserves policy bytes and ledger audit while increasing only review capacity
  ---
  duration_ms: 36.732708
  type: 'test'
  ...
# Subtest: fast delivery permits an explicitly bound local actor to extend budget with an audit label
ok 642 - fast delivery permits an explicitly bound local actor to extend budget with an audit label
  ---
  duration_ms: 39.486208
  type: 'test'
  ...
# Subtest: review budgets are isolated by run and foreign ledger events fail closed
ok 643 - review budgets are isolated by run and foreign ledger events fail closed
  ---
  duration_ms: 77.543042
  type: 'test'
  ...
# Subtest: cross-process reservations cannot overspend one run budget
ok 644 - cross-process reservations cannot overspend one run budget
  ---
  duration_ms: 174.285791
  type: 'test'
  ...
# Subtest: default governance config is valid, secret-free, and merge preserves compatible keys
ok 645 - default governance config is valid, secret-free, and merge preserves compatible keys
  ---
  duration_ms: 7.593708
  type: 'test'
  ...
# Subtest: compatibility metadata is strict, monotonic, and blocks read-only or older writers
ok 646 - compatibility metadata is strict, monotonic, and blocks read-only or older writers
  ---
  duration_ms: 7.256375
  type: 'test'
  ...
# Subtest: versioned disposition, review-event, and decision envelopes are strict
ok 647 - versioned disposition, review-event, and decision envelopes are strict
  ---
  duration_ms: 3.417959
  type: 'test'
  ...
# Subtest: criterion bindings preserve exact UTF-8 content and reject digest drift
ok 648 - criterion bindings preserve exact UTF-8 content and reject digest drift
  ---
  duration_ms: 1.06875
  type: 'test'
  ...
# Subtest: transfer target normalization is canonical and rejects ambiguous short slice ids
ok 649 - transfer target normalization is canonical and rejects ambiguous short slice ids
  ---
  duration_ms: 0.228042
  type: 'test'
  ...
# Subtest: keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
ok 650 - keyed disposition maps normalize to the canonical envelope and transfer validation binds criteria
  ---
  duration_ms: 0.747875
  type: 'test'
  ...
# Subtest: legacy run governance state reads additively without inventing decisions
ok 651 - legacy run governance state reads additively without inventing decisions
  ---
  duration_ms: 0.57225
  type: 'test'
  ...
# Subtest: canonical approval records bind and verify their complete decision digest
ok 652 - canonical approval records bind and verify their complete decision digest
  ---
  duration_ms: 1.639542
  type: 'test'
  ...
# Subtest: approval parity distinguishes structured-count drift from binding drift
ok 653 - approval parity distinguishes structured-count drift from binding drift
  ---
  duration_ms: 0.676042
  type: 'test'
  ...
# Subtest: profile and disposition approval digests are deterministic across equivalent ordering
ok 654 - profile and disposition approval digests are deterministic across equivalent ordering
  ---
  duration_ms: 0.546666
  type: 'test'
  ...
# Subtest: approval criteria preserve the raw acceptance collections used for bound counts
ok 655 - approval criteria preserve the raw acceptance collections used for bound counts
  ---
  duration_ms: 0.317
  type: 'test'
  ...
# Subtest: condition policy is default-deny, uses allow-only union matching, and keeps release denied
ok 656 - condition policy is default-deny, uses allow-only union matching, and keeps release denied
  ---
  duration_ms: 2.592333
  type: 'test'
  ...
# Subtest: condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
ok 657 - condition eligibility applies protected, stale, duplicate, missing, and unauthorized precedence
  ---
  duration_ms: 3.401375
  type: 'test'
  ...
# Subtest: condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
ok 658 - condition eligibility distinguishes hard blockers, unfinished revisions, and unresolved obligations
  ---
  duration_ms: 2.981958
  type: 'test'
  ...
# Subtest: condition disposition replacement is explicit and never becomes current implicitly
ok 659 - condition disposition replacement is explicit and never becomes current implicitly
  ---
  duration_ms: 1.229958
  type: 'test'
  ...
# Subtest: condition eligibility keeps transfer-blocker and final approval authorizations independent
ok 660 - condition eligibility keeps transfer-blocker and final approval authorizations independent
  ---
  duration_ms: 1.352041
  type: 'test'
  ...
# Subtest: conditioned candidates are explicitly non-final publication records
ok 661 - conditioned candidates are explicitly non-final publication records
  ---
  duration_ms: 1.276625
  type: 'test'
  ...
# Subtest: governance config rejects secret-bearing compatible keys
ok 662 - governance config rejects secret-bearing compatible keys
  ---
  duration_ms: 4.972
  type: 'test'
  ...
# Subtest: governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
ok 663 - governance config cannot remove mandatory sensitive categories or weaken minimum profile controls
  ---
  duration_ms: 5.614
  type: 'test'
  ...
# Subtest: readGovernanceConfig distinguishes absent namespace from default resolution
ok 664 - readGovernanceConfig distinguishes absent namespace from default resolution
  ---
  duration_ms: 6.355958
  type: 'test'
  ...
# Subtest: stable policy digest ignores object key insertion order and excludes a stored digest
ok 665 - stable policy digest ignores object key insertion order and excludes a stored digest
  ---
  duration_ms: 0.465375
  type: 'test'
  ...
# Subtest: profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
ok 666 - profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade
  ---
  duration_ms: 2.63375
  type: 'test'
  ...
# Subtest: authorization uses only explicit bindings and defaults to deny
ok 667 - authorization uses only explicit bindings and defaults to deny
  ---
  duration_ms: 1.361208
  type: 'test'
  ...
# Subtest: local actors are labeled and cannot authorize high-assurance mutations
ok 668 - local actors are labeled and cannot authorize high-assurance mutations
  ---
  duration_ms: 0.871875
  type: 'test'
  ...
# Subtest: authorization independence compares the canonical actor bound to provider subjects
ok 669 - authorization independence compares the canonical actor bound to provider subjects
  ---
  duration_ms: 0.410083
  type: 'test'
  ...
# Subtest: authorization selects bindings only by exact provider subject or explicit local actor key
ok 670 - authorization selects bindings only by exact provider subject or explicit local actor key
  ---
  duration_ms: 0.266708
  type: 'test'
  ...
# Subtest: strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
ok 671 - strict provider parser accepts direct or single fenced JSON and rejects heuristic prose
  ---
  duration_ms: 1.415333
  type: 'test'
  ...
# Subtest: strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
ok 672 - strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation
  ---
  duration_ms: 1.261625
  type: 'test'
  ...
# Subtest: phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
ok 673 - phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate
  ---
  duration_ms: 0.133791
  type: 'test'
  ...
# Subtest: phase-aware projection applies the versioned review policy deterministically to both profiles
ok 674 - phase-aware projection applies the versioned review policy deterministically to both profiles
  ---
  duration_ms: 0.065959
  type: 'test'
  ...
# Subtest: finding fingerprint uses only normalized invariant identity fields
ok 675 - finding fingerprint uses only normalized invariant identity fields
  ---
  duration_ms: 0.216625
  type: 'test'
  ...
# Subtest: reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
ok 676 - reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings
  ---
  duration_ms: 4.331333
  type: 'test'
  ...
# Subtest: supersession creates lineage without silently closing the prior finding
ok 677 - supersession creates lineage without silently closing the prior finding
  ---
  duration_ms: 0.407208
  type: 'test'
  ...
# Subtest: reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
ok 678 - reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs
  ---
  duration_ms: 0.908625
  type: 'test'
  ...
# Subtest: AI run state can be created, read, updated, and rendered
ok 679 - AI run state can be created, read, updated, and rendered
  ---
  duration_ms: 44.622
  type: 'test'
  ...
# Subtest: AI run listing fails closed when a run namespace is a symlink
ok 680 - AI run listing fails closed when a run namespace is a symlink
  ---
  duration_ms: 29.504875
  type: 'test'
  ...
# Subtest: AI run phase guard blocks future-phase commands with next-step guidance
ok 681 - AI run phase guard blocks future-phase commands with next-step guidance
  ---
  duration_ms: 31.960166
  type: 'test'
  ...
# Subtest: an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
ok 682 - an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind
  ---
  duration_ms: 46.84075
  type: 'test'
  ...
# Subtest: AI run approvals metadata and locks are persisted safely
ok 683 - AI run approvals metadata and locks are persisted safely
  ---
  duration_ms: 24.487166
  type: 'test'
  ...
# Subtest: governed run selection is unambiguous and profile binding cannot downgrade
ok 684 - governed run selection is unambiguous and profile binding cannot downgrade
  ---
  duration_ms: 60.669417
  type: 'test'
  ...
# Subtest: run governance state is correlated and written inside the run lock
ok 685 - run governance state is correlated and written inside the run lock
  ---
  duration_ms: 28.085541
  type: 'test'
  ...
# Subtest: run lock remains held until an asynchronous callback settles
ok 686 - run lock remains held until an asynchronous callback settles
  ---
  duration_ms: 18.620417
  type: 'test'
  ...
# Subtest: run locks normalize aliases and release only the lock instance they own
ok 687 - run locks normalize aliases and release only the lock instance they own
  ---
  duration_ms: 1.738
  type: 'test'
  ...
# Subtest: governed phase transitions share the run lock with governance commits
ok 688 - governed phase transitions share the run lock with governance commits
  ---
  duration_ms: 28.145
  type: 'test'
  ...
# Subtest: digest-bound approval commit rolls back every injected write failure without partial state
ok 689 - digest-bound approval commit rolls back every injected write failure without partial state
  ---
  duration_ms: 888.490333
  type: 'test'
  ...
# Subtest: approval WAL makes readers fail closed and recovery rolls back idempotently
ok 690 - approval WAL makes readers fail closed and recovery rolls back idempotently
  ---
  duration_ms: 232.289083
  type: 'test'
  ...
# Subtest: canonical run readers reject copied or foreign run identities
ok 691 - canonical run readers reject copied or foreign run identities
  ---
  duration_ms: 64.302958
  type: 'test'
  ...
# Subtest: approval recovery rejects a validly rehashed WAL with a non-canonical target
ok 692 - approval recovery rejects a validly rehashed WAL with a non-canonical target
  ---
  duration_ms: 103.224375
  type: 'test'
  ...
# Subtest: normal approval commit validates its exact target allowlist before writing the WAL
ok 693 - normal approval commit validates its exact target allowlist before writing the WAL
  ---
  duration_ms: 56.330959
  type: 'test'
  ...
# Subtest: digest-bound approval commit rejects an in-project symlinked run target
ok 694 - digest-bound approval commit rejects an in-project symlinked run target
  ---
  duration_ms: 83.062458
  type: 'test'
  ...
# Subtest: digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
ok 695 - digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL
  ---
  duration_ms: 73.1945
  type: 'test'
  ...
# Subtest: digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
ok 696 - digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values
  ---
  duration_ms: 157.169167
  type: 'test'
  ...
# Subtest: safety excludes secrets, generated outputs, caches, and ssh material
ok 697 - safety excludes secrets, generated outputs, caches, and ssh material
  ---
  duration_ms: 0.820792
  type: 'test'
  ...
# Subtest: normalizeContextPath handles windows separators and paths with spaces
ok 698 - normalizeContextPath handles windows separators and paths with spaces
  ---
  duration_ms: 0.1255
  type: 'test'
  ...
# Subtest: filterContextPaths keeps safe entries and returns exclusion reasons
ok 699 - filterContextPaths keeps safe entries and returns exclusion reasons
  ---
  duration_ms: 0.3695
  type: 'test'
  ...
# Subtest: prompt safety text establishes instruction hierarchy and repo-data boundary
ok 700 - prompt safety text establishes instruction hierarchy and repo-data boundary
  ---
  duration_ms: 0.091083
  type: 'test'
  ...
# Subtest: parseApprovedManifest falls back to markdown headings when JSON is unavailable
ok 701 - parseApprovedManifest falls back to markdown headings when JSON is unavailable
  ---
  duration_ms: 2.101916
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
ok 702 - buildSpecGenerationManifest normalizes approved JSON input into a generated spec plan
  ---
  duration_ms: 1.73525
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest preserves every approved implementation slice
ok 703 - buildSpecGenerationManifest preserves every approved implementation slice
  ---
  duration_ms: 1.051125
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
ok 704 - buildSpecGenerationManifest extracts a structured fenced JSON slice block from markdown
  ---
  duration_ms: 1.987791
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects plans without structured slices
ok 705 - buildSpecGenerationManifest rejects plans without structured slices
  ---
  duration_ms: 0.643125
  type: 'test'
  ...
# Subtest: buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
ok 706 - buildSpecGenerationManifest rejects duplicate, missing, and cyclic slice dependencies
  ---
  duration_ms: 0.869125
  type: 'test'
  ...
# Subtest: generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
ok 707 - generateSpecArtifacts writes the spec tree, validates JSON, and refuses collisions
  ---
  duration_ms: 30.899542
  type: 'test'
  ...
# Subtest: generateSpecArtifacts fails before writing when structured slices are missing
ok 708 - generateSpecArtifacts fails before writing when structured slices are missing
  ---
  duration_ms: 0.998125
  type: 'test'
  ...
# Subtest: governed spec generation publishes one digest-bound manifest and derives all projections from it
ok 709 - governed spec generation publishes one digest-bound manifest and derives all projections from it
  ---
  duration_ms: 39.027042
  type: 'test'
  ...
# Subtest: governance projections escape marker, newline, and backtick injection without changing the manifest
ok 710 - governance projections escape marker, newline, and backtick injection without changing the manifest
  ---
  duration_ms: 29.010917
  type: 'test'
  ...
# Subtest: criterion binding preserves exact bytes while resolving parser-normalized approved content
ok 711 - criterion binding preserves exact bytes while resolving parser-normalized approved content
  ---
  duration_ms: 1.470125
  type: 'test'
  ...
# Subtest: governance target ambiguity fails before any spec artifact is published
ok 712 - governance target ambiguity fails before any spec artifact is published
  ---
  duration_ms: 0.361083
  type: 'test'
  ...
# Subtest: canonical governance root resolves the primary checkout from a linked worktree
ok 713 - canonical governance root resolves the primary checkout from a linked worktree
  ---
  duration_ms: 172.691792
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
ok 714 - parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair
  ---
  duration_ms: 3.9415
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
ok 715 - parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing
  ---
  duration_ms: 0.564166
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
ok 716 - parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions
  ---
  duration_ms: 0.510292
  type: 'test'
  ...
# Subtest: parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
ok 717 - parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists
  ---
  duration_ms: 0.323542
  type: 'test'
  ...
# Subtest: repairAnalyzeProjectValue refuses unsafe additional properties
ok 718 - repairAnalyzeProjectValue refuses unsafe additional properties
  ---
  duration_ms: 0.171458
  type: 'test'
  ...
# Subtest: writeAnalyzeProjectRepairManifest writes an auditable run artifact
ok 719 - writeAnalyzeProjectRepairManifest writes an auditable run artifact
  ---
  duration_ms: 2.628125
  type: 'test'
  ...
# Subtest: planner approvals persist draft and approved metadata with status summaries
ok 720 - planner approvals persist draft and approved metadata with status summaries
  ---
  duration_ms: 90.481084
  type: 'test'
  ...
# Subtest: planner approvals keep multiple drafts and only approve the current version
ok 721 - planner approvals keep multiple drafts and only approve the current version
  ---
  duration_ms: 182.36775
  type: 'test'
  ...
# Subtest: legacy planner approval writer rejects approved-with-conditions without creating approved.md
ok 722 - legacy planner approval writer rejects approved-with-conditions without creating approved.md
  ---
  duration_ms: 80.642833
  type: 'test'
  ...
# Subtest: planner approval candidates expose current draft, history, and safe previews
ok 723 - planner approval candidates expose current draft, history, and safe previews
  ---
  duration_ms: 164.046792
  type: 'test'
  ...
# Subtest: planner approvals block unapproved or stale inputs before later phases
ok 724 - planner approvals block unapproved or stale inputs before later phases
  ---
  duration_ms: 280.0495
  type: 'test'
  ...
# Subtest: planner drafts persist exact artifact and input byte digests
ok 725 - planner drafts persist exact artifact and input byte digests
  ---
  duration_ms: 84.699917
  type: 'test'
  ...
# Subtest: digest-bound projection rejects artifact and input tampering without approving
ok 726 - digest-bound projection rejects artifact and input tampering without approving
  ---
  duration_ms: 99.728708
  type: 'test'
  ...
# Subtest: content loss persists a corrupted immutable candidate without replacing current or approval history
ok 727 - content loss persists a corrupted immutable candidate without replacing current or approval history
  ---
  duration_ms: 137.656542
  type: 'test'
  ...
# Subtest: unsupported free text remains inspectable but never becomes current automatically
ok 728 - unsupported free text remains inspectable but never becomes current automatically
  ---
  duration_ms: 55.517125
  type: 'test'
  ...
# Subtest: draft projection journal rolls forward deterministically from every committed crash point
ok 729 - draft projection journal rolls forward deterministically from every committed crash point
  ---
  duration_ms: 530.850334
  type: 'test'
  ...
# Subtest: a crash before journal publication leaves an immutable orphan and unchanged projections
ok 730 - a crash before journal publication leaves an immutable orphan and unchanged projections
  ---
  duration_ms: 96.843666
  type: 'test'
  ...
# Subtest: corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
ok 731 - corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed
  ---
  duration_ms: 213.353791
  type: 'test'
  ...
# Subtest: v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
ok 732 - v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths
  ---
  duration_ms: 357.441459
  type: 'test'
  ...
# Subtest: draft recovery respects governance read-only mode without changing marker or projections
ok 733 - draft recovery respects governance read-only mode without changing marker or projections
  ---
  duration_ms: 90.735541
  type: 'test'
  ...
# Subtest: project file byte reader rejects path traversal outside the project root
ok 734 - project file byte reader rejects path traversal outside the project root
  ---
  duration_ms: 0.763666
  type: 'test'
  ...
# Subtest: project file byte reader rejects symlinks that resolve outside the project root
ok 735 - project file byte reader rejects symlinks that resolve outside the project root
  ---
  duration_ms: 1.298584
  type: 'test'
  ...
# Subtest: project file byte reader rejects in-project symlink aliases
ok 736 - project file byte reader rejects in-project symlink aliases
  ---
  duration_ms: 1.907459
  type: 'test'
  ...
# Subtest: empty Brain initialization is stable and idempotent
ok 737 - empty Brain initialization is stable and idempotent
  ---
  duration_ms: 71.030417
  type: 'test'
  ...
# Subtest: protected operations do not lazily recreate an absent Brain
ok 738 - protected operations do not lazily recreate an absent Brain
  ---
  duration_ms: 5.662042
  type: 'test'
  ...
# Subtest: append supports every typed record and derives immutable metadata
ok 739 - append supports every typed record and derives immutable metadata
  ---
  duration_ms: 908.887834
  type: 'test'
  ...
# Subtest: supersession preserves history, derives active validity, and enforces authority precedence
ok 740 - supersession preserves history, derives active validity, and enforces authority precedence
  ---
  duration_ms: 212.162625
  type: 'test'
  ...
# Subtest: CAS and idempotency replay are enforced in the normative order
ok 741 - CAS and idempotency replay are enforced in the normative order
  ---
  duration_ms: 145.80125
  type: 'test'
  ...
# Subtest: unverified, foreign, and under-granted actors fail before canonical writes
ok 742 - unverified, foreign, and under-granted actors fail before canonical writes
  ---
  duration_ms: 94.353542
  type: 'test'
  ...
# Subtest: secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
ok 743 - secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist
  ---
  duration_ms: 50.164375
  type: 'test'
  ...
# Subtest: a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
ok 744 - a valid digest for unrelated bytes cannot elevate an arbitrary verified fact
  ---
  duration_ms: 59.167584
  type: 'test'
  ...
# Subtest: the supported local v58 decision representation binds the exact approved artifact
ok 745 - the supported local v58 decision representation binds the exact approved artifact
  ---
  duration_ms: 0.753708
  type: 'test'
  ...
# Subtest: writer mutex returns a lock conflict without changing the store
ok 746 - writer mutex returns a lock conflict without changing the store
  ---
  duration_ms: 44.907333
  type: 'test'
  ...
# Subtest: concurrent appends either serialize or return an explicit lock conflict
ok 747 - concurrent appends either serialize or return an explicit lock conflict
  ---
  duration_ms: 98.133375
  type: 'test'
  ...
# Subtest: read-only v58 compatibility blocks every Brain writer before mutation
ok 748 - read-only v58 compatibility blocks every Brain writer before mutation
  ---
  duration_ms: 53.960208
  type: 'test'
  ...
# Subtest: symlinked canonical record or operation directories cannot write outside the project
ok 749 - symlinked canonical record or operation directories cannot write outside the project
  ---
  duration_ms: 62.780417
  type: 'test'
  ...
# Subtest: a symlinked manifest target is rejected before any Brain mutation
ok 750 - a symlinked manifest target is rejected before any Brain mutation
  ---
  duration_ms: 50.935958
  type: 'test'
  ...
# Subtest: stale or corrupt index rebuilds only from the canonical manifest
ok 751 - stale or corrupt index rebuilds only from the canonical manifest
  ---
  duration_ms: 138.402875
  type: 'test'
  ...
# Subtest: validated journal recovery rolls forward an interrupted manifest commit
ok 752 - validated journal recovery rolls forward an interrupted manifest commit
  ---
  duration_ms: 116.776792
  type: 'test'
  ...
# Subtest: Cloud receipt fixture binds exact knowledge and preserves original decision provenance
ok 753 - Cloud receipt fixture binds exact knowledge and preserves original decision provenance
  ---
  duration_ms: 132.809917
  type: 'test'
  ...
# Subtest: Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
ok 754 - Cloud receipt mismatch, unavailable source, and noncurrent state block before writes
  ---
  duration_ms: 156.873833
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
ok 755 - check-slice passes for a completed slice without optional dependency fields
  ---
  duration_ms: 224.77575
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring remote or base branches
ok 756 - check-slice --local validates structure without requiring remote or base branches
  ---
  duration_ms: 231.202583
  type: 'test'
  ...
# Subtest: check-slice --local renders English output when requested
ok 757 - check-slice --local renders English output when requested
  ---
  duration_ms: 143.585916
  type: 'test'
  ...
# Subtest: check-slice --local rejects missing execution git metadata
ok 758 - check-slice --local rejects missing execution git metadata
  ---
  duration_ms: 65.950375
  type: 'test'
  ...
# Subtest: check-slice --local rejects scope paths outside the project
ok 759 - check-slice --local rejects scope paths outside the project
  ---
  duration_ms: 58.413666
  type: 'test'
  ...
# Subtest: check-slice rejects an external absolute slice path even if it contains specs
ok 760 - check-slice rejects an external absolute slice path even if it contains specs
  ---
  duration_ms: 18.93075
  type: 'test'
  ...
# Subtest: check-slice --local validates structure without requiring a Git repository
ok 761 - check-slice --local validates structure without requiring a Git repository
  ---
  duration_ms: 77.626416
  type: 'test'
  ...
# Subtest: check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
ok 762 - check-slice --local accepts a completed slice-00 dependency declared as a bare slice id
  ---
  duration_ms: 66.905625
  type: 'test'
  ...
# Subtest: check-slice default mode gives local/base guidance when no base exists
ok 763 - check-slice default mode gives local/base guidance when no base exists
  ---
  duration_ms: 162.043791
  type: 'test'
  ...
# Subtest: check-slice supports an explicit local base branch
ok 764 - check-slice supports an explicit local base branch
  ---
  duration_ms: 279.142125
  type: 'test'
  ...
# Subtest: check-pr uses slice base branch instead of hardcoded origin/develop
ok 765 - check-pr uses slice base branch instead of hardcoded origin/develop
  ---
  duration_ms: 321.881584
  type: 'test'
  ...
# Subtest: check-slice rejects missing depends_on targets
ok 766 - check-slice rejects missing depends_on targets
  ---
  duration_ms: 159.432417
  type: 'test'
  ...
# Subtest: check-slice rejects cycles introduced by depends_on
ok 767 - check-slice rejects cycles introduced by depends_on
  ---
  duration_ms: 142.807584
  type: 'test'
  ...
# Subtest: check-slice requires a parallel_safe_reason when parallel_safe is never
ok 768 - check-slice requires a parallel_safe_reason when parallel_safe is never
  ---
  duration_ms: 228.599333
  type: 'test'
  ...
# Subtest: check-slice projects governed pending findings from one verified manifest
ok 769 - check-slice projects governed pending findings from one verified manifest
  ---
  duration_ms: 72.3915
  type: 'test'
  ...
# Subtest: check-slice verifies a real manifest self-digest against the primary canonical run store
ok 770 - check-slice verifies a real manifest self-digest against the primary canonical run store
  ---
  duration_ms: 186.61675
  type: 'test'
  ...
# Subtest: check-slice with an explicit run cannot degrade to legacy when the manifest is absent
ok 771 - check-slice with an explicit run cannot degrade to legacy when the manifest is absent
  ---
  duration_ms: 59.592916
  type: 'test'
  ...
# Subtest: a generated manifest declaration prevents legacy downgrade for slices and PRs
ok 772 - a generated manifest declaration prevents legacy downgrade for slices and PRs
  ---
  duration_ms: 48.296792
  type: 'test'
  ...
# Subtest: check-slice rejects stale, unknown, and reordered SPEC traceability projections
ok 773 - check-slice rejects stale, unknown, and reordered SPEC traceability projections
  ---
  duration_ms: 198.406958
  type: 'test'
  ...
# Subtest: check-slice rejects omitted and unknown governed finding projections
ok 774 - check-slice rejects omitted and unknown governed finding projections
  ---
  duration_ms: 74.864375
  type: 'test'
  ...
# Subtest: check-slice rejects canonical governance field drift in execution briefs
ok 775 - check-slice rejects canonical governance field drift in execution briefs
  ---
  duration_ms: 240.980833
  type: 'test'
  ...
# Subtest: check-slice requires the canonical governance heading inside marked blocks
ok 776 - check-slice requires the canonical governance heading inside marked blocks
  ---
  duration_ms: 40.186375
  type: 'test'
  ...
# Subtest: check-slice fails closed when a target finding is neither closed nor accepted
ok 777 - check-slice fails closed when a target finding is neither closed nor accepted
  ---
  duration_ms: 43.997208
  type: 'test'
  ...
# Subtest: check-slice propagates orphaned, stale, and unresolved governance failures
ok 778 - check-slice propagates orphaned, stale, and unresolved governance failures
  ---
  duration_ms: 110.14925
  type: 'test'
  ...
# Subtest: check-pr rejects a governed slice PR that omits its finding block
ok 779 - check-pr rejects a governed slice PR that omits its finding block
  ---
  duration_ms: 171.97075
  type: 'test'
  ...
# Subtest: PR governance readiness rejects canonical field drift with unchanged finding ids
ok 780 - PR governance readiness rejects canonical field drift with unchanged finding ids
  ---
  duration_ms: 1.8355
  type: 'test'
  ...
# Subtest: splitEditorCommand handles quoted commands and arguments
ok 781 - splitEditorCommand handles quoted commands and arguments
  ---
  duration_ms: 1.189208
  type: 'test'
  ...
# Subtest: resolveEditor prefers VISUAL over EDITOR and keeps arguments
ok 782 - resolveEditor prefers VISUAL over EDITOR and keeps arguments
  ---
  duration_ms: 0.246
  type: 'test'
  ...
# Subtest: resolveEditor falls back to platform editor when env is empty
ok 783 - resolveEditor falls back to platform editor when env is empty
  ---
  duration_ms: 0.15875
  type: 'test'
  ...
# Subtest: defaultEditorForPlatform uses notepad on Windows and vi elsewhere
ok 784 - defaultEditorForPlatform uses notepad on Windows and vi elsewhere
  ---
  duration_ms: 0.071459
  type: 'test'
  ...
# Subtest: openEditor invokes the resolved editor without a shell
ok 785 - openEditor invokes the resolved editor without a shell
  ---
  duration_ms: 0.13175
  type: 'test'
  ...
# Subtest: openEditor reports cancellation for missing or failed editor execution
ok 786 - openEditor reports cancellation for missing or failed editor execution
  ---
  duration_ms: 0.115042
  type: 'test'
  ...
# Subtest: normalizeSelectorOptions keeps labels human-friendly and values stable
ok 787 - normalizeSelectorOptions keeps labels human-friendly and values stable
  ---
  duration_ms: 1.02975
  type: 'test'
  ...
# Subtest: selectOption returns explicit non-interactive choice
ok 788 - selectOption returns explicit non-interactive choice
  ---
  duration_ms: 0.179708
  type: 'test'
  ...
# Subtest: selectOption uses default without prompting in no-TTY mode
ok 789 - selectOption uses default without prompting in no-TTY mode
  ---
  duration_ms: 0.349375
  type: 'test'
  ...
# Subtest: selectOption fails actionably when no default is available outside interactive mode
ok 790 - selectOption fails actionably when no default is available outside interactive mode
  ---
  duration_ms: 0.698791
  type: 'test'
  ...
# Subtest: selectOption uses injected prompt selector only in interactive TTY mode
ok 791 - selectOption uses injected prompt selector only in interactive TTY mode
  ---
  duration_ms: 0.148208
  type: 'test'
  ...
# Subtest: promptText returns explicit values without prompting
ok 792 - promptText returns explicit values without prompting
  ---
  duration_ms: 0.106333
  type: 'test'
  ...
# Subtest: promptText uses injected prompt text in interactive TTY mode
ok 793 - promptText uses injected prompt text in interactive TTY mode
  ---
  duration_ms: 0.072791
  type: 'test'
  ...
# Subtest: promptText fails actionably without TTY or explicit value
ok 794 - promptText fails actionably without TTY or explicit value
  ---
  duration_ms: 0.100083
  type: 'test'
  ...
# Subtest: Quiver theme exposes the approved brand color tokens
ok 795 - Quiver theme exposes the approved brand color tokens
  ---
  duration_ms: 0.982917
  type: 'test'
  ...
# Subtest: color output is disabled for machine and unsupported modes
ok 796 - color output is disabled for machine and unsupported modes
  ---
  duration_ms: 0.222209
  type: 'test'
  ...
# Subtest: color output uses ANSI truecolor only for human TTY mode
ok 797 - color output uses ANSI truecolor only for human TTY mode
  ---
  duration_ms: 0.527875
  type: 'test'
  ...
# Subtest: theme falls back to plain ASCII when unicode is unavailable
ok 798 - theme falls back to plain ASCII when unicode is unavailable
  ---
  duration_ms: 0.111209
  type: 'test'
  ...
# Subtest: theme keeps text readable when color is disabled
ok 799 - theme keeps text readable when color is disabled
  ---
  duration_ms: 0.066958
  type: 'test'
  ...
# Subtest: resolveUxMode disables decoration, prompts, and spinners for machine modes
ok 800 - resolveUxMode disables decoration, prompts, and spinners for machine modes
  ---
  duration_ms: 0.754
  type: 'test'
  ...
# Subtest: resolveUxMode enables prompts only for explicit interactive TTY use
ok 801 - resolveUxMode enables prompts only for explicit interactive TTY use
  ---
  duration_ms: 0.139417
  type: 'test'
  ...
# Subtest: withSpinner uses clack spinner only in human TTY mode
ok 802 - withSpinner uses clack spinner only in human TTY mode
  ---
  duration_ms: 0.561542
  type: 'test'
  ...
# Subtest: withSpinner prints plain text without symbols for no-TTY mode
ok 803 - withSpinner prints plain text without symbols for no-TTY mode
  ---
  duration_ms: 0.144209
  type: 'test'
  ...
# Subtest: JSON mode suppresses UX text output
ok 804 - JSON mode suppresses UX text output
  ---
  duration_ms: 0.167958
  type: 'test'
  ...
# Subtest: human output helpers render branded hierarchy in TTY mode
ok 805 - human output helpers render branded hierarchy in TTY mode
  ---
  duration_ms: 0.214708
  type: 'test'
  ...
# Subtest: human output helpers fall back to plain text in no-TTY mode
ok 806 - human output helpers fall back to plain text in no-TTY mode
  ---
  duration_ms: 0.07375
  type: 'test'
  ...
# Subtest: taskGroup runs real stages and writes checks for non-spinner stages
ok 807 - taskGroup runs real stages and writes checks for non-spinner stages
  ---
  duration_ms: 0.245417
  type: 'test'
  ...
# Subtest: promptConfirm requires explicit interactive TTY mode
ok 808 - promptConfirm requires explicit interactive TTY mode
  ---
  duration_ms: 0.589792
  type: 'test'
  ...
# Subtest: promptConfirm uses injected confirmation in interactive TTY mode
ok 809 - promptConfirm uses injected confirmation in interactive TTY mode
  ---
  duration_ms: 0.368584
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends apply for clean creates
ok 810 - analyze-project apply selector recommends apply for clean creates
  ---
  duration_ms: 0.707666
  type: 'test'
  ...
# Subtest: analyze-project apply selector is disabled in CI even with TTY streams
ok 811 - analyze-project apply selector is disabled in CI even with TTY streams
  ---
  duration_ms: 0.089583
  type: 'test'
  ...
# Subtest: analyze-project apply selector recommends diff for dirty updates
ok 812 - analyze-project apply selector recommends diff for dirty updates
  ---
  duration_ms: 0.130959
  type: 'test'
  ...
# Subtest: analyze-project apply diff preview is bounded and marks truncation
ok 813 - analyze-project apply diff preview is bounded and marks truncation
  ---
  duration_ms: 0.112375
  type: 'test'
  ...
# Subtest: collectDashboardReport separates global progress from visible filtered progress
ok 814 - collectDashboardReport separates global progress from visible filtered progress
  ---
  duration_ms: 28.766875
  type: 'test'
  ...
# Subtest: collectDashboardReport includes completed slices only when requested and never leaks evidence values
ok 815 - collectDashboardReport includes completed slices only when requested and never leaks evidence values
  ---
  duration_ms: 42.628375
  type: 'test'
  ...
# Subtest: collectDashboardReport handles zero-slice specs
ok 816 - collectDashboardReport handles zero-slice specs
  ---
  duration_ms: 14.14675
  type: 'test'
  ...
# Subtest: collectDashboardReport reports graph errors without throwing
ok 817 - collectDashboardReport reports graph errors without throwing
  ---
  duration_ms: 17.104291
  type: 'test'
  ...
# Subtest: collectDashboardReport rejects an explicit unknown spec
ok 818 - collectDashboardReport rejects an explicit unknown spec
  ---
  duration_ms: 14.8295
  type: 'test'
  ...
# Subtest: formatHumanDashboard exposes the core dashboard sections
ok 819 - formatHumanDashboard exposes the core dashboard sections
  ---
  duration_ms: 59.261916
  type: 'test'
  ...
# Subtest: formatHumanDashboard keeps large default output compact and actionable
ok 820 - formatHumanDashboard keeps large default output compact and actionable
  ---
  duration_ms: 37.658667
  type: 'test'
  ...
# Subtest: formatHumanDashboard supports details and section views
ok 821 - formatHumanDashboard supports details and section views
  ---
  duration_ms: 15.589375
  type: 'test'
  ...
# Subtest: normalizeDashboardOptions rejects ambiguous or invalid human flags
ok 822 - normalizeDashboardOptions rejects ambiguous or invalid human flags
  ---
  duration_ms: 0.841333
  type: 'test'
  ...
# Subtest: collectLayoutReport detects a new no-spec layout as valid
ok 823 - collectLayoutReport detects a new no-spec layout as valid
  ---
  duration_ms: 28.267042
  type: 'test'
  ...
# Subtest: collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
ok 824 - collectLayoutReport distinguishes legacy, hybrid, and incomplete layouts
  ---
  duration_ms: 95.713417
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing tools, auth, and spaced paths
ok 825 - collectEnvironmentWarnings reports missing tools, auth, and spaced paths
  ---
  duration_ms: 2.487166
  type: 'test'
  ...
# Subtest: collectEnvironmentWarnings reports missing gh with cross-platform guidance
ok 826 - collectEnvironmentWarnings reports missing gh with cross-platform guidance
  ---
  duration_ms: 3.1295
  type: 'test'
  ...
# Subtest: formatActionableError includes failure, impact, fix, and next command
ok 827 - formatActionableError includes failure, impact, fix, and next command
  ---
  duration_ms: 0.118333
  type: 'test'
  ...
# Subtest: draft lifecycle vocabulary is explicit and bounded
ok 828 - draft lifecycle vocabulary is explicit and bounded
  ---
  duration_ms: 0.616042
  type: 'test'
  ...
# Subtest: markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
ok 829 - markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities
  ---
  duration_ms: 0.839291
  type: 'test'
  ...
# Subtest: structured extraction supports exact collections, references, and v58 acceptance arrays
ok 830 - structured extraction supports exact collections, references, and v58 acceptance arrays
  ---
  duration_ms: 0.408792
  type: 'test'
  ...
# Subtest: preservation compares structural identity rather than word count
ok 831 - preservation compares structural identity rather than word count
  ---
  duration_ms: 0.280417
  type: 'test'
  ...
# Subtest: missing identity and required collection are diagnosed as corruption
ok 832 - missing identity and required collection are diagnosed as corruption
  ---
  duration_ms: 0.2215
  type: 'test'
  ...
# Subtest: explicit deletion is accepted only when the exact identity and references are removed
ok 833 - explicit deletion is accepted only when the exact identity and references are removed
  ---
  duration_ms: 0.702417
  type: 'test'
  ...
# Subtest: duplicates, broken references, malformed structured content, and free text fail closed
ok 834 - duplicates, broken references, malformed structured content, and free text fail closed
  ---
  duration_ms: 0.350041
  type: 'test'
  ...
# Subtest: redactSecrets removes common token and password patterns
ok 835 - redactSecrets removes common token and password patterns
  ---
  duration_ms: 0.764583
  type: 'test'
  ...
# Subtest: truncateText marks long output without changing short output
ok 836 - truncateText marks long output without changing short output
  ---
  duration_ms: 0.35625
  type: 'test'
  ...
# Subtest: defaultEvidencePath writes under .quiver evidence
ok 837 - defaultEvidencePath writes under .quiver evidence
  ---
  duration_ms: 0.716916
  type: 'test'
  ...
# Subtest: runEvidenceCommand records redacted and truncated output
ok 838 - runEvidenceCommand records redacted and truncated output
  ---
  duration_ms: 4.470042
  type: 'test'
  ...
# Subtest: runEvidenceCommand rejects traversal output before spawning child
ok 839 - runEvidenceCommand rejects traversal output before spawning child
  ---
  duration_ms: 3.31575
  type: 'test'
  ...
# Subtest: evidence path policy rejects symlink output and read escapes
ok 840 - evidence path policy rejects symlink output and read escapes
  ---
  duration_ms: 9.030708
  type: 'test'
  ...
# Subtest: runEvidenceCommand records signal metadata and signal exit code
ok 841 - runEvidenceCommand records signal metadata and signal exit code
  ---
  duration_ms: 4.711166
  type: 'test'
  ...
# Subtest: listEvidenceFiles and showEvidenceFile return parseable safe records
ok 842 - listEvidenceFiles and showEvidenceFile return parseable safe records
  ---
  duration_ms: 9.557416
  type: 'test'
  ...
# Subtest: withWindowsLongPaths enables core.longpaths on Windows git commands
ok 843 - withWindowsLongPaths enables core.longpaths on Windows git commands
  ---
  duration_ms: 1.235833
  type: 'test'
  ...
# Subtest: withWindowsLongPaths leaves non-Windows git commands unchanged
ok 844 - withWindowsLongPaths leaves non-Windows git commands unchanged
  ---
  duration_ms: 0.072709
  type: 'test'
  ...
# Subtest: base branch candidates keep explicit override before all defaults
ok 845 - base branch candidates keep explicit override before all defaults
  ---
  duration_ms: 80.153875
  type: 'test'
  ...
# Subtest: base branch resolution uses remote HEAD when available
ok 846 - base branch resolution uses remote HEAD when available
  ---
  duration_ms: 166.331916
  type: 'test'
  ...
# Subtest: base branch resolution falls back to local main, master, then develop
ok 847 - base branch resolution falls back to local main, master, then develop
  ---
  duration_ms: 218.714459
  type: 'test'
  ...
# Subtest: check-handoff keeps validating the legacy spec handoff contract
ok 848 - check-handoff keeps validating the legacy spec handoff contract
  ---
  duration_ms: 2.14975
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice execution briefs
ok 849 - check-handoff validates per-slice execution briefs
  ---
  duration_ms: 4.404917
  type: 'test'
  ...
# Subtest: check-handoff validates per-slice closure briefs
ok 850 - check-handoff validates per-slice closure briefs
  ---
  duration_ms: 1.861375
  type: 'test'
  ...
# Subtest: check-handoff rejects incomplete per-slice execution briefs with an actionable error
ok 851 - check-handoff rejects incomplete per-slice execution briefs with an actionable error
  ---
  duration_ms: 3.807459
  type: 'test'
  ...
# Subtest: check-handoff renders Spanish missing-section guidance when requested
ok 852 - check-handoff renders Spanish missing-section guidance when requested
  ---
  duration_ms: 1.722208
  type: 'test'
  ...
# Subtest: catalogs expose supported languages and version metadata
ok 853 - catalogs expose supported languages and version metadata
  ---
  duration_ms: 0.435917
  type: 'test'
  ...
# Subtest: catalog completeness is enforced across en and es
ok 854 - catalog completeness is enforced across en and es
  ---
  duration_ms: 7.0495
  type: 'test'
  ...
# Subtest: translate supports interpolation and predictable missing params
ok 855 - translate supports interpolation and predictable missing params
  ---
  duration_ms: 0.307958
  type: 'test'
  ...
# Subtest: translate sanitizes unsafe interpolation values
ok 856 - translate sanitizes unsafe interpolation values
  ---
  duration_ms: 0.072709
  type: 'test'
  ...
# Subtest: translate supports one and other plural forms
ok 857 - translate supports one and other plural forms
  ---
  duration_ms: 0.143166
  type: 'test'
  ...
# Subtest: fallback to en is explicit and deterministic
ok 858 - fallback to en is explicit and deterministic
  ---
  duration_ms: 0.123041
  type: 'test'
  ...
# Subtest: translator keeps command snippets and flags exact
ok 859 - translator keeps command snippets and flags exact
  ---
  duration_ms: 0.108834
  type: 'test'
  ...
# Subtest: normalizes supported language and locale values
ok 860 - normalizes supported language and locale values
  ---
  duration_ms: 0.433084
  type: 'test'
  ...
# Subtest: resolves language by approved precedence order
ok 861 - resolves language by approved precedence order
  ---
  duration_ms: 2.294375
  type: 'test'
  ...
# Subtest: uses global config when project config is missing
ok 862 - uses global config when project config is missing
  ---
  duration_ms: 1.329542
  type: 'test'
  ...
# Subtest: uses locale detection before default fallback
ok 863 - uses locale detection before default fallback
  ---
  duration_ms: 1.893875
  type: 'test'
  ...
# Subtest: unsupported explicit language falls back to en with actionable warning
ok 864 - unsupported explicit language falls back to en with actionable warning
  ---
  duration_ms: 2.3775
  type: 'test'
  ...
# Subtest: language config writes preserve existing keys and reject unsupported persisted values
ok 865 - language config writes preserve existing keys and reject unsupported persisted values
  ---
  duration_ms: 1.519791
  type: 'test'
  ...
# Subtest: extracts global --lang before or after command names
ok 866 - extracts global --lang before or after command names
  ---
  duration_ms: 0.231583
  type: 'test'
  ...
# Subtest: template paths normalize safely
ok 867 - template paths normalize safely
  ---
  duration_ms: 1.427083
  type: 'test'
  ...
# Subtest: human template classification excludes machine artifacts
ok 868 - human template classification excludes machine artifacts
  ---
  duration_ms: 0.311333
  type: 'test'
  ...
# Subtest: localized template convention inserts language before .template
ok 869 - localized template convention inserts language before .template
  ---
  duration_ms: 0.270709
  type: 'test'
  ...
# Subtest: template language resolution uses project config and explicit overrides
ok 870 - template language resolution uses project config and explicit overrides
  ---
  duration_ms: 1.731542
  type: 'test'
  ...
# Subtest: localized human templates resolve by language and fall back explicitly to en
ok 871 - localized human templates resolve by language and fall back explicitly to en
  ---
  duration_ms: 4.198125
  type: 'test'
  ...
# Subtest: machine artifacts are never routed through localized human templates
ok 872 - machine artifacts are never routed through localized human templates
  ---
  duration_ms: 1.936917
  type: 'test'
  ...
# Subtest: localized template coverage reports missing human templates and skips machine artifacts
ok 873 - localized template coverage reports missing human templates and skips machine artifacts
  ---
  duration_ms: 3.182375
  type: 'test'
  ...
# /bin/sh: npm: No such file or directory
# Subtest: migration blocks compatibility evidence drift before its first project write
ok 874 - migration blocks compatibility evidence drift before its first project write
  ---
  duration_ms: 142.320375
  type: 'test'
  ...
# Subtest: legacy migration blocks declared older dependency drift before its first project write
ok 875 - legacy migration blocks declared older dependency drift before its first project write
  ---
  duration_ms: 86.157375
  type: 'test'
  ...
# Subtest: detectPackageManager returns npm when no lockfile exists
ok 876 - detectPackageManager returns npm when no lockfile exists
  ---
  duration_ms: 0.310792
  type: 'test'
  ...
# Subtest: detectPackageManager returns yarn when yarn.lock exists
ok 877 - detectPackageManager returns yarn when yarn.lock exists
  ---
  duration_ms: 0.388459
  type: 'test'
  ...
# Subtest: detectPackageManager returns pnpm when pnpm-lock.yaml exists
ok 878 - detectPackageManager returns pnpm when pnpm-lock.yaml exists
  ---
  duration_ms: 0.416459
  type: 'test'
  ...
# Subtest: detectPackageManager returns bun when bun.lockb exists
ok 879 - detectPackageManager returns bun when bun.lockb exists
  ---
  duration_ms: 0.361917
  type: 'test'
  ...
# Subtest: detectPackageManager prefers bun over pnpm over yarn over npm
ok 880 - detectPackageManager prefers bun over pnpm over yarn over npm
  ---
  duration_ms: 0.717208
  type: 'test'
  ...
# Subtest: formatInstallSelfCommand respects detected package managers
ok 881 - formatInstallSelfCommand respects detected package managers
  ---
  duration_ms: 1.208583
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-no-package-json when no package.json
ok 882 - installSelfAsDevDep returns skipped-no-package-json when no package.json
  ---
  duration_ms: 0.450042
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
ok 883 - installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps
  ---
  duration_ms: 0.748334
  type: 'test'
  ...
# Subtest: installSelfAsDevDep returns failed when install command fails
ok 884 - installSelfAsDevDep returns failed when install command fails
  ---
  duration_ms: 7.713375
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes legacy scripts and exports templates only when requested
ok 885 - initializeProjectDocs writes legacy scripts and exports templates only when requested
  ---
  duration_ms: 65.771167
  type: 'test'
  ...
# Subtest: initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
ok 886 - initializeProjectDocs full migrate mode preserves existing files and keeps broad optional assets
  ---
  duration_ms: 144.185416
  type: 'test'
  ...
# Subtest: initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
ok 887 - initializeProjectDocs preserves custom internal ignores and migrates blanket Git excludes
  ---
  duration_ms: 149.96925
  type: 'test'
  ...
# Subtest: initializeProjectDocs fails closed without overwriting invalid governance config
ok 888 - initializeProjectDocs fails closed without overwriting invalid governance config
  ---
  duration_ms: 7.909417
  type: 'test'
  ...
# Subtest: resolveInitProfile selects default, minimal, and full profiles
ok 889 - resolveInitProfile selects default, minimal, and full profiles
  ---
  duration_ms: 1.145625
  type: 'test'
  ...
# Subtest: normalizeInitLayoutOptions rejects mutually exclusive profiles
ok 890 - normalizeInitLayoutOptions rejects mutually exclusive profiles
  ---
  duration_ms: 0.292875
  type: 'test'
  ...
# Subtest: buildInitLayout creates a default AI-first plan without legacy visible roots
ok 891 - buildInitLayout creates a default AI-first plan without legacy visible roots
  ---
  duration_ms: 4.263709
  type: 'test'
  ...
# Subtest: buildInitLayout reports preserved files instead of overwriting them
ok 892 - buildInitLayout reports preserved files instead of overwriting them
  ---
  duration_ms: 2.809584
  type: 'test'
  ...
# Subtest: buildInitLayout includes compatibility assets for full profile
ok 893 - buildInitLayout includes compatibility assets for full profile
  ---
  duration_ms: 0.536
  type: 'test'
  ...
# Subtest: buildInitLayout includes optional legacy scripts and template export only when requested
ok 894 - buildInitLayout includes optional legacy scripts and template export only when requested
  ---
  duration_ms: 0.436291
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan prints core dry-run sections
ok 895 - formatInitLayoutPlan prints core dry-run sections
  ---
  duration_ms: 0.551084
  type: 'test'
  ...
# Subtest: formatInitLayoutPlan reports planned language config writes
ok 896 - formatInitLayoutPlan reports planned language config writes
  ---
  duration_ms: 1.729375
  type: 'test'
  ...
# Subtest: default generated package scripts target supported CLI commands
ok 897 - default generated package scripts target supported CLI commands
  ---
  duration_ms: 1.357959
  type: 'test'
  ...
# Subtest: stripJsonComments preserves comment-like markers inside strings
ok 898 - stripJsonComments preserves comment-like markers inside strings
  ---
  duration_ms: 0.901667
  type: 'test'
  ...
# Subtest: stripJsonComments removes comments outside strings
ok 899 - stripJsonComments removes comments outside strings
  ---
  duration_ms: 0.164792
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
# Worktree: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-GH4x2l/feature-QUIVER-22-05-spec-worktree-lifecycle
# Context: /private/var/folders/tg/5yrk1ttn2mz03w9zy7cg_5cr0000gn/T/.worktrees/quiver-spec-worktree-GH4x2l/feature-QUIVER-22-05-spec-worktree-lifecycle/WORKTREE_CONTEXT.md
# Subtest: startSpecWorktree creates and reuses a spec worktree on main
ok 900 - startSpecWorktree creates and reuses a spec worktree on main
  ---
  duration_ms: 364.023583
  type: 'test'
  ...
# Subtest: startSpecWorktree dry-run reports planned worktree without creating it
ok 901 - startSpecWorktree dry-run reports planned worktree without creating it
  ---
  duration_ms: 189.103792
  type: 'test'
  ...
# Subtest: startSpecWorktree supports develop as the base branch
ok 902 - startSpecWorktree supports develop as the base branch
  ---
  duration_ms: 257.037459
  type: 'test'
  ...
# Subtest: startSpecWorktree refuses to reuse a dirty existing worktree
ok 903 - startSpecWorktree refuses to reuse a dirty existing worktree
  ---
  duration_ms: 228.797083
  type: 'test'
  ...
# Subtest: startSpecWorktree reports a stale registered worktree with recovery steps
ok 904 - startSpecWorktree reports a stale registered worktree with recovery steps
  ---
  duration_ms: 201.682917
  type: 'test'
  ...
# Subtest: startSpecWorktree rejects concurrent spec operations with a lock
ok 905 - startSpecWorktree rejects concurrent spec operations with a lock
  ---
  duration_ms: 102.81475
  type: 'test'
  ...
# Subtest: startSlice refuses to create nested worktrees from an existing worktree
ok 906 - startSlice refuses to create nested worktrees from an existing worktree
  ---
  duration_ms: 212.56725
  type: 'test'
  ...
# Subtest: startSlice renders English lifecycle output when requested
ok 907 - startSlice renders English lifecycle output when requested
  ---
  duration_ms: 195.703708
  type: 'test'
  ...
# Subtest: cleanupSlice dry-run renders English lifecycle output when requested
ok 908 - cleanupSlice dry-run renders English lifecycle output when requested
  ---
  duration_ms: 197.850542
  type: 'test'
  ...
# Subtest: describeSpecState reports slice-00 status and pending slices
ok 909 - describeSpecState reports slice-00 status and pending slices
  ---
  duration_ms: 77.566042
  type: 'test'
  ...
# Subtest: ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
ok 910 - ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete
  ---
  duration_ms: 73.842959
  type: 'test'
  ...
# Subtest: startSlice blocks later slices until slice-00 is completed
ok 911 - startSlice blocks later slices until slice-00 is completed
  ---
  duration_ms: 109.2265
  type: 'test'
  ...
# Subtest: model catalog exposes versioned providers and required model entries
ok 912 - model catalog exposes versioned providers and required model entries
  ---
  duration_ms: 0.734542
  type: 'test'
  ...
# Subtest: model aliases are case-insensitive and tolerant of spaces and dashes
ok 913 - model aliases are case-insensitive and tolerant of spaces and dashes
  ---
  duration_ms: 0.749458
  type: 'test'
  ...
# Subtest: model catalog sorts known models by requested role and includes custom choice
ok 914 - model catalog sorts known models by requested role and includes custom choice
  ---
  duration_ms: 0.133208
  type: 'test'
  ...
# Subtest: custom model resolution remains allowed but marked as custom
ok 915 - custom model resolution remains allowed but marked as custom
  ---
  duration_ms: 0.140417
  type: 'test'
  ...
# Subtest: ambiguous aliases are reported without selecting a model
ok 916 - ambiguous aliases are reported without selecting a model
  ---
  duration_ms: 0.066709
  type: 'test'
  ...
# Subtest: normalizeTarballPath and stripPackagePrefix support tarball entries
ok 917 - normalizeTarballPath and stripPackagePrefix support tarball entries
  ---
  duration_ms: 0.479417
  type: 'test'
  ...
# Subtest: collectPackageSafetyViolations flags sensitive local files in package tarball paths
ok 918 - collectPackageSafetyViolations flags sensitive local files in package tarball paths
  ---
  duration_ms: 1.002875
  type: 'test'
  ...
# Subtest: assertPackageSafety passes safe tarball paths
ok 919 - assertPackageSafety passes safe tarball paths
  ---
  duration_ms: 0.150792
  type: 'test'
  ...
# Subtest: assertPackageSafety fails with a clear code when unsafe tarball paths are present
ok 920 - assertPackageSafety fails with a clear code when unsafe tarball paths are present
  ---
  duration_ms: 0.265541
  type: 'test'
  ...
# Subtest: toPosixPath normalizes explicit Windows separators
ok 921 - toPosixPath normalizes explicit Windows separators
  ---
  duration_ms: 0.510833
  type: 'test'
  ...
# Subtest: relativePosixPath handles Git Bash drive paths on Windows
ok 922 - relativePosixPath handles Git Bash drive paths on Windows
  ---
  duration_ms: 0.278917
  type: 'test'
  ...
# Subtest: relativePosixPath handles extended Windows path prefixes
ok 923 - relativePosixPath handles extended Windows path prefixes
  ---
  duration_ms: 0.066208
  type: 'test'
  ...
# Subtest: isPathInsideRoot accepts equivalent Windows realpath aliases
ok 924 - isPathInsideRoot accepts equivalent Windows realpath aliases
  ---
  duration_ms: 0.391083
  type: 'test'
  ...
# Subtest: isPathInsideRoot rejects targets that realpath outside the root
ok 925 - isPathInsideRoot rejects targets that realpath outside the root
  ---
  duration_ms: 0.803875
  type: 'test'
  ...
# Subtest: normalizeGitBashDrivePath leaves non-Windows path libs untouched
ok 926 - normalizeGitBashDrivePath leaves non-Windows path libs untouched
  ---
  duration_ms: 0.174542
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs paths from absolute Windows paths
ok 927 - specRelativePathFromPath extracts specs paths from absolute Windows paths
  ---
  duration_ms: 0.263625
  type: 'test'
  ...
# Subtest: specRelativePathFromPath extracts specs-fix paths from Git Bash paths
ok 928 - specRelativePathFromPath extracts specs-fix paths from Git Bash paths
  ---
  duration_ms: 0.145333
  type: 'test'
  ...
# Subtest: specRelativePathFromPath returns empty string when no spec family exists
ok 929 - specRelativePathFromPath returns empty string when no spec family exists
  ---
  duration_ms: 0.554917
  type: 'test'
  ...
# Subtest: validateProjectRelativePath rejects absolute and traversal paths
ok 930 - validateProjectRelativePath rejects absolute and traversal paths
  ---
  duration_ms: 1.536084
  type: 'test'
  ...
# Subtest: writeProjectScanJson writes the current internal scan path
ok 931 - writeProjectScanJson writes the current internal scan path
  ---
  duration_ms: 4.667
  type: 'test'
  ...
# Subtest: readProjectScanArtifact prefers current scan over legacy scan
ok 932 - readProjectScanArtifact prefers current scan over legacy scan
  ---
  duration_ms: 3.27075
  type: 'test'
  ...
# Subtest: readProjectScanArtifact falls back to legacy scan path
ok 933 - readProjectScanArtifact falls back to legacy scan path
  ---
  duration_ms: 3.117125
  type: 'test'
  ...
# Subtest: context pack metadata reports current or legacy scan source when repoRoot is provided
ok 934 - context pack metadata reports current or legacy scan source when repoRoot is provided
  ---
  duration_ms: 3.439875
  type: 'test'
  ...
# Subtest: readProjectScanStatus reports source and missing visible map state
ok 935 - readProjectScanStatus reports source and missing visible map state
  ---
  duration_ms: 4.567625
  type: 'test'
  ...
# Subtest: normalizes statuses through the canonical catalogs
ok 936 - normalizes statuses through the canonical catalogs
  ---
  duration_ms: 0.899541
  type: 'test'
  ...
# Subtest: resolver keeps scoped reads away from unrelated invalid historical specs
ok 937 - resolver keeps scoped reads away from unrelated invalid historical specs
  ---
  duration_ms: 5.609583
  type: 'test'
  ...
# Subtest: plan and AI export consume the same resolver state for completed slices
ok 938 - plan and AI export consume the same resolver state for completed slices
  ---
  duration_ms: 21.509125
  type: 'test'
  ...
# Subtest: active slice reconciliation blocks conflicting active sources
ok 939 - active slice reconciliation blocks conflicting active sources
  ---
  duration_ms: 18.00975
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes replacing a missing active doc from board state
ok 940 - active slice reconciliation proposes replacing a missing active doc from board state
  ---
  duration_ms: 8.038542
  type: 'test'
  ...
# Subtest: active slice reconciliation proposes closing completed active slice state
ok 941 - active slice reconciliation proposes closing completed active slice state
  ---
  duration_ms: 8.430708
  type: 'test'
  ...
# Subtest: quiverInternalPaths centralizes internal paths
ok 942 - quiverInternalPaths centralizes internal paths
  ---
  duration_ms: 0.463792
  type: 'test'
  ...
# Subtest: buildQuiverInternalGitignore ignores runtime-only folders
ok 943 - buildQuiverInternalGitignore ignores runtime-only folders
  ---
  duration_ms: 0.180583
  type: 'test'
  ...
# Subtest: buildQuiverConfig documents internal and visible artifact paths
ok 944 - buildQuiverConfig documents internal and visible artifact paths
  ---
  duration_ms: 0.3475
  type: 'test'
  ...
# Subtest: initializeProjectDocs writes internal config and gitignore using explicit template root
ok 945 - initializeProjectDocs writes internal config and gitignore using explicit template root
  ---
  duration_ms: 65.337833
  type: 'test'
  ...
# Subtest: renderDotGraph emits valid DOT source with nodes and edges
ok 946 - renderDotGraph emits valid DOT source with nodes and edges
  ---
  duration_ms: 8.055125
  type: 'test'
  ...
# Subtest: renderMermaidGraph emits a fenced flowchart with nodes and edges
ok 947 - renderMermaidGraph emits a fenced flowchart with nodes and edges
  ---
  duration_ms: 10.52725
  type: 'test'
  ...
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Switched to a new branch 'main'
# Switched to a new branch 'feature/QUIVER-01-slice-01-alpha'
# Subtest: parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
ok 948 - parseStatusPorcelain normalizes modified, added, untracked, and renamed paths
  ---
  duration_ms: 0.917417
  type: 'test'
  ...
# Subtest: validateScopeSnapshot reports only files changed after the before snapshot
ok 949 - validateScopeSnapshot reports only files changed after the before snapshot
  ---
  duration_ms: 0.491625
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports simple glob write scopes
ok 950 - validateScopeSnapshot supports simple glob write scopes
  ---
  duration_ms: 0.285042
  type: 'test'
  ...
# Subtest: validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
ok 951 - validateScopeSnapshot supports exact paths and mixed exact plus glob scopes
  ---
  duration_ms: 0.087709
  type: 'test'
  ...
# Subtest: checkScope uses slice git.base_branch instead of hardcoded develop
ok 952 - checkScope uses slice git.base_branch instead of hardcoded develop
  ---
  duration_ms: 158.938333
  type: 'test'
  ...
# Subtest: checkScope respects an explicit base branch before slice git.base_branch
ok 953 - checkScope respects an explicit base branch before slice git.base_branch
  ---
  duration_ms: 140.508041
  type: 'test'
  ...
# Subtest: readAllSlices returns an empty array for an empty repo
ok 954 - readAllSlices returns an empty array for an empty repo
  ---
  duration_ms: 1.119
  type: 'test'
  ...
# Subtest: readAllSlices reads real slices from the current repo
ok 955 - readAllSlices reads real slices from the current repo
  ---
  duration_ms: 55.484541
  type: 'test'
  ...
# Subtest: inferDependencies honors explicit dependencies and heuristic overlap
ok 956 - inferDependencies honors explicit dependencies and heuristic overlap
  ---
  duration_ms: 4.291875
  type: 'test'
  ...
# Subtest: readAllSlices uses allowed_write_paths as write scope when present
ok 957 - readAllSlices uses allowed_write_paths as write scope when present
  ---
  duration_ms: 1.623458
  type: 'test'
  ...
# Subtest: buildGraph and topoSort preserve explicit cross-spec order
ok 958 - buildGraph and topoSort preserve explicit cross-spec order
  ---
  duration_ms: 2.871042
  type: 'test'
  ...
# Subtest: topoSort throws a typed error with the full cycle path
ok 959 - topoSort throws a typed error with the full cycle path
  ---
  duration_ms: 2.675583
  type: 'test'
  ...
# Subtest: computeLevels puts disjoint slices in the same level and detects conflicts
ok 960 - computeLevels puts disjoint slices in the same level and detects conflicts
  ---
  duration_ms: 2.333708
  type: 'test'
  ...
# Subtest: buildGraph drops legacy bare spec-name deps and produces zero edges
ok 961 - buildGraph drops legacy bare spec-name deps and produces zero edges
  ---
  duration_ms: 1.524542
  type: 'test'
  ...
# Subtest: buildGraph drops slash deps whose second segment is not a slice-id (regression)
ok 962 - buildGraph drops slash deps whose second segment is not a slice-id (regression)
  ---
  duration_ms: 1.317292
  type: 'test'
  ...
# Subtest: buildGraph preserves depends_on with full spec/slice-id format (regression)
ok 963 - buildGraph preserves depends_on with full spec/slice-id format (regression)
  ---
  duration_ms: 2.062583
  type: 'test'
  ...
# Subtest: normalizeDeclaredDependencies expands bare slice ids within the same spec
ok 964 - normalizeDeclaredDependencies expands bare slice ids within the same spec
  ---
  duration_ms: 0.112875
  type: 'test'
  ...
# Subtest: foundation slice helpers recognize slice-00 ids
ok 965 - foundation slice helpers recognize slice-00 ids
  ---
  duration_ms: 0.052375
  type: 'test'
  ...
# Subtest: templateRootExists validates a minimal Quiver template root
ok 966 - templateRootExists validates a minimal Quiver template root
  ---
  duration_ms: 1.866375
  type: 'test'
  ...
# Subtest: resolveTemplateRoot prefers packaged templates by default
ok 967 - resolveTemplateRoot prefers packaged templates by default
  ---
  duration_ms: 2.947166
  type: 'test'
  ...
# Subtest: resolveTemplateRoot can prefer exported templates when requested
ok 968 - resolveTemplateRoot can prefer exported templates when requested
  ---
  duration_ms: 5.4825
  type: 'test'
  ...
# Subtest: resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
ok 969 - resolveTemplateRoot falls back to legacy docs-template when packaged templates are absent
  ---
  duration_ms: 1.396875
  type: 'test'
  ...
# Subtest: resolveTemplatePath returns the concrete template file path
ok 970 - resolveTemplatePath returns the concrete template file path
  ---
  duration_ms: 1.14575
  type: 'test'
  ...
# Subtest: resolveTemplateRoot reports every searched location when templates are missing
ok 971 - resolveTemplateRoot reports every searched location when templates are missing
  ---
  duration_ms: 0.595083
  type: 'test'
  ...
# Subtest: collectVersionReport works outside an initialized project
ok 972 - collectVersionReport works outside an initialized project
  ---
  duration_ms: 1.149167
  type: 'test'
  ...
# Subtest: detectPackageManager uses package.json before lockfiles and env
ok 973 - detectPackageManager uses package.json before lockfiles and env
  ---
  duration_ms: 1.04375
  type: 'test'
  ...
# Subtest: formatHumanVersionReport is readable without color and fits the banner budget
ok 974 - formatHumanVersionReport is readable without color and fits the banner budget
  ---
  duration_ms: 0.785
  type: 'test'
  ...
# Subtest: formatHumanVersionReport uses Quiver palette when color is enabled
ok 975 - formatHumanVersionReport uses Quiver palette when color is enabled
  ---
  duration_ms: 0.820792
  type: 'test'
  ...
# Subtest: slice schema is declared as JSON Schema Draft-07
ok 976 - slice schema is declared as JSON Schema Draft-07
  ---
  duration_ms: 0.875083
  type: 'test'
  ...
# Subtest: slice schema validates real runtime-valid fixtures and rejects invalid fixtures
ok 977 - slice schema validates real runtime-valid fixtures and rejects invalid fixtures
  ---
  duration_ms: 131.473958
  type: 'test'
  ...
1..977
# tests 977
# suites 0
# pass 977
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 81997.85625

````

## Stderr

````text

````
