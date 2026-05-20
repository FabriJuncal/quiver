const fs = require('fs');
const path = require('path');

function resolvePackagedTemplateRoot(packageRoot = path.resolve(__dirname, '../../..')) {
  return packageRoot;
}

function resolveExportedTemplateRoot(projectRoot) {
  return path.join(projectRoot, '.quiver', 'templates');
}

function resolveLegacyTemplateRoot(projectRoot) {
  return path.join(projectRoot, 'docs-template');
}

function templateRootExists(templateRoot) {
  return fs.existsSync(path.join(templateRoot, 'docs'))
    && fs.existsSync(path.join(templateRoot, 'specs'))
    && fs.existsSync(path.join(templateRoot, 'package.template.json'));
}

function resolveTemplateRoot(projectRoot, options = {}) {
  const packageRoot = options.packageRoot || resolvePackagedTemplateRoot();
  const candidates = [];

  if (options.preferExported === true) {
    candidates.push({
      kind: 'exported',
      path: resolveExportedTemplateRoot(projectRoot),
    });
  }

  candidates.push({
    kind: 'packaged',
    path: resolvePackagedTemplateRoot(packageRoot),
  });

  candidates.push({
    kind: 'legacy',
    path: resolveLegacyTemplateRoot(projectRoot),
  });

  for (const candidate of candidates) {
    if (templateRootExists(candidate.path)) {
      return candidate;
    }
  }

  const searched = candidates.map((candidate) => `${candidate.kind}: ${candidate.path}`).join(', ');
  throw new Error(`create-quiver: missing Quiver templates. Searched ${searched}`);
}

function resolveTemplatePath(projectRoot, relativePath, options = {}) {
  const root = resolveTemplateRoot(projectRoot, options);
  const templatePath = path.join(root.path, relativePath);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`create-quiver: missing template ${relativePath} in ${root.path}`);
  }

  return {
    ...root,
    templatePath,
  };
}

module.exports = {
  resolveExportedTemplateRoot,
  resolveLegacyTemplateRoot,
  resolvePackagedTemplateRoot,
  resolveTemplatePath,
  resolveTemplateRoot,
  templateRootExists,
};
