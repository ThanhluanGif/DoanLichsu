import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const output = resolve(option("--output", "artifacts/transparency/dashboard.json"));
const load = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const coverage = load("artifacts/curriculum-completeness/live-coverage.json");
const rights = load("artifacts/rights/report.json");
const aiEval = load("artifacts/ai-eval/report-500.json");
const privacy = load("artifacts/privacy/report.json");
const readiness = load("artifacts/production-readiness/report.json");
const corrections = load("artifacts/corrections/report.json");
const wikimedia = load("artifacts/wikimedia/batch-300-report.json");
const aiComparison = load("artifacts/ai-eval/config-comparison.json");
const external = load("artifacts/operations/external-evidence-ledger.json");
const pending = external.items.filter((item) => item.status !== "PASS").map((item) => item.id);
const report = {
  dashboardVersion: "transparency-v2",
  generatedAt: new Date().toISOString(),
  releaseStatus: "NOT_READY",
  publicBeta: false,
  coverage: { mandatory: coverage.summary ? `${coverage.summary.completeMandatoryRequirements}/${coverage.summary.mandatoryRequirements}` : "see source report", source: "artifacts/curriculum-completeness/live-coverage.json" },
  rights: { status: rights.status, servedBinary: rights.records?.filter((record) => record.publicBinaryAllowed).length ?? 0, linkOnly: rights.records?.filter((record) => !record.publicBinaryAllowed).length ?? 0 },
  ai: { status: aiEval.status, targetQuestions: aiEval.targetQuestions, actualQuestions: aiEval.actualQuestions, targetGap: aiEval.targetGap, citationPrecision: aiEval.metrics?.citationPrecision, injectionLeakRate: aiEval.metrics?.injectionLeakRate, publicBeta: false },
  privacy: { status: privacy.status, publicAi: privacy.publicAi },
  corrections: { lastIntake: corrections.status, slaHours: corrections.entry?.slaHours ?? null, reporterPublic: false },
  operations: { readiness: readiness.status, fixedProductionDomain: readiness.external?.officialProduction === true, backupRestore: readiness.checks?.backupRestore?.status ?? "UNKNOWN", uptimeObservation: readiness.checks?.uptimeObservation?.status ?? "UNKNOWN", performanceObservation: readiness.checks?.performanceObservation?.status ?? "UNKNOWN", securityLocal: readiness.checks?.securityLocal?.status ?? "UNKNOWN", independentSecurity: readiness.checks?.securityLocal?.independentReview ?? "UNKNOWN" },
  wikimedia: { status: wikimedia.status, metadataRecords: wikimedia.imported, rightsStatus: wikimedia.rightsStatus, reviewStatus: wikimedia.reviewStatus, binaryDownloaded: wikimedia.binaryDownloaded },
  aiComparison: { status: aiComparison.status, configs: aiComparison.configs?.map((entry) => entry.config.id) ?? [], modelIndependence: aiComparison.modelIndependence, humanApproval: aiComparison.humanApproval },
  blockers: pending,
  disclosure: "This dashboard reports implementation evidence only. It is not an independent historian council endorsement, legal approval, security review, school pilot result or Public Beta release approval.",
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Public transparency dashboard\n\n- Release: **NOT READY**\n- Public Beta: **DISABLED**\n- Mandatory coverage: ${report.coverage.mandatory}\n- AI eval: ${report.ai.actualQuestions}/${report.ai.targetQuestions}\n- Operations readiness: ${report.operations.readiness}\n- Backup/restore: ${report.operations.backupRestore}\n- Uptime observation: ${report.operations.uptimeObservation}\n- Performance observation: ${report.operations.performanceObservation}\n- Independent security: **${report.operations.independentSecurity}**\n- External blockers: ${report.blockers.length}\n\n## Blockers\n\n${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}\n\n${report.disclosure}\n`);
process.stdout.write(`${JSON.stringify({ releaseStatus: report.releaseStatus, publicBeta: false, externalBlockers: report.blockers.length, backupRestore: report.operations.backupRestore })}\n`);
