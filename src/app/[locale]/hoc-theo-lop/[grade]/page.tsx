import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CurriculumGradePage } from "@/components/public/CurriculumGradePage";
import { grades,type Grade } from "@/lib/content/types";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { learnByGradePath } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";
const parseGrade=(value:string):Grade|undefined=>{const grade=Number(value);return Number.isInteger(grade)&&grades.includes(grade as Grade)?grade as Grade:undefined;};

export async function generateMetadata({params}:{params:Promise<{locale:string;grade:string}>}):Promise<Metadata>{
  const {locale:raw,grade:rawGrade}=await params;const grade=parseGrade(rawGrade);if(raw !== "vi" || !isPublicLocale(raw)||grade===undefined)return{};const locale=raw;const other="en";
  const copy=t(locale);return{title:`${copy.curriculumGrade} ${grade} · ${copy.curriculumTitle}`,description:copy.curriculumLead,alternates:{canonical:learnByGradePath(locale,grade),languages:{[locale]:learnByGradePath(locale,grade),[other]:learnByGradePath(other,grade)}}};
}

export default async function CurriculumGradeRoute({params}:{params:Promise<{locale:string;grade:string}>}){
  const {locale:raw,grade:rawGrade}=await params;const grade=parseGrade(rawGrade);if(raw !== "vi" || !isPublicLocale(raw)||grade===undefined)notFound();
  return <CurriculumGradePage locale={raw} data={await getPublicClient().curriculumGrade(raw,grade)}/>;
}
