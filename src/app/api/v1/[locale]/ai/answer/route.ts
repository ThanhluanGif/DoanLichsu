import { withAdmin } from "@/lib/auth/http";
import { answerFromApprovedCorpus } from "@/lib/ai/repository";
import { parseLocale } from "@/lib/content/validation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await context.params;
  const locale = parseLocale(rawLocale);
  const body = await request.json().catch(() => ({})) as { question?: unknown; contextSlug?: unknown };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const contextSlug = typeof body.contextSlug === "string" ? body.contextSlug.trim() : undefined;
  const alphaRequested = process.env.AI_INTERNAL_ALPHA === "1" && request.headers.get("x-qsv-ai-alpha") === "internal";
  if (!alphaRequested) return NextResponse.json({ code: "AI_BETA_DISABLED", message: "Trợ giảng AI đang ở internal alpha; Public Beta chưa mở.", publicBeta: false }, { status: 403, headers: { "Cache-Control": "no-store" } });
  return withAdmin(request, { roles: ["ADMIN", "EDITOR", "REVIEWER"] }, (database) => ({ data: answerFromApprovedCorpus(database, locale, question, contextSlug), access: "INTERNAL_ALPHA" as const }));
}
