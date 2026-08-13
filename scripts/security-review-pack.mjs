import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const output = resolve("artifacts/security/security-review-pack.json");
const commands = [
  ["static-release-contract", process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/security/release-static.test.ts", "--testTimeout=15000"]],
  ["security-workflow", process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/editorial-api/security-workflow.test.ts", "--testTimeout=15000"]],
  ["dependency-audit", "npm", ["audit", "--omit=dev", "--audit-level=high", "--json"]],
];
const startedAt = new Date().toISOString();
const steps = [];
for (const [name, command, args] of commands) {
  const childEnv = { ...process.env, NPM_CONFIG_LOGLEVEL: "silent" };
  delete childEnv.npm_config_allow_scripts;
  delete childEnv.NPM_CONFIG_ALLOW_SCRIPTS;
  const result = spawnSync(command, args, { cwd: resolve("."), encoding: "utf8", maxBuffer: 32 * 1024 * 1024, env: childEnv });
  const outputText = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  let parsed = null;
  if (name === "dependency-audit") {
    const auditText = `${result.stdout || ""}\n${result.stderr || ""}`;
    try { parsed = JSON.parse(result.stdout || "{}"); }
    catch {
      const firstBrace = auditText.indexOf("{");
      try { parsed = firstBrace >= 0 ? JSON.parse(auditText.slice(firstBrace)) : null; } catch { parsed = null; }
    }
  }
  steps.push({ name, command: [command, ...args].join(" "), exitCode: result.status ?? 1, outputSha256: createHash("sha256").update(outputText).digest("hex"), dependencyVulnerabilities: parsed?.metadata?.vulnerabilities ?? null });
}
const staticPass = steps.filter((step) => step.name !== "dependency-audit").every((step) => step.exitCode === 0);
const dependency = steps.find((step) => step.name === "dependency-audit");
// npm may return a non-zero code for lower-severity findings under a configured
// audit policy. The release gate here is explicitly high/critical; the parsed
// vulnerability counts are authoritative for that narrow decision.
const dependencyPass = Boolean(dependency?.dependencyVulnerabilities) && (dependency.dependencyVulnerabilities?.high ?? 0) === 0 && (dependency.dependencyVulnerabilities?.critical ?? 0) === 0;
const report = { version: "security-review-pack-v1", generatedAt: startedAt, status: staticPass && dependencyPass ? "PASS_LOCAL_SECURITY_EVIDENCE" : "FAIL_LOCAL_SECURITY_EVIDENCE", staticChecks: { releaseContract: staticPass, securityWorkflow: staticPass, dependencyAudit: dependencyPass }, steps, independentReview: "PENDING_EXTERNAL", penTest: "NOT_PERFORMED", publicBetaAllowed: false, noFabricatedReviewer: true };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Security review pack\n\n- Status: **${report.status}**\n- Local static/security workflow evidence: **${report.staticChecks.releaseContract && report.staticChecks.securityWorkflow ? "PASS" : "FAIL"}**\n- Dependency audit high/critical: **${report.staticChecks.dependencyAudit ? "0/0" : "NOT PASS"}**\n- Independent security review: **PENDING_EXTERNAL**\n- Pen-test: **NOT PERFORMED**\n- Public Beta allowed: **NO**\n- Generated: ${report.generatedAt}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, independentReview: report.independentReview, penTest: report.penTest, publicBetaAllowed: false })}\n`);
if (report.status !== "PASS_LOCAL_SECURITY_EVIDENCE") process.exitCode = 1;
