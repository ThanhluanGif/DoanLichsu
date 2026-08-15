import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("transparency dashboard evidence", () => {
  it("reflects the current readiness schema and all external blockers", () => {
    const result = spawnSync(process.execPath, ["scripts/transparency-dashboard.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    const dashboard = JSON.parse(readFileSync("artifacts/transparency/dashboard.json", "utf8"));
    expect(dashboard.dashboardVersion).toBe("transparency-v2");
    expect(dashboard.publicBeta).toBe(false);
    expect(dashboard.blockers).toHaveLength(11);
    expect(dashboard.externalGates).toHaveLength(11);
    expect(dashboard.externalGates[0]).toMatchObject({ id: "official-production", status: "PENDING", owner: null, requiredOwnerRole: "Operations owner" });
    expect(dashboard.externalGates.every((gate: { requiredEvidence: string; nextAction: string }) => gate.requiredEvidence.length > 0 && gate.nextAction.length > 0)).toBe(true);
    expect(dashboard.operations.backupRestore).toBe("PASS_DISPOSABLE_ONLY");
    expect(dashboard.operations.independentSecurity).toBe("PENDING_EXTERNAL");
    expect(dashboard.wikimedia.invalidMetadataCount).toBe(0);
    expect(dashboard.wikimedia.binaryServingEnabled).toBe(false);
    expect(dashboard.rights).toMatchObject({ servedBinary: 0, binaryServingEnabled: false, approvedForBinary: 0, reviewStatus: "PENDING_RIGHTS_REVIEW" });
    expect(dashboard.contentHistory).toMatchObject({ status: "REQUIRES_HUMAN_REVIEW", publishedContent: 105, candidateCount: 105, databaseWrites: 0, fabricatedApproval: false, councilApproval: "NOT_EVALUATED" });
    if (process.env.RELEASE_EVIDENCE_RUN === "1") return;
    expect(dashboard.release.testedCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(dashboard.release.sourceTreeMatches).toBe(true);
    expect(dashboard.release.sourceTreeSha256).toBe(dashboard.release.currentSourceTreeSha256);
    expect(dashboard.disclosure).toContain("not an independent historian council endorsement");
  });
});
