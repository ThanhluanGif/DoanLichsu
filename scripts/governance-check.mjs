import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const root = resolve(option("--root", "docs/governance"));
const output = resolve(option("--output", "artifacts/governance/report.json"));
const required = [
  ["editorial-charter", "editorial-charter.md", ["DRAFT_PENDING_COUNCIL_SIGNOFF", "DRAFT", "VERIFIED", "PUBLISHED", "Corrections are traceable", "sensitive"]],
  ["source-rights", "source-rights-policy.md", ["T1", "T4", "Wikimedia", "LINK_ONLY", "takedown"]],
  ["sensitive-topic", "sensitive-topic-policy.md", ["Sensitive", "two independent reviewers", "PENDING_COUNCIL_SIGNOFF", "AI may never"]],
  ["correction", "correction-policy.md", ["RECEIVED", "TRIAGED", "three business days", "public changelog"]],
  ["raci", "raci.md", ["Responsible", "Accountable", "Chief Historian", "pending"]],
];
const checks = [];
for (const [name, file, markers] of required) {
  const path = resolve(root, file);
  let passed = existsSync(path);
  let missing = [];
  if (passed) {
    const content = readFileSync(path, "utf8");
    missing = markers.filter((marker) => !content.toLowerCase().includes(marker.toLowerCase()));
    passed = missing.length === 0;
  }
  checks.push({ name, file: path, passed, missing, remediation: passed ? null : "Restore the missing governance control and rerun the check." });
}
const content = required.flatMap(([, file]) => {
  const path = resolve(root, file);
  return existsSync(path) ? [readFileSync(path, "utf8")] : [];
}).join("\n");
const controls = [
  ["council-signoff-is-explicitly-pending", content.includes("DRAFT_PENDING_COUNCIL_SIGNOFF")],
  ["dual-review-required", /two independent reviewers/i.test(content)],
  ["ai-cannot-arbitrate-sensitive-disputes", /may never decide|AI may never arbitrate/i.test(content)],
  ["rights-unclear-link-only", /LINK_ONLY/i.test(content)],
  ["correction-sla", /three business days/i.test(content)],
];
for (const [name, passed] of controls) checks.push({ name, passed, missing: passed ? [] : [name], remediation: passed ? null : "Add the mandatory governance control." });
const report = { generatedAt: new Date().toISOString(), root, status: checks.every((check) => check.passed) ? "PASS" : "FAIL", checks };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
const markdown = [`# Governance check`, ``, `- Root: ${root}`, `- Status: **${report.status}**`, `- Generated: ${report.generatedAt}`, ``, `| Control | Result | Missing |`, `|---|---|---|`, ...checks.map((check) => `| ${check.name} | ${check.passed ? "PASS" : "FAIL"} | ${check.missing?.join(", ") || "—"} |`), ``].join("\n");
writeFileSync(output.replace(/\.json$/, ".md"), `${markdown}\n`);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== "PASS") process.exitCode = 1;
