import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const input = resolve(option("--input", "artifacts/media-rights/ledger.json"));
const output = resolve(option("--output", "artifacts/media-rights/report.json"));
const records = JSON.parse(readFileSync(input, "utf8"));
const binaryAllowed = new Set(["PERMITTED", "PUBLIC_DOMAIN"]);
const required = ["id", "rightsStatus", "sourceUrl", "sourceRevision", "takedownContact", "takedownSlaHours", "owner", "changelogRef"];
const checks = records.map((record) => {
  const serving = binaryAllowed.has(record.rightsStatus);
  const fields = serving ? [...required, "licenseUrl", "creditLine", "inputChecksum", "derivativeChecksum", "transform"] : required;
  const missing = fields.filter((key) => record[key] === undefined || record[key] === null || String(record[key]).trim() === "");
  const activeTakedown = record.takedownStatus === "ACTIVE";
  const passed = missing.length === 0 && !activeTakedown;
  return { id: record.id, rightsStatus: record.rightsStatus, takedownStatus: record.takedownStatus, passed, binaryAllowed: passed && serving, missing, remediation: passed ? null : activeTakedown ? "Keep binary blocked until takedown review is resolved and changelogged." : "Complete derivative, credit, source and owner fields before serving." };
});
const report = { generatedAt: new Date().toISOString(), input, status: checks.length > 0 && checks.every((item) => item.passed) ? "PASS" : "FAIL", checks };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
const markdown = [`# Media rights check`, ``, `- Input: ${input}`, `- Status: **${report.status}**`, `- Generated: ${report.generatedAt}`, ``, `| Asset | Rights | Takedown | Binary | Result | Missing |`, `|---|---|---|---|---|---|`, ...checks.map((item) => `| ${item.id} | ${item.rightsStatus} | ${item.takedownStatus} | ${item.binaryAllowed ? "YES" : "NO"} | ${item.passed ? "PASS" : "FAIL"} | ${item.missing.join(", ") || "—"} |`), ``].join("\n");
writeFileSync(output.replace(/\.json$/, ".md"), `${markdown}\n`);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== "PASS") process.exitCode = 1;
