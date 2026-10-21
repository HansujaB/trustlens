import { config } from "../config.js";
import { Rpc, SYSTEM, explainSignature, reviewPayload } from "../solana.js";
import {
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
const rpc = new Rpc(config),
  cluster = "mainnet-beta";
const rows = await rpc.call(cluster, "getSignaturesForAddress", [
  SYSTEM,
  { limit: 1, commitment: "confirmed" },
]);
if (!rows.length) throw new Error("No recent signature returned");
const facts = await explainSignature(rpc, cluster, rows[0].signature);
console.log(
  JSON.stringify({
    check: "mainnet_read",
    signature: facts.signature,
    status: facts.status,
    coverage: facts.coverage,
    exactFeeLamports: facts.feeLamports,
  }),
);
const wallet = await Keypair.generate();
const message = new TransactionMessage({
  payerKey: wallet.publicKey,
  recentBlockhash: SYSTEM,
  instructions: [
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: (await Keypair.generate()).publicKey,
      lamports: 1,
    }),
  ],
}).compileToV0Message();
const payload = Buffer.from(
  new VersionedTransaction(message).serialize(),
).toString("base64");
const review = await reviewPayload(rpc, "devnet", payload);
console.log(
  JSON.stringify({
    check: "unsigned_devnet_simulation",
    status: review.simulation.status,
    error: review.simulation.error,
    blockhashReplaced: review.simulation.blockhashReplaced,
    note: "Fresh unfunded test address; execution failure is expected. Nothing signed or broadcast.",
  }),
);
if (review.simulation.status === "unavailable") process.exitCode = 1;
