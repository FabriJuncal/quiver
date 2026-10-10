// Default is entirely simulated. --live is an explicit, interactive future opt-in.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { createInterface } = require('node:readline/promises');
const { createChatGptSession, startLoopbackSignIn, USAGE_URL } = require('../../src/create-quiver/lib/ai/chatgpt-session');
const { prepareChatGptResearch } = require('../../src/create-quiver/lib/planning/chatgpt-research');
const { buildFixture, fakeTransport } = require('./fixture.cjs');

async function main(args = process.argv.slice(2)) {
  if (args.some((a) => a !== '--live') || args.length > 1) throw new Error('Use no arguments for simulation, or --live for interactive sign-in.');
  const live = args.includes('--live');
  const fixture = buildFixture();
  const research = prepareChatGptResearch(fixture.task, fixture.trusted_context, fixture.corpus);
  if (!live) {
    const session = createChatGptSession({ hostId: 'urn:uuid:00000000-0000-4000-8000-000000000001',
      transport: fakeTransport, verifyIdToken: async () => ({ issuer: 'https://auth.openai.com', subject: 'fictional-user' }) });
    const start = session.begin({ redirectUri: 'http://127.0.0.1:1455/auth/callback', consent: true });
    const state = new URL(start.authorization_url).searchParams.get('state');
    await session.complete(`http://127.0.0.1:1455/auth/callback?state=${state}&code=fictional-code&client_id=oaiapp_fictional`);
    await session.models();
    const review = research.review(session, 'fictional-model');
    const report = await research.run(session, { binding: review.binding, model: review.model,
      discloseCorpus: true, creditsDisabledConfirmed: true });
    process.stdout.write(`${JSON.stringify({ mode: 'simulated', connected_to_openai: false, report }, null, 2)}\n`);
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('LIVE_REQUIRES_INTERACTIVE_TERMINAL');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const aborter = new AbortController();
  const onInterrupt = () => { aborter.abort(); prompt.close(); };
  process.once('SIGINT', onInterrupt);
  let session;
  try {
    console.log('Continue with ChatGPT / Continuar con ChatGPT');
    console.log('This connects Quiver to an eligible account. Later requests use existing allowance, not extra quota.');
    console.log('Tokens stay in this process memory. Registration identifiers are saved locally; no existing Codex credentials are read.');
    if (await prompt.question('Type CONNECT to open a sign-in attempt: ') !== 'CONNECT') return;
    const file = path.join(os.homedir(), '.quiver-chatgpt-registrations.json');
    let metadata = { hostId: `urn:uuid:${randomUUID()}`, registrations: [] };
    if (fs.existsSync(file)) {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 32768) throw new Error('INVALID_REGISTRATION_FILE');
      metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Object.keys(metadata).sort().join(',') !== 'hostId,registrations' || !Array.isArray(metadata.registrations)
        || metadata.registrations.length > 20 || metadata.registrations.some((r) => Object.keys(r).sort().join(',') !== 'client_id,issuer,subject')) {
        throw new Error('INVALID_REGISTRATION_FILE');
      }
    } else fs.writeFileSync(file, JSON.stringify(metadata), { flag: 'wx', mode: 0o600 });
    session = createChatGptSession({ ...metadata, networkEnabled: true });
    console.log(session.accounts().map((a, i) => `${i + 1}: ${a.client_id} / ${a.subject}`).join('\n'));
    const pick = await prompt.question('Saved account number, or NEW: ');
    const clientId = pick === 'NEW' ? undefined : metadata.registrations[Number(pick) - 1]?.client_id;
    if (pick !== 'NEW' && !clientId) throw new Error('INVALID_ACCOUNT_SELECTION');
    const attempt = await startLoopbackSignIn(session, { clientId, consent: true, signal: aborter.signal });
    console.log('Open this URL in your system browser (only if you want to connect):');
    console.log(attempt.authorization_url);
    await attempt.result;
    const registrations = session.accounts().map(({ client_id, issuer, subject }) => ({ client_id, issuer, subject }));
    // Only public registration identifiers, never OAuth credentials.
    fs.writeFileSync(file, JSON.stringify({ hostId: metadata.hostId, registrations }), { mode: 0o600 });
    console.log(`Eligible requests use your ChatGPT plan. Manage usage and disable app credits at ${USAGE_URL}`);
    const models = await session.models({ signal: aborter.signal });
    console.log(models.map((m, i) => `${i + 1}: ${m.display_name}`).join('\n'));
    const model = models[Number(await prompt.question('Model number: ')) - 1]?.slug;
    const review = research.review(session, model);
    console.log(JSON.stringify({ review, corpus_to_send: fixture.corpus.documents }, null, 2));
    console.log('Only the fictional demo above is supported here. Local byte/time/request limits do not guarantee a token or monetary ceiling.');
    if (await prompt.question('After disabling credits for this app in ChatGPT settings, type CREDITS OFF: ') !== 'CREDITS OFF') return;
    if (await prompt.question('Type SEND to authorize this exact corpus/model request: ') !== 'SEND') return;
    const report = await research.run(session, { binding: review.binding, model,
      discloseCorpus: true, creditsDisabledConfirmed: true, signal: aborter.signal });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (session) console.log(JSON.stringify(await session.signOut()));
    prompt.close(); process.removeListener('SIGINT', onInterrupt);
  }
}
if (require.main === module) main().catch((error) => {
  // Never print provider bodies, tokens, callback URLs or raw stacks.
  console.error(error.code || 'LOCAL_CHATGPT_FLOW_FAILED'); process.exitCode = 1;
});
module.exports = { main };
