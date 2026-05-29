# EXECUTION_BRIEF - slice-01 Init interactive language

## Context

The best UX is choosing language once during setup and reusing it automatically.

## Objective

Add language selection to `init --interactive` and persist it to project config.

## Acceptance Criteria

- `init --interactive` prompts for `en` or `es` when no language is configured.
- Existing project language is shown and can be kept or changed.
- Selection writes `.quiver/config.json` without removing existing keys.
- Non-interactive init accepts existing config and never prompts.
- Dry-run shows intended language write without writing.

## Completion Checklist

- [ ] Interactive selector added.
- [ ] Config persistence tested.
- [ ] Dry-run and no-TTY behavior tested.
