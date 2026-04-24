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

Run the local analyzer and then validate the generated contract from the project root:

```bash
npx create-quiver analyze
npx create-quiver doctor
```

If you need to target another directory from outside the project, pass `--dir` explicitly. For the current project root, omit it.

The analyzer creates `docs/PROJECT_SCAN.json` and `docs/PROJECT_MAP.md`. These files give the AI agent a deterministic project map before it edits context docs.

The doctor checks the generated project contract and prints the next workflow steps. If the scan artifacts are missing, it recommends `npx create-quiver analyze` first.

### Project NPM Scripts

Generated projects include `quiver:*` npm scripts that call the Node CLI and are the preferred repeatable workflow:

```bash
npm run quiver:analyze
npm run quiver:doctor
npm run quiver:migrate
npm run quiver:start-slice -- specs/<project-slug>/slices/slice-01/slice.json
npm run quiver:check-slice -- specs/<project-slug>/slices/slice-01/slice.json
npm run quiver:check-pr -- specs/<project-slug>/slices/slice-01/slice.json
npm run quiver:cleanup-slice -- specs/<project-slug>/slices/slice-01/slice.json
npm run quiver:check-scope -- specs/<project-slug>/slices/slice-01/slice.json
npm run quiver:refresh-active-slices
```

The legacy Bash wrappers remain in `tools/scripts/` for compatibility, but new project-level automation should prefer the `quiver:*` scripts and the direct `npx create-quiver ...` commands.
`npm run quiver:migrate` is only for projects that were already initialized by Quiver.

### 3. Upgrade Existing Projects

If the project already had Quiver from an older version, upgrade it from the project root:

```bash
cd /path/to/your-project
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
```

If the project never ran Quiver initialization before, do not use `migrate` as bootstrap. Run:

```bash
npx create-quiver --name "Project Name"
```

If your team prefers a pinned local dependency, update the package first and then run the same flow:

```bash
npm install --save-dev create-quiver@latest
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
```

### 4. Ask The AI To Prepare Context

Open your AI agent in the target project and run this short handoff:

```text
Read docs/AI_ONBOARDING_PROMPT.md and execute it.
Do not modify product code unless I explicitly authorize it.
Prepare the project context docs and report assumptions, risks, and files changed.
```

The AI should use the scan artifacts to prepare `docs/AI_CONTEXT.md`, `docs/CONTEXTO.md`, `docs/STATUS.md`, and the initial project spec. The developer should review those documentation changes before implementation work starts.

### 5. Start The First Slice

After the context docs are reviewed:

1. Define or refine `specs/<project-slug>/SPEC.md`.
2. Create the first slice from `specs/<project-slug>/slices/slice-template/slice.json`.
3. Start work with `npx create-quiver start-slice <slice.json>` or `npm run quiver:start-slice -- <slice.json>`.
4. Make one commit per slice.
5. Open one PR per spec.

Slice numbering is local to each spec: every new spec starts at `slice-01`.

## Requirements

- Node.js and npm for the installer
- Git for slice branches, worktrees, and PR workflow checks
- macOS, Linux, and Windows PowerShell/CMD are the target developer environments for the cross-platform runtime work

Windows native support is verified only when the cross-platform CI matrix is green. Bash remains a legacy compatibility path until the runtime slices land.

See the generated `docs/SUPPORT_MATRIX.md` for the detailed support contract.

## Cross-Platform Support

Quiver is targeting native support on macOS, Linux, and Windows PowerShell/CMD. Bash is a legacy compatibility path until the runtime slices land, so the long-term contract is a Node-first workflow rather than a Bash-first one. The CI matrix must be green before Windows is considered fully verified.

## What Gets Generated

Quiver generates a project-local workflow under:

- `docs/` for project context, workflow, support, troubleshooting, and AI guidance
- `docs/PROJECT_SCAN.json` and `docs/PROJECT_MAP.md` after `create-quiver analyze`
- `docs/AI_ONBOARDING_PROMPT.md` as the generated handoff prompt for the AI agent
- `specs/<project-slug>/HANDOFF.md` as the exceptional transfer artifact between agents or phases
- `npx create-quiver new-handoff <spec-slug>` to scaffold an optional handoff artifact when work needs to move between agents or phases
- `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md` to validate a transferred handoff before execution
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
For analyzed projects, the agent handoff prompt lives at `docs/AI_ONBOARDING_PROMPT.md` in the generated project. If a bounded transfer between agents or phases is needed, scaffold `specs/<project-slug>/HANDOFF.md` with `npx create-quiver new-handoff <spec-slug>` and validate it with `npx create-quiver check-handoff specs/<project-slug>/HANDOFF.md`.

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
