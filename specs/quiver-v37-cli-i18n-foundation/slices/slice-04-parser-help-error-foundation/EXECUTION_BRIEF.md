# EXECUTION_BRIEF - slice-04 Parser, help, and early error foundation

## Context

Some messages are emitted before command handlers run. They must still respect the selected language.

## Objective

Route help text, parser errors, unsupported command errors, and global option errors through the i18n foundation.

## Acceptance Criteria

- `--help` uses the resolved language.
- Unknown command and unsupported flag errors use the resolved language.
- `--lang` errors work even when `--lang` appears before the command.
- `--json` errors keep stable machine fields.
- `--no-color`, CI, and no-TTY modes remain clean.

## Completion Checklist

- [ ] Parser-level i18n wiring added.
- [ ] Help output cataloged.
- [ ] Early error tests added for `en` and `es`.
- [ ] JSON/no-TTY tests updated.
