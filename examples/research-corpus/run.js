// Only reads this example's two authored fixtures; accepts no path or command.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { planDryRun } = require('../../src/create-quiver/lib/planning/dry-run');
const { retrieveResearchCorpus } = require('../../src/create-quiver/lib/planning/research-corpus');

function buildExample() {
  const request = JSON.parse(JSON.stringify(require('../planning-dry-run/research.json')));
  const { task, trusted_context: context } = request;
  const documents = ['alpha', 'beta'].map((name, i) => {
    const bytes = fs.readFileSync(path.join(__dirname, `source-${name}.md`));
    const text = bytes.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(bytes)) throw new Error('Fixture must be UTF-8');
    return { resource_id: `resource-${i + 1}`, text };
  });
  task.objective = 'Locate literal terms in two authored demonstration sources';
  task.criteria = ['TypeScript', 'Node.js', 'PostgreSQL'].map((term, i) => ({ id: `AC-${i + 1}`, text: `Locate the literal term ${term}; do not infer semantic support` }));
  task.inputs = documents.map((d, i) => ({ id: `input-${i + 1}`, resource_id: d.resource_id,
    sha256: `sha256:${crypto.createHash('sha256').update(d.text, 'utf8').digest('hex')}` }));
  task.actions[0].input_ids = task.inputs.map((i) => i.id);
  task.actions[0].criterion_ids = task.criteria.map((c) => c.id);
  context.resources = task.inputs.map((ref, i) => ({ resource_id: ref.resource_id,
    path: `examples/research-corpus/source-${i === 0 ? 'alpha' : 'beta'}.md`, classification: 'ordinary',
    sha256: ref.sha256, size_bytes: Buffer.byteLength(documents[i].text, 'utf8') }));
  context.permissions.grants = documents.map((d) => ({ capability: 'research.compare', resource_id: d.resource_id }));
  const corpus = { schema_version: 1, expected_plan_binding: planDryRun(task, context).binding, documents,
    queries: ['TypeScript', 'Node.js', 'PostgreSQL'].map((term, i) => ({ id: `query-${i + 1}`, action_id: 'action-1', criterion_id: `AC-${i + 1}`, term })) };
  // Opt-in is appropriate only because these two fixtures are authored public examples.
  return { task, trusted_context: context, corpus, host_options: { include_quotes: true } };
}

if (require.main === module) {
  const request = buildExample();
  process.stdout.write(`${JSON.stringify(retrieveResearchCorpus(request.task, request.trusted_context, request.corpus, request.host_options), null, 2)}\n`);
}
module.exports = { buildExample };
