# EXECUTION_BRIEF - slice-02 Live output renderer

## Context

Quiver already has shared UX helpers and a theme. The TUI-lite output should reuse that infrastructure instead of creating command-specific formatting.

## Objective

Create a reusable provider live output renderer with safe formatting, redaction, truncation, and fallbacks.

## Acceptance Criteria

- Human TTY verbose mode can render agent metadata, progress, provider output, elapsed time, and next step.
- JSON/no-TTY/CI modes remain clean.
- `--no-color`, `NO_COLOR`, `TERM=dumb`, and ASCII locales remain readable.
- Provider output display is redacted and truncated.
- Renderer does not require full-screen terminal control or new heavyweight dependencies.

## Completion Checklist

- [ ] Shared renderer added.
- [ ] Theme/fallback behavior covered.
- [ ] Redaction/truncation covered.
- [ ] Renderer tests added.
