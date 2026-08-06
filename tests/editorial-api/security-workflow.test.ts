import Database from "better-sqlite3";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getAlternate, getDetail } from "@/lib/content/public-repository";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { GET as meRoute } from "@/app/api/v1/auth/me/route";
import { POST as logoutRoute } from "@/app/api/v1/auth/logout/route";
import { GET as usersRoute, POST as createUserRoute } from "@/app/api/v1/admin/users/route";
import { PATCH as updateUserRoute } from "@/app/api/v1/admin/users/[id]/route";
import { POST as createContentRoute } from "@/app/api/v1/admin/contents/route";
import { PATCH as updateContentRoute } from "@/app/api/v1/admin/contents/[id]/route";
import { PUT as putTranslationRoute } from "@/app/api/v1/admin/contents/[id]/translations/[locale]/route";
import { POST as submitRoute } from "@/app/api/v1/admin/contents/[id]/submit-review/route";
import { POST as approveRoute } from "@/app/api/v1/admin/contents/[id]/approve/route";
import { POST as rejectRoute } from "@/app/api/v1/admin/contents/[id]/reject/route";
import { POST as publishRoute } from "@/app/api/v1/admin/contents/[id]/publish/route";
import { GET as auditRoute } from "@/app/api/v1/admin/audit-logs/route";
import { openApiDocument } from "@/lib/openapi/document";

const origin = "http://editorial.test";
const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-editorial-"));
const databasePath = join(directory, "editorial.db");
type Cookie = string;

function request(method: string, path: string, body?: unknown, cookie?: Cookie, requestOrigin = origin) {
  const headers = new Headers({ Origin: requestOrigin });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (cookie) headers.set("Cookie", cookie);
  return new Request(`${origin}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

function cookieFrom(response: Response): Cookie {
  return response.headers.get("set-cookie")!.split(";", 1)[0];
}

async function login(email: string, password: string): Promise<Cookie> {
  const response = await loginRoute(request("POST", "/api/v1/auth/login", { email, password }));
  expect(response.status).toBe(200);
  return cookieFrom(response);
}

const context = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DATABASE_PATH = databasePath;
  process.env.APP_ORIGIN = origin;
  process.env.SESSION_SECRET = "test-session-secret-at-least-thirty-two-characters";
  migrateDatabase(databasePath);
  const seed = spawnSync(resolve("node_modules/.bin/tsx"), ["scripts/seed.ts"], {
    cwd: resolve("."), encoding: "utf8", env: { ...process.env, DATABASE_PATH: databasePath },
  });
  if (seed.status !== 0) throw new Error(seed.stderr);
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe("security boundary", () => {
  it("uses Argon2id and verifies without exposing credentials", async () => {
    const encoded = await hashPassword("Strong-Password-2026!");
    expect(encoded).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(encoded, "Strong-Password-2026!")).toBe(true);
    expect(await verifyPassword(encoded, "wrong-password")).toBe(false);

    const invalidOrigin = await loginRoute(request("POST", "/api/v1/auth/login", {
      email: "admin@quansuviet.local", password: "Admin-Demo-2026!",
    }, undefined, "https://evil.test"));
    expect(invalidOrigin.status).toBe(403);

    const loginResponse = await loginRoute(request("POST", "/api/v1/auth/login", {
      email: "admin@quansuviet.local", password: "Admin-Demo-2026!",
    }));
    expect(loginResponse.status).toBe(200);
    const setCookie = loginResponse.headers.get("set-cookie")!;
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    const loginBody = await loginResponse.json();
    expect(JSON.stringify(loginBody)).not.toMatch(/password|token|secret/i);

    const cookie = setCookie.split(";", 1)[0];
    const me = await meRoute(request("GET", "/api/v1/auth/me", undefined, cookie));
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ data: { id: "user-admin", email: "admin@quansuviet.local", displayName: "Quản trị viên", role: "ADMIN" } });

    const [cookieName, cookiePayload] = cookie.split("=", 2);
    const midpoint = Math.floor(cookiePayload.length / 2);
    const tamperedCookie = `${cookieName}=${cookiePayload.slice(0, midpoint)}${cookiePayload[midpoint] === "a" ? "b" : "a"}${cookiePayload.slice(midpoint + 1)}`;
    const tampered = await meRoute(request("GET", "/api/v1/auth/me", undefined, tamperedCookie));
    expect(tampered.status).toBe(401);
    const badLogoutOrigin = await logoutRoute(request("POST", "/api/v1/auth/logout", undefined, cookie, "https://evil.test"));
    expect(badLogoutOrigin.status).toBe(403);
    const logout = await logoutRoute(request("POST", "/api/v1/auth/logout", undefined, cookie));
    expect(logout.status).toBe(200);
    expect((await meRoute(request("GET", "/api/v1/auth/me", undefined, cookie))).status).toBe(401);
  });

  it("persists login throttling in SQLite", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginRoute(request("POST", "/api/v1/auth/login", {
        email: "nobody@example.test", password: "Wrong-Password-2026!",
      }));
      expect(response.status).toBe(401);
    }
    const blocked = await loginRoute(request("POST", "/api/v1/auth/login", {
      email: "nobody@example.test", password: "Wrong-Password-2026!",
    }));
    expect(blocked.status).toBe(429);
    const database = new Database(databasePath, { readonly: true });
    expect(database.prepare("SELECT attempts FROM login_rate_limits WHERE bucket=?").get("email:nobody@example.test")).toEqual({ attempts: 5 });
    database.close();
  });
});

describe("RBAC and locale workflow", () => {
  it("denies wrong roles, protects last Admin, and publishes locales independently", async () => {
    const admin = await login("admin@quansuviet.local", "Admin-Demo-2026!");
    const editor = await login("editor@quansuviet.local", "Editor-Demo-2026!");
    const reviewer = await login("reviewer@quansuviet.local", "Reviewer-Demo-2026!");

    expect((await usersRoute(request("GET", "/api/v1/admin/users"))).status).toBe(401);
    expect((await createContentRoute(request("POST", "/api/v1/admin/contents", { type: "EVENT", sourceIds: [], translations: {} }, editor, "https://evil.test"))).status).toBe(403);
    const markup = await createContentRoute(request("POST", "/api/v1/admin/contents", {
      type: "EVENT", sourceIds: [], translations: { vi: {
        title: "<script>alert(1)</script>", slug: "unsafe", summary: "Tóm tắt", body: "Nội dung", seoTitle: "Unsafe", seoDescription: "Unsafe", translationStatus: "TRANSLATING",
      } },
    }, editor));
    expect(markup.status).toBe(400);

    const createdUser = await createUserRoute(request("POST", "/api/v1/admin/users", {
      email: "new-editor@example.test", displayName: "New Editor", role: "EDITOR", temporaryPassword: "New-Editor-Password-2026!",
    }, admin));
    expect(createdUser.status).toBe(201);
    const createdUserText = JSON.stringify(await createdUser.json());
    expect(createdUserText).toContain('"active":false');
    expect(createdUserText).not.toMatch(/password|hash|secret|token/i);

    expect((await usersRoute(request("GET", "/api/v1/admin/users", undefined, editor))).status).toBe(403);
    expect((await usersRoute(request("GET", "/api/v1/admin/users", undefined, reviewer))).status).toBe(403);
    expect((await createUserRoute(request("POST", "/api/v1/admin/users", {
      email: "blocked@example.test", displayName: "Blocked", role: "EDITOR", temporaryPassword: "Blocked-Password-2026!",
    }, editor))).status).toBe(403);
    expect((await approveRoute(request("POST", "/api/v1/admin/contents/missing/approve", { version: 1, locales: ["vi"] }, editor), context("missing"))).status).toBe(403);
    expect((await publishRoute(request("POST", "/api/v1/admin/contents/missing/publish", { version: 1, locales: ["vi"] }, editor), context("missing"))).status).toBe(403);

    const lastAdmin = await updateUserRoute(request("PATCH", "/api/v1/admin/users/user-admin", { version: 1, role: "EDITOR" }, admin), context("user-admin"));
    expect(lastAdmin.status).toBe(422);
    expect((await lastAdmin.json()).code).toBe("LAST_ADMIN_PROTECTED");

    const draftResponse = await createContentRoute(request("POST", "/api/v1/admin/contents", {
      type: "EVENT", sourceIds: [], translations: { vi: {
        title: "Nội dung kiểm chứng C-004", slug: "noi-dung-kiem-chung-c-004", summary: "Tóm tắt kiểm chứng.",
        body: "Nội dung biên tập có nguồn và workflow.", seoTitle: "Kiểm chứng C-004", seoDescription: "Mô tả kiểm chứng C-004.", translationStatus: "TRANSLATING",
      } },
    }, editor));
    expect(draftResponse.status).toBe(201);
    const draft = (await draftResponse.json()).data;

    const submitted = await submitRoute(request("POST", `/api/v1/admin/contents/${draft.id}/submit-review`, { version: 1, locales: ["vi"] }, editor), context(draft.id));
    expect(submitted.status).toBe(200);
    expect((await submitted.clone().json()).data.status).toBe("IN_REVIEW");

    const missingReason = await rejectRoute(request("POST", `/api/v1/admin/contents/${draft.id}/reject`, { version: 2, locales: ["vi"] }, reviewer), context(draft.id));
    expect(missingReason.status).toBe(400);
    const rejected = await rejectRoute(request("POST", `/api/v1/admin/contents/${draft.id}/reject`, { version: 2, locales: ["vi"], reason: "Cần bổ sung dẫn chứng." }, reviewer), context(draft.id));
    expect((await rejected.clone().json()).data.status).toBe("REJECTED");
    const resubmitted = await submitRoute(request("POST", `/api/v1/admin/contents/${draft.id}/submit-review`, { version: 3, locales: ["vi"] }, editor), context(draft.id));
    expect(resubmitted.status).toBe(200);
    const approved = await approveRoute(request("POST", `/api/v1/admin/contents/${draft.id}/approve`, { version: 4, locales: ["vi"] }, reviewer), context(draft.id));
    expect((await approved.clone().json()).data.status).toBe("APPROVED");

    const missingSource = await publishRoute(request("POST", `/api/v1/admin/contents/${draft.id}/publish`, { version: 5, locales: ["vi"] }, reviewer), context(draft.id));
    expect(missingSource.status).toBe(422);
    expect((await missingSource.json()).details.violations).toContain("content requires at least one source");
    expect(() => {
      const db = new Database(databasePath, { readonly: true });
      try { return getDetail(db, "vi", "EVENT", "noi-dung-kiem-chung-c-004"); } finally { db.close(); }
    }).toThrow();

    const patched = await updateContentRoute(request("PATCH", `/api/v1/admin/contents/${draft.id}`, { version: 5, sourceIds: ["source-event-dien-bien-phu"] }, editor), context(draft.id));
    expect(patched.status).toBe(200);
    const stale = await publishRoute(request("POST", `/api/v1/admin/contents/${draft.id}/publish`, { version: 5, locales: ["vi"] }, reviewer), context(draft.id));
    expect(stale.status).toBe(409);
    const publishedVi = await publishRoute(request("POST", `/api/v1/admin/contents/${draft.id}/publish`, { version: 6, locales: ["vi"] }, reviewer), context(draft.id));
    expect(publishedVi.status).toBe(200);

    let db = new Database(databasePath, { readonly: true });
    expect(getDetail(db, "vi", "EVENT", "noi-dung-kiem-chung-c-004").data.title).toBe("Nội dung kiểm chứng C-004");
    expect(getAlternate(db, draft.id, "vi").data.alternate).toBeNull();
    db.close();

    const english = await putTranslationRoute(request("PUT", `/api/v1/admin/contents/${draft.id}/translations/en`, {
      version: 0, title: "C-004 verification content", slug: "c-004-verification-content", summary: "Verification summary.",
      body: "Governed editorial content with a source.", seoTitle: "C-004 verification", seoDescription: "C-004 verification description.", translationStatus: "TRANSLATING",
    }, editor), { params: Promise.resolve({ id: draft.id as string, locale: "en" }) });
    expect(english.status).toBe(200);
    expect((await submitRoute(request("POST", `/api/v1/admin/contents/${draft.id}/submit-review`, { version: 8, locales: ["en"] }, editor), context(draft.id))).status).toBe(200);

    db = new Database(databasePath, { readonly: true });
    expect(getDetail(db, "vi", "EVENT", "noi-dung-kiem-chung-c-004").data.title).toBe("Nội dung kiểm chứng C-004");
    db.close();
    expect((await approveRoute(request("POST", `/api/v1/admin/contents/${draft.id}/approve`, { version: 9, locales: ["en"] }, reviewer), context(draft.id))).status).toBe(200);
    expect((await publishRoute(request("POST", `/api/v1/admin/contents/${draft.id}/publish`, { version: 10, locales: ["en"] }, reviewer), context(draft.id))).status).toBe(200);

    db = new Database(databasePath, { readonly: true });
    expect(getAlternate(db, draft.id, "vi").data.alternate?.locale).toBe("en");
    expect(getAlternate(db, draft.id, "en").data.alternate?.locale).toBe("vi");
    db.close();

    db = new Database(databasePath);
    db.prepare(`INSERT INTO media(id,url,kind,credit,license,alt_vi,alt_en,created_at,updated_at)
      VALUES('media-incomplete','https://example.test/incomplete','IMAGE','','','','',?,?)`).run(new Date().toISOString(),new Date().toISOString());
    db.close();
    const mediaDraftResponse = await createContentRoute(request("POST", "/api/v1/admin/contents", {
      type: "EVENT", sourceIds: ["source-event-dien-bien-phu"], mediaIds: ["media-incomplete"], translations: { vi: {
        title: "Media chưa đủ metadata", slug: "media-chua-du-metadata", summary: "Kiểm tra media.", body: "Nội dung kiểm tra media.",
        seoTitle: "Media metadata", seoDescription: "Kiểm tra credit license alt.", translationStatus: "TRANSLATING",
      } },
    }, editor));
    const mediaDraft = (await mediaDraftResponse.json()).data;
    expect((await submitRoute(request("POST", `/api/v1/admin/contents/${mediaDraft.id}/submit-review`, { version: 1, locales: ["vi"] }, editor), context(mediaDraft.id))).status).toBe(200);
    expect((await approveRoute(request("POST", `/api/v1/admin/contents/${mediaDraft.id}/approve`, { version: 2, locales: ["vi"] }, reviewer), context(mediaDraft.id))).status).toBe(200);
    const incompleteMedia = await publishRoute(request("POST", `/api/v1/admin/contents/${mediaDraft.id}/publish`, { version: 3, locales: ["vi"] }, reviewer), context(mediaDraft.id));
    expect(incompleteMedia.status).toBe(422);
    const mediaViolations = (await incompleteMedia.json()).details.violations as string[];
    expect(mediaViolations).toEqual(expect.arrayContaining(["media[0]: credit is required", "media[0]: license is required", "media[0]: alt vi is required"]));

    const audit = await auditRoute(request("GET", "/api/v1/admin/audit-logs?pageSize=100", undefined, admin));
    const auditText = JSON.stringify(await audit.json());
    expect(auditText).toContain("content.publish");
    expect(auditText).toContain("createdAt");
    expect(auditText).not.toMatch(/password_hash|session_secret|qsv_session|temporaryPassword/i);
  });

  it("documents every auth/admin endpoint without credential response fields", () => {
    const paths = Object.keys(openApiDocument.paths);
    for (const path of [
      "/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/me", "/api/v1/admin/dashboard",
      "/api/v1/admin/contents", "/api/v1/admin/contents/{id}", "/api/v1/admin/contents/{id}/translations/{locale}",
      "/api/v1/admin/sources", "/api/v1/admin/sources/{id}", "/api/v1/admin/media", "/api/v1/admin/media/{id}",
      "/api/v1/admin/contents/{id}/submit-review", "/api/v1/admin/contents/{id}/approve", "/api/v1/admin/contents/{id}/reject",
      "/api/v1/admin/contents/{id}/publish", "/api/v1/admin/contents/{id}/archive", "/api/v1/admin/users",
      "/api/v1/admin/users/{id}", "/api/v1/admin/audit-logs",
    ]) expect(paths).toContain(path);
    const authUser = JSON.stringify(openApiDocument.components.schemas.AuthUser);
    expect(authUser).not.toMatch(/password|token|secret/i);
    expect(openApiDocument.components.securitySchemes.cookieAuth).toEqual({ type: "apiKey", in: "cookie", name: "qsv_session" });
  });
});
