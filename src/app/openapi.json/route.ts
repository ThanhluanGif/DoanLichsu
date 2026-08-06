import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi/document";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(openApiDocument, {
    headers: { "Cache-Control": "no-store" },
  });
}
