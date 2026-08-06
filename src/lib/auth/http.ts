import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { openDatabase, type SqliteDatabase } from "@/lib/db/connection";
import { apiErrorResponse } from "@/lib/validation/api-error";
import { requireSameOrigin } from "./origin";
import { requireUser } from "./authorize";
import type { AuthUser, Role } from "./types";

export function dataResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function listResponse(value: { data: unknown[]; meta: unknown }): NextResponse {
  return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } });
}

export async function withAdmin(
  request: Request,
  options: { roles?: readonly Role[]; mutation?: boolean },
  handler: (database: SqliteDatabase, user: AuthUser) => unknown | Promise<unknown>,
): Promise<NextResponse> {
  let database: SqliteDatabase | undefined;
  try {
    if (options.mutation) requireSameOrigin(request);
    database = openDatabase(getEnv().databasePath);
    const user = await requireUser(request, database, options.roles);
    const result = await handler(database, user);
    return result instanceof NextResponse ? result : dataResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  } finally {
    database?.close();
  }
}

