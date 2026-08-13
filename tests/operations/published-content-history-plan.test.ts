import { afterAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const temp = mkdtempSync(join(tmpdir(), "qsv-history-plan-"));
describe("published content history remediation plan", () => {
  it("creates a read-only human-review queue without claiming approval", () => {
    const output = join(temp, "plan.json");
    const result = spawnSync(process.execPath, ["scripts/published-content-history-plan.mjs"], {
      cwd: process.cwd(), env: { ...process.env, OUTPUT: output }, encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report).toMatchObject({ status: "REQUIRES_HUMAN_REVIEW", publishedContent: 105, candidateCount: 105, databaseWrites: 0, fabricatedApproval: false, councilApproval: "NOT_EVALUATED" });
    expect(report.candidates).toHaveLength(105);
    expect(report.candidates.every((row: { disposition: string; fabricatedApproval: boolean }) => row.disposition === "REQUIRES_HUMAN_REVIEW" && row.fabricatedApproval === false)).toBe(true);
  });
});
afterAll(() => rmSync(temp, { recursive: true, force: true }));
