import test from "node:test";
import assert from "node:assert/strict";
import { base58ByteLength, validateInput } from "./inputValidation.js";

test("distinguishes real-shaped signatures from addresses and invalid alphabets", () => {
  const signature =
    "4ReKprwf3WdLHRrzp4ctPWNBsQDPL3VZz3zMmoZfcGJMJCHh5Vq937mPdyxhCbw54wNnA6hZ7KfNpQdpt13yY7A9";
  const address = "So11111111111111111111111111111111111111112";
  assert.equal(base58ByteLength(signature), 64);
  assert.equal(base58ByteLength(address), 32);
  assert.ok(!validateInput("transaction", signature).error);
  assert.ok(!validateInput("wallet", address).error);
  assert.ok(validateInput("transaction", address).error);
  assert.ok(validateInput("wallet", signature).error);
  assert.equal(base58ByteLength("0OIl"), null);
  assert.equal(base58ByteLength("1".repeat(32)), 32);
});

test("rejects absent, EVM, URL, and recovery-phrase-like inputs", () => {
  for (const input of [
    "",
    " ",
    "https://example.com",
    "0x" + "a".repeat(40),
    "word ".repeat(12),
  ]) {
    assert.ok(validateInput("wallet", input).error);
    assert.ok(validateInput("transaction", input).error);
  }
});

test("checks canonical base64 and wire-size boundary, without claiming deserialization", () => {
  assert.ok(!validateInput("presign", "AQ==").error);
  assert.ok(!validateInput("presign", " A Q== \n").error);
  for (const input of [
    "",
    "A",
    "AQ=",
    "AR==",
    '{"transaction":1}',
    "https://example.com",
  ]) {
    assert.ok(validateInput("presign", input).error);
  }
  assert.ok(!validateInput("presign", btoa("x".repeat(1232))).error);
  assert.ok(validateInput("presign", btoa("x".repeat(1233))).error);
  assert.ok(validateInput("invalid-mode", "AQ==").error);
});
