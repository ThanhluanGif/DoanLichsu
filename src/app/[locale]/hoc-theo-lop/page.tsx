import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CurriculumCatalogPage } from "@/components/public/CurriculumCatalogPage";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { learnByGradePath } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale:raw}=await params;if(raw !== "vi" || !isPublicLocale(raw))return{};const locale=raw;const other="en";const copy=t(locale);
  return{title:copy.curriculumTitle,description:copy.curriculumLead,alternates:{canonical:learnByGradePath(locale),languages:{[locale]:learnByGradePath(locale),[other]:learnByGradePath(other),"x-default":learnByGradePath("vi")}}};
}

export default async function CurriculumCatalogRoute({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(raw !== "vi" || !isPublicLocale(raw))notFound();
  return <CurriculumCatalogPage locale={raw} data={await getPublicClient().curriculum(raw)}/>;
}
