# Roadmap

## v0.1

- Publish the OSS foundation
- Make the quick start executable
- Ship one complete example

## v0.2

- Add `npx create-quiver`
- Add a docs site
- Add JSON Schema for slices

## v0.3

- Expand automation and testing
- Add richer templates and examples
- Improve release workflows

## v0.4 (shipped 2026-04-21)

- `create-quiver` CLI installer surface
- Post-init `doctor` validation mode
- Release helper and packaged-installer smoke checks

## v0.5 (shipped)

- Existing project migration flow (`create-quiver migrate`)
- Onboarding README flow polish
- Local project installation guidance

## v0.6 (shipped)

> Scope absorbed into v0.7. Node-native runtime and `quiver:*` npm scripts
> landed together with the token-efficient context pack work.

- Cross-platform CI matrix (macOS, Linux, Windows) for Node-native runtime
- Node-native generated project npm scripts (`quiver:*`)
- Additive migration support for existing projects

## v0.7 — Token-Efficient AI Context Packs (shipped 2026-04-23)

- **v13** — Token-efficient AI modes guidance (Completed)
- **v14** — Tiered context pack: QUICK/STANDARD/DEEP tiers, AGENTS.md router, ACTIVE_SLICE lifecycle, YAML front-matter, dedup (Completed)
- **v15** — Init required before migrate (Completed)
- v13 slice-04 reconciled into v14 slice-05 (2026-04-23); v13 slice-02 narrowed to `DECISIONS.md` only
- Validation checkpoint passed after real-world use and spec completion

## Post-Checkpoint Plan (do not execute before validating v14)

> This section is intentionally speculative. Every item below is pending
> evidence from v14 in real use. Rescope or drop anything that does not
> respond to observed friction.

### Orchestration and Tooling (v19–v22, spec drafts created 2026-04-23)

Draft specs exist but are **not executed until v18 passes its validation checkpoint**. Each subsequent spec requires the previous one to pass its own checkpoint before it starts.

- **v19 — Project Visibility** (3 slices, ~11h): `quiver:status`, `quiver:estimate`, `quiver:lint-spec`
- **v20 — Context Diagnostics** (3 slices, ~13h): `quiver:cost`, `quiver:diff-pack`, `quiver:replay`
- **v21 — Slice Archaeology** (2 slices, ~7h): `quiver:archive`, `quiver:blame-slice`; `bisect-slice` documented via `git bisect run` in TROUBLESHOOTING
- **v22 — Deferred Tooling** (3 slices, ~10h, evidence-gated): `quiver:fork-slice`, `quiver:squash-spec`, `quiver:share`

Plan total: ~41h across 11 slices. Drafts parked on `drafts/v19-v22-orchestration-followups`. v22 stays deferred until BACKLOG.md records ≥1 occurrence per slice.

### v0.8 — Slice Orchestration Commands (shipped 2026-05-13)

- `quiver:plan` — pending slices in dependency order with critical path and estimated hours
- `quiver:graph` — dependency graph in ASCII tree, Mermaid, and DOT formats
- `quiver:next` — next ready slice with `--all-ready`, `--json`, and `--auto-start`
- Slice graph library (`slice-graph.js`) with `readAllSlices`, `buildGraph`, `topoSort`, `computeLevels`, `detectFileConflicts`
- `depends_on` and `parallel_safe` validation in `check-slice`
- Fix: `quiver:plan` no longer crashes on repos with legacy bare spec deps

### v0.9 — Auto-Install as Dev Dependency (shipped 2026-05-14)

- After `init` or `migrate`, Quiver installs itself as a dev dependency automatically
- Detects package manager via lockfile (bun → pnpm → yarn → npm)
- Resolves npx cache issues: `npx create-quiver plan` works without `@version`
- `--skip-install` flag for CI environments

### Block A — Zero-Question First Use (proposed)

- `npx create-quiver` with no args auto-detects name, stack, runs analyze + doctor
- `--lite` template variant for small projects
- Optional `--interactive` wizard
- Auto-regenerate context pack on every `start-slice`

### Block B — Multi-Model Context Adapters (proposed, only if users ask)

- Additional adapters beyond `AGENTS.md`: `.cursorrules`, `.cursor/rules/*.mdc`, `copilot-instructions.md`, `PROMPT_FOR_EXECUTOR.md`
- Decision driven by which tools actual users adopt

### Block C — Convincing Example (proposed)

- Real end-to-end example in `examples/full-crud/` with 3 merged slices
- 30-second hello-world asciinema at top of README
- "When NOT to use Quiver" section

### Block D — Polish Debt (proposed)

- Actionable error messages (replace stack traces)
- Embedded JSON Schema validation for `slice.json`
- `start-slice` without arguments auto-detects active slice by branch
- `create-quiver status` dashboard

### Deferred Until Real Demand

- Killing Bash entirely (breaking change — needs user base first)
- `@quiver/cli` / `@quiver/template` package split
- Git hooks auto-install
- Metrics/telemetry

## Decision Rules

- No new spec is written until the previous spec's checkpoint passes
- Specs respond to observed friction, not pre-planned lists
- Breaking changes require at least one confirmed external user
- Prefer recording "we decided not to do X" over silently dropping ideas
- Emerging patterns that are not yet ready for a spec live in [`BACKLOG.md`](./BACKLOG.md) — review it before writing a new spec
