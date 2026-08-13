import Database from "better-sqlite3";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as reviewRoute } from "@/app/api/v1/admin/contents/[id]/history-review/route";

const origin = "https://history-review.quansuviet.test";
const directory = mkdtempSync(join(tmpdir(), "qsv-history-review-"));
const databasePath = join(directory, "review.db");
const context = (id: string) => ({ params: Promise.resolve({ id }) });

function request(method: string, path: string, body?: unknown, cookie?: string) {
  const headers = new Headers({ Origin: origin });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (cookie) headers.set("Cookie", cookie);
  return new Request(`${origin}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

async function login(email: string, password: string) {
  const response = await loginRoute(request("POST", "/api/v1/auth/login", { email, password }));
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";", 1)[0];
}

describe("published editorial history review", () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = databasePath;
    process.env.APP_ORIGIN = origin;
    process.env.SESSION_SECRET = "history-review-test-session-secret-at-least-32";
    rmSync(databasePath, { force: true });
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
  });

  afterAll(() => {
    delete process.env.DATABASE_PATH;
    rmSync(directory, { recursive: true, force: true });
  });

  it("requires an explicit human attestation and records one actor-attributed review", async () => {
    const reviewer = await login("reviewer@quansuviet.local", "Reviewer-Demo-2026!");
    const response = await reviewRoute(request("POST", "/api/v1/admin/contents/artifact-bach-dang-stakes/history-review", {
      version: 1, evidenceLocator: "https://archive.example.test/review/record-001", note: "Đối chiếu nguồn và lịch sử biên tập hiện có.", attestation: "HUMAN_REVIEWED",
    }, reviewer), context("artifact-bach-dang-stakes"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { contentId: "artifact-bach-dang-stakes", status: "HUMAN_REVIEWED", reviewedBy: "Kiểm duyệt viên" } });
    const database = new Database(databasePath, { readonly: true });
    try {
      expect(database.prepare("SELECT action, actor_id AS actorId, object_id AS objectId, json_extract(metadata, '$.evidenceLocator') AS locator FROM audit_logs WHERE action='content.editorial_history.review'").get()).toMatchObject({ action: "content.editorial_history.review", actorId: "user-reviewer", objectId: "artifact-bach-dang-stakes", locator: "https://archive.example.test/review/record-001" });
    } finally { database.close(); }
    const duplicate = await reviewRoute(request("POST", "/api/v1/admin/contents/artifact-bach-dang-stakes/history-review", { version: 1, evidenceLocator: "https://archive.example.test/review/record-002", note: "Lần hai.", attestation: "HUMAN_REVIEWED" }, reviewer), context("artifact-bach-dang-stakes"));
    expect(duplicate.status).toBe(409);
  });

  it("rejects missing attestation, editor access, and stale versions without writes", async () => {
    const reviewer = await login("reviewer@quansuviet.local", "Reviewer-Demo-2026!");
    const editor = await login("editor@quansuviet.local", "Editor-Demo-2026!");
    const missing = await reviewRoute(request("POST", "/api/v1/admin/contents/artifact-bach-dang-stakes/history-review", { version: 1, evidenceLocator: "locator", note: "review" }, reviewer), context("artifact-bach-dang-stakes"));
    expect(missing.status).toBe(400);
    const forbidden = await reviewRoute(request("POST", "/api/v1/admin/contents/artifact-bach-dang-stakes/history-review", { version: 1, evidenceLocator: "locator", note: "review", attestation: "HUMAN_REVIEWED" }, editor), context("artifact-bach-dang-stakes"));
    expect(forbidden.status).toBe(403);
    const stale = await reviewRoute(request("POST", "/api/v1/admin/contents/artifact-bach-dang-stakes/history-review", { version: 99, evidenceLocator: "locator", note: "review", attestation: "HUMAN_REVIEWED" }, reviewer), context("artifact-bach-dang-stakes"));
    expect(stale.status).toBe(409);
    const database = new Database(databasePath, { readonly: true });
    try { expect(database.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action='content.editorial_history.review'").get()).toEqual({ count: 0 }); } finally { database.close(); }
  });
});
