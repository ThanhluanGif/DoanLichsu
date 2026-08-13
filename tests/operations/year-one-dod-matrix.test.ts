import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("year-one DoD matrix", () => {
  it("maps Section 17 requirements without laundering external gates", () => {
    const result = spawnSync(process.execPath, ["scripts/year-one-dod-matrix.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync("artifacts/release/year-one-dod-matrix.json", "utf8"));
    expect(report).toMatchObject({ sourcePlanSection: "Section 17 — Definition of Done after 12 months", overall: "NOT_READY", publicBeta: false, noFabricatedEvidence: true, blockedExternal: expect.arrayContaining(["official-production", "council-signoff", "real-pilot", "independent-security"]) });
    expect(report.rows.length).toBeGreaterThanOrEqual(13);
    expect(report.rows.find((row: { gate: string }) => row.gate === "published-content-history")).toMatchObject({ status: "BLOCKED_INTERNAL" });
    expect(report.rows.filter((row: { status: string }) => row.status === "BLOCKED_EXTERNAL")).toHaveLength(12);
    const externalIds = ["official-production", "uptime-90-day", "council-signoff", "ai-golden-human-approval", "model-comparison", "dpia-approval", "partner-rights", "real-pilot", "school-university-reach", "independent-security", "named-operations"];
    expect(report.blockedExternal.filter((id: string) => externalIds.includes(id)).sort()).toEqual([...externalIds].sort());
    expect(new Set(report.blockedExternal.filter((id: string) => externalIds.includes(id))).size).toBe(11);
  });
});
