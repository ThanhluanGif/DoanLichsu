import Database from "better-sqlite3";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { POST as correctionRoute } from "@/app/api/v1/corrections/route";
import { migrateDatabase } from "@/lib/db/migrate";

const origin = "https://corrections.quansuviet.test";
const directory = mkdtempSync(join(tmpdir(), "qsv-corrections-"));
const databasePath = join(directory, "corrections.db");

function request(body: unknown) {
  return new Request(`${origin}/api/v1/corrections`, {
    method: "POST",
    headers: { "Origin": origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = (suffix = "A") => ({
  contentId: "artifact-bach-dang-stakes",
  category: "FACTUAL",
  description: `Đối chiếu lại mốc thời gian với hồ sơ lưu trữ ${suffix}.`,
  evidenceLocator: "https://archive.example.test/record-001",
  urgency: "NORMAL",
  consent: "yes",
  website: "",
});

describe("public correction intake", () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = databasePath;
    rmSync(databasePath, { force: true });
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
    migrateDatabase(databasePath);
  });

  afterAll(() => {
    delete process.env.DATABASE_PATH;
    rmSync(directory, { recursive: true, force: true });
  });

  it("accepts a valid report without storing reporter identity", async () => {
    const response = await correctionRoute(request(valid()));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ data: { state: "RECEIVED", slaHours: 72, reporterStored: false } });
    const database = new Database(databasePath, { readonly: true });
    try {
      expect(database.prepare("SELECT content_id AS contentId, category, state, sla_hours AS slaHours FROM correction_reports").get()).toMatchObject({ contentId: "artifact-bach-dang-stakes", category: "FACTUAL", state: "RECEIVED", slaHours: 72 });
      expect(database.prepare("PRAGMA table_info(correction_reports)").all()).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: "email" })]));
    } finally { database.close(); }
  });

  it("rejects PII, honeypot, unknown content and duplicates without extra writes", async () => {
    const pii = await correctionRoute(request({ ...valid(), description: "Gửi cho email example@example.com để liên hệ." }));
    expect(pii.status).toBe(400);
    const honeypot = await correctionRoute(request({ ...valid("B"), website: "bot" }));
    expect(honeypot.status).toBe(400);
    const unknown = await correctionRoute(request({ ...valid("C"), contentId: "not-published" }));
    expect(unknown.status).toBe(404);
    const first = await correctionRoute(request(valid("D")));
    expect(first.status).toBe(201);
    const duplicate = await correctionRoute(request(valid("D")));
    expect(duplicate.status).toBe(409);
    const database = new Database(databasePath, { readonly: true });
    try { expect(database.prepare("SELECT COUNT(*) AS count FROM correction_reports").get()).toEqual({ count: 1 }); } finally { database.close(); }
  });
});
