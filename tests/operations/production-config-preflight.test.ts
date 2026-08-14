import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-production-config-"));
const run = (envText: string) => {
  const envPath = join(temp, `${Math.random().toString(36).slice(2)}.env`);
  const outputPath = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(envPath, `${envText}\n`);
  const result = spawnSync(process.execPath, ["scripts/production-config-preflight.mjs", "--env-file", envPath, "--output", outputPath], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(outputPath, "utf8")) };
};
const valid = [
  "NODE_ENV=production",
  "APP_ORIGIN=https://history.example.vn",
  "DATABASE_PATH=/srv/quan-su-viet/data/quan-su-viet.db",
  "SESSION_SECRET=abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH",
  "ALLOW_DEMO_SEED=0",
  "APP_VERSION=2026.08.14",
].join("\n");

describe("production configuration preflight", () => {
  it("accepts only the structural shape and never exposes the secret", () => {
    const { result, report } = run(valid.replace("history.example.vn", "history.vn"));
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_PRODUCTION_CONFIG_SHAPE", acceptedSecretValues: false, databaseMutation: false, releaseAllowed: false, publicBeta: false, checks: { nodeEnvProduction: true, officialHttpsOrigin: true, absoluteDatabasePath: true, sessionSecretPresentAndNonPlaceholder: true, demoSeedDisabled: true, appVersionPresent: true }, errors: [] });
    expect(JSON.stringify(report)).not.toContain("abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH");
  });

  it("fails closed for local/example origins, placeholder secrets, relative DBs and demo seed", () => {
    const { result, report } = run(valid.replace("https://history.example.vn", "http://localhost:3000").replace("/srv/quan-su-viet/data/quan-su-viet.db", "./data/db.sqlite").replace("abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH", "replace-with-a-short-secret").replace("ALLOW_DEMO_SEED=0", "ALLOW_DEMO_SEED=1"));
    expect(result.status).toBe(1);
    expect(report).toMatchObject({ status: "BLOCKED_EXTERNAL", acceptedSecretValues: false, databaseMutation: false, releaseAllowed: false, publicBeta: false });
    expect(report.errors).toEqual(expect.arrayContaining(["APP_ORIGIN_MUST_USE_HTTPS", "APP_ORIGIN_MUST_BE_OFFICIAL_HOST", "DATABASE_PATH_MUST_BE_ABSOLUTE", "SESSION_SECRET_MIN_LENGTH_32", "SESSION_SECRET_MUST_NOT_BE_PLACEHOLDER", "ALLOW_DEMO_SEED_MUST_BE_DISABLED"]));
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
