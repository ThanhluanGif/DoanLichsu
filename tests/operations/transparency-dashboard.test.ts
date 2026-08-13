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
    expect(dashboard.operations.backupRestore).toBe("PASS_DISPOSABLE_ONLY");
    expect(dashboard.operations.independentSecurity).toBe("PENDING_EXTERNAL");
    expect(dashboard.disclosure).toContain("not an independent historian council endorsement");
  });
});
