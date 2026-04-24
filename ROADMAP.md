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

## v0.6 (unreleased)

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

### v0.8 — Handoff Contract (draft spec created, pending evidence)

- Canonical `HANDOFF.md.template` for exceptional context transfers
- `create-quiver check-handoff <path>` validation for structure and placement
- Optional `create-quiver new-handoff <slug>` scaffold
- Keep handoffs orthogonal to `slice.json`, not a new slice type

### v0.9 — Context Hygiene and Diagnostics (proposed, not yet spec-ed)

- Analyzer noise filter (ignore lockfiles, dist/, build/, binaries, generated files)
- `create-quiver token-cost` diagnostic (4 chars/token heuristic)
- `create-quiver diff-pack` for review and debug modes
- Cache-friendly ordering within the pack (stable above, volatile below)
- `docs/ai/INDEX.yaml` inverted index (directory → purpose)

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
