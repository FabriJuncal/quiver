const test = require('node:test');
const assert = require('node:assert/strict');
const { prepareChatGptResearch, validateResearchReport } = require('../../src/create-quiver/lib/planning/chatgpt-research');
const { retrieveResearchCorpus } = require('../../src/create-quiver/lib/planning/research-corpus');
const { createChatGptSession } = require('../../src/create-quiver/lib/ai/chatgpt-session');
const { buildFixture, fixtureReport, fakeTransport, eventResponse, completed } = require('../../examples/chatgpt-research/fixture.cjs');
const make = (x) => prepareChatGptResearch(x.task, x.trusted_context, x.corpus);
const validate = (r, x = buildFixture()) => validateResearchReport(JSON.stringify(r), x.corpus.documents,
  retrieveResearchCorpus(x.task, x.trusted_context, x.corpus).sources, x.task.criteria);
const rejects = (fn, code) => assert.rejects(fn, (e) => e.code === code);
async function session(report = fixtureReport()) {
  const s = createChatGptSession({ hostId: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    transport: async (u, i) => u.endsWith('/responses') ? eventResponse([completed(report)]) : fakeTransport(u, i),
    verifyIdToken: async () => ({ issuer: 'https://auth.openai.com', subject: 'fixture-sub' }) });
  const url = new URL(s.begin({ redirectUri: 'http://127.0.0.1:1455/auth/callback', consent: true }).authorization_url);
  await s.complete(`http://127.0.0.1:1455/auth/callback?code=fake&state=${url.searchParams.get('state')}&client_id=oaiapp_test`);
  await s.models(); return s;
}
test('full simulated workflow verifies exact citations but never semantic truth or acceptance', async () => {
  const x = buildFixture(); const before = structuredClone(x); const s = await session(); const r = make(x);
  const review = r.review(s, 'fictional-model');
  const result = await r.run(s, { ...review, discloseCorpus: true, creditsDisabledConfirmed: true });
  assert.equal(result.inference, 'simulated'); assert.equal(result.citation_integrity, 'verified');
  assert.equal(result.semantic_verification, 'human-review-required'); assert.equal(result.accepted, false);
  assert.equal(result.claims[0].assessment, 'conflicting'); assert.deepEqual(x, before);
  await rejects(() => r.run(s, { ...review, discloseCorpus: true, creditsDisabledConfirmed: true }), 'REVIEW_ALREADY_USED');
});
test('approval binds model/account/corpus and rejects no disclosure without consuming review', async () => {
  const s = await session(); const r = make(buildFixture()); const review = r.review(s, 'fictional-model');
  await rejects(() => r.run(s, { ...review, discloseCorpus: false }), 'RESEARCH_CONSENT_REQUIRED');
  await rejects(() => r.run(s, { ...review, model: 'different', discloseCorpus: true }), 'RESEARCH_CONSENT_REQUIRED');
  const altered = buildFixture(); altered.task.objective += ' changed';
  assert.throws(() => make(altered), { code: 'STALE_PLAN_BINDING' });
  assert.equal(s.status().requests, 0);
});
test('source mutation after preparation cannot change reviewed or sent snapshot', async () => {
  const x = buildFixture(); const r = make(x); x.corpus.documents[0].text = 'injected';
  const s = await session(); const review = r.review(s, 'fictional-model');
  const result = await r.run(s, { ...review, discloseCorpus: true, creditsDisabledConfirmed: true });
  assert.equal(result.claims[0].citations[0].quote, 'Retention is 30 days.');
});
for (const [name, mutate, code] of [
  ['changed bytes', (x) => { x.corpus.documents[0].text += 'changed'; }, 'SOURCE_BYTES_MISMATCH'],
  ['missing grant', (x) => { x.trusted_context.permissions.grants = []; }, 'PLAN_NOT_ELIGIBLE'],
  ['extra corpus', (x) => { x.corpus.documents.push({ resource_id: 'extra', text: 'extra' }); }, 'SOURCE_SET_MISMATCH'],
]) test(`existing planner restrictions preserved: ${name}`, () => {
  const x = buildFixture(); mutate(x); assert.throws(() => make(x), { code });
});
for (const [name, mutate, code] of [
  ['invented hash', (r) => { r.claims[0].citations[0].source_sha256 = 'sha256:invented'; }, 'INVALID_CITATION'],
  ['invented source', (r) => { r.claims[0].citations[0].resource_id = 'outside'; }, 'INVALID_CITATION'],
  ['invented quote', (r) => { r.claims[0].citations[0].quote = 'Retention is 7 days.'; }, 'INVALID_CITATION'],
  ['wrong line', (r) => { r.claims[0].citations[0].start_line = 1; }, 'INVALID_CITATION'],
  ['out of bounds', (r) => { r.claims[0].citations[0].end_line = 999; }, 'INVALID_CITATION'],
  ['floating line', (r) => { r.claims[0].citations[0].start_line = 1.5; }, 'INVALID_CITATION'],
  ['duplicate citation', (r) => { r.claims[0].citations.push(r.claims[0].citations[0]); }, 'DUPLICATE_CITATION'],
  ['one-sided conflict', (r) => { r.claims[0].citations.pop(); }, 'MISSING_CONFLICT_SOURCES'],
  ['unsupported claim', (r) => { r.claims[0].assessment = 'supported'; r.claims[0].citations = []; }, 'MISSING_CITATION'],
  ['invented criterion', (r) => { r.claims[0].criterion_id = 'invented'; }, 'INVALID_REPORT'],
  ['acceptance injection', (r) => { r.accepted = true; }, 'INVALID_REPORT'],
  ['missing uncertainty', (r) => { r.uncertainty = []; }, 'INVALID_REPORT'],
  ['oversized claim', (r) => { r.claims[0].text = 'x'.repeat(2001); }, 'INVALID_REPORT'],
]) test(`reject report ${name}`, () => {
  const r = fixtureReport(); mutate(r); assert.throws(() => validate(r), { code });
});
test('uncertainty may explicitly carry insufficient evidence without pretending support', () => {
  const r = fixtureReport(); r.claims[0].assessment = 'insufficient'; r.claims[0].citations = [];
  r.claims[0].text = 'The supplied corpus cannot establish which policy is current.';
  assert.deepEqual(validate(r), r);
});
test('invalid generated citations reject the whole report, not partial success', async () => {
  const r = fixtureReport(); r.claims[0].citations[0].quote = 'invented';
  const s = await session(r); const research = make(buildFixture()); const review = research.review(s, 'fictional-model');
  await rejects(() => research.run(s, { ...review, discloseCorpus: true, creditsDisabledConfirmed: true }), 'INVALID_CITATION');
});
test('malformed JSON and markdown fences rejected', () => {
  const x = buildFixture();
  for (const raw of ['{', '```json\n{}\n```', 'null', '[]']) assert.throws(() => validateResearchReport(raw, x.corpus.documents, [], x.task.criteria), { code: 'INVALID_REPORT' });
});
