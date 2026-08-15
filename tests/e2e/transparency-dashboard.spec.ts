import { expect, test } from "@playwright/test";

test("public transparency dashboard keeps release blockers visible", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("baseURL is required");
  await page.goto(`${baseURL}/vi/minh-bach`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Minh bạch về phạm vi, nguồn và AI", exact: true })).toBeVisible();
  await expect(page.getByText("NOT_READY", { exact: true })).toBeVisible();
  await expect(page.getByText("500/500", { exact: true })).toBeVisible();
  await expect(page.getByText("300", { exact: true })).toBeVisible();
  await expect(page.getByText("PASS_MACHINE_COMPARISON", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blocker trước Public Beta", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bằng chứng còn cần trước Public Beta", exact: true })).toBeVisible();
  const firstGate = page.locator("details.transparency-gate").first();
  await firstGate.locator("summary").click();
  await expect(firstGate).toContainText("Người phụ trách vận hành");
  await expect(firstGate).toContainText("Tên miền HTTPS cố định");
  await expect(firstGate).toContainText("không tự phê duyệt");
  await expect(page.getByText(/không phải là sự chứng thực/i)).toBeVisible();
  await page.getByRole("link", { name: "Chuyển sang tiếng Anh" }).click();
  await expect(page).toHaveURL(`${baseURL}/en/transparency`);
  await expect(page.getByRole("heading", { name: "Transparency about scope, sources, and AI", exact: true })).toBeVisible();
  await expect(page.getByText("Public Beta blockers", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence still needed before Public Beta", exact: true })).toBeVisible();
});
