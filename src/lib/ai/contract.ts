import type { Locale } from "@/lib/content/types";

export type AiAnswerStatus = "GROUNDED" | "ABSTAIN";
export type AiAnswer = {
  contractVersion: "ai-answer-v1";
  status: AiAnswerStatus;
  answer: string;
  keyPoints: Array<{ text: string; claimId: string | null }>;
  citations: Array<{ sourceId: string; title: string; institution: string | null; locator: string; url: string }>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  limitations: string[];
  suggestedNext: Array<{ type: "LESSON" | "SEARCH"; slug?: string; title?: string; query?: string }>;
  generatedAt: string;
  modelVersion: string;
  promptPolicyVersion: string;
  corpusSnapshotId: string;
  abstentionReason?: string;
  locale?: Locale;
};

export const aiPolicyVersion = "ai-answer-policy-v1";
export const aiModelVersion = "deterministic-db-gateway-0.1";

export function abstainAnswer(reason: string, corpusSnapshotId: string, locale: Locale): AiAnswer {
  return {
    contractVersion: "ai-answer-v1", status: "ABSTAIN",
    answer: locale === "vi" ? "Chưa thể trả lời chắc chắn từ kho tư liệu đã được kiểm duyệt." : "I cannot answer confidently from the approved archive yet.",
    keyPoints: [], citations: [], confidence: "LOW",
    limitations: [locale === "vi" ? "Câu hỏi cần nguồn hoặc claim đã kiểm chứng phù hợp." : "The question needs a matching verified claim and source."],
    suggestedNext: [{ type: "SEARCH", query: locale === "vi" ? "Mở trang tìm kiếm và thử từ khóa hẹp hơn" : "Open search and try a narrower query" }],
    generatedAt: new Date().toISOString(), modelVersion: aiModelVersion, promptPolicyVersion: aiPolicyVersion, corpusSnapshotId, abstentionReason: reason, locale,
  };
}
