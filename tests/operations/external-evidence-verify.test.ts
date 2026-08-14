import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-evidence-verify-"));
const run = (ledger: unknown) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}-report.json`);
  writeFileSync(input, `${JSON.stringify(ledger)}\n`);
  const result = spawnSync(process.execPath, ["scripts/external-evidence-verify.mjs", "--input", input, "--output", output], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("external evidence verifier", () => {
  it("accepts the real pending ledger but never allows release", () => {
    const result = spawnSync(process.execPath, ["scripts/external-evidence-verify.mjs"], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync("artifacts/operations/external-evidence-verification.json", "utf8"))).toMatchObject({ status: "PASS_LEDGER_VALID", releaseAllowed: false, pending: expect.arrayContaining(["official-production", "council-signoff"]) });
  });

  it("rejects a PASS item without named owner, artifact and hash", () => {
    const ledger = { status: "PENDING_EXTERNAL_EVIDENCE", fabricatedPersonalData: false, items: Array.from({ length: 11 }, (_, index) => ({ id: ["official-production", "uptime-90-day", "council-signoff", "ai-golden-human-approval", "model-comparison", "dpia-approval", "partner-rights", "real-pilot", "school-university-reach", "independent-security", "named-operations"][index], status: index === 0 ? "PASS" : "PENDING" })) };
    const { result, report } = run(ledger);
    expect(result.status).not.toBe(0);
    expect(report.errors).toContain("official-production:PASS_REQUIRES_OWNER_ARTIFACT_SHA256");
  });

  it("rejects fabricated-personal-data flag even when all gates are pending", () => {
    const base = JSON.parse(readFileSync("artifacts/operations/external-evidence-ledger.json", "utf8"));
    const { result, report } = run({ ...base, fabricatedPersonalData: true });
    expect(result.status).not.toBe(0);
    expect(report.errors).toContain("FABRICATED_PERSONAL_DATA_FLAG_MUST_BE_FALSE");
  });

  it("rejects READY ledgers that still contain pending gates", () => {
    const base = JSON.parse(readFileSync("artifacts/operations/external-evidence-ledger.json", "utf8"));
    const { result, report } = run({ ...base, status: "READY" });
    expect(result.status).not.toBe(0);
    expect(report.errors).toContain("READY_REQUIRES_ALL_GATES_PASS");
  });

  it("rejects top-level production, council, and pilot claims without matching PASS items", () => {
    const base = JSON.parse(readFileSync("artifacts/operations/external-evidence-ledger.json", "utf8"));
    const { result, report } = run({ ...base, realCouncilSignoff: true, realPilotCompleted: true, officialProductionDomain: true });
    expect(result.status).not.toBe(0);
    expect(report.errors).toEqual(expect.arrayContaining([
      "realCouncilSignoff:REQUIRES_COUNCIL_SIGNOFF_PASS",
      "realPilotCompleted:REQUIRES_REAL_PILOT_PASS",
      "officialProductionDomain:REQUIRES_OFFICIAL_PRODUCTION_PASS",
    ]));
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
