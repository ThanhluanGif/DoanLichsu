import Database from "better-sqlite3";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { openApiDocument } from "@/lib/openapi/document";
import { migrateDatabase } from "@/lib/db/migrate";

const directories: string[] = [];

describe("public seed and runtime contract", () => {
  it("seeds idempotently to the exact bilingual distribution", () => {
    const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-seed-contract-"));
    directories.push(directory);
    const databasePath = join(directory, "seed.db");
    expect(migrateDatabase(databasePath)).toMatchObject({ applied: [1, 2, 3, 4], currentVersion: 4 });
    const seed = () => {
      const result = spawnSync(resolve("node_modules/.bin/tsx"), ["scripts/seed.ts"], {
        cwd: resolve("."), env: { ...process.env, DATABASE_PATH: databasePath }, encoding: "utf8",
      });
      if (result.status !== 0) throw new Error(result.stderr);
      return JSON.parse(result.stdout);
    };
    expect(seed()).toEqual({ contentNodes: 50, translations: 100, sources: 50, users: 3 });
    expect(seed()).toEqual({ contentNodes: 50, translations: 100, sources: 50, users: 3 });

    const database = new Database(databasePath);
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({ count: 50 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({ count: 100 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM sources WHERE url LIKE 'https://%'").get()).toEqual({ count: 50 });
    expect(database.prepare("SELECT verification_status, COUNT(*) AS count FROM sources GROUP BY verification_status").all()).toEqual([{ verification_status: "NEEDS_REVIEW", count: 50 }]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_claims").get()).toEqual({ count: 0 });
    expect(database.prepare("SELECT type, COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type").all()).toEqual([
      { type: "ARTIFACT", count: 10 }, { type: "EVENT", count: 20 }, { type: "PERIOD", count: 6 },
      { type: "PERSON", count: 10 }, { type: "TOPIC", count: 4 },
    ]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM media WHERE kind = 'DOCUMENT'").get()).toEqual({ count: 10 });
    expect(database.prepare("SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role").all()).toEqual([
      { role: "ADMIN", count: 1 }, { role: "EDITOR", count: 1 }, { role: "REVIEWER", count: 1 },
    ]);
    expect(database.prepare("SELECT translation_status FROM content_translations WHERE node_id = ? AND locale = 'en'").get("artifact-mig21-4324")).toEqual({ translation_status: "READY_FOR_REVIEW" });
    expect(() => database.prepare(`
      INSERT INTO content_nodes (
        id, type, status, featured, reviewed_by, published_at, created_at, updated_at
      ) VALUES ('invalid-period', 'PERIOD', 'PUBLISHED', 0, 'reviewer', ?, ?, ?)
    `).run(new Date().toISOString(), new Date().toISOString(), new Date().toISOString())).toThrow();
    expect(() => database.prepare(`
      INSERT INTO content_nodes (
        id, type, status, featured, start_date, end_date, date_precision,
        reviewed_by, published_at, created_at, updated_at
      ) VALUES ('malformed-period', 'PERIOD', 'PUBLISHED', 0, '2024-02-30', '2024-01-01', 'DAY', 'reviewer', ?, ?, ?)
    `).run(new Date().toISOString(), new Date().toISOString(), new Date().toISOString())).toThrow();
    database.prepare(`
      INSERT INTO sources (id, title, url, accessed_at, created_at, updated_at)
      VALUES ('operator-source', 'Operator source', 'https://example.org/operator', ?, ?, ?)
    `).run(new Date().toISOString(), new Date().toISOString(), new Date().toISOString());
    expect(() => seed()).toThrow();
    expect(database.prepare("SELECT title FROM sources WHERE id = 'operator-source'").get()).toEqual({ title: "Operator source" });
    database.close();
  });

  it("publishes every C-003 endpoint and exact public schemas in OpenAPI 3.1", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(Object.keys(openApiDocument.paths)).toEqual(expect.arrayContaining([
      "/api/v1/{locale}/home", "/api/v1/{locale}/periods", "/api/v1/{locale}/timeline",
      "/api/v1/{locale}/contents", "/api/v1/{locale}/contents/{type}/{slug}",
      "/api/v1/{locale}/search", "/api/v1/{locale}/taxonomies", "/api/v1/contents/{id}/alternate",
    ]));
    expect(openApiDocument.components.schemas.ContentListItem.required).toEqual([
      "id", "type", "locale", "title", "slug", "summary", "thumbnail", "startDate", "endDate", "datePrecision", "period", "tags",
    ]);
    expect(openApiDocument.components.schemas.ContentDetail.required).toEqual(expect.arrayContaining(["body", "sources", "claims", "related", "alternate", "reviewedBy", "publishedAt", "updatedAt"]));
    expect(openApiDocument.components.schemas.ApiError.required).toEqual(["code", "message", "requestId"]);
    expect(openApiDocument.components.schemas.ApiError.properties.details.additionalProperties).toBe(false);
    const searchParameters = openApiDocument.paths["/api/v1/{locale}/search"].get.parameters;
    expect(searchParameters.some((parameter) => parameter.name === "sort")).toBe(true);
    expect(openApiDocument.paths["/api/v1/{locale}/search"].get.responses).toHaveProperty("500");
  });
});

afterAll(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});
