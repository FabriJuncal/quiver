# A05 independent code review

Disposition: APPROVED. Reviewer: root coordinator, not the implementation author.
Only material code risks and their modified parts were reviewed; no optional
hardening or additional specification review was required.

| Finding | Reproduced problem | Resolution and verification |
|---|---|---|
| ROOT-A05-01 | A checksum-valid unrelated README could authorize an arbitrary verified-fact claim. Matching generic claim JSON also remained self-assertion. | Facts now bind an exact mechanically observed source SHA-256; local v58 decisions bind the actual approved artifact. Unrelated and self-authored claim fixtures fail without writes; positive observed facts pass. |
| ROOT-A05-02 | A symlinked records directory caused an outside write and manifest advancement before UNSAFE_PATH was returned. | Canonical directories/files are checked before writes and again under the lock; inherited writer-mode guards cover mutations. Tests assert outside storage, manifest and journal remain unchanged on rejected paths. |

The coordinator independently ran the initial corrected core (14/14), final core
including added X03 vectors (18/18), standalone full CI (963/963), and combined
A01+A05 CI (977/977); all passed with no skips. The author also verified direct
init consumers (24/24) and the required Brain/init combination (43/43). Exact
commands, durations and outputs are linked from EVIDENCE_REPORT.md.

X03 vectors cover current receipt/replay, authorization refresh, revocation,
missing resolver, foreign project, altered knowledge and forged actor evidence.
They are explicit fixture evidence, not live Cloud approval or customer proof.
The migration simulation correction preserves the validated existing Brain
instead of repeatedly planning a new store. No original test assertion was removed.

All five A05 production SHA-256 fingerprints matched before and after rebasing
onto committed A01; no merge conflict or production edit was introduced by that
integration. Remaining export/context/facade work is not claimed complete here.

Coordinator pre-commit checks passed: declared scope for 21 changed/new files,
local slice gate, strict 13-slice spec validation, repository docs checks,
explicit lint for 44 A Markdown files, and staged whitespace validation. A staged
documentation whitespace error was corrected before rebasing or committing.
A bounded credential-pattern scan found no candidate matches in this change;
the untracked dependency symlink was not staged. This does not claim exhaustive
secret-detection coverage.
