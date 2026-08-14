import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("local standalone smoke evidence", () => {
  it("records the local-only public route and AI safety boundary", () => {
    const result = spawnSync(process.execPath, ["scripts/local-standalone-smoke.mjs"], { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync("artifacts/operations/local-standalone-smoke.json", "utf8"));
    expect(report).toMatchObject({ status: "PASS_LOCAL_ONLY", publicBeta: false, aiPublic: "DISABLED", databasePathAbsolute: true, originKind: "local production-like standalone; not official production" });
    expect(report.checks).toHaveLength(9);
    expect(report.checks.every((check: { passed: boolean }) => check.passed)).toBe(true);
    expect(report.checks.find((check: { name: string }) => check.name === "ai-disabled")).toMatchObject({ status: 403, passed: true });
  }, 30_000);
});
