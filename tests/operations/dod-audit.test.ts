import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("DoD audit evidence compatibility", () => {
  it("keeps disposable recovery evidence visible without claiming production RPO/RTO", () => {
    const result = spawnSync(process.execPath, ["scripts/dod-audit.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    const report = JSON.parse(readFileSync("artifacts/release/dod-audit.json", "utf8"));
    expect(report.status).toBe("NOT_READY");
    expect(report.publicBeta).toBe(false);
    expect(report.checks.find((check: { id: string }) => check.id === "backup-recovery-mechanism")).toMatchObject({ status: "PASS_DISPOSABLE_ONLY" });
    expect(report.unmetExternal).toContain("uptime-90-day");
    expect(report.checks.find((check: { id: string }) => check.id === "published-content-history")).toMatchObject({ status: "BLOCKED_INTERNAL", missingContent: 105 });
    if (process.env.RELEASE_EVIDENCE_RUN === "1") return;
    const release = report.checks.find((check: { id: string }) => check.id === "current-head-release-evidence");
    expect(release).toMatchObject({ status: "PASS_LOCAL_ONLY", sourceTreeMatches: true });
  });
});
