import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

describe("current HEAD release evidence", () => {
  it("is tied to the checked-out commit and keeps production disclosures", () => {
    if (process.env.RELEASE_EVIDENCE_RUN === "1") {
      expect(readFileSync("scripts/release-evidence-current.mjs", "utf8")).toContain("const report");
      return;
    }
    const report = JSON.parse(readFileSync("artifacts/release/current-head-evidence.json", "utf8"));
    expect(report.testedCommit).toMatch(/^[0-9a-f]{40}$/);
    const sourceHash = JSON.parse(execFileSync(process.execPath, ["scripts/source-tree-hash.mjs"], { encoding: "utf8" })).sourceTreeSha256;
    expect(report.sourceTreeSha256).toBe(sourceHash);
    expect(report.originKind).toContain("not official production");
    expect(report.httpsE2e).toBe("NOT_RUN_IN_THIS_LOCAL_RUN");
    expect(report.externalLimitations).toContain("90-day uptime");
  });
});
