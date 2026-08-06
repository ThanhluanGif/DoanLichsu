import Database from "better-sqlite3";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getHealth } from "@/app/healthz/route";
import { GET as getOpenApi } from "@/app/openapi.json/route";
import { migrateDatabase } from "@/lib/db/migrate";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "quan-su-viet-routes-"));
const databasePath = join(temporaryDirectory, "test.db");

beforeAll(() => {
  process.env.DATABASE_PATH = databasePath;
  process.env.APP_VERSION = "test-version";
  migrateDatabase(databasePath);
});

afterAll(() => {
  delete process.env.DATABASE_PATH;
  delete process.env.APP_VERSION;
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("foundation routes", () => {
  it("returns the contracted health response", async () => {
    const response = getHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      version: "test-version",
      database: "ok",
      timestamp: expect.any(String),
    });
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("serves OpenAPI 3.1 with the health contract", async () => {
    const response = getOpenApi();
    const document = await response.json();

    expect(document.openapi).toMatch(/^3\.1\./);
    expect(document.paths["/healthz"].get.responses["200"]).toBeDefined();
    expect(document.components.schemas.HealthResponse.required).toEqual([
      "status",
      "version",
      "database",
      "timestamp",
    ]);
  });

  it("returns 503 without creating a database when the configured file is missing", () => {
    const missingPath = join(temporaryDirectory, "missing.db");
    process.env.DATABASE_PATH = missingPath;

    const response = getHealth();

    expect(response.status).toBe(503);
    expect(existsSync(missingPath)).toBe(false);
    process.env.DATABASE_PATH = databasePath;
  });

  it("returns 503 when the migration table exists but the foundation schema does not", () => {
    const incompletePath = join(temporaryDirectory, "incomplete.db");
    const database = new Database(incompletePath);
    database.exec(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL
      ) STRICT;
    `);
    database.close();
    process.env.DATABASE_PATH = incompletePath;

    const response = getHealth();

    expect(response.status).toBe(503);
    process.env.DATABASE_PATH = databasePath;
  });

  it("returns 503 when an applied migration checksum has drifted", () => {
    const driftedPath = join(temporaryDirectory, "drifted.db");
    migrateDatabase(driftedPath);
    const database = new Database(driftedPath);
    database.prepare("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = 1").run();
    database.close();
    process.env.DATABASE_PATH = driftedPath;

    const response = getHealth();

    expect(response.status).toBe(503);
    process.env.DATABASE_PATH = databasePath;
  });

  it("returns 503 when the database is newer than the running release", () => {
    const futurePath = join(temporaryDirectory, "future.db");
    migrateDatabase(futurePath);
    const database = new Database(futurePath);
    database
      .prepare(
        "INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (99, '0099_future.sql', 'future', ?)",
      )
      .run(new Date().toISOString());
    database.close();
    process.env.DATABASE_PATH = futurePath;

    const response = getHealth();

    expect(response.status).toBe(503);
    process.env.DATABASE_PATH = databasePath;
  });
});
