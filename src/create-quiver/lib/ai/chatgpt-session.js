// Optional local OSS client. No import-time IO, inherited credentials or billing fallback.
const { randomBytes, timingSafeEqual } = require('node:crypto');
const http = require('node:http');
const ISSUER = 'https://auth.openai.com';
const AUTHORIZE = `${ISSUER}/api/accounts/authorize`;
const TOKEN = `${ISSUER}/api/accounts/oauth/token`;
const RESOURCE = 'https://api.openai.com/v1';
const SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const USAGE_URL = 'https://chatgpt.com/settings/usage';
const knownCodes = new Set(['invalid_grant', 'invalid_client', 'invalid_refresh_token', 'token_expired',
  'refresh_token_expired', 'refresh_token_invalidated', 'refresh_token_reused',
  'subscription_sharing_user_not_eligible', 'subscription_sharing_usage_limit_exceeded',
  'subscription_sharing_usage_unavailable', 'subscription_sharing_unsupported_capability',
  'subscription_sharing_route_not_supported', 'subscription_sharing_invalid_user',
  'chatpass_v2_scope_not_authorized', 'chatpass_v2_invalid_authorization_context',
  'subscription_sharing_user_unavailable']);
const terminalRefresh = new Set(['invalid_grant', 'invalid_refresh_token', 'token_expired',
  'refresh_token_expired', 'refresh_token_invalidated', 'refresh_token_reused']);
function fail(code, status) {
  const error = new Error(code); error.code = code;
  if (status) error.status = status;
  return error;
}
function equal(a, b) {
  return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b)
    && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function requiredString(v, max = 8192) {
  return typeof v === 'string' && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v);
}
function issued(v) { return requiredString(v, 256) && /^oaiapp_[A-Za-z0-9_-]+$/.test(v); }
async function readBounded(response, limit) {
  if (!response.body) throw fail('EMPTY_RESPONSE');
  const reader = response.body.getReader(); let size = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > limit) throw fail('RESPONSE_TOO_LARGE');
      chunks.push(Buffer.from(value));
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } finally { await reader.cancel().catch(() => {}); }
}
function errorCode(body) {
  const value = body?.error?.code || (typeof body?.error === 'string' ? body.error : null);
  return knownCodes.has(value) ? value : 'REMOTE_REQUEST_FAILED';
}

async function verifyOpenAiIdToken(token, { clientId, nonce, jwks, now }) {
  const { jwtVerify, createLocalJWKSet } = await import('jose');
  try {
    const { payload } = await jwtVerify(token, createLocalJWKSet(jwks), {
      issuer: ISSUER, audience: clientId, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'nonce'], currentDate: new Date(now),
    });
    if (!equal(payload.nonce, nonce) || !requiredString(payload.sub, 256)
      || (payload.azp !== undefined && payload.azp !== clientId)
      || (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== clientId)) {
      throw fail('INVALID_ID_TOKEN');
    }
    return { subject: payload.sub, issuer: payload.iss,
      email: requiredString(payload.email, 254) ? payload.email : undefined };
  } catch { throw fail('INVALID_ID_TOKEN'); }
}

function createChatGptSession({ hostId, registrations = [], networkEnabled = false,
  transport, verifyIdToken = verifyOpenAiIdToken, now = Date.now } = {}) {
  if (!/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hostId || '')) {
    throw fail('INVALID_HOST_ID');
  }
  // Injected transports/validators belong to the trusted host, never corpus/model data.
  if (!transport && !networkEnabled) transport = async () => { throw fail('NETWORK_DISABLED'); };
  if (!transport) transport = globalThis.fetch;
  const simulated = !networkEnabled;
  const accounts = new Map(); let active = null; let pending = null; let busy = false;
  let generation = 0; let requests = 0; let blocked = false; let retryClientId;
  const controllers = new Set();
  for (const r of registrations) {
    if (!issued(r.client_id) || !requiredString(r.subject, 256) || r.issuer !== ISSUER
      || accounts.has(r.client_id)) throw fail('INVALID_REGISTRATION');
    accounts.set(r.client_id, { client_id: r.client_id, subject: r.subject, issuer: ISSUER });
  }
  function account() {
    const a = accounts.get(active); if (!a?.access) throw fail('SIGN_IN_REQUIRED');
    return a;
  }
  async function withRequest(fn, signal, timeoutMs = 30000) {
    const controller = new AbortController(); controllers.add(controller);
    const abort = () => controller.abort();
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      if (controller.signal.aborted) throw fail('CANCELLED');
      return await fn(controller.signal);
    } catch (error) {
      if (controller.signal.aborted) throw fail('CANCELLED_OR_TIMED_OUT');
      if (error?.code && (knownCodes.has(error.code) || /^[A-Z_]+$/.test(error.code))) throw fail(error.code, error.status);
      throw fail('TRANSPORT_FAILED');
    } finally {
      clearTimeout(timer); controllers.delete(controller); signal?.removeEventListener('abort', abort);
    }
  }
  async function json(url, init = {}, signal) {
    return withRequest(async (s) => {
      const res = await transport(url, { ...init, signal: s, redirect: 'error' });
      let body; try { body = JSON.parse(await readBounded(res, 128 * 1024)); }
      catch { throw fail('INVALID_RESPONSE', res.status); }
      if (!res.ok) throw fail(errorCode(body), res.status);
      return body;
    }, signal);
  }
  function form(values) {
    return { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString() };
  }
  function cancel() {
    generation += 1; pending = null;
    for (const c of controllers) c.abort();
  }
  function publicAccounts() {
    return [...accounts.values()].map((a) => ({ client_id: a.client_id, subject: a.subject,
      issuer: a.issuer, active: active === a.client_id, connected: Boolean(a.access),
      plan_enabled: Boolean(a.access && a.scopes?.includes('chatgpt.tokens.use.direct')) }));
  }
  function begin({ redirectUri, clientId, consent = false } = {}) {
    if (consent !== true) throw fail('CONNECTION_CONSENT_REQUIRED');
    if (pending || busy) throw fail('OPERATION_IN_PROGRESS');
    let url; try { url = new URL(redirectUri); } catch { throw fail('INVALID_CALLBACK_URI'); }
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port
      || url.pathname !== '/auth/callback' || url.search || url.hash || url.username || url.password) {
      throw fail('INVALID_CALLBACK_URI');
    }
    const selected = clientId ? accounts.get(clientId) : null;
    if (clientId && !selected) throw fail('UNKNOWN_ACCOUNT');
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    const { createHash } = require('node:crypto');
    const attemptClientId = clientId || retryClientId;
    pending = { state, nonce, verifier, redirectUri: url.href, selected, clientId: attemptClientId,
      expires: now() + 5 * 60 * 1000, generation };
    const auth = new URL(AUTHORIZE);
    const params = { client_id: attemptClientId || 'dynamic_agent_client', ext_agent_host_id: hostId,
      response_type: 'code', redirect_uri: url.href, scope: SCOPES, resource: RESOURCE,
      state, nonce, code_challenge_method: 'S256',
      code_challenge: createHash('sha256').update(verifier).digest('base64url') };
    if (!attemptClientId) params.agent_name_hint = 'Quiver';
    // Deliberately omit ID-token hints: authorization URLs never contain saved tokens.
    for (const [key, value] of Object.entries(params)) auth.searchParams.set(key, value);
    return { authorization_url: auth.href, expires_at: pending.expires, simulated };
  }
  async function complete(callback, { signal } = {}) {
    const p = pending;
    if (!p || busy) throw fail('NO_PENDING_SIGN_IN');
    let url; try { url = new URL(callback); } catch { throw fail('INVALID_CALLBACK'); }
    const base = new URL(p.redirectUri);
    if (url.origin !== base.origin || url.pathname !== base.pathname || url.hash || url.username
      || url.password || [...url.searchParams.keys()].some((k) => url.searchParams.getAll(k).length !== 1)
      || !equal(url.searchParams.get('state'), p.state)) throw fail('INVALID_CALLBACK');
    pending = null; // Atomic, single use; wrong state does not consume a legitimate pending attempt.
    if (now() >= p.expires) throw fail('SIGN_IN_EXPIRED');
    if (url.searchParams.has('error')) throw fail('CONSENT_DECLINED');
    const clientId = url.searchParams.get('client_id') || p.clientId;
    if (!issued(clientId) || (p.clientId && clientId !== p.clientId)) throw fail('INVALID_CLIENT_ID');
    const code = url.searchParams.get('code'); if (!requiredString(code)) throw fail('MISSING_CODE');
    busy = true;
    try {
      const tokens = await json(TOKEN, form({ grant_type: 'authorization_code', client_id: clientId,
        code, code_verifier: p.verifier, redirect_uri: p.redirectUri, resource: RESOURCE }), signal);
      const jwks = await json(`${ISSUER}/.well-known/jwks.json`, {}, signal);
      const identity = await verifyIdToken(tokens.id_token, { clientId, nonce: p.nonce, jwks, now: now() });
      if (identity.issuer !== ISSUER || !requiredString(identity.subject, 256)
        || (p.selected && identity.subject !== p.selected.subject)
        || (accounts.has(clientId) && accounts.get(clientId).subject !== identity.subject)) throw fail('ACCOUNT_MISMATCH');
      if (p.generation !== generation || signal?.aborted) throw fail('CANCELLED');
      const a = { client_id: clientId, subject: identity.subject, issuer: ISSUER };
      assignTokens(a, tokens);
      accounts.set(clientId, a); active = clientId; blocked = false; retryClientId = undefined;
      return { ...publicAccounts().find((x) => x.client_id === clientId), simulated };
    } catch (error) {
      if (error.code === 'invalid_grant' && !p.selected) retryClientId = clientId;
      throw error;
    } finally { busy = false; }
  }
  function assignTokens(a, tokens) {
    if (!requiredString(tokens.access_token) || !requiredString(tokens.id_token, 16384)
      || !requiredString(tokens.refresh_token) || tokens.token_type?.toLowerCase() !== 'bearer'
      || !Number.isInteger(tokens.expires_in) || tokens.expires_in <= 0 || tokens.expires_in > 86400
      || typeof tokens.scope !== 'string' || tokens.scope.length > 2048) throw fail('INVALID_TOKEN_RESPONSE');
    a.access = tokens.access_token; a.refresh = tokens.refresh_token;
    a.scopes = tokens.scope.split(/\s+/); a.expires = now() + tokens.expires_in * 1000;
  }
  async function access(signal) {
    const a = account(); const g = generation;
    if (a.expires - now() > 60000) return a;
    if (!a.refreshing) a.refreshing = (async () => {
      try {
        const t = await json(TOKEN, form({ grant_type: 'refresh_token', client_id: a.client_id,
          refresh_token: a.refresh, resource: RESOURCE }), signal);
        if (g !== generation || !a.access) throw fail('CANCELLED');
        // Refresh need not supply a new ID token; only the original verified identity is retained.
        assignTokens(a, { ...t, id_token: t.id_token || 'unused-refresh-id-token',
          scope: t.scope ?? a.scopes.join(' ') });
      } catch (error) {
        if (terminalRefresh.has(error.code)) { delete a.access; delete a.refresh; a.scopes = []; }
        throw error;
      } finally { delete a.refreshing; }
    })();
    await a.refreshing; return a;
  }
  async function models({ signal } = {}) {
    const current = generation;
    const a = await access(signal);
    if (current !== generation || signal?.aborted) throw fail('CANCELLED');
    requirePlan(a);
    const result = await json(`${RESOURCE}/models`, { headers: { Authorization: `Bearer ${a.access}` } }, signal);
    if (current !== generation || signal?.aborted) throw fail('CANCELLED');
    if (!Array.isArray(result.models) || result.models.length > 500) throw fail('INVALID_MODEL_CATALOG');
    const rows = result.models.filter((m) => m.visibility === 'list');
    if (rows.some((m) => !requiredString(m.slug, 128) || !requiredString(m.display_name, 256))) throw fail('INVALID_MODEL_CATALOG');
    a.models = rows.map((m) => ({ slug: m.slug, display_name: m.display_name }));
    return structuredClone(a.models);
  }
  function requirePlan(a) {
    if (!a.scopes.includes('chatgpt.tokens.use.direct') || !a.scopes.includes('resource.invoke')) throw fail('PLAN_PERMISSION_REQUIRED');
  }
  async function infer({ model, input, instructions, consent = false, creditsDisabledConfirmed = false, signal } = {}) {
    if (consent !== true || creditsDisabledConfirmed !== true) throw fail('USAGE_CONSENT_REQUIRED');
    if (busy || pending) throw fail('OPERATION_IN_PROGRESS');
    if (blocked) throw fail('USAGE_PAUSED');
    if (requests >= 3) throw fail('LOCAL_REQUEST_LIMIT');
    if (!requiredString(model, 128) || typeof instructions !== 'string' || instructions.length > 8000
      || !Array.isArray(input) || input.length !== 1 || input[0]?.role !== 'user'
      || typeof input[0].content !== 'string' || Buffer.byteLength(input[0].content) > 96 * 1024
      || Object.keys(input[0]).some((k) => !['role', 'content'].includes(k))) throw fail('INVALID_INFERENCE_INPUT');
    busy = true;
    const current = generation;
    try {
      const a = await access(signal);
      if (current !== generation || signal?.aborted) throw fail('CANCELLED');
      requirePlan(a);
      if (!a.models?.some((m) => m.slug === model)) throw fail('MODEL_NOT_SELECTED');
      requests += 1; // Reserve before sending, including failed/uncertain requests. Never auto retry inference.
      return await withRequest(async (s) => {
        const res = await transport(`${RESOURCE}/responses`, { method: 'POST', redirect: 'error', signal: s,
          headers: { Authorization: `Bearer ${a.access}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, input, instructions, store: false, stream: true }) });
        if (!res.ok) {
          let body; try { body = JSON.parse(await readBounded(res, 32768)); } catch { body = {}; }
          throw fail(errorCode(body), res.status);
        }
        if (!res.headers.get('content-type')?.startsWith('text/event-stream')) throw fail('INVALID_STREAM');
        return await consumeStream(res, s);
      }, signal, 60000);
    } catch (error) {
      if (error.code === 'subscription_sharing_usage_limit_exceeded') blocked = true;
      throw error;
    } finally { busy = false; }
  }
  async function signOut({ signal } = {}) {
    const a = accounts.get(active); cancel(); active = null;
    if (!a) return { remote_revocation: 'not-needed' };
    const refresh = a.refresh; delete a.access; delete a.refresh; delete a.models; a.scopes = [];
    let revoked = false;
    if (refresh) try {
      const discovery = await json(`${ISSUER}/.well-known/openid-configuration`, {}, signal);
      const endpoint = new URL(discovery.revocation_endpoint);
      if (endpoint.origin !== ISSUER || endpoint.username || endpoint.password || endpoint.hash) throw fail('INVALID_REVOCATION_ENDPOINT');
      await withRequest(async (s) => {
        const res = await transport(endpoint.href, { ...form({ token: refresh,
          token_type_hint: 'refresh_token', client_id: a.client_id }), redirect: 'error', signal: s });
        await res.body?.cancel(); if (res.status !== 200) throw fail('REVOCATION_UNCONFIRMED');
      }, signal); revoked = true;
    } catch { /* Local sign-out always clears credentials. No implicit retry or account switch. */ }
    return { remote_revocation: revoked ? 'confirmed' : 'unconfirmed', usage_url: USAGE_URL };
  }
  return Object.freeze({ begin, complete, models, infer, signOut, cancel,
    accounts: publicAccounts,
    status: () => ({ simulated, requests, request_limit: 3, usage_paused: blocked, usage_url: USAGE_URL }),
  });
}

async function consumeStream(response, signal) {
  if (!response.body) throw fail('INVALID_STREAM');
  const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true });
  const abort = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  let buffer = ''; let bytes = 0; let events = 0;
  try {
    for (;;) {
      if (signal.aborted) throw fail('CANCELLED');
      const { value, done } = await reader.read();
      if (done) throw fail(signal.aborted ? 'CANCELLED' : 'STREAM_INTERRUPTED');
      bytes += value.byteLength; if (bytes > 1024 * 1024) throw fail('RESPONSE_TOO_LARGE');
      buffer += decoder.decode(value, { stream: true });
      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, match.index); buffer = buffer.slice(match.index + match[0].length);
        const data = frame.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        if (++events > 4000) throw fail('RESPONSE_TOO_LARGE');
        let event; try { event = JSON.parse(data); } catch { throw fail('INVALID_STREAM'); }
        if (event.type === 'response.failed') throw fail(errorCode(event.response));
        if (event.type === 'error') throw fail(errorCode({ error: event }));
        if (event.type === 'response.incomplete') throw fail('RESPONSE_INCOMPLETE');
        if (event.type === 'response.completed') {
          const r = event.response;
          if (r?.status !== 'completed' || !Array.isArray(r.output)) throw fail('INVALID_RESPONSE');
          const texts = [];
          for (const item of r.output) {
            if (item.type === 'reasoning') continue;
            if (item.type !== 'message' || item.role !== 'assistant' || !Array.isArray(item.content)) throw fail('UNEXPECTED_OUTPUT');
            for (const part of item.content) {
              if (part.type !== 'output_text' || typeof part.text !== 'string') throw fail('UNEXPECTED_OUTPUT');
              texts.push(part.text);
            }
          }
          const text = texts.join(''); if (!text || Buffer.byteLength(text) > 32768) throw fail('INVALID_REPORT_SIZE');
          return { text, status: 'completed' };
        }
      }
    }
  } finally { signal.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); }
}

async function startLoopbackSignIn(session, { consent = false, clientId, signal } = {}) {
  if (consent !== true) throw fail('CONNECTION_CONSENT_REQUIRED');
  let resolveResult; let rejectResult; let settled = false; let exchanging = false; let timer; let redirectUri;
  const result = new Promise((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
  result.catch(() => {}); // The host may display the URL before awaiting completion.
  const finish = (error, value) => {
    if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
    server.close(); server.closeAllConnections();
    if (error) { session.cancel(); rejectResult(error); } else resolveResult(value);
  };
  const abort = () => finish(fail('CANCELLED'));
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (req.method !== 'GET' || req.headers.host !== new URL(redirectUri).host
      || !req.url?.startsWith('/auth/callback?') || req.url.length > 16384 || req.headers.origin) {
      res.writeHead(400); res.end('Invalid callback.'); return;
    }
    if (exchanging || settled) { res.writeHead(409); res.end('Sign-in already processing.'); return; }
    exchanging = true;
    try {
      const value = await session.complete(new URL(req.url, redirectUri).href, { signal });
      res.end('Connected. Return to Quiver.'); finish(null, value);
    } catch (error) {
      res.writeHead(400); res.end('Sign-in not completed. Return to Quiver.');
      if (error.code !== 'INVALID_CALLBACK') finish(error);
    } finally { exchanging = false; }
  });
  server.maxHeadersCount = 30; server.requestTimeout = 10000; server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  redirectUri = `http://127.0.0.1:${server.address().port}/auth/callback`;
  try {
    const attempt = session.begin({ redirectUri, clientId, consent });
    timer = setTimeout(() => finish(fail('SIGN_IN_EXPIRED')), 5 * 60 * 1000);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    return { ...attempt, result, cancel: abort };
  } catch (error) { finish(error); throw error; }
}
module.exports = { createChatGptSession, startLoopbackSignIn, verifyOpenAiIdToken, USAGE_URL };
