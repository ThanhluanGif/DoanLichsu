import { openReadOnlyDatabase } from "./connection";
import { assertMigrationLedgerCurrent } from "./migration-engine.mjs";

export function assertDatabaseHealthy(databasePath: string): void {
  const database = openReadOnlyDatabase(databasePath);

  try {
    const result = database.prepare("SELECT 1 AS healthy").get() as { healthy: number };
    assertMigrationLedgerCurrent(database);
    const metadata = database
      .prepare("SELECT value FROM app_metadata WHERE key = 'application'")
      .get() as { value: string } | undefined;

    if (
      result.healthy !== 1 ||
      metadata?.value !== "quan-su-viet"
    ) {
      throw new Error("Database schema is not ready");
    }
  } finally {
    database.close();
  }
}
