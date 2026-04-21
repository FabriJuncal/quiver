# Quiver

Quiver is a CLI-first documentation workflow for projects that use specs, slices, and AI-assisted implementation.

It gives a project a repeatable structure for planning work, starting focused implementation slices, validating readiness, and keeping human and AI contributors aligned.

## Quick Start

Create or update a project with the installer:

```bash
npx create-quiver --name "Project Name" --dir ./target-repo
```

To install into the current directory, omit `--dir`:

```bash
npx create-quiver --name "Project Name"
```

## Requirements

- Node.js and npm for the installer
- Git for slice branches, worktrees, and PR workflow checks
- macOS or Linux as the primary supported shell environment

See the generated `docs/SUPPORT_MATRIX.md` for the detailed support contract.

## Validate

After installation, run the doctor:

```bash
npx create-quiver doctor --dir ./target-repo
```

The doctor checks the generated project contract and prints the next workflow steps.

## First Slice Workflow

After the scaffold is valid:

1. Fill in `docs/CONTEXTO.md` and `docs/STATUS.md`.
2. Define the project spec in `specs/<project-slug>/SPEC.md`.
3. Create the first slice from `specs/<project-slug>/slices/slice-template/slice.json`.
4. Start work with `tools/scripts/start-slice.sh <slice.json>`.
5. Make one commit per slice.
6. Open one PR per spec.

Slice numbering is local to each spec: every new spec starts at `slice-01`.

## What Gets Generated

Quiver generates a project-local workflow under:

- `docs/` for project context, workflow, support, troubleshooting, and AI guidance
- `specs/<project-slug>/` for the project spec, status, evidence, and slice contracts
- `tools/scripts/` for slice lifecycle and readiness gates
- `.github/` for default PR, issue, and CI templates
- `package.json` scripts for the workflow commands

For the detailed support contract, read `docs/SUPPORT_MATRIX.md` in the generated project. For recovery paths, read `docs/TROUBLESHOOTING.md`.

## Manual Template Use

Use the manual flow only when developing Quiver locally or testing a template checkout. From a target project where this repository was copied as `docs-template/`, run:

```bash
./docs-template/scripts/init-docs.sh "Project Name"
```

The CLI path is the supported adoption path for users.

## For AI Agents

Read `README_FOR_AI.md` before working in this repository or in a generated project. It explains the generic template boundary, the generated project boundary, and the slice workflow rules.

## For Maintainers

Release preflight:

```bash
npm whoami
npm view create-quiver version
npm run package:quiver
npm run smoke:create-quiver
npm run release:quiver
```

Current-version publish:

```bash
bash scripts/release-quiver.sh --publish-current
```

Versioned publish:

```bash
bash scripts/release-quiver.sh patch --publish
```

The release helper stays explicit on purpose: `--publish-current` publishes the current version, and `--publish` follows a normal version bump flow.

If `npm whoami` or `npm view create-quiver version` fails, fix npm auth or registry reachability before publishing.

For a first release, prefer `--publish-current` so the published package stays at `0.4.0`.

## References

- [AI guide](./README_FOR_AI.md)
- [Support matrix template](./docs/SUPPORT_MATRIX.md.template)
- [Troubleshooting template](./docs/TROUBLESHOOTING.md.template)
- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)

## License

MIT
