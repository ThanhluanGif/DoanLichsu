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
    expect(migrateDatabase(databasePath)).toMatchObject({ applied: [1, 2, 3, 4, 5, 6, 7, 8, 9], currentVersion: 9 });
    const seed = () => {
      const result = spawnSync(resolve("node_modules/.bin/tsx"), ["scripts/seed.ts"], {
        cwd: resolve("."), env: { ...process.env, DATABASE_PATH: databasePath }, encoding: "utf8",
      });
      if (result.status !== 0) throw new Error(result.stderr);
      return JSON.parse(result.stdout);
    };
    expect(seed()).toEqual({ contentNodes: 50, translations: 100, sources: 50, users: 3, curriculumRequirements:55, curriculumMappings:23 });
    expect(seed()).toEqual({ contentNodes: 50, translations: 100, sources: 50, users: 3, curriculumRequirements:55, curriculumMappings:23 });

    const database = new Database(databasePath);
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({ count: 50 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({ count: 100 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM sources WHERE url LIKE 'https://%'").get()).toEqual({ count: 50 });
    expect(database.prepare("SELECT verification_status, COUNT(*) AS count FROM sources GROUP BY verification_status").all()).toEqual([{ verification_status: "NEEDS_REVIEW", count: 50 }]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_claims").get()).toEqual({ count: 0 });
    expect(database.prepare("SELECT locale, COUNT(*) AS count FROM lesson_translations GROUP BY locale ORDER BY locale").all()).toEqual([{ locale: "en", count: 1 }, { locale: "vi", count: 1 }]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM curriculum_requirements").get()).toEqual({count:55});
    expect(database.prepare("SELECT COUNT(*) AS count FROM content_curriculum").get()).toEqual({count:23});
    expect(database.prepare("SELECT grade,COUNT(*) AS count FROM curriculum_requirements GROUP BY grade ORDER BY grade").all()).toEqual([
      {grade:6,count:8},{grade:7,count:6},{grade:8,count:7},{grade:9,count:6},{grade:10,count:10},{grade:11,count:9},{grade:12,count:9},
    ]);
    expect(database.prepare("SELECT DISTINCT track FROM curriculum_requirements ORDER BY track").all()).toEqual([{track:"ELECTIVE"},{track:"MANDATORY"}]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM curriculum_requirements WHERE official_program_ref LIKE '%17/2025/TT-BGDĐT%' AND json_array_length(required_outcomes_vi)>0 AND json_array_length(required_outcomes_en)>0").get()).toEqual({count:55});
    expect(database.prepare("SELECT type, COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type").all()).toEqual([
      { type: "ARTIFACT", count: 10 }, { type: "EVENT", count: 20 }, { type: "PERIOD", count: 6 },
      { type: "PERSON", count: 10 }, { type: "TOPIC", count: 4 },
    ]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM media WHERE kind = 'DOCUMENT'").get()).toEqual({ count: 10 });
    expect(database.prepare("SELECT rights_status, COUNT(*) AS count FROM media GROUP BY rights_status").all()).toEqual([{ rights_status: "LINK_ONLY", count: 10 }]);
    expect(database.prepare("SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role").all()).toEqual([
      { role: "ADMIN", count: 1 }, { role: "EDITOR", count: 1 }, { role: "REVIEWER", count: 1 },
    ]);
    expect(database.prepare("SELECT translation_status FROM content_translations WHERE node_id = ? AND locale = 'en'").get("artifact-mig21-4324")).toEqual({ translation_status: "READY_FOR_REVIEW" });
    database.prepare("DELETE FROM content_curriculum WHERE requirement_id='g6-human-origins'").run();
    database.prepare("DELETE FROM curriculum_requirements WHERE id='g6-human-origins'").run();
    const curriculumOnly=spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),env:{...process.env,NODE_ENV:"production",CURRICULUM_SEED_ONLY:"1",DATABASE_PATH:databasePath,SEED_ADMIN_PASSWORD:"",SEED_EDITOR_PASSWORD:"",SEED_REVIEWER_PASSWORD:""},encoding:"utf8"});
    expect(curriculumOnly.status).toBe(0);
    expect(JSON.parse(curriculumOnly.stdout)).toEqual({mode:"curriculum-only",curriculumRequirements:55,curriculumMappings:23});
    expect(database.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({count:3});
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
  },30_000);

  it("publishes every C-003 endpoint and exact public schemas in OpenAPI 3.1", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(Object.keys(openApiDocument.paths)).toEqual(expect.arrayContaining([
      "/api/v1/{locale}/home", "/api/v1/{locale}/periods", "/api/v1/{locale}/timeline",
      "/api/v1/{locale}/contents", "/api/v1/{locale}/contents/{type}/{slug}",
      "/api/v1/{locale}/search", "/api/v1/{locale}/taxonomies", "/api/v1/contents/{id}/alternate",
      "/api/v1/{locale}/curriculum","/api/v1/{locale}/curriculum/{grade}",
    ]));
    expect(openApiDocument.components.schemas.ContentListItem.required).toEqual([
      "id", "type", "locale", "title", "slug", "summary", "thumbnail", "startDate", "endDate", "datePrecision", "period", "tags",
    ]);
    expect(openApiDocument.components.schemas.ContentDetail.required).toEqual(expect.arrayContaining(["body", "sources", "claims", "related", "alternate","curriculum","lesson","asOf", "reviewedBy", "publishedAt", "updatedAt"]));
    expect(openApiDocument.components.schemas.ApiError.required).toEqual(["code", "message", "requestId"]);
    expect(openApiDocument.components.schemas.ApiError.properties.details.additionalProperties).toBe(false);
    const searchParameters = openApiDocument.paths["/api/v1/{locale}/search"].get.parameters;
    expect(searchParameters.some((parameter) => parameter.name === "sort")).toBe(true);
    expect(openApiDocument.paths["/api/v1/{locale}/search"].get.responses).toHaveProperty("500");
    const facetParameters=openApiDocument.paths["/api/v1/{locale}/taxonomies"].get.parameters;
    expect(facetParameters.map((parameter)=>parameter.name)).toEqual([
      "locale","kind","scope","q","type","period","tag","grade","topic","fromYear","toYear",
    ]);
    const facetResponse=openApiDocument.paths["/api/v1/{locale}/taxonomies"].get.responses["200"] as unknown as {content:{"application/json":{schema:{properties:{data:{$ref:string}}}}}};
    expect(facetResponse.content["application/json"].schema.properties.data.$ref).toBe("#/components/schemas/FacetView");
    expect(openApiDocument.components.schemas.FacetView.required).toEqual(["grades","topics","periods","tags","types"]);
    expect(openApiDocument.components.schemas.FacetOption.required).toEqual(["value","label","publishedCount","verifiedCount"]);
    expect(openApiDocument.components.schemas.FacetOption.properties.publishedCount.minimum).toBe(1);
    expect(openApiDocument.components.schemas.CurriculumRequirementRef.required).toEqual(["id","grade","track","topic","slug","officialProgramRef","publishedCount","verifiedCount","coverageStatus"]);
    expect(openApiDocument.components.schemas.CurriculumGradeView.required).toEqual(["grade","label","summary","requirements"]);
    expect(openApiDocument.paths["/api/v1/{locale}/curriculum/{grade}"].get.responses["200"]).toBeDefined();
    expect(openApiDocument.components.schemas.LessonView.required).toEqual(["learningObjectives","originalSummary","analysis","debates"]);
    expect(openApiDocument.components.schemas.MediaView.required).toContain("provenance");
  });
});

afterAll(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});
