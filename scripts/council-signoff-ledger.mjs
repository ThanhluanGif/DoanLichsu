import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "artifacts/governance/council-signoff-ledger.json"));
const output = resolve(option("--output", "artifacts/governance/council-signoff-validation.json"));
const ledger = JSON.parse(readFileSync(input, "utf8"));
const members = ledger.members ?? [];
const reviews = ledger.dualReviews ?? [];
const errors = [];
if (members.length < 3) errors.push("MINIMUM_THREE_COUNCIL_MEMBERS");
for (const member of members) {
  for (const field of ["id", "expertise", "coiStatus", "coiDocument", "activeFrom"]) if (!member[field]) errors.push(`${member.id ?? "unknown"}:MISSING_${field}`);
}
if (reviews.length === 0) errors.push("NO_DUAL_REVIEWS");
for (const review of reviews) {
  if (!review.reviewer1 || !review.reviewer2 || review.reviewer1 === review.reviewer2) errors.push(`${review.id ?? "unknown"}:INVALID_DUAL_REVIEW`);
  if (!review.scope || !review.decision || !review.reviewedAt) errors.push(`${review.id ?? "unknown"}:INCOMPLETE_REVIEW`);
}
const signoff = ledger.releaseCandidateSignoff;
if (!signoff?.candidateId || !signoff?.signedBy || !signoff?.signedAt || !signoff?.signatureReference) errors.push("MISSING_RELEASE_CANDIDATE_SIGNOFF");
const report = { generatedAt: new Date().toISOString(), status: errors.length === 0 ? "PASS_COUNCIL_SIGNED" : "PENDING_COUNCIL_SIGNOFF", memberCount: members.length, dualReviewCount: reviews.length, errors, noFabricatedIdentities: members.length === 0 && reviews.length === 0 && !signoff, publicReleaseAllowed: errors.length === 0, databaseMutation: false };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Council sign-off validation\n\n- Status: **${report.status}**\n- Members: ${report.memberCount}\n- Dual reviews: ${report.dualReviewCount}\n- Errors: ${report.errors.length}\n- Public release allowed: **${report.publicReleaseAllowed ? "YES" : "NO"}**\n- Identities fabricated: **NO**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, memberCount: report.memberCount, dualReviewCount: report.dualReviewCount, errors: report.errors.length })}\n`);
if (report.status !== "PASS_COUNCIL_SIGNED") process.exitCode = 1;
