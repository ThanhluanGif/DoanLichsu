import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
const root = process.cwd();
function run(database: string, output: string) { try { execFileSync(process.execPath, [join(root, "scripts/curriculum-coverage.mjs"), "--database", database, "--output", output, "--json"], { cwd: root, stdio: "pipe" }); return { code: 0, report: JSON.parse(readFileSync(output, "utf8")) }; } catch { const report = JSON.parse(readFileSync(output, "utf8")); return { code: 1, report }; } }
describe("curriculum completeness release gate", () => {
  it("fails closed on an empty/partial fixture without mutating data", () => { const dir = mkdtempSync(join(tmpdir(), "qsv-coverage-red-")); const db = join(dir, "empty.db"); const out = join(dir, "report.json"); migrateDatabase(db); const before = (new Database(db, { readonly: true }).prepare("SELECT COUNT(*) AS count FROM curriculum_requirements").get() as { count: number }).count; const result = run(db, out); const after = (new Database(db, { readonly: true }).prepare("SELECT COUNT(*) AS count FROM curriculum_requirements").get() as { count: number }).count; expect(result.code).toBe(1); expect(result.report.status).toBe("FAIL"); expect(result.report.summary.mandatoryRequirements).toBe(0); expect(after).toBe(before); });
  it("requires every mandatory requirement to pass both locales and keeps electives separate", () => { const report = JSON.parse(readFileSync("artifacts/curriculum-completeness/curriculum-coverage.json", "utf8")); expect(report.rules.mandatoryRequiresBothLocales).toBe(true); expect(report.rules.electiveSeparate).toBe(true); expect(report.elective.every((row: { grade: number }) => [10, 11, 12].includes(row.grade))).toBe(true); expect(report.mandatory.every((row: { track: string }) => row.track === "MANDATORY")).toBe(true); });
});
