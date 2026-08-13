import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "artifacts/operations/pilot-ledger.json"));
const output = resolve(option("--output", "artifacts/operations/pilot-validation.json"));
const ledger = JSON.parse(readFileSync(input, "utf8"));
const participants = ledger.participants ?? [];
const piiPattern = /(email|phone|full.?name|address|school.?name|student.?id|số điện thoại|họ tên|địa chỉ|tên trường)/i;
const violations = [];
for (const participant of participants) {
  if (!participant.consent || !participant.consent.obtainedAt || participant.consent.status !== "APPROVED") violations.push({ id: participant.id ?? null, error: "MISSING_CONSENT" });
  if (piiPattern.test(JSON.stringify(participant))) violations.push({ id: participant.id ?? null, error: "DIRECT_IDENTIFIER_OR_PII" });
  if (!participant.arm || !["AI", "NO_AI"].includes(participant.arm)) violations.push({ id: participant.id ?? null, error: "MISSING_AI_NO_AI_ARM" });
  if (participant.comprehension?.pre == null || participant.comprehension?.post == null) violations.push({ id: participant.id ?? null, error: "MISSING_COMPREHENSION_DELTA" });
}
const report = { generatedAt: new Date().toISOString(), status: participants.length === 0 && violations.length === 0 ? "PASS_TEMPLATE_PENDING_REAL_PILOT" : violations.length ? "FAIL" : "PENDING_REAL_PILOT", participantCount: participants.length, violations, realPilotCompleted: false, consentRequired: true, guardianProcessRequiredWhenApplicable: true, noFabricatedParticipants: participants.length === 0, databaseMutation: false };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Pilot ledger validation\n\n- Status: **${report.status}**\n- Participants: ${report.participantCount}\n- Consent required: **YES**\n- Real pilot completed: **NO CLAIM**\n- Direct identifiers: **REJECTED**\n- Violations: ${report.violations.length}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, participantCount: report.participantCount, violations: report.violations.length })}\n`);
if (report.status === "FAIL") process.exitCode = 1;
