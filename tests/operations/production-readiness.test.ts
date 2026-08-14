import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("production readiness report", () => {
  it("reports local evidence without promoting Public Beta", () => {
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--database", "data/quan-su-viet.db"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync("artifacts/production-readiness/report.json", "utf8"));
    expect(report.status).toBe("PASS_LOCAL_ONLY");
    expect(report.publicBetaAllowed).toBe(false);
    expect(report.officialProductionEvidence).toBe(false);
    expect(report.external.status).toBe("BLOCKED_EXTERNAL");
    expect(report.external.pending).toContain("official-production");
    if (process.env.RELEASE_EVIDENCE_RUN === "1") return;
    expect(report.checks.quality.sourceTreeMatches).toBe(true);
    expect(report.checks.quality.sourceTreeSha256).toBe(report.checks.quality.currentSourceTreeSha256);
  });
});
