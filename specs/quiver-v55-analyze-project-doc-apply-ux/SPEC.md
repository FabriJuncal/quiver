# Quiver v55 - Analyze Project Doc Apply UX

**Date:** 2026-06-12
**Status:** Approved, not implemented
**Source:** User-approved requirement, technical plan, production review, and stricter slice-cut review.

## Problem

`ai analyze-project --deep --provider codex --model gpt-5.5` now generates valid, auditable doc proposals, but users still do not get an easy path to apply those proposals. Without `--review`, no final docs are written. With `--review`, Quiver opens a large JSON proposal in `$VISUAL` or `$EDITOR`, which is safe but confusing for non-technical users, especially when the editor is `vim` or another console editor.

The command needs a simpler product-grade flow that explains choices, supports English and Spanish, preserves auditability, and avoids accidental documentation writes.

## Objective

Add a safe, bilingual, user-friendly documentation application workflow for `ai analyze-project`:

```bash
npx create-quiver ai analyze-project --deep --apply-docs --provider codex --model gpt-5.5
npx create-quiver ai analyze-project --deep --apply-docs --yes --provider codex --model gpt-5.5
npx create-quiver ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx create-quiver ai analyze-project apply --run <run-id>
```

The implementation must separate proposal generation, proposal persistence, apply logic, and interactive UX so future teams can evolve each part without duplicating write-gate logic.

## Scope

### Included

- New CLI contract for `--apply-docs`, `--save-proposal`, `--diff`, `--yes`, `--allow-dirty-docs`, and `ai analyze-project apply --run <run-id>`.
- Proposal artifact contract under `.quiver/runs/<run-id>/proposal/`.
- Non-interactive save proposal flow.
- Non-interactive apply flow with `--apply-docs --yes`.
- Interactive TTY selector with explained options and dynamic recommendation.
- Apply saved proposal flow with stale/dirty validation.
- English and Spanish UX copy.
- Docs, command matrix, and release smoke guidance.

### Excluded

- Changing the provider prompt semantics.
- Relaxing the analyze-project schema.
- Writing product code in analyzed repositories.
- Generating specs automatically from project analysis.
- Removing or breaking the existing `--review` editor flow.
- Requiring live provider calls in CI.

## Functional Requirements

1. Normal provider mode without apply flags must clearly say that docs were not written and list the next commands.
2. `--save-proposal` must generate and save a validated normalized proposal without writing final docs.
3. `--apply-docs --yes` must apply validated doc updates without prompting and must be safe for automation.
4. `--apply-docs` in TTY must show a selector with option descriptions.
5. The selector must include:
   - Apply documentation;
   - View diff;
   - Save proposal;
   - Edit proposal;
   - Cancel.
6. The recommended option must be first and must change to View diff when docs are dirty or existing content creates higher overwrite risk.
7. `--review` must preserve current behavior and be documented as advanced edit proposal mode.
8. `ai analyze-project apply --run <run-id>` must apply a saved proposal without running a provider.
9. `apply --run` must revalidate the saved proposal and current docs before writing.
10. `--run latest` may be supported only in TTY and never with `--yes`.

## Non-Functional Requirements

- All writes must be audited.
- All docs writes must use the existing safe write plan, snapshot, and post-write validation path.
- Human console output must stay compact.
- Full diff/proposal details must be saved as artifacts.
- `--json` output must remain parseable and must never include interactive prompts.
- The feature must work in English and Spanish.
- Commands, flags, and paths must not be translated.

## CLI Contract

| Command | Behavior |
|---|---|
| `ai analyze-project --deep --provider ...` | Generates analysis and audited provider artifacts. Does not write final docs. Explains next apply/save commands. |
| `ai analyze-project --deep --save-proposal --provider ...` | Runs provider, validates/repairs analysis, saves normalized proposal artifacts, writes no final docs. |
| `ai analyze-project --deep --save-proposal --json --provider ...` | Same as above with clean JSON result. |
| `ai analyze-project --deep --apply-docs --provider ...` | In TTY, shows explained selector. In no-TTY, fails unless `--yes`. |
| `ai analyze-project --deep --apply-docs --yes --provider ...` | Applies valid docs directly after safety checks. |
| `ai analyze-project --deep --apply-docs --yes --json --provider ...` | Applies valid docs and emits machine-readable result. |
| `ai analyze-project --deep --review --provider ...` | Existing advanced editor review flow. |
| `ai analyze-project apply --run <run-id>` | Applies saved proposal without provider execution. |

## Flag Rules

- `--apply-docs` and `--review` are mutually exclusive.
- `--dry-run` is incompatible with `--apply-docs`, `--save-proposal`, and `apply --run`.
- `--json + --save-proposal` is allowed.
- `--json + --apply-docs` is allowed only with `--yes`.
- `--json + --review` is prohibited.
- `--json` with an interactive selector is prohibited.
- `--allow-dirty-docs` only affects docs target dirty checks; it never permits product code writes.

## Proposal Artifact Contract

Every saved proposal must live under:

```text
.quiver/runs/<run-id>/proposal/
```

Required files:

```text
analyze-project-doc-proposal.json
analyze-project-doc-proposal.md
analyze-project-doc-proposal.diff
manifest.json
```

Required manifest fields:

```json
{
  "schema_version": 1,
  "kind": "quiver-analyze-project-doc-proposal",
  "run_id": "run-...",
  "created_at": "...",
  "language": "en|es",
  "provider": "codex",
  "proposal_json": ".quiver/runs/.../proposal/analyze-project-doc-proposal.json",
  "proposal_markdown": ".quiver/runs/.../proposal/analyze-project-doc-proposal.md",
  "proposal_diff": ".quiver/runs/.../proposal/analyze-project-doc-proposal.diff",
  "selected_context_manifest": ".quiver/runs/.../context/selected-context.json",
  "repair_manifest": ".quiver/runs/.../repair/analyze-project-repair.json",
  "doc_paths": [],
  "doc_before_hashes": {},
  "proposal_sha256": "...",
  "events": []
}
```

The write manifest must be separate:

```text
.quiver/runs/<run-id>/writes/analyze-project-doc-writes.json
```

It must include actions, before/after hashes, snapshot path, validation result, and partial-write status if an unexpected write failure occurs.

## Interactive UX

Spanish example:

```text
Analisis completado.
La IA genero una propuesta de documentacion basada en el codigo del proyecto.

Archivos propuestos:
- docs/CONTEXTO.md
- docs/AI_CONTEXT.md
- docs/ARCHITECTURE.md

Que queres hacer?

> Aplicar documentacion (Recomendado)
  Escribe los archivos propuestos usando merge seguro y snapshot previo.

  Ver diff
  Muestra los cambios antes de decidir si aplicarlos.

  Guardar propuesta
  Guarda la propuesta en .quiver/runs sin modificar docs finales.

  Editar propuesta
  Abre la propuesta en tu editor para modificarla manualmente.

  Cancelar
  No escribe documentacion final.
```

English example:

```text
Analysis completed.
AI generated a documentation proposal from the project source code.

Proposed files:
- docs/CONTEXTO.md
- docs/AI_CONTEXT.md
- docs/ARCHITECTURE.md

What do you want to do?

> Apply documentation (Recommended)
  Writes the proposed files using safe merge and a prior snapshot.

  View diff
  Shows the changes before deciding whether to apply them.

  Save proposal
  Saves the proposal under .quiver/runs without modifying final docs.

  Edit proposal
  Opens the proposal in your editor for manual changes.

  Cancel
  Does not write final documentation.
```

## Safety Rules

- No final docs write if final JSON/proposal is invalid.
- No final docs write if any proposed path is outside the allowlist.
- No silent partial apply.
- Dirty docs block `--yes` unless `--allow-dirty-docs` is passed.
- In repos without Git, use hash/snapshot checks and warn that Git dirty detection is unavailable.
- `apply --run` must revalidate the current repo state before writing.
- A saved proposal with stale doc hashes must warn in TTY and block `--yes` unless explicitly allowed.

## Slice Roadmap

| Slice | Title | Status | Dependencies | Parallel Guidance |
|---|---|---|---|---|
| slice-01-cli-proposal-contract | CLI Contract + Proposal Artifact Contract | pending | none | sequential first |
| slice-02-save-proposal-flow | Save Proposal Flow | pending | slice-01 | sequential after contract |
| slice-03-noninteractive-apply-engine | Non-Interactive Apply Engine | pending | slice-01, slice-02 | sequential safety gate |
| slice-04-interactive-apply-ux | Interactive Apply UX | pending | slice-03 | sequential UI over engine |
| slice-05-apply-saved-proposal | Apply Saved Proposal | pending | slice-02, slice-03 | after apply engine |
| slice-06-i18n-docs-release-smoke | i18n, Docs, Release Smoke | pending | slice-04, slice-05 | final |

## Execution Order

```text
01
└─ 02
   └─ 03
      ├─ 04
      └─ 05
         └─ 06
```

## Validation Strategy

Deterministic gates:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/lib/ai-analyze-project-validation.test.js
node --test tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

Release smoke must use a temporary copy or disposable branch of `nika-erp`, never the main working copy.

## Risks

- Applying proposals over stale docs can overwrite human edits.
- Adding selector logic directly inside `ai.js` can increase CLI debt.
- A broad `--yes` implementation can approve more than intended.
- Diff output can become too large and repeat the original UX problem.
- `apply --run latest` can apply the wrong proposal if not constrained.

## Resolved Decisions

- Implement three layers: Proposal Layer, Apply Layer, UX Layer.
- Keep `--review` backward compatible.
- Permit `--json` for non-interactive save/apply flows.
- Do not require provider/model for `apply --run`.
- Save proposal artifacts before any apply.

## Open Questions

- Exact human diff truncation limit should be chosen during implementation.
- Exact stale proposal warning copy should be finalized with i18n keys.
- Whether `--run latest` ships in v55 or is deferred should be decided during slice-05.
