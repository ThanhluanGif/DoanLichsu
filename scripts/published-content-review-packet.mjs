import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const databasePath = resolve(option("--database", process.env.DATABASE_PATH || "data/quan-su-viet.db"));
const output = resolve(option("--output", process.env.OUTPUT || "artifacts/curriculum-completeness/published-content-review-packet.json"));
const generatedAt = new Date().toISOString();

const writeReport = (report) => {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(output.replace(/\.json$/, ".md"), [
    "# Published content review packet",
    "",
    `- Status: **${report.status}**`,
    `- Published content: ${report.publishedContent}`,
    `- Published translations: ${report.publishedTranslations}`,
    `- Rows requiring human review: ${report.rowsRequiringHumanReview}`,
    `- Packet SHA-256: \`${report.packetSha256 || "—"}\``,
    `- Database writes: **${report.databaseWrites ? "YES" : "NO"}**`,
    `- Fabricated reviewers: **${report.fabricatedReviewers ? "YES" : "NO"}**`,
    "",
    "Every reviewer/signature field is intentionally blank until an authorised human completes the review.",
    "This packet is a handoff aid, not Council approval or Public Beta evidence.",
    "",
  ].join("\n"));
  process.stdout.write(`${JSON.stringify({
    output,
    status: report.status,
    publishedContent: report.publishedContent,
    publishedTranslations: report.publishedTranslations,
    rowsRequiringHumanReview: report.rowsRequiringHumanReview,
    packetSha256: report.packetSha256,
    databaseWrites: report.databaseWrites,
    fabricatedReviewers: report.fabricatedReviewers,
  })}\n`);
};

const database = new Database(databasePath, { readonly: true, fileMustExist: true });
try {
  const translationRows = database.prepare(`
    SELECT n.id,n.type,n.version,n.reviewed_by AS reviewedBy,n.reviewed_at AS reviewedAt,
      n.published_at AS publishedAt,n.updated_at AS updatedAt,
      t.locale,t.title,t.slug,t.summary,t.translation_status AS translationStatus,
      t.version AS translationVersion,lt.as_of AS asOf
    FROM content_nodes n
    JOIN content_translations t ON t.node_id=n.id
    LEFT JOIN lesson_translations lt ON lt.content_id=n.id AND lt.locale=t.locale
    WHERE n.status='PUBLISHED'
    ORDER BY n.id,t.locale
  `).all();
  const sourceRows = database.prepare(`
    SELECT cs.content_id AS contentId,s.id,s.title,s.url,
      s.verification_status AS verificationStatus,s.source_type AS sourceType,
      s.quality_tier AS qualityTier,s.accessed_at AS accessedAt,s.institution,
      s.identifier,s.checksum
    FROM content_sources cs JOIN sources s ON s.id=cs.source_id
    JOIN content_nodes n ON n.id=cs.content_id
    WHERE n.status='PUBLISHED'
    ORDER BY cs.content_id,s.id
  `).all();
  const claimRows = database.prepare(`
    SELECT c.content_id AS contentId,c.id,c.claim_type AS claimType,c.assessment,
      c.statement_vi AS statementVi,c.statement_en AS statementEn,
      c.verification_status AS verificationStatus,ce.source_id AS sourceId,
      ce.locator,ce.note
    FROM content_claims c
    JOIN claim_evidence ce ON ce.claim_id=c.id
    JOIN content_nodes n ON n.id=c.content_id
    WHERE n.status='PUBLISHED'
    ORDER BY c.content_id,c.id,ce.source_id
  `).all();
  const reviewRows = database.prepare(`
    SELECT a.object_id AS contentId,a.actor_id AS actorId,a.metadata,a.created_at AS auditCreatedAt,
      u.display_name AS reviewer,u.role AS reviewerRole
    FROM audit_logs a
    LEFT JOIN users u ON u.id=a.actor_id
    WHERE a.object_type='content' AND a.action='content.editorial_history.review'
    ORDER BY a.created_at DESC,a.id DESC
  `).all();
  const reviewByContent = new Map();
  for (const row of reviewRows) {
    if (reviewByContent.has(row.contentId)) continue;
    let metadata = {};
    try { metadata = JSON.parse(row.metadata ?? "{}"); } catch { metadata = {}; }
    reviewByContent.set(row.contentId, {
      status: "HUMAN_REVIEWED",
      reviewer: row.reviewer ?? null,
      reviewerRole: row.reviewerRole ?? null,
      attestation: metadata.attestation ?? null,
      evidenceLocator: metadata.evidenceLocator ?? null,
      note: metadata.note ?? null,
      reviewedAt: metadata.reviewedAt ?? row.auditCreatedAt ?? null,
    });
  }

  const byContent = new Map();
  for (const row of translationRows) {
    const entry = byContent.get(row.id) ?? {
      id: row.id,
      type: row.type,
      version: row.version,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      translations: [],
      sources: [],
      claims: [],
    };
    entry.translations.push({
      locale: row.locale,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      translationStatus: row.translationStatus,
      translationVersion: row.translationVersion,
      asOf: row.asOf ?? null,
    });
    byContent.set(row.id, entry);
  }
  for (const row of sourceRows) {
    const entry = byContent.get(row.contentId);
    if (!entry) continue;
    entry.sources.push({
      id: row.id,
      title: row.title,
      url: row.url,
      verificationStatus: row.verificationStatus,
      sourceType: row.sourceType,
      qualityTier: row.qualityTier,
      accessedAt: row.accessedAt,
      institution: row.institution,
      identifier: row.identifier,
      checksum: row.checksum,
    });
  }
  for (const row of claimRows) {
    const entry = byContent.get(row.contentId);
    if (!entry) continue;
    entry.claims.push({
      id: row.id,
      claimType: row.claimType,
      assessment: row.assessment,
      statementVi: row.statementVi,
      statementEn: row.statementEn,
      verificationStatus: row.verificationStatus,
      sourceId: row.sourceId,
      locator: row.locator,
      note: row.note,
    });
  }

  const rows = [...byContent.values()].map((entry) => ({
    ...entry,
    history: reviewByContent.get(entry.id) ?? {
      status: "REQUIRES_HUMAN_REVIEW",
      reviewer: null,
      reviewerRole: null,
      attestation: null,
      evidenceLocator: null,
      note: null,
      reviewedAt: null,
    },
  }));
  const violations = [];
  for (const row of rows) {
    const locales = row.translations.map((translation) => translation.locale);
    if (row.translations.length !== 2 || !locales.includes("vi") || !locales.includes("en")) violations.push({ id: row.id, reason: "bilingual translations required" });
    if (!row.version || row.translations.some((translation) => !translation.translationVersion)) violations.push({ id: row.id, reason: "missing translation version" });
    if (!row.sources.length || row.sources.some((source) => source.verificationStatus !== "VERIFIED" || !source.url || !source.accessedAt)) violations.push({ id: row.id, reason: "missing verified source locator" });
    if (!row.claims.length || row.claims.some((claim) => claim.verificationStatus !== "VERIFIED" || !claim.sourceId || !claim.locator)) violations.push({ id: row.id, reason: "missing verified claim locator" });
  }
  const sourceClaimGapIds = new Set(violations.filter((violation) => violation.reason.includes("source") || violation.reason.includes("claim")).map((violation) => violation.id));
  for (const row of rows) {
    row.reviewChecklist = {
      sourceLocatorStatus: row.sources.length && row.sources.every((source) => source.verificationStatus === "VERIFIED" && source.url && source.accessedAt) ? "READY" : "MISSING_OR_UNVERIFIED",
      claimLocatorStatus: row.claims.length && row.claims.every((claim) => claim.verificationStatus === "VERIFIED" && claim.sourceId && claim.locator) ? "READY" : "MISSING_OR_UNVERIFIED",
      reviewer: row.history.status === "HUMAN_REVIEWED" ? row.history.reviewer : null,
      reviewerRole: row.history.status === "HUMAN_REVIEWED" ? row.history.reviewerRole : null,
      evidenceLocator: row.history.status === "HUMAN_REVIEWED" ? row.history.evidenceLocator : null,
      note: row.history.status === "HUMAN_REVIEWED" ? row.history.note : null,
      attestation: row.history.status === "HUMAN_REVIEWED" ? row.history.attestation : null,
    };
  }
  const canonical = JSON.stringify(rows);
  const report = {
    version: "published-content-review-packet-v1",
    generatedAt,
    database: databasePath,
    status: rows.some((row) => row.history.status === "HUMAN_REVIEWED") ? "PASS_WITH_HUMAN_ROWS" : "REQUIRES_HUMAN_REVIEW",
    publishedContent: rows.length,
    publishedTranslations: rows.reduce((count, row) => count + row.translations.filter((translation) => translation.translationStatus === "PUBLISHED").length, 0),
    translationRows: rows.reduce((count, row) => count + row.translations.length, 0),
    rowsWithUnpublishedTranslations: rows.filter((row) => row.translations.some((translation) => translation.translationStatus !== "PUBLISHED")).length,
    rowsWithSourceClaimGaps: sourceClaimGapIds.size,
    rowsRequiringHumanReview: rows.filter((row) => row.history.status === "REQUIRES_HUMAN_REVIEW").length,
    rowsAlreadyReviewed: rows.filter((row) => row.history.status === "HUMAN_REVIEWED").length,
    packetSha256: createHash("sha256").update(canonical).digest("hex"),
    databaseWrites: 0,
    fabricatedReviewers: false,
    councilApproval: "NOT_EVALUATED",
    publicBeta: false,
    violations,
    rows,
  };
  writeReport(report);
} catch (error) {
  writeReport({
    version: "published-content-review-packet-v1",
    generatedAt,
    database: databasePath,
    status: "BLOCKED_PACKET",
    publishedContent: 0,
    publishedTranslations: 0,
    translationRows: 0,
    rowsWithUnpublishedTranslations: 0,
    rowsRequiringHumanReview: 0,
    packetSha256: null,
    databaseWrites: 0,
    fabricatedReviewers: false,
    councilApproval: "NOT_EVALUATED",
    publicBeta: false,
    violations: [{ reason: String(error) }],
    rows: [],
  });
  process.exitCode = 1;
} finally {
  database.close();
}
