import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as answerRoute } from "@/app/api/v1/[locale]/ai/answer/route";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { join, resolve } from "node:path";

const origin = "https://alpha.quansuviet.test";
const directory = mkdtempSync(join(tmpdir(), "qsv-ai-answer-route-"));
const databasePath = path.join(directory, "route.db");
function request(method: string, url: string, body?: unknown, cookie?: string) {
  const headers = new Headers({ Origin: origin });
  if (body !== undefined) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);
  return new Request(`${origin}${url}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function login() {
  const response = await loginRoute(request("POST", "/api/v1/auth/login", { email: "reviewer@quansuviet.local", password: "Reviewer-Demo-2026!" }));
  return response.headers.get("set-cookie")!.split(";", 1)[0];
}

describe("internal alpha AI route", () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = databasePath;
    process.env.APP_ORIGIN = origin;
    process.env.SESSION_SECRET = "ai-answer-route-test-session-secret-at-least-32";
    process.env.AI_INTERNAL_ALPHA = "1";
    rmSync(databasePath, { force: true });
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
  });

  afterAll(() => rmSync(directory, { recursive: true, force: true }));

  it("rejects a spoofed header without an authenticated session", async () => {
    const response = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: JSON.stringify({ question: "Vì sao cần học lịch sử?" }) }), { params: Promise.resolve({ locale: "vi" }) });
    expect(response.status).toBe(401);
  });

  it("requires both alpha header and session, then preserves lesson context", async () => {
    const cookie = await login();
    const missingHeader = await answerRoute(request("POST", "/api/v1/vi/ai/answer", { question: "Vì sao cần học lịch sử?" }, cookie), { params: Promise.resolve({ locale: "vi" }) });
    expect(missingHeader.status).toBe(403);
    const response = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, Cookie: cookie, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: JSON.stringify({ question: "54 dân tộc", contextSlug: "cong-dong-cac-dan-toc-viet-nam-da-dang-thong-nhat-va-cung-kien-tao" }) }), { params: Promise.resolve({ locale: "vi" }) });
    expect(response.status).toBe(200);
    const payload = await response.json() as { data: { data: { suggestedNext: Array<{ slug?: string }>; citations: unknown[] } } };
    expect(payload.data.data.suggestedNext[0]?.slug).toBe("cong-dong-cac-dan-toc-viet-nam-da-dang-thong-nhat-va-cung-kien-tao");
    expect(payload.data.data.citations.length).toBeGreaterThan(0);
  });

  it("rejects malformed and overlong requests before corpus access", async () => {
    const cookie = await login();
    const malformed = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, Cookie: cookie, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: JSON.stringify({ question: "" }) }), { params: Promise.resolve({ locale: "vi" }) });
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).code).toBe("INVALID_AI_REQUEST");
    const oversized = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, Cookie: cookie, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: JSON.stringify({ question: "x".repeat(2001) }) }), { params: Promise.resolve({ locale: "vi" }) });
    expect(oversized.status).toBe(400);
    const invalidContext = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, Cookie: cookie, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: JSON.stringify({ question: "lịch sử", contextSlug: "x".repeat(201) }) }), { params: Promise.resolve({ locale: "vi" }) });
    expect(invalidContext.status).toBe(400);
  });

  it("rejects malformed JSON without persisting a transcript", async () => {
    const cookie = await login();
    const response = await answerRoute(new Request(`${origin}/api/v1/vi/ai/answer`, { method: "POST", headers: new Headers({ Origin: origin, Cookie: cookie, "x-qsv-ai-alpha": "internal", "Content-Type": "application/json" }), body: "{" }), { params: Promise.resolve({ locale: "vi" }) });
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_AI_REQUEST");
  });
});
