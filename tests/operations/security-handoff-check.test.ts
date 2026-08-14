import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-security-handoff-"));
const reportArtifact = "artifacts/security/security-review-pack.json";
const hash = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const currentCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const validManifest = () => ({
  version: "security-handoff-v1",
  testedCommit: currentCommit,
  tool: "SyntheticSecurityScanner",
  toolVersion: "1.0.0-fixture",
  reviewedAt: "2026-08-14T00:00:00Z",
  scope: ["auth-rbac", "source-ingestion", "ai-safety"],
  findings: { critical: 0, high: 0, medium: 1, low: 2 },
  remediationStatus: "TRACKED",
  reportArtifact,
  reportSha256: hash(reportArtifact),
  reviewer: { name: "Synthetic security owner", organization: "Fixture Lab", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
  decision: "PENDING_EXTERNAL_REVIEW",
  externalEvidenceAttached: false,
  releaseAllowed: false,
  publicBeta: false,
});
const run = (manifest: Record<string, unknown>) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(input, `${JSON.stringify(manifest)}\n`);
  const result = spawnSync(process.execPath, ["scripts/security-handoff-check.mjs", "--input", input, "--output", output], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("independent security handoff gate", () => {
  it("accepts a complete synthetic packet but never releases it", () => {
    const { result, report } = run(validManifest());
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_SECURITY_PACKET", officialSecurityEvidence: false, releaseAllowed: false, publicBeta: false, errors: [] });
  });

  it("rejects critical/high findings, scope gaps, commit/hash drift and self-approval", () => {
    const manifest = validManifest();
    manifest.findings = { critical: 1, high: 2, medium: 0, low: 0 };
    manifest.scope = ["auth-rbac"];
    manifest.testedCommit = "0".repeat(40);
    manifest.reportSha256 = "f".repeat(64);
    manifest.decision = "APPROVED";
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["CRITICAL_FINDINGS_MUST_BE_ZERO", "HIGH_FINDINGS_MUST_BE_ZERO", "MISSING_SCOPE:source-ingestion", "TESTED_COMMIT_MUST_MATCH_CURRENT_HEAD", "REPORT_ARTIFACT_SHA256_MISMATCH", "SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW"]));
  });

  it("rejects path traversal and sensitive values", () => {
    const manifest = validManifest();
    manifest.reportArtifact = "../security-report.json";
    manifest.reviewer = Object.assign({}, manifest.reviewer, { reviewerEmail: "person@example.test" });
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["REPORT_ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT", "manifest.reviewer.reviewerEmail:PII_OR_SECRET_VALUE_FORBIDDEN"]));
    expect(report.officialSecurityEvidence).toBe(false);
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
