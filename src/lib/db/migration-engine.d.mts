export interface MigrationResult {
  databasePath: string;
  applied: number[];
  currentVersion: number;
}

export function migrateDatabase(
  databasePath: string,
  migrationsDirectory?: string,
): MigrationResult;

export function assertMigrationLedgerCurrent(
  database: Database.Database,
  migrationsDirectory?: string,
): void;
import type Database from "better-sqlite3";
