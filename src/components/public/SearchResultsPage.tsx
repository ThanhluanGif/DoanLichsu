import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "./ContentCard";
import { CopyLinkButton } from "./CopyLinkButton";
import { Pagination } from "./Pagination";
import { PublicShell } from "./PublicShell";
import { SearchForm } from "./SearchForm";
import { contentTypes,type ContentType } from "@/lib/content/types";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath,searchPath,withQuery } from "@/lib/public-client/paths";

type Query=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export async function SearchResultsPage({locale:raw,searchParams}:{locale:string;searchParams:Promise<Query>}){
  if(!isPublicLocale(raw))notFound();
  const locale=raw;
  const values=await searchParams;
  const copy=t(locale);
  const q=one(values.q)?.trim()??"";
  const typeValue=one(values.type);
  const requestedType=contentTypes.includes(typeValue as ContentType)?typeValue as ContentType:undefined;
  const requestedPeriod=one(values.period)?.trim()||undefined;
  const requestedTag=one(values.tag)?.trim()||undefined;
  const sortValue=one(values.sort);
  const sort=sortValue&&["chronology","updated","title"].includes(sortValue)?sortValue:undefined;
  const page=Math.max(1,Number(one(values.page))||1);
  const client=getPublicClient();

  const facetParams=(type?:ContentType,period?:string,tag?:string)=>{
    const query=new URLSearchParams({scope:q?"search":"contents"});
    if(q)query.set("q",q);
    if(type)query.set("type",type);
    if(period)query.set("period",period);
    if(tag)query.set("tag",tag);
    return query;
  };
  let type=requestedType;
  let period=requestedPeriod;
  let tag=requestedTag;
  let facets=await client.taxonomies(locale,facetParams(type,period,tag));
  if(type&&!facets.types.some((option)=>option.value===type))type=undefined;
  if(period&&!facets.periods.some((option)=>option.value===period))period=undefined;
  if(tag&&!facets.tags.some((option)=>option.value===tag))tag=undefined;
  if(type!==requestedType||period!==requestedPeriod||tag!==requestedTag)facets=await client.taxonomies(locale,facetParams(type,period,tag));

  const apiValues=Object.entries({q,type,period,tag,sort,page:String(page),pageSize:"10"}).filter(([,value])=>value).map(([key,value])=>[key,String(value)]);
  const [result,periodMaps]=await Promise.all([
    q?client.search(locale,new URLSearchParams(apiValues)):(type||period||tag)?client.contents(locale,new URLSearchParams(apiValues.filter(([key])=>key!=="q"))):Promise.resolve(null),
    period?Promise.all([client.periods(locale,true),client.periods(locale==="vi"?"en":"vi",true)]):Promise.resolve(null),
  ]);
  const selectedPeriod=periodMaps?.[0].data.find((item)=>item.slug===period);
  const otherPeriod=selectedPeriod?periodMaps?.[1].data.find((item)=>item.id===selectedPeriod.id)?.slug:undefined;
  const other=locale==="vi"?"en":"vi";
  const preserved={q:q||undefined,type,period:otherPeriod,tag,sort,page:page>1?page:undefined};
  const hasState=Boolean(q||type||period||tag||sort);

  return <PublicShell locale={locale} localeHref={withQuery(searchPath(other),preserved)}><main id="noi-dung" className="search-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.search}</span></nav>
    <header className="search-heading"><p className="eyebrow">{copy.searchEyebrow}</p><h1>{copy.searchTitle}</h1><p>{copy.searchHint}</p></header>
    <SearchForm key={`${q}|${type??""}|${period??""}|${tag??""}|${sort??""}`} locale={locale} facets={facets} state={{q,type,period,tag,sort}}/>
    {hasState?<div className="collection-filter-actions"><Link className="text-link" href={searchPath(locale)}>{locale==="vi"?"Xóa bộ lọc":"Clear filters"}</Link><CopyLinkButton label={copy.copyLink} copiedLabel={copy.copied}/></div>:null}
    {!result&&!q?<section className="search-prompt"><h2>{locale==="vi"?"Bắt đầu bằng một từ khóa hoặc bộ lọc":"Start with a search term or filter"}</h2><p>{locale==="vi"?"Ví dụ: dien bien phu, Sự kiện, hoặc một thời kỳ.":"For example: dien bien phu, Events, or a historical period."}</p></section>:result?.data.length?<section className="results-section" aria-live="polite"><div className="result-count"><strong>{result.meta.total} {copy.results}</strong>{q?<span>{copy.forQuery} “{q}”</span>:<span>{locale==="vi"?"trong bộ lọc đã chọn":"in the selected filters"}</span>}</div><div className="result-list">{result.data.map((item)=><ContentCard item={item} locale={locale} variant="compact" key={item.id}/>)}</div><Pagination meta={result.meta} locale={locale} path={searchPath(locale)} query={{q:q||undefined,type,period,tag,sort}}/></section>:<section className="empty-state" aria-live="polite"><h2>{copy.noResults}</h2><p>{copy.noResultsHint}</p></section>}
  </main></PublicShell>;
}
