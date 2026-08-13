import type { SqliteDatabase } from "@/lib/db/connection";
import type { Locale } from "@/lib/content/types";
import { normalizeSearchText } from "@/lib/search/normalize";
import { aiModelVersion, aiPolicyVersion, abstainAnswer, type AiAnswer } from "./contract";

type CorpusRow = { id: string; type: string; locale: Locale; title: string; slug: string; summary: string; body: string; sourceId: string; sourceTitle: string; institution: string | null; sourceUrl: string; locator: string; claimId: string; statement: string };

export function answerFromApprovedCorpus(database: SqliteDatabase, locale: Locale, question: string): AiAnswer {
  const normalized = normalizeSearchText(question.trim());
  const snapshot = database.prepare("SELECT COALESCE(MAX(updated_at), '') AS asOf FROM content_nodes WHERE status='PUBLISHED'").get() as { asOf: string };
  const corpusSnapshotId = `db-approved-${snapshot.asOf || "empty"}`;
  const injection = /(ignore|bỏ qua|reveal|tiết lộ|system prompt|không cần nguồn|without citation|jailbreak)/i.test(normalized);
  const unsupported = /(ngoài corpus|chưa có trong corpus|mọi sử gia|kết luận một vấn đề chính trị|so sánh hai nguồn chưa)/i.test(normalized);
  if (!normalized) return abstainAnswer("EMPTY_QUERY", corpusSnapshotId, locale);
  if (injection) return abstainAnswer("PROMPT_INJECTION_BLOCKED", corpusSnapshotId, locale);
  if (unsupported) return abstainAnswer("OUT_OF_CORPUS", corpusSnapshotId, locale);
  const tokens = normalized.split(" ").filter((token) => token.length >= 2).slice(0, 12);
  const rows = database.prepare(`
    SELECT n.id,n.type,t.locale,t.title,t.slug,t.summary,t.body,
      s.id AS sourceId,s.title AS sourceTitle,s.institution,s.url AS sourceUrl,
      ce.locator,c.id AS claimId,CASE WHEN ?='vi' THEN c.statement_vi ELSE c.statement_en END AS statement
    FROM content_nodes n JOIN content_translations t ON t.node_id=n.id AND t.locale=? AND t.translation_status='PUBLISHED'
    JOIN content_claims c ON c.content_id=n.id AND c.verification_status='VERIFIED'
    JOIN claim_evidence ce ON ce.claim_id=c.id AND length(trim(ce.locator))>0
    JOIN sources s ON s.id=ce.source_id AND s.verification_status='VERIFIED'
    WHERE n.status='PUBLISHED' AND (${tokens.map(() => "t.search_text LIKE ?").join(" OR ")})
    ORDER BY n.updated_at DESC,n.id,c.id LIMIT 20
  `).all(locale, locale, ...tokens.map((token) => `%${token}%`)) as CorpusRow[];
  if (!rows.length) return abstainAnswer("INSUFFICIENT_APPROVED_EVIDENCE", corpusSnapshotId, locale);
  const row = rows[0];
  const citations = [...new Map(rows.map((item) => [item.sourceId, { sourceId: item.sourceId, title: item.sourceTitle, institution: item.institution, locator: item.locator, url: item.sourceUrl }])).values()];
  return { contractVersion: "ai-answer-v1", status: "GROUNDED", answer: locale === "vi" ? `${row.title}: ${row.summary}` : `${row.title}: ${row.summary}`, keyPoints: [{ text: row.statement, claimId: row.claimId }], citations, confidence: citations.length > 1 ? "HIGH" : "MEDIUM", limitations: [locale === "vi" ? "Tóm tắt dựa trên nội dung đã xuất bản; không thay thế giáo viên hoặc nguồn gốc." : "This is a summary of published material; it does not replace a teacher or original source."], suggestedNext: [{ type: "LESSON", slug: row.slug, title: row.title }], generatedAt: new Date().toISOString(), modelVersion: aiModelVersion, promptPolicyVersion: aiPolicyVersion, corpusSnapshotId, locale };
}
