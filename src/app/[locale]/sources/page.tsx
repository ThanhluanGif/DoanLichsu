import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/public/Pagination";
import { PublicShell } from "@/components/public/PublicShell";
import { BookIcon } from "@/components/icons";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath,sourcesPath } from "@/lib/public-client/paths";
import { formatIsoDate } from "@/lib/public-client/presentation";

export const dynamic = "force-dynamic";
type Query = Record<string,string|string[]|undefined>;
const one = (value:string|string[]|undefined) => Array.isArray(value) ? value[0] : value;
const paginationQuery:Record<string,string|number|undefined> = {};

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale}=await params;if(!isPublicLocale(locale))return{};const copy=t(locale);const other=locale==="vi"?"en":"vi";
  return {title:copy.sourcesTitlePage,description:copy.sourcesLead,alternates:{canonical:sourcesPath(locale),languages:{[locale]:sourcesPath(locale),[other]:sourcesPath(other)}}};
}

export default async function SourcesPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Query>}) {
  const {locale:raw}=await params;if(!isPublicLocale(raw))notFound();const locale=raw;const copy=t(locale);const query=await searchParams;
  const page=Math.max(1,Number(one(query.page))||1);const sources=await getPublicClient().sources(locale,new URLSearchParams({page:String(page),pageSize:"20"}));const other=locale==="vi"?"en":"vi";
  return <PublicShell locale={locale} localeHref={sourcesPath(other)}><main id="noi-dung" className="listing-main sources-directory">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.navSources}</span></nav>
    <header className="listing-header"><p className="eyebrow">{copy.sourcesEyebrow}</p><h1>{copy.sourcesTitlePage}</h1><p>{copy.sourcesLead}</p></header>
    <div className="source-directory-summary"><BookIcon/><p><strong>{sources.meta.total}</strong> {copy.sourceUnit}</p></div>
    <ol className="source-directory-list" start={(sources.meta.page-1)*sources.meta.pageSize+1}>
      {sources.data.map((source)=><li className="source-directory-item" key={source.id} data-source-url={source.url}>
        <div><h2><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></h2><p>{[source.author,source.publisher,source.year].filter(Boolean).join(" · ")}</p></div>
        <div className="source-directory-meta"><span>{source.contentCount} {source.contentCount===1?copy.sourceUsedByOne:copy.sourceUsedByMany}</span><time dateTime={source.accessedAt}>{copy.sourcesAccessed} {formatIsoDate(source.accessedAt,locale)}</time><a href={source.url} target="_blank" rel="noreferrer" aria-label={`${copy.openSource}: ${source.title}`}>{new URL(source.url).hostname.replace(/^www\./,"")}</a></div>
      </li>)}
    </ol>
    <Pagination meta={sources.meta} locale={locale} path={sourcesPath(locale)} query={paginationQuery}/>
  </main></PublicShell>;
}
