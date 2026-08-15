import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { sourceTreeSha256 } from "./source-tree-hash.mjs";
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const output = resolve(option("--output", "artifacts/transparency/dashboard.json"));
const load = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const coverage = load("artifacts/curriculum-completeness/live-coverage.json");
const rights = load("artifacts/rights/report.json");
const aiEval = load("artifacts/ai-eval/report-500.json");
const privacy = load("artifacts/privacy/report.json");
const readiness = load("artifacts/production-readiness/report.json");
const releaseEvidence = load("artifacts/release/current-head-evidence.json");
const corrections = load("artifacts/corrections/report.json");
const wikimedia = load("artifacts/wikimedia/batch-300-report.json");
const aiComparison = load("artifacts/ai-eval/config-comparison.json");
const external = load("artifacts/operations/external-evidence-ledger.json");
const externalHandoff = load("artifacts/operations/external-evidence-handoff.json");
const rightsReview = load("artifacts/wikimedia/rights-review-ledger.json");
const contentHistory = load("artifacts/curriculum-completeness/published-content-history-plan.json");
const currentSourceTreeSha256 = sourceTreeSha256();
const pending = external.items.filter((item) => item.status !== "PASS").map((item) => item.id);
const binaryServingEnabled = rightsReview.binaryServingEnabled === true && Number(rightsReview.approvedForBinary ?? 0) > 0;
const catalogRecords = rights.records ?? [];
const report = {
  dashboardVersion: "transparency-v2",
  generatedAt: new Date().toISOString(),
  releaseStatus: "NOT_READY",
  publicBeta: false,
  coverage: { mandatory: coverage.summary ? `${coverage.summary.completeMandatoryRequirements}/${coverage.summary.mandatoryRequirements}` : "see source report", source: "artifacts/curriculum-completeness/live-coverage.json" },
  rights: {
    status: binaryServingEnabled ? rights.status : rightsReview.status,
    catalogStatus: rights.status,
    reviewStatus: rightsReview.status,
    approvedForBinary: Number(rightsReview.approvedForBinary ?? 0),
    binaryServingEnabled,
    servedBinary: binaryServingEnabled ? catalogRecords.filter((record) => record.publicBinaryAllowed).length : 0,
    linkOnly: binaryServingEnabled ? catalogRecords.filter((record) => !record.publicBinaryAllowed).length : catalogRecords.length,
  },
  ai: { status: aiEval.status, targetQuestions: aiEval.targetQuestions, actualQuestions: aiEval.actualQuestions, targetGap: aiEval.targetGap, citationPrecision: aiEval.metrics?.citationPrecision, injectionLeakRate: aiEval.metrics?.injectionLeakRate, publicBeta: false },
  privacy: { status: privacy.status, publicAi: privacy.publicAi },
  corrections: { lastIntake: corrections.status, slaHours: corrections.entry?.slaHours ?? null, reporterPublic: false },
  contentHistory: { status: contentHistory.status, publishedContent: contentHistory.publishedContent, candidateCount: contentHistory.candidateCount, databaseWrites: contentHistory.databaseWrites, fabricatedApproval: contentHistory.fabricatedApproval, councilApproval: contentHistory.councilApproval },
  operations: { readiness: readiness.status, fixedProductionDomain: readiness.external?.officialProduction === true, backupRestore: readiness.checks?.backupRestore?.status ?? "UNKNOWN", uptimeObservation: readiness.checks?.uptimeObservation?.status ?? "UNKNOWN", performanceObservation: readiness.checks?.performanceObservation?.status ?? "UNKNOWN", securityLocal: readiness.checks?.securityLocal?.status ?? "UNKNOWN", independentSecurity: readiness.checks?.securityLocal?.independentReview ?? "UNKNOWN" },
  release: { testedCommit: releaseEvidence.testedCommit ?? null, sourceTreeSha256: releaseEvidence.sourceTreeSha256 ?? null, currentSourceTreeSha256, sourceTreeMatches: releaseEvidence.sourceTreeSha256 === currentSourceTreeSha256 },
  wikimedia: { status: wikimedia.status, metadataRecords: wikimedia.imported, rightsStatus: wikimedia.rightsStatus, reviewStatus: wikimedia.reviewStatus, binaryDownloaded: wikimedia.binaryDownloaded, binaryServingEnabled: rightsReview.binaryServingEnabled === true, invalidMetadataCount: rightsReview.invalidMetadataCount ?? null },
  aiComparison: { status: aiComparison.status, configs: aiComparison.configs?.map((entry) => entry.config.id) ?? [], modelIndependence: aiComparison.modelIndependence, humanApproval: aiComparison.humanApproval },
  externalGates: (externalHandoff.rows ?? []).map((row) => ({ id: row.id, status: row.status, owner: row.owner ?? null, requiredOwnerRole: row.requiredOwnerRole, requiredEvidence: row.requiredEvidence, nextAction: row.nextAction })),
  blockers: pending,
  disclosure: "This dashboard reports implementation evidence only. It is not an independent historian council endorsement, legal approval, security review, school pilot result or Public Beta release approval.",
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Public transparency dashboard\n\n- Release: **NOT READY**\n- Public Beta: **DISABLED**\n- Mandatory coverage: ${report.coverage.mandatory}\n- AI eval: ${report.ai.actualQuestions}/${report.ai.targetQuestions}\n- Operations readiness: ${report.operations.readiness}\n- Backup/restore: ${report.operations.backupRestore}\n- Uptime observation: ${report.operations.uptimeObservation}\n- Performance observation: ${report.operations.performanceObservation}\n- Independent security: **${report.operations.independentSecurity}**\n- External blockers: ${report.blockers.length}\n- Published-history remediation: **${report.contentHistory.status}** (${report.contentHistory.candidateCount} candidates; database writes: ${report.contentHistory.databaseWrites})\n\n## Blockers\n\n${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}\n\n${report.disclosure}\n`);
process.stdout.write(`${JSON.stringify({ releaseStatus: report.releaseStatus, publicBeta: false, externalBlockers: report.blockers.length, backupRestore: report.operations.backupRestore })}\n`);
