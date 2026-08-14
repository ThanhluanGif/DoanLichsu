import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const datasetPath = resolve("artifacts/ai-eval/questions-500.json");
const reportPath = resolve("artifacts/ai-eval/report-500.json");
const output = resolve("artifacts/ai-eval/human-review-ledger.json");
const validate = process.argv.includes("--validate");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const datasetSha256 = createHash("sha256").update(readFileSync(datasetPath)).digest("hex");
const reportSha256 = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
const existing = (() => { try { return JSON.parse(readFileSync(output, "utf8")); } catch { return null; } })();
const rows = existing?.rows?.length === 500 ? existing.rows : dataset.questions.map((question, index) => ({ id: question.id, ordinal: index + 1, category: question.category, question: question.question, expectedMachineStatus: question.expect, machineResult: report.results?.[index]?.actual ?? null, datasetSha256, reportSha256, reviewer1: null, reviewer1Verdict: null, reviewer1At: null, reviewer2: null, reviewer2Verdict: null, reviewer2At: null, conflict: null, councilDecision: null }));
const violations = [];
if (rows.length !== 500) violations.push("TOTAL_MUST_BE_500");
if (new Set(rows.map((row) => row.id)).size !== 500) violations.push("DUPLICATE_OR_MISSING_IDS");
for (const row of rows) {
  if (row.datasetSha256 !== datasetSha256 || row.reportSha256 !== reportSha256) violations.push(`${row.id}:SNAPSHOT_HASH_MISMATCH`);
  for (const key of ["reviewer1Verdict", "reviewer2Verdict"]) if (row[key] != null && !["APPROVE", "REJECT", "ABSTAIN"].includes(row[key])) violations.push(`${row.id}:INVALID_VERDICT`);
  for (const key of ["reviewer1At", "reviewer2At"]) if (row[key] != null && Number.isNaN(Date.parse(row[key]))) violations.push(`${row.id}:INVALID_TIMESTAMP`);
  if (row.reviewer1Verdict === "APPROVE" && (!row.reviewer1 || !row.reviewer1At)) violations.push(`${row.id}:APPROVAL_MISSING_REVIEWER_EVIDENCE`);
  if (row.reviewer2Verdict === "APPROVE" && (!row.reviewer2 || !row.reviewer2At)) violations.push(`${row.id}:APPROVAL_MISSING_REVIEWER_EVIDENCE`);
}
const approved = rows.filter((row) => row.reviewer1Verdict === "APPROVE" && row.reviewer2Verdict === "APPROVE").length;
const ledger = { version: "ai-human-review-v1", generatedAt: new Date().toISOString(), status: approved === 500 && violations.length === 0 ? "PASS_HUMAN_APPROVED" : "PENDING_HUMAN_REVIEW", total: rows.length, dualApproved: approved, violations, datasetSha256, reportSha256, noFabricatedReviewers: true, publicBeta: false, rows };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# AI human golden-set review ledger\n\n- Status: **${ledger.status}**\n- Rows: ${ledger.total}\n- Dual approved: ${ledger.dualApproved}/500\n- Dataset SHA-256: ${datasetSha256}\n- Report SHA-256: ${reportSha256}\n- Reviewers/signatures: **PENDING; no identities fabricated**\n- Public Beta: **DISABLED**\n`);
process.stdout.write(`${JSON.stringify({ status: ledger.status, total: ledger.total, dualApproved: ledger.dualApproved, violations: violations.length, datasetSha256, reportSha256 })}\n`);
if (validate && (ledger.status !== "PASS_HUMAN_APPROVED" || violations.length > 0)) process.exitCode = 1;
