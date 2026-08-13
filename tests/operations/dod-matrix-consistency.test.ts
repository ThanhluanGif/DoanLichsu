import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll } from "vitest";

const temp = mkdtempSync(join(tmpdir(), "qsv-dod-consistency-"));
describe("DoD and Section 17 matrix consistency", () => {
  it("accepts the checked-in truthful state", () => {
    const result = spawnSync(process.execPath, ["scripts/dod-matrix-consistency.mjs"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync("artifacts/release/dod-matrix-consistency.json", "utf8"))).toMatchObject({ consistent: true, publicBeta: false, checks: { overall: true, publicBeta: true, externalBlockers: true } });
  });
  it("detects a temporary matrix status drift", () => {
    const matrix = JSON.parse(readFileSync("artifacts/release/year-one-dod-matrix.json", "utf8"));
    const dod = JSON.parse(readFileSync("artifacts/release/dod-audit.json", "utf8"));
    const dodPath = join(temp, "dod.json"); const matrixPath = join(temp, "matrix.json");
    writeFileSync(dodPath, JSON.stringify({ ...dod, status: "READY" })); writeFileSync(matrixPath, JSON.stringify(matrix));
    const source = readFileSync("scripts/dod-matrix-consistency.mjs", "utf8").replace('artifacts/release/dod-audit.json', dodPath).replace('artifacts/release/year-one-dod-matrix.json', matrixPath).replace('artifacts/release/dod-matrix-consistency.json', join(temp, "report.json"));
    const script = join(temp, "check.mjs"); writeFileSync(script, source);
    const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
  });
});
afterAll(() => rmSync(temp, { recursive: true, force: true }));
