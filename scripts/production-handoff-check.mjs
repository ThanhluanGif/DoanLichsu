import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const root = resolve(".");
const manifestPath = resolve(option("--manifest", "docs/operations/production-handoff-manifest.example.json"));
const output = resolve(option("--output", "artifacts/operations/production-handoff-check.json"));
const requiredRoutes = ["/healthz", "/openapi.json", "/api/v1/vi/search?q=dien%20bien%20phu", "/vi", "/en", "/vi/minh-bach"];
const errors = [];
const warning = [];
const fileHash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const artifactPath = (value, label) => {
  if (!text(value)) { errors.push(`${label}:MISSING_ARTIFACT`); return; }
  if (/^https?:\/\//i.test(value)) { errors.push(`${label}:MUST_BE_REPOSITORY_ARTIFACT`); return; }
  const absolute = resolve(root, value);
  const rel = relative(root, absolute);
  if (!rel.startsWith("artifacts/") || rel.startsWith("../") || !existsSync(absolute)) { errors.push(`${label}:ARTIFACT_NOT_FOUND_UNDER_ARTIFACTS`); return; }
  return absolute;
};
const digest = (value, label, artifact) => {
  if (!/^[a-f0-9]{64}$/i.test(String(value ?? ""))) { errors.push(`${label}:INVALID_SHA256`); return; }
  if (artifact && fileHash(artifact) !== value) errors.push(`${label}:SHA256_MISMATCH`);
};
let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); } catch (error) { errors.push(`MANIFEST_READ_ERROR:${String(error)}`); manifest = {}; }
if (manifest.version !== "production-handoff-v1") errors.push("version:EXPECTED_production-handoff-v1");
if (manifest.environment !== "production") errors.push("environment:EXPECTED_production");
let origin;
try { origin = new URL(manifest.origin); if (origin.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(origin.hostname) || /example|trycloudflare|local/i.test(origin.hostname)) errors.push("origin:REQUIRES_OFFICIAL_HTTPS_HOST"); } catch { errors.push("origin:REQUIRES_OFFICIAL_HTTPS_URL"); }
if (!/^[0-9a-f]{40}$/i.test(String(manifest.releaseCommit ?? ""))) errors.push("releaseCommit:INVALID_GIT_SHA");
if (!/^sha256:[a-f0-9]{64}$/i.test(String(manifest.imageDigest ?? ""))) errors.push("imageDigest:INVALID_IMAGE_DIGEST");
if (!Array.isArray(manifest.criticalRoutes) || requiredRoutes.some((route) => !manifest.criticalRoutes.includes(route))) errors.push("criticalRoutes:MUST_INCLUDE_SIX_REQUIRED_ROUTES");
const deploymentArtifact = artifactPath(manifest.deploymentRecord?.artifact, "deploymentRecord.artifact");
digest(manifest.deploymentRecord?.sha256, "deploymentRecord.sha256", deploymentArtifact);
if (!text(manifest.rollback?.ref)) errors.push("rollback.ref:MISSING_ROLLBACK_REF");
const rollbackArtifact = artifactPath(manifest.rollback?.artifact, "rollback.artifact");
digest(manifest.rollback?.sha256, "rollback.sha256", rollbackArtifact);
if (!text(manifest.database?.strategy)) errors.push("database.strategy:MISSING_DATABASE_STRATEGY");
artifactPath(manifest.database?.backupArtifact, "database.backupArtifact");
artifactPath(manifest.database?.restoreArtifact, "database.restoreArtifact");
if (!text(manifest.monitoring?.provider)) errors.push("monitoring.provider:MISSING_MONITORING_PROVIDER");
const monitoringArtifact = artifactPath(manifest.monitoring?.artifact, "monitoring.artifact");
digest(manifest.monitoring?.sha256, "monitoring.sha256", monitoringArtifact);
for (const [label, value] of [["owner.name", manifest.owner?.name], ["owner.organization", manifest.owner?.organization], ["owner.contact", manifest.owner?.contact], ["onCall.name", manifest.onCall?.name], ["onCall.escalation", manifest.onCall?.escalation], ["onCall.rotaArtifact", manifest.onCall?.rotaArtifact]]) if (!text(value)) errors.push(`${label}:MISSING_NAMED_OWNER_FIELD`);
if (text(manifest.onCall?.rotaArtifact)) artifactPath(manifest.onCall.rotaArtifact, "onCall.rotaArtifact");
for (const [label, value] of [["rpoMinutes", manifest.rpoMinutes], ["rtoMinutes", manifest.rtoMinutes]]) if (!Number.isInteger(value) || value <= 0) errors.push(`${label}:MUST_BE_POSITIVE_INTEGER`);
if (!Array.isArray(manifest.secretNames) || manifest.secretNames.length === 0 || manifest.secretNames.some((name) => !text(name))) errors.push("secretNames:MUST_LIST_NAMES_ONLY");
for (const key of Object.keys(manifest)) if (key !== "secretNames" && /password|token|secret/i.test(key)) errors.push(`manifest:${key}_MUST_NOT_BE_PRESENT`);
if (manifest.officialProductionEvidence === true) errors.push("officialProductionEvidence:OPERATOR_EVIDENCE_MUST_USE_EXTERNAL_INTAKE");
warning.push("This validator checks handoff packet structure only; it is not official production evidence or Public Beta approval.");
const report = {
  version: "production-handoff-check-v1",
  generatedAt: new Date().toISOString(),
  manifest: relative(root, manifestPath),
  status: errors.length === 0 ? "PASS_HANDOFF_READY" : "BLOCKED_EXTERNAL",
  releaseAllowed: false,
  officialProductionEvidence: false,
  noFabricatedEvidence: true,
  errors,
  warnings: warning,
  requiredRoutes,
  secretValuesAccepted: false,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Production handoff check\n\n- Status: **${report.status}**\n- Release allowed: **NO**\n- Official production evidence: **NO**\n- Errors: ${errors.length}\n- Secret values accepted: **NO**\n\n${errors.length ? errors.map((item) => `- ${item}`).join("\n") : "- All handoff fields are structurally valid; attach through external evidence intake before release."}\n\n${warning.join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, errors: errors.length, releaseAllowed: false, officialProductionEvidence: false, output })}\n`);
if (errors.length > 0) process.exitCode = 1;
