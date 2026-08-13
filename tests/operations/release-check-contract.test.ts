import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("release-check contract disclosures", () => {
  it("keeps external HTTPS and local-only scope explicit", () => {
    const source = readFileSync("scripts/release-check.mjs", "utf8");
    expect(source).toContain("testedCommit");
    expect(source).toContain("sourceTreeSha256");
    expect(source).toContain("disposable local production-like evidence; not official production");
    expect(source).toContain("requires E2E_BASE_URL set to a deployed HTTPS origin");
    expect(source).toContain("E2E_BASE_URL must be a deployed HTTPS origin");
    expect(source).toContain("Sensitive release log material detected");
  });
});
