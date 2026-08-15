import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("external evidence submission kit", () => {
  it("generates a blank, bilingual, fail-closed packet for every canonical gate", () => {
    const result = spawnSync(process.execPath, ["scripts/external-evidence-submission-kit.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);

    const kit = JSON.parse(readFileSync("artifacts/operations/external-evidence-submission-kit.json", "utf8"));
    expect(kit).toMatchObject({
      version: "external-evidence-submission-kit-v1",
      status: "PENDING_EXTERNAL_EVIDENCE",
      releaseAllowed: false,
      publicBeta: false,
      databaseMutation: false,
      noFabricatedEvidence: true,
      pendingCount: 11,
      passedCount: 0,
      rejectedCount: 0,
    });
    expect(kit.rows).toHaveLength(11);
    expect(kit.rows.every((row: { status: string; submission: Record<string, unknown>; labelVi: string; labelEn: string; requiredEvidence: string }) => row.status === "PENDING" && row.labelVi.length > 0 && row.labelEn.length > 0 && row.requiredEvidence.length > 0)).toBe(true);
    expect(kit.rows.every((row: { submission: Record<string, unknown> }) => Object.values(row.submission).every((value) => value === null))).toBe(true);
    expect(kit.instructions.requiredFields.map((field: { key: string }) => field.key)).toEqual(["owner", "authority", "verifiedAt", "artifact", "sha256", "note"]);
    expect(kit.instructions.vi).toContain("Không sửa kit để tự phê duyệt");
    expect(kit.instructions.en).toContain("Do not self-approve");
    expect(kit.ledgerSha256).toMatch(/^[a-f0-9]{64}$/);
    const submittedValues = kit.rows.flatMap((row: { submission: Record<string, unknown> }) => Object.values(row.submission));
    expect(submittedValues.every((value: unknown) => value === null)).toBe(true);
    expect(JSON.stringify(submittedValues)).not.toMatch(/(sk-|Bearer |BEGIN PRIVATE KEY)/i);
  });
});
