import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const output = resolve("artifacts/release/current-head-evidence.json");
const startedAt = new Date().toISOString();
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const steps = [];
function run(name, command, args, env = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: root, env: { ...process.env, ...env }, encoding: "utf8", timeout: 180000, maxBuffer: 32 * 1024 * 1024 });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  steps.push({ name, command: [command, ...args].join(" "), exitCode: result.status ?? 1, durationMs: Date.now() - started, outputSha256: createHash("sha256").update(output).digest("hex") });
  return result;
}
async function waitFor(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`server did not become healthy: ${url}`);
}
const quality = [run("lint", "npm", ["run", "lint"]), run("typecheck", "npm", ["run", "typecheck"]), run("test", "npm", ["test", "--", "--testTimeout=15000"]), run("build", "npm", ["run", "build"])];
const temporary = mkdtempSync(join(tmpdir(), "qsv-current-head-"));
const databasePath = join(temporary, "release.sqlite");
run("migrate", "npm", ["run", "db:migrate"], { DATABASE_PATH: databasePath });
run("seed", "npm", ["run", "db:seed"], { DATABASE_PATH: databasePath });
const backup = run("backup", process.execPath, ["scripts/backup.mjs"], { DATABASE_PATH: databasePath, BACKUP_DIR: join(temporary, "backups") });
let backupJson = null;
try { backupJson = JSON.parse(backup.stdout.trim()); } catch {}
const restoredPath = join(temporary, "restored.sqlite");
const restore = backupJson ? run("restore", process.execPath, ["scripts/restore.mjs", backupJson.snapshot], { RESTORE_DATABASE_PATH: restoredPath }) : null;
let restoreJson = null;
try { restoreJson = JSON.parse(restore?.stdout?.trim() || "{}"); } catch {}
const port = 3241;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server.js"], { cwd: resolve(".next/standalone"), env: { ...process.env, NODE_ENV: "production", DATABASE_PATH: databasePath, APP_ORIGIN: origin, SESSION_SECRET: "qsv-current-head-release-secret-32-characters", HOSTNAME: "127.0.0.1", PORT: String(port) }, stdio: "ignore" });
let local = { health: null, openapi: null, search: null, securityHeaders: false, p95SearchMs: null };
try {
  await waitFor(`${origin}/healthz`);
  const health = await fetch(`${origin}/healthz`); local.health = health.status;
  const openapi = await fetch(`${origin}/openapi.json`); local.openapi = openapi.status;
  const searchTimes = [];
  for (let index = 0; index < 10; index += 1) { const before = performance.now(); const response = await fetch(`${origin}/api/v1/vi/search?q=dien%20bien%20phu`); searchTimes.push(performance.now() - before); if (response.status !== 200) local.search = response.status; }
  local.search ??= 200;
  const sorted = searchTimes.sort((a, b) => a - b); local.p95SearchMs = sorted[Math.ceil(sorted.length * 0.95) - 1];
  const headers = (await fetch(`${origin}/vi`)).headers;
  local.securityHeaders = headers.get("content-security-policy")?.includes("frame-ancestors 'none'") && headers.get("x-content-type-options") === "nosniff" && headers.get("x-frame-options") === "DENY";
} finally { server.kill("SIGTERM"); rmSync(temporary, { recursive: true, force: true }); }
const report = { generatedAt: startedAt, commit, origin, originKind: "local production-like standalone; not official production", steps, local, backupRestore: { backupChecksum: Boolean(backupJson?.sha256), restoreChecksum: Boolean(restoreJson?.sha256Verified), databaseMutation: false }, httpsE2e: "NOT_RUN_IN_THIS_LOCAL_RUN", externalLimitations: ["official production domain", "90-day uptime", "independent pen-test", "real Council/pilot/rights/privacy approvals"] };
mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`); writeFileSync(output.replace(/\.json$/, ".md"), `# Current HEAD release evidence\n\n- Commit: ${commit}\n- Origin: ${origin} (local production-like; not official)\n- Quality: ${steps.filter((step) => ["lint", "typecheck", "test", "build"].includes(step.name) && step.exitCode === 0).length}/4 PASS\n- Health/OpenAPI/Search: ${local.health}/${local.openapi}/${local.search}\n- Search p95 (10 samples): ${Math.round(local.p95SearchMs ?? 0)}ms\n- Security headers: ${local.securityHeaders ? "PASS" : "FAIL"}\n- Backup checksum/restore: ${report.backupRestore.backupChecksum}/${report.backupRestore.restoreChecksum}\n- HTTPS E2E: **NOT RUN IN THIS LOCAL RUN**\n- External gates: **PENDING**\n`);
process.stdout.write(`${JSON.stringify({ commit, quality: steps.slice(0, 4).map((step) => step.exitCode), local, backupRestore: report.backupRestore })}\n`);
