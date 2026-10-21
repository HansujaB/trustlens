import { JUPITER, WSOL } from './solana.js';
import { request, formatAmount } from './util.js';
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const assets = { [WSOL]: 'solana', [USDC]: 'usd-coin' };
export function swapCandidate(facts) {
  if (facts.status !== 'success' || !facts.programs.includes(JUPITER)) return null;
  const totals = new Map();
  for (const c of facts.assetChanges.filter(c => c.mint && c.owner === facts.feePayer)) {
    const prev = totals.get(c.mint);
    if (prev && prev.decimals !== c.decimals) return null;
    totals.set(c.mint, { mint: c.mint, decimals: c.decimals, raw: (prev?.raw || 0n) + BigInt(c.rawAmount) });
  }
  const changed = [...totals.values()].filter(c => c.raw !== 0n);
  if (changed.length !== 2 || changed.filter(c => c.raw < 0n).length !== 1) return null;
  return { input: changed.find(c => c.raw < 0n), output: changed.find(c => c.raw > 0n) };
}
export class Market {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetchImpl = fetchImpl; }
  async compare(facts, signal) {
    const candidate = swapCandidate(facts);
    if (!candidate) return { status: 'unsupported', reason: 'No unambiguous two-token balance-change candidate for the fee payer in a Jupiter transaction. Native wrapping and complex routes are not inferred.' };
    const pair = Object.fromEntries(Object.entries(candidate).map(([k, c]) => [k, { mint: c.mint, rawAmount: c.raw.toString(), decimals: c.decimals, amount: formatAmount(c.raw, c.decimals) }]));
    if (facts.cluster !== 'mainnet-beta' || !facts.blockTime || !this.config.marketKey || !assets[candidate.input.mint] || !assets[candidate.output.mint]) return { status: 'unavailable', candidate: pair, reason: 'Historical price credentials, timestamp, or supported mainnet asset mapping are unavailable.' };
    try {
      const samples = {};
      for (const [side, c] of Object.entries(candidate)) {
        const url = new URL(`https://pro-api.coingecko.com/api/v3/coins/${assets[c.mint]}/market_chart/range`);
        url.search = new URLSearchParams({ vs_currency: 'usd', from: String(facts.blockTime - 3600), to: String(facts.blockTime + 3600) });
        const data = await request(url, { headers: { 'x-cg-pro-api-key': this.config.marketKey }, signal }, { fetchImpl: this.fetchImpl });
        const nearest = data.prices?.filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] > 0).sort((a, b) => Math.abs(a[0] / 1000 - facts.blockTime) - Math.abs(b[0] / 1000 - facts.blockTime))[0];
        if (!nearest || Math.abs(nearest[0] / 1000 - facts.blockTime) > 300) return { status: 'unavailable', candidate: pair, reason: 'No historical sample within five minutes of execution.' };
        samples[side] = { timestamp: nearest[0], usdPrice: nearest[1], source: url.origin + url.pathname };
      }
      const inputValue = Math.abs(Number(pair.input.amount)) * samples.input.usdPrice;
      const outputValue = Number(pair.output.amount) * samples.output.usdPrice;
      if (!Number.isFinite(inputValue) || !Number.isFinite(outputValue) || inputValue <= 0) throw new Error('Invalid valuation');
      return { status: 'estimated', candidate: pair, samples, estimatedValueDifferencePercent: (outputValue / inputValue - 1) * 100, limitations: ['Approximate USD comparison of net token changes, not a verified quote or slippage measurement.', 'Independent token movements can coexist with a swap. Historical market averages are not the executable pool price. Network fees are separate.'] };
    } catch (e) { return { status: 'unavailable', candidate: pair, reason: e.code || 'HISTORICAL_PRICE_UNAVAILABLE' }; }
  }
}

export function explainFailure(facts) {
  if (!facts.error) return null;
  const ix = facts.error.InstructionError;
  const reason = Array.isArray(ix) ? ix[1] : facts.error;
  const known = { InsufficientFunds: 'An account had insufficient funds for the requested operation.', InvalidAccountData: 'An instruction received account data it could not use.', ComputationalBudgetExceeded: 'Execution exceeded the available compute budget.', AccountNotRentExempt: 'An account did not meet the rent-exemption requirement.' };
  return { instructionIndex: Array.isArray(ix) ? ix[0] : null, rawError: facts.error, explanation: typeof reason === 'string' && known[reason] || 'The chain reported an execution error. The precise program-specific cause is not decoded; inspect the raw error and logs.', logs: facts.logs, limitation: 'Instructions were rolled back; network fees may still be charged. Custom error numbers are program-specific.' };
}
