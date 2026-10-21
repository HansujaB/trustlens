import { resolve } from 'node:path';
try { process.loadEnvFile(); } catch (e) { if (e.code !== 'ENOENT') throw e; }
export const config = {
  port: Number(process.env.PORT || 3001), host: process.env.HOST || '127.0.0.1',
  origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
  dataDir: resolve(process.env.DATA_DIR || '.data'),
  production: process.env.NODE_ENV === 'production',
  rpc: { 'mainnet-beta': process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com', devnet: process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com' },
  tinyfishKey: process.env.TINYFISH_API_KEY || '',
  agentEnabled: process.env.TINYFISH_AGENT_ENABLED === 'true',
  llmUrl: process.env.LLM_URL || '', llmKey: process.env.LLM_API_KEY || '', llmModel: process.env.LLM_MODEL || '',
  ttsUrl: process.env.TTS_URL || '', ttsKey: process.env.TTS_API_KEY || '', ttsModel: process.env.TTS_MODEL || '', ttsVoice: process.env.TTS_VOICE || '',
  marketKey: process.env.COINGECKO_API_KEY || '',
  adminKey: process.env.GLOSSARY_ADMIN_KEY || '',
  videoEnabled: process.env.VIDEO_ENABLED === 'true',
  concurrency: 2, maxQueue: 20, dailyJobs: Number(process.env.DAILY_JOBS || 20),
};
if (config.production && !config.origin.startsWith('https://')) throw new Error('Production APP_ORIGIN must use HTTPS.');
