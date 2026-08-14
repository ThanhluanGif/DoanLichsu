import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "docs/operations/security-handoff-manifest.example.json"));
const output = resolve(option("--output", "artifacts/security/security-handoff-readiness.json"));
const currentCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const text = (value) => typeof value === "string" && value.trim().length > 0;
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const artifactPath = (value) => text(value) && value.startsWith("artifacts/") && !value.startsWith("/") && !value.includes("\\") && !value.includes("..") && relative(root, resolve(root, value)) === value && existsSync(resolve(root, value));
const nonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

const manifest = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) errors.push("MANIFEST_MUST_BE_OBJECT");
if (manifest.version !== "security-handoff-v1") errors.push("INVALID_MANIFEST_VERSION");
if (manifest.publicBeta !== false) errors.push("PUBLIC_BETA_MUST_BE_FALSE");
if (manifest.releaseAllowed !== false) errors.push("RELEASE_ALLOWED_MUST_BE_FALSE");
if (manifest.externalEvidenceAttached !== false) errors.push("EXTERNAL_EVIDENCE_ATTACHED_MUST_REMAIN_FALSE");
if (manifest.decision !== "PENDING_EXTERNAL_REVIEW") errors.push("SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW");
if (!/^[a-f0-9]{40}$/.test(manifest.testedCommit ?? "")) errors.push("TESTED_COMMIT_REQUIRED");
else if (manifest.testedCommit !== currentCommit) errors.push("TESTED_COMMIT_MUST_MATCH_CURRENT_HEAD");
if (!text(manifest.tool)) errors.push("TOOL_REQUIRED");
if (!text(manifest.toolVersion)) errors.push("TOOL_VERSION_REQUIRED");
if (!isoTimestamp(manifest.reviewedAt)) errors.push("REVIEWED_AT_MUST_BE_ISO_TIMESTAMP");

const requiredScope = ["auth-rbac", "source-ingestion", "ai-safety"];
const scope = Array.isArray(manifest.scope) ? manifest.scope : [];
for (const item of requiredScope) if (!scope.includes(item)) errors.push(`MISSING_SCOPE:${item}`);
const findings = manifest.findings ?? {};
for (const field of ["critical", "high", "medium", "low"]) if (!nonNegativeInteger(findings[field])) errors.push(`FINDINGS_${field.toUpperCase()}_MUST_BE_NON_NEGATIVE_INTEGER`);
if (nonNegativeInteger(findings.critical) && findings.critical > 0) errors.push("CRITICAL_FINDINGS_MUST_BE_ZERO");
if (nonNegativeInteger(findings.high) && findings.high > 0) errors.push("HIGH_FINDINGS_MUST_BE_ZERO");
if (!new Set(["NONE_OPEN", "TRACKED", "PENDING_EXTERNAL_REVIEW"]).has(manifest.remediationStatus)) errors.push("INVALID_REMEDIATION_STATUS");
if (!artifactPath(manifest.reportArtifact)) errors.push("REPORT_ARTIFACT_MUST_BE_REPOSITORY_ARTIFACT");
if (!/^[a-f0-9]{64}$/.test(manifest.reportSha256 ?? "")) errors.push("REPORT_SHA256_REQUIRED");
else if (artifactPath(manifest.reportArtifact) && sha256(resolve(root, manifest.reportArtifact)) !== manifest.reportSha256) errors.push("REPORT_ARTIFACT_SHA256_MISMATCH");

const reviewer = manifest.reviewer ?? {};
if (!text(reviewer.name)) errors.push("REVIEWER_NAME_REQUIRED");
if (!text(reviewer.organization)) errors.push("REVIEWER_ORGANIZATION_REQUIRED");
if (!text(reviewer.authority)) errors.push("REVIEWER_AUTHORITY_REQUIRED");
if (!isoTimestamp(reviewer.verifiedAt)) errors.push("REVIEWER_VERIFIED_AT_MUST_BE_ISO_TIMESTAMP");

const scanSensitive = (value, path = "manifest") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(secret|token|password|api.?key|credential|email|phone|address|school|participant|ip)/i.test(key) && child !== null && child !== undefined && child !== "") errors.push(`${path}.${key}:PII_OR_SECRET_VALUE_FORBIDDEN`);
    scanSensitive(child, `${path}.${key}`);
  }
};
scanSensitive(manifest);

const report = {
  version: "security-handoff-readiness-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  testedCommit: manifest.testedCommit ?? null,
  currentCommit,
  scope: requiredScope,
  findings: { critical: findings.critical ?? null, high: findings.high ?? null, medium: findings.medium ?? null, low: findings.low ?? null },
  status: errors.length ? "BLOCKED_EXTERNAL" : "PASS_SECURITY_PACKET",
  officialSecurityEvidence: false,
  releaseAllowed: false,
  publicBeta: false,
  noFabricatedEvidence: true,
  databaseMutation: false,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Security handoff readiness\n\n- Status: **${report.status}**\n- Official security evidence: **NO**\n- Release allowed: **NO**\n- Public Beta: **DISABLED**\n- Tested commit: ${report.testedCommit ?? "—"}\n- Errors: ${errors.length}\n- No fabricated evidence: **YES**\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, officialSecurityEvidence: false, releaseAllowed: false, publicBeta: false, errors: errors.length, databaseMutation: false })}\n`);
if (errors.length) process.exitCode = 1;
