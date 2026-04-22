const fs = require('fs');
const path = require('path');

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
    .replace(/{{X}}%/g, '0%');
}

function copyRenderedFile(sourcePath, destinationPath, replacements, skipIfExists) {
  if (skipIfExists && fs.existsSync(destinationPath)) {
    return 'skipped';
  }

  ensureDir(path.dirname(destinationPath));
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(destinationPath, renderTemplate(sourceText, replacements));
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

  if (skipIfExists) {
    return 'skipped';
  }

  const existing = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const template = JSON.parse(fs.readFileSync(packageTemplate, 'utf8'));

  existing.scripts = {
    ...(existing.scripts || {}),
    ...(template.scripts || {}),
  };

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(existing, null, 2)}\n`);
  return 'updated';
}

function writeQuiverState(projectRoot, projectName, cliVersion, migrateMode) {
  const stateDir = path.join(projectRoot, '.quiver');
  const statePath = path.join(stateDir, 'state.json');
  const now = new Date().toISOString();
  let existing = {};

  if (fs.existsSync(statePath)) {
    existing = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }

  const nextState = migrateMode
    ? {
        ...existing,
        quiver_version: cliVersion,
        project_name: projectName || existing.project_name || '',
        initialized_version: existing.initialized_version ?? null,
        migrated_version: cliVersion,
        last_initialized_at: existing.last_initialized_at ?? null,
        last_migration_at: now,
        last_analysis_at: existing.last_analysis_at ?? null,
      }
    : {
        ...existing,
        quiver_version: cliVersion,
        project_name: projectName || existing.project_name || '',
        initialized_version: existing.initialized_version || cliVersion,
        migrated_version: existing.migrated_version ?? null,
        last_initialized_at: existing.last_initialized_at || now,
        last_migration_at: existing.last_migration_at ?? null,
        last_analysis_at: existing.last_analysis_at ?? null,
      };

  ensureDir(stateDir);
  fs.writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
  return statePath;
}

function buildReadme(projectName, projectSlug) {
  return `# ${projectName}

[Descripción breve del proyecto]

## Quick Start

Run Quiver from this project root. Do not install it globally.

\`\`\`bash
npm install
npx create-quiver analyze
npx create-quiver doctor
\`\`\`

If this project needs a pinned Quiver version, install it as a devDependency:

\`\`\`bash
npm install --save-dev create-quiver
\`\`\`

If you need to target another directory from outside the project, pass \`--dir\` explicitly. Quote paths that contain spaces.

## Cross-Platform Support

Quiver is targeting native support on macOS, Linux, and Windows PowerShell/CMD. Bash is a legacy compatibility path until the runtime slices land, so the generated workflow should be read as a native Node-first contract rather than a Bash-first one.

## Upgrading Existing Projects

If the project already existed before this Quiver version, upgrade it from the project root:

\`\`\`bash
cd /path/to/your-project
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
\`\`\`

If your team prefers a pinned local dependency, update the package first and then run the same flow:

\`\`\`bash
npm install --save-dev create-quiver@latest
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
\`\`\`

## AI Context Onboarding

After analysis and doctor validation, open your AI agent in this project and run:

\`\`\`text
Read docs/AI_ONBOARDING_PROMPT.md and execute it.
Do not modify product code unless I explicitly authorize it.
Prepare the project context docs and report assumptions, risks, and files changed.
\`\`\`

Review the AI changes to docs/AI_CONTEXT.md, docs/CONTEXTO.md, docs/STATUS.md, and specs/${projectSlug}/SPEC.md before starting implementation work.

## First Slice Workflow

1. Review or refine specs/${projectSlug}/SPEC.md.
2. Create the first slice from specs/${projectSlug}/slices/slice-template/slice.json.
3. Start work with tools/scripts/start-slice.sh <slice.json>.
4. Make one commit per slice.
5. Open one PR per spec.

## Verification Checklist

- [ ] npm install completes
- [ ] npx create-quiver analyze completes
- [ ] npx create-quiver doctor completes
- [ ] AI agent executed docs/AI_ONBOARDING_PROMPT.md
- [ ] Context docs were reviewed before the first slice

## Documentation

- [AI Context](./docs/AI_CONTEXT.md) - Contexto resumido para IA
- [AI Onboarding Prompt](./docs/AI_ONBOARDING_PROMPT.md) - Handoff exacto para agentes después del análisis
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
  const templateCopies = [
    ['docs/INDEX.md.template', 'docs/INDEX.md'],
    ['docs/AI_CONTEXT.md.template', 'docs/AI_CONTEXT.md'],
    ['docs/AI_ONBOARDING_PROMPT.md.template', 'docs/AI_ONBOARDING_PROMPT.md'],
    ['docs/CONTEXTO.md.template', 'docs/CONTEXTO.md'],
    ['docs/STATUS.md.template', 'docs/STATUS.md'],
    ['docs/WORKFLOW.md.template', 'docs/WORKFLOW.md'],
    ['docs/SUPPORT_MATRIX.md.template', 'docs/SUPPORT_MATRIX.md'],
    ['docs/TROUBLESHOOTING.md.template', 'docs/TROUBLESHOOTING.md'],
    ['docs/MULTI_AGENT_WORKFLOW.md.template', 'docs/MULTI_AGENT_WORKFLOW.md'],
    ['docs/MOCK_DATA_GUIDE.md.template', 'docs/MOCK_DATA_GUIDE.md'],
    ['docs/UI_STANDARDS.md.template', 'docs/UI_STANDARDS.md'],
    ['docs/GITFLOW_PR_GUIDE.md.template', 'docs/GITFLOW_PR_GUIDE.md'],
    ['docs/DOCUMENTATION_GUIDE.md.template', 'docs/DOCUMENTATION_GUIDE.md'],
    ['docs/TESTING_GUIDE_FOR_AI.md.template', 'docs/TESTING_GUIDE_FOR_AI.md'],
    ['docs/ai/LESSONS.md.template', 'docs/ai/LESSONS.md'],
    ['specs/[project-name]/SPEC.md.template', `specs/${replacements.projectSlug}/SPEC.md`],
    ['specs/[project-name]/STATUS.md.template', `specs/${replacements.projectSlug}/STATUS.md`],
    ['specs/[project-name]/EVIDENCE_REPORT.md.template', `specs/${replacements.projectSlug}/EVIDENCE_REPORT.md`],
    ['specs/[project-name]/slices/slice-template/slice.json', `specs/${replacements.projectSlug}/slices/slice-template/slice.json`],
    ['specs/[project-name]/slices/pr.md.template', `specs/${replacements.projectSlug}/slices/slice-template/pr.md.template`],
  ];

  for (const [source, destination] of templateCopies) {
    const sourcePath = path.join(templateRoot, source);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const destinationPath = path.join(projectRoot, destination);
    const result = copyRenderedFile(sourcePath, destinationPath, replacements, migrateMode);
    operations.push({ source, destination, result });
  }

  const binaryCopies = [
    ['docs/UI_STANDARDS.md', 'docs/UI_STANDARDS.md'],
    ['docs/MOCK_DATA_GUIDE.md', 'docs/MOCK_DATA_GUIDE.md'],
    ['docs/ai/PRINCIPLES.md', 'docs/ai/PRINCIPLES.md'],
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

  const packageResult = mergePackageJson(projectRoot, templateRoot, migrateMode);
  operations.push({ source: 'package.template.json', destination: 'package.json', result: packageResult });

  writeQuiverState(projectRoot, projectName, cliVersion, migrateMode);

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
- **Bootstrap del slice:** \`../tools/scripts/start-slice.sh ../specs/${replacements.projectSlug}/slices/slice-01/slice.json\`
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
    fs.writeFileSync(readmePath, `${buildReadme(projectName, replacements.projectSlug)}\n`);
    operations.push({ source: 'README.md template', destination: 'README.md', result: 'created' });
  } else {
    operations.push({ source: 'README.md template', destination: 'README.md', result: 'skipped' });
  }

  return {
    projectSlug: replacements.projectSlug,
    operations,
  };
}

module.exports = {
  initializeProjectDocs,
  toProjectSlug,
};
