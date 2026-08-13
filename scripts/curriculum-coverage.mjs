import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const value = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const databasePath = resolve(value("--database", process.env.DATABASE_PATH || "data/quan-su-viet.db"));
const outputPath = value("--output", null);
if (!existsSync(databasePath)) throw new Error(`Database not found: ${databasePath}`);

const database = new Database(databasePath, { readonly: true });
const locales = ["vi", "en"];
const grades = [6, 7, 8, 9, 10, 11, 12];
const requirements = database.prepare("SELECT id, grade, track, topic_vi, topic_en, official_program_ref FROM curriculum_requirements WHERE track='MANDATORY' ORDER BY grade, sort_order, id").all();

function localeLesson(row, locale) {
  const lessonRows = database.prepare(`
    SELECT DISTINCT n.id, t.slug, t.title, t.translation_status, n.status, n.reviewed_by, n.reviewed_at,
      n.published_at, n.updated_at, lt.learning_objectives, lt.original_summary, lt.analysis, lt.as_of
    FROM content_curriculum cc
    JOIN content_nodes n ON n.id=cc.content_id
    JOIN content_translations t ON t.node_id=n.id AND t.locale=? AND t.translation_status='PUBLISHED'
    JOIN lesson_translations lt ON lt.content_id=n.id AND lt.locale=?
    WHERE cc.requirement_id=? AND n.status='PUBLISHED'
    ORDER BY n.id
  `).all(locale, locale, row.id);
  return lessonRows.map((lesson) => {
    const sourceRows = database.prepare(`
      SELECT s.id, s.url, s.accessed_at, s.source_type, s.quality_tier, s.verification_status
      FROM content_sources cs JOIN sources s ON s.id=cs.source_id WHERE cs.content_id=? ORDER BY cs.sort_order,s.id
    `).all(lesson.id);
    const claimRows = database.prepare(`
      SELECT c.id FROM content_claims c WHERE c.content_id=? AND c.verification_status='VERIFIED'
        AND EXISTS (SELECT 1 FROM claim_evidence ce WHERE ce.claim_id=c.id)
        AND NOT EXISTS (SELECT 1 FROM claim_evidence ce JOIN sources s ON s.id=ce.source_id WHERE ce.claim_id=c.id AND s.verification_status<>'VERIFIED')
    `).all(lesson.id);
    const complete = sourceRows.length > 0 && sourceRows.every((source) => /^https:\/\//.test(source.url) && source.accessed_at && source.source_type && source.quality_tier && source.verification_status === "VERIFIED") && claimRows.length > 0 && lesson.reviewed_by && lesson.reviewed_at && lesson.published_at && lesson.updated_at && lesson.as_of && JSON.parse(lesson.learning_objectives).length > 0 && lesson.original_summary && lesson.analysis;
    return { id: lesson.id, slug: lesson.slug, title: lesson.title, sourceCount: sourceRows.length, verifiedClaimCount: claimRows.length, reviewer: lesson.reviewed_by, asOf: lesson.as_of, provenance: complete, complete };
  });
}

const mandatory = requirements.map((row) => {
  const localesReport = Object.fromEntries(locales.map((locale) => { const lessons = localeLesson(row, locale); return [locale, { lessons, complete: lessons.some((lesson) => lesson.complete) }]; }));
  return { id: row.id, grade: row.grade, track: row.track, topic: { vi: row.topic_vi, en: row.topic_en }, officialProgramRef: row.official_program_ref, locales: localesReport, complete: locales.every((locale) => localesReport[locale].complete) };
});

const elective = database.prepare("SELECT grade, COUNT(*) AS requirements FROM curriculum_requirements WHERE track='ELECTIVE' GROUP BY grade ORDER BY grade").all();
const gradeSummary = grades.map((grade) => { const rows = mandatory.filter((row) => row.grade === grade); return { grade, requirementCount: rows.length, completeRequirementCount: rows.filter((row) => row.complete).length, fullCoverage: rows.length > 0 && rows.every((row) => row.complete) }; });
const publishedContent = database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE status='PUBLISHED'").get().count;
const emptyFacets = database.prepare(`
  SELECT grade FROM curriculum_requirements r
  WHERE r.track='MANDATORY' AND EXISTS (SELECT 1 FROM content_curriculum cc WHERE cc.requirement_id=r.id)
  GROUP BY grade HAVING COUNT(DISTINCT r.id) <> COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM content_curriculum cc2 JOIN content_nodes n ON n.id=cc2.content_id JOIN content_translations t ON t.node_id=n.id AND t.translation_status='PUBLISHED' WHERE cc2.requirement_id=r.id
  ) THEN r.id END)
`).all().map((row) => row.grade);
const report = { generatedAt: new Date().toISOString(), database: databasePath, schemaVersion: database.prepare("SELECT MAX(version) AS version FROM schema_migrations").get().version, status: mandatory.every((row) => row.complete) && gradeSummary.every((row) => row.fullCoverage) && emptyFacets.length === 0 ? "PASS" : "FAIL", rules: { mandatoryRequiresBothLocales: true, mandatoryRequiresSourceClaimReviewerProvenance: true, electiveSeparate: true, emptyFacetsFail: true }, summary: { mandatoryRequirements: mandatory.length, completeMandatoryRequirements: mandatory.filter((row) => row.complete).length, publishedContent, gradesPassing: gradeSummary.filter((row) => row.fullCoverage).length, emptyFacets }, grades: gradeSummary, mandatory, elective };
database.close();
if (outputPath) { mkdirSync(dirname(resolve(outputPath)), { recursive: true }); writeFileSync(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`); }
process.stdout.write(`${JSON.stringify(report)}\n`);
if (report.status !== "PASS") process.exitCode = 1;
