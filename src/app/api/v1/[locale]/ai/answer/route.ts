import { withAdmin } from "@/lib/auth/http";
import { answerFromApprovedCorpus } from "@/lib/ai/repository";
import { parseLocale } from "@/lib/content/validation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await context.params;
  const locale = parseLocale(rawLocale);
  const parsedBody = await request.json().catch(() => null) as unknown;
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return NextResponse.json({ code: "INVALID_AI_REQUEST", message: "Body JSON không hợp lệ." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const body = parsedBody as { question?: unknown; contextSlug?: unknown };
  if (typeof body.question !== "string" || !body.question.trim() || body.question.trim().length > 2000) {
    return NextResponse.json({ code: "INVALID_AI_REQUEST", message: "question phải là chuỗi từ 1 đến 2000 ký tự." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (body.contextSlug !== undefined && (typeof body.contextSlug !== "string" || body.contextSlug.trim().length > 200)) {
    return NextResponse.json({ code: "INVALID_AI_REQUEST", message: "contextSlug phải là chuỗi tối đa 200 ký tự." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const question = body.question.trim();
  const contextSlug = typeof body.contextSlug === "string" ? body.contextSlug.trim() : undefined;
  const alphaRequested = process.env.AI_INTERNAL_ALPHA === "1" && request.headers.get("x-qsv-ai-alpha") === "internal";
  if (!alphaRequested) return NextResponse.json({ code: "AI_BETA_DISABLED", message: "Trợ giảng AI đang ở internal alpha; Public Beta chưa mở.", publicBeta: false }, { status: 403, headers: { "Cache-Control": "no-store" } });
  return withAdmin(request, { roles: ["ADMIN", "EDITOR", "REVIEWER"] }, (database) => ({ data: answerFromApprovedCorpus(database, locale, question, contextSlug), access: "INTERNAL_ALPHA" as const }));
}
