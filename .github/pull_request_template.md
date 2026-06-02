# PR Template

Please fill in the slice `pr.md` and keep this PR aligned with it.

## PR Policy

- [ ] This PR contains one slice only.
- [ ] Grouped PR exception: this PR contains at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [ ] This PR does not mix docs with UI, backend, refactor, or performance work.
- [ ] Each included slice has separate evidence.
- [ ] The whole PR can be reverted without leaving partial state.

Individual PRs are mandatory for functional code, UI/UX, Supabase, Edge Functions, auth, storage, preview, performance/code-splitting, refactors, and tests or CI changes that affect gates.

## Merge Policy

- [ ] Human merge is expected.
- [ ] Assisted auto-merge is explicitly authorized for this PR or for this documented category.
- [ ] Assisted auto-merge conditions are met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is prohibited for UI, Supabase, Edge Functions, auth, storage, preview, performance, refactors, and changes with doubtful rollback.
