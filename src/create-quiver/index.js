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
  npx create-quiver doctor [options]

Options:
  -n, --name <project-name>   Project name to generate
  -d, --dir <target-dir>      Target directory to scaffold into or inspect
  -y, --yes                   Skip prompts and use the provided inputs
  -h, --help                  Show this help message

Examples:
  npx create-quiver --name "My Project"
  npx create-quiver --name "My Project" --dir ./my-project
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
  if (args[0] === 'doctor') {
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
  console.log(`- Run ${path.join(projectRoot, 'tools', 'scripts', 'start-slice.sh')} ${path.join(projectRoot, 'specs', projectSlug, 'slices', 'slice-template', 'slice.json')}`);
  console.log(`- Validate a slice with ${path.join(projectRoot, 'tools', 'scripts', 'check-slice-readiness.sh')}`);
  console.log(`- Validate the PR gate with ${path.join(projectRoot, 'tools', 'scripts', 'check-pr-readiness.sh')}`);
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
