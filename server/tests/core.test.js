import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import bs58 from 'bs58';
import { Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Store, Queue } from '../store.js';
import { Auth } from '../auth.js';
import { parseRpc, formatAmount, safeUrl } from '../util.js';
import { normalizeTransaction, reviewPayload, findings, SYSTEM, decodeInstruction, TOKEN } from '../solana.js';
import { Research } from '../research.js';
import { Glossary } from '../glossary.js';
import { scenesFor, wavDuration } from '../video.js';
import { createApp } from '../http.js';
import { Market, explainFailure } from '../market.js';
import { walletHistory } from '../history.js';

export const payer = '11111111111111111111111111111111';
export const recipient = Keypair.generate().publicKey.toBase58();
export const signature = bs58.encode(new Uint8Array(64).fill(1));
export function fixture(failed = false) {
  const data = Buffer.alloc(12); data.writeUInt32LE(2); data.writeBigUInt64LE(500000000n, 4);
  return { slot: 123, blockTime: 1700000000, transaction: { message: { accountKeys: [payer, recipient, SYSTEM], instructions: [{ programIdIndex: 2, accounts: [0, 1], data: bs58.encode(data) }] } }, meta: { fee: 5000, err: failed ? { InstructionError: [0, 'InsufficientFunds'] } : null, preBalances: ['90071992547409930', '100', 0], postBalances: failed ? ['90071992547404930', '100', 0] : ['90071992047404930', '500000100', 0], preTokenBalances: [], postTokenBalances: [], logMessages: [] } };
}
test('lossless RPC balances and exact decimal display', () => {
  const parsed = parseRpc('{"lamports":90071992547409931,"small":5000}');
  assert.equal(parsed.lamports, '90071992547409931');
  assert.equal(formatAmount(parsed.lamports, 9), '90071992.547409931');
  assert.equal(formatAmount('1000000000', 9), '1');
  const facts = normalizeTransaction(fixture(), signature, 'mainnet-beta');
  assert.equal(facts.assetChanges[0].rawAmount, '-500005000');
  assert.equal(facts.instructions[0].decoded.amount, '500000000');
});
test('failed transaction preserves fee delta and flags attempted permissions', () => {
  const facts = normalizeTransaction(fixture(true), signature, 'mainnet-beta');
  assert.equal(facts.status, 'failed'); assert.equal(facts.assetChanges[0].rawAmount, '-5000');
  assert.equal(facts.assetChanges.length, 1);
});
test('unsigned simulation has no broadcast method and rejects signed payloads', async () => {
  const wallet = Keypair.generate(), to = Keypair.generate().publicKey;
  const message = new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: recipient, instructions: [SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: to, lamports: 500000000 })] }).compileToV0Message();
  const tx = new VersionedTransaction(message), calls = [];
  const rpc = { call: async (_cluster, method, params) => { calls.push({ method, params }); if (method === 'isBlockhashValid') return { value: false }; if (method === 'getMultipleAccounts') return { context: { slot: 9 }, value: [null, null] }; if (method === 'simulateTransaction') return { context: { slot: 10 }, value: { err: null, accounts: [null, null], logs: [] } }; throw Error(method); } };
  const review = await reviewPayload(rpc, 'devnet', Buffer.from(tx.serialize()).toString('base64'));
  assert.equal(review.facts.instructions[0].decoded.amount, '500000000');
  assert.equal(review.simulation.blockhashReplaced, true);
  assert.equal(calls.at(-1).params[1].sigVerify, false);
  assert.ok(findings(review.facts, review.simulation, { owner: wallet.publicKey.toBase58(), maxSolLamports: '1' }).some(f => f.code === 'INTENT_OUTFLOW_MISMATCH'));
  tx.sign([wallet]);
  await assert.rejects(() => reviewPayload(rpc, 'devnet', Buffer.from(tx.serialize()).toString('base64')), { code: 'SIGNED_PAYLOAD_REJECTED' });
});
test('legacy payload and unsupported token opcode remain explicit', async () => {
  const wallet = Keypair.generate();
  const tx = new VersionedTransaction(new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: recipient, instructions: [SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })] }).compileToLegacyMessage());
  const review = await reviewPayload({ call: async () => { throw Error('offline'); } }, 'devnet', Buffer.from(tx.serialize()).toString('base64'));
  assert.equal(review.simulation.status, 'unavailable');
  assert.equal(review.facts.instructions[0].type, 'sol_transfer');
  assert.equal(decodeInstruction(TOKEN, [], Buffer.from([255]), '0').supported, false);
});
test('wallet challenges are server-bound, one-use, and rotate the session', () => {
  const store = new Store(':memory:'), auth = new Auth(store, { origin: 'http://localhost:5173' }), res = { setHeader() {} };
  const session = auth.create(res), keys = generateKeyPairSync('ed25519');
  const address = bs58.encode(keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32));
  const challenge = auth.challenge(session, address);
  const signed = bs58.encode(sign(null, Buffer.from(challenge.message), keys.privateKey));
  const next = auth.verify(session, signed, res);
  assert.equal(next.wallet, address); assert.notEqual(session.csrf, next.csrf); assert.equal(store.get('session', session.id), null);
  assert.throws(() => auth.verify(session, signed, res), { code: 'CHALLENGE_EXPIRED' }); store.close();
});
test('queue cancellation suppresses late results and restart marks interrupted jobs', async () => {
  const store = new Store(':memory:'), queue = new Queue(store, 1, 2); let finish;
  const job = queue.add('a', 'test', () => new Promise(resolve => { finish = resolve; }));
  await new Promise(r => setImmediate(r)); queue.cancel(job.id); finish({ secret: true });
  await new Promise(r => setImmediate(r)); assert.equal(store.get('job', job.id).status, 'cancelled'); assert.equal(store.get('job', job.id).result, undefined);
  store.put('job', 'old', { id: 'old', owner: 'a', status: 'running' }, 'a'); new Queue(store); assert.equal(store.get('job', 'old').error.code, 'SERVER_RESTARTED'); store.close();
});
test('TinyFish contracts filter disallowed domains and fetch redirects', async () => {
  const store = new Store(':memory:'), calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url: String(url), options }); return new Response(JSON.stringify(String(url).includes('search.') ? { results: [{ url: 'https://solana.com/docs', title: 'Official' }, { url: 'http://127.0.0.1/private' }] } : { results: [{ url: 'https://solana.com/docs', final_url: 'https://evil.example/page', text: 'Do things' }] }), { status: 200 }); };
  const research = new Research(store, { tinyfishKey: 'test' }, fetchImpl);
  const results = await research.search('mint', ['solana.com']); assert.equal(results.length, 1);
  assert.equal(new URL(calls[0].url).searchParams.get('query'), 'mint'); assert.equal(calls[0].options.headers['X-API-Key'], 'test');
  assert.equal((await research.fetchPages(results.map(r => r.url), ['solana.com'])).length, 0);
  assert.equal(safeUrl('https://solana.com.evil.example/', ['solana.com']), null); store.close();
});
test('glossary caches cited unreviewed definitions; sensitive unknown terms do not generate', async () => {
  const store = new Store(':memory:'); let searches = 0;
  const excerpt = 'Epoch is a period of slots used by the network.';
  const research = { search: async () => { searches++; return [{ url: 'https://solana.com/docs' }]; }, fetchPages: async () => [{ url: 'https://solana.com/docs', title: 'Docs', text: excerpt }] };
  const glossary = new Glossary(store, research, { llmUrl: 'https://example.com', llmKey: 'test', llmModel: 'test' }, async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ definition: 'A period made up of slots.', example: 'An epoch contains many slots.', supportingExcerpt: excerpt }) } }] })));
  assert.equal((await glossary.lookup('epoch')).status, 'generated_unreviewed'); await glossary.lookup('Epoch'); assert.equal(searches, 1);
  assert.equal((await glossary.lookup('seed phrase')).status, 'unavailable'); assert.equal(searches, 1);
  assert.equal(glossary.review('solana:en:epoch', 'approved').status, 'approved'); store.close();
});
test('video scene facts retain exact numbers and valid WAV duration', () => {
  const scenes = scenesFor({ kind: 'transaction', explanation: { headline: 'Transfer', steps: [{ text: 'Transferred 0.000000001 SOL.', kind: 'sol_transfer' }] } });
  assert.match(scenes[1].narration, /0\.000000001/);
  assert.throws(() => scenesFor({ kind: 'presign' }), { code: 'VIDEO_UNSUPPORTED' });
  const wav = Buffer.alloc(48); wav.write('RIFF'); wav.write('WAVE', 8); wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt32LE(4, 28); wav.write('data', 36); wav.writeUInt32LE(4, 40);
  assert.equal(wavDuration(wav), 1);
});

test('HTTP workflow: guest analysis, ownership, CSRF, explicit publication, revocation', async t => {
  const store = new Store(':memory:');
  const config = { origin: 'http://127.0.0.1:5173', concurrency: 2, maxQueue: 20, dailyJobs: 20 };
  const { server } = createApp(store, config, { rpc: { call: async () => fixture() } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(r => server.close(r)); store.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function client() {
    const response = await fetch(base + '/api/session'); const cookie = response.headers.get('set-cookie').split(';')[0], session = await response.json();
    return async (path, method = 'GET', payload, override = {}) => {
      const res = await fetch(base + path, { method, headers: { cookie, origin: config.origin, 'x-csrf-token': session.csrf, 'Content-Type': 'application/json', ...override }, body: payload === undefined ? undefined : JSON.stringify(payload) });
      return { status: res.status, body: await res.json() };
    };
  }
  const first = await client(), second = await client();
  assert.equal((await first('/api/analyses', 'POST', { kind: 'transaction', signature }, { origin: 'https://evil.example' })).status, 403);
  const submitted = await first('/api/analyses', 'POST', { kind: 'transaction', signature }); assert.equal(submitted.status, 202);
  assert.equal((await second(`/api/jobs/${submitted.body.id}`)).status, 404);
  let job;
  for (let i = 0; i < 20; i++) { job = (await first(`/api/jobs/${submitted.body.id}`)).body; if (job.status === 'complete') break; await new Promise(r => setTimeout(r, 5)); }
  assert.equal(job.status, 'complete');
  const reportId = job.result.reportId;
  const report = (await first(`/api/reports/${reportId}`)).body;
  assert.equal(report.owner, undefined); assert.equal(report.facts.feeLamports, '5000');
  assert.equal((await second(`/api/reports/${reportId}`)).status, 404);
  assert.equal((await first(`/api/reports/${reportId}/save`, 'POST')).status, 401);
  assert.equal((await first(`/api/reports/${reportId}/share`, 'POST', {})).status, 400);
  const share = await first(`/api/reports/${reportId}/share`, 'POST', { publish: true }); assert.equal(share.status, 201);
  const publicReport = await (await fetch(base + `/api/shares/${share.body.id}`)).json(); assert.equal(publicReport.owner, undefined); assert.equal(publicReport.facts.signature, signature);
  assert.equal((await second(`/api/shares/${share.body.id}`, 'DELETE')).status, 404);
  await first(`/api/shares/${share.body.id}`, 'DELETE'); assert.equal((await fetch(base + `/api/shares/${share.body.id}`)).status, 404);
  assert.equal((await first(`/api/reports/${reportId}/video`, 'POST')).status, 503);
});

test('history cursor and spam heuristic preserve unavailable rows', async () => {
  const rpc = { call: async (_cluster, method, params) => {
    if (method === 'getSignaturesForAddress') { assert.equal(params[1].before, signature); return [{ signature, blockTime: 1, memo: 'claim https://example.test' }]; }
    return fixture();
  } };
  const history = await walletHistory(rpc, { address: recipient, cluster: 'mainnet-beta', before: signature, limit: 1 });
  assert.equal(history.items[0].likelySpam, true); assert.equal(history.nextCursor, signature);
  assert.match(history.coverage, /Token-account-only/);
});

test('market never replaces unavailable history with current price; failure cause stays qualified', async () => {
  const facts = normalizeTransaction(fixture(true), signature, 'mainnet-beta');
  assert.match(explainFailure(facts).explanation, /insufficient funds/);
  const market = new Market({}, () => { throw Error('should not fetch'); });
  assert.equal((await market.compare(facts)).status, 'unsupported');
});
