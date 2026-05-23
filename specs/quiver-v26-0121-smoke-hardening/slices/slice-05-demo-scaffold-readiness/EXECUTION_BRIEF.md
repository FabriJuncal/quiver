# EXECUTION BRIEF - slice-05: Demo scaffold readiness

## Context

The optional `spec-viewer` demo generated and validated, but `doctor` inside the demo reported that it was not initialized by Quiver. The demo server also failed with `EADDRINUSE` when port `4173` was already in use.

## Objective

Make the demo scaffold coherent with Quiver diagnostics and easier to run cross-platform.

## Scope

- `demo create spec-viewer`.
- Demo metadata and README.
- Demo server port behavior.
- Doctor behavior for demo scaffold.
- Demo tests/smoke.

## Acceptance Criteria

- Demo generation succeeds.
- Demo validation succeeds.
- Doctor inside demo is clear and not misleading.
- Occupied port behavior is actionable or auto-recovers.
- Generated Quiver demo scripts still work.

## Technical Plan Summary

Decide whether the demo should include minimal Quiver metadata or whether doctor should detect demo scaffolds explicitly. Improve server port handling and README instructions.

## Suggested Execution Steps

1. Generate demo in a temp folder.
2. Run validate, doctor, plan, graph, next, and start.
3. Fix demo metadata/doctor handling.
4. Improve port fallback or docs.
5. Add tests/smoke.

## Restrictions

- Keep demo small and dependency-light.
- Do not add backend, auth, database, or external assets.

## Risks

- If demo includes `.quiver` metadata, it must not imply a full initialized project unless that is true.

## Completion Checklist

- [ ] Demo validates.
- [ ] Doctor output is clear.
- [ ] Port behavior verified.
- [ ] Demo scripts verified.

