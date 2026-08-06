import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";

const migrationPattern = /^(\d+)_([a-z0-9_-]+)\.sql$/;
const migrationColumns = ["version", "name", "checksum", "applied_at"];

function loadMigrations(migrationsDirectory) {
  const seenVersions = new Set();

  return readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .map((fileName) => {
      const match = migrationPattern.exec(fileName);
      if (!match) {
        throw new Error(`Invalid migration filename: ${fileName}`);
      }

      const version = Number.parseInt(match[1], 10);
      if (seenVersions.has(version)) {
        throw new Error(`Duplicate migration version: ${version}`);
      }
      seenVersions.add(version);

      const sql = readFileSync(join(migrationsDirectory, fileName), "utf8");
      return {
        version,
        name: basename(fileName),
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    })
    .sort((left, right) => left.version - right.version);
}

function openDatabase(databasePath) {
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });

  const database = new Database(resolvedPath);
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  return database;
}

function ensureMigrationTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const columns = database
    .prepare("PRAGMA table_info(schema_migrations)")
    .all()
    .map((column) => column.name);
  if (columns.join(",") !== migrationColumns.join(",")) {
    throw new Error(`Incompatible schema_migrations columns: ${columns.join(", ")}`);
  }
}

function validateAppliedRows(appliedRows, migrations, requireAll) {
  const migrationByVersion = new Map(migrations.map((migration) => [migration.version, migration]));

  for (const row of appliedRows) {
    const migration = migrationByVersion.get(row.version);
    if (!migration) {
      throw new Error(`Database migration ${row.version} is absent from this release`);
    }
    if (row.name !== migration.name || row.checksum !== migration.checksum) {
      throw new Error(`Migration ${migration.name} changed after it was applied`);
    }
  }

  if (requireAll && appliedRows.length !== migrations.length) {
    throw new Error("Database has pending migrations");
  }
}

export function assertMigrationLedgerCurrent(
  database,
  migrationsDirectory = join(process.cwd(), "migrations"),
) {
  const migrations = loadMigrations(migrationsDirectory);
  const appliedRows = database
    .prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version")
    .all();
  validateAppliedRows(appliedRows, migrations, true);
}

export function migrateDatabase(
  databasePath,
  migrationsDirectory = join(process.cwd(), "migrations"),
) {
  const database = openDatabase(databasePath);

  try {
    ensureMigrationTable(database);
    const migrations = loadMigrations(migrationsDirectory);

    const applyPending = database.transaction(() => {
      const appliedRows = database
        .prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version")
        .all();
      const appliedByVersion = new Map();

      validateAppliedRows(appliedRows, migrations, false);
      for (const row of appliedRows) appliedByVersion.set(row.version, row);

      const applied = [];
      for (const migration of migrations) {
        if (appliedByVersion.has(migration.version)) {
          continue;
        }

        database.exec(migration.sql);
        database
          .prepare(
            "INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)",
          )
          .run(migration.version, migration.name, migration.checksum, new Date().toISOString());
        applied.push(migration.version);
      }

      const currentVersion = database
        .prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations")
        .get();
      return { applied, currentVersion: currentVersion.version };
    });

    const result = applyPending.immediate();
    return { databasePath: resolve(databasePath), ...result };
  } finally {
    database.close();
  }
}
