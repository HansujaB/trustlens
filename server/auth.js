import { createPublicKey, verify } from "node:crypto";
import bs58 from "bs58";
import { hash, id, now, requireThat } from "./util.js";
export function validAddress(value) {
  try {
    return (
      typeof value === "string" &&
      value.length <= 44 &&
      bs58.decode(value).length === 32
    );
  } catch {
    return false;
  }
}
export function validSignature(value) {
  try {
    return (
      typeof value === "string" &&
      value.length <= 88 &&
      bs58.decode(value).length === 64
    );
  } catch {
    return false;
  }
}
export class Auth {
  constructor(store, config) {
    this.store = store;
    this.config = config;
  }
  session(req, res) {
    const token = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("trustlens_session="))
      ?.split("=")[1];
    const saved =
      token && /^[a-f0-9]{48}$/.test(token)
        ? this.store.get("session", hash(token))
        : null;
    if (saved && saved.expires > Date.now()) return saved;
    return this.create(res);
  }
  create(res, wallet = null, owner) {
    const token = id();
    const session = {
      id: hash(token),
      owner: owner || (wallet ? `wallet:${wallet}` : `guest:${id()}`),
      wallet,
      csrf: id(),
      expires: Date.now() + 7 * 86400000,
    };
    this.store.put("session", session.id, session, session.owner);
    res.setHeader(
      "Set-Cookie",
      `trustlens_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${this.config.production ? "; Secure" : ""}`,
    );
    return session;
  }
  challenge(session, address) {
    requireThat(
      validAddress(address),
      400,
      "INVALID_ADDRESS",
      "Provide a valid Solana public address.",
    );
    const nonce = id();
    const issued = now();
    const expiry = new Date(Date.now() + 300000).toISOString();
    const origin = new URL(this.config.origin);
    const message = `${origin.host} wants you to sign in with your Solana account:\n${address}\n\nSign in to TrustLens. This request does not send transactions or authorize token spending.\n\nURI: ${origin.origin}\nVersion: 1\nNonce: ${nonce}\nIssued At: ${issued}\nExpiration Time: ${expiry}`;
    this.store.put("challenge", session.id, {
      nonce,
      address,
      message,
      expires: Date.now() + 300000,
    });
    return {
      message,
      address,
      expiresAt: expiry,
      method: "signMessage",
      encoding: "utf8",
    };
  }
  verify(session, signature, res) {
    const challenge = this.store.get("challenge", session.id);
    this.store.delete("challenge", session.id);
    requireThat(
      challenge && challenge.expires > Date.now(),
      401,
      "CHALLENGE_EXPIRED",
      "Request a new login challenge.",
    );
    let valid = false;
    try {
      const bytes = bs58.decode(signature);
      const publicKey = createPublicKey({
        key: Buffer.concat([
          Buffer.from("302a300506032b6570032100", "hex"),
          Buffer.from(bs58.decode(challenge.address)),
        ]),
        format: "der",
        type: "spki",
      });
      valid =
        bytes.length === 64 &&
        verify(null, Buffer.from(challenge.message), publicKey, bytes);
    } catch {
      /* Invalid signature. */
    }
    requireThat(
      valid,
      401,
      "INVALID_SIGNATURE",
      "The login signature could not be verified.",
    );
    const owner = `wallet:${challenge.address}`;
    if (session.owner.startsWith("guest:"))
      this.store.put("owner_alias", session.owner, { owner });
    if (session.owner.startsWith("guest:"))
      for (const kind of ["report", "job", "video"])
        for (const record of this.store.list(kind, session.owner))
          this.store.put(kind, record.id, { ...record, owner }, owner);
    this.store.delete("session", session.id);
    return this.create(res, challenge.address, owner);
  }
}
