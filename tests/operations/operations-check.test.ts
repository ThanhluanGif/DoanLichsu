import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("operations readiness ledger provenance", () => {
  it("records the current pending external ledger without claiming approval", () => {
    const result = spawnSync(process.execPath, ["scripts/operations-check.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync("artifacts/operations/report.json", "utf8"));
    const hash = createHash("sha256").update(readFileSync("artifacts/operations/external-evidence-ledger.json")).digest("hex");
    expect(report).toMatchObject({ status: "PASS", externalEvidence: "PENDING_EXTERNAL_EVIDENCE", ledgerItems: 11, pendingGateCount: 11, ledgerSha256: hash, realPilotCompleted: false, realCouncilSignoff: false, fixedProductionDomain: false, noExternalApprovalClaim: true });
  });
});
