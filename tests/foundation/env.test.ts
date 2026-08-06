import { describe, expect, it } from "vitest";

import { readEnv } from "@/lib/env";

describe("runtime environment", () => {
  it("uses safe local defaults", () => {
    expect(readEnv({}).appVersion).toBeTruthy();
    expect(readEnv({}).databasePath).toMatch(/data\/quan-su-viet\.db$/);
  });

  it("rejects unsafe database paths", () => {
    expect(() => readEnv({ DATABASE_PATH: "bad\0path" })).toThrow("null byte");
  });

  it("requires an absolute database path in production", () => {
    expect(() =>
      readEnv({ NODE_ENV: "production", DATABASE_PATH: "./data/production.db" }),
    ).toThrow("must be absolute in production");
  });
});
