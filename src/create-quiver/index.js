const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function printUsage() {
  console.log(`Usage:
  npx create-quiver [options]
  npx create-quiver analyze [options]
  npx create-quiver doctor [options]

Options:
  -n, --name <project-name>   Project name to generate
  -d, --dir <target-dir>      Target directory to scaffold into or inspect
  -y, --yes                   Skip prompts and use the provided inputs
  -h, --help                  Show this help message

Examples:
  npx create-quiver --name "My Project"
  npx create-quiver --name "My Project" --dir ./my-project
  npx create-quiver analyze --dir ./my-project
  npx create-quiver doctor --dir ./my-project
  node bin/create-quiver.js doctor --dir ./my-project
`);
}

function parseArgs(argv) {
  const result = {
    help: false,
    force: false,
    mode: 'init',
    projectName: '',
    targetDir: '.',
  };

  const args = [...argv];
  if (args[0] === 'doctor' || args[0] === 'analyze') {
    result.mode = args[0];
    args.shift();
  } else if (args[0] === '--analyze') {
    result.mode = 'analyze';
    args.shift();
  } else if (args[0] === '--doctor') {
    result.mode = 'doctor';
    args.shift();
  }

  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      continue;
    }

    if (arg === '-y' || arg === '--yes') {
      result.force = true;
      continue;
    }

    if (arg === '--doctor') {
      result.mode = 'doctor';
      continue;
    }

    if (arg === '-n' || arg === '--name' || arg === '--project-name') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --name'));
      }
      result.projectName = value;
      continue;
    }

    if (arg === '-d' || arg === '--dir' || arg === '--target') {
      const value = args[++index];
      if (!value) {
        throw new Error(formatError('missing value for --dir'));
      }
      result.targetDir = value;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(formatError(`unknown flag: ${arg}`));
    }

    positional.push(arg);
  }

  if (result.mode === 'init') {
    if (!result.projectName && positional.length > 0) {
      result.projectName = positional.shift();
    }

    if (positional.length > 0) {
      result.targetDir = positional.shift();
    }
  } else {
    if (positional.length > 0) {
      result.targetDir = positional.shift();
    }
  }

  if (positional.length > 0) {
    throw new Error(formatError('too many positional arguments'));
  }

  return result;
}

function toProjectSlug(projectName) {
  return projectName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiver-project';
}

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
}

function packTemplate(packageRoot, tempRoot) {
  const packDir = path.join(tempRoot, 'pack');
  const extractDir = path.join(tempRoot, 'extract');
  const npmCache = path.join(tempRoot, 'npm-cache');

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(npmCache, { recursive: true });

  const packOutput = runCommand('npm', ['pack', '--json', '--pack-destination', packDir], {
    cwd: packageRoot,
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
  });

  const packInfo = JSON.parse(packOutput.trim());
  const tarballPath = path.join(packDir, packInfo[0].filename);

  if (!fs.existsSync(tarballPath)) {
    throw new Error(formatError(`pack output not found at ${tarballPath}`));
  }

  runCommand('tar', ['-xzf', tarballPath, '-C', extractDir]);

  return path.join(extractDir, 'package');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyTemplate(templateRoot, targetDir) {
  const docsTemplateDir = path.join(targetDir, 'docs-template');

  if (fs.existsSync(docsTemplateDir)) {
    throw new Error(formatError(`docs-template already exists at ${docsTemplateDir}`));
  }

  fs.cpSync(templateRoot, docsTemplateDir, { recursive: true });

  return docsTemplateDir;
}

function runInitDocs(repoRoot, projectName) {
  runCommand('bash', ['docs-template/scripts/init-docs.sh', projectName], {
    cwd: repoRoot,
  });
}

function listGeneratedSpecDirs(projectRoot) {
  const specsDir = path.join(projectRoot, 'specs');

  if (!fs.existsSync(specsDir)) {
    return [];
  }

  return fs.readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((entry) => entry !== '[project-name]' && !entry.startsWith('quiver-'));
}

function assertFilesExist(root, relativePaths) {
  return relativePaths.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
}

function assertExecutablesExist(root, relativePaths) {
  return relativePaths.filter((relativePath) => {
    const absolutePath = path.join(root, relativePath);

    if (!fs.existsSync(absolutePath)) {
      return true;
    }

    const mode = fs.statSync(absolutePath).mode;
    return (mode & 0o111) === 0;
  });
}

function loadPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(formatError(`missing package.json in ${projectRoot}`));
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function toRelativePath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function collectPackageManagers(projectRoot) {
  const packageManagerField = readJsonIfExists(path.join(projectRoot, 'package.json'))?.packageManager;

  if (typeof packageManagerField === 'string' && packageManagerField.length > 0) {
    return packageManagerField.split('@')[0];
  }

  const priority = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['npm', 'package-lock.json'],
  ];

  for (const [manager, filename] of priority) {
    if (fs.existsSync(path.join(projectRoot, filename))) {
      return manager;
    }
  }

  return 'unknown';
}

function collectProjectFiles(projectRoot, maxDepth = 2) {
  const files = [];
  const skippedPaths = [];
  const ignoredDirs = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    'vendor',
    '.turbo',
    '.cache',
    'out',
    'tmp',
    'docs-template',
  ]);
  const allowedHiddenDirs = new Set(['.github', '.vscode', '.devcontainer']);

  function walk(currentDir, depth, relativeDir = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) {
          skippedPaths.push(entryRelativePath);
          continue;
        }

        if (entry.name.startsWith('.') && !allowedHiddenDirs.has(entry.name)) {
          skippedPaths.push(entryRelativePath);
          continue;
        }

        if (depth < maxDepth) {
          walk(absolutePath, depth + 1, entryRelativePath);
        }

        continue;
      }

      files.push(entryRelativePath);
    }
  }

  walk(projectRoot, 0);

  return { files, skippedPaths };
}

function collectRootEntries(projectRoot) {
  return fs.readdirSync(projectRoot, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file',
  }));
}

function detectSourceDirectories(rootEntries) {
  const commonNames = new Set([
    'src',
    'app',
    'pages',
    'components',
    'lib',
    'server',
    'client',
    'api',
    'packages',
    'services',
    'modules',
    'tests',
    'test',
    'spec',
    'stories',
  ]);

  return rootEntries
    .filter((entry) => entry.type === 'directory' && commonNames.has(entry.name))
    .map((entry) => entry.name);
}

function collectLanguageSignals(files) {
  const extensions = new Map();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();

    if (!ext) {
      continue;
    }

    extensions.set(ext, (extensions.get(ext) || 0) + 1);
  }

  const languages = [];
  const extToLanguage = new Map([
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.mts', 'typescript'],
    ['.cts', 'typescript'],
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.mjs', 'javascript'],
    ['.cjs', 'javascript'],
    ['.py', 'python'],
    ['.go', 'go'],
    ['.php', 'php'],
    ['.rb', 'ruby'],
    ['.rs', 'rust'],
    ['.java', 'java'],
    ['.kt', 'kotlin'],
    ['.swift', 'swift'],
    ['.cs', 'csharp'],
    ['.sh', 'shell'],
    ['.toml', 'toml'],
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
  ]);

  for (const [ext, language] of extToLanguage.entries()) {
    if (extensions.has(ext)) {
      languages.push(language);
    }
  }

  return languages;
}

function collectWorkspaces(packageJson) {
  if (!packageJson) {
    return [];
  }

  const workspaces = packageJson.workspaces;

  if (Array.isArray(workspaces)) {
    return workspaces.filter((workspace) => typeof workspace === 'string');
  }

  if (workspaces && Array.isArray(workspaces.packages)) {
    return workspaces.packages.filter((workspace) => typeof workspace === 'string');
  }

  return [];
}

function collectDependencies(packageJson) {
  const dependencySets = [
    packageJson?.dependencies,
    packageJson?.devDependencies,
    packageJson?.peerDependencies,
    packageJson?.optionalDependencies,
  ];
  const dependencies = new Set();

  for (const set of dependencySets) {
    if (!set) {
      continue;
    }

    for (const name of Object.keys(set)) {
      dependencies.add(name);
    }
  }

  return dependencies;
}

function detectFrameworks(projectRoot, files, rootEntries, packageJson) {
  const dependencies = collectDependencies(packageJson);
  const rootFileSet = new Set(rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name));
  const rootDirSet = new Set(rootEntries.filter((entry) => entry.type === 'directory').map((entry) => entry.name));
  const frameworks = [];
  const evidence = [];

  const candidates = [
    {
      name: 'nextjs',
      matches: () => dependencies.has('next') || rootFileSet.has('next.config.js') || rootFileSet.has('next.config.mjs') || rootFileSet.has('next.config.ts') || rootDirSet.has('pages') || rootDirSet.has('app'),
      signals: ['next', 'next.config.*', 'app/pages'],
    },
    {
      name: 'nuxt',
      matches: () => dependencies.has('nuxt') || rootFileSet.has('nuxt.config.js') || rootFileSet.has('nuxt.config.ts') || rootFileSet.has('app.vue'),
      signals: ['nuxt', 'nuxt.config.*'],
    },
    {
      name: 'angular',
      matches: () => dependencies.has('@angular/core') || rootFileSet.has('angular.json'),
      signals: ['@angular/core', 'angular.json'],
    },
    {
      name: 'sveltekit',
      matches: () => dependencies.has('@sveltejs/kit') || rootFileSet.has('svelte.config.js') || rootFileSet.has('svelte.config.ts'),
      signals: ['@sveltejs/kit', 'svelte.config.*'],
    },
    {
      name: 'vue',
      matches: () => dependencies.has('vue') || rootFileSet.has('vue.config.js') || rootFileSet.has('vite.config.js') || rootFileSet.has('vite.config.ts'),
      signals: ['vue', 'vue.config.*', 'vite.config.*'],
    },
    {
      name: 'react',
      matches: () => dependencies.has('react'),
      signals: ['react'],
    },
    {
      name: 'vite',
      matches: () => dependencies.has('vite') || rootFileSet.has('vite.config.js') || rootFileSet.has('vite.config.ts') || rootFileSet.has('vite.config.mjs'),
      signals: ['vite', 'vite.config.*'],
    },
    {
      name: 'express',
      matches: () => dependencies.has('express'),
      signals: ['express'],
    },
    {
      name: 'python',
      matches: () => rootFileSet.has('pyproject.toml') || rootFileSet.has('requirements.txt') || rootFileSet.has('Pipfile'),
      signals: ['pyproject.toml', 'requirements.txt', 'Pipfile'],
    },
    {
      name: 'go',
      matches: () => rootFileSet.has('go.mod'),
      signals: ['go.mod'],
    },
    {
      name: 'php',
      matches: () => rootFileSet.has('composer.json'),
      signals: ['composer.json'],
    },
    {
      name: 'ruby',
      matches: () => rootFileSet.has('Gemfile'),
      signals: ['Gemfile'],
    },
    {
      name: 'rust',
      matches: () => rootFileSet.has('Cargo.toml'),
      signals: ['Cargo.toml'],
    },
  ];

  for (const candidate of candidates) {
    if (candidate.matches()) {
      frameworks.push(candidate.name);
      evidence.push({ framework: candidate.name, signals: candidate.signals });
    }
  }

  const languages = collectLanguageSignals(files);

  if (frameworks.length === 0 && languages.includes('typescript') && dependencies.has('react')) {
    frameworks.push('react');
    evidence.push({ framework: 'react', signals: ['react', 'typescript files'] });
  }

  const primary = frameworks[0] || 'unknown';

  return {
    primary,
    frameworks,
    languages,
    evidence,
  };
}

function detectConfigFiles(rootEntries) {
  const rootFiles = rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name);
  const configNames = new Set([
    'package.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'bun.lockb',
    'bun.lock',
    'pyproject.toml',
    'requirements.txt',
    'Pipfile',
    'go.mod',
    'composer.json',
    'Cargo.toml',
    'Gemfile',
    'angular.json',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'nuxt.config.js',
    'nuxt.config.ts',
    'svelte.config.js',
    'svelte.config.ts',
    'vue.config.js',
    'eslint.config.js',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.json',
  ]);

  return rootFiles.filter((name) => configNames.has(name));
}

function detectWorkflowFiles(files) {
  return files.filter((file) => file.startsWith('.github/workflows/') && /\.(ya?ml)$/i.test(file));
}

function detectDocsFiles(files) {
  return files.filter((file) => file === 'README.md' || file.startsWith('docs/'));
}

function detectRisks(projectRoot, scan) {
  const risks = [];

  if (!scan.project.has_package_json) {
    risks.push('package.json is missing, so command detection is limited');
  }

  if (!scan.docs.has_readme) {
    risks.push('README.md is missing, so onboarding guidance is limited');
  }

  if (scan.ci.github_actions_workflows.length === 0) {
    risks.push('no GitHub Actions workflows were found');
  }

  if (scan.stack.primary === 'unknown') {
    risks.push('no primary framework could be inferred from the repository signals');
  }

  if (scan.structure.source_directories.length === 0) {
    risks.push('no common source directory names were found at the repository root');
  }

  if (scan.skipped_paths.length === 0) {
    risks.push('no large or secret-like paths were skipped, or the repository is very small');
  }

  return risks;
}

function buildProjectScan(projectRoot) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));
  const rootEntries = collectRootEntries(projectRoot);
  const { files, skippedPaths } = collectProjectFiles(projectRoot);
  const topLevelDirectories = rootEntries.filter((entry) => entry.type === 'directory' && !entry.name.startsWith('.')).map((entry) => entry.name);
  const sourceDirectories = detectSourceDirectories(rootEntries);
  const configFiles = detectConfigFiles(rootEntries);
  const workflowFiles = detectWorkflowFiles(files);
  const docsFiles = detectDocsFiles(files);
  const stack = detectFrameworks(projectRoot, files, rootEntries, packageJson);
  const packageManager = collectPackageManagers(projectRoot);
  const workspaces = collectWorkspaces(packageJson);
  const scripts = packageJson?.scripts && typeof packageJson.scripts === 'object' ? packageJson.scripts : {};
  const projectName = packageJson?.name || path.basename(projectRoot) || 'unknown';
  const hasReadme = fs.existsSync(path.join(projectRoot, 'README.md'));
  const generatedDocs = docsFiles.filter((file) => file.startsWith('docs/'));

  const scan = {
    project: {
      name: projectName,
      root_name: path.basename(projectRoot),
      has_package_json: Boolean(packageJson),
      package_manager: packageManager,
      workspaces,
      scripts,
      top_level_files: rootEntries.filter((entry) => entry.type === 'file').map((entry) => entry.name),
      top_level_directories: topLevelDirectories,
    },
    stack: {
      primary: stack.primary,
      frameworks: stack.frameworks,
      languages: stack.languages,
      evidence: stack.evidence,
    },
    commands: {
      install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : packageManager === 'bun' ? 'bun install' : 'npm install',
      scripts,
      common: {
        dev: scripts.dev || scripts.start || '',
        build: scripts.build || '',
        test: scripts.test || '',
        lint: scripts.lint || '',
      },
    },
    structure: {
      top_level_directories: topLevelDirectories,
      source_directories: sourceDirectories,
      config_files: configFiles,
      workspace_patterns: workspaces,
    },
    ci: {
      github_actions_workflows: workflowFiles,
      has_ci: workflowFiles.length > 0,
    },
    docs: {
      has_readme: hasReadme,
      files: docsFiles,
      generated_files: generatedDocs,
    },
    risks: [],
    skipped_paths: skippedPaths,
  };

  scan.risks = detectRisks(projectRoot, scan);

  return scan;
}

function renderProjectMap(scan) {
  const lines = [];

  lines.push('# Project Map');
  lines.push('');
  lines.push('## Project');
  lines.push(`- Name: ${scan.project.name}`);
  lines.push(`- Root folder: ${scan.project.root_name}`);
  lines.push(`- Package manager: ${scan.project.package_manager}`);
  lines.push(`- package.json present: ${scan.project.has_package_json ? 'yes' : 'no'}`);
  if (scan.project.workspaces.length > 0) {
    lines.push(`- Workspaces: ${scan.project.workspaces.join(', ')}`);
  }

  lines.push('');
  lines.push('## Stack');
  lines.push(`- Primary: ${scan.stack.primary}`);
  lines.push(`- Frameworks: ${scan.stack.frameworks.length > 0 ? scan.stack.frameworks.join(', ') : 'none detected'}`);
  lines.push(`- Languages: ${scan.stack.languages.length > 0 ? scan.stack.languages.join(', ') : 'none detected'}`);

  if (scan.stack.evidence.length > 0) {
    lines.push('');
    lines.push('### Evidence');
    for (const item of scan.stack.evidence) {
      lines.push(`- ${item.framework}: ${item.signals.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('## Commands');
  lines.push('| Command | Value |');
  lines.push('|---------|-------|');
  lines.push(`| Install | ${escapeMarkdownCell(scan.commands.install || 'npm install')} |`);
  lines.push(`| dev | ${escapeMarkdownCell(scan.commands.common.dev || 'not defined')} |`);
  lines.push(`| build | ${escapeMarkdownCell(scan.commands.common.build || 'not defined')} |`);
  lines.push(`| test | ${escapeMarkdownCell(scan.commands.common.test || 'not defined')} |`);
  lines.push(`| lint | ${escapeMarkdownCell(scan.commands.common.lint || 'not defined')} |`);

  if (Object.keys(scan.commands.scripts).length > 0) {
    lines.push('');
    lines.push('### package.json scripts');
    for (const [name, command] of Object.entries(scan.commands.scripts)) {
      lines.push(`- ${name}: \`${command}\``);
    }
  }

  lines.push('');
  lines.push('## Structure');
  lines.push(`- Top-level directories: ${scan.structure.top_level_directories.length > 0 ? scan.structure.top_level_directories.join(', ') : 'none detected'}`);
  lines.push(`- Source directories: ${scan.structure.source_directories.length > 0 ? scan.structure.source_directories.join(', ') : 'none detected'}`);
  lines.push(`- Config files: ${scan.structure.config_files.length > 0 ? scan.structure.config_files.join(', ') : 'none detected'}`);

  lines.push('');
  lines.push('## CI');
  lines.push(`- GitHub Actions workflows: ${scan.ci.github_actions_workflows.length > 0 ? scan.ci.github_actions_workflows.join(', ') : 'none detected'}`);

  lines.push('');
  lines.push('## Docs');
  lines.push(`- README present: ${scan.docs.has_readme ? 'yes' : 'no'}`);
  lines.push(`- Docs files: ${scan.docs.files.length > 0 ? scan.docs.files.join(', ') : 'none detected'}`);

  lines.push('');
  lines.push('## Risks');
  if (scan.risks.length > 0) {
    for (const risk of scan.risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push('- No major onboarding risks detected.');
  }

  lines.push('');
  lines.push('## Skipped Paths');
  if (scan.skipped_paths.length > 0) {
    for (const skippedPath of scan.skipped_paths) {
      lines.push(`- ${skippedPath}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  return lines.join('\n');
}

function writeProjectScanArtifacts(projectRoot, scan) {
  const docsDir = path.join(projectRoot, 'docs');
  ensureDir(docsDir);

  const jsonPath = path.join(docsDir, 'PROJECT_SCAN.json');
  const mdPath = path.join(docsDir, 'PROJECT_MAP.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(scan, null, 2)}\n`);
  fs.writeFileSync(mdPath, `${renderProjectMap(scan)}\n`);

  return { jsonPath, mdPath };
}

function runAnalyze(targetDir) {
  const projectRoot = path.resolve(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  const scan = buildProjectScan(projectRoot);
  const artifacts = writeProjectScanArtifacts(projectRoot, scan);

  console.log(`Project analysis completed for ${projectRoot}`);
  console.log(`Wrote ${path.relative(projectRoot, artifacts.jsonPath)}`);
  console.log(`Wrote ${path.relative(projectRoot, artifacts.mdPath)}`);
  console.log(`Detected primary stack: ${scan.stack.primary}`);
  console.log(`Detected package manager: ${scan.project.package_manager}`);
}

function runDoctor(targetDir) {
  const projectRoot = path.resolve(process.cwd(), targetDir);

  if (!fs.existsSync(projectRoot)) {
    throw new Error(formatError(`target directory does not exist: ${projectRoot}`));
  }

  const generatedSpecs = listGeneratedSpecDirs(projectRoot);
  if (generatedSpecs.length !== 1) {
    throw new Error(formatError(`expected exactly one generated spec directory, found ${generatedSpecs.length || 0}`));
  }

  const projectSlug = generatedSpecs[0];
  const requiredFiles = [
    'README.md',
    'docs/INDEX.md',
    'docs/CONTEXTO.md',
    'docs/WORKFLOW.md',
    'docs/SUPPORT_MATRIX.md',
    'docs/TROUBLESHOOTING.md',
    'docs/TESTING_GUIDE_FOR_AI.md',
    'docs/ai/PRINCIPLES.md',
    'docs/ai/RULES.yaml',
    'docs/ai/LESSONS.md',
    `specs/${projectSlug}/SPEC.md`,
    `specs/${projectSlug}/STATUS.md`,
    `specs/${projectSlug}/EVIDENCE_REPORT.md`,
    'package.json',
    '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    '.github/ISSUE_TEMPLATE/feature_request.md',
    '.github/workflows/ci.yml',
  ];

  const requiredExecutables = [
    'tools/scripts/start-slice.sh',
    'tools/scripts/check-slice-readiness.sh',
    'tools/scripts/check-pr-readiness.sh',
    'tools/scripts/cleanup-slice.sh',
    'tools/scripts/check-scope.sh',
  ];

  const missingFiles = assertFilesExist(projectRoot, requiredFiles);
  const nonExecutableScripts = assertExecutablesExist(projectRoot, requiredExecutables);
  const pkg = loadPackageJson(projectRoot);
  const requiredScripts = ['check:slice', 'check:pr', 'start:slice', 'cleanup:slice'];
  const missingScripts = requiredScripts.filter((name) => typeof pkg.scripts?.[name] !== 'string');
  const hasScanArtifacts = fs.existsSync(path.join(projectRoot, 'docs', 'PROJECT_SCAN.json'))
    && fs.existsSync(path.join(projectRoot, 'docs', 'PROJECT_MAP.md'));

  const problems = [
    ...missingFiles.map((file) => `missing file: ${file}`),
    ...nonExecutableScripts.map((file) => `missing executable bit: ${file}`),
    ...missingScripts.map((name) => `missing package.json script: ${name}`),
  ];

  if (problems.length > 0) {
    throw new Error(formatError(`doctor failed:\n- ${problems.join('\n- ')}`));
  }

  console.log(`Quiver doctor passed for ${projectRoot}`);
  console.log(`Generated project slug: ${projectSlug}`);
  console.log('Next steps:');
  if (!hasScanArtifacts) {
    console.log('- Analyze the project first: npx create-quiver analyze --dir .');
  }
  console.log(`- Start a slice: bash tools/scripts/start-slice.sh specs/${projectSlug}/slices/slice-template/slice.json`);
  console.log('- Validate a slice: bash tools/scripts/check-slice-readiness.sh');
  console.log('- Validate the PR gate: bash tools/scripts/check-pr-readiness.sh');
}

function printInitNextSteps(targetDir, projectName) {
  const projectSlug = toProjectSlug(projectName);

  console.log('');
  console.log('Next steps:');
  console.log(`- Review ${path.join(targetDir, 'docs', 'INDEX.md')}`);
  console.log(`- Review ${path.join(targetDir, 'docs', 'WORKFLOW.md')}`);
  console.log(`- Create your first slice from ${path.join(targetDir, 'specs', projectSlug, 'slices', 'slice-template', 'slice.json')}`);
  console.log(`- Launch slice work with ${path.join(targetDir, 'tools', 'scripts', 'start-slice.sh')}`);
}

async function run(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  if (args.mode === 'analyze') {
    runAnalyze(args.targetDir);
    return;
  }

  if (args.mode === 'doctor') {
    runDoctor(args.targetDir);
    return;
  }

  const packageRoot = path.resolve(__dirname, '../..');
  const targetDir = path.resolve(process.cwd(), args.targetDir);
  const projectName = args.projectName || path.basename(targetDir) || 'Quiver Project';
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-create-'));

  try {
    ensureDir(targetDir);

    const templateRoot = packTemplate(packageRoot, tempRoot);
    copyTemplate(templateRoot, targetDir);
    runInitDocs(targetDir, projectName);

    console.log(`Installed Quiver into ${targetDir}`);
    printInitNextSteps(targetDir, projectName);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  run,
};
