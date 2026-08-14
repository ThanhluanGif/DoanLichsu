import Database from "better-sqlite3";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { POST as correctionRoute } from "@/app/api/v1/corrections/route";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { GET as listRoute } from "@/app/api/v1/admin/corrections/route";
import { POST as transitionRoute } from "@/app/api/v1/admin/corrections/[id]/transition/route";
import { migrateDatabase } from "@/lib/db/migrate";

const origin = "https://corrections-admin.quansuviet.test";
const directory = mkdtempSync(join(tmpdir(), "qsv-corrections-admin-"));
const databasePath = join(directory, "corrections.db");
const context = (id: string) => ({ params: Promise.resolve({ id }) });
function request(path: string, body?: unknown, cookie?: string) { const headers = new Headers({ Origin: origin }); if (body !== undefined) headers.set("Content-Type", "application/json"); if (cookie) headers.set("Cookie", cookie); return new Request(`${origin}${path}`, { method: body === undefined ? "GET" : "POST", headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
async function login(email: string, password: string) { const response = await loginRoute(request("/api/v1/auth/login", { email, password })); expect(response.status).toBe(200); return response.headers.get("set-cookie")!.split(";", 1)[0]; }
async function createReport() { const response = await correctionRoute(request("/api/v1/corrections", { contentId: "artifact-bach-dang-stakes", category: "FACTUAL", description: "Đối chiếu lại dữ kiện với hồ sơ lưu trữ để kiểm tra.", evidenceLocator: "https://archive.example.test/moderation-001", urgency: "NORMAL", consent: "yes", website: "" })); expect(response.status).toBe(201); return (await response.json()).data as { id: string; version?: number };
}

describe("correction moderation queue", () => {
  beforeEach(() => { process.env.DATABASE_PATH = databasePath; process.env.APP_ORIGIN = origin; process.env.SESSION_SECRET = "correction-admin-test-session-secret-32"; rmSync(databasePath, { force: true }); copyFileSync(resolve("data/quan-su-viet.db"), databasePath); migrateDatabase(databasePath); });
  afterAll(() => { delete process.env.DATABASE_PATH; delete process.env.APP_ORIGIN; delete process.env.SESSION_SECRET; rmSync(directory, { recursive: true, force: true }); });

  it("lists, enforces roles/version, and writes actor-attributed transitions", async () => {
    const report = await createReport();
    const editor = await login("editor@quansuviet.local", "Editor-Demo-2026!");
    const reviewer = await login("reviewer@quansuviet.local", "Reviewer-Demo-2026!");
    const listed = await listRoute(request("/api/v1/admin/corrections?state=RECEIVED", undefined, reviewer));
    expect(listed.status).toBe(200);
    expect(await listed.json()).toMatchObject({ meta: { total: 1 }, data: [{ id: report.id, state: "RECEIVED", version: 1, overdue: false }] });
    const triaged = await transitionRoute(request(`/api/v1/admin/corrections/${report.id}/transition`, { version: 1, state: "TRIAGED", reason: "Đã phân loại để reviewer kiểm tra." }, editor), context(report.id));
    expect(triaged.status).toBe(200);
    const forbidden = await transitionRoute(request(`/api/v1/admin/corrections/${report.id}/transition`, { version: 2, state: "CORRECTED", reason: "Editor không được kết luận." }, editor), context(report.id));
    expect(forbidden.status).toBe(403);
    const stale = await transitionRoute(request(`/api/v1/admin/corrections/${report.id}/transition`, { version: 1, state: "IN_REVIEW", reason: "Phiên bản cũ." }, reviewer), context(report.id));
    expect(stale.status).toBe(409);
    const inReview = await transitionRoute(request(`/api/v1/admin/corrections/${report.id}/transition`, { version: 2, state: "IN_REVIEW", reason: "Reviewer bắt đầu đối chiếu." }, reviewer), context(report.id));
    expect(inReview.status).toBe(200);
    const corrected = await transitionRoute(request(`/api/v1/admin/corrections/${report.id}/transition`, { version: 3, state: "CORRECTED", reason: "Đã kiểm tra evidence; chờ publish correction riêng." }, reviewer), context(report.id));
    expect(corrected.status).toBe(200);
    expect(await corrected.json()).toMatchObject({ data: { id: report.id, state: "CORRECTED", version: 4 } });
    const database = new Database(databasePath, { readonly: true });
    try { expect(database.prepare("SELECT action, actor_id AS actorId, json_extract(metadata, '$.reason') AS reason FROM audit_logs WHERE action='correction.transition' ORDER BY created_at").all()).toHaveLength(3); expect(database.prepare("SELECT state, version FROM correction_reports WHERE id=?").get(report.id)).toEqual({ state: "CORRECTED", version: 4 }); } finally { database.close(); }
  });
});
