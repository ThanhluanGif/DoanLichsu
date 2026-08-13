import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const databasePath = resolve(process.env.DATABASE_PATH || "data/quan-su-viet.db");
const output = resolve(process.env.OUTPUT || "artifacts/curriculum-completeness/published-content-history-plan.json");
const database = new Database(databasePath, { readonly: true });

const rows = database.prepare(`
  SELECT n.id, n.type, n.reviewed_by AS reviewedBy, n.reviewed_at AS reviewedAt,
    n.published_at AS publishedAt, n.created_at AS createdAt, n.updated_at AS updatedAt,
    t.locale, t.translation_status AS translationStatus, t.version AS translationVersion
  FROM content_nodes n
  JOIN content_translations t ON t.node_id = n.id
  WHERE n.status = 'PUBLISHED'
  ORDER BY n.id, t.locale
`).all();
const existing = new Set(database.prepare("SELECT object_id FROM audit_logs WHERE object_type='content' AND object_id IS NOT NULL").all().map((row) => row.object_id));
database.close();

const byId = new Map();
for (const row of rows) {
  const entry = byId.get(row.id) ?? {
    contentId: row.id,
    type: row.type,
    locales: [],
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    translations: [],
    candidateActions: ["VERIFY_EXISTING_PROVENANCE", "REVIEW_EDITORIAL_HISTORY", "RECORD_APPROVED_HISTORY"],
    disposition: "REQUIRES_HUMAN_REVIEW",
    fabricatedApproval: false,
  };
  entry.locales.push(row.locale);
  entry.translations.push({ locale: row.locale, translationStatus: row.translationStatus, version: row.translationVersion });
  byId.set(row.id, entry);
}

const candidates = [...byId.values()].filter((entry) => !existing.has(entry.contentId));
const report = {
  version: "published-content-history-plan-v1",
  generatedAt: new Date().toISOString(),
  database: databasePath,
  status: "REQUIRES_HUMAN_REVIEW",
  publishedContent: byId.size,
  existingHistoryContent: byId.size - candidates.length,
  candidateCount: candidates.length,
  databaseWrites: 0,
  fabricatedApproval: false,
  councilApproval: "NOT_EVALUATED",
  candidates,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), [
  "# Published content history remediation plan",
  "",
  `- Status: **${report.status}**`,
  `- Published content: ${report.publishedContent}`,
  `- Existing history content: ${report.existingHistoryContent}`,
  `- Candidates requiring human review: ${report.candidateCount}`,
  `- Database writes: **${report.databaseWrites}**`,
  "- Fabricated approval: **NO**",
  "- Council approval: **NOT EVALUATED**",
  "",
  "This is a read-only queue. No audit history is created by this generator.",
  "",
].join("\n"));
process.stdout.write(`${JSON.stringify({ status: report.status, publishedContent: report.publishedContent, candidateCount: report.candidateCount, databaseWrites: report.databaseWrites })}\n`);
