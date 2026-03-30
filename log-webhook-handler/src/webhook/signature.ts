export function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const prefix = "sha256=";
  if (!signature.startsWith(prefix)) return false;
  const receivedHex = signature.slice(prefix.length);

  const hasher = new Bun.CryptoHasher("sha256", secret);
  hasher.update(body);
  const expectedHex = hasher.digest("hex");

  if (receivedHex.length !== expectedHex.length) return false;
  let result = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    result |= expectedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
  }
  return result === 0;
}
