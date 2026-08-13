import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const rawOrigin = option("--origin", process.env.E2E_BASE_URL || process.env.APP_ORIGIN);
if (!rawOrigin) throw new Error("--origin HTTPS URL is required");
const origin = new URL(rawOrigin);
if (origin.protocol !== "https:") throw new Error("performance probe requires an HTTPS origin");
const requests = Number(option("--requests", "25"));
const concurrency = Number(option("--concurrency", "4"));
const output = resolve(option("--output", "artifacts/operations/performance-observations.json"));
if (!Number.isInteger(requests) || requests < 1 || requests > 1000) throw new Error("--requests must be an integer between 1 and 1000");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 50) throw new Error("--concurrency must be an integer between 1 and 50");
const paths = ["/healthz", "/api/v1/vi/search?q=dien%20bien%20phu&pageSize=20"];
const queue = Array.from({ length: requests }, (_, index) => paths[index % paths.length]);
const observations = [];
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const index = cursor++;
    const path = queue[index];
    const started = performance.now();
    try {
      const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
      const text = await response.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      observations[index] = { index: index + 1, path, status: response.status, latencyMs: Math.round(performance.now() - started), passed: response.ok && response.headers.get("content-type")?.includes("application/json") === true && parsed !== null };
    } catch (error) {
      observations[index] = { index: index + 1, path, status: null, latencyMs: Math.round(performance.now() - started), passed: false, error: String(error) };
    }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, () => worker()));
const latencies = observations.map((observation) => observation.latencyMs).sort((a, b) => a - b);
const percentile = (ratio) => latencies[Math.max(0, Math.ceil(latencies.length * ratio) - 1)] ?? null;
const passed = observations.filter((observation) => observation.passed).length;
const report = { version: "performance-observation-v1", generatedAt: new Date().toISOString(), origin: origin.origin, requests, concurrency: Math.min(concurrency, requests), paths, samples: observations.length, passed, failed: observations.length - passed, latencyMs: { p50: percentile(0.5), p95: percentile(0.95), max: latencies.at(-1) ?? null }, budgets: { p95Ms: 1000 }, status: passed === observations.length && (percentile(0.95) ?? Infinity) <= 1000 ? "PASS_OBSERVATION" : "FAIL_OBSERVATION", officialLoadEvidence: false, officialProductionEvidence: false, observations };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# HTTPS performance observations\n\n- Origin: ${report.origin}\n- Status: **${report.status}**\n- Samples: ${report.passed}/${report.samples}\n- Concurrency: ${report.concurrency}\n- p50/p95/max: ${report.latencyMs.p50}/${report.latencyMs.p95}/${report.latencyMs.max} ms\n- Official load evidence: **NO**\n- Official production evidence: **NO**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, samples: report.samples, passed: report.passed, p95Ms: report.latencyMs.p95, officialLoadEvidence: false })}\n`);
if (report.status !== "PASS_OBSERVATION") process.exitCode = 1;
