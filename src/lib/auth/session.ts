import { sealData, unsealData } from "iron-session";
import type { SessionPayload } from "./types";

export const sessionCookieName = "qsv_session";
const sessionTtlSeconds = 8 * 60 * 60;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function cookieValue(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === sessionCookieName) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function readSession(request: Request): Promise<SessionPayload | null> {
  try {
    const sealed = cookieValue(request);
    if (!sealed) return null;
    const data = await unsealData<SessionPayload>(sealed, { password: sessionSecret(), ttl: sessionTtlSeconds });
    if (!data.userId || !Number.isInteger(data.sessionVersion)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const sealed = await sealData(payload, { password: sessionSecret(), ttl: sessionTtlSeconds });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${sessionCookieName}=${encodeURIComponent(sealed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionTtlSeconds}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
