import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

async function blockingAxe(page: Page) { await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" }); return page.evaluate(async () => { const axe = (window as unknown as { axe: { run: (root: Document, options: unknown) => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe; const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } }); return result.violations.filter(({ impact }) => impact === "critical" || impact === "serious"); }); }
async function metrics(page: Page) { return page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, lcpMs: (globalThis as typeof globalThis & { __mapLcp?: number }).__mapLcp ?? performance.getEntriesByType("largest-contentful-paint").at(-1)?.startTime ?? 0 })); }

test.describe("historical map", () => {
  test("desktop map supports filter, keyboard marker, detail links and fallback narrative", async ({ page }) => {
    await page.addInitScript(() => { new PerformanceObserver((list) => { const entry = list.getEntries().at(-1) as PerformanceEventTiming | undefined; if (entry) (globalThis as typeof globalThis & { __mapLcp?: number }).__mapLcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); });
    await page.goto("/vi/ban-do");
    await expect(page.getByRole("heading", { level: 1, name: "Bản đồ địa danh lịch sử" })).toBeVisible();
    await expect(page.getByTestId("historical-map")).toBeVisible();
    await expect(page.getByText("Sông Bạch Đằng", { exact: true })).toBeVisible();
    await page.getByLabel("Tìm địa danh").fill("Điện Biên");
    await page.getByRole("button", { name: "Lọc bản đồ" }).click();
    await expect(page).toHaveURL(/q=(?:%C4%90i%E1%BB%87n\+Bi%C3%AAn|%C4%90i%E1%BB%87n%20Bi%C3%AAn)/);
    await expect(page.getByText("Điện Biên Phủ", { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: /Điện Biên Phủ — Điểm tham chiếu/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#place-dien-bien-phu")).toBeVisible();
    await expect(page.locator("#place-dien-bien-phu").getByRole("link").first()).toHaveAttribute("href", /su-kien|events/);
    await expect(page.locator(".map-fallback-note")).toContainText("danh sách HTML");
    await page.waitForTimeout(300);
    const desktopAxe = await blockingAxe(page); const desktopMetrics = await metrics(page);
    expect(desktopAxe).toEqual([]); expect(desktopMetrics.scrollWidth).toBe(desktopMetrics.clientWidth); expect(desktopMetrics.lcpMs).toBeLessThanOrEqual(2500);
    await mkdir("artifacts/historical-map", { recursive: true }); await page.screenshot({ path: "artifacts/historical-map/map-desktop.png", fullPage: true });
    await writeFile("artifacts/historical-map/map-desktop-metrics.json", `${JSON.stringify({ axeCriticalOrSerious: desktopAxe.length, ...desktopMetrics }, null, 2)}\n`);
  });

  test("mobile approximate filter keeps page within viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/ban-do?precision=APPROXIMATE");
    await expect(page.getByRole("heading", { level: 1, name: "Historical places map" })).toBeVisible();
    await expect(page.locator(".precision-chip.approximate").first()).toContainText("Approximate location");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await page.screenshot({ path: "artifacts/historical-map/map-mobile.png", fullPage: true });
  });

  test("HTML response includes the no-WebGL narrative fallback", async ({ request }) => {
    const response = await request.get("/vi/ban-do?precision=APPROXIMATE");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("danh sách HTML dưới đây");
    expect(html).toContain("Sơ đồ định vị giáo dục");
    expect(html).not.toMatch(/WebGL|canvas|leaflet|mapbox|openstreetmap/i);
  });
});
