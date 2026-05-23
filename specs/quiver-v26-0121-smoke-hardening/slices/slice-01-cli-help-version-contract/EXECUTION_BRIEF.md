# EXECUTION BRIEF - slice-01: CLI help and version contract

## Context

The npm smoke test showed that `npx create-quiver@0.12.0 --version` fails because the top-level parser treats `--version` as an option requiring a draft version. Help output also needs to become a stronger onboarding surface.

## Objective

Fix version/help behavior and add coverage that keeps command descriptions from drifting.

## Scope

- CLI entrypoint and command router.
- Help output and command descriptions.
- Command docs and tests.

## Acceptance Criteria

- `npx create-quiver --version` and `-V` print package version and exit `0`.
- `ai approve --phase technical-plan --version <n>` still uses draft version semantics.
- `--help`, `help`, and local `quiver --help` show grouped commands with descriptions.
- Help drift is covered by automated tests.

## Technical Plan Summary

Route top-level version flags before command-specific option parsing. Centralize or test the public command help surface. Preserve subcommand option ownership.

## Suggested Execution Steps

1. Read the CLI router and current help implementation.
2. Add top-level version handling only for commandless version requests.
3. Improve help output and command descriptions.
4. Add focused CLI tests.
5. Update docs and evidence.

## Restrictions

- Do not change AI phase state in this slice.
- Do not remove existing command aliases.

## Risks

- Over-broad `--version` handling could break planner draft approvals.

## Completion Checklist

- [ ] Version tests added.
- [ ] Help output tests added.
- [ ] AI approve version behavior preserved.
- [ ] Docs updated.

