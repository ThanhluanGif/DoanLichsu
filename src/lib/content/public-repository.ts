import type { SqliteDatabase } from "@/lib/db/connection";
import { normalizeSearchText } from "@/lib/search/normalize";
import { contentTypes, type ClaimView, type ContentDetail, type ContentListItem, type ContentType, type Locale, type MediaView, type PeriodRef, type PeriodView, type PublicSourceItem, type SearchResult, type SourceContentRef, type TimelineItem } from "./types";
import { PublicApiError, pageMeta, parseContentType, parsePage, optionalYear } from "./validation";

type BaseRow = {
  id: string; type: ContentType; locale: Locale; title: string; slug: string; summary: string;
  body: string; search_text: string; start_date: string | null; end_date: string | null; date_precision: ContentListItem["datePrecision"];
  period_id: string | null; location: string | null; result: string | null; role: string | null;
  artifact_meta: string | null; reviewed_by: string; published_at: string; updated_at: string;
};

const publicSelect = `
  SELECT n.id, n.type, t.locale, t.title, t.slug, t.summary, t.body, t.search_text,
    n.start_date, n.end_date, n.date_precision, n.period_id,
    CASE WHEN t.locale = 'en' THEN n.location_en ELSE n.location END AS location,
    CASE WHEN t.locale = 'en' THEN n.result_en ELSE n.result END AS result,
    CASE WHEN t.locale = 'en' THEN n.role_en ELSE n.role END AS role,
    CASE WHEN t.locale = 'en' THEN n.artifact_meta_en ELSE n.artifact_meta END AS artifact_meta,
    n.reviewed_by, n.published_at, n.updated_at
  FROM content_nodes n
  JOIN content_translations t ON t.node_id = n.id
  WHERE n.status = 'PUBLISHED' AND t.translation_status = 'PUBLISHED'
`;

function periodRef(database: SqliteDatabase, id: string | null, locale: Locale): PeriodRef | null {
  if (!id) return null;
  return (database.prepare(`
    SELECT n.id, t.title, t.slug FROM content_nodes n
    JOIN content_translations t ON t.node_id = n.id
    WHERE n.id = ? AND n.type = 'PERIOD' AND n.status = 'PUBLISHED'
      AND t.locale = ? AND t.translation_status = 'PUBLISHED'
  `).get(id, locale) as PeriodRef | undefined) ?? null;
}

function tags(database: SqliteDatabase, id: string, locale: Locale): string[] {
  return (database.prepare(`
    SELECT CASE WHEN ? = 'vi' THEN tag.name_vi ELSE tag.name_en END AS name
    FROM content_tags ct JOIN tags tag ON tag.id = ct.tag_id
    WHERE ct.content_id = ? ORDER BY tag.slug, tag.id
  `).all(locale, id) as Array<{ name: string }>).map(({ name }) => name);
}

function media(database: SqliteDatabase, id: string, locale: Locale): MediaView[] {
  return (database.prepare(`
    SELECT m.id, m.url, m.kind, m.credit, m.license,
      CASE WHEN ? = 'vi' THEN m.alt_vi ELSE m.alt_en END AS alt,
      CASE WHEN ? = 'vi' THEN m.caption_vi ELSE m.caption_en END AS caption,
      m.width, m.height
    FROM content_media cm JOIN media m ON m.id = cm.media_id
    WHERE cm.content_id = ? ORDER BY cm.sort_order, m.id
  `).all(locale, locale, id) as MediaView[]);
}

function thumbnail(database: SqliteDatabase, id: string, locale: Locale): MediaView | null {
  return (database.prepare(`
    SELECT m.id, m.url, m.kind, m.credit, m.license,
      CASE WHEN ? = 'vi' THEN m.alt_vi ELSE m.alt_en END AS alt,
      CASE WHEN ? = 'vi' THEN m.caption_vi ELSE m.caption_en END AS caption,
      m.width, m.height
    FROM content_media cm JOIN media m ON m.id = cm.media_id
    WHERE cm.content_id = ? AND cm.is_thumbnail = 1
    ORDER BY cm.sort_order, m.id LIMIT 1
  `).get(locale, locale, id) as MediaView | undefined) ?? null;
}

function listItem(database: SqliteDatabase, row: BaseRow, locale: Locale): ContentListItem {
  return {
    id: row.id,
    type: row.type,
    locale,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    thumbnail: thumbnail(database, row.id, locale),
    startDate: row.start_date,
    endDate: row.end_date,
    datePrecision: row.date_precision,
    period: periodRef(database, row.period_id, locale),
    tags: tags(database, row.id, locale),
  };
}

function baseRows(database: SqliteDatabase, locale: Locale): BaseRow[] {
  return database.prepare(`${publicSelect} AND t.locale = ?`).all(locale) as BaseRow[];
}

function filterRows(database: SqliteDatabase, locale: Locale, search: URLSearchParams) {
  let rows = baseRows(database, locale);
  const typeValue = search.get("type");
  if (typeValue !== null) {
    const type = parseContentType(typeValue);
    rows = rows.filter((row) => row.type === type);
  }
  const period = search.get("period");
  if (period) {
    const periodId = database.prepare(`
      SELECT n.id FROM content_nodes n JOIN content_translations t ON t.node_id = n.id
      WHERE n.type = 'PERIOD' AND n.status = 'PUBLISHED' AND t.locale = ?
        AND t.translation_status = 'PUBLISHED' AND t.slug = ?
    `).get(locale, period) as { id: string } | undefined;
    rows = rows.filter((row) => row.period_id === periodId?.id);
  }
  const tag = search.get("tag");
  if (tag) {
    const ids = new Set((database.prepare(`
      SELECT ct.content_id AS id FROM content_tags ct JOIN tags tag ON tag.id = ct.tag_id
      WHERE tag.slug = ?
    `).all(tag) as Array<{ id: string }>).map(({ id }) => id));
    rows = rows.filter((row) => ids.has(row.id));
  }
  return rows;
}

function sortRows(rows: BaseRow[], sort: string) {
  const compareId = (a: BaseRow, b: BaseRow) => a.id.localeCompare(b.id, "en");
  return rows.sort((a, b) => {
    if (sort === "updated") return b.updated_at.localeCompare(a.updated_at) || compareId(a, b);
    if (sort === "title") return a.title.localeCompare(b.title, a.locale) || compareId(a, b);
    return (a.start_date ?? "9999-12-31").localeCompare(b.start_date ?? "9999-12-31") || compareId(a, b);
  });
}

export function getContents(database: SqliteDatabase, locale: Locale, search: URLSearchParams) {
  const { page, pageSize } = parsePage(search);
  const sort = search.get("sort") ?? "chronology";
  if (!["chronology", "updated", "title"].includes(sort)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Kiểu sắp xếp không hợp lệ.", { fieldErrors: { sort: ["Chỉ nhận chronology, updated hoặc title."] } });
  }
  const rows = sortRows(filterRows(database, locale, search), sort);
  const total = rows.length;
  const selected = rows.slice((page - 1) * pageSize, page * pageSize);
  return { data: selected.map((row) => listItem(database, row, locale)), meta: pageMeta(page, pageSize, total) };
}

export function getTimeline(database: SqliteDatabase, locale: Locale, search: URLSearchParams) {
  const { page, pageSize } = parsePage(search);
  const fromYear = optionalYear(search, "fromYear");
  const toYear = optionalYear(search, "toYear");
  if (fromYear !== undefined && toYear !== undefined && fromYear > toYear) {
    throw new PublicApiError(400, "INVALID_QUERY", "Khoảng năm không hợp lệ.", { fieldErrors: { fromYear: ["Không được lớn hơn toYear."] } });
  }
  let rows = filterRows(database, locale, search).filter((row) => row.type === "EVENT" && row.date_precision !== null);
  rows = rows.filter((row) => {
    const start = Number((row.start_date ?? "9999").slice(0, 4));
    const end = Number((row.end_date ?? row.start_date ?? "9999").slice(0, 4));
    return (fromYear === undefined || end >= fromYear) && (toYear === undefined || start <= toYear);
  });
  sortRows(rows, "chronology");
  const total = rows.length;
  const data: TimelineItem[] = rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({
    id: row.id, title: row.title, slug: row.slug, startDate: row.start_date, endDate: row.end_date,
    datePrecision: row.date_precision!, period: periodRef(database, row.period_id, locale), summary: row.summary,
  }));
  return { data, meta: pageMeta(page, pageSize, total) };
}

export function getPeriods(database: SqliteDatabase, locale: Locale, includeEmpty: boolean) {
  const rows = (database.prepare(`${publicSelect} AND t.locale = ? AND n.type = 'PERIOD' ORDER BY n.start_date, n.id`).all(locale) as BaseRow[]);
  const data: PeriodView[] = rows.map((row) => {
    const count = database.prepare(`
      SELECT COUNT(*) AS count FROM content_nodes n JOIN content_translations t ON t.node_id = n.id
      WHERE n.period_id = ? AND n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
    `).get(row.id, locale) as { count: number };
    return { id: row.id, title: row.title, slug: row.slug, summary: row.summary, startYear: Number(row.start_date!.slice(0, 4)), endYear: Number(row.end_date!.slice(0, 4)), contentCount: count.count };
  }).filter((period) => includeEmpty || period.contentCount > 0);
  return { data, meta: pageMeta(1, data.length, data.length) };
}

export function getHome(database: SqliteDatabase, locale: Locale) {
  const rows = baseRows(database, locale);
  const counts = Object.fromEntries(contentTypes.map((type) => [type, rows.filter((row) => row.type === type).length])) as Record<ContentType, number>;
  const featuredIds = new Set((database.prepare("SELECT id FROM content_nodes WHERE status = 'PUBLISHED' AND featured = 1 ORDER BY id").all() as Array<{ id: string }>).map(({ id }) => id));
  const featuredRows = rows.filter((row) => featuredIds.has(row.id)).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 6);
  const latestRows = sortRows([...rows], "updated").slice(0, 6);
  return { data: { featured: featuredRows.map((row) => listItem(database, row, locale)), periods: getPeriods(database, locale, true).data, latest: latestRows.map((row) => listItem(database, row, locale)), counts } };
}

export function getSearch(database: SqliteDatabase, locale: Locale, search: URLSearchParams) {
  const query = search.get("q")?.trim() ?? "";
  if (!query) throw new PublicApiError(400, "INVALID_QUERY", "Từ khóa tìm kiếm là bắt buộc.", { fieldErrors: { q: ["Không được để trống."] } });
  if (query.length > 200) throw new PublicApiError(400, "INVALID_QUERY", "Từ khóa tìm kiếm quá dài.", { fieldErrors: { q: ["Tối đa 200 ký tự."] } });
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    throw new PublicApiError(400, "INVALID_QUERY", "Từ khóa tìm kiếm phải chứa chữ hoặc số.", { fieldErrors: { q: ["Không có từ khóa có thể tìm kiếm."] } });
  }
  const tokens = normalized.split(" ").filter(Boolean);
  const { page, pageSize } = parsePage(search);
  const sort = search.get("sort");
  if (sort !== null && !["chronology", "updated", "title"].includes(sort)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Kiểu sắp xếp không hợp lệ.", { fieldErrors: { sort: ["Chỉ nhận chronology, updated hoặc title."] } });
  }
  let rows = filterRows(database, locale, search).filter((row) => {
    return tokens.every((token) => row.search_text.includes(token));
  });
  rows = sort === null ? rows.sort((a, b) => {
    const aTitle = normalizeSearchText(a.title).includes(normalized) ? 0 : 1;
    const bTitle = normalizeSearchText(b.title).includes(normalized) ? 0 : 1;
    return aTitle - bTitle || a.title.localeCompare(b.title, locale) || a.id.localeCompare(b.id);
  }) : sortRows(rows, sort);
  const total = rows.length;
  const data: SearchResult[] = rows.slice((page - 1) * pageSize, page * pageSize).map((row) => {
    const title = normalizeSearchText(row.title);
    const summary = normalizeSearchText(row.summary);
    const matchedOn = tokens.every((token) => title.includes(token)) ? "title" : tokens.every((token) => summary.includes(token)) ? "summary" : "body";
    return { ...listItem(database, row, locale), matchedOn };
  });
  return { data, meta: pageMeta(page, pageSize, total) };
}

function alternateFor(database: SqliteDatabase, id: string, locale: Locale) {
  const other: Locale = locale === "vi" ? "en" : "vi";
  const translation = database.prepare(`
    SELECT t.slug, n.type FROM content_nodes n JOIN content_translations t ON t.node_id = n.id
    WHERE n.id = ? AND n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
  `).get(id, other) as { slug: string; type: ContentType } | undefined;
  return translation ? { locale: other, url: `/api/v1/${other}/contents/${translation.type}/${translation.slug}` } : null;
}

export function getDetail(database: SqliteDatabase, locale: Locale, typeValue: string, slug: string) {
  const type = parseContentType(typeValue);
  const row = database.prepare(`${publicSelect} AND t.locale = ? AND n.type = ? AND t.slug = ?`).get(locale, type, slug) as BaseRow | undefined;
  if (!row) throw new PublicApiError(404, "CONTENT_NOT_FOUND", "Nội dung không tồn tại hoặc chưa được xuất bản.");
  const item = listItem(database, row, locale);
  const sources = database.prepare(`
    SELECT s.id, s.title, s.author, s.publisher, s.year, s.url,
      s.accessed_at AS accessedAt, s.citation_note AS citationNote,
      s.source_type AS sourceType, s.quality_tier AS qualityTier,
      s.institution, s.identifier, s.edition, s.archived_url AS archivedUrl,
      s.checksum, s.verification_status AS verificationStatus,
      verifier.display_name AS verifiedBy, s.verified_at AS verifiedAt,
      s.verification_note AS verificationNote
    FROM content_sources cs JOIN sources s ON s.id = cs.source_id
    LEFT JOIN users verifier ON verifier.id = s.verified_by
    WHERE cs.content_id = ? ORDER BY cs.sort_order, s.id
  `).all(row.id);
  const claimRows = database.prepare(`
    SELECT c.id, c.claim_type AS claimType, c.assessment, c.statement_vi, c.statement_en
    FROM content_claims c
    WHERE c.content_id = ? AND c.verification_status = 'VERIFIED'
      AND EXISTS (SELECT 1 FROM claim_evidence ce WHERE ce.claim_id = c.id)
      AND NOT EXISTS (
        SELECT 1 FROM claim_evidence ce
        JOIN sources evidence_source ON evidence_source.id = ce.source_id
        WHERE ce.claim_id = c.id AND evidence_source.verification_status <> 'VERIFIED'
      )
    ORDER BY c.claim_type, c.id
  `).all(row.id) as Array<Record<string, unknown>>;
  const claims: ClaimView[] = claimRows.map((claim) => {
    const evidence = database.prepare(`
      SELECT s.id, s.title, s.author, s.publisher, s.year, s.url,
        s.accessed_at AS accessedAt, s.citation_note AS citationNote,
        s.source_type AS sourceType, s.quality_tier AS qualityTier,
        s.institution, s.identifier, s.edition, s.archived_url AS archivedUrl,
        s.checksum, s.verification_status AS verificationStatus,
        verifier.display_name AS verifiedBy, s.verified_at AS verifiedAt,
        s.verification_note AS verificationNote,
        ce.locator, ce.quote, ce.note
      FROM claim_evidence ce
      JOIN sources s ON s.id = ce.source_id
      LEFT JOIN users verifier ON verifier.id = s.verified_by
      WHERE ce.claim_id = ? AND s.verification_status = 'VERIFIED'
      ORDER BY ce.sort_order, s.id
    `).all(claim.id) as Array<Record<string, unknown>>;
    return {
      id: claim.id as string,
      claimType: claim.claimType as ClaimView["claimType"],
      assessment: claim.assessment as ClaimView["assessment"],
      statement: (locale === "vi" ? claim.statement_vi : claim.statement_en) as string,
      evidence: evidence.map(({ locator, quote, note, ...source }) => ({
        source: source as unknown as ClaimView["evidence"][number]["source"],
        locator: locator as string,
        quote: quote as string | null,
        note: note as string | null,
      })),
    };
  });
  const relatedRows = database.prepare(`
    ${publicSelect} AND t.locale = ? AND n.id IN (
      SELECT related_id FROM content_relations WHERE content_id = ?
    ) ORDER BY n.start_date, n.id
  `).all(locale, row.id) as BaseRow[];
  const data: ContentDetail = {
    ...item, body: row.body, location: row.location, result: row.result, role: row.role,
    artifactMeta: row.artifact_meta ? JSON.parse(row.artifact_meta) as Record<string, string> : null,
    media: media(database, row.id, locale), sources: sources as ContentDetail["sources"], claims,
    related: relatedRows.map((related) => listItem(database, related, locale)),
    alternate: alternateFor(database, row.id, locale), reviewedBy: row.reviewed_by,
    publishedAt: row.published_at, updatedAt: row.updated_at,
  };
  return { data };
}

export function getTaxonomies(database: SqliteDatabase, locale: Locale, kind: string | null) {
  if (kind !== null && !["period", "tag", "type"].includes(kind)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Loại taxonomy không hợp lệ.", { fieldErrors: { kind: ["Chỉ nhận period, tag hoặc type."] } });
  }
  const periods = kind === null || kind === "period" ? getPeriods(database, locale, false).data.map(({ id, title, slug }) => ({ id, title, slug })) : [];
  const tagRows = kind === null || kind === "tag" ? database.prepare(`
    SELECT DISTINCT tag.id, CASE WHEN ? = 'vi' THEN tag.name_vi ELSE tag.name_en END AS name, tag.slug
    FROM tags tag JOIN content_tags ct ON ct.tag_id = tag.id JOIN content_nodes n ON n.id = ct.content_id
    JOIN content_translations t ON t.node_id = n.id
    WHERE n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
    ORDER BY tag.slug, tag.id
  `).all(locale, locale) as Array<{ id: string; name: string; slug: string }> : [];
  const usedTypes = kind === null || kind === "type" ? contentTypes.filter((type) => database.prepare(`${publicSelect} AND t.locale = ? AND n.type = ? LIMIT 1`).get(locale, type)) : [];
  return { data: { periods, tags: tagRows, types: usedTypes } };
}

export function getSources(database: SqliteDatabase, locale: Locale, search: URLSearchParams) {
  const { page, pageSize } = parsePage(search);
  const rows = database.prepare(`
    WITH eligible AS (
      SELECT s.id, s.url, cs.content_id
      FROM sources s
      JOIN content_sources cs ON cs.source_id = s.id
      JOIN content_nodes n ON n.id = cs.content_id
      JOIN content_translations t ON t.node_id = n.id
      WHERE n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
    ), representatives AS (
      SELECT url, MIN(id) AS id, COUNT(DISTINCT content_id) AS contentCount
      FROM eligible
      GROUP BY url
    )
    SELECT s.id, s.title, s.author, s.publisher, s.year, s.url,
      s.accessed_at AS accessedAt, s.citation_note AS citationNote,
      s.source_type AS sourceType, s.quality_tier AS qualityTier,
      s.institution, s.identifier, s.edition, s.archived_url AS archivedUrl,
      s.checksum, s.verification_status AS verificationStatus,
      verifier.display_name AS verifiedBy, s.verified_at AS verifiedAt,
      s.verification_note AS verificationNote, r.contentCount
    FROM representatives r
    JOIN sources s ON s.id = r.id
    LEFT JOIN users verifier ON verifier.id = s.verified_by
    ORDER BY s.title COLLATE NOCASE, s.id
  `).all(locale) as Array<Omit<PublicSourceItem,"contents">>;
  const total = rows.length;
  const data=rows.slice((page - 1) * pageSize, page * pageSize).map((source)=>{
    const contents=database.prepare(`
      SELECT DISTINCT n.id, n.type, t.title, t.slug
      FROM sources s
      JOIN content_sources cs ON cs.source_id = s.id
      JOIN content_nodes n ON n.id = cs.content_id
      JOIN content_translations t ON t.node_id = n.id
      WHERE s.url = ? AND n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
      ORDER BY t.title COLLATE NOCASE, n.id
    `).all(source.url,locale) as SourceContentRef[];
    return {...source,contents};
  });
  return { data, meta: pageMeta(page, pageSize, total) };
}

export function getAlternate(database: SqliteDatabase, id: string, locale: Locale) {
  const current = database.prepare(`
    SELECT t.slug, n.type FROM content_nodes n JOIN content_translations t ON t.node_id = n.id
    WHERE n.id = ? AND n.status = 'PUBLISHED' AND t.locale = ? AND t.translation_status = 'PUBLISHED'
  `).get(id, locale) as { slug: string; type: ContentType } | undefined;
  if (!current) throw new PublicApiError(404, "CONTENT_NOT_FOUND", "Nội dung không tồn tại hoặc chưa được xuất bản.");
  return { data: { id, current: { locale, url: `/api/v1/${locale}/contents/${current.type}/${current.slug}` }, alternate: alternateFor(database, id, locale) } };
}
