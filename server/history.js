import { validAddress, validSignature } from './auth.js';
import { requireThat } from './util.js';
import { explainSignature, TOKEN, TOKEN2022 } from './solana.js';

export async function walletHistory(rpc, { address, cluster, before, limit = 10 }, signal) {
  requireThat(validAddress(address), 400, 'INVALID_ADDRESS', 'Provide a Solana public address.');
  requireThat(!before || validSignature(before), 400, 'INVALID_CURSOR', 'Invalid history cursor.');
  const signatures = await rpc.call(cluster, 'getSignaturesForAddress', [address, { limit, ...(before ? { before } : {}), commitment: 'confirmed' }], signal);
  const items = [];
  // Bounded sequential hydration avoids a public RPC request burst.
  for (const row of signatures) {
    signal?.throwIfAborted();
    try {
      const facts = await explainSignature(rpc, cluster, row.signature, signal);
      const received = facts.assetChanges.some(c => c.owner === address && BigInt(c.rawAmount) > 0n);
      const promotionalMemo = typeof row.memo === 'string' && /https?:\/\/|claim|airdrop|reward/i.test(row.memo);
      const likelySpam = facts.status === 'success' && facts.feePayer !== address && received && promotionalMemo;
      items.push({ signature: row.signature, blockTime: row.blockTime, status: facts.status, changes: facts.assetChanges.filter(c => c.owner === address), likelySpam, spamReason: likelySpam ? 'Incoming value accompanied by a promotional memo; heuristic, not proof of a scam.' : null });
    } catch (error) { items.push({ signature: row.signature, blockTime: row.blockTime, status: 'unavailable', likelySpam: false, error: error.code || 'RPC_UNAVAILABLE' }); }
  }
  return { address, cluster, items, nextCursor: signatures.length === limit ? signatures.at(-1).signature : null, coverage: 'Transactions referencing this address available from this RPC provider. Token-account-only activity and pruned history may be absent.', spamFilter: 'Client-side and reversible; all fetched rows are returned.' };
}

export async function tokenAccounts(rpc, cluster, address, signal) {
  requireThat(validAddress(address), 400, 'INVALID_ADDRESS', 'Provide a Solana public address.');
  const accounts = [];
  for (const programId of [TOKEN, TOKEN2022]) {
    const result = await rpc.call(cluster, 'getTokenAccountsByOwner', [address, { programId }, { encoding: 'jsonParsed', commitment: 'confirmed' }], signal);
    for (const item of result.value) accounts.push({ address: item.pubkey, programId, mint: item.account.data?.parsed?.info?.mint });
  }
  return { accounts, coverage: 'Current token accounts only; closed accounts are not discoverable through this call. Query each address for its history.' };
}
