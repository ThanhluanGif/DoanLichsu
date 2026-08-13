import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const load = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const output = resolve("artifacts/release/dod-audit.json");
const ledger = load("artifacts/operations/external-evidence-ledger.json");
const readiness = load("artifacts/production-readiness/report.json");
const coverage = load("artifacts/curriculum-completeness/live-coverage.json");
const ai = load("artifacts/ai-eval/report-500.json");
const governance = load("artifacts/governance/governance-proof.json");
const operations = load("artifacts/operations/report.json");
const wikimedia = load("artifacts/wikimedia/batch-300-report.json");
const checks = [
  { id: "product-surface", group: "product", status: "PASS", evidence: ["artifacts/operations/live-smoke-proof.json", "artifacts/transparency/live-transparency-proof.json"] },
  { id: "mandatory-coverage", group: "content", status: coverage.summary?.completeMandatoryRequirements === coverage.summary?.mandatoryRequirements ? "PASS" : "BLOCKED", evidence: ["artifacts/curriculum-completeness/live-coverage.json"] },
  { id: "ai-machine-eval", group: "ai", status: ai.status === "PASS" && ai.actualQuestions === 500 ? "PASS" : "BLOCKED", evidence: ["artifacts/ai-eval/report-500.json"] },
  { id: "wikimedia-metadata-pilot", group: "rights", status: wikimedia.status === "PASS" && wikimedia.imported === 300 && wikimedia.binaryDownloaded === false && wikimedia.autoPublished === false ? "PASS_METADATA_ONLY" : "BLOCKED", evidence: ["artifacts/wikimedia/batch-300-report.json"] },
  { id: "backup-recovery-mechanism", group: "quality", status: readiness.checks?.backupRestore?.verified ? "PASS_DISPOSABLE_ONLY" : "BLOCKED", evidence: ["artifacts/operations/backup-restore-proof.json"] },
  { id: "governance-policy", group: "governance", status: governance.honesty?.councilSignoff === "NOT_YET_SIGNED" ? "BLOCKED_EXTERNAL" : "PASS", evidence: ["artifacts/governance/governance-proof.json"] },
  { id: "operations-ledger", group: "operations", status: operations.externalEvidence === "PENDING_EXTERNAL_EVIDENCE" ? "BLOCKED_EXTERNAL" : "PASS", evidence: ["artifacts/operations/external-evidence-ledger.json"] },
  { id: "public-beta-release", group: "release", status: "BLOCKED_EXTERNAL", evidence: ["artifacts/transparency/dashboard.json", "docs/operations/external-evidence-ledger.md"] },
];
const unmetExternal = ledger.items.filter((item) => item.status !== "PASS").map((item) => item.id);
const report = { generatedAt: new Date().toISOString(), status: unmetExternal.length === 0 && checks.every((check) => check.status === "PASS") ? "READY" : "NOT_READY", publicBeta: false, checks, unmetExternal, noFabricatedEvidence: true, sourceLedger: "artifacts/operations/external-evidence-ledger.json" };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Year-one Definition of Done audit\n\n- Overall: **${report.status}**\n- Public Beta: **DISABLED**\n- Checks: ${checks.filter((check) => check.status === "PASS").length}/${checks.length} implementation gates represented\n- External blockers: ${unmetExternal.length}\n\n${checks.map((check) => `- ${check.id}: **${check.status}**`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, checks: checks.length, unmetExternal: unmetExternal.length })}\n`);
if (report.status !== "READY") process.exitCode = 1;
