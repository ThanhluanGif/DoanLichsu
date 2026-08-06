import { openDatabase } from "../src/lib/db/connection";
import { migrateDatabase } from "../src/lib/db/migrate";
import { demoContent, demoTags, unpublishedEnglishNodeId } from "../src/data/demo-content";
import { normalizeSearchText } from "../src/lib/search/normalize";
import { readEnv } from "../src/lib/env";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
  throw new Error("Refusing to replace production content without ALLOW_DEMO_SEED=1.");
}

const { databasePath } = readEnv();
migrateDatabase(databasePath);
const database = openDatabase(databasePath);
const now = "2026-08-06T00:00:00.000Z";
const allowReplacement = process.env.ALLOW_DEMO_SEED === "1";

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

function assertOnlyDemoData(): void {
  if (allowReplacement) return;
  const expected: Record<string, Set<string>> = {
    content_nodes: new Set(demoContent.map(({ id }) => id)),
    content_translations: new Set(demoContent.flatMap(({ id }) => [`${id}-vi`, `${id}-en`])),
    sources: new Set(demoContent.map(({ id }) => `source-${id}`)),
    media: new Set(demoContent.filter(({ type }) => type === "ARTIFACT").map(({ id }) => `media-${id}`)),
    tags: new Set(demoTags.map(({ id }) => id)),
  };
  for (const [table, expectedIds] of Object.entries(expected)) {
    const rows = database.prepare(`SELECT id FROM ${table}`).all() as Array<{ id: string }>;
    const unknown = rows.find(({ id }) => !expectedIds.has(id));
    if (unknown) {
      throw new Error(`Refusing to replace non-demo row ${table}.${unknown.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
  for (const table of ["content_nodes", "content_translations", "sources", "media"]) {
    const changed = database.prepare(
      `SELECT id FROM ${table} WHERE updated_at <> ? LIMIT 1`,
    ).get(now) as { id: string } | undefined;
    if (changed) {
      throw new Error(`Refusing to replace edited demo row ${table}.${changed.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
}

try {
  assertOnlyDemoData();
  const seed = database.transaction(() => {
    database.exec(`
      DELETE FROM content_relations;
      DELETE FROM content_tags;
      DELETE FROM content_media;
      DELETE FROM content_sources;
      DELETE FROM media;
      DELETE FROM sources;
      DELETE FROM content_translations;
      DELETE FROM content_nodes;
      DELETE FROM tags;
    `);

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
        id, title, author, publisher, year, url, accessed_at, citation_note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      insertSource.run(
        sourceId,
        item.sourceTitle,
        null,
        item.sourcePublisher,
        null,
        item.sourceUrl,
        now,
        null,
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
          (SELECT COUNT(*) FROM sources) AS sources
      `)
      .get() as { contentNodes: number; translations: number; sources: number };
    const distribution = Object.fromEntries(
      (database
        .prepare("SELECT type, COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type")
        .all() as Array<{ type: string; count: number }>).map(({ type, count }) => [type, count]),
    );

    if (counts.contentNodes !== 50 || counts.translations !== 100 || counts.sources < 50) {
      throw new Error(`Seed invariant failed: ${JSON.stringify(counts)}`);
    }
    const expectedDistribution = { ARTIFACT: 10, EVENT: 20, PERIOD: 6, PERSON: 10, TOPIC: 4 };
    if (JSON.stringify(distribution) !== JSON.stringify(expectedDistribution)) {
      throw new Error(`Seed distribution invariant failed: ${JSON.stringify(distribution)}`);
    }
    // C-004 owns the auth/user schema and will replace this shape-compatible stub with 3.
    return { ...counts, users: 0 };
  });

  console.log(JSON.stringify(seed.immediate()));
} finally {
  database.close();
}
