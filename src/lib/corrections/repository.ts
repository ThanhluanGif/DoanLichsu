import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@/lib/db/connection";
import type { AuthUser } from "@/lib/auth/types";
import { writeAudit } from "@/lib/audit/log";
import { ApiError, invalidField, numberField, rejectMarkup, stringField } from "@/lib/validation/api-error";

export const correctionCategories = ["FACTUAL", "SOURCE", "TRANSLATION", "ACCESSIBILITY", "SAFETY", "RIGHTS"] as const;
export const correctionUrgencies = ["NORMAL", "HIGH", "CRITICAL"] as const;
export const correctionStates = ["RECEIVED", "TRIAGED", "IN_REVIEW", "NEEDS_COUNCIL", "CORRECTED", "DECLINED", "ARCHIVED"] as const;
export type CorrectionCategory = (typeof correctionCategories)[number];
export type CorrectionUrgency = (typeof correctionUrgencies)[number];
export type CorrectionState = (typeof correctionStates)[number];

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

function page(search: URLSearchParams) {
  const rawPage = Number(search.get("page") ?? "1");
  const rawPageSize = Number(search.get("pageSize") ?? "20");
  if (!Number.isInteger(rawPage) || rawPage < 1 || !Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > 100) {
    throw new ApiError(400, "INVALID_QUERY", "Phân trang không hợp lệ.");
  }
  return { page: rawPage, pageSize: rawPageSize, offset: (rawPage - 1) * rawPageSize };
}

function stateFilter(value: string | null): CorrectionState | undefined {
  if (value === null || value === "") return undefined;
  if (!correctionStates.includes(value as CorrectionState)) throw new ApiError(400, "INVALID_QUERY", "State correction không hợp lệ.");
  return value as CorrectionState;
}

function categoryFilter(value: string | null): CorrectionCategory | undefined {
  if (value === null || value === "") return undefined;
  if (!correctionCategories.includes(value as CorrectionCategory)) throw new ApiError(400, "INVALID_QUERY", "Category correction không hợp lệ.");
  return value as CorrectionCategory;
}

function urgencyFilter(value: string | null): CorrectionUrgency | undefined {
  if (value === null || value === "") return undefined;
  if (!correctionUrgencies.includes(value as CorrectionUrgency)) throw new ApiError(400, "INVALID_QUERY", "Urgency correction không hợp lệ.");
  return value as CorrectionUrgency;
}

function correctionView(row: Record<string, unknown>, now = Date.now()) {
  const state = row.state as CorrectionState;
  const terminal = state === "CORRECTED" || state === "DECLINED" || state === "ARCHIVED";
  const overdue = !terminal && now > Date.parse(String(row.received_at)) + Number(row.sla_hours) * 3_600_000;
  return {
    id: row.id, contentId: row.content_id, contentTitle: row.content_title || row.content_id,
    category: row.category, description: row.description, evidenceLocator: row.evidence_locator,
    urgency: row.urgency, state, slaHours: row.sla_hours, receivedAt: row.received_at,
    updatedAt: row.updated_at, version: row.version, overdue,
  };
}

function correctionRow(database: SqliteDatabase, id: string) {
  const row = database.prepare(`
    SELECT r.id, r.content_id, r.category, r.description, r.evidence_locator,
      r.urgency, r.state, r.sla_hours, r.received_at, r.updated_at, r.version,
      COALESCE(tvi.title, ten.title, r.content_id) AS content_title
    FROM correction_reports r
    LEFT JOIN content_translations tvi ON tvi.node_id = r.content_id AND tvi.locale = 'vi'
    LEFT JOIN content_translations ten ON ten.node_id = r.content_id AND ten.locale = 'en'
    WHERE r.id = ?
  `).get(id) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError(404, "CORRECTION_NOT_FOUND", "Báo cáo đính chính không tồn tại.");
  return row;
}

export function listCorrections(database: SqliteDatabase, search: URLSearchParams) {
  const { page: pageValue, pageSize, offset } = page(search);
  const state = stateFilter(search.get("state"));
  const category = categoryFilter(search.get("category"));
  const urgency = urgencyFilter(search.get("urgency"));
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (state) { conditions.push("r.state = ?"); params.push(state); }
  if (category) { conditions.push("r.category = ?"); params.push(category); }
  if (urgency) { conditions.push("r.urgency = ?"); params.push(urgency); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM correction_reports r ${where}`).get(...params) as { count: number }).count;
  const rows = database.prepare(`
    SELECT r.id, r.content_id, r.category, r.description, r.evidence_locator,
      r.urgency, r.state, r.sla_hours, r.received_at, r.updated_at, r.version,
      COALESCE(tvi.title, ten.title, r.content_id) AS content_title
    FROM correction_reports r
    LEFT JOIN content_translations tvi ON tvi.node_id = r.content_id AND tvi.locale = 'vi'
    LEFT JOIN content_translations ten ON ten.node_id = r.content_id AND ten.locale = 'en'
    ${where} ORDER BY CASE r.urgency WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 ELSE 2 END, r.received_at, r.id
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Array<Record<string, unknown>>;
  return { data: rows.map((row) => correctionView(row)), meta: { page: pageValue, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) } };
}

const allowedTransitions: Record<CorrectionState, readonly CorrectionState[]> = {
  RECEIVED: ["TRIAGED", "DECLINED"], TRIAGED: ["IN_REVIEW", "NEEDS_COUNCIL", "DECLINED"],
  IN_REVIEW: ["NEEDS_COUNCIL", "CORRECTED", "DECLINED"], NEEDS_COUNCIL: ["IN_REVIEW", "CORRECTED", "DECLINED"],
  CORRECTED: ["ARCHIVED"], DECLINED: ["ARCHIVED"], ARCHIVED: [],
};

export function transitionCorrection(database: SqliteDatabase, id: string, input: Record<string, unknown>, actor: AuthUser) {
  const version = numberField(input, "version", true)!;
  const nextState = stringField(input, "state", { required: true, max: 40 })!;
  if (!correctionStates.includes(nextState as CorrectionState)) invalidField("state", `Chỉ nhận: ${correctionStates.join(", ")}.`);
  const reason = stringField(input, "reason", { required: true, max: 2_000 })!;
  rejectMarkup(reason, "reason");
  const state = nextState as CorrectionState;
  if (["NEEDS_COUNCIL", "CORRECTED", "DECLINED", "ARCHIVED"].includes(state) && actor.role !== "ADMIN" && actor.role !== "REVIEWER") {
    throw new ApiError(403, "CORRECTION_REVIEWER_REQUIRED", "Chỉ Reviewer hoặc Admin được thực hiện trạng thái này.");
  }
  const now = new Date().toISOString();
  database.transaction(() => {
    const row = correctionRow(database, id);
    const currentState = row.state as CorrectionState;
    if (row.version !== version) throw new ApiError(409, "STALE_VERSION", "Báo cáo đã thay đổi; hãy tải lại trước khi chuyển trạng thái.");
    if (!allowedTransitions[currentState].includes(state)) throw new ApiError(422, "INVALID_CORRECTION_TRANSITION", `Không thể chuyển từ ${currentState} sang ${state}.`);
    database.prepare("UPDATE correction_reports SET state = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?").run(state, now, id, version);
    writeAudit(database, { actorId: actor.id, action: "correction.transition", objectType: "correction", objectId: id, metadata: { fromState: currentState, toState: state, reason, version: version + 1 } });
  }).immediate();
  return correctionView(correctionRow(database, id));
}
