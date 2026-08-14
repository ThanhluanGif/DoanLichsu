import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const datasetPath = resolve(option("--dataset", "artifacts/ai-eval/questions-500.json"));
const reportPath = resolve(option("--report", "artifacts/ai-eval/report-500.json"));
const output = resolve(option("--output", "artifacts/ai-eval/human-review-ledger.json"));
const validate = args.includes("--validate");
const requireApproved = args.includes("--require-approved");
const reviewerRoles = ["HISTORIAN", "CURRICULUM", "AI_SAFETY", "COUNCIL"];
const verdicts = ["APPROVE", "REJECT", "ABSTAIN"];
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const datasetSha256 = createHash("sha256").update(readFileSync(datasetPath)).digest("hex");
const reportSha256 = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
const existing = (() => { try { return JSON.parse(readFileSync(output, "utf8")); } catch { return null; } })();
const blankReviewFields = { reviewer1: null, reviewer1Role: null, reviewer1Authority: null, reviewer1Evidence: null, reviewer1Verdict: null, reviewer1At: null, reviewer2: null, reviewer2Role: null, reviewer2Authority: null, reviewer2Evidence: null, reviewer2Verdict: null, reviewer2At: null, conflict: null, councilDecision: null };
const rows = existing?.rows?.length === 500
  ? existing.rows.map((row) => ({ ...blankReviewFields, ...row }))
  : dataset.questions.map((question, index) => ({ id: question.id, ordinal: index + 1, category: question.category, question: question.question, expectedMachineStatus: question.expect, machineResult: report.results?.[index]?.actual ?? null, datasetSha256, reportSha256, ...blankReviewFields }));
const violations = [];
if (rows.length !== 500) violations.push("TOTAL_MUST_BE_500");
if (new Set(rows.map((row) => row.id)).size !== 500) violations.push("DUPLICATE_OR_MISSING_IDS");
for (const row of rows) {
  if (row.datasetSha256 !== datasetSha256 || row.reportSha256 !== reportSha256) violations.push(`${row.id}:SNAPSHOT_HASH_MISMATCH`);
  for (const reviewer of [1, 2]) {
    const verdict = row[`reviewer${reviewer}Verdict`];
    const identity = row[`reviewer${reviewer}`];
    const role = row[`reviewer${reviewer}Role`];
    const authority = row[`reviewer${reviewer}Authority`];
    const evidence = row[`reviewer${reviewer}Evidence`];
    const at = row[`reviewer${reviewer}At`];
    if (role != null && !reviewerRoles.includes(role)) violations.push(`${row.id}:INVALID_REVIEWER_ROLE_${reviewer}`);
    if (verdict != null && !verdicts.includes(verdict)) violations.push(`${row.id}:INVALID_VERDICT_${reviewer}`);
    if (at != null && Number.isNaN(Date.parse(at))) violations.push(`${row.id}:INVALID_TIMESTAMP_${reviewer}`);
    if (identity != null && verdict == null) violations.push(`${row.id}:REVIEWER_WITHOUT_VERDICT_${reviewer}`);
    if (verdict != null && (!identity || !role || !authority || !evidence || !at)) violations.push(`${row.id}:VERDICT_MISSING_IDENTITY_ROLE_AUTHORITY_TIMESTAMP_OR_EVIDENCE_${reviewer}`);
  }
  if (row.reviewer1 && row.reviewer2 && row.reviewer1 === row.reviewer2) violations.push(`${row.id}:SAME_REVIEWER_DUAL_APPROVAL`);
  if (row.reviewer1Verdict != null && row.reviewer2Verdict != null && row.reviewer1Verdict !== row.reviewer2Verdict) {
    if (row.conflict !== "OPEN") violations.push(`${row.id}:UNRESOLVED_VERDICT_CONFLICT`);
  }
  if (row.conflict != null && !["OPEN", "RESOLVED"].includes(row.conflict)) violations.push(`${row.id}:INVALID_CONFLICT_STATE`);
  if (row.councilDecision != null && !verdicts.includes(row.councilDecision)) violations.push(`${row.id}:INVALID_COUNCIL_DECISION`);
}
const approved = rows.filter((row) => row.reviewer1Verdict === "APPROVE" && row.reviewer2Verdict === "APPROVE").length;
const ledger = { version: "ai-human-review-v2", generatedAt: new Date().toISOString(), status: approved === 500 && violations.length === 0 ? "PASS_HUMAN_APPROVED" : "PENDING_HUMAN_REVIEW", total: rows.length, dualApproved: approved, rowsWithReviewerEvidence: rows.filter((row) => row.reviewer1Evidence || row.reviewer2Evidence).length, conflicts: rows.filter((row) => row.conflict != null).length, allowedReviewerRoles: reviewerRoles, violations, datasetSha256, reportSha256, noFabricatedReviewers: true, publicBeta: false, rows };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# AI human golden-set review ledger\n\n- Status: **${ledger.status}**\n- Rows: ${ledger.total}\n- Dual approved: ${ledger.dualApproved}/500\n- Rows with reviewer evidence: ${ledger.rowsWithReviewerEvidence}\n- Conflicts: ${ledger.conflicts}\n- Allowed reviewer roles: ${reviewerRoles.join(", ")}\n- Dataset SHA-256: ${datasetSha256}\n- Report SHA-256: ${reportSha256}\n- Reviewers/signatures: **PENDING until real identities, authority and evidence are supplied**\n- Public Beta: **DISABLED**\n`);
process.stdout.write(`${JSON.stringify({ status: ledger.status, total: ledger.total, dualApproved: ledger.dualApproved, rowsWithReviewerEvidence: ledger.rowsWithReviewerEvidence, conflicts: ledger.conflicts, violations: violations.length, datasetSha256, reportSha256 })}\n`);
if (requireApproved && (ledger.status !== "PASS_HUMAN_APPROVED" || violations.length > 0)) process.exitCode = 1;
if (validate && violations.length > 0) process.exitCode = 1;
