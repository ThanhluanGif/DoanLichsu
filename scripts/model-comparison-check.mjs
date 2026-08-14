import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const input = resolve(option("--input", "docs/operations/model-comparison-manifest.example.json"));
const output = resolve(option("--output", "artifacts/ai-eval/model-comparison-readiness.json"));
const datasetPath = "artifacts/ai-eval/questions-500.json";
const datasetAbsolute = resolve(root, datasetPath);
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const numberInRange = (value, min = 0, max = 1) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const repositoryArtifact = (value) => {
  if (!text(value) || value.startsWith("/") || value.includes("\\") || value.includes("..") || !value.startsWith("artifacts/")) return false;
  const absolute = resolve(root, value);
  return relative(root, absolute) === value && existsSync(absolute);
};
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));

const manifest = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) errors.push("MANIFEST_MUST_BE_OBJECT");
if (manifest.version !== "model-comparison-v1") errors.push("INVALID_MANIFEST_VERSION");
if (manifest.publicBeta !== false) errors.push("PUBLIC_BETA_MUST_BE_FALSE");
if (manifest.releaseAllowed !== false) errors.push("RELEASE_ALLOWED_MUST_BE_FALSE");
if (!existsSync(datasetAbsolute)) errors.push("CANONICAL_DATASET_MISSING");
const canonicalDatasetSha256 = existsSync(datasetAbsolute) ? sha256(datasetAbsolute) : null;
if (manifest.dataset?.path !== datasetPath) errors.push("DATASET_PATH_MUST_BE_CANONICAL");
if (!/^[a-f0-9]{64}$/.test(manifest.dataset?.sha256 ?? "")) errors.push("DATASET_SHA256_REQUIRED");
else if (manifest.dataset.sha256 !== canonicalDatasetSha256) errors.push("DATASET_SHA256_MISMATCH");

const comparisons = Array.isArray(manifest.comparisons) ? manifest.comparisons : [];
if (comparisons.length !== 2) errors.push("EXACTLY_TWO_COMPARISONS_REQUIRED");
const identities = new Set();
for (const [index, comparison] of comparisons.entries()) {
  const label = `comparison[${index}]`;
  if (!comparison || typeof comparison !== "object") { errors.push(`${label}:MUST_BE_OBJECT`); continue; }
  if (!text(comparison.id)) errors.push(`${label}:ID_REQUIRED`);
  if (!text(comparison.provider) || !text(comparison.model)) errors.push(`${label}:PROVIDER_AND_MODEL_REQUIRED`);
  const identity = `${comparison.provider ?? ""}::${comparison.model ?? ""}`;
  if (identities.has(identity)) errors.push(`${label}:SAME_PROVIDER_MODEL_NOT_ALLOWED`);
  identities.add(identity);
  if (!text(comparison.configuration)) errors.push(`${label}:CONFIGURATION_REQUIRED`);
  const metrics = comparison.metrics;
  if (!metrics || typeof metrics !== "object") { errors.push(`${label}:METRICS_REQUIRED`); continue; }
  if (metrics.questions !== 500) errors.push(`${label}:METRICS_MUST_COVER_500_QUESTIONS`);
  for (const metric of ["accuracy", "citationPrecision", "refusalRate", "injectionLeakRate"]) {
    if (!numberInRange(metrics[metric])) errors.push(`${label}:${metric}_MUST_BE_0_TO_1`);
  }
  if (!numberInRange(metrics.latencyMs, 0, Number.MAX_SAFE_INTEGER)) errors.push(`${label}:LATENCY_MS_REQUIRED`);
  if (!numberInRange(metrics.costUsd, 0, Number.MAX_SAFE_INTEGER)) errors.push(`${label}:COST_USD_REQUIRED`);
  if (!repositoryArtifact(comparison.artifact)) errors.push(`${label}:ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT`);
  if (!/^[a-f0-9]{64}$/.test(comparison.sha256 ?? "")) errors.push(`${label}:ARTIFACT_SHA256_REQUIRED`);
  else if (repositoryArtifact(comparison.artifact) && sha256(resolve(root, comparison.artifact)) !== comparison.sha256) errors.push(`${label}:ARTIFACT_SHA256_MISMATCH`);
}
const owner = manifest.owner ?? {};
if (!text(owner.name)) errors.push("OWNER_NAME_REQUIRED_FOR_PACKET");
if (!text(owner.authority)) errors.push("OWNER_AUTHORITY_REQUIRED_FOR_PACKET");
if (!isoTimestamp(owner.verifiedAt)) errors.push("OWNER_VERIFIED_AT_MUST_BE_ISO_TIMESTAMP");
if (manifest.externalEvidenceAttached !== false) errors.push("EXTERNAL_EVIDENCE_ATTACHED_MUST_REMAIN_FALSE_UNTIL_AUTHORIZED_HANDOFF");

const scanForSecrets = (value, path = "manifest") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(secret|token|password|api.?key|credential)/i.test(key) && key !== "secretNames" && child !== null && child !== undefined && child !== "") errors.push(`${path}.${key}:SECRET_OR_TOKEN_VALUE_FORBIDDEN`);
    scanForSecrets(child, `${path}.${key}`);
  }
};
scanForSecrets(manifest);

const report = {
  version: "model-comparison-readiness-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  canonicalDataset: { path: datasetPath, sha256: canonicalDatasetSha256 },
  status: errors.length ? "BLOCKED_EXTERNAL" : "PASS_COMPARISON_PACKET",
  releaseAllowed: false,
  officialModelIndependenceEvidence: false,
  publicBeta: false,
  noFabricatedEvidence: true,
  databaseMutation: false,
  comparisonCount: comparisons.length,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Model comparison readiness\n\n- Status: **${report.status}**\n- Release allowed: **NO**\n- Official model-independence evidence: **NO**\n- Public Beta: **DISABLED**\n- Comparisons: ${report.comparisonCount}/2\n- Errors: ${report.errors.length}\n- No fabricated evidence: **YES**\n\n${report.errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, releaseAllowed: false, officialModelIndependenceEvidence: false, publicBeta: false, errors: errors.length, databaseMutation: false })}\n`);
if (errors.length) process.exitCode = 1;
