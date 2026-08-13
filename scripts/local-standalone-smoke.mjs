import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const databasePath = resolve(process.env.DATABASE_PATH || "data/quan-su-viet.db");
const port = Number(process.env.PORT || 3298);
const origin = `http://127.0.0.1:${port}`;
const output = resolve(process.env.OUTPUT || "artifacts/operations/local-standalone-smoke.json");
if (!existsSync(databasePath)) throw new Error(`database does not exist: ${databasePath}`);
if (!databasePath.startsWith("/")) throw new Error("database path must be absolute");
const child = spawn(process.execPath, ["server.js"], { cwd: resolve(root, ".next/standalone"), env: { ...process.env, NODE_ENV: "production", DATABASE_PATH: databasePath, APP_ORIGIN: origin, SESSION_SECRET: "local-standalone-smoke-secret-32-characters", HOSTNAME: "127.0.0.1", PORT: String(port) }, stdio: "ignore" });
const waitForHealth = async () => { for (let i = 0; i < 80; i += 1) { try { const response = await fetch(`${origin}/healthz`); if (response.ok) return; } catch {} await new Promise((resolveWait) => setTimeout(resolveWait, 100)); } throw new Error("standalone health timeout"); };
const checks = [
  ["home-vi", "/vi", 200, (text) => text.includes("<!DOCTYPE html>")],
  ["home-en", "/en", 200, (text) => text.includes("<!DOCTYPE html>")],
  ["privacy-vi", "/vi/privacy", 200, (text) => text.includes("DRAFT_PENDING_PRIVACY_REVIEW")],
  ["transparency-vi", "/vi/transparency", 200, (text) => text.includes("Minh bạch") || text.includes("Transparency")],
  ["sitemap", "/sitemap.xml", 200, (text) => text.includes("/vi/privacy")],
  ["health", "/healthz", 200, (text) => JSON.parse(text).database === "ok"],
  ["openapi", "/openapi.json", 200, (text) => Boolean(JSON.parse(text).paths)],
  ["search", "/api/v1/vi/search?q=dien%20bien%20phu", 200, (text) => Array.isArray(JSON.parse(text).data)],
  ["ai-disabled", "/api/v1/vi/ai/answer", 403, (text) => JSON.parse(text).code === "AI_BETA_DISABLED"],
];
try {
  await waitForHealth();
  const results = [];
  for (const [name, path, expectedStatus, predicate] of checks) { const isAi = name === "ai-disabled"; const response = await fetch(`${origin}${path}`, { method: isAi ? "POST" : "GET", headers: isAi ? { "content-type": "application/json" } : {}, body: isAi ? JSON.stringify({ question: "Lịch sử Điện Biên Phủ là gì?" }) : undefined }); const text = await response.text(); let passed = response.status === expectedStatus; try { passed = passed && predicate(text); } catch { passed = false; } results.push({ name, path, status: response.status, bytes: Buffer.byteLength(text), passed }); }
  const report = { version: "local-standalone-smoke-v1", generatedAt: new Date().toISOString(), origin, originKind: "local production-like standalone; not official production", databasePath, databasePathAbsolute: true, status: results.every((result) => result.passed) ? "PASS_LOCAL_ONLY" : "FAIL", publicBeta: false, aiPublic: "DISABLED", checks: results, externalLimitations: ["official HTTPS production", "90-day uptime", "independent security", "real pilot", "Council/DPIA/rights approvals"] };
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`); writeFileSync(output.replace(/\.json$/, ".md"), `# Local standalone smoke\n\n- Status: **${report.status}**\n- Origin: ${origin} (local production-like; not official)\n- Database: ${databasePath}\n- Public Beta: **DISABLED**\n- AI: **403 AI_BETA_DISABLED**\n- Checks: ${results.filter((result) => result.passed).length}/${results.length}\n`); process.stdout.write(`${JSON.stringify({ status: report.status, checks: results.length, passed: results.filter((result) => result.passed).length, publicBeta: false })}\n`); if (report.status !== "PASS_LOCAL_ONLY") process.exitCode = 1;
} finally { child.kill("SIGTERM"); }
