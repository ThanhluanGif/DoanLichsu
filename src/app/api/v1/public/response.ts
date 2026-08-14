import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { openReadOnlyDatabase } from "@/lib/db/connection";
import { openDatabase } from "@/lib/db/connection";
import { PublicApiError } from "@/lib/content/validation";
import { apiErrorResponse } from "@/lib/validation/api-error";

export function publicJson(read: unknown): NextResponse {
  return NextResponse.json(read, { headers: { "Cache-Control": "public, max-age=60" } });
}

export function withPublicDatabase<T>(read: (database: ReturnType<typeof openReadOnlyDatabase>) => T): NextResponse {
  try {
    const database = openReadOnlyDatabase(getEnv().databasePath);
    try {
      return publicJson(read(database));
    } finally {
      database.close();
    }
  } catch (error) {
    if (error instanceof PublicApiError) {
      return NextResponse.json(
        { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), requestId: randomUUID() },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Không thể đọc dữ liệu công khai.", requestId: randomUUID() },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

/**
 * Public mutations deliberately use a separate writable connection and the
 * same error envelope as authenticated mutations. The callback must only
 * write the minimum data required by the public contract.
 */
export function withPublicWriteDatabase<T>(write: (database: ReturnType<typeof openDatabase>) => T, status = 201): NextResponse {
  try {
    const database = openDatabase(getEnv().databasePath);
    try {
      return NextResponse.json({ data: write(database) }, { status, headers: { "Cache-Control": "no-store" } });
    } finally {
      database.close();
    }
  } catch (error) {
    if (error instanceof PublicApiError) {
      return NextResponse.json(
        { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), requestId: randomUUID() },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    return apiErrorResponse(error);
  }
}
