import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "artifacts/operations/external-evidence-ledger.json"));
const output = resolve(option("--output", "artifacts/operations/external-evidence-verification.json"));
const root = resolve(".");
const requiredIds = ["official-production", "uptime-90-day", "council-signoff", "ai-golden-human-approval", "model-comparison", "dpia-approval", "partner-rights", "real-pilot", "school-university-reach", "independent-security", "named-operations"];
const allowedStatuses = new Set(["PENDING", "PASS", "REJECTED"]);
const ledger = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (ledger.status !== "PENDING_EXTERNAL_EVIDENCE" && ledger.status !== "READY") errors.push("INVALID_LEDGER_STATUS");
if (ledger.fabricatedPersonalData !== false) errors.push("FABRICATED_PERSONAL_DATA_FLAG_MUST_BE_FALSE");
const items = Array.isArray(ledger.items) ? ledger.items : [];
if (items.length !== requiredIds.length) errors.push("GATE_COUNT_MISMATCH");
if (new Set(items.map((item) => item.id)).size !== items.length) errors.push("DUPLICATE_GATE_ID");
for (const id of requiredIds) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) { errors.push(`${id}:MISSING_GATE`); continue; }
  if (!allowedStatuses.has(item.status)) errors.push(`${id}:INVALID_STATUS`);
  if (item.status === "PASS") {
    if (!item.owner || !item.artifact || !item.sha256) errors.push(`${id}:PASS_REQUIRES_OWNER_ARTIFACT_SHA256`);
    if (item.artifact && (!item.artifact.startsWith("artifacts/") || item.artifact.includes(".."))) errors.push(`${id}:ARTIFACT_PATH_NOT_REPOSITORY_RELATIVE`);
    if (item.artifact && item.sha256 && existsSync(resolve(item.artifact))) {
      const actual = createHash("sha256").update(readFileSync(resolve(item.artifact))).digest("hex");
      if (actual !== item.sha256) errors.push(`${id}:ARTIFACT_SHA256_MISMATCH`);
    } else if (item.status === "PASS") errors.push(`${id}:ARTIFACT_MISSING`);
  }
}
const pending = items.filter((item) => item.status === "PENDING").map((item) => item.id);
const report = { version: "external-evidence-verification-v1", generatedAt: new Date().toISOString(), input: relative(root, input), status: errors.length ? "FAIL" : "PASS_LEDGER_VALID", releaseAllowed: errors.length === 0 && pending.length === 0, pending, errors, noFabricatedEvidence: ledger.fabricatedPersonalData === false };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# External evidence verification\n\n- Status: **${report.status}**\n- Release allowed: **${report.releaseAllowed ? "YES" : "NO"}**\n- Pending gates: ${report.pending.length}\n- Errors: ${report.errors.length}\n- No fabricated evidence: **${report.noFabricatedEvidence ? "YES" : "NO"}**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, releaseAllowed: report.releaseAllowed, pending: report.pending.length, errors: report.errors.length })}\n`);
if (errors.length) process.exitCode = 1;
