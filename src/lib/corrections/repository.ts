import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@/lib/db/connection";
import { ApiError, invalidField, rejectMarkup, stringField } from "@/lib/validation/api-error";

export const correctionCategories = ["FACTUAL", "SOURCE", "TRANSLATION", "ACCESSIBILITY", "SAFETY", "RIGHTS"] as const;
export const correctionUrgencies = ["NORMAL", "HIGH", "CRITICAL"] as const;
export type CorrectionCategory = (typeof correctionCategories)[number];
export type CorrectionUrgency = (typeof correctionUrgencies)[number];

const piiPattern = /(e-?mail|số điện thoại|phone|địa chỉ nhà|home address|full name|họ và tên|school|trường học|guardian|phụ huynh)/i;

function enumField<T extends string>(input: Record<string, unknown>, name: string, values: readonly T[]): T {
  const value = stringField(input, name, { required: true, max: 40 })!;
  if (!values.includes(value as T)) invalidField(name, `Chỉ nhận: ${values.join(", ")}.`);
  return value as T;
}

function validateDescription(value: string): string {
  if (value.length < 12) invalidField("description", "Mô tả cần ít nhất 12 ký tự để đội ngũ có thể kiểm tra.");
  rejectMarkup(value, "description");
  if (piiPattern.test(value)) invalidField("description", "Không gửi họ tên, trường, địa chỉ, email hoặc số điện thoại.");
  return value;
}

function validateEvidenceLocator(value: string): string {
  rejectMarkup(value, "evidenceLocator");
  if (value.length < 3) invalidField("evidenceLocator", "Cần URL, mã hồ sơ hoặc locator để đối chiếu.");
  return value;
}

function publishedContentExists(database: SqliteDatabase, contentId: string): boolean {
  return Boolean(database.prepare("SELECT 1 FROM content_nodes WHERE id = ? AND status = 'PUBLISHED'").get(contentId));
}

function rateLimit(database: SqliteDatabase, now: string): void {
  const cutoff = new Date(Date.parse(now) - 60_000).toISOString();
  const recent = (database.prepare("SELECT COUNT(*) AS count FROM correction_reports WHERE received_at >= ?").get(cutoff) as { count: number }).count;
  if (recent >= 20) throw new ApiError(429, "CORRECTION_RATE_LIMITED", "Kênh báo lỗi đang tạm giới hạn. Vui lòng thử lại sau.", undefined, 60);
}

export function createCorrection(database: SqliteDatabase, input: Record<string, unknown>) {
  const contentId = stringField(input, "contentId", { required: true, max: 200 })!;
  const category = enumField(input, "category", correctionCategories);
  const description = validateDescription(stringField(input, "description", { required: true, max: 2_000 })!);
  const evidenceLocator = validateEvidenceLocator(stringField(input, "evidenceLocator", { required: true, max: 2_000 })!);
  const urgency = enumField(input, "urgency", correctionUrgencies);
  const consent = stringField(input, "consent", { required: true, max: 10 })!;
  const honeypot = stringField(input, "website", { max: 200, allowEmpty: true }) ?? "";
  if (honeypot) throw new ApiError(400, "SPAM_REJECTED", "Báo cáo không hợp lệ.");
  if (consent !== "yes") invalidField("consent", "Cần đồng ý để lưu báo cáo tối thiểu cho mục đích xử lý.");
  if (!publishedContentExists(database, contentId)) throw new ApiError(404, "CONTENT_NOT_FOUND", "Chỉ nhận báo cáo cho nội dung đã xuất bản.");

  const receivedAt = new Date().toISOString();
  const slaHours: 24 | 72 = category === "SAFETY" || category === "RIGHTS" || urgency !== "NORMAL" ? 24 : 72;
  rateLimit(database, receivedAt);
  const id = `correction-${randomUUID()}`;
  const duplicateCutoff = new Date(Date.parse(receivedAt) - 86_400_000).toISOString();
  const duplicate = database.prepare(`
    SELECT 1 FROM correction_reports
    WHERE content_id = ? AND category = ? AND description = ? AND received_at >= ?
    LIMIT 1
  `).get(contentId, category, description, duplicateCutoff);
  if (duplicate) throw new ApiError(409, "DUPLICATE_CORRECTION", "Báo cáo giống hệt đã được tiếp nhận trong 24 giờ qua.");

  database.prepare(`
    INSERT INTO correction_reports
      (id, content_id, category, description, evidence_locator, urgency, consent, state, sla_hours, received_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?, ?, ?)
  `).run(id, contentId, category, description, evidenceLocator, urgency, consent, slaHours, receivedAt, receivedAt);

  return { id, state: "RECEIVED" as const, receivedAt, slaHours, reporterStored: false as const };
}
