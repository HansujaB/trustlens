/**
 * Scripted concept-preview fixture for the demo branch ONLY.
 * Never merged to main. Reports built here are illustrative data,
 * always rendered with a SCRIPTED CONCEPT PREVIEW label.
 */

export const DEMO_SHARE_ID =
  "2371b3a3e23e1a83ade5fd4fd4eaeb968dff67a22776efa0";

export const DEMO_SIG = "5nP5QNB2W7butQry6BjutpcQap35rAuvbKKs41mjnqBQt3H9iqMYr9Q4zJHDNPUgGFZXngFe1P3cG5aChDik23FP";

const WSOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUPITER = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const PAYER = "HfvRHuHQWmF6uMjjUk2Z4LRWNZWmEUgTtRH28TfmJEbS";

export function isDemoMode() {
  try {
    return new URLSearchParams(location.search).has("demo");
  } catch {
    return false;
  }
}

export function demoShareUrl() {
  return `${location.origin}/share/${DEMO_SHARE_ID}?demo=1`;
}

export function buildDemoReport(input = {}) {
  const signature =
    input.signature || sessionStorage.getItem("demoSig") || DEMO_SIG;
  try {
    sessionStorage.setItem("demoSig", signature);
  } catch {
    /* private mode */
  }
  const blockTime = 1761086400;
  return {
    id: "demo-report",
    demo: true,
    kind: "transaction",
    createdAt: "2026-10-22T19:00:00.000Z",
    facts: {
      schemaVersion: 1,
      parserVersion: "demo-1",
      signature,
      cluster: input.cluster || "mainnet-beta",
      slot: 347123456,
      blockTime,
      feePayer: PAYER,
      feeLamports: "5000",
      status: "success",
      error: null,
      programs: [JUPITER],
      coverage: { supported: 6, total: 6 },
      assetChanges: [
        {
          account: PAYER,
          owner: PAYER,
          mint: WSOL,
          symbol: null,
          rawAmount: "-2400000000",
          decimals: 9,
          amount: "-2.4",
        },
        {
          account: `${PAYER.slice(0, 20)}USDCVaultAccount`,
          owner: PAYER,
          mint: USDC,
          symbol: "USDC",
          rawAmount: "312860000",
          decimals: 6,
          amount: "312.86",
        },
      ],
      logs: ["Program log: Jupiter swap complete."],
    },
    explanation: {
      headline: "Swapped 2.4 SOL for 312.86 USDC via Jupiter.",
      steps: [
        {
          index: 0,
          text: "Set a compute budget for the transaction (ComputeBudget111111111111111111111111111111).",
        },
        {
          index: 1,
          text: `Routed 2.4 SOL through Jupiter (${shorten(JUPITER)}) and received 312.86 USDC.`,
        },
        {
          index: 2,
          text: `Closed the temporary wrapped-SOL account; leftover lamports returned to ${shorten(PAYER)}.`,
        },
        {
          index: 3,
          text: "Network fee: 0.000005 SOL (5000 lamports). Charged to the fee payer above.",
        },
      ],
      limitations: [
        "Concept preview: this report is scripted illustration data, not live chain analysis.",
        "A known program or successful execution does not certify safety.",
      ],
    },
    findings: [
      {
        severity: "info",
        title: "Exact-rate swap, fully decoded",
        explanation:
          "All 6 instructions decoded. Input 2.4 SOL, output 312.86 USDC, executed rate 1 SOL = 130.36 USDC.",
        limitations: ["Rate shown is the executed rate, not a market quote."],
      },
      {
        severity: "low",
        title: "Temporary account closed cleanly",
        explanation:
          "The wrapped-SOL account opened for the swap was closed in the same transaction and rent returned.",
        limitations: [],
      },
    ],
    simulation: null,
    failure: null,
    trade: {
      status: "estimated",
      candidate: {
        input: {
          mint: WSOL,
          rawAmount: "-2400000000",
          decimals: 9,
          amount: "-2.4",
        },
        output: {
          mint: USDC,
          rawAmount: "312860000",
          decimals: 6,
          amount: "312.86",
        },
      },
      samples: {
        input: {
          timestamp: 1761086400000,
          usdPrice: 171.42,
          source: "https://pro-api.coingecko.com/api/v3/coins/solana/market_chart/range",
        },
        output: {
          timestamp: 1761086400000,
          usdPrice: 1.0,
          source: "https://pro-api.coingecko.com/api/v3/coins/usd-coin/market_chart/range",
        },
      },
      estimatedValueDifferencePercent: -0.34,
      limitations: [
        "Approximate USD comparison of net token changes, not a verified quote or slippage measurement.",
      ],
    },
    research: [
      {
        status: "complete",
        identifier: USDC,
        cluster: "mainnet-beta",
        retrievedAt: "2026-10-22T19:00:00.000Z",
        evidence: [
          {
            id: "demo-evidence-01",
            url: "https://docs.jup.ag/swap-api",
            title: "Jupiter Swap API",
            retrievedAt: "2026-10-22T19:00:00.000Z",
            identifier: USDC,
            cluster: "mainnet-beta",
            matchStatus: "exact_identifier_mention",
            sourceQuality: "official_publisher",
            excerpt:
              "USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v) is a supported output mint on the Jupiter swap API…",
            claim:
              "This page mentions the exact identifier; ownership, safety, and incident relevance are not independently established.",
          },
          {
            id: "demo-evidence-02",
            url: "https://solana.com/docs/tokens",
            title: "Solana Token Program",
            retrievedAt: "2026-10-22T19:00:00.000Z",
            identifier: USDC,
            cluster: "mainnet-beta",
            matchStatus: "exact_identifier_mention",
            sourceQuality: "official_publisher",
            excerpt:
              "SPL Token mints such as USDC circulate as program-owned accounts; the mint address alone does not certify the token's issuer…",
            claim:
              "This page mentions the exact identifier; ownership, safety, and incident relevance are not independently established.",
          },
        ],
      },
    ],
    researchCoverage:
      "Up to three non-routine program or mint identifiers. Website mentions are context, not safety or identity certification.",
  };
}

function shorten(value) {
  const s = String(value || "");
  return s.length > 9 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s;
}
