import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "log_viewer_session";

const getPassword = () => process.env.LOG_VIEWER_PASSWORD;

export function createSessionToken(): string {
  const password = getPassword();
  if (!password) throw new Error("LOG_VIEWER_PASSWORD is not set");

  const nonce = crypto.randomBytes(32).toString("hex");
  const hmac = crypto
    .createHmac("sha256", password)
    .update(nonce)
    .digest("hex");
  return `${nonce}.${hmac}`;
}

export function validateSessionToken(token: string): boolean {
  const password = getPassword();
  if (!password) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [nonce, providedHmac] = parts;
  if (!nonce || !providedHmac) return false;

  const expectedHmac = crypto
    .createHmac("sha256", password)
    .update(nonce)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}

export function verifyPassword(input: string): boolean {
  const password = getPassword();
  if (!password) return false;

  const inputHash = crypto.createHash("sha256").update(input).digest();
  const passwordHash = crypto.createHash("sha256").update(password).digest();

  return crypto.timingSafeEqual(inputHash, passwordHash);
}
