import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("external evidence handoff", () => {
  it("lists every pending gate without inventing owners or approvals", () => {
    const result = spawnSync(process.execPath, ["scripts/external-evidence-handoff.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync("artifacts/operations/external-evidence-handoff.json", "utf8"));
    expect(report).toMatchObject({ pendingCount: 11, noFabricatedEvidence: true, publicBetaAllowed: false });
    expect(report.rows).toHaveLength(11);
    expect(report.rows.every((row: { status: string; owner: unknown; artifact: unknown }) => row.status === "PENDING" && row.owner === null && row.artifact === null)).toBe(true);
  });
});
