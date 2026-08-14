import { afterAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const temp = mkdtempSync(join(tmpdir(), "qsv-production-handoff-"));
const base = JSON.parse(readFileSync("docs/operations/production-handoff-manifest.example.json", "utf8"));
const existingArtifact = "artifacts/release/current-head-evidence.json";
const sha = createHash("sha256").update(readFileSync(existingArtifact)).digest("hex");
const valid = {
  ...base,
  origin: "https://qsv-production.test",
  releaseCommit: "0123456789abcdef0123456789abcdef01234567",
  imageDigest: `sha256:${"a".repeat(64)}`,
  criticalRoutes: ["/healthz", "/openapi.json", "/api/v1/vi/search?q=dien%20bien%20phu", "/vi", "/en", "/vi/minh-bach"],
  deploymentRecord: { artifact: existingArtifact, sha256: sha },
  rollback: { ref: "release-0.1.0", artifact: existingArtifact, sha256: sha },
  database: { strategy: "SQLite persistent volume with verified backup/restore", backupArtifact: existingArtifact, restoreArtifact: existingArtifact },
  monitoring: { provider: "External monitor", artifact: existingArtifact, sha256: sha },
  owner: { name: "Named operations owner", organization: "Authorised organisation", contact: "ops@example.org" },
  onCall: { name: "Named on-call", escalation: "Documented escalation", rotaArtifact: existingArtifact },
  rpoMinutes: 15,
  rtoMinutes: 60,
  secretNames: ["APP_ORIGIN", "SESSION_SECRET"],
};
const run = (manifest: unknown, name: string) => { const path = join(temp, `${name}.json`); const output = join(temp, `${name}-report.json`); writeFileSync(path, `${JSON.stringify(manifest)}\n`); const result = spawnSync(process.execPath, ["scripts/production-handoff-check.mjs", "--manifest", path, "--output", output], { cwd: process.cwd(), encoding: "utf8" }); return { result, report: JSON.parse(readFileSync(output, "utf8")) }; };

describe("production handoff check", () => {
  it("keeps the checked-in example blocked without a target", () => {
    const result = spawnSync(process.execPath, ["scripts/production-handoff-check.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    const report = JSON.parse(readFileSync("artifacts/operations/production-handoff-check.json", "utf8"));
    expect(result.status).toBe(1);
    expect(report).toMatchObject({ status: "BLOCKED_EXTERNAL", releaseAllowed: false, officialProductionEvidence: false, noFabricatedEvidence: true, secretValuesAccepted: false });
    expect(report.errors).toEqual(expect.arrayContaining([expect.stringContaining("origin:"), expect.stringContaining("owner.name:"), expect.stringContaining("deploymentRecord.artifact:")]));
  });
  it("accepts a structurally complete packet without promoting production", () => {
    const { result, report } = run(valid, "valid");
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_HANDOFF_READY", releaseAllowed: false, officialProductionEvidence: false, noFabricatedEvidence: true, secretValuesAccepted: false, errors: [] });
  });
  it("rejects placeholder origins, hash drift and secret values", () => {
    const { result, report } = run({ ...valid, origin: "http://127.0.0.1:3260", imageDigest: "sha256:bad", deploymentRecord: { artifact: existingArtifact, sha256: "0".repeat(64) }, sessionSecret: "do-not-accept" }, "invalid");
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining([expect.stringContaining("origin:REQUIRES_OFFICIAL_HTTPS_HOST"), expect.stringContaining("imageDigest:INVALID_IMAGE_DIGEST"), expect.stringContaining("deploymentRecord.sha256:SHA256_MISMATCH"), expect.stringContaining("manifest:sessionSecret_MUST_NOT_BE_PRESENT")]));
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
