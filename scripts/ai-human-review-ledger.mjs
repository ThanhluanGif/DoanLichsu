import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const datasetPath = resolve("artifacts/ai-eval/questions-500.json");
const reportPath = resolve("artifacts/ai-eval/report-500.json");
const output = resolve("artifacts/ai-eval/human-review-ledger.json");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const datasetSha256 = createHash("sha256").update(readFileSync(datasetPath)).digest("hex");
const reportSha256 = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
const rows = dataset.questions.map((question, index) => ({ id: question.id, ordinal: index + 1, category: question.category, question: question.question, expectedMachineStatus: question.expect, machineResult: report.results?.[index]?.actual ?? null, datasetSha256, reportSha256, reviewer1: null, reviewer1Verdict: null, reviewer1At: null, reviewer2: null, reviewer2Verdict: null, reviewer2At: null, conflict: null, councilDecision: null }));
const approved = rows.filter((row) => row.reviewer1Verdict === "APPROVE" && row.reviewer2Verdict === "APPROVE").length;
const ledger = { version: "ai-human-review-v1", generatedAt: new Date().toISOString(), status: approved === 500 ? "PASS_HUMAN_APPROVED" : "PENDING_HUMAN_REVIEW", total: rows.length, dualApproved: approved, datasetSha256, reportSha256, noFabricatedReviewers: true, publicBeta: false, rows };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# AI human golden-set review ledger\n\n- Status: **${ledger.status}**\n- Rows: ${ledger.total}\n- Dual approved: ${ledger.dualApproved}/500\n- Dataset SHA-256: ${datasetSha256}\n- Report SHA-256: ${reportSha256}\n- Reviewers/signatures: **PENDING; no identities fabricated**\n- Public Beta: **DISABLED**\n`);
process.stdout.write(`${JSON.stringify({ status: ledger.status, total: ledger.total, dualApproved: ledger.dualApproved, datasetSha256, reportSha256 })}\n`);
if (ledger.status !== "PASS_HUMAN_APPROVED") process.exitCode = 1;
