import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-dpia-readiness-"));
const policyPath = "docs/privacy/dpia.md";
const policyHash = createHash("sha256").update(readFileSync(resolve(root, policyPath))).digest("hex");
const validManifest = () => ({
  version: "dpia-handoff-v1",
  policy: { path: policyPath, sha256: policyHash, version: "DPIA and Child/Privacy Controls v1.0" },
  decision: "PENDING_EXTERNAL_REVIEW",
  owner: { name: "Synthetic test owner", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
  approvalArtifact: null,
  externalEvidenceAttached: false,
  releaseAllowed: false,
  publicBeta: false,
});
const run = (manifest: Record<string, unknown>, extra: string[] = []) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(input, `${JSON.stringify(manifest)}\n`);
  const result = spawnSync(process.execPath, ["scripts/dpia-readiness-check.mjs", "--input", input, "--output", output, ...extra], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("DPIA readiness gate", () => {
  it("accepts canonical controls while keeping approval and release disabled", () => {
    const { result, report } = run(validManifest());
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_DPIA_CONTROLS_PENDING_REVIEW", approved: false, releaseAllowed: false, publicBeta: false, errors: [] });
    expect(report.policy.controls).toHaveLength(8);
    expect(report.policy.controls.every((control: { passed: boolean }) => control.passed)).toBe(true);
  });

  it("rejects policy drift, self-approval and sensitive values", () => {
    const manifest = { ...validManifest(), decision: "APPROVED", policy: { ...validManifest().policy, sha256: "0".repeat(64) }, guardianEmail: "person@example.test" };
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["POLICY_SHA256_MISMATCH", "SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW", "manifest.guardianEmail:PII_OR_SECRET_VALUE_FORBIDDEN"]));
    expect(report.approved).toBe(false);
  });

  it("rejects a missing required control and path traversal", () => {
    const alteredPolicy = join(temp, "altered-dpia.md");
    const altered = readFileSync(resolve(root, policyPath), "utf8").replace("Data minimization", "Data handling");
    writeFileSync(alteredPolicy, altered);
    const manifest = validManifest();
    manifest.policy = { ...manifest.policy, path: "../docs/privacy/dpia.md", sha256: createHash("sha256").update(altered).digest("hex") };
    const { result, report } = run(manifest, ["--policy-file", alteredPolicy]);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["POLICY_PATH_MUST_BE_CANONICAL", "MISSING_CONTROL:Data minimization"]));
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
