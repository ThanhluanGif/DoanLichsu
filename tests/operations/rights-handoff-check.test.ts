import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-rights-handoff-"));
const batchPath = "artifacts/wikimedia/batch-300-report.json";
const ledgerPath = "artifacts/wikimedia/rights-review-ledger.json";
const hash = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const validManifest = () => ({
  version: "rights-handoff-v1",
  batchSha256: hash(batchPath),
  ledgerSha256: hash(ledgerPath),
  rightsReviewer: { name: "Synthetic rights owner", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
  partnerCollections: [
    { id: "collection-a", name: "Fixture collection A", mode: "LINK_ONLY", artifact: ledgerPath, sha256: hash(ledgerPath), owner: "Fixture owner A", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
    { id: "collection-b", name: "Fixture collection B", mode: "LINK_ONLY", artifact: ledgerPath, sha256: hash(ledgerPath), owner: "Fixture owner B", authority: "fixture-only", verifiedAt: "2026-08-14T00:00:00Z" },
  ],
  decision: "PENDING_EXTERNAL_REVIEW",
  externalEvidenceAttached: false,
  binaryServingEnabled: false,
  releaseAllowed: false,
  publicBeta: false,
});
const run = (manifest: Record<string, unknown>, extra: string[] = []) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(input, `${JSON.stringify(manifest)}\n`);
  const result = spawnSync(process.execPath, ["scripts/rights-handoff-check.mjs", "--input", input, "--output", output, ...extra], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("Wikimedia/partner rights handoff gate", () => {
  it("accepts a complete synthetic link-only packet but never approves binary", () => {
    const { result, report } = run(validManifest());
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_RIGHTS_PACKET", officialPartnerRights: false, approvedForBinary: 0, binaryServingEnabled: false, releaseAllowed: false, publicBeta: false, errors: [] });
  });

  it("rejects ledger drift, invalid metadata, binary claims and self-approval", () => {
    const manifest = validManifest();
    manifest.ledgerSha256 = "0".repeat(64);
    manifest.binaryServingEnabled = true;
    manifest.decision = "APPROVED";
    manifest.partnerCollections[0].mode = "PERMITTED";
    const alteredLedger = join(temp, "altered-ledger.json");
    const ledger = JSON.parse(readFileSync(resolve(root, ledgerPath), "utf8"));
    ledger.invalidMetadataCount = 1;
    writeFileSync(alteredLedger, JSON.stringify(ledger));
    const alteredHash = createHash("sha256").update(readFileSync(alteredLedger)).digest("hex");
    manifest.ledgerSha256 = alteredHash;
    const { result, report } = run(manifest, ["--ledger-file", alteredLedger]);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["BINARY_SERVING_MUST_REMAIN_FALSE", "SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW", "RIGHTS_LEDGER_INVALID_METADATA_MUST_BE_ZERO", "partnerCollection[0]:MODE_MUST_REMAIN_LINK_ONLY_UNTIL_PERMISSION_REVIEW"]));
  });

  it("rejects missing partner authority, path traversal and sensitive values", () => {
    const manifest = validManifest();
    manifest.partnerCollections[0] = Object.assign({}, manifest.partnerCollections[0], { authority: null, artifact: "../outside.json", reviewerEmail: "person@example.test" });
    const { result, report } = run(manifest);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["partnerCollection[0]:ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT", "partnerCollection[0]:AUTHORITY_REQUIRED", "manifest.partnerCollections.0.reviewerEmail:PII_OR_SECRET_VALUE_FORBIDDEN"]));
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
