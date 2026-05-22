const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  buildQuiverConfig,
  buildQuiverInternalGitignore,
  quiverInternalPaths,
  resolveInitPackageScripts,
} = require('./init-layout');
const { writeState } = require('./state');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toProjectSlug(projectName) {
  return projectName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiver-project';
}

function detectPackageManager(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (typeof packageJson.packageManager === 'string' && packageJson.packageManager.length > 0) {
      return packageJson.packageManager.split('@')[0];
    }
  }

  const candidates = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['npm', 'package-lock.json'],
  ];

  for (const [manager, lockFile] of candidates) {
    if (fs.existsSync(path.join(projectRoot, lockFile))) {
      return manager;
    }
  }

  return 'npm';
}

function renderTemplate(text, replacements) {
  return text
    .replace(/{{PROJECT_NAME}}/g, replacements.projectName)
    .replace(/{{PROJECT_SLUG}}/g, replacements.projectSlug)
    .replace(/\[project\]/g, replacements.projectSlug)
    .replace(/\[project-name\]/g, replacements.projectSlug)
    .replace(/\[project-slug\]/g, replacements.projectSlug)
    .replace(/{{FECHA}}/g, replacements.currentDate)
    .replace(/{{FECHA_PROXIMA}}/g, replacements.datePlus7)
    .replace(/{{FECHA_PROXIMA_MES}}/g, replacements.datePlus30)
    .replace(/{{FECHA_LAUNCH}}/g, replacements.datePlus35)
    .replace(/{{ESTADO}}/g, 'En planificación')
    .replace(/{{FASE}}/g, 'Fase 1')
    .replace(/{{X}}%/g, '0%')
    .replace(/{{PACKAGE_MANAGER}}/g, replacements.packageManager || 'npm')
    .replace(/{{STACK_SUMMARY}}/g, replacements.stackSummary || 'unknown until analyze')
    .replace(/{{PRIMARY_INSTALL}}/g, replacements.primaryInstall || 'npm install')
    .replace(/{{PRIMARY_DEV}}/g, replacements.primaryDev || 'not defined')
    .replace(/{{PRIMARY_TEST}}/g, replacements.primaryTest || 'not defined')
    .replace(/{{ANALYZE_COMMAND}}/g, replacements.analyzeCommand || 'npx create-quiver analyze')
    .replace(/{{PLAN_COMMAND}}/g, replacements.planCommand || 'npx create-quiver plan')
    .replace(/{{GRAPH_COMMAND}}/g, replacements.graphCommand || 'npx create-quiver graph')
    .replace(/{{NEXT_COMMAND}}/g, replacements.nextCommand || 'npx create-quiver next')
    .replace(/{{DOCTOR_COMMAND}}/g, replacements.doctorCommand || 'npx create-quiver doctor')
    .replace(/{{START_SLICE_COMMAND}}/g, replacements.startSliceCommand || 'npx create-quiver start-slice <slice.json>')
    .replace(/{{CHECK_SLICE_COMMAND}}/g, replacements.checkSliceCommand || 'npx create-quiver check-slice <slice.json>')
    .replace(/{{CHECK_PR_COMMAND}}/g, replacements.checkPrCommand || 'npx create-quiver check-pr <slice.json>')
    .replace(/{{CLEANUP_SLICE_COMMAND}}/g, replacements.cleanupSliceCommand || 'npx create-quiver cleanup-slice <slice.json>')
    .replace(/{{CHECK_SCOPE_COMMAND}}/g, replacements.checkScopeCommand || 'npx create-quiver check-scope <slice.json>')
    .replace(/{{REFRESH_ACTIVE_SLICES_COMMAND}}/g, replacements.refreshActiveSlicesCommand || 'npx create-quiver refresh-active-slices');
}

function copyRenderedFile(sourcePath, destinationPath, replacements, skipIfExists, frontMatterFactory) {
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const renderedText = renderTemplate(sourceText, replacements);

  if (skipIfExists && fs.existsSync(destinationPath)) {
    if (typeof frontMatterFactory === 'function') {
      const existingText = fs.readFileSync(destinationPath, 'utf8');
      const body = stripFrontMatter(existingText);
      writeFrontMatter(destinationPath, frontMatterFactory({
        body,
        existingText,
        renderedText,
        replacements,
        destinationPath,
      }));
      return 'frontmatter-updated';
    }

    return 'skipped';
  }

  ensureDir(path.dirname(destinationPath));
  fs.writeFileSync(destinationPath, renderedText);

  if (typeof frontMatterFactory === 'function') {
    writeFrontMatter(destinationPath, frontMatterFactory({
      body: renderedText,
      existingText: null,
      renderedText,
      replacements,
      destinationPath,
    }));
    return 'created-with-frontmatter';
  }

  return 'created';
}

function copyBinaryFile(sourcePath, destinationPath, skipIfExists) {
  if (skipIfExists && fs.existsSync(destinationPath)) {
    return 'skipped';
  }

  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);

  try {
    const mode = fs.statSync(sourcePath).mode & 0o777;
    fs.chmodSync(destinationPath, mode);
  } catch {
    // Best effort. Windows and some filesystems may not honor POSIX modes.
  }

  return 'created';
}

function copyIfSourceExists(sourcePath, destinationPath, skipIfExists) {
  if (!fs.existsSync(sourcePath)) {
    return 'missing';
  }

  return copyBinaryFile(sourcePath, destinationPath, skipIfExists);
}

function stripFrontMatter(text) {
  if (!text.startsWith('---\n')) {
    return text;
  }

  const closing = text.indexOf('\n---\n', 4);
  if (closing === -1) {
    return text;
  }

  return text.slice(closing + 5).replace(/^\n+/, '');
}

function estimateTokenCost(text) {
  return Math.max(1, Math.ceil(Buffer.byteLength(text, 'utf8') / 4));
}

function serializeFrontMatterValue(value) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(String(value));
}

function serializeFrontMatter(fields) {
  return [
    '---',
    `purpose: ${serializeFrontMatterValue(fields.purpose)}`,
    `applies_when: ${serializeFrontMatterValue(fields.applies_when)}`,
    `token_cost: ${serializeFrontMatterValue(fields.token_cost)}`,
    `last_updated: ${serializeFrontMatterValue(fields.last_updated)}`,
    `supersedes: ${serializeFrontMatterValue(fields.supersedes)}`,
    '---',
  ].join('\n');
}

function buildFrontMatterFields({ purpose, appliesWhen, body, currentDate, supersedes = null }) {
  return {
    purpose,
    applies_when: appliesWhen,
    token_cost: estimateTokenCost(body),
    last_updated: currentDate,
    supersedes,
  };
}

function writeFrontMatter(filePath, fields) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const body = stripFrontMatter(existing);
  const frontMatter = serializeFrontMatter(fields);
  const nextContent = body.length > 0 ? `${frontMatter}\n\n${body.replace(/\s+$/, '')}\n` : `${frontMatter}\n`;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, nextContent);
  return nextContent;
}

const ROOT_GITIGNORE_DEFAULTS = [
  'node_modules/',
  '.DS_Store',
  'dist/',
  'coverage/',
];

function normalizeGitignorePattern(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return trimmed;
  }

  return trimmed.replace(/\/+$/g, '');
}

function mergeLineList(existingText, defaults) {
  const existingLines = existingText
    .split(/\r?\n/)
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1);
  const seen = new Set(existingLines.map(normalizeGitignorePattern).filter(Boolean));
  const nextLines = [...existingLines];

  for (const line of defaults) {
    const normalized = normalizeGitignorePattern(line);
    if (!seen.has(normalized)) {
      nextLines.push(line);
      seen.add(normalized);
    }
  }

  return `${nextLines.join('\n').replace(/\s+$/g, '')}\n`;
}

function mergeRootGitignore(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const exists = fs.existsSync(gitignorePath);
  const existingText = exists
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';

  ensureDir(path.dirname(gitignorePath));
  fs.writeFileSync(gitignorePath, mergeLineList(existingText, ROOT_GITIGNORE_DEFAULTS));
  return exists ? 'merged' : 'created';
}

function resolvePackageName(projectRoot, options = {}) {
  return options.projectSlug
    || toProjectSlug(options.projectName || path.basename(projectRoot) || 'Quiver Project');
}

function mergePackageJson(projectRoot, templateRoot, options = {}) {
  const packageTemplate = path.join(templateRoot, 'package.template.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageTemplate)) {
    return 'missing';
  }

  const profile = options.profile || 'default';
  const scripts = resolveInitPackageScripts(profile, { legacyScripts: options.legacyScripts === true });

  if (!fs.existsSync(packageJsonPath)) {
    const template = JSON.parse(fs.readFileSync(packageTemplate, 'utf8'));
    template.name = resolvePackageName(projectRoot, options);
    template.scripts = scripts;
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(template, null, 2)}\n`);
    return 'created';
  }

  const existing = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (typeof existing.name !== 'string' || existing.name.trim().length === 0) {
    existing.name = resolvePackageName(projectRoot, options);
  }

  existing.scripts = {
    ...(existing.scripts || {}),
    ...scripts,
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(existing, null, 2)}\n`);
  return options.migrateMode ? 'merged' : 'updated';
}

function buildReadme(projectName, projectSlug, profile = 'default') {
  if (profile === 'minimal') {
    return `# ${projectName}

[Descripción breve del proyecto]

## Quick Start

Run Quiver from this project root. Do not install it globally.

\`\`\`bash
npm install
npx create-quiver analyze
npx create-quiver plan
npx create-quiver graph
npx create-quiver doctor
npx create-quiver next
\`\`\`

## AI Workflow

Use \`AGENTS.md\` first, then \`docs/AI_CONTEXT.md\` and \`docs/AI_ONBOARDING_PROMPT.md\` for the working contract.

\`\`\`bash
npm run quiver:prepare -- --dry-run
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:inspect
npm run quiver:ai:export -- --format json
npm run quiver:ai:specs
npm run quiver:ai:slices
npm run quiver:ai:trace
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:revise -- --phase acceptance --input feedback.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --version <n>
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
\`\`\`

When a real spec exists, execute one approved slice at a time:

\`\`\`bash
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run --commit
npm run quiver:ai:execute-plan -- --dry-run --commit --mode delegated
\`\`\`

## Documentation

- [AI Context](./docs/AI_CONTEXT.md)
- [AI Onboarding Prompt](./docs/AI_ONBOARDING_PROMPT.md)
- [Commands](./docs/COMMANDS.md)
- [Workflow](./docs/WORKFLOW.md)
`;
  }

  if (profile !== 'full') {
    return `# ${projectName}

[Descripción breve del proyecto]

## Quick Start

Run Quiver from this project root. Do not install it globally.

\`\`\`bash
npm install
npx create-quiver analyze
npx create-quiver plan
npx create-quiver graph
npx create-quiver doctor
npx create-quiver next
\`\`\`

After \`analyze\`, use \`docs/PROJECT_MAP.md\` for the detected stack, package manager, and command surface.

## AI-First Workflow

Quiver keeps the visible contract small: start with \`README.md\`, \`AGENTS.md\`, and \`docs/\`. Specs and slices should be created only after a real requirement and a reviewed, approved technical plan.

Use dry-runs before spending model tokens:

\`\`\`bash
npm run quiver:prepare -- --dry-run
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:revise -- --phase acceptance --input feedback.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --version <n>
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
\`\`\`

When a real spec exists, execute one approved slice at a time:

\`\`\`bash
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run --commit
npm run quiver:ai:execute-plan -- --dry-run --commit --mode delegated
\`\`\`

## Project NPM Scripts

The generated project includes \`quiver:*\` npm scripts that call the Node CLI:

\`\`\`bash
npm run quiver:analyze
npm run quiver:prepare -- --dry-run
npm run quiver:plan
npm run quiver:graph
npm run quiver:next
npm run quiver:doctor
npm run quiver:ai:inspect
npm run quiver:ai:export -- --format json
npm run quiver:ai:export -- --format markdown
npm run quiver:ai:specs
npm run quiver:ai:slices
npm run quiver:ai:trace
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:revise -- --phase acceptance --input feedback.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --version <n>
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run --commit
npm run quiver:ai:execute-plan -- --dry-run --commit --mode delegated
npm run quiver:ai:pr -- --dry-run --input specs/<spec-slug>/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npm run quiver:spec:start -- specs/<spec-slug>
npm run quiver:spec:status -- specs/<spec-slug>
npm run quiver:spec:close -- specs/<spec-slug> --dry-run
\`\`\`

## Documentation

- [Agents](./AGENTS.md)
- [AI Context](./docs/AI_CONTEXT.md)
- [AI Onboarding Prompt](./docs/AI_ONBOARDING_PROMPT.md)
- [Commands](./docs/COMMANDS.md)
- [Workflow](./docs/WORKFLOW.md)
- [GitFlow PR Guide](./docs/GITFLOW_PR_GUIDE.md)
- [Support Matrix](./docs/SUPPORT_MATRIX.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
`;
  }

  return `# ${projectName}

[Descripción breve del proyecto]

## Quick Start

  Run Quiver from this project root. Do not install it globally.

\`\`\`bash
npm install
{{ANALYZE_COMMAND}}
{{PLAN_COMMAND}}
{{GRAPH_COMMAND}}
{{DOCTOR_COMMAND}}
{{NEXT_COMMAND}}
\`\`\`

Exportable graph formats are available when you need a PR-ready Mermaid block or Graphviz source:

\`\`\`bash
{{GRAPH_COMMAND}} --format mermaid
{{GRAPH_COMMAND}} --format dot
\`\`\`

If this project needs a pinned Quiver version, install it as a devDependency:

\`\`\`bash
npm install --save-dev create-quiver
\`\`\`

If you need to target another directory from outside the project, pass \`--dir\` explicitly. Quote paths that contain spaces.

After you run \`analyze\`, open \`docs/PROJECT_MAP.md\` for the detected stack, package manager, and command surface.

## AI-First Workflow

Quiver is designed for an AI-first workflow: a planner agent reads the project context and prepares acceptance criteria, technical plans, specs, slices, and PR notes; executor agents then work one approved slice at a time with minimal context.

Start with dry-runs so you can inspect the provider, role, context pack, and invocation before spending model tokens:

\`\`\`bash
npm run quiver:prepare -- --dry-run
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:revise -- --phase acceptance --input feedback.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --version <n>
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
npm run quiver:spec:start -- specs/${projectSlug}
npm run quiver:ai:prompt-slice -- --slice specs/${projectSlug}/slices/slice-01/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/${projectSlug}/slices/slice-01/slice.json --dry-run --commit
npm run quiver:ai:execute-plan -- --dry-run --commit --mode delegated
npm run quiver:ai:pr -- --dry-run --input specs/${projectSlug}/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
\`\`\`

Remove \`--dry-run\` only after the phase output is approved and the local provider CLI is ready.

## Project NPM Scripts

The generated project includes \`quiver:*\` npm scripts that call the Node CLI and are the preferred repeatable workflow:

\`\`\`bash
npm run quiver:analyze
npm run quiver:prepare -- --dry-run
npm run quiver:plan
npm run quiver:graph
npm run quiver:next
npm run quiver:doctor
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:revise -- --phase acceptance --input feedback.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --version <n>
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
npm run quiver:ai:prompt-slice -- --slice specs/${projectSlug}/slices/slice-01/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/${projectSlug}/slices/slice-01/slice.json --dry-run --commit
npm run quiver:ai:execute-plan -- --dry-run --commit --mode delegated
npm run quiver:ai:doctor -- --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npm run quiver:ai:pr -- --dry-run --input specs/${projectSlug}/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npm run quiver:spec:start -- specs/${projectSlug}
npm run quiver:spec:status -- specs/${projectSlug}
npm run quiver:spec:close -- specs/${projectSlug} --dry-run
npm run quiver:migrate
npm run quiver:start-slice -- specs/${projectSlug}/slices/slice-01/slice.json
npm run quiver:check-slice -- specs/${projectSlug}/slices/slice-01/slice.json
npm run quiver:check-pr -- specs/${projectSlug}/slices/slice-01/slice.json
npm run quiver:check-handoff -- specs/${projectSlug}/HANDOFF.md
npm run quiver:cleanup-slice -- specs/${projectSlug}/slices/slice-01/slice.json
npm run quiver:check-scope -- specs/${projectSlug}/slices/slice-01/slice.json
npm run quiver:refresh-active-slices
\`\`\`

The \`quiver:graph\` script prints the tree view by default; use \`npx create-quiver graph --format mermaid\` for PR-ready Markdown and \`--format dot\` when you want Graphviz source.
The \`quiver:next\` script points to the next ready slice and can auto-start it behind a confirmation prompt.
The \`quiver:ai:*\` scripts standardize planner/executor AI flows. Use dry-run first: onboarding and planning dry-runs do not require provider auth, \`quiver:ai:execute-plan -- --dry-run --commit --mode manual\` prints manual prompts, \`--mode delegated\` prints safe waves, \`quiver:ai:inspect\` shows lifecycle state, \`quiver:ai:export -- --format json|markdown\` emits dashboard/agent-friendly state, and \`quiver:ai:pr -- --dry-run\` validates \`gh\`, GitFlow docs, branch/worktree state, SSH inputs, and \`pr.md\` without creating a PR. Add \`--create\` only after reviewing the plan.
Use \`quiver:spec:create\`, \`quiver:spec:start\`, \`quiver:spec:status\`, and \`quiver:spec:close\` for one spec generation and worktree per spec.
Use \`npx create-quiver next --all-ready\` when you want the full ready level instead of a single suggestion.
The legacy Bash wrappers remain in \`tools/scripts/\` for compatibility, but new project-level automation should prefer the \`quiver:*\` scripts and the direct \`npx create-quiver ...\` commands below.
\`npm run quiver:migrate\` is only for projects that were already initialized by Quiver.
\`npm run check-handoff -- specs/${projectSlug}/HANDOFF.md\` is available as a legacy-friendly alias for the handoff validator.
If a new bounded transfer is needed, scaffold \`specs/${projectSlug}/HANDOFF.md\` with \`npx create-quiver new-handoff ${projectSlug}\` and validate it with \`npx create-quiver check-handoff specs/${projectSlug}/HANDOFF.md\`.
For exceptional context transfers between agents or phases, a dedicated \`HANDOFF.md\` can live alongside the usual spec and docs files.

## Cross-Platform Support

Quiver is targeting native support on macOS, Linux, and Windows PowerShell/CMD. Bash is a legacy compatibility path until the runtime slices land, so the generated workflow should be read as a native Node-first contract rather than a Bash-first one. Windows support is only considered verified once the CI matrix is green.

## Upgrading Existing Projects

If the project already existed before this Quiver version, upgrade it from the project root:

\`\`\`bash
cd /path/to/your-project
npx create-quiver migrate
{{ANALYZE_COMMAND}}
{{PLAN_COMMAND}}
{{GRAPH_COMMAND}}
{{NEXT_COMMAND}}
{{DOCTOR_COMMAND}}
\`\`\`

Use \`{{GRAPH_COMMAND}} --format mermaid\` for GitHub-friendly graph embeds or \`{{GRAPH_COMMAND}} --format dot\` for Graphviz pipelines.

If the project never ran Quiver initialization before, do not use \`migrate\` as bootstrap. Run:

\`\`\`bash
npx create-quiver init --name "Project Name"
\`\`\`

If your team prefers a pinned local dependency, update the package first and then run the same flow:

\`\`\`bash
npm install --save-dev create-quiver@latest
npx create-quiver migrate
{{ANALYZE_COMMAND}}
{{PLAN_COMMAND}}
{{GRAPH_COMMAND}}
{{NEXT_COMMAND}}
{{DOCTOR_COMMAND}}
\`\`\`

The tree output remains the default, but Mermaid and DOT are available on demand for exported docs and slide decks.

## AI Context Onboarding

Read \`AGENTS.md\` first, then open \`docs/AI_ONBOARDING_PROMPT.md\` after analysis.

After analysis and doctor validation, open your AI agent in this project and run:

\`\`\`text
Lee \`docs/AI_ONBOARDING_PROMPT.md\` y ejecútalo como fuente principal de verdad para incorporarte a este repositorio.

Actúa como asistente de onboarding de IA. Prepara el contexto del proyecto para trabajar de forma segura con el workflow documentado, specs y slices.

Usa el rol planner para onboarding, criterios de aceptación, plan técnico y generación de specs/slices. Usa el rol executor solo cuando exista un slice aprobado y debas ejecutar su handoff con contexto mínimo.

No modifiques código de producto salvo autorización explícita. Puedes crear o actualizar documentación de contexto si el onboarding lo requiere.

Usa solo la documentación del repositorio como fuente de verdad. Si encuentras información faltante, ambigua o contradictoria, documenta el supuesto, el riesgo y continúa por el camino más seguro.

Responde en español y finaliza con un reporte breve de archivos leídos, archivos modificados, estado del código de producto, supuestos, riesgos y próximos pasos.
\`\`\`

Review the AI changes to docs/AI_CONTEXT.md, docs/CONTEXTO.md, docs/STATUS.md, and specs/${projectSlug}/SPEC.md before starting implementation work. Use \`docs/PROJECT_MAP.md\` for stack and command details.
If the work was explicitly transferred through a handoff artifact, read \`specs/${projectSlug}/HANDOFF.md\` before implementation.

## Decision Log

Record durable decisions in \`docs/DECISIONS.md\` so future AI agents do not re-litigate the same choices.

## First Slice Workflow

Use this section only for projects generated with the full compatibility layout. In the default AI-first layout, create real specs and slices with \`npx create-quiver spec create\` after acceptance criteria are approved and the technical plan is reviewed and approved.

1. Review or refine specs/${projectSlug}/SPEC.md.
2. Create the first slice from specs/${projectSlug}/slices/slice-template/slice.json.
3. Review the plan with \`{{PLAN_COMMAND}}\` or \`npm run quiver:plan\`.
4. Inspect parallel lots with \`{{GRAPH_COMMAND}}\` or \`npm run quiver:graph\`.
5. Check the next ready slice with \`{{NEXT_COMMAND}}\` or \`npm run quiver:next\`.
6. Start work with \`{{START_SLICE_COMMAND}}\` or \`npm run quiver:start-slice -- <slice.json>\`.
7. Make one commit per slice.
8. Open one PR per spec.

## Verification Checklist

- [ ] npm install completes
- [ ] {{ANALYZE_COMMAND}} completes
- [ ] {{PLAN_COMMAND}} completes
- [ ] {{GRAPH_COMMAND}} completes
- [ ] {{NEXT_COMMAND}} completes
- [ ] {{DOCTOR_COMMAND}} completes
- [ ] AI agent executed docs/AI_ONBOARDING_PROMPT.md
- [ ] Context docs were reviewed before the first slice

## Documentation

- [AI Context](./docs/AI_CONTEXT.md) - Contexto resumido para IA
- [Decision Log](./docs/DECISIONS.md) - Decisiones durables del proyecto
- [AI Onboarding Prompt](./docs/AI_ONBOARDING_PROMPT.md) - Handoff exacto para agentes después del análisis
- [Handoff](./specs/${projectSlug}/HANDOFF.md) - Transferencia excepcional entre agentes o fases
- [Check Handoff](./docs/WORKFLOW.md) - Valida el handoff con \`npx create-quiver check-handoff\`
- [Commands](./docs/COMMANDS.md) - Tabla canónica de comandos de orquestación
- [Contexto](./docs/CONTEXTO.md) - Qué es ${projectName}
- [Workflow](./docs/WORKFLOW.md) - Cómo implementar
- [Support Matrix](./docs/SUPPORT_MATRIX.md) - Qué entornos están soportados
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Cómo recuperarse de fallos comunes
- [Status](./docs/STATUS.md) - Estado del proyecto
- [API Docs](./docs/api/) - Endpoint documentation (si aplica)
`;
}

function buildFullProfileIndexAppendix(projectSlug) {
  return `## Full Profile Extras

- **Multi-agent workflow** - \`./MULTI_AGENT_WORKFLOW.md\`
- **Quick AI context** - \`./ai/QUICK.md\`
- **Standard AI context** - \`./ai/STANDARD.md\`
- **Deep AI context** - \`./ai/DEEP.md\`
- **Spec starter assets** - \`../specs/${projectSlug}/\`
- **Tool notes** - \`./tools/\`
- **Archive** - \`./archive/\`
`;
}

function initializeProjectDocs(options) {
  const {
    projectRoot,
    projectName,
    cliVersion,
    includeTemplates = false,
    legacyScripts = false,
    migrateMode = false,
    profile = 'default',
    templateRoot: providedTemplateRoot = '',
  } = options;

  const templateRoot = providedTemplateRoot || path.join(projectRoot, 'docs-template');
  const internalPaths = quiverInternalPaths(projectRoot);
  const replacements = {
    projectName,
    projectSlug: toProjectSlug(projectName),
    currentDate: new Date().toISOString().slice(0, 10),
    datePlus7: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    datePlus30: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    datePlus35: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };

  const dirs = [
    'docs',
    'docs/ai',
    '.quiver',
    '.quiver/scans',
  ];

  if (profile === 'full') {
    dirs.push(
      'docs/archive',
      'docs/examples',
      'docs/tools',
      `specs/${replacements.projectSlug}/slices/slice-template`,
      'tools/scripts',
    );
  } else if (legacyScripts) {
    dirs.push('tools/scripts');
  }

  for (const dir of dirs) {
    ensureDir(path.join(projectRoot, dir));
  }

  const operations = [];
  if (!fs.existsSync(internalPaths.configPath)) {
    fs.writeFileSync(internalPaths.configPath, `${JSON.stringify(buildQuiverConfig(), null, 2)}\n`);
    operations.push({ source: 'Quiver config', destination: '.quiver/config.json', result: 'created' });
  } else {
    operations.push({ source: 'Quiver config', destination: '.quiver/config.json', result: 'skipped' });
  }

  fs.writeFileSync(internalPaths.gitignorePath, buildQuiverInternalGitignore());
  operations.push({ source: 'Quiver internal gitignore', destination: '.quiver/.gitignore', result: 'updated' });

  const rootGitignoreResult = mergeRootGitignore(projectRoot);
  operations.push({ source: 'root gitignore defaults', destination: '.gitignore', result: rootGitignoreResult });

  if (includeTemplates) {
    fs.mkdirSync(internalPaths.templatesDir, { recursive: true });
    fs.cpSync(templateRoot, internalPaths.templatesDir, {
      recursive: true,
      force: false,
      errorOnExist: false,
      preserveTimestamps: true,
    });
    operations.push({ source: 'packaged templates', destination: '.quiver/templates', result: 'merged' });
  }

  const agentsSourcePath = path.join(templateRoot, 'AGENTS.md.template');
  if (fs.existsSync(agentsSourcePath)) {
    const agentsDestinationPath = path.join(projectRoot, 'AGENTS.md');
    const result = copyRenderedFile(agentsSourcePath, agentsDestinationPath, replacements, true);
    operations.push({ source: 'AGENTS.md.template', destination: 'AGENTS.md', result });
  }
  const frontMatterFor = (purpose, appliesWhen, supersedes = null) => ({ body }) => buildFrontMatterFields({
    purpose,
    appliesWhen,
    body,
    currentDate: replacements.currentDate,
    supersedes,
  });
  const templateCopies = [
    ['docs/INDEX.md.template', 'docs/INDEX.md'],
    ['docs/COMMANDS.md.template', 'docs/COMMANDS.md'],
    ['docs/DECISIONS.md.template', 'docs/DECISIONS.md'],
    ['docs/AI_CONTEXT.md.template', 'docs/AI_CONTEXT.md', frontMatterFor('Agent-facing project context pack', 'onboarding, implementation, review')],
    ['docs/AI_ONBOARDING_PROMPT.md.template', 'docs/AI_ONBOARDING_PROMPT.md', frontMatterFor('AI onboarding handoff prompt', 'onboarding after analysis')],
    ['docs/CONTEXTO.md.template', 'docs/CONTEXTO.md', frontMatterFor('Human-readable project overview', 'onboarding, review')],
    ['docs/STATUS.md.template', 'docs/STATUS.md', frontMatterFor('Project status snapshot', 'progress review, planning')],
    ['docs/WORKFLOW.md.template', 'docs/WORKFLOW.md', frontMatterFor('Execution workflow contract', 'planning, implementation')],
    ['docs/SUPPORT_MATRIX.md.template', 'docs/SUPPORT_MATRIX.md'],
    ['docs/TROUBLESHOOTING.md.template', 'docs/TROUBLESHOOTING.md'],
    ['docs/MULTI_AGENT_WORKFLOW.md.template', 'docs/MULTI_AGENT_WORKFLOW.md'],
    ['docs/MOCK_DATA_GUIDE.md.template', 'docs/MOCK_DATA_GUIDE.md'],
    ['docs/UI_STANDARDS.md.template', 'docs/UI_STANDARDS.md'],
    ['docs/GITFLOW_PR_GUIDE.md.template', 'docs/GITFLOW_PR_GUIDE.md'],
    ['docs/DOCUMENTATION_GUIDE.md.template', 'docs/DOCUMENTATION_GUIDE.md'],
    ['docs/TESTING_GUIDE_FOR_AI.md.template', 'docs/TESTING_GUIDE_FOR_AI.md'],
    ['docs/ai/LESSONS.md.template', 'docs/ai/LESSONS.md', frontMatterFor('Slice learnings log', 'after slice completion')],
    ['specs/[project-name]/SPEC.md.template', `specs/${replacements.projectSlug}/SPEC.md`],
    ['specs/[project-name]/HANDOFF.md.template', `specs/${replacements.projectSlug}/HANDOFF.md`],
    ['specs/[project-name]/STATUS.md.template', `specs/${replacements.projectSlug}/STATUS.md`],
    ['specs/[project-name]/EVIDENCE_REPORT.md.template', `specs/${replacements.projectSlug}/EVIDENCE_REPORT.md`],
    ['specs/[project-name]/slices/slice-template/slice.json', `specs/${replacements.projectSlug}/slices/slice-template/slice.json`],
    ['specs/[project-name]/slices/pr.md.template', `specs/${replacements.projectSlug}/slices/slice-template/pr.md.template`],
  ];

  const minimalTemplateDestinations = new Set([
    'docs/AI_CONTEXT.md',
    'docs/AI_ONBOARDING_PROMPT.md',
    'docs/COMMANDS.md',
    'docs/WORKFLOW.md',
  ]);
  const defaultTemplateDestinations = new Set([
    ...minimalTemplateDestinations,
    'docs/CONTEXTO.md',
    'docs/DECISIONS.md',
    'docs/GITFLOW_PR_GUIDE.md',
    'docs/INDEX.md',
    'docs/STATUS.md',
    'docs/SUPPORT_MATRIX.md',
    'docs/TESTING_GUIDE_FOR_AI.md',
    'docs/TROUBLESHOOTING.md',
    'docs/ai/LESSONS.md',
  ]);

  for (const [source, destination, frontMatterFactory] of templateCopies) {
    if (profile === 'minimal' && !minimalTemplateDestinations.has(destination)) {
      continue;
    }

    if (profile === 'default' && !defaultTemplateDestinations.has(destination)) {
      continue;
    }

    const sourcePath = path.join(templateRoot, source);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(projectRoot, destination);
    if (!migrateMode && fs.existsSync(destinationPath)) {
      operations.push({ source, destination, result: 'skipped' });
      continue;
    }

    const result = copyRenderedFile(sourcePath, destinationPath, replacements, migrateMode, frontMatterFactory);
    operations.push({ source, destination, result });
  }

  const indexPath = path.join(projectRoot, 'docs', 'INDEX.md');
  const indexWasCreated = operations.some((operation) => (
    operation.destination === 'docs/INDEX.md'
    && (operation.result === 'created' || operation.result === 'created-with-frontmatter')
  ));
  if (profile === 'full' && indexWasCreated && fs.existsSync(indexPath)) {
    const currentIndex = fs.readFileSync(indexPath, 'utf8').replace(/\s+$/g, '');
    fs.writeFileSync(indexPath, `${currentIndex}\n\n${buildFullProfileIndexAppendix(replacements.projectSlug)}`);
    operations.push({ source: 'full profile index appendix', destination: 'docs/INDEX.md', result: 'updated' });
  }

  const binaryCopies = [
    ['docs/UI_STANDARDS.md', 'docs/UI_STANDARDS.md'],
    ['docs/MOCK_DATA_GUIDE.md', 'docs/MOCK_DATA_GUIDE.md'],
    ['docs/ai/RULES.yaml', 'docs/ai/RULES.yaml'],
    ['LICENSE', 'LICENSE'],
    ['CONTRIBUTING.md', 'CONTRIBUTING.md'],
    ['CODE_OF_CONDUCT.md', 'CODE_OF_CONDUCT.md'],
    ['SECURITY.md', 'SECURITY.md'],
    ['CHANGELOG.md', 'CHANGELOG.md'],
    ['ROADMAP.md', 'ROADMAP.md'],
    ['.github/pull_request_template.md', '.github/pull_request_template.md'],
    ['.github/ISSUE_TEMPLATE/bug_report.md', '.github/ISSUE_TEMPLATE/bug_report.md'],
    ['.github/ISSUE_TEMPLATE/feature_request.md', '.github/ISSUE_TEMPLATE/feature_request.md'],
    ['.github/workflows/ci.yml', '.github/workflows/ci.yml'],
    ['scripts/start-slice.sh', 'tools/scripts/start-slice.sh'],
    ['scripts/refresh-active-slices.sh', 'tools/scripts/refresh-active-slices.sh'],
    ['scripts/check-slice-readiness.sh', 'tools/scripts/check-slice-readiness.sh'],
    ['scripts/check-pr-readiness.sh', 'tools/scripts/check-pr-readiness.sh'],
    ['scripts/cleanup-slice.sh', 'tools/scripts/cleanup-slice.sh'],
    ['scripts/check-scope.sh', 'tools/scripts/check-scope.sh'],
    ['scripts/migrate-project.sh', 'tools/scripts/migrate-project.sh'],
  ];

  const alwaysBinaryDestinations = new Set([
    'docs/ai/RULES.yaml',
  ]);
  const legacyScriptDestinations = new Set([
    'tools/scripts/start-slice.sh',
    'tools/scripts/refresh-active-slices.sh',
    'tools/scripts/check-slice-readiness.sh',
    'tools/scripts/check-pr-readiness.sh',
    'tools/scripts/cleanup-slice.sh',
    'tools/scripts/check-scope.sh',
    'tools/scripts/migrate-project.sh',
  ]);

  for (const [source, destination] of binaryCopies) {
    if (
      profile !== 'full'
      && !alwaysBinaryDestinations.has(destination)
      && !(legacyScripts && legacyScriptDestinations.has(destination))
    ) {
      continue;
    }

    const sourcePath = path.join(templateRoot, source);
    const destinationPath = path.join(projectRoot, destination);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const result = copyIfSourceExists(sourcePath, destinationPath, true);
    operations.push({ source, destination, result });
  }

  const aiPrinciplesSource = path.join(templateRoot, 'docs/ai/PRINCIPLES.md');
  if (fs.existsSync(aiPrinciplesSource)) {
    const aiPrinciplesDestination = path.join(projectRoot, 'docs/ai/PRINCIPLES.md');
    const result = !migrateMode && fs.existsSync(aiPrinciplesDestination)
      ? 'skipped'
      : copyRenderedFile(
        aiPrinciplesSource,
        aiPrinciplesDestination,
        replacements,
        migrateMode,
        frontMatterFor('AI operating principles', 'all AI work'),
      );
    operations.push({ source: 'docs/ai/PRINCIPLES.md', destination: 'docs/ai/PRINCIPLES.md', result });
  }

  const packageResult = mergePackageJson(projectRoot, templateRoot, {
    legacyScripts,
    migrateMode,
    profile,
    projectName,
    projectSlug: replacements.projectSlug,
  });
  operations.push({ source: 'package.template.json', destination: 'package.json', result: packageResult });

  const mergedPackageJsonPath = path.join(projectRoot, 'package.json');
  const mergedPackageJson = fs.existsSync(mergedPackageJsonPath)
    ? JSON.parse(fs.readFileSync(mergedPackageJsonPath, 'utf8'))
    : {};
  const packageScripts = mergedPackageJson.scripts || {};

  const tierReplacements = {
    ...replacements,
    packageManager: detectPackageManager(projectRoot),
    stackSummary: 'unknown until analyze',
    primaryInstall: 'npm install',
    primaryDev: packageScripts.dev || packageScripts.start || 'not defined',
    primaryTest: packageScripts.test || 'not defined',
    analyzeCommand: 'npx create-quiver analyze',
    planCommand: 'npx create-quiver plan',
    graphCommand: 'npx create-quiver graph',
    nextCommand: 'npx create-quiver next',
    doctorCommand: 'npx create-quiver doctor',
    startSliceCommand: 'npx create-quiver start-slice <slice.json>',
    checkSliceCommand: 'npx create-quiver check-slice <slice.json>',
    checkPrCommand: 'npx create-quiver check-pr <slice.json>',
    cleanupSliceCommand: 'npx create-quiver cleanup-slice <slice.json>',
    checkScopeCommand: 'npx create-quiver check-scope <slice.json>',
    refreshActiveSlicesCommand: 'npx create-quiver refresh-active-slices',
  };

  const tierCopies = [
    ['docs/QUICK.md.template', 'docs/ai/QUICK.md'],
    ['docs/STANDARD.md.template', 'docs/ai/STANDARD.md'],
    ['docs/DEEP.md.template', 'docs/ai/DEEP.md'],
    ['docs/examples/plan.md.template', 'docs/examples/plan.md'],
    ['docs/examples/graph.md.template', 'docs/examples/graph.md'],
    ['docs/examples/next.md.template', 'docs/examples/next.md'],
  ];

  for (const [source, destination] of tierCopies) {
    if (profile !== 'full') {
      continue;
    }

    const sourcePath = path.join(templateRoot, source);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(projectRoot, destination);
    if (!migrateMode && fs.existsSync(destinationPath)) {
      operations.push({ source, destination, result: 'skipped' });
      continue;
    }

    const result = copyRenderedFile(sourcePath, destinationPath, tierReplacements, migrateMode, ({
      body,
    }) => buildFrontMatterFields({
      purpose: destination.endsWith('QUICK.md')
        ? 'Minimum execution briefing'
        : destination.endsWith('STANDARD.md')
          ? 'Default context pack'
          : 'Deep project context',
      appliesWhen: destination.endsWith('QUICK.md')
        ? 'execution'
        : destination.endsWith('STANDARD.md')
          ? 'planning, implementation'
          : 'planning, escalation',
      body,
      currentDate: replacements.currentDate,
      supersedes: null,
    }));
    operations.push({ source, destination, result });
  }

  const currentState = fs.existsSync(path.join(projectRoot, '.quiver', 'state.json'))
    ? JSON.parse(fs.readFileSync(path.join(projectRoot, '.quiver', 'state.json'), 'utf8'))
    : null;
  const nextState = migrateMode
    ? {
        ...(currentState || {}),
        quiver_version: cliVersion,
        project_name: projectName || currentState?.project_name || '',
        initialized_version: currentState?.initialized_version ?? null,
        migrated_version: cliVersion,
        last_initialized_at: currentState?.last_initialized_at ?? null,
        last_migration_at: new Date().toISOString(),
        last_analysis_at: currentState?.last_analysis_at ?? null,
      }
    : {
        ...(currentState || {}),
        quiver_version: cliVersion,
        project_name: projectName || currentState?.project_name || '',
        initialized_version: currentState?.initialized_version || cliVersion,
        migrated_version: currentState?.migrated_version ?? null,
        last_initialized_at: currentState?.last_initialized_at || new Date().toISOString(),
        last_migration_at: currentState?.last_migration_at ?? null,
        last_analysis_at: currentState?.last_analysis_at ?? null,
      };
  writeState(projectRoot, nextState);

  const searchPath = path.join(projectRoot, 'docs', 'SEARCH.md');
  if (profile !== 'full') {
    operations.push({ source: 'docs/SEARCH.md', destination: 'docs/SEARCH.md', result: 'skipped-profile' });
  } else if (!fs.existsSync(searchPath)) {
    const searchContent = `# Búsqueda por Tema

**Última actualización:** ${replacements.currentDate}

---

## AI Context

- **Agent context pack:** \`docs/AI_CONTEXT.md\`
- **Project overview:** \`docs/CONTEXTO.md\`
- **Workflow:** \`docs/WORKFLOW.md\`

---

## Autenticación

- **Spec:** \`../specs/${replacements.projectSlug}/slices/slice-01/slice.json\`
- **PR del slice:** \`../specs/${replacements.projectSlug}/slices/slice-01/pr.md\`
- **Bootstrap del slice:** \`npx create-quiver start-slice ../specs/${replacements.projectSlug}/slices/slice-01/slice.json\`
- **Hook:** \`hooks/useAuth.ts\`
- **API:** \`docs/api/auth/README.md\`
- **Componentes:** \`app/(auth)/\`

---

## IA Configuración

- **Principios:** \`docs/ai/PRINCIPLES.md\`
- **Reglas:** \`docs/ai/RULES.yaml\`
- **Lessons:** \`docs/ai/LESSONS.md\`

## Soporte

- **Support Matrix:** \`docs/SUPPORT_MATRIX.md\`
- **Troubleshooting:** \`docs/TROUBLESHOOTING.md\`

---

**Fin de la búsqueda**
`;
    fs.writeFileSync(searchPath, `${searchContent}\n`);
    operations.push({ source: 'docs/SEARCH.md', destination: 'docs/SEARCH.md', result: 'created' });
  } else {
    operations.push({ source: 'docs/SEARCH.md', destination: 'docs/SEARCH.md', result: 'skipped' });
  }

  const readmePath = path.join(projectRoot, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, `${renderTemplate(buildReadme(projectName, replacements.projectSlug, profile), replacements)}\n`);
    operations.push({ source: 'README.md template', destination: 'README.md', result: 'created' });
  } else {
    operations.push({ source: 'README.md template', destination: 'README.md', result: 'skipped' });
  }

  return {
    projectSlug: replacements.projectSlug,
    operations,
  };
}

function detectPackageManager(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function installSelfAsDevDep(projectRoot, version) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return 'skipped-no-package-json';
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (pkg.devDependencies && pkg.devDependencies['create-quiver']) {
    return 'skipped-already-present';
  }

  const pm = detectPackageManager(projectRoot);
  const commands = {
    npm: `npm install -D create-quiver@${version}`,
    yarn: `yarn add -D create-quiver@${version}`,
    pnpm: `pnpm add -D create-quiver@${version}`,
    bun: `bun add -d create-quiver@${version}`,
  };

  try {
    execSync(commands[pm], { cwd: projectRoot, stdio: 'inherit' });
    return 'installed';
  } catch {
    return 'failed';
  }
}

function normalizeSkippedReason(reason) {
  if (!reason) {
    return 'excluded path';
  }

  if (reason === 'env-file') {
    return 'env files';
  }

  if (reason === 'git-metadata') {
    return '.git metadata';
  }

  if (reason === 'hidden-directory') {
    return 'hidden directories';
  }

  if (reason.startsWith('secret-file:')) {
    return 'secret files';
  }

  if (reason.startsWith('unsafe-segment:')) {
    const segment = reason.slice('unsafe-segment:'.length);
    const dependencySegments = new Set(['node_modules', '.pnpm-store', '.npm', '.yarn']);
    const outputSegments = new Set(['dist', 'build', 'coverage', 'out', 'tmp', 'temp', 'cache', '.cache', '.turbo', '.next', '.nuxt', '.parcel-cache', 'generated', 'gen', 'artifacts', 'reports', 'vendor', 'target']);

    if (segment === '.quiver') {
      return 'local AI state';
    }

    if (dependencySegments.has(segment)) {
      return 'dependency folders';
    }

    if (outputSegments.has(segment)) {
      return 'generated/output/cache folders';
    }

    return segment;
  }

  return reason;
}

function summarizeSkippedPaths(skippedPathDetails = [], skippedPaths = []) {
  const counts = new Map();

  const items = Array.isArray(skippedPathDetails) && skippedPathDetails.length > 0
    ? skippedPathDetails
    : skippedPaths.map((item) => ({ path: item, reason: 'excluded path' }));

  for (const item of items) {
    const label = normalizeSkippedReason(item.reason);
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function renderAiContextDoc(scan, options = {}) {
  const projectName = scan?.project?.name || 'Quiver Project';
  const projectSlug = options.projectSlug || toProjectSlug(projectName);
  const stack = scan?.stack || {};
  const commands = scan?.commands || {};
  const common = commands.common || {};
  const summaries = summarizeSkippedPaths(scan?.skipped_path_details, scan?.skipped_paths);
  const risks = Array.isArray(scan?.risks) ? scan.risks : [];
  const hasReadme = scan?.docs?.has_readme ? 'yes' : 'no';
  const hasWorkflow = scan?.ci?.has_ci ? 'yes' : 'no';
  const sourceDirs = Array.isArray(scan?.structure?.source_directories) ? scan.structure.source_directories : [];

  const lines = [];
  lines.push(`# ${projectName} AI Context`);
  lines.push('');
  lines.push('This file is refreshed by `npx create-quiver analyze`.');
  lines.push('Use `docs/PROJECT_MAP.md` for stack and command details, and `.quiver/scans/PROJECT_SCAN.json` only when raw analyzer data is needed.');
  lines.push('');
  lines.push('## Snapshot');
  lines.push(`- Primary stack: ${stack.primary || 'unknown'}`);
  lines.push('- Package manager source: `docs/PROJECT_MAP.md`');
  lines.push(`- Install: ${commands.install || 'not defined'}`);
  lines.push(`- Dev: ${common.dev || 'not defined'}`);
  lines.push(`- Build: ${common.build || 'not defined'}`);
  lines.push(`- Test: ${common.test || 'not defined'}`);
  lines.push(`- README present: ${hasReadme}`);
  lines.push(`- GitHub Actions workflows: ${hasWorkflow}`);
  lines.push(`- Source directories: ${sourceDirs.length > 0 ? sourceDirs.join(', ') : 'none detected'}`);
  lines.push('');
  lines.push('## Read First');
  lines.push('- `docs/PROJECT_MAP.md`');
  lines.push('- `docs/WORKFLOW.md`');
  lines.push('- `docs/AI_ONBOARDING_PROMPT.md`');
  lines.push('- `docs/CONTEXTO.md`');
  lines.push('- `docs/DECISIONS.md`');
  lines.push(`- specs/${projectSlug}/SPEC.md`);
  lines.push('');
  lines.push('## Assumptions and Missing Info');
  if (risks.length > 0) {
    for (const risk of risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push('- No major repository signals are missing.');
  }
  lines.push('- Do not infer product or business rules that are not present in the repository.');
  lines.push('');
  lines.push('## Exclusions');
  if (summaries.length > 0) {
    for (const item of summaries) {
      lines.push(`- ${item.label}: ${item.count}`);
    }
  } else {
    lines.push('- No exclusions were needed.');
  }
  lines.push('');
  lines.push('## Internal Artifacts');
  lines.push('- Visible source: `docs/PROJECT_MAP.md`');
  lines.push('- Internal raw scan: `.quiver/scans/PROJECT_SCAN.json`');
  lines.push('');
  const body = lines.join('\n');
  const frontMatter = serializeFrontMatter(buildFrontMatterFields({
    purpose: 'Agent-facing project context pack',
    appliesWhen: 'after analyze, onboarding, implementation, review',
    body,
    currentDate: options.currentDate || new Date().toISOString().slice(0, 10),
  }));

  return `${frontMatter}\n\n${body}`;
}

function refreshAiContextDoc(projectRoot, scan, options = {}) {
  const destinationPath = path.join(projectRoot, 'docs', 'AI_CONTEXT.md');
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, `${renderAiContextDoc(scan, options)}\n`);
  return destinationPath;
}

module.exports = {
  initializeProjectDocs,
  refreshAiContextDoc,
  renderAiContextDoc,
  summarizeSkippedPaths,
  writeFrontMatter,
  toProjectSlug,
  detectPackageManager,
  installSelfAsDevDep,
};
