import { isAbsolute, resolve } from "node:path";
import { migrateDatabase } from "../src/lib/db/migration-engine.mjs";

const rawDatabasePath = process.env.DATABASE_PATH?.trim() || "./data/quan-su-viet.db";
if (rawDatabasePath.includes("\0")) {
  throw new Error("DATABASE_PATH must not contain a null byte.");
}
if (process.env.NODE_ENV === "production" && !isAbsolute(rawDatabasePath)) {
  throw new Error("DATABASE_PATH must be absolute in production.");
}

const result = migrateDatabase(resolve(rawDatabasePath));
console.log(JSON.stringify(result));
