import { createHmac } from "node:crypto";

type TokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

function signContent(content: string) {
  return base64UrlEncode(createHmac("sha256", getJwtSecret()).update(content).digest());
}

export function signToken(user: { id: string; email: string }) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = signContent(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    throw new Error("Invalid token.");
  }

  const expectedSignature = signContent(`${header}.${payload}`);

  if (signature !== expectedSignature) {
    throw new Error("Invalid token signature.");
  }

  const parsedPayload = JSON.parse(base64UrlDecode(payload)) as TokenPayload;

  if (parsedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired token.");
  }

  return parsedPayload;
}
