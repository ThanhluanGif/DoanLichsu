import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { openDatabase } from "@/lib/db/connection";
import { requireUser } from "@/lib/auth/authorize";
import { requireSameOrigin } from "@/lib/auth/origin";
import { clearSessionCookie } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit/log";
import { apiErrorResponse } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    requireSameOrigin(request);
    database = openDatabase(getEnv().databasePath);
    const user = await requireUser(request, database);
    database.transaction(() => {
      database!.prepare("UPDATE users SET session_version=session_version+1, updated_at=? WHERE id=?").run(new Date().toISOString(), user.id);
      writeAudit(database!, { actorId: user.id, action: "auth.logout", objectType: "session", objectId: user.id });
    }).immediate();
    return NextResponse.json({ data: { loggedOut: true } }, { headers: { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  } finally {
    database?.close();
  }
}
