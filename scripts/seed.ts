import { openDatabase } from "../src/lib/db/connection";
import { migrateDatabase } from "../src/lib/db/migrate";
import { demoContent, demoTags, unpublishedEnglishNodeId } from "../src/data/demo-content";
import { normalizeSearchText } from "../src/lib/search/normalize";
import { readEnv } from "../src/lib/env";
import { hashPassword } from "../src/lib/auth/password";

if (process.env.NODE_ENV === "production") {
  if (process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error("Refusing to replace production content without ALLOW_DEMO_SEED=1.");
  }
  for (const name of ["SEED_ADMIN_PASSWORD", "SEED_EDITOR_PASSWORD", "SEED_REVIEWER_PASSWORD"] as const) {
    const password = process.env[name];
    if (!password || password.length < 16 || /Demo-2026|replace-with|change-me/i.test(password)) {
      throw new Error(`${name} must be an explicit non-demo password of at least 16 characters in production.`);
    }
  }
}

const { databasePath } = readEnv();
migrateDatabase(databasePath);
const database = openDatabase(databasePath);
const now = "2026-08-06T00:00:00.000Z";
const allowReplacement = process.env.ALLOW_DEMO_SEED === "1";
const demoUsers = [
  { id: "user-admin", email: "admin@quansuviet.local", displayName: "Quản trị viên", role: "ADMIN", password: process.env.SEED_ADMIN_PASSWORD ?? "Admin-Demo-2026!" },
  { id: "user-editor", email: "editor@quansuviet.local", displayName: "Biên tập viên", role: "EDITOR", password: process.env.SEED_EDITOR_PASSWORD ?? "Editor-Demo-2026!" },
  { id: "user-reviewer", email: "reviewer@quansuviet.local", displayName: "Kiểm duyệt viên", role: "REVIEWER", password: process.env.SEED_REVIEWER_PASSWORD ?? "Reviewer-Demo-2026!" },
] as const;
const passwordHashes = new Map(await Promise.all(demoUsers.map(async (user) => [user.id, await hashPassword(user.password)] as const)));

const englishLocations: Record<string, string> = {
  "Biên giới Tây Nam": "Southwestern border",
  "Biên giới phía Bắc": "Northern border",
  "Bắc Bộ": "Northern Vietnam",
  "Bắc Giang": "Bac Giang",
  "Cao Bằng–Lạng Sơn": "Cao Bang–Lang Son",
  "Hà Giang": "Ha Giang",
  "Hà Nội và toàn quốc": "Hanoi and nationwide",
  "Hà Nội, Hải Phòng": "Hanoi and Hai Phong",
  "Nhiều đô thị miền Nam": "Multiple cities in southern Vietnam",
  "Như Nguyệt": "Nhu Nguyet River",
  "Sài Gòn–Gia Định": "Saigon–Gia Dinh",
  "Sông Bạch Đằng": "Bach Dang River",
  "Thanh Hóa và Bắc Bộ": "Thanh Hoa and northern Vietnam",
  "Thăng Long": "Thang Long",
  "Trường Sơn": "Truong Son range",
  "Điện Biên": "Dien Bien",
  "Đà Nẵng": "Da Nang",
};
const englishResults: Record<string, string> = {
  "Chấm dứt thời kỳ Bắc thuộc kéo dài": "Ended the prolonged period of Chinese rule",
  "Tập đoàn cứ điểm Pháp bị đánh bại": "The French fortified position was defeated",
};
const englishRoles: Record<string, string> = {
  "Chỉ huy quân sự, quân vương": "Military commander and ruler",
  "Chủ tịch nước": "President",
  "Hoàng đế, chỉ huy quân sự": "Emperor and military commander",
  "Lãnh tụ Cần Vương": "Leader of the Can Vuong movement",
  "Lãnh tụ khởi nghĩa, hoàng đế": "Uprising leader and emperor",
  "Lãnh đạo khởi nghĩa": "Uprising leader",
  "Phó tư lệnh": "Deputy commander",
  "Quốc công Tiết chế": "Supreme commander",
  "Thủ lĩnh nghĩa quân": "Insurgent leader",
  "Đại tướng, Tổng tư lệnh": "General and commander-in-chief",
};
const englishMetadataValues: Record<string, string> = {
  "Bảo tàng Chiến thắng Điện Biên Phủ": "Dien Bien Phu Victory Museum",
  "Bảo tàng Lịch sử Quân sự Việt Nam": "Vietnam Military History Museum",
  "Bảo tàng lịch sử": "History museum",
  "Bảo tàng Đường Hồ Chí Minh": "Ho Chi Minh Trail Museum",
  "Di tích thành Điện Hải": "Dien Hai Citadel historic site",
  "Di tích": "Historic site",
  "Gỗ": "Wood",
  "Hạ tầng hậu cần": "Logistics infrastructure",
  "Kim loại": "Metal",
  "Kho lưu trữ bảo tàng": "Museum archive",
  "Khu di tích Bạch Đằng": "Bach Dang historic site",
  "Khu di tích lịch sử địa đạo Củ Chi": "Cu Chi Tunnels historic site",
  "Máy bay": "Aircraft",
  "Mô hình thuyền chiến": "War-boat model",
  "Phương tiện hậu cần": "Logistics vehicle",
  "Quân kỳ": "Military flag",
  "Tài liệu lưu trữ": "Archival document",
  "Xe tăng": "Tank",
};

function englishValue(value: string | undefined, dictionary: Record<string, string>) {
  return value ? dictionary[value] ?? value : null;
}

function englishMetadata(metadata: Record<string, string> | undefined) {
  if (!metadata) return null;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, englishMetadataValues[value] ?? value]),
  );
}

function sourceGovernance(url: string, publisher: string) {
  if (url.includes("btlsqsvn.mod.gov.vn") || url.includes("vnmh.com.vn")) {
    return { sourceType: "MUSEUM_CATALOG", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("whc.unesco.org")) {
    return { sourceType: "ARCHIVE_CATALOG", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("iwm.org.uk")) {
    return { sourceType: "REFERENCE_WORK", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("britannica.com")) {
    return { sourceType: "REFERENCE_WORK", qualityTier: "TIER_4_CONTEXTUAL", institution: publisher };
  }
  return { sourceType: "DISCOVERY_ONLY", qualityTier: "TIER_5_DISCOVERY", institution: publisher };
}

function assertOnlyDemoData(): void {
  if (allowReplacement) return;
  const expected: Record<string, Set<string>> = {
    content_nodes: new Set(demoContent.map(({ id }) => id)),
    content_translations: new Set(demoContent.flatMap(({ id }) => [`${id}-vi`, `${id}-en`])),
    sources: new Set(demoContent.map(({ id }) => `source-${id}`)),
    media: new Set(demoContent.filter(({ type }) => type === "ARTIFACT").map(({ id }) => `media-${id}`)),
    tags: new Set(demoTags.map(({ id }) => id)),
    users: new Set(demoUsers.map(({ id }) => id)),
  };
  for (const [table, expectedIds] of Object.entries(expected)) {
    const rows = database.prepare(`SELECT id FROM ${table}`).all() as Array<{ id: string }>;
    const unknown = rows.find(({ id }) => !expectedIds.has(id));
    if (unknown) {
      throw new Error(`Refusing to replace non-demo row ${table}.${unknown.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
  for (const table of ["content_nodes", "content_translations", "sources", "media", "users"]) {
    const changed = database.prepare(
      `SELECT id FROM ${table} WHERE updated_at <> ? LIMIT 1`,
    ).get(now) as { id: string } | undefined;
    if (changed) {
      throw new Error(`Refusing to replace edited demo row ${table}.${changed.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
  for (const table of ["audit_logs", "login_rate_limits"]) {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
    if (row.count > 0) throw new Error(`Refusing to erase ${table}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
  }
}

try {
  assertOnlyDemoData();
  const seed = database.transaction(() => {
    database.exec(`
      DELETE FROM login_rate_limits;
      DELETE FROM audit_logs;
      DELETE FROM claim_evidence;
      DELETE FROM content_claims;
      DELETE FROM content_relations;
      DELETE FROM content_tags;
      DELETE FROM content_media;
      DELETE FROM content_sources;
      DELETE FROM media;
      DELETE FROM sources;
      DELETE FROM content_translations;
      DELETE FROM content_nodes;
      DELETE FROM tags;
      DELETE FROM users;
    `);

    const insertUser = database.prepare(`
      INSERT INTO users (id, email, display_name, role, password_hash, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);
    for (const user of demoUsers) {
      insertUser.run(user.id, user.email, user.displayName, user.role, passwordHashes.get(user.id), now, now);
    }

    const insertTag = database.prepare(
      "INSERT INTO tags (id, slug, name_vi, name_en) VALUES (?, ?, ?, ?)",
    );
    for (const tag of demoTags) {
      insertTag.run(tag.id, tag.slug, tag.nameVi, tag.nameEn);
    }

    const insertNode = database.prepare(`
      INSERT INTO content_nodes (
        id, type, status, featured, start_date, end_date, date_precision, period_id,
        location, location_en, result, result_en, role, role_en, artifact_meta, artifact_meta_en,
        reviewed_by, published_at, created_at, updated_at
      ) VALUES (?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTranslation = database.prepare(`
      INSERT INTO content_translations (
        id, node_id, locale, title, slug, summary, body, seo_title, seo_description,
        translation_status, search_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSource = database.prepare(`
      INSERT INTO sources (
        id, title, author, publisher, year, url, accessed_at, citation_note,
        source_type, quality_tier, institution, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const attachSource = database.prepare(
      "INSERT INTO content_sources (content_id, source_id, sort_order) VALUES (?, ?, 0)",
    );
    const attachTag = database.prepare(
      "INSERT INTO content_tags (content_id, tag_id) VALUES (?, ?)",
    );
    const insertMedia = database.prepare(`
      INSERT INTO media (
        id, url, kind, credit, license, alt_vi, alt_en, caption_vi, caption_en,
        width, height, created_at, updated_at
      ) VALUES (?, ?, 'DOCUMENT', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
    `);
    const attachMedia = database.prepare(
      "INSERT INTO content_media (content_id, media_id, sort_order, is_thumbnail) VALUES (?, ?, 0, 0)",
    );

    for (const item of demoContent) {
      insertNode.run(
        item.id,
        item.type,
        item.featured ? 1 : 0,
        item.startDate ?? null,
        item.endDate ?? null,
        item.datePrecision ?? null,
        item.periodId ?? null,
        item.location ?? null,
        englishValue(item.location, englishLocations),
        item.result ?? null,
        englishValue(item.result, englishResults),
        item.role ?? null,
        englishValue(item.role, englishRoles),
        item.artifactMeta ? JSON.stringify(item.artifactMeta) : null,
        item.artifactMeta ? JSON.stringify(englishMetadata(item.artifactMeta)) : null,
        "Ban biên tập Quân Sử Việt",
        now,
        now,
        now,
      );

      for (const locale of ["vi", "en"] as const) {
        const translation = item[locale];
        const translationStatus =
          locale === "en" && item.id === unpublishedEnglishNodeId
            ? "READY_FOR_REVIEW"
            : "PUBLISHED";
        insertTranslation.run(
          `${item.id}-${locale}`,
          item.id,
          locale,
          translation.title,
          translation.slug,
          translation.summary,
          translation.body,
          translation.title,
          translation.summary,
          translationStatus,
          normalizeSearchText(
            `${translation.title} ${translation.summary} ${translation.body}`,
          ),
          now,
          now,
        );
      }

      const sourceId = `source-${item.id}`;
      const governance = sourceGovernance(item.sourceUrl, item.sourcePublisher);
      insertSource.run(
        sourceId,
        item.sourceTitle,
        null,
        item.sourcePublisher,
        null,
        item.sourceUrl,
        now,
        null,
        governance.sourceType,
        governance.qualityTier,
        governance.institution,
        now,
        now,
      );
      attachSource.run(item.id, sourceId);
      for (const tagId of item.tags) attachTag.run(item.id, tagId);
      if (item.type === "ARTIFACT") {
        const mediaId = `media-${item.id}`;
        insertMedia.run(
          mediaId,
          item.sourceUrl,
          item.sourcePublisher,
          "External reference; rights remain with the source publisher.",
          `Tài liệu tham khảo về ${item.vi.title}`,
          `Reference document for ${item.en.title}`,
          `Mở nguồn bên ngoài cho ${item.vi.title}.`,
          `Open the external source for ${item.en.title}.`,
          now,
          now,
        );
        attachMedia.run(item.id, mediaId);
      }
    }

    const relations: Array<[string, string]> = [
      ["event-trung-sisters", "person-trung-sisters"],
      ["event-bach-dang-938", "person-ngo-quyen"],
      ["event-bach-dang-1288", "person-tran-hung-dao"],
      ["event-lam-son", "person-le-loi"],
      ["event-ngoc-hoi", "person-quang-trung"],
      ["event-dien-bien-phu", "person-vo-nguyen-giap"],
      ["event-dien-bien-phu", "artifact-pack-bicycle"],
      ["event-ho-chi-minh-campaign", "artifact-tank-843"],
      ["person-vo-nguyen-giap", "event-dien-bien-phu"],
      ["artifact-bach-dang-stakes", "event-bach-dang-1288"],
    ];
    const insertRelation = database.prepare(
      "INSERT INTO content_relations (content_id, related_id, sort_order) VALUES (?, ?, ?)",
    );
    relations.forEach(([from, to], index) => insertRelation.run(from, to, index));

    const counts = database
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM content_nodes) AS contentNodes,
          (SELECT COUNT(*) FROM content_translations) AS translations,
          (SELECT COUNT(*) FROM sources) AS sources,
          (SELECT COUNT(*) FROM users) AS users
      `)
      .get() as { contentNodes: number; translations: number; sources: number; users: number };
    const distribution = Object.fromEntries(
      (database
        .prepare("SELECT type, COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type")
        .all() as Array<{ type: string; count: number }>).map(({ type, count }) => [type, count]),
    );

    if (counts.contentNodes !== 50 || counts.translations !== 100 || counts.sources < 50 || counts.users !== 3) {
      throw new Error(`Seed invariant failed: ${JSON.stringify(counts)}`);
    }
    const expectedDistribution = { ARTIFACT: 10, EVENT: 20, PERIOD: 6, PERSON: 10, TOPIC: 4 };
    if (JSON.stringify(distribution) !== JSON.stringify(expectedDistribution)) {
      throw new Error(`Seed distribution invariant failed: ${JSON.stringify(distribution)}`);
    }
    return counts;
  });

  console.log(JSON.stringify(seed.immediate()));
} finally {
  database.close();
}
