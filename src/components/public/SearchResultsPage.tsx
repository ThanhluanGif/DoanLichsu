import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "./PublicShell";
import { SearchForm } from "./SearchForm";
import { ContentCard } from "./ContentCard";
import { Pagination } from "./Pagination";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import type { ContentType } from "@/lib/content/types";
import { contentTypes } from "@/lib/content/types";
import { homePath,searchPath,withQuery } from "@/lib/public-client/paths";

type Query=Record<string,string|string[]|undefined>;const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export async function SearchResultsPage({locale:raw,searchParams}:{locale:string;searchParams:Promise<Query>}){
  if(!isPublicLocale(raw))notFound();const locale=raw;const values=await searchParams;const copy=t(locale);const q=one(values.q)?.trim()??"";const typeValue=one(values.type);const type=contentTypes.includes(typeValue as ContentType)?typeValue as ContentType:undefined;const period=one(values.period)||undefined;const sort=one(values.sort)||undefined;const page=Math.max(1,Number(one(values.page))||1);
  const client=getPublicClient();const apiValues=Object.entries({q,type,period,sort,page:String(page),pageSize:"10"}).filter(([,value])=>value).map(([key,value])=>[key,String(value)]);
  const [periods,result]=await Promise.all([client.periods(locale,true),q?client.search(locale,new URLSearchParams(apiValues)):(type||period)?client.contents(locale,new URLSearchParams(apiValues.filter(([key])=>key!=="q"))):Promise.resolve(null)]);
  const other=locale==="vi"?"en":"vi";const preserved={q,type,period,sort,page:page>1?page:undefined};
  return <PublicShell locale={locale} localeHref={withQuery(searchPath(other),preserved)}><main id="noi-dung" className="search-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.search}</span></nav>
    <header className="search-heading"><p className="eyebrow">{copy.searchEyebrow}</p><h1>{copy.searchTitle}</h1><p>{copy.searchHint}</p></header>
    <SearchForm key={`${q}|${type??""}|${period??""}|${sort??""}`} locale={locale} periods={periods.data} state={{q,type,period,sort}}/>
    {!result&&!q?<section className="search-prompt"><h2>{locale==="vi"?"Bắt đầu bằng một từ khóa hoặc bộ lọc":"Start with a search term or filter"}</h2><p>{locale==="vi"?"Ví dụ: dien bien phu, Sự kiện, hoặc một thời kỳ.":"For example: dien bien phu, Events, or a historical period."}</p></section>:result?.data.length?<section className="results-section" aria-live="polite"><div className="result-count"><strong>{result.meta.total} {copy.results}</strong>{q?<span>{copy.forQuery} “{q}”</span>:<span>{locale==="vi"?"trong bộ lọc đã chọn":"in the selected filters"}</span>}</div><div className="result-list">{result.data.map((item)=><ContentCard item={item} locale={locale} variant="compact" key={item.id}/>)}</div><Pagination meta={result.meta} locale={locale} path={searchPath(locale)} query={{q,type,period,sort}}/></section>:<section className="empty-state" aria-live="polite"><h2>{copy.noResults}</h2><p>{copy.noResultsHint}</p></section>}
  </main></PublicShell>;
}
