# Quiver

Quiver is a CLI-first documentation workflow for projects that use specs, slices, and AI-assisted implementation.

It gives a project a repeatable structure for planning work, starting focused implementation slices, validating readiness, and keeping human and AI contributors aligned.

## Developer Onboarding Flow

Use this flow when adopting Quiver in an existing project or starting a new one.

### 1. Install Quiver

Run Quiver from the project where the workflow will live:

```bash
cd /path/to/your-project
npx create-quiver --name "Project Name"
```

Do not install Quiver globally. Running it with `npx` from the project root keeps the generated docs, specs, and scripts in the right repository.

If your team wants to pin the Quiver version in the project, install it as a devDependency:

```bash
npm install --save-dev create-quiver
npx create-quiver --name "Project Name"
```

To initialize a different directory from outside the project, pass `--dir` explicitly. Quote paths that contain spaces:

```bash
npx create-quiver --name "Project Name" --dir "/Users/me/My Project"
```

### 2. Analyze And Validate

Run the local analyzer and then validate the generated contract:

```bash
npx create-quiver analyze --dir ./target-repo
npx create-quiver doctor --dir ./target-repo
```

If you are working in the current directory, use `--dir .`.

The analyzer creates `docs/PROJECT_SCAN.json` and `docs/PROJECT_MAP.md`. These files give the AI agent a deterministic project map before it edits context docs.

The doctor checks the generated project contract and prints the next workflow steps. If the scan artifacts are missing, it recommends `npx create-quiver analyze --dir .` first.

### 3. Ask The AI To Prepare Context

Open your AI agent in the target project and run this short handoff:

```text
Read docs/AI_ONBOARDING_PROMPT.md and execute it.
Do not modify product code unless I explicitly authorize it.
Prepare the project context docs and report assumptions, risks, and files changed.
```

The AI should use the scan artifacts to prepare `docs/AI_CONTEXT.md`, `docs/CONTEXTO.md`, `docs/STATUS.md`, and the initial project spec. The developer should review those documentation changes before implementation work starts.

### 4. Start The First Slice

After the context docs are reviewed:

1. Define or refine `specs/<project-slug>/SPEC.md`.
2. Create the first slice from `specs/<project-slug>/slices/slice-template/slice.json`.
3. Start work with `tools/scripts/start-slice.sh <slice.json>`.
4. Make one commit per slice.
5. Open one PR per spec.

Slice numbering is local to each spec: every new spec starts at `slice-01`.

## Requirements

- Node.js and npm for the installer
- Git for slice branches, worktrees, and PR workflow checks
- macOS or Linux as the primary supported shell environment

See the generated `docs/SUPPORT_MATRIX.md` for the detailed support contract.

## What Gets Generated

Quiver generates a project-local workflow under:

- `docs/` for project context, workflow, support, troubleshooting, and AI guidance
- `docs/PROJECT_SCAN.json` and `docs/PROJECT_MAP.md` after `create-quiver analyze`
- `docs/AI_ONBOARDING_PROMPT.md` as the generated handoff prompt for the AI agent
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
For analyzed projects, the agent handoff prompt lives at `docs/AI_ONBOARDING_PROMPT.md` in the generated project.

## For AI Agents

Read `README_FOR_AI.md` before working in this repository or in a generated project. In generated projects, `docs/AI_CONTEXT.md` is the first agent context file to read, followed by `docs/AI_ONBOARDING_PROMPT.md`, `docs/CONTEXTO.md`, and `docs/WORKFLOW.md`.

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
- [AI context template](./docs/AI_CONTEXT.md.template)
- [Support matrix template](./docs/SUPPORT_MATRIX.md.template)
- [Troubleshooting template](./docs/TROUBLESHOOTING.md.template)
- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)

## License

MIT
