import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-model-comparison-"));
const dataset = "artifacts/ai-eval/questions-500.json";
const artifact = "artifacts/ai-eval/config-comparison.json";
const hash = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const metric = { questions: 500, accuracy: 0.91, citationPrecision: 0.94, refusalRate: 0.88, injectionLeakRate: 0.01, latencyMs: 210, costUsd: 0.12 };
const validManifest = () => ({
  version: "model-comparison-v1",
  dataset: { path: dataset, sha256: hash(dataset) },
  comparisons: [
    { id: "a", provider: "provider-a", model: "model-a", configuration: "config-a", metrics: metric, artifact, sha256: hash(artifact) },
    { id: "b", provider: "provider-b", model: "model-b", configuration: "config-b", metrics: metric, artifact, sha256: hash(artifact) },
  ],
  owner: { name: "Synthetic test owner", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
  externalEvidenceAttached: false,
  releaseAllowed: false,
  publicBeta: false,
});
const run = (manifest: Record<string, unknown>) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(input, `${JSON.stringify(manifest)}\n`);
  const result = spawnSync(process.execPath, ["scripts/model-comparison-check.mjs", "--input", input, "--output", output], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("model comparison readiness gate", () => {
  it("accepts a structurally complete synthetic packet but never releases it", () => {
    const { result, report } = run(validManifest());
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_COMPARISON_PACKET", releaseAllowed: false, officialModelIndependenceEvidence: false, publicBeta: false, errors: [] });
  });

  it("rejects same-model, dataset-drift, metric and artifact tampering", () => {
    const manifest = validManifest();
    manifest.comparisons[1].provider = "provider-a";
    manifest.comparisons[1].model = "model-a";
    manifest.dataset.sha256 = "0".repeat(64);
    manifest.comparisons[0].metrics = { ...metric, citationPrecision: 2 };
    manifest.comparisons[1].sha256 = "f".repeat(64);
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.status).toBe("BLOCKED_EXTERNAL");
    expect(report.errors).toEqual(expect.arrayContaining(["DATASET_SHA256_MISMATCH", "comparison[1]:SAME_PROVIDER_MODEL_NOT_ALLOWED", "comparison[0]:citationPrecision_MUST_BE_0_TO_1", "comparison[1]:ARTIFACT_SHA256_MISMATCH"]));
  });

  it("rejects secret/token values and release claims", () => {
    const manifest = { ...validManifest(), apiToken: "never-accept-this", releaseAllowed: true, publicBeta: true };
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["PUBLIC_BETA_MUST_BE_FALSE", "RELEASE_ALLOWED_MUST_BE_FALSE", "manifest.apiToken:SECRET_OR_TOKEN_VALUE_FORBIDDEN"]));
    expect(report.releaseAllowed).toBe(false);
    expect(report.officialModelIndependenceEvidence).toBe(false);
  });

  it("rejects artifact path traversal", () => {
    const manifest = validManifest();
    manifest.comparisons[0].artifact = "../outside.json";
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toContain("comparison[0]:ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT");
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
