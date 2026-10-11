const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createChatGptSession, startLoopbackSignIn, verifyOpenAiIdToken } = require('../../src/create-quiver/lib/ai/chatgpt-session');
const { fakeTransport, completed, fixtureReport, eventResponse } = require('../../examples/chatgpt-research/fixture.cjs');
const hostId = 'urn:uuid:00000000-0000-4000-8000-000000000001';
const cb = 'http://127.0.0.1:1455/auth/callback';
const identity = async () => ({ issuer: 'https://auth.openai.com', subject: 'fixture-sub' });
const make = (extra = {}) => createChatGptSession({ hostId, transport: fakeTransport, verifyIdToken: identity, ...extra });
const rejects = (fn, code) => assert.rejects(fn, (e) => e.code === code);
function begin(s, options = {}) {
  const x = s.begin({ redirectUri: cb, consent: true, ...options });
  const url = new URL(x.authorization_url);
  return { url, callback: `${cb}?code=fictional&state=${url.searchParams.get('state')}&client_id=oaiapp_test` };
}
async function connect(s) { await s.complete(begin(s).callback); await s.models(); }
const request = { model: 'fictional-model', input: [{ role: 'user', content: 'fictional' }],
  instructions: 'fixture', consent: true, creditsDisabledConfirmed: true };

test('default networking is disabled; begin requires separate consent', async () => {
  const s = createChatGptSession({ hostId });
  assert.throws(() => s.begin({ redirectUri: cb }), { code: 'CONNECTION_CONSENT_REQUIRED' });
  await rejects(() => s.complete(begin(s).callback), 'NETWORK_DISABLED');
  assert.equal(s.accounts().length, 0);
});
test('registration uses fresh state/nonce, stable host and S256; exact code exchange', async () => {
  const calls = []; let verifierOptions;
  const s = make({ transport: async (url, init) => { calls.push([url, init]); return fakeTransport(url, init); },
    verifyIdToken: async (token, options) => { verifierOptions = options; return identity(); } });
  const x = begin(s); const p = x.url.searchParams;
  assert.equal(p.get('client_id'), 'dynamic_agent_client'); assert.equal(p.get('agent_name_hint'), 'Quiver');
  assert.equal(p.get('ext_agent_host_id'), hostId); assert.equal(p.get('resource'), 'https://api.openai.com/v1');
  await s.complete(x.callback);
  const form = new URLSearchParams(calls[0][1].body);
  assert.equal(form.get('client_id'), 'oaiapp_test'); assert.equal(form.get('redirect_uri'), cb);
  assert.equal(form.get('resource'), p.get('resource'));
  assert.equal(createHash('sha256').update(form.get('code_verifier')).digest('base64url'), p.get('code_challenge'));
  assert.equal(verifierOptions.nonce, p.get('nonce'));
  const returning = begin(s, { clientId: 'oaiapp_test' }).url;
  assert.equal(returning.searchParams.get('agent_name_hint'), null);
  assert.notEqual(returning.searchParams.get('state'), p.get('state'));
  assert.equal(returning.searchParams.get('id_token_hint'), null);
  s.cancel();
});
for (const uri of ['http://localhost:1455/auth/callback', 'https://127.0.0.1:1455/auth/callback',
  'http://127.0.0.1:1455/callback', 'http://127.0.0.1:1455/auth/callback?x=1', 'http://user@127.0.0.1:1455/auth/callback']) {
  test(`reject unsafe redirect ${uri}`, () => assert.throws(() => make().begin({ consent: true, redirectUri: uri }), { code: 'INVALID_CALLBACK_URI' }));
}
test('bad/duplicate state and wrong host do not consume a valid callback; replay rejected', async () => {
  const s = make(); const x = begin(s);
  for (const bad of [x.callback.replace('state=', 'state=bad'), `${x.callback}&state=duplicate`, x.callback.replace('127.0.0.1', 'localhost')]) {
    await rejects(() => s.complete(bad), 'INVALID_CALLBACK');
  }
  await s.complete(x.callback); await rejects(() => s.complete(x.callback), 'NO_PENDING_SIGN_IN');
});
test('declined consent never exchanges code; expiry and cancellation fail closed', async () => {
  let time = 0; let calls = 0;
  const s = make({ now: () => time, transport: async (...args) => { calls++; return fakeTransport(...args); } });
  let x = begin(s); await rejects(() => s.complete(`${x.callback}&error=access_denied`), 'CONSENT_DECLINED');
  x = begin(s); time = 300001; await rejects(() => s.complete(x.callback), 'SIGN_IN_EXPIRED');
  x = begin(s); s.cancel(); await rejects(() => s.complete(x.callback), 'NO_PENDING_SIGN_IN');
  assert.equal(calls, 0);
});
test('dynamic placeholder and missing issued id rejected before exchange', async () => {
  for (const replacement of ['dynamic_agent_client', '']) {
    const s = make(); await rejects(() => s.complete(begin(s).callback.replace('oaiapp_test', replacement)), 'INVALID_CLIENT_ID');
  }
});
test('returning account identity and client cannot be silently replaced', async () => {
  const s = make(); await connect(s);
  let x = begin(s, { clientId: 'oaiapp_test' });
  await rejects(() => s.complete(x.callback.replace('oaiapp_test', 'oaiapp_other')), 'INVALID_CLIENT_ID');
  assert.equal(s.accounts()[0].connected, true);
  const other = make({ registrations: [{ client_id: 'oaiapp_test', subject: 'original', issuer: 'https://auth.openai.com' }] });
  x = begin(other, { clientId: 'oaiapp_test' });
  await rejects(() => other.complete(x.callback), 'ACCOUNT_MISMATCH');
});
test('validated credentials never appear in public status/account objects; two registrations remain separate', async () => {
  const s = make(); await connect(s);
  await s.complete(begin(s).callback.replace('oaiapp_test', 'oaiapp_second'));
  const visible = JSON.stringify({ ...s, accounts: s.accounts(), status: s.status() });
  for (const secret of ['fictional-access', 'fictional-refresh', 'fictional-id']) assert.equal(visible.includes(secret), false);
  assert.equal(s.accounts().length, 2); assert.equal(s.accounts().filter((a) => a.active).length, 1);
});
test('missing granted inference scopes disables use regardless of callback scopes', async () => {
  const s = make({ transport: async (url) => {
    const r = await fakeTransport(url); if (!url.endsWith('/oauth/token')) return r;
    return Response.json({ ...await r.json(), scope: 'openid profile email offline_access' });
  } });
  await s.complete(begin(s).callback + '&scope=chatgpt.tokens.use.direct');
  assert.equal(s.accounts()[0].plan_enabled, false);
  await rejects(() => s.models(), 'PLAN_PERMISSION_REQUIRED');
});
test('invalid signed identity or token shape cannot create an account', async () => {
  const s = make({ verifyIdToken: async () => { throw Object.assign(new Error('INVALID_ID_TOKEN'), { code: 'INVALID_ID_TOKEN' }); } });
  await rejects(() => s.complete(begin(s).callback), 'INVALID_ID_TOKEN'); assert.equal(s.accounts().length, 0);
  const bad = make({ transport: async (url) => url.endsWith('/oauth/token') ? Response.json({ access_token: 'bad' }) : fakeTransport(url) });
  await rejects(() => bad.complete(begin(bad).callback), 'INVALID_TOKEN_RESPONSE');
});
test('real signature verification rejects wrong key, audience, nonce, expiry, issuer and authorized party', async () => {
  const { generateKeyPair, exportJWK, SignJWT } = await import('jose');
  const key = await generateKeyPair('RS256'); const wrong = await generateKeyPair('RS256');
  const jwks = { keys: [{ ...await exportJWK(key.publicKey), kid: 'test-key' }] };
  const seconds = Math.floor(Date.now() / 1000);
  const base = { iss: 'https://auth.openai.com', aud: 'oaiapp_test', sub: 'test-sub', nonce: 'test-nonce', iat: seconds, exp: seconds + 120 };
  const sign = (p, k = key.privateKey) => new SignJWT(p).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(k);
  const options = { clientId: 'oaiapp_test', nonce: 'test-nonce', jwks, now: Date.now() };
  assert.equal((await verifyOpenAiIdToken(await sign(base), options)).subject, 'test-sub');
  for (const patch of [{ aud: 'other' }, { iss: 'https://example.invalid' }, { nonce: 'other' }, { exp: seconds - 30 }, { azp: 'other' }]) {
    await rejects(() => sign({ ...base, ...patch }).then((jwt) => verifyOpenAiIdToken(jwt, options)), 'INVALID_ID_TOKEN');
  }
  await rejects(() => sign(base, wrong.privateKey).then((jwt) => verifyOpenAiIdToken(jwt, options)), 'INVALID_ID_TOKEN');
});
test('inference uses only documented body and exact public endpoint; no ambient API key', async () => {
  const calls = []; const s = make({ transport: async (u, i) => { calls.push([u, i]); return fakeTransport(u, i); } });
  await connect(s); await s.infer(request);
  const [url, init] = calls.at(-1); assert.equal(url, 'https://api.openai.com/v1/responses');
  assert.deepEqual(Object.keys(JSON.parse(init.body)).sort(), ['input', 'instructions', 'model', 'store', 'stream']);
  assert.equal(JSON.parse(init.body).store, false); assert.equal(JSON.parse(init.body).stream, true);
  assert.equal(init.headers.Authorization, 'Bearer fictional-access'); assert.equal(init.redirect, 'error');
});
test('inference requires model selection, disclosure consent and credits acknowledgement', async () => {
  const s = make(); await connect(s);
  await rejects(() => s.infer({ ...request, consent: false }), 'USAGE_CONSENT_REQUIRED');
  await rejects(() => s.infer({ ...request, creditsDisabledConfirmed: false }), 'USAGE_CONSENT_REQUIRED');
  await rejects(() => s.infer({ ...request, model: 'invented' }), 'MODEL_NOT_SELECTED');
  await rejects(() => s.infer({ ...request, input: [{ role: 'system', content: 'bad' }] }), 'INVALID_INFERENCE_INPUT');
});
for (const [label, response, expected] of [
  ['quota before stream', () => Response.json({ error: { code: 'subscription_sharing_usage_limit_exceeded' } }, { status: 429 }), 'subscription_sharing_usage_limit_exceeded'],
  ['quota after delta', () => eventResponse([{ type: 'response.output_text.delta', delta: 'partial' }, { type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } } }]), 'subscription_sharing_usage_limit_exceeded'],
  ['temporary unavailable', () => Response.json({ error: { code: 'subscription_sharing_usage_unavailable' } }, { status: 503 }), 'subscription_sharing_usage_unavailable'],
  ['admission detail', () => Response.json({ detail: 'untrusted private diagnostic' }, { status: 403 }), 'REMOTE_REQUEST_FAILED'],
  ['incomplete', () => eventResponse([{ type: 'response.incomplete' }]), 'RESPONSE_INCOMPLETE'],
  ['interrupted', () => eventResponse([{ type: 'response.output_text.delta', delta: 'partial' }]), 'STREAM_INTERRUPTED'],
  ['malformed', () => new Response('data: not-json\n\n', { headers: { 'content-type': 'text/event-stream' } }), 'INVALID_STREAM'],
]) {
  test(`${label}: no automatic retry or partial success`, async () => {
    let calls = 0; const s = make({ transport: async (u, i) => {
      if (u.endsWith('/responses')) { calls++; return response(); } return fakeTransport(u, i);
    } }); await connect(s);
    await rejects(() => s.infer(request), expected); assert.equal(calls, 1);
    if (label.startsWith('quota')) { await rejects(() => s.infer(request), 'USAGE_PAUSED'); assert.equal(calls, 1); }
  });
}
test('cancel a quiet stream and enforce one concurrent request', async () => {
  let opened; const ready = new Promise((resolve) => { opened = resolve; });
  const s = make({ transport: async (u, i) => {
    if (u.endsWith('/responses')) { opened(); return new Response(new ReadableStream({}), { headers: { 'content-type': 'text/event-stream' } }); }
    return fakeTransport(u, i);
  } }); await connect(s);
  const c = new AbortController(); const pending = s.infer({ ...request, signal: c.signal }); await ready;
  await rejects(() => s.infer(request), 'OPERATION_IN_PROGRESS'); c.abort();
  await rejects(() => pending, 'CANCELLED_OR_TIMED_OUT');
});
test('local three-request reservation cannot be exceeded', async () => {
  const s = make(); await connect(s); for (let i = 0; i < 3; i++) await s.infer(request);
  await rejects(() => s.infer(request), 'LOCAL_REQUEST_LIMIT');
});
test('refresh is serialized, rotates credentials and never retries unusable token', async () => {
  let now = 0; let refresh = 0; let unusable = false;
  const s = make({ now: () => now, transport: async (u, i) => {
    if (u.endsWith('/oauth/token') && new URLSearchParams(i.body).get('grant_type') === 'refresh_token') {
      refresh++; if (unusable) return Response.json({ error: 'invalid_grant' }, { status: 400 });
      const body = await (await fakeTransport(u)).json(); return Response.json({ ...body, access_token: 'rotated', refresh_token: 'rotated-refresh' });
    } return fakeTransport(u, i);
  } }); await connect(s); now = 3590000;
  await Promise.all([s.models(), s.models()]); assert.equal(refresh, 1);
  now += 3590000; unusable = true;
  await rejects(() => s.models(), 'invalid_grant'); assert.equal(refresh, 2);
  await rejects(() => s.models(), 'SIGN_IN_REQUIRED'); assert.equal(refresh, 2);
});
test('signout always clears tokens and retains public registration; failed revocation is explicit', async () => {
  const s = make(); await connect(s);
  assert.equal((await s.signOut()).remote_revocation, 'unconfirmed');
  assert.equal(s.accounts()[0].connected, false); assert.equal(s.accounts()[0].client_id, 'oaiapp_test');
  await rejects(() => s.models(), 'SIGN_IN_REQUIRED');
});
test('revocation uses discovery on auth origin only and confirms empty 200', async () => {
  const calls = [];
  const s = make({ transport: async (u, i) => {
    calls.push([u, i]);
    if (u.endsWith('openid-configuration')) return Response.json({ revocation_endpoint: 'https://auth.openai.com/test-revoke' });
    if (u.endsWith('test-revoke')) return new Response(null, { status: 200 });
    return fakeTransport(u, i);
  } }); await connect(s); assert.equal((await s.signOut()).remote_revocation, 'confirmed');
  assert.equal(new URLSearchParams(calls.at(-1)[1].body).get('token'), 'fictional-refresh');
});
test('loopback listener rejects forged Host and state then handles legitimate callback', async () => {
  const s = make(); const flow = await startLoopbackSignIn(s, { consent: true });
  const auth = new URL(flow.authorization_url); const uri = auth.searchParams.get('redirect_uri');
  assert.equal(new URL(uri).hostname, '127.0.0.1');
  const bad = await fetch(`${uri}?state=wrong`, { headers: { Host: 'evil.invalid' } }); assert.equal(bad.status, 400);
  const wrong = await fetch(`${uri}?state=wrong`); assert.equal(wrong.status, 400);
  const good = await fetch(`${uri}?state=${auth.searchParams.get('state')}&code=fake&client_id=oaiapp_test`);
  assert.equal(good.status, 200); assert.equal((await flow.result).connected, true);
});
test('loopback cancellation closes the pending attempt', async () => {
  const s = make(); const flow = await startLoopbackSignIn(s, { consent: true }); flow.cancel();
  await rejects(() => flow.result, 'CANCELLED');
});

for (const operation of ['infer', 'models']) {
  test(`immediate cancellation prevents ${operation} transmission`, async () => {
    let calls = 0;
    const s = make({ transport: async (u, i) => { calls++; return fakeTransport(u, i); } });
    await connect(s); const before = calls;
    const pending = operation === 'infer' ? s.infer(request) : s.models();
    s.cancel(); await rejects(() => pending, 'CANCELLED');
    assert.equal(calls, before); assert.equal(s.status().requests, 0);
  });
}

test('extra callback cannot cancel an exchange already in progress', async () => {
  let release; let entered; const ready = new Promise((r) => { entered = r; });
  const s = make({ transport: async (u, i) => {
    if (u.endsWith('/oauth/token')) { entered(); await new Promise((r) => { release = r; }); }
    return fakeTransport(u, i);
  } });
  const flow = await startLoopbackSignIn(s, { consent: true });
  try {
    const auth = new URL(flow.authorization_url); const uri = auth.searchParams.get('redirect_uri');
    const good = fetch(`${uri}?state=${auth.searchParams.get('state')}&code=fake&client_id=oaiapp_test`);
    await ready;
    assert.equal((await fetch(`${uri}?state=wrong`)).status, 409);
    release(); assert.equal((await good).status, 200);
    assert.equal((await flow.result).connected, true);
  } finally { release?.(); flow.cancel(); }
});

test('invalid grant retains issued ID for a fresh explicitly started attempt, never retries code', async () => {
  let calls = 0;
  const s = make({ transport: async () => { calls++; return Response.json({ error: 'invalid_grant' }, { status: 400 }); } });
  await rejects(() => s.complete(begin(s).callback), 'invalid_grant'); assert.equal(calls, 1);
  const retry = begin(s).url;
  assert.equal(retry.searchParams.get('client_id'), 'oaiapp_test');
  assert.equal(retry.searchParams.has('agent_name_hint'), false); assert.equal(s.accounts().length, 0); s.cancel();
});
test('cancel during identity validation never installs late credentials', async () => {
  let release; let entered; const ready = new Promise((r) => { entered = r; });
  const s = make({ verifyIdToken: async () => { entered(); await new Promise((r) => { release = r; }); return identity(); } });
  const pending = s.complete(begin(s).callback); await ready; s.cancel(); release();
  await rejects(() => pending, 'CANCELLED'); assert.equal(s.accounts().length, 0);
});
test('transport diagnostics never leak synthetic credentials through thrown errors', async () => {
  const s = make({ transport: async () => { throw Object.assign(new Error('fictional-refresh-secret'), { code: 'REMOTE_REQUEST_FAILED' }); } });
  await assert.rejects(() => s.complete(begin(s).callback), (e) => e.code === 'REMOTE_REQUEST_FAILED' && !e.message.includes('secret'));
});
test('discovery cannot redirect a refresh credential to a different origin', async () => {
  let leaked = false;
  const s = make({ transport: async (u, i) => {
    if (u.endsWith('openid-configuration')) return Response.json({ revocation_endpoint: 'https://evil.invalid/revoke' });
    if (u.startsWith('https://evil.invalid')) leaked = true;
    return fakeTransport(u, i);
  } }); await connect(s); assert.equal((await s.signOut()).remote_revocation, 'unconfirmed'); assert.equal(leaked, false);
});
test('oversized request fails before transmission and model catalog excludes hidden entries', async () => {
  let inference = 0;
  const s = make({ transport: async (u, i) => {
    if (u.endsWith('/responses')) inference++;
    if (u.endsWith('/models')) return Response.json({ models: [{ slug: 'hidden', display_name: 'Hidden', visibility: 'hidden' },
      { slug: 'fictional-model', display_name: 'Fixture', visibility: 'list' }] });
    return fakeTransport(u, i);
  } }); await connect(s);
  assert.deepEqual((await s.models()).map((m) => m.slug), ['fictional-model']);
  await rejects(() => s.infer({ ...request, input: [{ role: 'user', content: 'x'.repeat(100000) }] }), 'INVALID_INFERENCE_INPUT');
  assert.equal(inference, 0);
});
test('SSE handles split UTF-8 and CRLF frames without trusting partial text', async () => {
  const data = Buffer.from(`data: ${JSON.stringify(completed({ label: 'café' }))}\r\n\r\n`);
  const s = make({ transport: async (u, i) => {
    if (!u.endsWith('/responses')) return fakeTransport(u, i);
    return new Response(new ReadableStream({ start(controller) {
      for (const byte of data) controller.enqueue(Uint8Array.of(byte)); controller.close();
    } }), { headers: { 'content-type': 'text/event-stream' } });
  } }); await connect(s); assert.deepEqual(JSON.parse((await s.infer(request)).text), { label: 'café' });
});
