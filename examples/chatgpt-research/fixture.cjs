const { createHash } = require('node:crypto');
const { planDryRun } = require('../../src/create-quiver/lib/planning/dry-run');
const seed = require('../planning-dry-run/research.json');
function buildFixture() {
  const x = structuredClone(seed);
  const texts = [
    'Fictional Delta v1 policy.\nRetention is 30 days.\nNo effective date is supplied.\n',
    'Fictional Delta v1 policy.\nRetention is 90 days.\nNo effective date is supplied.\n',
  ];
  x.task.objective = 'Compare retention claims in the supplied fictional Delta v1 policies.';
  x.task.criteria = [{ id: 'AC-01', text: 'Describe the disagreement and uncertainty without choosing an authoritative source.' }];
  x.task.inputs = texts.map((s, i) => ({ id: `input-${i + 1}`, resource_id: `resource-${i + 1}`,
    sha256: `sha256:${createHash('sha256').update(s).digest('hex')}` }));
  x.task.actions[0].input_ids = x.task.inputs.map((r) => r.id);
  x.task.actions[0].criterion_ids = ['AC-01'];
  x.trusted_context.resources = x.task.inputs.map((r, i) => ({ resource_id: r.resource_id,
    path: `authored/policy-${i + 1}.md`, classification: 'ordinary', sha256: r.sha256,
    size_bytes: Buffer.byteLength(texts[i]) }));
  x.trusted_context.permissions.grants = x.task.inputs.map((r) => ({ capability: 'research.compare', resource_id: r.resource_id }));
  x.corpus = { schema_version: 1, expected_plan_binding: planDryRun(x.task, x.trusted_context).binding,
    documents: texts.map((s, i) => ({ resource_id: `resource-${i + 1}`, text: s })),
    queries: [{ id: 'q1', action_id: 'action-1', criterion_id: 'AC-01', term: 'Retention' }] };
  return x;
}
function fixtureReport(x = buildFixture()) {
  return { claims: [{ criterion_id: 'AC-01', text: 'The two supplied Delta v1 sources disagree: 30 versus 90 days.',
    assessment: 'conflicting', citations: x.task.inputs.map((r, i) => ({ resource_id: r.resource_id,
      source_sha256: r.sha256, start_line: 2, end_line: 2, quote: x.corpus.documents[i].text.split('\n')[1] })) }],
  uncertainty: ['Neither supplied document gives an effective date; authority and current policy remain undetermined.'] };
}
function completed(report) {
  return { type: 'response.completed', response: { status: 'completed', output: [
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(report) }] },
  ] } };
}
function eventResponse(events) {
  return new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } });
}
function fakeTransport(_url) {
  if (_url.endsWith('/oauth/token')) return Promise.resolve(Response.json({ token_type: 'Bearer',
    access_token: 'fictional-access', refresh_token: 'fictional-refresh', id_token: 'fictional-id',
    scope: 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct', expires_in: 3600 }));
  if (_url.endsWith('/jwks.json')) return Promise.resolve(Response.json({ keys: [] }));
  if (_url.endsWith('/models')) return Promise.resolve(Response.json({ models: [{ slug: 'fictional-model', display_name: 'Simulated model', visibility: 'list' }] }));
  if (_url.endsWith('/responses')) return Promise.resolve(eventResponse([completed(fixtureReport())]));
  throw new Error('Unexpected simulated route');
}
module.exports = { buildFixture, fixtureReport, completed, eventResponse, fakeTransport };
