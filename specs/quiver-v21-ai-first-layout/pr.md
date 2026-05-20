# Quiver v21 - AI-First Layout

## Summary

Redesign Quiver's generated project layout so the default init is small, visible, and AI-first while internal machinery moves under `.quiver/`.

## Scope

- Add init profiles and `init --dry-run`.
- Move internal templates, state, scans, and runtime folders under `.quiver/`.
- Stop generating `docs-template/`, `tools/scripts/`, and placeholder specs by default.
- Preserve full/legacy behavior behind explicit flags.
- Keep `docs/PROJECT_MAP.md` visible while moving raw scan output to `.quiver/scans/PROJECT_SCAN.json`.
- Update doctor, no-spec command behavior, documentation, and smokes.

## Validation

Pending implementation.

## Risks

- Compatibility with existing projects using legacy generated paths.
- Documentation drift across root README, generated README, and AI guide.
- Commands assuming placeholder specs exist.
- Scan relocation affecting AI onboarding.
