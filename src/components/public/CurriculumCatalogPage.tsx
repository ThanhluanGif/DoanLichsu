import Link from "next/link";
import type { CurriculumCatalogView,Locale } from "@/lib/content/types";
import { CurriculumGradeCard } from "@/components/public/CurriculumGradeCard";
import { PublicShell } from "@/components/public/PublicShell";
import { t } from "@/lib/i18n/config";
import { homePath,learnByGradePath } from "@/lib/public-client/paths";

export function CurriculumCatalogPage({locale,data}:{locale:Locale;data:CurriculumCatalogView}) {
  const copy=t(locale);
  const other=locale === "vi" ? "en" : "vi";
  return <PublicShell locale={locale} localeHref={learnByGradePath(other)}>
    <main id="noi-dung" className="listing-main curriculum-main">
      <nav className="breadcrumbs" aria-label={locale === "vi" ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.navCurriculum}</span></nav>
      <header className="listing-header curriculum-catalog-header"><p className="eyebrow">{copy.curriculumEyebrow}</p><h1>{copy.curriculumTitle}</h1><p>{copy.curriculumLead}</p></header>
      <section className="curriculum-grade-grid" aria-label={copy.curriculumTitle}>
        {data.grades.filter((grade)=>grade.publishedRequirementCount>0 && grade.publishedLessonCount>0).map((grade)=><CurriculumGradeCard grade={grade} locale={locale} key={grade.grade}/>)}
      </section>
      {!data.grades.some((grade)=>grade.publishedRequirementCount>0 && grade.publishedLessonCount>0)?<section className="empty-state curriculum-empty"><h2>{copy.curriculumNoPublished}</h2><p>{copy.curriculumLead}</p></section>:null}
    </main>
  </PublicShell>;
}
