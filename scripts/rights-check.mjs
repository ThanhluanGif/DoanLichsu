import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const input = resolve(option("--input", "artifacts/rights/ledger.json"));
const output = resolve(option("--output", "artifacts/rights/report.json"));
const records = JSON.parse(readFileSync(input, "utf8"));
const served = new Set(["PERMITTED", "PUBLIC_DOMAIN"]);
const common = ["id", "provider", "sourceUrl", "rightsStatus", "reviewer", "decidedAt", "recheckAt", "takedownContact"];
const servedFields = ["licenseShortName", "licenseUrl", "creditLine"];
const checks = records.map((record) => {
  const required = [...common, ...(served.has(record.rightsStatus) ? servedFields : [])];
  const missing = required.filter((key) => record[key] === undefined || record[key] === null || String(record[key]).trim() === "");
  const statusKnown = ["PERMITTED", "PUBLIC_DOMAIN", "LINK_ONLY", "BLOCKED", "PENDING_REVIEW"].includes(record.rightsStatus);
  const passed = statusKnown && missing.length === 0;
  return { id: record.id, rightsStatus: record.rightsStatus, passed, missing, publicBinaryAllowed: passed && served.has(record.rightsStatus), remediation: passed ? null : "Add a verifiable rights decision or use LINK_ONLY/BLOCKED; do not serve binary." };
});
const report = { generatedAt: new Date().toISOString(), input, status: checks.length > 0 && checks.every((check) => check.passed) ? "PASS" : "FAIL", records: checks };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
const markdown = [`# Rights ledger check`, ``, `- Input: ${input}`, `- Status: **${report.status}**`, `- Generated: ${report.generatedAt}`, ``, `| Asset | Decision | Binary | Result | Missing |`, `|---|---|---|---|---|`, ...checks.map((check) => `| ${check.id} | ${check.rightsStatus} | ${check.publicBinaryAllowed ? "YES" : "NO"} | ${check.passed ? "PASS" : "FAIL"} | ${check.missing.join(", ") || "—"} |`), ``].join("\n");
writeFileSync(output.replace(/\.json$/, ".md"), `${markdown}\n`);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== "PASS") process.exitCode = 1;
