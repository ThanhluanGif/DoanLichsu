import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/public/ContentCard";
import { Pagination } from "@/components/public/Pagination";
import { PublicShell } from "@/components/public/PublicShell";
import { contentCollectionMessages,isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { contentCollectionPath,contentTypeFromLocaleSegment,homePath,withQuery } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";
type Params={locale:string;kind:string};type Query=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
const emptyQuery:Record<string,string|number|undefined>={};

export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{const {locale:raw,kind}=await params;if(!isPublicLocale(raw))return{};const type=contentTypeFromLocaleSegment(raw,kind);if(!type)return{};const locale=raw;const other=locale==="vi"?"en":"vi";const copy=contentCollectionMessages[locale][type];return{title:copy.title,description:copy.lead,alternates:{canonical:contentCollectionPath(locale,type),languages:{[locale]:contentCollectionPath(locale,type),[other]:contentCollectionPath(other,type)}}};}

export default async function ContentCollectionPage({params,searchParams}:{params:Promise<Params>;searchParams:Promise<Query>}){const {locale:raw,kind}=await params;if(!isPublicLocale(raw))notFound();const locale=raw;const type=contentTypeFromLocaleSegment(locale,kind);if(!type)notFound();const values=await searchParams;const page=Math.max(1,Number(one(values.page))||1);const sort=type==="PERIOD"||type==="EVENT"?"chronology":"title";const result=await getPublicClient().contents(locale,new URLSearchParams({type,sort,page:String(page),pageSize:"12"}));const other=locale==="vi"?"en":"vi";const copy=contentCollectionMessages[locale][type];const unit=({PERIOD:t(locale).periodUnit,EVENT:t(locale).eventUnit,PERSON:t(locale).personUnit,ARTIFACT:t(locale).artifactUnit,TOPIC:locale==="vi"?"chủ đề":"topics"})[type];
  return <PublicShell locale={locale} localeHref={withQuery(contentCollectionPath(other,type),{page:page>1?page:undefined})}><main id="noi-dung" className="listing-main collection-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{t(locale).home}</Link><span>/</span><span aria-current="page">{copy.title}</span></nav>
    <header className="listing-header"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.lead}</p></header>
    <div className="collection-summary" aria-live="polite"><strong>{result.meta.total}</strong><span>{unit} {locale==="vi"?"đã xuất bản":"published"}</span></div>
    {result.data.length?<div className="content-grid collection-grid">{result.data.map((item)=><ContentCard item={item} locale={locale} key={item.id}/>)}</div>:<section className="empty-state"><h2>{locale==="vi"?"Chưa có nội dung đã xuất bản":"No published entries yet"}</h2><p>{locale==="vi"?"Danh mục sẽ được bổ sung sau khi nội dung hoàn tất kiểm duyệt.":"This collection will grow as entries complete editorial review."}</p></section>}
    <Pagination meta={result.meta} locale={locale} path={contentCollectionPath(locale,type)} query={emptyQuery}/>
  </main></PublicShell>;
}
