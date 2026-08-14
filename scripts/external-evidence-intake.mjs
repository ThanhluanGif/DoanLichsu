import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const input = resolve(option("--input", "artifacts/operations/external-evidence-ledger.json"));
const output = resolve(option("--output", "artifacts/operations/external-evidence-intake.json"));
const requiredIds = [
  "official-production", "uptime-90-day", "council-signoff", "ai-golden-human-approval",
  "model-comparison", "dpia-approval", "partner-rights", "real-pilot",
  "school-university-reach", "independent-security", "named-operations",
];
const allowedStatuses = new Set(["PENDING", "PASS", "REJECTED"]);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const nullableText = (value) => value === null || value === undefined || text(value);
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const repositoryArtifact = (value) => {
  if (!text(value) || value.startsWith("/") || value.includes("\\") || value.includes("..") || !value.startsWith("artifacts/")) return false;
  const absolute = resolve(root, value);
  return relative(root, absolute) === value && existsSync(absolute);
};
const sha256 = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");

const ledger = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) errors.push("LEDGER_MUST_BE_OBJECT");
if (!new Set(["PENDING_EXTERNAL_EVIDENCE", "READY"]).has(ledger.status)) errors.push("INVALID_LEDGER_STATUS");
if (ledger.fabricatedPersonalData !== false) errors.push("FABRICATED_PERSONAL_DATA_FLAG_MUST_BE_FALSE");
if (ledger.databaseMutation !== false) errors.push("DATABASE_MUTATION_FLAG_MUST_BE_FALSE");
const items = Array.isArray(ledger.items) ? ledger.items : [];
if (items.length !== requiredIds.length) errors.push("GATE_COUNT_MISMATCH");
if (new Set(items.map((item) => item?.id)).size !== items.length) errors.push("DUPLICATE_GATE_ID");

for (const id of requiredIds) {
  const item = items.find((candidate) => candidate?.id === id);
  if (!item) {
    errors.push(`${id}:MISSING_GATE`);
    continue;
  }
  if (!allowedStatuses.has(item.status)) {
    errors.push(`${id}:INVALID_STATUS`);
    continue;
  }
  if (!nullableText(item.owner) || !nullableText(item.authority) || !nullableText(item.artifact) || !nullableText(item.sha256) || !nullableText(item.verifiedAt)) {
    errors.push(`${id}:NULLABLE_FIELDS_MUST_BE_NULL_OR_TEXT`);
  }
  if (item.status === "PENDING") {
    if (item.artifact !== null && item.artifact !== undefined) errors.push(`${id}:PENDING_MUST_NOT_ATTACH_ARTIFACT`);
    if (item.sha256 !== null && item.sha256 !== undefined) errors.push(`${id}:PENDING_MUST_NOT_ATTACH_HASH`);
    if (item.verifiedAt !== null && item.verifiedAt !== undefined) errors.push(`${id}:PENDING_MUST_NOT_ATTACH_TIMESTAMP`);
    continue;
  }
  if (!text(item.owner)) errors.push(`${id}:${item.status}_REQUIRES_OWNER`);
  if (!text(item.authority)) errors.push(`${id}:${item.status}_REQUIRES_AUTHORITY_SCOPE`);
  if (!isoTimestamp(item.verifiedAt)) errors.push(`${id}:${item.status}_REQUIRES_ISO_VERIFIED_AT`);
  if (item.status === "PASS") {
    if (!repositoryArtifact(item.artifact)) errors.push(`${id}:PASS_REQUIRES_EXISTING_REPOSITORY_ARTIFACT`);
    if (!/^[a-f0-9]{64}$/.test(item.sha256 ?? "")) errors.push(`${id}:PASS_REQUIRES_SHA256`);
    else if (repositoryArtifact(item.artifact) && sha256(item.artifact) !== item.sha256) errors.push(`${id}:ARTIFACT_SHA256_MISMATCH`);
  } else if (item.status === "REJECTED" && !text(item.rejectionReason)) {
    errors.push(`${id}:REJECTED_REQUIRES_REASON`);
  }
}
if (ledger.status === "READY" && items.some((item) => item.status !== "PASS")) errors.push("READY_REQUIRES_ALL_GATES_PASS");

const pending = items.filter((item) => item.status === "PENDING").map((item) => item.id);
const rejected = items.filter((item) => item.status === "REJECTED").map((item) => item.id);
const passed = items.filter((item) => item.status === "PASS").map((item) => item.id);
const report = {
  version: "external-evidence-intake-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  ledgerSha256: createHash("sha256").update(readFileSync(input)).digest("hex"),
  status: errors.length ? "FAIL_INTAKE_SCHEMA" : "PASS_INTAKE_SCHEMA",
  releaseAllowed: errors.length === 0 && pending.length === 0 && rejected.length === 0,
  pending,
  rejected,
  passed,
  errors,
  noFabricatedEvidence: ledger.fabricatedPersonalData === false,
  databaseMutation: false,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# External evidence intake validation\n\n- Status: **${report.status}**\n- Release allowed: **${report.releaseAllowed ? "YES" : "NO"}**\n- Passed: ${passed.length}\n- Pending: ${pending.length}\n- Rejected: ${rejected.length}\n- Errors: ${errors.length}\n- Ledger mutation: **NO**\n- No fabricated evidence: **${report.noFabricatedEvidence ? "YES" : "NO"}**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, releaseAllowed: report.releaseAllowed, passed: passed.length, pending: pending.length, rejected: rejected.length, errors: errors.length, databaseMutation: false })}\n`);
if (errors.length) process.exitCode = 1;
