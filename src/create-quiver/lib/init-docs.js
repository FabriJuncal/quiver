const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

function mergePackageJson(projectRoot, templateRoot, skipIfExists) {
  const packageTemplate = path.join(templateRoot, 'package.template.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageTemplate)) {
    return 'missing';
  }

  if (!fs.existsSync(packageJsonPath)) {
    fs.copyFileSync(packageTemplate, packageJsonPath);
    return 'created';
  }

  const existing = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const template = JSON.parse(fs.readFileSync(packageTemplate, 'utf8'));

  existing.scripts = {
    ...(existing.scripts || {}),
    ...(template.scripts || {}),
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(existing, null, 2)}\n`);
  return skipIfExists ? 'merged' : 'updated';
}

function buildReadme(projectName, projectSlug) {
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

## Project NPM Scripts

The generated project includes \`quiver:*\` npm scripts that call the Node CLI and are the preferred repeatable workflow:

\`\`\`bash
npm run quiver:analyze
npm run quiver:plan
npm run quiver:graph
npm run quiver:next
npm run quiver:doctor
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
npx create-quiver --name "Project Name"
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
Read docs/AI_ONBOARDING_PROMPT.md and execute it.
Do not modify product code unless I explicitly authorize it.
Prepare the project context docs and report assumptions, risks, and files changed.
\`\`\`

Review the AI changes to docs/AI_CONTEXT.md, docs/CONTEXTO.md, docs/STATUS.md, and specs/${projectSlug}/SPEC.md before starting implementation work. Use \`docs/PROJECT_MAP.md\` for stack and command details.
If the work was explicitly transferred through a handoff artifact, read \`specs/${projectSlug}/HANDOFF.md\` before implementation.

## Decision Log

Record durable decisions in \`docs/DECISIONS.md\` so future AI agents do not re-litigate the same choices.

## First Slice Workflow

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

function initializeProjectDocs(options) {
  const {
    projectRoot,
    projectName,
    cliVersion,
    migrateMode = false,
  } = options;

  const templateRoot = path.join(projectRoot, 'docs-template');
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
    'docs/tools',
    'docs/archive',
    `specs/${replacements.projectSlug}/slices/slice-template`,
    'tools/scripts',
  ];

  for (const dir of dirs) {
    ensureDir(path.join(projectRoot, dir));
  }

  const operations = [];
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

  for (const [source, destination, frontMatterFactory] of templateCopies) {
    const sourcePath = path.join(templateRoot, source);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(projectRoot, destination);
    const result = copyRenderedFile(sourcePath, destinationPath, replacements, migrateMode, frontMatterFactory);
    operations.push({ source, destination, result });
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

  for (const [source, destination] of binaryCopies) {
    const sourcePath = path.join(templateRoot, source);
    const destinationPath = path.join(projectRoot, destination);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const result = copyIfSourceExists(sourcePath, destinationPath, migrateMode);
    operations.push({ source, destination, result });
  }

  const aiPrinciplesSource = path.join(templateRoot, 'docs/ai/PRINCIPLES.md');
  if (fs.existsSync(aiPrinciplesSource)) {
    const aiPrinciplesDestination = path.join(projectRoot, 'docs/ai/PRINCIPLES.md');
    const result = copyRenderedFile(
      aiPrinciplesSource,
      aiPrinciplesDestination,
      replacements,
      migrateMode,
      frontMatterFor('AI operating principles', 'all AI work'),
    );
    operations.push({ source: 'docs/ai/PRINCIPLES.md', destination: 'docs/ai/PRINCIPLES.md', result });
  }

  const packageResult = mergePackageJson(projectRoot, templateRoot, migrateMode);
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
    const sourcePath = path.join(templateRoot, source);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(projectRoot, destination);
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
  if (!(migrateMode && fs.existsSync(searchPath))) {
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
    fs.writeFileSync(readmePath, `${renderTemplate(buildReadme(projectName, replacements.projectSlug), replacements)}\n`);
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

module.exports = {
  initializeProjectDocs,
  writeFrontMatter,
  toProjectSlug,
  detectPackageManager,
  installSelfAsDevDep,
};
