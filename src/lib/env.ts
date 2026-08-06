import path from "node:path";

export type RuntimeEnv = {
  databasePath: string;
  appVersion: string;
};

type Environment = Record<string, string | undefined>;

/** Parse the tiny runtime configuration at the process boundary. */
export function readEnv(source: Environment = process.env): RuntimeEnv {
  const rawDatabasePath = source.DATABASE_PATH?.trim() || "./data/quan-su-viet.db";
  const appVersion = source.APP_VERSION?.trim() || source.npm_package_version || "0.1.0";

  if (rawDatabasePath.includes("\0")) {
    throw new Error("DATABASE_PATH must not contain a null byte.");
  }
  if (!appVersion) {
    throw new Error("APP_VERSION must not be empty.");
  }
  if (source.NODE_ENV === "production" && !path.isAbsolute(rawDatabasePath)) {
    throw new Error("DATABASE_PATH must be absolute in production.");
  }

  return {
    databasePath: path.resolve(/* turbopackIgnore: true */ rawDatabasePath),
    appVersion,
  };
}

/** Cached configuration is unnecessary for this small runtime, but this name keeps
 * route handlers explicit about retrieving the process configuration. */
export const getEnv = readEnv;
