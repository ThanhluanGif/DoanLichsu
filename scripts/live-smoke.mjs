import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const rawOrigin = option("--origin", process.env.APP_ORIGIN);
const output = option("--output", "artifacts/staging-smoke/report.json");
if (!rawOrigin) throw new Error("--origin HTTPS URL is required");
const origin = new URL(rawOrigin);
if (origin.protocol !== "https:") throw new Error("live smoke requires HTTPS");
const checks = [
  ["healthz", "/healthz", "application/json", (body) => body.status === "ok" && body.database === "ok"],
  ["openapi", "/openapi.json", "application/json", (body) => Boolean(body.openapi && body.paths)],
  ["places-vi", "/api/v1/vi/places?pageSize=50", "application/json", (body) => body.meta?.total >= 1 && Array.isArray(body.data)],
  ["places-en", "/api/v1/en/places?pageSize=50", "application/json", (body) => body.meta?.total >= 1 && Array.isArray(body.data)],
  ["reconstruction-vi", "/api/v1/vi/reconstructions/bach-dang-1288", "application/json", (body) => body.data?.label === "EDUCATIONAL_RECONSTRUCTION" && body.data?.phases?.length >= 3],
  ["map-vi", "/vi/ban-do", "text/html", (body) => body.includes("Bản đồ địa danh lịch sử") && body.includes("danh sách HTML")],
  ["transparency-vi", "/vi/nguon-va-kiem-chung", "text/html", (body) => body.includes("Chương trình và bằng chứng")],
];
const startedAt = new Date().toISOString();
const results = [];
for (const [name, path, expectedType, predicate] of checks) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000), headers: { accept: expectedType } });
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const body = expectedType === "application/json" ? JSON.parse(text) : text;
    const passed = response.ok && contentType.includes(expectedType) && predicate(body);
    results.push({ name, path, status: response.status, contentType, latencyMs: Math.round(performance.now() - started), passed, remediation: passed ? null : "Check deploy health, database, route, content-type or release configuration." });
  } catch (error) { results.push({ name, path, status: null, contentType: null, latencyMs: Math.round(performance.now() - started), passed: false, remediation: String(error) }); }
}
const report = { generatedAt: startedAt, origin: origin.origin, status: results.every((result) => result.passed) ? "PASS" : "FAIL", checks: results };
mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(resolve(output), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [`# Staging smoke report`, ``, `- Origin: ${origin.origin}`, `- Status: **${report.status}**`, `- Generated: ${startedAt}`, ``, `| Check | HTTP | Type | Latency | Result |`, `|---|---:|---|---:|---|`, ...results.map((result) => `| ${result.name} | ${result.status ?? "—"} | ${result.contentType ?? "—"} | ${result.latencyMs}ms | ${result.passed ? "PASS" : `FAIL — ${result.remediation}`} |`), ``].join("\n");
writeFileSync(resolve(output.replace(/\.json$/, ".md")), `${markdown}\n`);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== "PASS") process.exitCode = 1;
