# Spec - Quiver v31 AI Model Catalog and Agent Selection

## Objective

Make AI agent configuration safer and easier by letting users select providers and known models from Quiver-guided choices instead of memorizing provider-specific model ids.

The immediate trigger is a real dogfooding failure: a project stored `model: "GPT 5.5"` for a Codex planner, but Codex requires the technical id `gpt-5.5`. Quiver showed `provider run failed` instead of explaining that the saved model looked like a display name.

## Problem

Quiver currently stores free-form `model` values in agent profiles. That is flexible, but it lets users accidentally save a human-friendly model name where the provider CLI expects an exact technical id.

This causes:

- live AI commands to fail late;
- unclear `provider run failed` errors;
- repeated trial and error;
- poor first-run experience for Planner, Executor, Reviewer, and Doctor setup;
- fragile profile reuse across projects.

## Product Requirements

### Known Providers

The first iteration supports only providers already implemented by Quiver:

- `codex`
- `claude`
- `gemini`

Do not expose Qwen or other providers in the main selector until Quiver has a real provider adapter for them.

### Known Model Catalog

Add a local, versioned model catalog owned by Quiver. The catalog is advisory, not a guarantee that a model is enabled for the user's account.

Required catalog metadata:

- provider id;
- model id;
- display name;
- aliases;
- recommended roles;
- cost tier;
- quality tier;
- stability;
- notes;
- catalog version;
- last updated date.

Required Codex entries:

- `gpt-5.5` / `GPT 5.5`
- `gpt-5.4` / `GPT 5.4`
- `gpt-5.4-mini` / `GPT 5.4 mini`
- `gpt-5.3-codex` / `GPT 5.3 Codex`
- `gpt-5.3-codex-spark` / `GPT 5.3 Codex Spark`
- `custom`

Required Claude entries:

- `opus` / `Claude Opus`
- `sonnet` / `Claude Sonnet`
- `haiku` / `Claude Haiku`
- versioned known entries for Opus, Sonnet, and Haiku where Quiver documents them as known local catalog choices;
- `custom`

Required Gemini entries:

- `gemini-3.1-pro-preview` / `Gemini 3.1 Pro Preview`
- `gemini-3.5-flash` / `Gemini 3.5 Flash`
- `gemini-3.1-flash-lite` / `Gemini 3.1 Flash-Lite`
- `gemini-3.1-pro-preview-customtools` / `Gemini 3.1 Pro Custom Tools`
- `custom`

Use the phrase "known by Quiver" in human output. Do not call catalog entries "available" unless a live validation has passed.

### Agent Profile Contract

The persisted profile must separate technical and human values:

```json
{
  "provider": "codex",
  "model": "gpt-5.5",
  "displayName": "GPT 5.5",
  "modelSource": "catalog",
  "validation_status": "not-tested"
}
```

Rules:

- `model` is the technical id sent to the provider CLI.
- `displayName` is the human label shown in Quiver output.
- Existing v2 profiles remain readable.
- New fields must be optional unless a schema bump is required.
- Profiles must never store provider secrets.

### Interactive Agent Setup

When a user runs:

```bash
npx create-quiver ai agent set planner
```

in an interactive terminal, Quiver should guide setup:

1. show existing role profiles if present;
2. ask whether to update current profile, create a new profile, change default, or cancel;
3. show provider choices with CLI install status;
4. show known models for the selected provider, ordered by the requested role;
5. allow `custom`;
6. show a summary before writing;
7. optionally run a live validation test before saving.

In CI/no-TTY, the same command must not hang. It must fail with an actionable message asking for explicit `--provider` and `--model`.

### Alias Normalization

Known aliases must be matched case-insensitively and tolerate spaces, dashes, and common title casing.

Examples that must resolve to `gpt-5.5`:

- `GPT 5.5`
- `gpt 5.5`
- `Gpt-5.5`
- `gpt-5.5`

When a command receives a known display alias through `--model`, Quiver must normalize it or block before provider execution with a concrete suggestion.

### Custom Models

Users can select or pass custom models. Quiver should allow them, but mark them as not validated unless a live provider test passes.

For `custom`, prompt for:

- technical model id;
- display name, defaulting to the id.

### Optional Live Validation

Interactive setup may offer a live validation:

```txt
This test executes the provider and may consume tokens.
```

Validation prompt:

```txt
Respond exactly: ok
```

Default timeout: 60 seconds.

If output contains `ok`, mark validation passed. If it fails, do not save by default and show the relevant provider error.

### Agent Doctor and Repair

Add diagnostics for existing profiles:

- missing provider;
- missing model;
- unsupported provider;
- display alias stored in `model`;
- custom model not validated;
- provider CLI missing;
- provider model flag unsupported;
- duplicate display names;
- multiple profiles per role and default profile.

Add dry-run repair:

```bash
npx create-quiver ai agent repair --dry-run
```

It must propose changes without writing files. If a write mode is added, it must require explicit confirmation or `--yes`.

### AI Models List

Add:

```bash
npx create-quiver ai models list
npx create-quiver ai models list --provider codex
npx create-quiver ai models list --json
```

Human output must group by provider and show recommended roles. JSON output must include `catalogVersion` and `lastUpdated`.

### Shared Preflight

The model resolution and preflight logic must be shared by profile setup and live AI commands:

- `ai prepare-context`
- `ai onboard`
- `ai plan`
- `ai review-plan`
- `ai revise`
- `ai repair-plan`
- `ai execute-slice`
- `ai execute-plan`

Any live provider execution must block before invoking the provider when a known bad model/display alias can be corrected safely.

### Provider Error Extraction

Provider errors can include noisy secondary lines, for example MCP auth warnings. Quiver must prioritize actionable causes:

1. invalid or unsupported model;
2. provider auth;
3. CLI missing;
4. timeout;
5. secondary tool/MCP warnings.

When possible, replace generic `provider run failed` with the provider's useful message plus suggested Quiver commands.

### Documentation

Update repository docs and generated templates:

- `README.md` when the public onboarding flow needs a short mention;
- `README_FOR_AI.md` as source of truth;
- `ROADMAP.md`;
- `docs/CLI_UX_GUIDE.md`;
- `docs/reference/commands.md`;
- `docs/COMMANDS.md.template`;
- generated onboarding docs/templates if agent setup guidance is exposed to new projects.

Docs must explain:

- `model` vs `displayName`;
- known catalog vs account availability;
- interactive setup;
- no-TTY/script setup;
- `ai models list`;
- `ai agent doctor`;
- `ai agent repair --dry-run`;
- how to repair profiles from Quiver versions before this spec.

## Acceptance Criteria

### Interactive Setup

- Given a Quiver project, when `ai agent set planner` runs in a TTY without provider/model flags, then Quiver shows an interactive provider selector.
- Given the provider selector, when providers are listed, then Codex, Claude, and Gemini are shown with CLI install status.
- Given a selected provider, when the model selector opens, then Quiver shows models known by Quiver plus `custom`.
- Given a known model selection, when the profile is saved, then `model` contains the technical id and `displayName` contains the human label.
- Given an existing profile, when interactive setup starts, then Quiver shows the current profile and lets the user update, create, change default, or cancel.
- Given a canceled selector, then Quiver writes no files and reports configuration canceled.

### Non-Interactive Safety

- Given CI/no-TTY, when `ai agent set planner` lacks enough flags, then Quiver exits without hanging and prints explicit flag guidance.
- Given a scripted command with `--provider` and `--model`, then Quiver preserves non-interactive behavior.
- Given `--dry-run` and a known alias, then Quiver previews the normalized profile without writing.

### Catalog and Alias Behavior

- Given Codex, Claude, or Gemini, when models are listed, then the required catalog entries and `custom` are present.
- Given `GPT 5.5`, `gpt 5.5`, `Gpt-5.5`, or `gpt-5.5`, when the value is normalized for Codex, then the technical id resolves to `gpt-5.5`.
- Given an ambiguous alias, then Quiver does not choose automatically in non-interactive mode and requests explicit selection or a concrete model id.
- Given `custom`, then Quiver asks for technical id and display name, defaulting display name to the id.
- Given a catalog model that was not live-tested, then Quiver describes it as known by Quiver, not available.

### Live Validation

- Given a user chooses live validation, then Quiver warns that the test can consume tokens before provider execution.
- Given the validation returns output containing `ok`, then Quiver marks the profile as validation passed.
- Given validation fails or times out, then Quiver does not save a passing validation state and shows the relevant error.
- Given provider stderr includes secrets or sensitive-looking tokens, then Quiver redacts them before output or saved evidence.

### Doctor and Repair

- Given multiple profiles per role, `ai agent doctor` evaluates every profile and identifies the default.
- Given an unsupported provider, doctor marks it as `error`.
- Given a custom model not validated, doctor marks it as `warning`.
- Given a display alias stored in `model`, doctor reports the issue and suggests `ai agent repair --dry-run`.
- Given `ai agent repair --dry-run`, Quiver shows proposed before/after changes without modifying files.
- Given `ai agent repair` without `--dry-run`, Quiver does not write without explicit confirmation or `--yes`.

### AI Models List

- Given `ai models list`, output is grouped by provider and includes recommended roles.
- Given `ai models list --provider codex`, output only includes Codex catalog entries.
- Given `ai models list --json`, output is valid JSON without colors or prose and includes `catalogVersion` and `lastUpdated`.

### Shared Preflight and Provider Errors

- Given any live AI command receives `--model "GPT 5.5"`, Quiver normalizes or blocks with suggestion before invoking the provider.
- Given a profile with `model: "GPT 5.5"`, `ai prepare-context --with-planner` blocks before calling Codex and suggests `model: gpt-5.5`, `displayName: GPT 5.5`.
- Given the provider emits multiple errors and one is an invalid model, Quiver reports invalid model as the primary cause.
- Given dry-run for a provider/model, Quiver shows the real command that would execute.

### Documentation and Release Readiness

- Given the docs are read after implementation, they explain `model` vs `displayName`, known catalog limitations, setup flows, doctor, repair, and model listing.
- Given generated project templates are inspected, they include current agent setup guidance where appropriate.
- Given package readiness runs, tests cover catalog, aliases, selectors, no-TTY, JSON, doctor, repair, provider error extraction, and legacy profile compatibility.
- Given package dry-run runs, the catalog is included and local `.quiver/` state is not published.

## Non-Scope

- Remote API for dynamic model catalog updates.
- Qwen provider support before an adapter exists.
- Installing provider CLIs.
- Editing provider credentials.
- Guaranteeing account-level model access without a live validation.
- Publishing npm as part of implementation.

## Technical Plan

1. Create `src/create-quiver/lib/ai/model-catalog.js` as the single source of truth.
2. Add alias normalization and model resolution helpers.
3. Extend agent profile setup with interactive provider/model selection.
4. Preserve non-interactive/CI behavior and add no-TTY guardrails.
5. Add `ai agent doctor` and `ai agent repair --dry-run`.
6. Add shared model preflight for every live AI command.
7. Improve provider error extraction and actionable messages.
8. Add `ai models list` with human and JSON output.
9. Update docs, templates, and source-of-truth guidance.
10. Add tests, smokes, package dry-run, and final evidence.

## Risks

- Model catalogs can become stale.
- Provider CLIs can change model flags or behavior.
- Live validation can consume tokens.
- Some accounts can lack access to catalog models.
- Existing profiles may contain user-specific custom values.

## Rollback

Revert slice commits in reverse order. The current free-form `model` path must remain available through non-interactive flags and custom model support.
