import { simplifyDefinition, OFFICIAL_DOMAINS } from "./research.js";
import { ApiError, hash, now } from "./util.js";
const rows = [
  [
    "wallet",
    "Software or a device that manages keys used to authorize blockchain actions. Funds are recorded on-chain, not inside the app.",
    "A public wallet address can be inspected without signing in.",
  ],
  [
    "signature",
    "A cryptographic signature. A Solana transaction’s first signature is also used as its lookup identifier.",
    "Paste a transaction signature to inspect its public record.",
  ],
  [
    "transaction",
    "A message containing instructions submitted together for execution on Solana.",
    "A transfer and account creation can be included in one transaction.",
  ],
  [
    "sol",
    "Solana’s native asset, used for network fees and other on-chain activity.",
    "One SOL equals one billion lamports.",
  ],
  [
    "lamport",
    "One billionth of one SOL, the integer unit used to record SOL amounts.",
    "5,000 lamports equals 0.000005 SOL.",
  ],
  [
    "token",
    "An asset represented by a token program and identified by its mint address.",
    "Two tokens can share a name but have different mints.",
  ],
  [
    "mint",
    "The address and account defining a particular token, including its decimal precision and mint authority where present.",
    "Use the exact mint address rather than a token name to identify an asset.",
  ],
  [
    "program",
    "Executable on-chain code that processes instructions.",
    "The System Program can process a native SOL transfer.",
  ],
  [
    "instruction",
    "One requested operation in a transaction, with a program, accounts, and encoded data.",
    "A token approval is an instruction.",
  ],
  [
    "fee",
    "A charge for processing a transaction. Fees can apply even when execution fails.",
    "Read the actual fee from transaction metadata.",
  ],
  [
    "priority fee",
    "An additional fee associated with requested compute resources and the chosen compute-unit price.",
    "A higher priority fee does not certify transaction safety.",
  ],
  [
    "swap",
    "An exchange of one asset for another, often through one or more liquidity pools.",
    "A swap may have several internal transfers.",
  ],
  [
    "slippage",
    "The difference between an expected execution price and the actual price; a slippage limit constrains acceptable execution.",
    "A displayed quote can change before execution.",
  ],
  [
    "delegate",
    "An account granted a spending allowance over a specific token account.",
    "An allowance of 100 tokens is not unrestricted control over the entire wallet.",
  ],
  [
    "allowance",
    "The quantity a delegate is authorized to spend from a token account.",
    "Inspect the exact raw amount and decimals.",
  ],
  [
    "authority",
    "An account permitted to perform a specific privileged action, such as minting tokens or changing account ownership.",
    "Different authority types grant different powers.",
  ],
  [
    "simulation",
    "A preview of a transaction against a particular chain state without broadcasting it.",
    "A successful simulation is not a guarantee of safety or later success.",
  ],
  [
    "blockhash",
    "A recent block identifier used in ordinary Solana transactions as part of their validity window.",
    "A stale blockhash may prevent execution.",
  ],
  [
    "token account",
    "An account holding a balance of one particular token mint for an owner.",
    "A wallet can own many token accounts.",
  ],
  [
    "rent",
    "Lamports associated with keeping account data stored on Solana; rent-exempt accounts hold a required minimum balance.",
    "Closing a token account can return its remaining lamports.",
  ],
  [
    "liquidity",
    "Assets available for trading or other operations in a pool or market.",
    "Limited liquidity can cause larger price impact.",
  ],
  [
    "confirmation",
    "A measure of how a transaction has been accepted by the network. Different commitment levels provide different assurances.",
    "Confirmed and finalized are different commitment levels.",
  ],
  [
    "slot",
    "A numbered opportunity for a validator to produce a block.",
    "A simulation records the slot of the state it used.",
  ],
  [
    "fee payer",
    "The account responsible for paying the transaction’s network fee.",
    "The fee payer is not necessarily the sender of every token.",
  ],
  [
    "associated token account",
    "A deterministically derived token account for an owner, token mint, and token program.",
    "Creating one may require a lamport deposit for storage.",
  ],
  [
    "wrapped sol",
    "SOL represented through a token account so it can interact with token-based interfaces.",
    "Wrapping and unwrapping can produce account creation or closure steps.",
  ],
  [
    "compute unit",
    "A unit measuring computational resources used by a transaction.",
    "Programs consume compute units when executing.",
  ],
  [
    "lookup table",
    "An on-chain list of account addresses that a versioned transaction can reference by index.",
    "The decoder must resolve lookup addresses before explaining them.",
  ],
  [
    "nonce",
    "A value used to distinguish requests and prevent replay; durable transaction nonces have a specific Solana mechanism.",
    "A login challenge uses a single-use nonce.",
  ],
  [
    "memo",
    "Text or data attached through a memo instruction. Its content is not automatically trustworthy.",
    "Do not treat a URL in an unsolicited memo as an official link.",
  ],
];
const sensitive = new Set([
  "delegate",
  "allowance",
  "authority",
  "simulation",
  "private key",
  "seed phrase",
  "recovery phrase",
  "owner",
  "approval",
  "approve",
  "revoke",
  "close authority",
  "mint authority",
  "freeze authority",
  "permanent delegate",
]);
const aliases = {
  lamports: "lamport",
  "transaction id": "signature",
  "transaction signature": "signature",
  "token mint": "mint",
  "program id": "program",
  "token approval": "allowance",
  "spending allowance": "allowance",
  "address lookup table": "lookup table",
  wsol: "wrapped sol",
  ata: "associated token account",
  fees: "fee",
};
export function canonical(term) {
  const clean = term.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[clean] || clean;
}
export class Glossary {
  constructor(store, research, config, fetchImpl = fetch) {
    this.store = store;
    this.research = research;
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.pending = new Map();
    for (const [term, definition, example] of rows) {
      const key = `solana:en:${term}`;
      if (!store.get("glossary", key))
        store.put("glossary", key, {
          id: key,
          term,
          context: "solana",
          language: "en",
          definition,
          example,
          status: "curated",
          version: 1,
          sourceUrl:
            term === "simulation"
              ? "https://solana.com/docs/rpc/http/simulatetransaction"
              : [
                    "delegate",
                    "allowance",
                    "authority",
                    "token",
                    "mint",
                    "token account",
                    "associated token account",
                    "wrapped sol",
                  ].includes(term)
                ? "https://solana.com/docs/tokens"
                : "https://solana.com/docs/core",
          updatedAt: now(),
        });
    }
  }
  async lookup(raw, context = "solana", language = "en", signal) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9 -]{0,59}$/.test(raw) ||
      context !== "solana" ||
      language !== "en"
    )
      throw new ApiError(
        400,
        "INVALID_TERM",
        "Use a short English technical term in Solana context.",
      );
    const term = canonical(raw),
      key = `${context}:${language}:${term}`,
      saved = this.store.get("glossary", key);
    if (
      saved &&
      saved.status !== "retired" &&
      (saved.status !== "generated_unreviewed" ||
        Date.now() - Date.parse(saved.updatedAt) < 30 * 86400000)
    )
      return { ...saved, cached: true };
    if (
      saved?.status === "retired" ||
      sensitive.has(term) ||
      /\b(approv\w*|revoke|delegate|authority|allowance|permission|private key|seed|recovery|secret)\b/i.test(
        term,
      )
    )
      return {
        term,
        status: "unavailable",
        reason: "A reviewed definition is required for this concept.",
      };
    if (this.pending.has(key)) return this.pending.get(key);
    const work = this.generate(term, key, signal).finally(() =>
      this.pending.delete(key),
    );
    this.pending.set(key, work);
    return work;
  }
  async generate(term, key, signal) {
    try {
      const results = await this.research.search(
        `Solana "${term}" definition documentation`,
        OFFICIAL_DOMAINS,
        signal,
      );
      const pages = await this.research.fetchPages(
        results.map((r) => r.url),
        OFFICIAL_DOMAINS,
        signal,
      );
      const page = pages.find((p) => p.text.toLowerCase().includes(term));
      if (!page)
        return {
          term,
          status: "unavailable",
          reason: "No supporting official documentation found.",
        };
      const entry = await simplifyDefinition(
        this.config,
        term,
        "solana",
        page,
        this.fetchImpl,
        signal,
      );
      const previous = this.store.get("glossary", key);
      const result = {
        id: key,
        term,
        context: "solana",
        language: "en",
        ...entry,
        status: "generated_unreviewed",
        label: "AI-written, source-backed; not human-reviewed",
        sourceUrl: page.url,
        sourceTitle: page.title,
        retrievedAt: now(),
        updatedAt: now(),
        version: (previous?.version || 0) + 1,
        evidenceHash: hash(page.text),
      };
      this.store.put("glossary", key, result);
      return result;
    } catch (e) {
      return {
        term,
        status: "unavailable",
        reason: e.code || "DEFINITION_UNAVAILABLE",
      };
    }
  }
  review(key, status) {
    const previous = this.store.get("glossary", key);
    if (!previous)
      throw new ApiError(404, "NOT_FOUND", "Definition not found.");
    if (!["approved", "retired"].includes(status))
      throw new ApiError(400, "INVALID_STATUS", "Choose approved or retired.");
    this.store.put("glossary_revision", `${key}:${previous.version}`, previous);
    return this.store.put("glossary", key, {
      ...previous,
      status,
      label: status === "approved" ? "Reviewed definition" : "Retired",
      version: previous.version + 1,
      updatedAt: now(),
    });
  }
}
