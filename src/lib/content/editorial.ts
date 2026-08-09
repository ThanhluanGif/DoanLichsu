import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@/lib/db/connection";
import type { AuthUser, Role } from "@/lib/auth/types";
import { hashPassword } from "@/lib/auth/password";
import { writeAudit } from "@/lib/audit/log";
import { normalizeSearchText } from "@/lib/search/normalize";
import {
  claimAssessments,
  claimTypes,
  sourceQualityTiers,
  sourceTypes,
  verificationStatuses,
  type ClaimAssessment,
  type ClaimType,
  type SourceQualityTier,
  type SourceType,
  type VerificationStatus,
} from "@/lib/content/types";
import {
  ApiError,
  booleanField,
  invalidField,
  numberField,
  rejectMarkup,
  secretField,
  stringArrayField,
  stringField,
} from "@/lib/validation/api-error";

const contentTypes = ["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"] as const;
const locales = ["vi", "en"] as const;
const editableTranslationStatuses = ["NOT_STARTED", "TRANSLATING", "READY_FOR_REVIEW"] as const;
const workflowStatuses = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
type Locale = (typeof locales)[number];
type WorkflowAction = "submit-review" | "approve" | "reject" | "publish" | "archive";

function page(search: URLSearchParams) {
  const pageValue = Number(search.get("page") ?? "1");
  const pageSize = Number(search.get("pageSize") ?? "20");
  if (!Number.isInteger(pageValue) || pageValue < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ApiError(400, "INVALID_QUERY", "Phân trang không hợp lệ.");
  }
  return { page: pageValue, pageSize, offset: (pageValue - 1) * pageSize };
}

function meta(pageValue: number, pageSize: number, total: number) {
  return { page: pageValue, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

function enumValue<T extends string>(input: Record<string, unknown>, name: string, values: readonly T[], required = false): T | undefined {
  const value = stringField(input, name, { required, max: 100 });
  if (value === undefined) return undefined;
  if (!values.includes(value as T)) invalidField(name, `Chỉ nhận: ${values.join(", ")}.`);
  return value as T;
}

function isoDate(input: Record<string, unknown>, name: string): string | undefined {
  const value = stringField(input, name, { max: 10 });
  const parsed = value === undefined ? Number.NaN : Date.parse(`${value}T00:00:00.000Z`);
  if (value !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value)) invalidField(name, "Phải là ngày YYYY-MM-DD hợp lệ.");
  return value;
}

function isoTimestamp(input: Record<string, unknown>, name: string, required = false): string | undefined {
  const value = stringField(input, name, { required, max: 40 });
  if (value !== undefined && Number.isNaN(Date.parse(value))) invalidField(name, "Phải là ISO-8601 hợp lệ.");
  return value ? new Date(value).toISOString() : undefined;
}

function httpsUrl(input: Record<string, unknown>, name: string): string {
  const value = stringField(input, name, { required: true, max: 2_000 })!;
  try {
    if (new URL(value).protocol !== "https:") throw new Error();
  } catch {
    invalidField(name, "Phải là URL HTTPS hợp lệ.");
  }
  return value;
}

function optionalHttpsUrl(input: Record<string, unknown>, name: string): string | undefined {
  const value = stringField(input, name, { max: 2_000 });
  if (value === undefined) return undefined;
  try {
    if (new URL(value).protocol !== "https:") throw new Error();
  } catch {
    invalidField(name, "Phải là URL HTTPS hợp lệ.");
  }
  return value;
}

function ensureReferences(database: SqliteDatabase, table: string, ids: string[], field: string): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE id IN (${placeholders})`).get(...ids) as { count: number };
  if (row.count !== ids.length) invalidField(field, "Có ID không tồn tại.");
}

function replaceLinks(database: SqliteDatabase, table: string, contentId: string, targetColumn: string, ids: string[]): void {
  database.prepare(`DELETE FROM ${table} WHERE content_id = ?`).run(contentId);
  const insert = database.prepare(`INSERT INTO ${table} (content_id, ${targetColumn}${table === "content_media" ? ", sort_order, is_thumbnail" : table === "content_sources" || table === "content_relations" ? ", sort_order" : ""}) VALUES (?, ?${table === "content_media" ? ", ?, 0" : table === "content_sources" || table === "content_relations" ? ", ?" : ""})`);
  ids.forEach((id, index) => {
    if (table === "content_tags") insert.run(contentId, id);
    else insert.run(contentId, id, index);
  });
}

function contentRow(database: SqliteDatabase, id: string) {
  const row = database.prepare(`
    SELECT id, type, status, featured, start_date, end_date, date_precision, period_id,
      location, result, role, artifact_meta, reviewed_by, reviewed_at, published_at,
      rejection_reason, version, updated_at, updated_by
    FROM content_nodes WHERE id = ?
  `).get(id) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError(404, "CONTENT_NOT_FOUND", "Nội dung không tồn tại.");
  return row;
}

function translationMap(database: SqliteDatabase, id: string) {
  const rows = database.prepare(`
    SELECT id, locale, title, slug, summary, body, seo_title, seo_description,
      translation_status, version, updated_at
    FROM content_translations WHERE node_id = ? ORDER BY locale
  `).all(id) as Array<Record<string, unknown>>;
  return Object.fromEntries(rows.map((row) => [row.locale as string, {
    id: row.id, locale: row.locale, version: row.version, title: row.title, slug: row.slug,
    summary: row.summary, body: row.body, seoTitle: row.seo_title, seoDescription: row.seo_description,
    translationStatus: row.translation_status, updatedAt: row.updated_at,
  }]));
}

export function adminContentDetail(database: SqliteDatabase, id: string) {
  const row = contentRow(database, id);
  const ids = (table: string, column: string) => (database.prepare(`SELECT ${column} AS id FROM ${table} WHERE content_id = ? ORDER BY ${table === "content_tags" ? column : "sort_order"}, ${column}`).all(id) as Array<{ id: string }>).map((item) => item.id);
  const translations = translationMap(database, id);
  const titles = Object.fromEntries(Object.entries(translations).map(([locale, value]) => [locale, (value as { title: string }).title]));
  return {
    id: row.id, type: row.type, status: row.status, featured: row.featured === 1,
    version: row.version, titles, updatedAt: row.updated_at, updatedBy: row.updated_by,
    startDate: row.start_date, endDate: row.end_date, datePrecision: row.date_precision,
    periodId: row.period_id, location: row.location, result: row.result, role: row.role,
    artifactMeta: row.artifact_meta ? JSON.parse(row.artifact_meta as string) : null,
    tagIds: ids("content_tags", "tag_id"), relatedIds: ids("content_relations", "related_id"),
    sourceIds: ids("content_sources", "source_id"), mediaIds: ids("content_media", "media_id"),
    translations,
  };
}

export function listAdminContents(database: SqliteDatabase, search: URLSearchParams) {
  const { page: p, pageSize, offset } = page(search);
  const conditions: string[] = [];
  const params: unknown[] = [];
  const type = search.get("type");
  const status = search.get("status");
  const locale = search.get("locale");
  const q = search.get("q")?.trim();
  if (type) {
    if (!contentTypes.includes(type as never)) throw new ApiError(400, "INVALID_QUERY", "Content type không hợp lệ.");
    conditions.push("n.type = ?"); params.push(type);
  }
  if (status) {
    if (!workflowStatuses.includes(status as never)) throw new ApiError(400, "INVALID_QUERY", "Status không hợp lệ.");
    conditions.push("n.status = ?"); params.push(status);
  }
  if (locale) {
    if (!locales.includes(locale as never)) throw new ApiError(400, "INVALID_QUERY", "Locale không hợp lệ.");
    conditions.push("EXISTS (SELECT 1 FROM content_translations lt WHERE lt.node_id = n.id AND lt.locale = ?)"); params.push(locale);
  }
  if (q) { conditions.push("EXISTS (SELECT 1 FROM content_translations qt WHERE qt.node_id = n.id AND qt.search_text LIKE ?)"); params.push(`%${normalizeSearchText(q)}%`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM content_nodes n ${where}`).get(...params) as { count: number }).count;
  const rows = database.prepare(`
    SELECT n.id, n.type, n.status, n.featured, n.version, n.updated_at, n.updated_by,
      MAX(CASE WHEN t.locale = 'vi' THEN t.title END) AS title_vi,
      MAX(CASE WHEN t.locale = 'en' THEN t.title END) AS title_en
    FROM content_nodes n LEFT JOIN content_translations t ON t.node_id = n.id ${where}
    GROUP BY n.id ORDER BY n.updated_at DESC, n.id LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Array<Record<string, unknown>>;
  return { data: rows.map((row) => ({
    id: row.id, type: row.type, status: row.status, featured: row.featured === 1, version: row.version,
    titles: { ...(row.title_vi ? { vi: row.title_vi } : {}), ...(row.title_en ? { en: row.title_en } : {}) },
    updatedAt: row.updated_at, updatedBy: row.updated_by,
  })), meta: meta(p, pageSize, total) };
}

function parseTranslation(input: Record<string, unknown>, includeVersion: boolean) {
  const title = stringField(input, "title", { required: true, max: 300 })!;
  const slug = stringField(input, "slug", { required: true, max: 200 })!;
  const summary = stringField(input, "summary", { required: true, max: 2_000 })!;
  const body = stringField(input, "body", { required: true, max: 100_000 })!;
  const seoTitle = stringField(input, "seoTitle", { required: true, max: 300 })!;
  const seoDescription = stringField(input, "seoDescription", { required: true, max: 500 })!;
  for (const [field, value] of Object.entries({ title, summary, body, seoTitle, seoDescription })) rejectMarkup(value, field);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) invalidField("slug", "Chỉ nhận slug chữ thường ASCII và dấu gạch nối.");
  const translationStatus = enumValue(input, "translationStatus", editableTranslationStatuses, true)!;
  return { version: includeVersion ? numberField(input, "version", true)! : undefined, title, slug, summary, body, seoTitle, seoDescription, translationStatus };
}

function parseContentFields(input: Record<string, unknown>) {
  const artifactMeta = input.artifactMeta;
  if (artifactMeta !== undefined && (artifactMeta === null || typeof artifactMeta !== "object" || Array.isArray(artifactMeta) || Object.values(artifactMeta as object).some((value) => typeof value !== "string"))) {
    invalidField("artifactMeta", "Phải là object chuỗi.");
  }
  return {
    featured: booleanField(input, "featured"), startDate: isoDate(input, "startDate"), endDate: isoDate(input, "endDate"),
    datePrecision: enumValue(input, "datePrecision", ["DAY", "MONTH", "YEAR", "APPROXIMATE"] as const),
    periodId: stringField(input, "periodId", { max: 200 }), location: stringField(input, "location", { max: 500 }),
    result: stringField(input, "result", { max: 2_000 }), role: stringField(input, "role", { max: 500 }),
    artifactMeta: artifactMeta as Record<string, string> | undefined,
    tagIds: stringArrayField(input, "tagIds"), relatedIds: stringArrayField(input, "relatedIds"),
    sourceIds: stringArrayField(input, "sourceIds"), mediaIds: stringArrayField(input, "mediaIds"),
  };
}

function validateContentDates(fields: ReturnType<typeof parseContentFields>, current?: Record<string, unknown>): void {
  const start = fields.startDate ?? current?.start_date as string | undefined;
  const end = fields.endDate ?? current?.end_date as string | undefined;
  const precision = fields.datePrecision ?? current?.date_precision as string | undefined;
  if (end && !start) invalidField("endDate", "Cần startDate.");
  if (start && end && end < start) invalidField("endDate", "Không được trước startDate.");
  if (precision && !start) invalidField("datePrecision", "Cần startDate.");
}

function validateLinks(database: SqliteDatabase, fields: ReturnType<typeof parseContentFields>, contentId?: string) {
  ensureReferences(database, "tags", fields.tagIds ?? [], "tagIds");
  ensureReferences(database, "sources", fields.sourceIds ?? [], "sourceIds");
  ensureReferences(database, "media", fields.mediaIds ?? [], "mediaIds");
  ensureReferences(database, "content_nodes", fields.relatedIds ?? [], "relatedIds");
  if (fields.periodId) ensureReferences(database, "content_nodes", [fields.periodId], "periodId");
  if (contentId && (fields.relatedIds?.includes(contentId) || fields.periodId === contentId)) invalidField("relatedIds", "Nội dung không thể tự tham chiếu.");
  if(contentId&&fields.sourceIds){const required=(database.prepare("SELECT DISTINCT source_id AS id FROM claim_evidence WHERE content_id=? ORDER BY source_id").all(contentId)as Array<{id:string}>).map((item)=>item.id);const missing=required.filter((id)=>!fields.sourceIds!.includes(id));if(missing.length)invalidField("sourceIds","Không thể gỡ nguồn đang được luận điểm dùng làm bằng chứng.");}
}

export function createContent(database: SqliteDatabase, input: Record<string, unknown>, actor: AuthUser) {
  const type = enumValue(input, "type", contentTypes, true)!;
  const fields = parseContentFields(input);
  validateContentDates(fields);
  if (!fields.sourceIds) invalidField("sourceIds", "Bắt buộc.");
  const rawTranslations = input.translations;
  if (!rawTranslations || typeof rawTranslations !== "object" || Array.isArray(rawTranslations)) invalidField("translations", "Phải là object theo locale.");
  const translations = Object.entries(rawTranslations as Record<string, unknown>).map(([locale, value]) => {
    if (!locales.includes(locale as Locale) || !value || typeof value !== "object" || Array.isArray(value)) invalidField("translations", "Locale hoặc translation không hợp lệ.");
    return { locale: locale as Locale, ...parseTranslation(value as Record<string, unknown>, false) };
  });
  validateLinks(database, fields);
  const id = randomUUID();
  const now = new Date().toISOString();
  database.transaction(() => {
    database.prepare(`
      INSERT INTO content_nodes (
        id, type, status, featured, start_date, end_date, date_precision, period_id,
        location, location_en, result, result_en, role, role_en, artifact_meta, artifact_meta_en,
        reviewed_by, published_at, created_at, updated_at, updated_by
      ) VALUES (?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, NULL, ?, NULL, '', '', ?, ?, ?)
    `).run(id, type, fields.featured ? 1 : 0, fields.startDate ?? null, fields.endDate ?? null, fields.datePrecision ?? null,
      fields.periodId ?? null, fields.location ?? null, fields.result ?? null, fields.role ?? null,
      fields.artifactMeta ? JSON.stringify(fields.artifactMeta) : null, now, now, actor.id);
    if (fields.tagIds) replaceLinks(database, "content_tags", id, "tag_id", fields.tagIds);
    if (fields.relatedIds) replaceLinks(database, "content_relations", id, "related_id", fields.relatedIds);
    replaceLinks(database, "content_sources", id, "source_id", fields.sourceIds!);
    if (fields.mediaIds) replaceLinks(database, "content_media", id, "media_id", fields.mediaIds);
    const insert = database.prepare(`
      INSERT INTO content_translations (id, node_id, locale, title, slug, summary, body, seo_title, seo_description,
        translation_status, search_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const translation of translations) insert.run(randomUUID(), id, translation.locale, translation.title, translation.slug,
      translation.summary, translation.body, translation.seoTitle, translation.seoDescription, translation.translationStatus,
      normalizeSearchText(`${translation.title} ${translation.summary} ${translation.body}`), now, now);
    writeAudit(database, { actorId: actor.id, action: "content.create", objectType: "content", objectId: id, metadata: { type, locales: translations.map((item) => item.locale) } });
  }).immediate();
  return adminContentDetail(database, id);
}

export function updateContent(database: SqliteDatabase, id: string, input: Record<string, unknown>, actor: AuthUser) {
  const expectedVersion = numberField(input, "version", true)!;
  const fields = parseContentFields(input);
  const current = contentRow(database, id);
  validateContentDates(fields, current);
  validateLinks(database, fields, id);
  if (current.status === "ARCHIVED" || current.status === "PUBLISHED") throw new ApiError(422, "ILLEGAL_WORKFLOW", "Nội dung đã xuất bản hoặc lưu trữ không thể sửa trực tiếp.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const result = database.prepare(`
      UPDATE content_nodes SET featured = COALESCE(?, featured), start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date), date_precision = COALESCE(?, date_precision), period_id = COALESCE(?, period_id),
        location = COALESCE(?, location), result = COALESCE(?, result), role = COALESCE(?, role),
        artifact_meta = COALESCE(?, artifact_meta), version = version + 1, updated_at = ?, updated_by = ?
      WHERE id = ? AND version = ?
    `).run(fields.featured === undefined ? null : fields.featured ? 1 : 0, fields.startDate ?? null, fields.endDate ?? null,
      fields.datePrecision ?? null, fields.periodId ?? null, fields.location ?? null, fields.result ?? null, fields.role ?? null,
      fields.artifactMeta ? JSON.stringify(fields.artifactMeta) : null, now, actor.id, id, expectedVersion);
    if (result.changes !== 1) throw new ApiError(409, "STALE_VERSION", "Phiên bản nội dung đã thay đổi.");
    if (fields.tagIds) replaceLinks(database, "content_tags", id, "tag_id", fields.tagIds);
    if (fields.relatedIds) replaceLinks(database, "content_relations", id, "related_id", fields.relatedIds);
    if (fields.sourceIds) replaceLinks(database, "content_sources", id, "source_id", fields.sourceIds);
    if (fields.mediaIds) replaceLinks(database, "content_media", id, "media_id", fields.mediaIds);
    writeAudit(database, { actorId: actor.id, action: "content.update", objectType: "content", objectId: id, metadata: { fromVersion: expectedVersion } });
  }).immediate();
  return adminContentDetail(database, id);
}

export function putTranslation(database: SqliteDatabase, id: string, locale: string, input: Record<string, unknown>, actor: AuthUser) {
  if (!locales.includes(locale as Locale)) throw new ApiError(404, "LOCALE_NOT_FOUND", "Locale không hợp lệ.");
  const parsed = parseTranslation(input, true);
  const now = new Date().toISOString();
  try {
    database.transaction(() => {
      const node = contentRow(database, id);
      if (node.status === "ARCHIVED") throw new ApiError(422, "ILLEGAL_WORKFLOW", "Nội dung đã lưu trữ không thể sửa bản dịch.");
      const existing = database.prepare("SELECT id, version, translation_status FROM content_translations WHERE node_id = ? AND locale = ?").get(id, locale) as { id: string; version: number; translation_status: string } | undefined;
      if (existing?.translation_status === "PUBLISHED") throw new ApiError(422, "ILLEGAL_WORKFLOW", "Bản dịch đã xuất bản không thể sửa trực tiếp.");
      if (existing) {
        const result = database.prepare(`
          UPDATE content_translations SET title=?, slug=?, summary=?, body=?, seo_title=?, seo_description=?,
            translation_status=?, search_text=?, version=version+1, updated_at=? WHERE id=? AND version=?
        `).run(parsed.title, parsed.slug, parsed.summary, parsed.body, parsed.seoTitle, parsed.seoDescription,
          parsed.translationStatus, normalizeSearchText(`${parsed.title} ${parsed.summary} ${parsed.body}`), now, existing.id, parsed.version);
        if (result.changes !== 1) throw new ApiError(409, "STALE_VERSION", "Phiên bản bản dịch đã thay đổi.");
      } else {
        if (parsed.version !== 0) throw new ApiError(409, "STALE_VERSION", "Bản dịch mới phải có version 0.");
        database.prepare(`
          INSERT INTO content_translations (id,node_id,locale,title,slug,summary,body,seo_title,seo_description,translation_status,search_text,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(randomUUID(), id, locale, parsed.title, parsed.slug, parsed.summary, parsed.body, parsed.seoTitle, parsed.seoDescription,
          parsed.translationStatus, normalizeSearchText(`${parsed.title} ${parsed.summary} ${parsed.body}`), now, now);
      }
      database.prepare("UPDATE content_nodes SET version=version+1, updated_at=?, updated_by=? WHERE id=?").run(now, actor.id, id);
      writeAudit(database, { actorId: actor.id, action: "translation.upsert", objectType: "content", objectId: id, metadata: { locale } });
    }).immediate();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.message.includes("slug conflicts")) throw new ApiError(409, "SLUG_CONFLICT", "Slug đã tồn tại trong locale và loại nội dung.");
    throw error;
  }
  return (adminContentDetail(database, id).translations as Record<string, unknown>)[locale];
}

function sourceInput(input: Record<string, unknown>, includeVersion: boolean) {
  const title = stringField(input, "title", { required: true, max: 500 })!;
  rejectMarkup(title, "title");
  const checksum = stringField(input, "checksum", { max: 64 });
  if (checksum !== undefined && !/^[a-f0-9]{64}$/.test(checksum)) invalidField("checksum", "Phải là SHA-256 chữ thường gồm 64 ký tự hex.");
  const values = {
    version: includeVersion ? numberField(input, "version", true)! : undefined,
    title,
    author: stringField(input, "author", { max: 300 }),
    publisher: stringField(input, "publisher", { max: 300 }),
    year: numberField(input, "year"),
    url: httpsUrl(input, "url"),
    accessedAt: isoTimestamp(input, "accessedAt", true)!,
    citationNote: stringField(input, "citationNote", { max: 2_000 }),
    sourceType: enumValue(input, "sourceType", sourceTypes, true)! as SourceType,
    qualityTier: enumValue(input, "qualityTier", sourceQualityTiers, true)! as SourceQualityTier,
    institution: stringField(input, "institution", { max: 300 }),
    identifier: stringField(input, "identifier", { max: 300 }),
    edition: stringField(input, "edition", { max: 300 }),
    archivedUrl: optionalHttpsUrl(input, "archivedUrl"),
    checksum,
  };
  for (const [field, value] of Object.entries(values)) if (typeof value === "string" && field !== "url" && field !== "archivedUrl") rejectMarkup(value, field);
  return values;
}

function sourceView(row: Record<string, unknown>) {
  return { id: row.id, title: row.title, author: row.author, publisher: row.publisher, year: row.year,
    url: row.url, accessedAt: row.accessed_at, citationNote: row.citation_note,
    sourceType: row.source_type, qualityTier: row.quality_tier, institution: row.institution,
    identifier: row.identifier, edition: row.edition, archivedUrl: row.archived_url,
    checksum: row.checksum, verificationStatus: row.verification_status,
    verifiedBy: row.verified_by_name ?? null, verifiedAt: row.verified_at,
    verificationNote: row.verification_note, version: row.version };
}

function sourceRecord(database: SqliteDatabase, id: string) {
  return database.prepare(`
    SELECT s.*, verifier.display_name AS verified_by_name
    FROM sources s LEFT JOIN users verifier ON verifier.id = s.verified_by
    WHERE s.id = ?
  `).get(id) as Record<string, unknown> | undefined;
}

export function listSources(database: SqliteDatabase, search: URLSearchParams) {
  const { page: p, pageSize, offset } = page(search);
  const conditions: string[] = [];
  const params: unknown[] = [];
  const q = search.get("q")?.trim();
  if (q) {
    conditions.push("(s.title LIKE ? OR s.author LIKE ? OR s.publisher LIKE ? OR s.institution LIKE ? OR s.identifier LIKE ?)");
    params.push(...Array(5).fill(`%${q}%`));
  }
  for (const [query, column, values] of [
    ["sourceType", "s.source_type", sourceTypes],
    ["qualityTier", "s.quality_tier", sourceQualityTiers],
    ["verificationStatus", "s.verification_status", verificationStatuses],
  ] as const) {
    const value = search.get(query);
    if (value) {
      if (!(values as readonly string[]).includes(value)) throw new ApiError(400, "INVALID_QUERY", `${query} không hợp lệ.`);
      conditions.push(`${column} = ?`);
      params.push(value);
    }
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM sources s ${where}`).get(...params) as { count: number }).count;
  const rows = database.prepare(`SELECT s.*, verifier.display_name AS verified_by_name FROM sources s LEFT JOIN users verifier ON verifier.id=s.verified_by ${where} ORDER BY s.updated_at DESC,s.id LIMIT ? OFFSET ?`).all(...params,pageSize,offset) as Array<Record<string, unknown>>;
  return { data: rows.map(sourceView), meta: meta(p,pageSize,total) };
}

export function createSource(database: SqliteDatabase, input: Record<string, unknown>, actor: AuthUser) {
  const value = sourceInput(input,false); const id=randomUUID(); const now=new Date().toISOString();
  database.transaction(()=>{ database.prepare(`INSERT INTO sources(id,title,author,publisher,year,url,accessed_at,citation_note,source_type,quality_tier,institution,identifier,edition,archived_url,checksum,verification_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'DRAFT',?,?)`).run(id,value.title,value.author??null,value.publisher??null,value.year??null,value.url,value.accessedAt,value.citationNote??null,value.sourceType,value.qualityTier,value.institution??null,value.identifier??null,value.edition??null,value.archivedUrl??null,value.checksum??null,now,now); writeAudit(database,{actorId:actor.id,action:"source.create",objectType:"source",objectId:id,metadata:{sourceType:value.sourceType,qualityTier:value.qualityTier}}); }).immediate();
  return sourceView(sourceRecord(database,id)!);
}

function demoteClaimsForSource(database: SqliteDatabase, sourceId: string, actorId: string, now: string) {
  const claims=database.prepare(`SELECT DISTINCT c.id FROM content_claims c JOIN claim_evidence ce ON ce.claim_id=c.id WHERE ce.source_id=? AND c.verification_status='VERIFIED' ORDER BY c.id`).all(sourceId) as Array<{id:string}>;
  database.prepare(`
    UPDATE content_claims
    SET verification_status='NEEDS_REVIEW', verified_by=NULL, verified_at=NULL,
      verification_note='Evidence source changed verification state', version=version+1,
      updated_by=?, updated_at=?
    WHERE verification_status='VERIFIED' AND id IN (
      SELECT claim_id FROM claim_evidence WHERE source_id=?
    )
  `).run(actorId, now, sourceId);
  for(const claim of claims)writeAudit(database,{actorId,action:"claim.demote",objectType:"claim",objectId:claim.id,metadata:{sourceId,reason:"evidence-source-state-changed"}});
  return claims.length;
}

export function updateSource(database: SqliteDatabase,id:string,input:Record<string,unknown>,actor:AuthUser){
  const value=sourceInput(input,true); const now=new Date().toISOString();
  database.transaction(()=>{if(database.prepare("SELECT 1 FROM content_sources cs JOIN content_nodes n ON n.id=cs.content_id WHERE cs.source_id=? AND n.status='PUBLISHED' LIMIT 1").get(id))throw new ApiError(422,"PUBLISHED_REFERENCE_IMMUTABLE","Nguồn đã gắn với nội dung xuất bản; hãy tạo nguồn mới và đi lại workflow.");const result=database.prepare(`UPDATE sources SET title=?,author=?,publisher=?,year=?,url=?,accessed_at=?,citation_note=?,source_type=?,quality_tier=?,institution=?,identifier=?,edition=?,archived_url=?,checksum=?,verification_status='DRAFT',verified_by=NULL,verified_at=NULL,verification_note=NULL,version=version+1,updated_at=? WHERE id=? AND version=?`).run(value.title,value.author??null,value.publisher??null,value.year??null,value.url,value.accessedAt,value.citationNote??null,value.sourceType,value.qualityTier,value.institution??null,value.identifier??null,value.edition??null,value.archivedUrl??null,value.checksum??null,now,id,value.version); if(result.changes!==1){if(!database.prepare("SELECT 1 FROM sources WHERE id=?").get(id)) throw new ApiError(404,"SOURCE_NOT_FOUND","Nguồn không tồn tại.");throw new ApiError(409,"STALE_VERSION","Phiên bản nguồn đã thay đổi.");}const demotedClaims=demoteClaimsForSource(database,id,actor.id,now);writeAudit(database,{actorId:actor.id,action:"source.update",objectType:"source",objectId:id,metadata:{demotedClaims}});}).immediate();
  return sourceView(sourceRecord(database,id)!);
}

function verificationInput(input: Record<string, unknown>) {
  const status = enumValue(input,"status",["NEEDS_REVIEW","VERIFIED","REJECTED"] as const,true)!;
  const note = stringField(input,"note",{max:2_000});
  if (status === "REJECTED" && !note) invalidField("note","Cần lý do khi từ chối.");
  if (note) rejectMarkup(note,"note");
  return { version:numberField(input,"version",true)!,status,note };
}

function requireReviewer(actor: AuthUser, status: VerificationStatus) {
  if (status !== "NEEDS_REVIEW" && actor.role !== "ADMIN" && actor.role !== "REVIEWER") {
    throw new ApiError(403,"FORBIDDEN","Chỉ Reviewer hoặc Admin được xác minh hay từ chối.");
  }
}

export function transitionSourceVerification(database: SqliteDatabase,id:string,input:Record<string,unknown>,actor:AuthUser){
  const value=verificationInput(input);requireReviewer(actor,value.status);const now=new Date().toISOString();
  database.transaction(()=>{
    const row=database.prepare("SELECT version,verification_status,source_type,quality_tier,author,publisher,institution FROM sources WHERE id=?").get(id) as Record<string,unknown>|undefined;
    if(!row)throw new ApiError(404,"SOURCE_NOT_FOUND","Nguồn không tồn tại.");
    if(row.version!==value.version)throw new ApiError(409,"STALE_VERSION","Phiên bản nguồn đã thay đổi.");
    if(value.status==="NEEDS_REVIEW"&&!(["DRAFT","REJECTED"] as const).includes(row.verification_status as never))throw new ApiError(422,"ILLEGAL_VERIFICATION_WORKFLOW","Nguồn không thể gửi duyệt từ trạng thái hiện tại.");
    if(value.status!=="NEEDS_REVIEW"&&row.verification_status!=="NEEDS_REVIEW"&&!(value.status==="REJECTED"&&row.verification_status==="VERIFIED"))throw new ApiError(422,"ILLEGAL_VERIFICATION_WORKFLOW","Nguồn phải ở NEEDS_REVIEW trước khi duyệt.");
    if(value.status==="VERIFIED"){
      if(row.source_type==="DISCOVERY_ONLY"||row.quality_tier==="TIER_5_DISCOVERY")throw new ApiError(422,"SOURCE_NOT_VERIFIABLE","Nguồn discovery-only không được dùng làm bằng chứng đã xác minh.");
      if(!row.author&&!row.publisher&&!row.institution)throw new ApiError(422,"SOURCE_PROVENANCE_INCOMPLETE","Nguồn cần tác giả, nhà xuất bản hoặc cơ quan lưu giữ.");
    }
    const demotedClaims=value.status==="VERIFIED"?0:demoteClaimsForSource(database,id,actor.id,now);
    database.prepare(`UPDATE sources SET verification_status=?,verified_by=?,verified_at=?,verification_note=?,version=version+1,updated_at=? WHERE id=?`).run(value.status,value.status==="VERIFIED"?actor.id:null,value.status==="VERIFIED"?now:null,value.note??null,now,id);
    const action=value.status==="NEEDS_REVIEW"?"source.submit-review":value.status==="VERIFIED"?"source.verify":"source.reject";
    writeAudit(database,{actorId:actor.id,action,objectType:"source",objectId:id,metadata:{note:value.note??null,demotedClaims}});
  }).immediate();
  return sourceView(sourceRecord(database,id)!);
}

type ClaimEvidenceInput = { sourceId:string;locator:string;quote?:string;note?:string };
function claimInput(input:Record<string,unknown>,includeVersion:boolean){
  const claimType=enumValue(input,"claimType",claimTypes,true)! as ClaimType;
  const assessment=enumValue(input,"assessment",claimAssessments,true)! as ClaimAssessment;
  const statementVi=stringField(input,"statementVi",{required:true,max:4_000})!;
  const statementEn=stringField(input,"statementEn",{required:true,max:4_000})!;
  rejectMarkup(statementVi,"statementVi");rejectMarkup(statementEn,"statementEn");
  if(!Array.isArray(input.evidence)||input.evidence.length===0)invalidField("evidence","Cần ít nhất một bằng chứng.");
  if(input.evidence.length>20)invalidField("evidence","Tối đa 20 bằng chứng cho một luận điểm.");
  const evidence=(input.evidence as unknown[]).map((entry,index)=>{
    if(!entry||typeof entry!=="object"||Array.isArray(entry))invalidField(`evidence.${index}`,"Bằng chứng không hợp lệ.");
    const record=entry as Record<string,unknown>;
    const value={sourceId:stringField(record,"sourceId",{required:true,max:100})!,locator:stringField(record,"locator",{required:true,max:500})!,quote:stringField(record,"quote",{max:4_000}),note:stringField(record,"note",{max:2_000})};
    for(const [field,text] of Object.entries(value))if(text)rejectMarkup(text,`evidence.${index}.${field}`);
    return value;
  });
  if(new Set(evidence.map((item)=>item.sourceId)).size!==evidence.length)invalidField("evidence","Mỗi nguồn chỉ xuất hiện một lần trong một luận điểm.");
  return{version:includeVersion?numberField(input,"version",true)!:undefined,claimType,assessment,statementVi,statementEn,evidence};
}

function ensureClaimEvidence(database:SqliteDatabase,contentId:string,evidence:ClaimEvidenceInput[]){
  const statement=database.prepare("SELECT 1 FROM content_sources WHERE content_id=? AND source_id=?");
  evidence.forEach((item,index)=>{if(!statement.get(contentId,item.sourceId))invalidField(`evidence.${index}.sourceId`,"Nguồn phải được gắn với nội dung trước khi dùng làm bằng chứng.");});
}

function claimRecord(database:SqliteDatabase,contentId:string,claimId:string){
  const row=database.prepare(`SELECT c.*, verifier.display_name AS verified_by_name FROM content_claims c LEFT JOIN users verifier ON verifier.id=c.verified_by WHERE c.id=? AND c.content_id=?`).get(claimId,contentId) as Record<string,unknown>|undefined;
  if(!row)throw new ApiError(404,"CLAIM_NOT_FOUND","Luận điểm không tồn tại.");
  return row;
}

function adminClaimView(database:SqliteDatabase,row:Record<string,unknown>){
  const evidence=database.prepare(`SELECT ce.locator,ce.quote,ce.note,s.*,verifier.display_name AS verified_by_name FROM claim_evidence ce JOIN sources s ON s.id=ce.source_id LEFT JOIN users verifier ON verifier.id=s.verified_by WHERE ce.claim_id=? ORDER BY ce.sort_order,s.id`).all(row.id) as Array<Record<string,unknown>>;
  return{id:row.id,contentId:row.content_id,claimType:row.claim_type,assessment:row.assessment,statementVi:row.statement_vi,statementEn:row.statement_en,verificationStatus:row.verification_status,version:row.version,verifiedBy:row.verified_by_name??null,verifiedAt:row.verified_at,verificationNote:row.verification_note,evidence:evidence.map(({locator,quote,note,...sourceRow})=>{const{version:sourceVersion,...source}=sourceView(sourceRow);void sourceVersion;return{source,locator,quote,note};})};
}

export function listClaims(database:SqliteDatabase,contentId:string,search:URLSearchParams){
  contentRow(database,contentId);const{page:p,pageSize,offset}=page(search);const conditions=["c.content_id=?"];const params:unknown[]=[contentId];
  for(const[query,column,values]of[["claimType","c.claim_type",claimTypes],["verificationStatus","c.verification_status",verificationStatuses]]as const){const value=search.get(query);if(value){if(!(values as readonly string[]).includes(value))throw new ApiError(400,"INVALID_QUERY",`${query} không hợp lệ.`);conditions.push(`${column}=?`);params.push(value);}}
  const where=`WHERE ${conditions.join(" AND ")}`;const total=(database.prepare(`SELECT COUNT(*) AS count FROM content_claims c ${where}`).get(...params)as{count:number}).count;
  const rows=database.prepare(`SELECT c.*,verifier.display_name AS verified_by_name FROM content_claims c LEFT JOIN users verifier ON verifier.id=c.verified_by ${where} ORDER BY c.updated_at DESC,c.id LIMIT ? OFFSET ?`).all(...params,pageSize,offset)as Array<Record<string,unknown>>;
  return{data:rows.map((row)=>adminClaimView(database,row)),meta:meta(p,pageSize,total)};
}

function insertClaimEvidence(database:SqliteDatabase,claimId:string,contentId:string,evidence:ClaimEvidenceInput[]){const insert=database.prepare("INSERT INTO claim_evidence(claim_id,content_id,source_id,locator,quote,note,sort_order) VALUES(?,?,?,?,?,?,?)");evidence.forEach((item,index)=>insert.run(claimId,contentId,item.sourceId,item.locator,item.quote??null,item.note??null,index));}

export function createClaim(database:SqliteDatabase,contentId:string,input:Record<string,unknown>,actor:AuthUser){const value=claimInput(input,false);const id=randomUUID();const now=new Date().toISOString();database.transaction(()=>{contentRow(database,contentId);ensureClaimEvidence(database,contentId,value.evidence);database.prepare(`INSERT INTO content_claims(id,content_id,claim_type,assessment,statement_vi,statement_en,verification_status,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,'DRAFT',?,?,?,?)`).run(id,contentId,value.claimType,value.assessment,value.statementVi,value.statementEn,actor.id,actor.id,now,now);insertClaimEvidence(database,id,contentId,value.evidence);writeAudit(database,{actorId:actor.id,action:"claim.create",objectType:"claim",objectId:id,metadata:{contentId,claimType:value.claimType}});}).immediate();return adminClaimView(database,claimRecord(database,contentId,id));}

export function updateClaim(database:SqliteDatabase,contentId:string,claimId:string,input:Record<string,unknown>,actor:AuthUser){const value=claimInput(input,true);const now=new Date().toISOString();database.transaction(()=>{const row=claimRecord(database,contentId,claimId);if(row.version!==value.version)throw new ApiError(409,"STALE_VERSION","Phiên bản luận điểm đã thay đổi.");ensureClaimEvidence(database,contentId,value.evidence);database.prepare(`UPDATE content_claims SET claim_type=?,assessment=?,statement_vi=?,statement_en=?,verification_status='DRAFT',verified_by=NULL,verified_at=NULL,verification_note=NULL,version=version+1,updated_by=?,updated_at=? WHERE id=?`).run(value.claimType,value.assessment,value.statementVi,value.statementEn,actor.id,now,claimId);database.prepare("DELETE FROM claim_evidence WHERE claim_id=?").run(claimId);insertClaimEvidence(database,claimId,contentId,value.evidence);writeAudit(database,{actorId:actor.id,action:"claim.update",objectType:"claim",objectId:claimId,metadata:{contentId}});}).immediate();return adminClaimView(database,claimRecord(database,contentId,claimId));}

export function transitionClaimVerification(database:SqliteDatabase,contentId:string,claimId:string,input:Record<string,unknown>,actor:AuthUser){const value=verificationInput(input);requireReviewer(actor,value.status);const now=new Date().toISOString();database.transaction(()=>{const row=claimRecord(database,contentId,claimId);if(row.version!==value.version)throw new ApiError(409,"STALE_VERSION","Phiên bản luận điểm đã thay đổi.");if(value.status==="NEEDS_REVIEW"&&!(["DRAFT","REJECTED"]as const).includes(row.verification_status as never))throw new ApiError(422,"ILLEGAL_VERIFICATION_WORKFLOW","Luận điểm không thể gửi duyệt từ trạng thái hiện tại.");if(value.status!=="NEEDS_REVIEW"&&row.verification_status!=="NEEDS_REVIEW"&&!(value.status==="REJECTED"&&row.verification_status==="VERIFIED"))throw new ApiError(422,"ILLEGAL_VERIFICATION_WORKFLOW","Luận điểm phải ở NEEDS_REVIEW trước khi duyệt.");if(value.status==="VERIFIED"){const count=(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence WHERE claim_id=?").get(claimId)as{count:number}).count;if(count===0)throw new ApiError(422,"CLAIM_EVIDENCE_REQUIRED","Luận điểm cần ít nhất một bằng chứng.");const unverified=(database.prepare(`SELECT COUNT(*) AS count FROM claim_evidence ce JOIN sources s ON s.id=ce.source_id WHERE ce.claim_id=? AND s.verification_status<>'VERIFIED'`).get(claimId)as{count:number}).count;if(unverified)throw new ApiError(422,"CLAIM_EVIDENCE_UNVERIFIED","Mọi nguồn bằng chứng phải được VERIFIED.");}database.prepare(`UPDATE content_claims SET verification_status=?,verified_by=?,verified_at=?,verification_note=?,version=version+1,updated_by=?,updated_at=? WHERE id=?`).run(value.status,value.status==="VERIFIED"?actor.id:null,value.status==="VERIFIED"?now:null,value.note??null,actor.id,now,claimId);const action=value.status==="NEEDS_REVIEW"?"claim.submit-review":value.status==="VERIFIED"?"claim.verify":"claim.reject";writeAudit(database,{actorId:actor.id,action,objectType:"claim",objectId:claimId,metadata:{contentId,note:value.note??null}});}).immediate();return adminClaimView(database,claimRecord(database,contentId,claimId));}

function mediaInput(input:Record<string,unknown>,includeVersion:boolean){const kind=enumValue(input,"kind",["IMAGE","DOCUMENT"] as const,true)!;const credit=stringField(input,"credit",{required:true,max:500})!;const license=stringField(input,"license",{required:true,max:500})!;const altVi=stringField(input,"altVi",{required:true,max:1000})!;const altEn=stringField(input,"altEn",{required:true,max:1000})!;for(const [field,value] of Object.entries({credit,license,altVi,altEn}))rejectMarkup(value,field);return{version:includeVersion?numberField(input,"version",true)!:undefined,url:httpsUrl(input,"url"),kind,credit,license,altVi,altEn,captionVi:stringField(input,"captionVi",{max:2000}),captionEn:stringField(input,"captionEn",{max:2000})};}
function mediaView(row:Record<string,unknown>){return{id:row.id,url:row.url,kind:row.kind,credit:row.credit,license:row.license,alt:row.alt_vi,caption:row.caption_vi,width:row.width,height:row.height,version:row.version,altVi:row.alt_vi,altEn:row.alt_en,captionVi:row.caption_vi,captionEn:row.caption_en};}
export function listMedia(database:SqliteDatabase,search:URLSearchParams){const{page:p,pageSize,offset}=page(search);const q=search.get("q")?.trim();const kind=search.get("kind");if(kind&&!(["IMAGE","DOCUMENT"] as const).includes(kind as never))throw new ApiError(400,"INVALID_QUERY","Media kind không hợp lệ.");const conditions:string[]=[];const params:unknown[]=[];if(q){conditions.push("(url LIKE ? OR credit LIKE ? OR alt_vi LIKE ? OR alt_en LIKE ?)");params.push(...Array(4).fill(`%${q}%`));}if(kind){conditions.push("kind=?");params.push(kind);}const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";const total=(database.prepare(`SELECT COUNT(*) AS count FROM media ${where}`).get(...params) as{count:number}).count;const rows=database.prepare(`SELECT * FROM media ${where} ORDER BY updated_at DESC,id LIMIT ? OFFSET ?`).all(...params,pageSize,offset) as Array<Record<string,unknown>>;return{data:rows.map(mediaView),meta:meta(p,pageSize,total)};}
export function createMedia(database:SqliteDatabase,input:Record<string,unknown>,actor:AuthUser){const value=mediaInput(input,false);const id=randomUUID();const now=new Date().toISOString();database.transaction(()=>{database.prepare(`INSERT INTO media(id,url,kind,credit,license,alt_vi,alt_en,caption_vi,caption_en,width,height,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,NULL,NULL,?,?)`).run(id,value.url,value.kind,value.credit,value.license,value.altVi,value.altEn,value.captionVi??null,value.captionEn??null,now,now);writeAudit(database,{actorId:actor.id,action:"media.create",objectType:"media",objectId:id});}).immediate();return mediaView(database.prepare("SELECT * FROM media WHERE id=?").get(id) as Record<string,unknown>);}
export function updateMedia(database:SqliteDatabase,id:string,input:Record<string,unknown>,actor:AuthUser){const value=mediaInput(input,true);const now=new Date().toISOString();database.transaction(()=>{if(database.prepare("SELECT 1 FROM content_media cm JOIN content_nodes n ON n.id=cm.content_id WHERE cm.media_id=? AND n.status='PUBLISHED' LIMIT 1").get(id))throw new ApiError(422,"PUBLISHED_MEDIA_IMMUTABLE","Media đã gắn với nội dung xuất bản; hãy tạo media mới và đi lại workflow.");const result=database.prepare(`UPDATE media SET url=?,kind=?,credit=?,license=?,alt_vi=?,alt_en=?,caption_vi=?,caption_en=?,version=version+1,updated_at=? WHERE id=? AND version=?`).run(value.url,value.kind,value.credit,value.license,value.altVi,value.altEn,value.captionVi??null,value.captionEn??null,now,id,value.version);if(result.changes!==1){if(!database.prepare("SELECT 1 FROM media WHERE id=?").get(id))throw new ApiError(404,"MEDIA_NOT_FOUND","Media không tồn tại.");throw new ApiError(409,"STALE_VERSION","Phiên bản media đã thay đổi.");}writeAudit(database,{actorId:actor.id,action:"media.update",objectType:"media",objectId:id});}).immediate();return mediaView(database.prepare("SELECT * FROM media WHERE id=?").get(id) as Record<string,unknown>);}

function workflowLocales(input:Record<string,unknown>):Locale[]{const values=stringArrayField(input,"locales");if(!values?.length)invalidField("locales","Cần ít nhất một locale.");if(values.some((value)=>!locales.includes(value as Locale)))invalidField("locales","Locale không hợp lệ.");return values as Locale[];}
function hasPublishedTranslation(database:SqliteDatabase,id:string){return Boolean(database.prepare("SELECT 1 FROM content_translations WHERE node_id=? AND translation_status='PUBLISHED' LIMIT 1").get(id));}
function workflowResult(database:SqliteDatabase,id:string){const row=contentRow(database,id);const translations=database.prepare("SELECT locale,translation_status FROM content_translations WHERE node_id=? ORDER BY locale").all(id) as Array<{locale:string;translation_status:string}>;return{id:row.id,status:row.status,version:row.version,translationStatuses:Object.fromEntries(translations.map((item)=>[item.locale,item.translation_status])),reviewedBy:(row.reviewed_by as string)||null,reviewedAt:row.reviewed_at,publishedAt:(row.published_at as string)||null};}

function validationViolations(database:SqliteDatabase,id:string,selected:Locale[]):string[]{
  const violations:string[]=[];
  const node=database.prepare("SELECT type,start_date,end_date,date_precision,location,result,role FROM content_nodes WHERE id=?").get(id) as{type:string;start_date:string|null;end_date:string|null;date_precision:string|null;location:string|null;result:string|null;role:string|null};
  if(node.type==="PERIOD"&&(!node.start_date||!node.end_date||!node.date_precision))violations.push("period requires startDate, endDate and datePrecision");
  const sourceStats=database.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN s.verification_status='VERIFIED' THEN 0 ELSE 1 END) AS unverified FROM content_sources cs JOIN sources s ON s.id=cs.source_id WHERE cs.content_id=?`).get(id) as{total:number;unverified:number|null};
  if(sourceStats.total===0)violations.push("content requires at least one source");
  else if((sourceStats.unverified??0)>0)violations.push("all content sources must be VERIFIED");
  const verifiedClaimTypes=new Set((database.prepare(`SELECT DISTINCT c.claim_type AS claimType FROM content_claims c WHERE c.content_id=? AND c.verification_status='VERIFIED' AND EXISTS(SELECT 1 FROM claim_evidence ce WHERE ce.claim_id=c.id) AND NOT EXISTS(SELECT 1 FROM claim_evidence ce JOIN sources s ON s.id=ce.source_id WHERE ce.claim_id=c.id AND s.verification_status<>'VERIFIED')`).all(id) as Array<{claimType:string}>).map((item)=>item.claimType));
  if(verifiedClaimTypes.size===0)violations.push("content requires at least one VERIFIED claim");
  for(const[populated,type]of[[Boolean(node.start_date||node.end_date),"DATE"],[Boolean(node.location),"PLACE"],[Boolean(node.result),"OUTCOME"],[Boolean(node.role),"PERSON_ROLE"]]as const){if(populated&&!verifiedClaimTypes.has(type))violations.push(`${type}: VERIFIED claim coverage is required`);}
  for(const locale of selected){const t=database.prepare("SELECT title,slug,summary,body,seo_title,seo_description,translation_status FROM content_translations WHERE node_id=? AND locale=?").get(id,locale) as Record<string,string>|undefined;if(!t)violations.push(`${locale}: translation is missing`);else{for(const field of ["title","slug","summary","body","seo_title","seo_description"]){if(!t[field]?.trim())violations.push(`${locale}: ${field} is required`);}if(t.translation_status!=="APPROVED")violations.push(`${locale}: translation must be APPROVED`);}}
  const media=database.prepare(`SELECT m.credit,m.license,m.alt_vi,m.alt_en FROM content_media cm JOIN media m ON m.id=cm.media_id WHERE cm.content_id=?`).all(id) as Array<Record<string,string>>;media.forEach((item,index)=>{if(!item.credit.trim())violations.push(`media[${index}]: credit is required`);if(!item.license.trim())violations.push(`media[${index}]: license is required`);for(const locale of selected){if(!(locale==="vi"?item.alt_vi:item.alt_en).trim())violations.push(`media[${index}]: alt ${locale} is required`);}});return violations;
}

export function transitionWorkflow(database:SqliteDatabase,id:string,action:WorkflowAction,input:Record<string,unknown>,actor:AuthUser){const expectedVersion=numberField(input,"version",true)!;const selected=action==="archive"?[]:workflowLocales(input);const reason=action==="reject"?stringField(input,"reason",{required:true,max:2000}):undefined;const note=action==="approve"?stringField(input,"note",{max:2000}):undefined;const now=new Date().toISOString();database.transaction(()=>{const row=contentRow(database,id);if(row.version!==expectedVersion)throw new ApiError(409,"STALE_VERSION","Phiên bản nội dung đã thay đổi.");if(row.status==="ARCHIVED")throw new ApiError(422,"ILLEGAL_WORKFLOW","Nội dung đã lưu trữ.");if(action==="archive"){database.prepare("UPDATE content_nodes SET status='ARCHIVED',version=version+1,updated_at=?,updated_by=? WHERE id=?").run(now,actor.id,id);}else if(action==="submit-review"){for(const locale of selected){const result=database.prepare("UPDATE content_translations SET translation_status='READY_FOR_REVIEW',version=version+1,updated_at=? WHERE node_id=? AND locale=? AND translation_status='TRANSLATING'").run(now,id,locale);if(result.changes!==1)throw new ApiError(422,"ILLEGAL_WORKFLOW",`${locale} chưa sẵn sàng để gửi duyệt.`);}const status=hasPublishedTranslation(database,id)?"PUBLISHED":"IN_REVIEW";database.prepare("UPDATE content_nodes SET status=?,rejection_reason=NULL,version=version+1,updated_at=?,updated_by=? WHERE id=?").run(status,now,actor.id,id);}else if(action==="approve"){for(const locale of selected){const result=database.prepare("UPDATE content_translations SET translation_status='APPROVED',version=version+1,updated_at=? WHERE node_id=? AND locale=? AND translation_status='READY_FOR_REVIEW'").run(now,id,locale);if(result.changes!==1)throw new ApiError(422,"ILLEGAL_WORKFLOW",`${locale} không ở READY_FOR_REVIEW.`);}const status=hasPublishedTranslation(database,id)?"PUBLISHED":"APPROVED";database.prepare("UPDATE content_nodes SET status=?,reviewed_by=?,reviewed_at=?,rejection_reason=NULL,version=version+1,updated_at=?,updated_by=? WHERE id=?").run(status,actor.displayName,now,now,actor.id,id);}else if(action==="reject"){for(const locale of selected){const result=database.prepare("UPDATE content_translations SET translation_status='TRANSLATING',version=version+1,updated_at=? WHERE node_id=? AND locale=? AND translation_status='READY_FOR_REVIEW'").run(now,id,locale);if(result.changes!==1)throw new ApiError(422,"ILLEGAL_WORKFLOW",`${locale} không ở READY_FOR_REVIEW.`);}const status=hasPublishedTranslation(database,id)?"PUBLISHED":"REJECTED";database.prepare("UPDATE content_nodes SET status=?,rejection_reason=?,version=version+1,updated_at=?,updated_by=? WHERE id=?").run(status,reason,now,actor.id,id);}else{const violations=validationViolations(database,id,selected);if(violations.length)throw new ApiError(422,"PUBLISH_VALIDATION_FAILED","Không thể xuất bản.",{violations});for(const locale of selected)database.prepare("UPDATE content_translations SET translation_status='PUBLISHED',version=version+1,updated_at=? WHERE node_id=? AND locale=?").run(now,id,locale);database.prepare("UPDATE content_nodes SET status='PUBLISHED',published_at=CASE WHEN published_at='' THEN ? ELSE published_at END,reviewed_by=CASE WHEN reviewed_by='' THEN ? ELSE reviewed_by END,reviewed_at=COALESCE(reviewed_at,?),version=version+1,updated_at=?,updated_by=? WHERE id=?").run(now,actor.displayName,now,now,actor.id,id);}writeAudit(database,{actorId:actor.id,action:`content.${action}`,objectType:"content",objectId:id,metadata:{locales:selected,...(reason?{reason}:{}),...(note?{note}:{})}});}).immediate();return workflowResult(database,id);}

function userView(row:Record<string,unknown>){return{id:row.id,email:row.email,displayName:row.display_name,role:row.role,active:row.active===1,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at};}
export function listUsers(database:SqliteDatabase,search:URLSearchParams){const{page:p,pageSize,offset}=page(search);const conditions:string[]=[];const params:unknown[]=[];const q=search.get("q")?.trim();const role=search.get("role");const active=search.get("active");if(q){conditions.push("(email LIKE ? OR display_name LIKE ?)");params.push(`%${q}%`,`%${q}%`);}if(role){if(!(["ADMIN","EDITOR","REVIEWER"] as const).includes(role as never))throw new ApiError(400,"INVALID_QUERY","Role không hợp lệ.");conditions.push("role=?");params.push(role);}if(active!==null){if(!["true","false"].includes(active))throw new ApiError(400,"INVALID_QUERY","active không hợp lệ.");conditions.push("active=?");params.push(active==="true"?1:0);}const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";const total=(database.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).get(...params) as{count:number}).count;const rows=database.prepare(`SELECT id,email,display_name,role,active,version,created_at,updated_at FROM users ${where} ORDER BY created_at DESC,id LIMIT ? OFFSET ?`).all(...params,pageSize,offset) as Array<Record<string,unknown>>;return{data:rows.map(userView),meta:meta(p,pageSize,total)};}
export async function createUser(database:SqliteDatabase,input:Record<string,unknown>,actor:AuthUser){const email=stringField(input,"email",{required:true,max:320})!.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))invalidField("email","Email không hợp lệ.");const displayName=stringField(input,"displayName",{required:true,max:200})!;const role=enumValue(input,"role",["ADMIN","EDITOR","REVIEWER"] as const,true)!;const temporaryPassword=secretField(input,"temporaryPassword",true)!;const active=booleanField(input,"active")??false;let passwordHash:string;try{passwordHash=await hashPassword(temporaryPassword);}catch{invalidField("temporaryPassword","Mật khẩu phải có 12-256 ký tự.");}const id=randomUUID();const now=new Date().toISOString();try{database.transaction(()=>{database.prepare("INSERT INTO users(id,email,display_name,role,password_hash,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").run(id,email,displayName,role,passwordHash,active?1:0,now,now);writeAudit(database,{actorId:actor.id,action:"user.create",objectType:"user",objectId:id,metadata:{email,role,active}});}).immediate();}catch(error){if(error instanceof Error&&error.message.includes("UNIQUE"))throw new ApiError(409,"EMAIL_CONFLICT","Email đã tồn tại.");throw error;}return userView(database.prepare("SELECT id,email,display_name,role,active,version,created_at,updated_at FROM users WHERE id=?").get(id) as Record<string,unknown>);}
export async function updateUser(database:SqliteDatabase,id:string,input:Record<string,unknown>,actor:AuthUser){
  const version=numberField(input,"version",true)!;
  const displayName=stringField(input,"displayName",{max:200});
  const role=enumValue(input,"role",["ADMIN","EDITOR","REVIEWER"] as const);
  const active=booleanField(input,"active");
  const resetPassword=secretField(input,"resetPassword");
  let passwordHash:string|undefined;
  if(resetPassword){try{passwordHash=await hashPassword(resetPassword);}catch{invalidField("resetPassword","Mật khẩu phải có 12-256 ký tự.");}}
  const now=new Date().toISOString();
  database.transaction(()=>{
    const existing=database.prepare("SELECT role,active,version FROM users WHERE id=?").get(id) as{role:Role;active:number;version:number}|undefined;
    if(!existing)throw new ApiError(404,"USER_NOT_FOUND","Người dùng không tồn tại.");
    if(existing.version!==version)throw new ApiError(409,"STALE_VERSION","Phiên bản người dùng đã thay đổi.");
    if(existing.role==="ADMIN"&&existing.active===1&&((role&&role!=="ADMIN")||active===false)){
      const count=(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role='ADMIN' AND active=1").get() as{count:number}).count;
      if(count<=1)throw new ApiError(422,"LAST_ADMIN_PROTECTED","Không thể vô hiệu hoá hoặc hạ quyền Admin hoạt động cuối cùng.");
    }
    const result=database.prepare(`UPDATE users SET display_name=COALESCE(?,display_name),role=COALESCE(?,role),active=COALESCE(?,active),password_hash=COALESCE(?,password_hash),session_version=session_version+1,version=version+1,updated_at=? WHERE id=? AND version=?`).run(displayName??null,role??null,active===undefined?null:active?1:0,passwordHash??null,now,id,version);
    if(result.changes!==1)throw new ApiError(409,"STALE_VERSION","Phiên bản người dùng đã thay đổi.");
    writeAudit(database,{actorId:actor.id,action:"user.update",objectType:"user",objectId:id,metadata:{role,active,passwordReset:Boolean(passwordHash)}});
  }).immediate();
  return userView(database.prepare("SELECT id,email,display_name,role,active,version,created_at,updated_at FROM users WHERE id=?").get(id) as Record<string,unknown>);
}

export function listAuditLogs(database:SqliteDatabase,search:URLSearchParams){const{page:p,pageSize,offset}=page(search);const conditions:string[]=[];const params:unknown[]=[];for(const [query,column] of [["actorId","a.actor_id"],["action","a.action"],["objectType","a.object_type"],["objectId","a.object_id"]] as const){const value=search.get(query);if(value){conditions.push(`${column}=?`);params.push(value);}}const from=search.get("from");const to=search.get("to");if(from){if(Number.isNaN(Date.parse(from)))throw new ApiError(400,"INVALID_QUERY","from không hợp lệ.");conditions.push("a.created_at>=?");params.push(new Date(from).toISOString());}if(to){if(Number.isNaN(Date.parse(to)))throw new ApiError(400,"INVALID_QUERY","to không hợp lệ.");conditions.push("a.created_at<=?");params.push(new Date(to).toISOString());}const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";const total=(database.prepare(`SELECT COUNT(*) AS count FROM audit_logs a ${where}`).get(...params) as{count:number}).count;const rows=database.prepare(`SELECT a.id,a.action,a.object_type,a.object_id,a.metadata,a.created_at,u.id AS actor_id,u.email,u.display_name,u.role FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ${where} ORDER BY a.created_at DESC,a.id DESC LIMIT ? OFFSET ?`).all(...params,pageSize,offset) as Array<Record<string,unknown>>;return{data:rows.map((row)=>({id:row.id,actor:row.actor_id?{id:row.actor_id,email:row.email,displayName:row.display_name,role:row.role}:null,action:row.action,objectType:row.object_type,objectId:row.object_id,metadata:JSON.parse(row.metadata as string),createdAt:row.created_at})),meta:meta(p,pageSize,total)};}
export function dashboard(database:SqliteDatabase){const statuses=Object.fromEntries(workflowStatuses.map((status)=>[status,(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE status=?").get(status) as{count:number}).count]));const types=Object.fromEntries(contentTypes.map((type)=>[type,(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE type=?").get(type) as{count:number}).count]));const recentAudit=database.prepare("SELECT action,object_type AS objectType,object_id AS objectId,created_at AS createdAt FROM audit_logs ORDER BY created_at DESC,id DESC LIMIT 10").all();return{countsByStatus:statuses,countsByType:types,recentAudit};}
