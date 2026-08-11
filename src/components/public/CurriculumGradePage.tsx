import Link from "next/link";
import type { CurriculumGradeView,Locale } from "@/lib/content/types";
import { ArrowRightIcon,BookIcon } from "@/components/icons";
import { ContentCard } from "@/components/public/ContentCard";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { PublicShell } from "@/components/public/PublicShell";
import { t } from "@/lib/i18n/config";
import { homePath,learnByGradePath } from "@/lib/public-client/paths";

export function CurriculumGradePage({locale,data}:{locale:Locale;data:CurriculumGradeView}) {
  const copy=t(locale);
  const other=locale === "vi" ? "en" : "vi";
  const published=data.requirements.filter((requirement)=>requirement.publishedCount>0 && requirement.lessons.length>0);
  const mandatory=published.filter((requirement)=>requirement.track === "MANDATORY");
  const elective=published.filter((requirement)=>requirement.track === "ELECTIVE");
  const groups=[{track:"MANDATORY" as const,label:copy.curriculumMandatory,items:mandatory},{track:"ELECTIVE" as const,label:copy.curriculumElective,items:elective}].filter((group)=>group.items.length>0);
  const coverageLabel=data.summary.verifiedRequirementCount===data.summary.requirementCount && data.summary.requirementCount>0?copy.curriculumCoverageComplete:copy.curriculumCoveragePending;
  return <PublicShell locale={locale} localeHref={learnByGradePath(other,data.grade)}>
    <main id="noi-dung" className="listing-main curriculum-main">
      <nav className="breadcrumbs" aria-label={locale === "vi" ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><Link href={learnByGradePath(locale)}>{copy.navCurriculum}</Link><span>/</span><span aria-current="page">{data.label}</span></nav>
      <header className="listing-header curriculum-grade-header">
        <p className="eyebrow">{copy.curriculumEyebrow}</p>
        <h1>{data.label}</h1>
        <p>{copy.curriculumLead}</p>
        <div className="curriculum-coverage-strip" aria-label={coverageLabel}>
          <div><strong>{data.summary.publishedRequirementCount}</strong><span>{copy.curriculumPublished}</span></div>
          <div><strong>{data.summary.verifiedRequirementCount}</strong><span>{copy.curriculumVerified}</span></div>
          <div><strong>{data.summary.requirementCount}</strong><span>{copy.curriculumRequirements}</span></div>
          <p><BookIcon/>{coverageLabel}</p>
        </div>
      </header>
      <div className="curriculum-grade-meta"><span>{copy.curriculumAsOf}</span><div className="curriculum-grade-actions"><Link className="text-link" href={learnByGradePath(locale)}><ArrowRightIcon className="icon-left"/>{copy.curriculumBack}</Link><CopyLinkButton label={copy.copyLink} copiedLabel={copy.copied}/></div></div>
      {groups.length?groups.map((group)=><section className="curriculum-requirement-group" aria-labelledby={`curriculum-${group.track.toLowerCase()}`} key={group.track}>
        <div className="section-heading"><div><p className="eyebrow">{group.track === "MANDATORY" ? "MANDATORY" : "ELECTIVE"}</p><h2 id={`curriculum-${group.track.toLowerCase()}`}>{group.label}</h2></div><span className="curriculum-group-count">{group.items.length} {copy.curriculumRequirements}</span></div>
        <div className="curriculum-requirements">{group.items.map((requirement)=><article className="curriculum-requirement" data-coverage-status={requirement.coverageStatus} key={requirement.id}>
          <div className="curriculum-requirement-heading"><div><p className="curriculum-requirement-status">{requirement.verifiedCount>0?copy.curriculumVerifiedStatus:copy.curriculumPublishedStatus}</p><h3>{requirement.topic}</h3></div><span className="curriculum-requirement-count">{requirement.lessons.length} {locale === "vi" ? "bài" : "entries"}</span></div>
          <details className="curriculum-requirement-source"><summary>{copy.curriculumSource}</summary><p>{requirement.officialProgramRef}</p></details>
          {requirement.requiredOutcomes.length?<details className="curriculum-requirement-outcomes"><summary>{copy.curriculumOutcomes}</summary><ul>{requirement.requiredOutcomes.map((outcome)=><li key={outcome}>{outcome}</li>)}</ul></details>:null}
          <div className="content-grid curriculum-lessons">{requirement.lessons.map((lesson)=><ContentCard item={lesson} locale={locale} variant="compact" key={lesson.id}/>)}</div>
        </article>)}</div>
      </section>):<section className="empty-state curriculum-empty"><h2>{copy.curriculumNoPublished}</h2><p>{copy.curriculumLead}</p></section>}
      <Link className="text-link curriculum-back-link" href={learnByGradePath(locale)}><ArrowRightIcon className="icon-left"/>{copy.curriculumBack}<ArrowRightIcon/></Link>
    </main>
  </PublicShell>;
}
