import { NextResponse } from "next/server";
import { assertDatabaseHealthy } from "@/lib/db/health";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface HealthResponse {
  status: "ok";
  version: string;
  database: "ok";
  timestamp: string;
}

export function GET() {
  try {
    const env = getEnv();
    assertDatabaseHealthy(env.databasePath);

    return NextResponse.json(
      {
        status: "ok",
        version: env.appVersion,
        database: "ok",
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse,
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
