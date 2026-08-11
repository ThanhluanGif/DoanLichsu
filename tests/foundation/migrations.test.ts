import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";

const temporaryDirectories: string[] = [];
const execFileAsync = promisify(execFile);

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-migration-"));
  temporaryDirectories.push(directory);
  return join(directory, "test.db");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("SQLite migrations", () => {
  it("applies migrations once and keeps their version after reopening", () => {
    const databasePath = createDatabasePath();

    expect(migrateDatabase(databasePath)).toMatchObject({ applied: [1, 2, 3, 4, 5, 6], currentVersion: 6 });
    expect(migrateDatabase(databasePath)).toMatchObject({ applied: [], currentVersion: 6 });

    const database = new Database(databasePath, { readonly: true });
    const rows = database.prepare("SELECT version, name FROM schema_migrations").all();
    database.close();

    expect(rows).toEqual([
      { version: 1, name: "0001_foundation.sql" },
      { version: 2, name: "0002_public_content.sql" },
      { version: 3, name: "0003_editorial_security.sql" },
      { version: 4, name: "0004_source_governance.sql" },
      { version: 5, name: "0005_curriculum.sql" },
      { version: 6, name: "0006_lessons.sql" },
    ]);
  });

  it("serializes concurrent migration processes", async () => {
    const databasePath = createDatabasePath();
    const runner = resolve("scripts/migrate.mjs");
    const environment = { ...process.env, DATABASE_PATH: databasePath };

    const results = await Promise.all([
      execFileAsync(process.execPath, [runner], { env: environment }),
      execFileAsync(process.execPath, [runner], { env: environment }),
    ]);
    const appliedSets = results.map(({ stdout }) => JSON.parse(stdout).applied).sort();

    expect(appliedSets).toEqual([[], [1, 2, 3, 4, 5, 6]]);
  });

  it("rejects an applied migration that was renamed", () => {
    const databasePath = createDatabasePath();
    migrateDatabase(databasePath);
    const migrationsDirectory = join(temporaryDirectories.at(-1)!, "renamed-migrations");
    mkdirSync(migrationsDirectory);
    writeFileSync(
      join(migrationsDirectory, "0001_renamed.sql"),
      readFileSync(resolve("migrations/0001_foundation.sql"), "utf8"),
    );

    expect(() => migrateDatabase(databasePath, migrationsDirectory)).toThrow(
      "changed after it was applied",
    );
  });

  it("rejects database migrations absent from the release", () => {
    const databasePath = createDatabasePath();
    migrateDatabase(databasePath);
    const migrationsDirectory = join(temporaryDirectories.at(-1)!, "empty-migrations");
    mkdirSync(migrationsDirectory);

    expect(() => migrateDatabase(databasePath, migrationsDirectory)).toThrow(
      "absent from this release",
    );
  });

  it("rejects checksum drift in the applied ledger", () => {
    const databasePath = createDatabasePath();
    migrateDatabase(databasePath);
    const database = new Database(databasePath);
    database.prepare("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = 1").run();
    database.close();

    expect(() => migrateDatabase(databasePath)).toThrow("changed after it was applied");
  });

  it("refuses a relative production database path before creating it", async () => {
    const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-production-path-"));
    temporaryDirectories.push(directory);
    const runner = resolve("scripts/migrate.mjs");
    const relativePath = "wrong-location.db";

    await expect(
      execFileAsync(process.execPath, [runner], {
        cwd: directory,
        env: { ...process.env, NODE_ENV: "production", DATABASE_PATH: relativePath },
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("must be absolute in production"),
    });
    expect(existsSync(join(directory, relativePath))).toBe(false);
  });
});
