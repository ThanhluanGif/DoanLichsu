import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const script = "scripts/external-evidence-intake.mjs";
const canonical = "artifacts/operations/external-evidence-ledger.json";
const run = (input: string, output: string) => spawnSync(process.execPath, [script, "--input", input, "--output", output], { cwd: process.cwd(), encoding: "utf8" });

describe("external evidence intake validator", () => {
  it("accepts the pending handoff without mutating its ledger", () => {
    const directory = mkdtempSync(join(tmpdir(), "qsv-evidence-intake-"));
    try {
      const input = join(directory, "ledger.json");
      const output = join(directory, "report.json");
      copyFileSync(canonical, input);
      const before = readFileSync(input);
      const result = run(input, output);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "PASS_INTAKE_SCHEMA", pending: 11, errors: 0, databaseMutation: false });
      expect(readFileSync(input)).toEqual(before);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("rejects an asserted pass without authoritative packet metadata", () => {
    const directory = mkdtempSync(join(tmpdir(), "qsv-evidence-intake-red-"));
    try {
      const input = join(directory, "ledger.json");
      const output = join(directory, "report.json");
      const ledger = JSON.parse(readFileSync(canonical, "utf8"));
      ledger.items[0] = { ...ledger.items[0], status: "PASS", owner: null, authority: null, artifact: null, sha256: null, verifiedAt: null };
      writeFileSync(input, `${JSON.stringify(ledger)}\n`);
      const result = run(input, output);
      expect(result.status).toBe(1);
      expect(JSON.parse(readFileSync(output, "utf8")).errors).toEqual(expect.arrayContaining([
        "official-production:PASS_REQUIRES_OWNER",
        "official-production:PASS_REQUIRES_AUTHORITY_SCOPE",
        "official-production:PASS_REQUIRES_ISO_VERIFIED_AT",
        "official-production:PASS_REQUIRES_EXISTING_REPOSITORY_ARTIFACT",
        "official-production:PASS_REQUIRES_SHA256",
      ]));
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("accepts one structurally complete pass only when the artifact hash matches", () => {
    const directory = mkdtempSync(join(tmpdir(), "qsv-evidence-intake-green-"));
    try {
      const input = join(directory, "ledger.json");
      const output = join(directory, "report.json");
      const ledger = JSON.parse(readFileSync(canonical, "utf8"));
      const artifact = canonical;
      const hash = createHash("sha256").update(readFileSync(artifact)).digest("hex");
      ledger.items[0] = { ...ledger.items[0], status: "PASS", owner: "Named operations owner", authority: "Operations release authority", artifact, sha256: hash, verifiedAt: "2026-08-14T12:00:00.000Z" };
      writeFileSync(input, `${JSON.stringify(ledger)}\n`);
      const result = run(input, output);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "PASS_INTAKE_SCHEMA", passed: 1, pending: 10, releaseAllowed: false });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
