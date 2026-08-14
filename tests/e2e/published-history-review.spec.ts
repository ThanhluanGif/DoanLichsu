import { expect, test } from "@playwright/test";
import { login, releaseOrigin } from "./support";

test("reviewer can attest published history through the browser surface", async ({ browser }) => {
  if (process.env.E2E_DISPOSABLE_RELEASE !== "1") {
    throw new Error("Set E2E_DISPOSABLE_RELEASE=1; this journey writes only to a disposable release database.");
  }

  const contentId = process.env.E2E_HISTORY_CONTENT_ID ?? "artifact-bach-dang-stakes";
  const origin = releaseOrigin();
  const evidenceLocator = `https://example.test/history-review/${Date.now().toString(36)}`;
  const note = "Đối chiếu nguồn và lịch sử biên tập trong môi trường release dùng cho kiểm thử.";

  const editorContext = await browser.newContext({ baseURL: origin });
  const editor = await editorContext.newPage();
  await login(editor, "EDITOR");
  const editorAttempt = await editor.evaluate(async ({ id, appOrigin }) => {
    const detail = await fetch(`/api/v1/admin/contents/${id}`, { credentials: "same-origin" }).then((response) => response.json());
    return fetch(`/api/v1/admin/contents/${id}/history-review`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", origin: appOrigin },
      body: JSON.stringify({ version: detail.data.version, evidenceLocator: "https://example.test/editor-denied", note: "editor must be denied", attestation: "HUMAN_REVIEWED" }),
    }).then(async (response) => ({ status: response.status, body: await response.json() }));
  }, { id: contentId, appOrigin: origin });
  expect(editorAttempt.status).toBe(403);

  const reviewerContext = await browser.newContext({ baseURL: origin });
  const reviewer = await reviewerContext.newPage();
  await login(reviewer, "REVIEWER");
  await reviewer.goto(`/admin/contents/${contentId}`);
  await expect(reviewer.getByRole("heading", { name: "Xác nhận lịch sử biên tập", exact: true })).toBeVisible();
  await reviewer.getByLabel("Evidence locator", { exact: true }).fill(evidenceLocator);
  await reviewer.getByLabel("Ghi chú đối chiếu", { exact: true }).fill(note);
  await reviewer.getByRole("checkbox", { name: /Tôi xác nhận HUMAN_REVIEWED/ }).check();
  await reviewer.getByRole("button", { name: "Ghi nhận xác nhận lịch sử", exact: true }).click();
  await expect(reviewer.locator("p.success-alert").filter({ hasText: "Đã ghi nhận xác nhận lịch sử bởi người duyệt." })).toBeVisible();

  const queue = await reviewer.evaluate(async ({ id }) => {
    const response = await fetch("/api/v1/admin/published-history?page=1&pageSize=100", { credentials: "same-origin" });
    return { status: response.status, body: await response.json(), id };
  }, { id: contentId });
  expect(queue.status).toBe(200);
  expect(queue.body.data.some((item: { id: string }) => item.id === contentId)).toBe(false);

  const duplicate = await reviewer.evaluate(async ({ id, appOrigin }) => {
    const detail = await fetch(`/api/v1/admin/contents/${id}`, { credentials: "same-origin" }).then((response) => response.json());
    return fetch(`/api/v1/admin/contents/${id}/history-review`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", origin: appOrigin },
      body: JSON.stringify({ version: detail.data.version, evidenceLocator: "https://example.test/history-review/duplicate", note: "duplicate must be rejected", attestation: "HUMAN_REVIEWED" }),
    }).then(async (response) => ({ status: response.status, body: await response.json() }));
  }, { id: contentId, appOrigin: origin });
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.code).toBe("HISTORY_ALREADY_REVIEWED");

  await editorContext.close();
  await reviewerContext.close();
});
