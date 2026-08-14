import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const rawOrigin = option("--origin", process.env.E2E_BASE_URL || process.env.APP_ORIGIN);
if (!rawOrigin) throw new Error("--origin HTTPS URL is required");
const origin = new URL(rawOrigin);
if (origin.protocol !== "https:") throw new Error("uptime probe requires an HTTPS origin");
const count = Number(option("--count", "1"));
const intervalMs = Number(option("--interval-ms", "1000"));
const output = resolve(option("--output", "artifacts/operations/uptime-observations.json"));
if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error("--count must be an integer between 1 and 1000");
if (!Number.isFinite(intervalMs) || intervalMs < 0 || intervalMs > 86_400_000) throw new Error("--interval-ms must be between 0 and 86400000");

const checks = [
  ["healthz", "/healthz", (body) => body?.status === "ok" && body?.database === "ok"],
  ["openapi", "/openapi.json", (body) => typeof body?.openapi === "string" && Boolean(body?.paths)],
];
const startedAt = new Date().toISOString();
const observations = [];
for (let sample = 1; sample <= count; sample += 1) {
  const sampleStartedAt = new Date().toISOString();
  const checksResult = [];
  for (const [name, path, predicate] of checks) {
    const started = performance.now();
    try {
      const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
      const text = await response.text();
      const contentType = response.headers.get("content-type") ?? "";
      let body;
      try { body = JSON.parse(text); } catch { body = null; }
      checksResult.push({ name, path, status: response.status, contentType, latencyMs: Math.round(performance.now() - started), passed: response.ok && contentType.includes("application/json") && predicate(body) });
    } catch (error) {
      checksResult.push({ name, path, status: null, contentType: null, latencyMs: Math.round(performance.now() - started), passed: false, error: String(error) });
    }
  }
  observations.push({ sample, observedAt: sampleStartedAt, passed: checksResult.every((check) => check.passed), checks: checksResult });
  if (sample < count && intervalMs > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
}
const passed = observations.filter((observation) => observation.passed).length;
const report = {
  version: "uptime-observation-v1",
  generatedAt: startedAt,
  origin: origin.origin,
  observationWindow: { startedAt, endedAt: new Date().toISOString(), samples: observations.length },
  availabilityRatio: observations.length ? passed / observations.length : 0,
  passedSamples: passed,
  failedSamples: observations.length - passed,
  officialProductionEvidence: false,
  ninetyDayEvidence: false,
  status: passed === observations.length ? "PASS_OBSERVATION" : "FAIL_OBSERVATION",
  observations,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# HTTPS uptime observations\n\n- Origin: ${report.origin}\n- Status: **${report.status}**\n- Samples: ${report.passedSamples}/${observations.length}\n- Availability ratio: ${report.availabilityRatio}\n- Official production evidence: **NO**\n- 90-day evidence: **NO**\n- Observation window: ${report.observationWindow.startedAt} → ${report.observationWindow.endedAt}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, samples: observations.length, passedSamples: passed, availabilityRatio: report.availabilityRatio, officialProductionEvidence: false, ninetyDayEvidence: false })}\n`);
if (report.status !== "PASS_OBSERVATION") process.exitCode = 1;
