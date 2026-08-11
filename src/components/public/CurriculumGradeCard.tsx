import Link from "next/link";
import type { CurriculumGradeSummary,Locale } from "@/lib/content/types";
import { ArrowRightIcon } from "@/components/icons";
import { t } from "@/lib/i18n/config";
import { learnByGradePath } from "@/lib/public-client/paths";

export function CurriculumGradeCard({grade,locale}:{grade:CurriculumGradeSummary;locale:Locale}) {
  const copy=t(locale);
  const verifiedLabel=grade.fullCoverage?copy.curriculumCoverageComplete:copy.curriculumCoveragePending;
  return <article className="curriculum-grade-card" data-grade-card={grade.grade}>
    <div className="curriculum-grade-card-top">
      <p className="curriculum-grade-number">{copy.curriculumGrade} <strong>{grade.grade}</strong></p>
      <span className={`coverage-badge${grade.fullCoverage?" verified":" pending"}`}>{verifiedLabel}</span>
    </div>
    <h2><Link href={learnByGradePath(locale,grade.grade)}>{grade.label}</Link></h2>
    <p className="curriculum-grade-summary"><strong>{grade.publishedRequirementCount}</strong> / {grade.requirementCount} {copy.curriculumRequirements} {copy.curriculumPublished}</p>
    <dl className="curriculum-grade-stats">
      <div><dt>{copy.curriculumPublished}</dt><dd>{grade.publishedLessonCount}</dd></div>
      <div><dt>{copy.curriculumVerified}</dt><dd>{grade.verifiedRequirementCount}/{grade.requirementCount}</dd></div>
    </dl>
    <Link className="card-link curriculum-grade-link" href={learnByGradePath(locale,grade.grade)} aria-label={`${locale === "vi" ? "Mở" : "Open"} ${grade.label}`}><span>{locale === "vi" ? "Xem chủ đề" : "View topics"}</span><ArrowRightIcon/></Link>
  </article>;
}
