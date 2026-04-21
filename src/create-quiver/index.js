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

Options:
  -n, --name <project-name>   Project name to generate
  -d, --dir <target-dir>      Target directory to scaffold into
  -y, --yes                   Skip prompts and use the provided inputs
  -h, --help                  Show this help message

Examples:
  npx create-quiver --name "My Project"
  npx create-quiver --name "My Project" --dir ./my-project
  node bin/create-quiver.js --name "My Project" --dir ./my-project
`);
}

function parseArgs(argv) {
  const result = {
    help: false,
    force: false,
    projectName: '',
    targetDir: '.',
  };

  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      continue;
    }

    if (arg === '-y' || arg === '--yes') {
      result.force = true;
      continue;
    }

    if (arg === '-n' || arg === '--name' || arg === '--project-name') {
      const value = argv[++index];
      if (!value) {
        throw new Error(formatError('missing value for --name'));
      }
      result.projectName = value;
      continue;
    }

    if (arg === '-d' || arg === '--dir' || arg === '--target') {
      const value = argv[++index];
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

  if (!result.projectName && positional.length > 0) {
    result.projectName = positional.shift();
  }

  if (positional.length > 0) {
    result.targetDir = positional.shift();
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

function printNextSteps(targetDir, projectName) {
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
    printNextSteps(targetDir, projectName);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  run,
};
