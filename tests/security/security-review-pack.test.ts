import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security review pack disclosure", () => {
  it("never represents local checks as an independent review", () => {
    const source = readFileSync("scripts/security-review-pack.mjs", "utf8");
    expect(source).toContain('independentReview: "PENDING_EXTERNAL"');
    expect(source).toContain('penTest: "NOT_PERFORMED"');
    expect(source).toContain("publicBetaAllowed: false");
  });

  it("keeps the external security gate pending in the ledger", () => {
    const ledger = JSON.parse(readFileSync("artifacts/operations/external-evidence-ledger.json", "utf8"));
    expect(ledger.items.find((item: { id: string }) => item.id === "independent-security")).toMatchObject({ status: "PENDING", owner: null, artifact: null });
  });
});
