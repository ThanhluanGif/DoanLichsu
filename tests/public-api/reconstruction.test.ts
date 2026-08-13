import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
import { GET as list } from "@/app/api/v1/[locale]/reconstructions/route";
import { GET as detail } from "@/app/api/v1/[locale]/reconstructions/[slug]/route";
const directory = mkdtempSync(join(tmpdir(), "qsv-reconstruction-api-")); const databasePath = join(directory, "test.db"); const context = (locale: string, slug?: string) => ({ params: Promise.resolve(slug ? { locale, slug } : { locale }) }) as never;
beforeAll(() => { process.env.DATABASE_PATH = databasePath; migrateDatabase(databasePath); execFileSync(resolve("node_modules/.bin/tsx"), ["scripts/seed.ts"], { cwd: resolve("."), env: { ...process.env, DATABASE_PATH: databasePath }, stdio: "pipe" }); });
afterAll(() => { delete process.env.DATABASE_PATH; rmSync(directory, { recursive: true, force: true }); });
describe("public educational reconstruction API", () => {
  it("returns one sourced bilingual reconstruction with phase provenance", async () => {
    const response = await list(new Request("http://local/api/v1/vi/reconstructions"), context("vi")); const body = await response.json(); expect(response.status).toBe(200); expect(body.data).toHaveLength(1); expect(body.data[0]).toMatchObject({ label: "EDUCATIONAL_RECONSTRUCTION", confidence: "MEDIUM" });
    const detailResponse = await detail(new Request("http://local/api/v1/vi/reconstructions/bach-dang-1288"), context("vi", "bach-dang-1288")); const detailBody = await detailResponse.json(); expect(detailResponse.status).toBe(200); expect(detailBody.data.phases).toHaveLength(3); expect(detailBody.data.phases.every((phase: { assumptions: string[]; moves: Array<{ sourceIds: string[] }> }) => phase.assumptions.length > 0 && phase.moves.every((move) => move.sourceIds.length > 0))).toBe(true); expect(detailBody.data.sources.length).toBeGreaterThanOrEqual(2); expect(detailBody.data.fallback.image).toContain("reconstructions/");
  });
  it("rejects unknown scene", async () => { const response = await detail(new Request("http://local/api/v1/vi/reconstructions/unknown"), context("vi", "unknown")); expect(response.status).toBe(404); });
});
