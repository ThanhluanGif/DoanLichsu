import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "docs/operations/rights-handoff-manifest.example.json"));
const output = resolve(option("--output", "artifacts/wikimedia/rights-handoff-readiness.json"));
const batchPath = "artifacts/wikimedia/batch-300-report.json";
const ledgerPath = "artifacts/wikimedia/rights-review-ledger.json";
const batchFile = resolve(option("--batch-file", batchPath));
const ledgerFile = resolve(option("--ledger-file", ledgerPath));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const hash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const artifactPath = (value) => text(value) && value.startsWith("artifacts/") && !value.startsWith("/") && !value.includes("\\") && !value.includes("..") && relative(root, resolve(root, value)) === value && existsSync(resolve(root, value));

const manifest = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) errors.push("MANIFEST_MUST_BE_OBJECT");
if (manifest.version !== "rights-handoff-v1") errors.push("INVALID_MANIFEST_VERSION");
if (manifest.publicBeta !== false) errors.push("PUBLIC_BETA_MUST_BE_FALSE");
if (manifest.releaseAllowed !== false) errors.push("RELEASE_ALLOWED_MUST_REMAIN_FALSE");
if (manifest.externalEvidenceAttached !== false) errors.push("EXTERNAL_EVIDENCE_ATTACHED_MUST_REMAIN_FALSE");
if (manifest.decision !== "PENDING_EXTERNAL_REVIEW") errors.push("SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW");
if (manifest.binaryServingEnabled !== false) errors.push("BINARY_SERVING_MUST_REMAIN_FALSE");

for (const [label, path, file, field] of [["batch", batchPath, batchFile, "batchSha256"], ["ledger", ledgerPath, ledgerFile, "ledgerSha256"]]) {
  if (!/^[a-f0-9]{64}$/.test(manifest[field] ?? "")) errors.push(`${label.toUpperCase()}_SHA256_REQUIRED`);
  else if (!existsSync(file) || manifest[field] !== hash(file)) errors.push(`${label.toUpperCase()}_SHA256_MISMATCH`);
}
let batch = null;
let ledger = null;
try { batch = JSON.parse(readFileSync(batchFile, "utf8")); } catch { errors.push("BATCH_REPORT_UNREADABLE"); }
try { ledger = JSON.parse(readFileSync(ledgerFile, "utf8")); } catch { errors.push("RIGHTS_LEDGER_UNREADABLE"); }
if (batch) {
  if (batch.status !== "PASS" || batch.imported !== 300 || batch.records?.length !== 300) errors.push("BATCH_MUST_CONTAIN_300_PASS_RECORDS");
  const missing = (batch.records ?? []).filter((record) => ["pageId", "fileTitle", "descriptionUrl", "revisionId", "revisionTimestamp"].some((field) => record[field] === null || record[field] === undefined || String(record[field]).trim() === ""));
  if (missing.length) errors.push(`BATCH_MISSING_METADATA:${missing.length}`);
}
if (ledger) {
  if (ledger.total !== 300 || ledger.rows?.length !== 300) errors.push("RIGHTS_LEDGER_MUST_CONTAIN_300_ROWS");
  if (ledger.invalidMetadataCount !== 0) errors.push("RIGHTS_LEDGER_INVALID_METADATA_MUST_BE_ZERO");
  if (ledger.approvedForBinary !== 0) errors.push("APPROVED_BINARY_MUST_BE_ZERO_UNTIL_EXTERNAL_REVIEW");
  if (ledger.binaryServingEnabled !== false) errors.push("LEDGER_BINARY_SERVING_MUST_BE_FALSE");
  const nonLinkOnly = (ledger.rows ?? []).filter((row) => row.rightsStatus !== "LINK_ONLY" || row.serveBinary !== false);
  if (nonLinkOnly.length) errors.push(`LEDGER_HAS_NON_LINK_ONLY_ROWS:${nonLinkOnly.length}`);
}

const reviewer = manifest.rightsReviewer ?? {};
if (!text(reviewer.name)) errors.push("RIGHTS_REVIEWER_NAME_REQUIRED");
if (!text(reviewer.authority)) errors.push("RIGHTS_REVIEWER_AUTHORITY_REQUIRED");
if (!isoTimestamp(reviewer.verifiedAt)) errors.push("RIGHTS_REVIEWER_VERIFIED_AT_MUST_BE_ISO_TIMESTAMP");
const collections = Array.isArray(manifest.partnerCollections) ? manifest.partnerCollections : [];
if (collections.length !== 2) errors.push("EXACTLY_TWO_PARTNER_COLLECTIONS_REQUIRED");
for (const [index, collection] of collections.entries()) {
  const label = `partnerCollection[${index}]`;
  if (!text(collection?.id) || !text(collection?.name)) errors.push(`${label}:ID_AND_NAME_REQUIRED`);
  if (collection?.mode !== "LINK_ONLY") errors.push(`${label}:MODE_MUST_REMAIN_LINK_ONLY_UNTIL_PERMISSION_REVIEW`);
  if (!artifactPath(collection?.artifact)) errors.push(`${label}:ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT`);
  if (!/^[a-f0-9]{64}$/.test(collection?.sha256 ?? "")) errors.push(`${label}:SHA256_REQUIRED`);
  else if (artifactPath(collection?.artifact) && hash(collection.artifact) !== collection.sha256) errors.push(`${label}:ARTIFACT_SHA256_MISMATCH`);
  if (!text(collection?.owner)) errors.push(`${label}:OWNER_REQUIRED`);
  if (!text(collection?.authority)) errors.push(`${label}:AUTHORITY_REQUIRED`);
  if (!isoTimestamp(collection?.verifiedAt)) errors.push(`${label}:VERIFIED_AT_MUST_BE_ISO_TIMESTAMP`);
}

const scanSensitive = (value, path = "manifest") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(secret|token|password|api.?key|credential|email|phone|address|school|participant|ip)/i.test(key) && child !== null && child !== undefined && child !== "") errors.push(`${path}.${key}:PII_OR_SECRET_VALUE_FORBIDDEN`);
    scanSensitive(child, `${path}.${key}`);
  }
};
scanSensitive(manifest);

const report = {
  version: "rights-handoff-readiness-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  batch: { path: batchPath, sha256: existsSync(batchFile) ? hash(batchFile) : null },
  ledger: { path: ledgerPath, sha256: existsSync(ledgerFile) ? hash(ledgerFile) : null },
  status: errors.length ? "BLOCKED_EXTERNAL" : "PASS_RIGHTS_PACKET",
  officialPartnerRights: false,
  approvedForBinary: 0,
  binaryServingEnabled: false,
  releaseAllowed: false,
  publicBeta: false,
  noFabricatedEvidence: true,
  databaseMutation: false,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Rights handoff readiness\n\n- Status: **${report.status}**\n- Official partner rights: **NO**\n- Approved for binary: **0/300**\n- Binary serving: **DISABLED**\n- Release allowed: **NO**\n- Public Beta: **DISABLED**\n- Errors: ${errors.length}\n- No fabricated evidence: **YES**\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, officialPartnerRights: false, approvedForBinary: 0, binaryServingEnabled: false, releaseAllowed: false, publicBeta: false, errors: errors.length, databaseMutation: false })}\n`);
if (errors.length) process.exitCode = 1;
