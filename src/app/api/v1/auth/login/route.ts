import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { openDatabase } from "@/lib/db/connection";
import { writeAudit } from "@/lib/audit/log";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireSameOrigin } from "@/lib/auth/origin";
import { createSessionCookie } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/types";
import { releaseSuccessfulLogin, reserveLoginAttempt } from "@/lib/rate-limit/login";
import { ApiError, apiErrorResponse, readJsonObject, secretField, stringField } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";
const dummyHash = hashPassword("Dummy-Password-2026!");
const maximumConcurrentPasswordChecks = 8;
let activePasswordChecks = 0;

function acquirePasswordCheck(): void {
  if (activePasswordChecks >= maximumConcurrentPasswordChecks) {
    throw new ApiError(429, "AUTH_CAPACITY_REACHED", "Hệ thống đăng nhập đang bận.", undefined, 1);
  }
  activePasswordChecks += 1;
}

export async function POST(request: Request) {
  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    requireSameOrigin(request);
    const body = await readJsonObject(request);
    const email = stringField(body, "email", { required: true, max: 320 })!.toLowerCase();
    const password = secretField(body, "password", true)!;
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
    const ip = process.env.TRUST_PROXY_HEADERS === "1" && forwardedIp ? forwardedIp : null;
    database = openDatabase(getEnv().databasePath);
    acquirePasswordCheck();
    let row: { id:string;email:string;display_name:string;role:Role;password_hash:string;active:number;session_version:number } | undefined;
    let valid = false;
    try {
      reserveLoginAttempt(database, email, ip);
      row = database.prepare(`
        SELECT id,email,display_name,role,password_hash,active,session_version FROM users WHERE email=?
      `).get(email) as typeof row;
      valid = await verifyPassword(row?.password_hash ?? await dummyHash, password);
    } finally {
      activePasswordChecks -= 1;
    }
    if (!row || row.active !== 1 || !valid) {
      writeAudit(database, { actorId: row?.id ?? null, action: "auth.login_failed", objectType: "session", metadata: { email, ip: ip ?? "unavailable" } });
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.");
    }
    releaseSuccessfulLogin(database, email, ip);
    writeAudit(database, { actorId: row.id, action: "auth.login", objectType: "session", objectId: row.id, metadata: { ip: ip ?? "unavailable" } });
    const cookie = await createSessionCookie({ userId: row.id, sessionVersion: row.session_version });
    return NextResponse.json(
      { data: { id: row.id, email: row.email, displayName: row.display_name, role: row.role } },
      { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  } finally {
    database?.close();
  }
}
