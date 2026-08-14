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
    expect(report.internalEvidence.release).toMatchObject({ artifact: "artifacts/release/current-head-evidence.json", testedCommit: expect.stringMatching(/^[0-9a-f]{40}$/), sourceTreeSha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(report.internalEvidence.runtime).toMatchObject({ artifact: "artifacts/operations/ghcr-runtime-smoke.json", image: expect.stringMatching(/^ghcr\.io\/.*@sha256:[a-f0-9]{64}$/), officialProduction: false, productionDeployment: false });
    expect(report.internalEvidence.security).toMatchObject({ artifact: "artifacts/security/security-review-pack.json", status: "PASS_LOCAL_SECURITY_EVIDENCE", dependencyAudit: true, independentReview: "PENDING_EXTERNAL", penTest: "NOT_PERFORMED" });
  });
});
