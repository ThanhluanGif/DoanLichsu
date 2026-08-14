import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(".");
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const input = resolve(option("--input", "artifacts/curriculum-completeness/published-content-review-packet.json"));
const output = resolve(option("--output", "artifacts/curriculum-completeness/published-history-packet-readiness.json"));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const isoTimestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const packet = JSON.parse(readFileSync(input, "utf8"));
const errors = [];
if (!packet || typeof packet !== "object" || Array.isArray(packet)) errors.push("PACKET_MUST_BE_OBJECT");
if (packet.version !== "published-content-review-packet-v1") errors.push("INVALID_PACKET_VERSION");
if (!new Set(["REQUIRES_HUMAN_REVIEW", "PASS_WITH_HUMAN_ROWS"]).has(packet.status)) errors.push("INVALID_PACKET_STATUS");
if (packet.publicBeta !== false) errors.push("PUBLIC_BETA_MUST_BE_FALSE");
if (packet.databaseWrites !== 0) errors.push("DATABASE_WRITES_MUST_BE_ZERO");
if (packet.fabricatedReviewers !== false) errors.push("FABRICATED_REVIEWERS_FLAG_MUST_BE_FALSE");
if (packet.councilApproval !== "NOT_EVALUATED") errors.push("COUNCIL_APPROVAL_MUST_REMAIN_NOT_EVALUATED");
const rows = Array.isArray(packet.rows) ? packet.rows : [];
if (packet.publishedContent !== 105 || rows.length !== 105) errors.push("PACKET_MUST_CONTAIN_105_PUBLISHED_ROWS");
const ids = rows.map((row) => row?.id);
if (ids.some((id) => !text(id))) errors.push("EVERY_ROW_NEEDS_ID");
if (new Set(ids).size !== ids.length) errors.push("DUPLICATE_CONTENT_ID");
const canonical = JSON.stringify(rows);
const computedPacketSha256 = createHash("sha256").update(canonical).digest("hex");
if (!/^[a-f0-9]{64}$/.test(packet.packetSha256 ?? "")) errors.push("PACKET_SHA256_REQUIRED");
else if (packet.packetSha256 !== computedPacketSha256) errors.push("PACKET_SHA256_MISMATCH");

let requiresHuman = 0;
let alreadyReviewed = 0;
for (const [index, row] of rows.entries()) {
  const label = `row[${index}]`;
  const locales = Array.isArray(row?.translations) ? row.translations.map((translation) => translation?.locale) : [];
  if (locales.length !== 2 || !locales.includes("vi") || !locales.includes("en")) errors.push(`${label}:BILINGUAL_TRANSLATIONS_REQUIRED`);
  if (!new Set(["READY", "MISSING_OR_UNVERIFIED"]).has(row?.reviewChecklist?.sourceLocatorStatus)) errors.push(`${label}:INVALID_SOURCE_READINESS`);
  if (!new Set(["READY", "MISSING_OR_UNVERIFIED"]).has(row?.reviewChecklist?.claimLocatorStatus)) errors.push(`${label}:INVALID_CLAIM_READINESS`);
  const history = row?.history ?? {};
  if (history.status === "REQUIRES_HUMAN_REVIEW") {
    requiresHuman += 1;
    for (const field of ["reviewer", "reviewerRole", "attestation", "evidenceLocator", "note", "reviewedAt"]) if (history[field] !== null && history[field] !== undefined) errors.push(`${label}:PENDING_${field.toUpperCase()}_MUST_BE_NULL`);
  } else if (history.status === "HUMAN_REVIEWED") {
    alreadyReviewed += 1;
    if (!text(history.reviewer) || !text(history.reviewerRole) || history.attestation !== "HUMAN_REVIEWED" || !text(history.evidenceLocator) || !text(history.note) || !isoTimestamp(history.reviewedAt)) errors.push(`${label}:PARTIAL_HUMAN_ATTESTATION`);
  } else errors.push(`${label}:INVALID_HISTORY_STATUS`);
}
if (packet.rowsRequiringHumanReview !== requiresHuman) errors.push("ROWS_REQUIRING_HUMAN_REVIEW_COUNT_MISMATCH");
if (packet.rowsAlreadyReviewed !== alreadyReviewed) errors.push("ROWS_ALREADY_REVIEWED_COUNT_MISMATCH");
if (requiresHuman + alreadyReviewed !== rows.length) errors.push("HISTORY_COUNTERS_MUST_COVER_ALL_ROWS");

const report = {
  version: "published-history-packet-readiness-v1",
  generatedAt: new Date().toISOString(),
  input: relative(root, input),
  packetSha256: computedPacketSha256,
  status: errors.length ? "BLOCKED_INTERNAL" : alreadyReviewed ? "PASS_WITH_HUMAN_ROWS" : "PASS_PACKET_PENDING_HUMAN",
  publishedContent: rows.length,
  rowsRequiringHumanReview: requiresHuman,
  rowsAlreadyReviewed: alreadyReviewed,
  humanGateComplete: rows.length === 105 && requiresHuman === 0 && alreadyReviewed === 105,
  releaseAllowed: false,
  publicBeta: false,
  databaseMutation: false,
  fabricatedReviewers: false,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Published-history packet readiness\n\n- Status: **${report.status}**\n- Published rows: ${report.publishedContent}\n- Requires human review: ${report.rowsRequiringHumanReview}\n- Already reviewed: ${report.rowsAlreadyReviewed}\n- Human gate complete: **NO**\n- Release allowed: **NO**\n- Public Beta: **DISABLED**\n- Database writes: **NO**\n- Errors: ${errors.length}\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, publishedContent: report.publishedContent, rowsRequiringHumanReview: report.rowsRequiringHumanReview, rowsAlreadyReviewed: report.rowsAlreadyReviewed, humanGateComplete: report.humanGateComplete, releaseAllowed: false, publicBeta: false, databaseMutation: false, errors: errors.length })}\n`);
if (errors.length) process.exitCode = 1;
