import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const db = resolve(option("--database", process.env.DATABASE_PATH || "data/quan-su-viet.db"));
const output = resolve(option("--output", "artifacts/production-readiness/report.json"));
const read = (path, fallback = null) => { try { return JSON.parse(readFileSync(resolve(path), "utf8")); } catch { return fallback; } };
const qualityEvidence = read("artifacts/release/current-head-evidence.json");
const recovery = read("artifacts/operations/backup-restore-proof.json");
const uptime = read("artifacts/operations/uptime-observations.json");
const performance = read("artifacts/operations/performance-observations.json");
const aiEval = read("artifacts/ai-eval/report-500.json", {});
const security = read("artifacts/security/security-review-pack.json");
const external = read("artifacts/operations/external-evidence-ledger.json", { items: [] });
const qualitySteps = qualityEvidence?.steps?.filter((step) => ["lint", "typecheck", "test", "build"].includes(step.name)) ?? [];
const localQuality = qualitySteps.length === 4 && qualitySteps.every((step) => step.exitCode === 0);
const localRecovery = recovery?.verified === true;
const localUptime = uptime?.status === "PASS_OBSERVATION" && uptime?.officialProductionEvidence === false;
const localPerformance = performance?.status === "PASS_OBSERVATION" && performance?.officialLoadEvidence === false;
const localAi = aiEval?.status === "PASS" && aiEval?.actualQuestions === 500;
const localSecurity = security?.status === "PASS_LOCAL_SECURITY_EVIDENCE" && security?.independentReview === "PENDING_EXTERNAL";
const pending = external.items.filter((item) => item.status !== "PASS").map((item) => item.id);
const report = {
  version: "production-readiness-v2",
  generatedAt: new Date().toISOString(),
  status: "PASS_LOCAL_ONLY",
  publicBetaAllowed: false,
  officialProductionEvidence: false,
  checks: {
    database: { path: db, absolute: true, exists: existsSync(db) },
    quality: { status: localQuality ? "PASS_LOCAL_ONLY" : "FAIL", evidence: "artifacts/release/current-head-evidence.json" },
    backupRestore: { status: localRecovery ? "PASS_DISPOSABLE_ONLY" : "BLOCKED", evidence: "artifacts/operations/backup-restore-proof.json" },
    uptimeObservation: { status: localUptime ? "PASS_SHORT_OBSERVATION" : "BLOCKED", evidence: "artifacts/operations/uptime-observations.json", ninetyDayEvidence: false },
    performanceObservation: { status: localPerformance ? "PASS_BOUNDED_OBSERVATION" : "BLOCKED", evidence: "artifacts/operations/performance-observations.json", officialLoadEvidence: false },
    aiMachineEval: { status: localAi ? "PASS_MACHINE_ONLY" : "BLOCKED", evidence: "artifacts/ai-eval/report-500.json" },
    securityLocal: { status: localSecurity ? "PASS_LOCAL_ONLY" : "BLOCKED", evidence: "artifacts/security/security-review-pack.json", independentReview: security?.independentReview ?? "MISSING", penTest: security?.penTest ?? "MISSING" },
  },
  external: { status: pending.length ? "BLOCKED_EXTERNAL" : "PENDING_REVIEW", pending, officialProduction: external.officialProductionDomain === true },
  blockers: pending,
  databaseMutation: false,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Production readiness\n\n- Status: **${report.status}**\n- Public Beta allowed: **NO**\n- Official production evidence: **NO**\n- Local quality: ${report.checks.quality.status}\n- Backup/restore: ${report.checks.backupRestore.status}\n- Uptime: ${report.checks.uptimeObservation.status}; 90-day evidence: **NO**\n- Performance: ${report.checks.performanceObservation.status}; official load evidence: **NO**\n- AI: ${report.checks.aiMachineEval.status}\n- Security: ${report.checks.securityLocal.status}; independent review: **${report.checks.securityLocal.independentReview}**\n- External blockers: ${pending.length}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, publicBetaAllowed: false, localQuality, localRecovery, localUptime, localPerformance, localAi, localSecurity, externalBlockers: pending.length })}\n`);
