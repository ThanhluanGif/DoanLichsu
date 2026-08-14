import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "docs/operations/dpia-handoff-manifest.example.json"));
const output = resolve(option("--output", "artifacts/privacy/dpia-readiness.json"));
const policyPath = "docs/privacy/dpia.md";
const policyAbsolute = resolve(option("--policy-file", policyPath));
const markers = ["no-account", "Data minimization", "deleted within 30 days", "deletion/correction", "free-form public AI", "Incident response", "one business day", "three business days"];
const text = (value) => typeof value === "string" && value.trim().length > 0;
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const safeArtifact = (value) => text(value) && value.startsWith("artifacts/") && !value.startsWith("/") && !value.includes("\\") && !value.includes("..") && relative(root, resolve(root, value)) === value && existsSync(resolve(root, value));

const manifest = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) errors.push("MANIFEST_MUST_BE_OBJECT");
if (manifest.version !== "dpia-handoff-v1") errors.push("INVALID_MANIFEST_VERSION");
if (manifest.publicBeta !== false) errors.push("PUBLIC_BETA_MUST_BE_FALSE");
if (manifest.releaseAllowed !== false) errors.push("RELEASE_ALLOWED_MUST_BE_FALSE");
if (manifest.externalEvidenceAttached !== false) errors.push("EXTERNAL_EVIDENCE_ATTACHED_MUST_REMAIN_FALSE");
if (manifest.decision !== "PENDING_EXTERNAL_REVIEW") errors.push("SELF_APPROVAL_FORBIDDEN_DECISION_MUST_BE_PENDING_EXTERNAL_REVIEW");
if (!existsSync(policyAbsolute)) errors.push("CANONICAL_DPIA_POLICY_MISSING");
const policyText = existsSync(policyAbsolute) ? readFileSync(policyAbsolute, "utf8") : "";
const policySha256 = existsSync(policyAbsolute) ? sha256(policyAbsolute) : null;
if (manifest.policy?.path !== policyPath) errors.push("POLICY_PATH_MUST_BE_CANONICAL");
if (!/^[a-f0-9]{64}$/.test(manifest.policy?.sha256 ?? "")) errors.push("POLICY_SHA256_REQUIRED");
else if (manifest.policy.sha256 !== policySha256) errors.push("POLICY_SHA256_MISMATCH");
if (!text(manifest.policy?.version)) errors.push("POLICY_VERSION_REQUIRED");
const controls = markers.map((marker) => ({ marker, passed: policyText.toLowerCase().includes(marker.toLowerCase()) }));
for (const control of controls) if (!control.passed) errors.push(`MISSING_CONTROL:${control.marker}`);

const owner = manifest.owner ?? {};
if (!text(owner.name)) errors.push("OWNER_NAME_REQUIRED_FOR_HANDOFF");
if (!text(owner.authority)) errors.push("OWNER_AUTHORITY_REQUIRED_FOR_HANDOFF");
if (!isoTimestamp(owner.verifiedAt)) errors.push("OWNER_VERIFIED_AT_MUST_BE_ISO_TIMESTAMP");
if (manifest.approvalArtifact !== null && manifest.approvalArtifact !== undefined) {
  if (!safeArtifact(manifest.approvalArtifact)) errors.push("APPROVAL_ARTIFACT_MUST_BE_NULL_UNTIL_EXTERNAL_REVIEW");
}

const scanForSensitiveValues = (value, path = "manifest") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(secret|token|password|api.?key|credential|email|phone|address|school|participant|ip)/i.test(key) && child !== null && child !== undefined && child !== "") errors.push(`${path}.${key}:PII_OR_SECRET_VALUE_FORBIDDEN`);
    scanForSensitiveValues(child, `${path}.${key}`);
  }
};
scanForSensitiveValues(manifest);

const report = {
  version: "dpia-readiness-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  policy: { path: policyPath, sha256: policySha256, controls },
  status: errors.length ? "BLOCKED_EXTERNAL" : "PASS_DPIA_CONTROLS_PENDING_REVIEW",
  approved: false,
  releaseAllowed: false,
  publicBeta: false,
  noFabricatedEvidence: true,
  databaseMutation: false,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# DPIA readiness\n\n- Status: **${report.status}**\n- Approved: **NO**\n- Release allowed: **NO**\n- Public Beta: **DISABLED**\n- Controls: ${controls.filter((control) => control.passed).length}/${controls.length}\n- Policy SHA-256: ${policySha256}\n- Errors: ${errors.length}\n- No fabricated evidence: **YES**\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, approved: false, releaseAllowed: false, publicBeta: false, controls: controls.filter((control) => control.passed).length, errors: errors.length, databaseMutation: false })}\n`);
if (errors.length) process.exitCode = 1;
