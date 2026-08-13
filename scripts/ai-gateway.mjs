import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const snapshot = resolve(option("--snapshot", "artifacts/approved-corpus/snapshot.json"));
const question = option("--question", "");
const output = resolve(option("--output", "artifacts/ai-contract/response.json"));
const generatedAt = new Date().toISOString();
const policyVersion = "ai-answer-policy-v1";
const modelVersion = "deterministic-gateway-0.1";
const abstain = (limitations, reason = "INSUFFICIENT_APPROVED_EVIDENCE") => ({ contractVersion: "ai-answer-v1", status: "ABSTAIN", answer: "Chưa thể trả lời chắc chắn từ kho tư liệu đã được kiểm duyệt.", keyPoints: [], citations: [], confidence: "LOW", limitations, suggestedNext: ["Mở bài học có nguồn đã kiểm chứng", "Gửi câu hỏi hẹp hơn trong phạm vi chương trình"], generatedAt, modelVersion, promptPolicyVersion: policyVersion, corpusSnapshotId: null, abstentionReason: reason });
try {
  const corpus = JSON.parse(readFileSync(snapshot, "utf8"));
  if (corpus.status !== "PASS") throw new Error("Corpus snapshot is not PASS");
  const corpusSnapshotId = corpus.sha256;
  const normalized = question.trim().toLocaleLowerCase("vi");
  const injection = /(ignore|bỏ qua|reveal|tiết lộ|system prompt|không cần nguồn|without citation|jailbreak)/i.test(normalized);
  const unsupported = /(ngoài corpus|chưa có trong corpus|mọi sử gia|kết luận một vấn đề chính trị|so sánh hai nguồn chưa)/i.test(normalized);
  if (!normalized || injection || unsupported) {
    const response = abstain([injection ? "Yêu cầu chứa chỉ dẫn vượt qua chính sách nguồn; gateway không thực hiện." : unsupported ? "Câu hỏi cần nguồn hoặc so sánh chưa có trong corpus được duyệt." : "Câu hỏi trống."] , injection ? "PROMPT_INJECTION_BLOCKED" : unsupported ? "OUT_OF_CORPUS" : "EMPTY_QUERY"); response.corpusSnapshotId = corpusSnapshotId; mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(response, null, 2)}\n`); process.stdout.write(`${JSON.stringify(response)}\n`); process.exitCode = 0;
  } else {
    const words = normalized.match(/[\p{L}\p{N}]{3,}/gu) || []; const ids = new Map(); for (const word of words) for (const id of corpus.index?.[word] || []) ids.set(id, (ids.get(id) || 0) + 1); const ranked = [...ids.entries()].sort((a, b) => b[1] - a[1]); const minimumMatches = process.env.QSV_STRICT_CONTEXT === "1" ? 2 : 1; const records = corpus.records.filter((record) => (ids.get(record.id) || 0) >= minimumMatches);
    if (!records.length) { const response = abstain(["Không tìm thấy claim đã kiểm chứng phù hợp trong corpus snapshot."]); response.corpusSnapshotId = corpusSnapshotId; mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(response, null, 2)}\n`); process.stdout.write(`${JSON.stringify(response)}\n`); }
    else {
      const record = records[0]; const claims = record.claims || []; const citations = claims.map((claim) => { const source = record.sources.find((item) => item.id === claim.sourceId); return source ? { sourceId: source.id, title: source.title, institution: source.institution || null, locator: claim.locator, url: source.url } : null; }).filter(Boolean); const answer = { contractVersion: "ai-answer-v1", status: "GROUNDED", answer: `${record.title}: ${record.summary}`, keyPoints: [{ text: record.summary, claimId: claims[0]?.id || null }], citations, confidence: citations.length && claims.length ? "MEDIUM" : "LOW", limitations: ["Đây là tóm tắt từ bài học đã duyệt; không thay thế giáo viên hoặc nguồn gốc."], suggestedNext: [{ type: "LESSON", slug: record.slug, title: record.title }], generatedAt, modelVersion, promptPolicyVersion: policyVersion, corpusSnapshotId, retrieval: { recordId: record.id, matchedTerms: words.filter((word) => corpus.index?.[word]?.includes(record.id)) } }; mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(answer, null, 2)}\n`); process.stdout.write(`${JSON.stringify(answer)}\n`);
    }
  }
} catch (error) { const response = abstain([String(error)], "GATEWAY_ERROR"); mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(response, null, 2)}\n`); process.stderr.write(`${JSON.stringify(response)}\n`); process.exitCode = 1; }
