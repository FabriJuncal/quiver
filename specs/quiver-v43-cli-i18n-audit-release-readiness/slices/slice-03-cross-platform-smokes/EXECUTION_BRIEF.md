# EXECUTION_BRIEF - slice-03 Cross-platform smokes

## Context

Language resolution and config paths must work on macOS, Linux, Windows PowerShell, Git Bash/WSL, and paths with spaces.

## Objective

Run or document cross-platform smokes for the completed i18n program.

## Acceptance Criteria

- Smokes cover project config language without repeated flags.
- Smokes cover `--lang` and `QUIVER_LANG` overrides.
- Smokes cover paths with spaces.
- Windows PowerShell and Git Bash/WSL path behavior is covered by tests or documented manual evidence.
- JSON/JSONL outputs are parseable on all covered shells.

## Completion Checklist

- [ ] Smoke commands defined.
- [ ] Automated or manual evidence recorded.
- [ ] Platform gaps documented as blockers or accepted exceptions.
