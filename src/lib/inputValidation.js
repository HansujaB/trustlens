const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58ByteLength(value) {
  if (!value || value.length > 100) return null;
  let number = 0n;
  for (const char of value) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) return null;
    number = number * 58n + BigInt(digit);
  }
  let length = 0;
  while (number > 0n) {
    length++;
    number >>= 8n;
  }
  for (const char of value) {
    if (char !== "1") break;
    length++;
  }
  return length;
}
export function validateInput(mode, input) {
  const value = input.trim();
  if (!value)
    return {
      error: "Enter an input, or explore the clearly labeled sample below.",
    };
  if (mode === "transaction" || mode === "wallet") {
    const bytes = mode === "transaction" ? 64 : 32;
    return base58ByteLength(value) === bytes
      ? { value }
      : {
          error: `Enter a base58 ${mode === "transaction" ? "transaction signature (64 decoded bytes), not a wallet address" : "public wallet address (32 decoded bytes)"}.`,
        };
  }
  if (mode !== "presign")
    return { error: "Choose a supported investigation mode." };
  const compact = value.replace(/\s/g, "");
  if (
    compact.length > 1644 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      compact,
    ) ||
    !compact.length
  )
    return {
      error:
        "Enter a padded base64 transaction, up to 1,232 decoded bytes. JSON, URLs, and recovery phrases are not accepted.",
    };
  try {
    const decoded = atob(compact);
    if (
      decoded.length > 1232 ||
      decoded.length < 1 ||
      btoa(decoded) !== compact
    )
      throw new Error("Invalid encoding");
  } catch {
    return {
      error:
        "The input is not a canonical base64 payload within the size limit.",
    };
  }
  return { value: compact };
}
