import { createHash, randomBytes } from 'node:crypto';
import { parse as losslessParse, isLosslessNumber } from 'lossless-json';
export const id = () => randomBytes(24).toString('hex');
export const hash = value => createHash('sha256').update(value).digest('hex');
export const now = () => new Date().toISOString();
export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const requireThat = (condition, status, code, message) => { if (!condition) throw new ApiError(status, code, message); };
export function parseRpc(text) {
  return losslessParse(text, (_key, value) => isLosslessNumber(value) ? (/^-?\d+$/.test(value.value) && !Number.isSafeInteger(Number(value.value)) ? value.value : Number(value.value)) : value);
}
export function integer(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new ApiError(502, 'IMPRECISE_PROVIDER_DATA', 'Provider returned an unsafe integer.');
  if (!/^-?\d+$/.test(String(value))) throw new ApiError(502, 'INVALID_PROVIDER_DATA', 'Expected integer base units.');
  return BigInt(value);
}
export function formatAmount(raw, decimals = 9) {
  const n = integer(raw); const negative = n < 0n; const s = (negative ? -n : n).toString().padStart(decimals + 1, '0');
  return `${negative ? '-' : ''}${decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}`.replace(/\.?0+$/, '') : s}`;
}
export async function request(url, options = {}, { timeout = 20000, maxBytes = 4_000_000, parse = JSON.parse, fetchImpl = fetch, retries = 1 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchImpl(url, { ...options, redirect: 'error', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout) });
      if ((response.status === 429 || response.status >= 500) && attempt < retries) { await response.body?.cancel(); await new Promise(r => setTimeout(r, 250 * (attempt + 1))); continue; }
      if (!response.ok) { await response.body?.cancel(); throw new ApiError(502, 'PROVIDER_ERROR', `Provider returned HTTP ${response.status}.`); }
      let size = 0; const chunks = [];
      for await (const chunk of response.body) { size += chunk.length; if (size > maxBytes) throw new ApiError(502, 'PROVIDER_SIZE_LIMIT', 'Provider response exceeded the size limit.'); chunks.push(chunk); }
      const buffer = Buffer.concat(chunks);
      return parse ? parse(buffer.toString('utf8')) : buffer;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, 'PROVIDER_UNAVAILABLE', 'Provider unavailable, invalid response, or request timed out.');
    }
  }
}
export function safeUrl(value, allowedDomains) {
  let url; try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  if (!allowedDomains.includes(url.hostname.toLowerCase())) return null;
  url.hash = ''; return url.href;
}
