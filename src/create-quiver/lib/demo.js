const fs = require('fs');
const path = require('path');
const { toProjectSlug } = require('./init-layout');

const SPEC_VIEWER_DEMO = 'spec-viewer';
const SPEC_VIEWER_PROJECT_NAME = 'Quiver Spec Viewer';
const SPEC_VIEWER_SLUG = toProjectSlug(SPEC_VIEWER_PROJECT_NAME);

function createJson(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function createSpecViewerFiles() {
  return [
    {
      path: 'package.json',
      content: createJson({
        name: SPEC_VIEWER_SLUG,
        private: true,
        version: '0.1.0',
        description: 'Small static demo app for viewing Quiver specs and slices.',
        scripts: {
          start: 'node server.js',
          validate: 'node scripts/validate-demo.js',
          'quiver:plan': 'npx create-quiver plan --spec quiver-spec-viewer',
          'quiver:graph': 'npx create-quiver graph --spec quiver-spec-viewer',
          'quiver:next': 'npx create-quiver next --spec quiver-spec-viewer',
          'quiver:evidence': 'npx create-quiver evidence',
        },
      }),
    },
    {
      path: 'README.md',
      content: `# ${SPEC_VIEWER_PROJECT_NAME}

${SPEC_VIEWER_PROJECT_NAME} is a small static demo app for testing Quiver with a real spec/slice workflow.

## Run

\`\`\`bash
npm run validate
npm start
\`\`\`

Open http://127.0.0.1:4173 after starting the server.

## Quiver workflow

- The example spec lives in \`specs/quiver-spec-viewer/SPEC.md\`.
- The mandatory documentary slice is \`slice-00-docs-foundation\`.
- The first implementation slice is \`slice-01-static-spec-viewer\`.
- Use \`npm run quiver:plan\`, \`npm run quiver:graph\`, and \`npm run quiver:next\` to inspect execution order.
- Use \`npm run quiver:evidence -- run -- npm run validate\` to capture validation evidence.
`,
    },
    {
      path: 'server.js',
      content: `const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.join(__dirname, 'src');
const port = Number(process.env.PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'text/plain; charset=utf-8' });
    response.end(content);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(\`Quiver Spec Viewer running at http://127.0.0.1:\${port}\`);
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${SPEC_VIEWER_PROJECT_NAME}</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="app-shell">
      <section class="toolbar" aria-label="Viewer controls">
        <div>
          <p class="eyebrow">Quiver demo</p>
          <h1>${SPEC_VIEWER_PROJECT_NAME}</h1>
        </div>
        <div class="actions">
          <button data-state="content">Content</button>
          <button data-state="empty">Empty</button>
          <button data-state="loading">Loading</button>
          <button data-state="error">Error</button>
        </div>
      </section>
      <section id="viewer" class="viewer" aria-live="polite"></section>
    </main>
    <script src="./app.js"></script>
  </body>
</html>
`,
    },
    {
      path: 'src/styles.css',
      content: `:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f6f7f9;
  color: #1f2933;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button {
  border: 1px solid #c8d0d9;
  border-radius: 6px;
  background: #ffffff;
  color: #243447;
  cursor: pointer;
  font: inherit;
  padding: 8px 12px;
}

button:hover,
button:focus-visible {
  border-color: #5b8def;
  outline: 2px solid #cfe0ff;
  outline-offset: 1px;
}

.app-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 20px;
}

.toolbar {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  color: #5a6b7d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 6px;
  text-transform: uppercase;
}

h1 {
  font-size: 34px;
  line-height: 1.1;
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.viewer {
  display: grid;
  gap: 16px;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(240px, 320px) 1fr;
}

.panel,
.state {
  background: #ffffff;
  border: 1px solid #d9e0e7;
  border-radius: 8px;
  padding: 18px;
}

.list {
  display: grid;
  gap: 10px;
}

.item {
  border: 1px solid #d9e0e7;
  border-radius: 6px;
  padding: 12px;
}

.item strong,
.detail h2 {
  overflow-wrap: anywhere;
}

.meta {
  color: #65758b;
  font-size: 14px;
  margin: 4px 0 0;
}

.badge {
  background: #e9f2ff;
  border-radius: 999px;
  color: #1f5fbf;
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
}

.slice-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.slice-row {
  align-items: center;
  border-top: 1px solid #e6ebf0;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding-top: 10px;
}

.state {
  min-height: 180px;
}

@media (max-width: 760px) {
  .toolbar,
  .grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }
}
`,
    },
    {
      path: 'src/app.js',
      content: `const specs = [
  {
    id: 'quiver-spec-viewer',
    title: 'Quiver Spec Viewer',
    status: 'planned',
    objective: 'Show a tiny but useful viewer for Quiver specs and slices.',
    slices: [
      { id: 'slice-00-docs-foundation', title: 'Docs foundation', status: 'completed' },
      { id: 'slice-01-static-spec-viewer', title: 'Static spec viewer', status: 'planned' },
    ],
  },
];

const viewer = document.querySelector('#viewer');

function renderContent() {
  const selected = specs[0];
  viewer.innerHTML = \`
    <div class="grid">
      <section class="panel" aria-label="Specs">
        <span class="badge">\${specs.length} spec</span>
        <div class="list">
          \${specs.map((spec) => \`
            <article class="item">
              <strong>\${spec.title}</strong>
              <p class="meta">\${spec.id} · \${spec.status}</p>
            </article>
          \`).join('')}
        </div>
      </section>
      <section class="panel detail" aria-label="Spec detail">
        <span class="badge">\${selected.status}</span>
        <h2>\${selected.title}</h2>
        <p>\${selected.objective}</p>
        <div class="slice-list">
          \${selected.slices.map((slice) => \`
            <div class="slice-row">
              <span>\${slice.id}</span>
              <strong>\${slice.status}</strong>
            </div>
          \`).join('')}
        </div>
      </section>
    </div>
  \`;
}

function renderState(state) {
  if (state === 'loading') {
    viewer.innerHTML = '<section class="state"><h2>Loading</h2><p>Reading spec metadata...</p></section>';
    return;
  }

  if (state === 'empty') {
    viewer.innerHTML = '<section class="state"><h2>No specs yet</h2><p>Create a spec with Quiver and it will appear here.</p></section>';
    return;
  }

  if (state === 'error') {
    viewer.innerHTML = '<section class="state"><h2>Could not load specs</h2><p>Check the generated spec files and validation output.</p></section>';
    return;
  }

  renderContent();
}

document.querySelectorAll('button[data-state]').forEach((button) => {
  button.addEventListener('click', () => renderState(button.dataset.state));
});

renderContent();
`,
    },
    {
      path: 'scripts/validate-demo.js',
      content: `const fs = require('node:fs');
const path = require('node:path');

const required = [
  'README.md',
  'server.js',
  'src/index.html',
  'src/styles.css',
  'src/app.js',
  'specs/quiver-spec-viewer/SPEC.md',
  'specs/quiver-spec-viewer/slices/slice-00-docs-foundation/slice.json',
  'specs/quiver-spec-viewer/slices/slice-01-static-spec-viewer/slice.json',
];

const missing = required.filter((relativePath) => !fs.existsSync(path.join(__dirname, '..', relativePath)));

if (missing.length > 0) {
  console.error(\`Missing demo files: \${missing.join(', ')}\`);
  process.exit(1);
}

console.log('Quiver Spec Viewer demo validated');
`,
    },
    {
      path: 'specs/quiver-spec-viewer/SPEC.md',
      content: `# Quiver Spec Viewer Spec

## Objective

Build a small static viewer that demonstrates how Quiver specs and slices can be represented in a simple UI.

## Scope

- Static HTML/CSS/JS app.
- Mock spec and slice data.
- Basic loading, empty, error, and content states.
- Demo documentation and validation script.

## Non-Scope

- Real browser filesystem parsing.
- Backend API.
- Heavy frontend framework.

## Slices

| Slice | Title | Status |
|---|---|---|
| slice-00-docs-foundation | Docs foundation | completed |
| slice-01-static-spec-viewer | Static spec viewer | planned |
`,
    },
    {
      path: 'specs/quiver-spec-viewer/STATUS.md',
      content: `# Quiver Spec Viewer Status

| Slice | Status |
|---|---|
| slice-00-docs-foundation | completed |
| slice-01-static-spec-viewer | planned |
`,
    },
    {
      path: 'specs/quiver-spec-viewer/EVIDENCE_REPORT.md',
      content: `# Evidence Report

| Check | Result | Notes |
|---|---|---|
| npm run validate | pending | Run after generating the demo. |
`,
    },
    {
      path: 'specs/quiver-spec-viewer/pr.md',
      content: `## Title

Quiver Spec Viewer demo

## Summary

- Adds a static Quiver spec/slice viewer demo.
- Includes mock states and validation script.
`,
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-00-docs-foundation/slice.json',
      content: createJson({
        slice_id: 'slice-00-docs-foundation',
        ticket: 'DEMO-00',
        type: 'docs',
        title: 'Docs foundation',
        objective: 'Publish demo spec, slices, handoffs, and PR body.',
        files: [
          'specs/quiver-spec-viewer/SPEC.md',
          'specs/quiver-spec-viewer/STATUS.md',
          'specs/quiver-spec-viewer/EVIDENCE_REPORT.md',
          'specs/quiver-spec-viewer/pr.md',
        ],
        depends_on: [],
        parallel_safe: 'yes',
        parallel_safe_reason: 'Documentation-only foundation slice.',
        acceptance: ['Demo documentation artifacts exist.'],
        tests: ['npm run validate'],
        status: 'completed',
      }),
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-00-docs-foundation/EXECUTION_BRIEF.md',
      content: `# EXECUTION_BRIEF - slice-00-docs-foundation

## Context

This slice publishes the demo planning artifacts.

## Objective

Keep the Quiver Spec Viewer spec, status, evidence, and PR body available in the repo.

## Checklist

- [ ] Verify spec docs exist.
- [ ] Run \`npm run validate\`.
`,
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-00-docs-foundation/CLOSURE_BRIEF.md',
      content: `# CLOSURE_BRIEF - slice-00-docs-foundation

## Summary

Pending execution notes.

## Validation

- [ ] npm run validate
`,
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-01-static-spec-viewer/slice.json',
      content: createJson({
        slice_id: 'slice-01-static-spec-viewer',
        ticket: 'DEMO-01',
        type: 'feature',
        title: 'Static spec viewer',
        objective: 'Render mocked Quiver spec and slice data in a small static app.',
        files: [
          'src/index.html',
          'src/styles.css',
          'src/app.js',
          'server.js',
          'scripts/validate-demo.js',
        ],
        depends_on: ['slice-00-docs-foundation'],
        parallel_safe: 'yes',
        parallel_safe_reason: 'Owns only demo app files after docs foundation exists.',
        acceptance: [
          'Viewer shows title, spec list, and detail.',
          'Viewer supports loading, empty, error, and content states.',
          'Demo validates with npm run validate.',
        ],
        tests: ['npm run validate'],
        status: 'planned',
      }),
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-01-static-spec-viewer/EXECUTION_BRIEF.md',
      content: `# EXECUTION_BRIEF - slice-01-static-spec-viewer

## Context

The demo is intentionally static and dependency-free.

## Objective

Implement a small viewer for mocked Quiver specs and slices.

## Checklist

- [ ] Keep the UI simple and readable.
- [ ] Do not add heavy dependencies.
- [ ] Run \`npm run validate\`.
`,
    },
    {
      path: 'specs/quiver-spec-viewer/slices/slice-01-static-spec-viewer/CLOSURE_BRIEF.md',
      content: `# CLOSURE_BRIEF - slice-01-static-spec-viewer

## Summary

Pending execution notes.

## Validation

- [ ] npm run validate
`,
    },
  ];
}

function buildDemoPlan(targetRoot, options = {}) {
  if (options.demo !== SPEC_VIEWER_DEMO) {
    throw new Error(`create-quiver: unsupported demo: ${options.demo || '(missing)'}. Supported demos: ${SPEC_VIEWER_DEMO}`);
  }

  if (fs.existsSync(targetRoot) && !fs.statSync(targetRoot).isDirectory()) {
    throw new Error(`create-quiver: demo target is not a directory: ${targetRoot}`);
  }

  const files = createSpecViewerFiles();
  const operations = files.map((file) => {
    const absolutePath = path.join(targetRoot, file.path);
    return {
      action: fs.existsSync(absolutePath) ? 'preserve' : 'create',
      path: file.path,
      absolutePath,
      content: file.content,
    };
  });

  const createCount = operations.filter((operation) => operation.action === 'create').length;
  const preserveCount = operations.length - createCount;

  return {
    demo: SPEC_VIEWER_DEMO,
    projectName: SPEC_VIEWER_PROJECT_NAME,
    targetRoot,
    operations,
    summary: {
      create: createCount,
      preserve: preserveCount,
      total: operations.length,
    },
  };
}

function formatDemoPlan(plan, options = {}) {
  const lines = [];
  const title = options.dryRun ? 'Quiver demo dry-run' : 'Quiver demo created';

  lines.push(title);
  lines.push(`- Demo: ${plan.demo}`);
  lines.push(`- Project: ${plan.projectName}`);
  lines.push(`- Target: ${plan.targetRoot}`);
  lines.push(`- Files to create: ${plan.summary.create}`);
  lines.push(`- Files to preserve: ${plan.summary.preserve}`);
  lines.push('');
  lines.push('Files to create');
  for (const operation of plan.operations.filter((item) => item.action === 'create')) {
    lines.push(`- ${operation.path}`);
  }
  if (plan.summary.create === 0) {
    lines.push('- none');
  }
  lines.push('');
  lines.push('Files to preserve');
  for (const operation of plan.operations.filter((item) => item.action === 'preserve')) {
    lines.push(`- ${operation.path}`);
  }
  if (plan.summary.preserve === 0) {
    lines.push('- none');
  }

  if (options.dryRun) {
    lines.push('');
    lines.push('No files were written.');
  } else {
    lines.push('');
    lines.push('Next commands');
    lines.push(`- cd ${plan.targetRoot}`);
    lines.push('- npm run validate');
    lines.push('- npm start');
  }

  lines.push('');
  return lines.join('\n');
}

function writeDemoPlan(plan) {
  fs.mkdirSync(plan.targetRoot, { recursive: true });

  for (const operation of plan.operations) {
    if (operation.action !== 'create') {
      continue;
    }

    fs.mkdirSync(path.dirname(operation.absolutePath), { recursive: true });
    fs.writeFileSync(operation.absolutePath, operation.content);
  }
}

module.exports = {
  SPEC_VIEWER_DEMO,
  buildDemoPlan,
  formatDemoPlan,
  writeDemoPlan,
};
