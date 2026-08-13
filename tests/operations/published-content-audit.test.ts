import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll } from "vitest";

const temp = mkdtempSync(join(tmpdir(), "qsv-published-audit-"));
describe("published content metadata audit", () => {
  it("reports the real published database separately from Council approval", () => {
    const output = join(temp, "report.json"); const result = spawnSync(process.execPath, ["scripts/published-content-audit.mjs"], { cwd: process.cwd(), env: { ...process.env, OUTPUT: output }, encoding: "utf8" });
    expect(result.status).toBe(1);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report).toMatchObject({ status: "BLOCKED_INTERNAL_AUDIT", publishedContent: 105, completeContent: 0, missingContent: 105, externalCouncilApproval: "NOT_EVALUATED", noFabricatedApproval: true });
    expect(report.rows.every((row: { missing: string[] }) => row.missing.includes("editorialAuditHistory"))).toBe(true);
  });
  it("detects a missing editorial audit history in a temporary fixture", () => {
    const source = readFileSync("scripts/published-content-audit.mjs", "utf8");
    expect(source).toContain("editorialAuditHistory");
    expect(source).toContain("BLOCKED_INTERNAL_AUDIT");
  });
});
afterAll(() => rmSync(temp, { recursive: true, force: true }));
