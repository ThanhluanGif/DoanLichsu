import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/public/ContentCard";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { Pagination } from "@/components/public/Pagination";
import { PublicShell } from "@/components/public/PublicShell";
import { UrlStateForm } from "@/components/public/SearchForm";
import { contentCollectionMessages,isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { contentCollectionPath,contentTypeFromLocaleSegment,homePath,withQuery } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";
type Params={locale:string;kind:string};
type Query=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
  const {locale:raw,kind}=await params;
  if(!isPublicLocale(raw))return{};
  const type=contentTypeFromLocaleSegment(raw,kind);
  if(!type)return{};
  const locale=raw;
  const other=locale==="vi"?"en":"vi";
  const copy=contentCollectionMessages[locale][type];
  return{title:copy.title,description:copy.lead,alternates:{canonical:contentCollectionPath(locale,type),languages:{[locale]:contentCollectionPath(locale,type),[other]:contentCollectionPath(other,type)}}};
}

export default async function ContentCollectionPage({params,searchParams}:{params:Promise<Params>;searchParams:Promise<Query>}){
  const {locale:raw,kind}=await params;
  if(!isPublicLocale(raw))notFound();
  const locale=raw;
  const type=contentTypeFromLocaleSegment(locale,kind);
  if(!type)notFound();

  const values=await searchParams;
  const page=Math.max(1,Number(one(values.page))||1);
  const defaultSort=type==="PERIOD"||type==="EVENT"?"chronology":"title";
  const allowedSorts=type==="PERIOD"||type==="EVENT"?["chronology","title","updated"]:["title","updated"];
  const requestedSort=one(values.sort);
  const sort=requestedSort&&allowedSorts.includes(requestedSort)?requestedSort:defaultSort;
  const requestedPeriod=one(values.period)?.trim()||undefined;
  const requestedTag=one(values.tag)?.trim()||undefined;
  const other=locale==="vi"?"en":"vi";
  const client=getPublicClient();

  const facetParams=(period?:string,tag?:string)=>{
    const query=new URLSearchParams({scope:"contents",type});
    if(period)query.set("period",period);
    if(tag)query.set("tag",tag);
    return query;
  };
  let period=requestedPeriod;
  let tag=requestedTag;
  let facets=await client.taxonomies(locale,facetParams(period,tag));
  if(period&&!facets.periods.some((option)=>option.value===period))period=undefined;
  if(tag&&!facets.tags.some((option)=>option.value===tag))tag=undefined;
  if(period!==requestedPeriod||tag!==requestedTag)facets=await client.taxonomies(locale,facetParams(period,tag));

  const apiQuery=new URLSearchParams({type,sort,page:String(page),pageSize:"12"});
  if(period)apiQuery.set("period",period);
  if(tag)apiQuery.set("tag",tag);
  const [result,periodMaps]=await Promise.all([
    client.contents(locale,apiQuery),
    period?Promise.all([client.periods(locale,true),client.periods(other,true)]):Promise.resolve(null),
  ]);
  const selectedPeriod=periodMaps?.[0].data.find((item)=>item.slug===period);
  const otherPeriod=selectedPeriod?periodMaps?.[1].data.find((item)=>item.id===selectedPeriod.id)?.slug:undefined;
  const collectionCopy=contentCollectionMessages[locale][type];
  const messages=t(locale);
  const unit=({PERIOD:messages.periodUnit,EVENT:messages.eventUnit,PERSON:messages.personUnit,ARTIFACT:messages.artifactUnit,TOPIC:locale==="vi"?"chủ đề":"topics"})[type];
  const sortLabels={chronology:messages.sortChronology,title:messages.sortTitle,updated:messages.sortUpdated};
  const hasFilters=Boolean(period||tag)||sort!==defaultSort;
  const paginationQuery={period,tag,sort};

  return <PublicShell locale={locale} localeHref={withQuery(contentCollectionPath(other,type),{period:otherPeriod,tag,sort:sort!==defaultSort?sort:undefined,page:page>1?page:undefined})}><main id="noi-dung" className="listing-main collection-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{messages.home}</Link><span>/</span><span aria-current="page">{collectionCopy.title}</span></nav>
    <header className="listing-header"><p className="eyebrow">{collectionCopy.eyebrow}</p><h1>{collectionCopy.title}</h1><p>{collectionCopy.lead}</p></header>
    <UrlStateForm className="collection-filter" action={contentCollectionPath(locale,type)} defaults={{sort:defaultSort,period:"",tag:""}}>
      <label htmlFor="collection-sort">{messages.sort}<select id="collection-sort" name="sort" defaultValue={sort}>{allowedSorts.map((value)=><option value={value} key={value}>{sortLabels[value as keyof typeof sortLabels]}</option>)}</select></label>
      {facets.periods.length?<label htmlFor="collection-period">{messages.filterPeriod}<select id="collection-period" name="period" defaultValue={period??""}><option value="">{messages.all}</option>{facets.periods.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      {facets.tags.length?<label htmlFor="collection-tag">{locale==="vi"?"Thẻ chủ đề":"Tag"}<select id="collection-tag" name="tag" defaultValue={tag??""}><option value="">{messages.all}</option>{facets.tags.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      <div className="collection-filter-actions"><button className="button secondary" type="submit">{locale==="vi"?"Áp dụng":"Apply"}</button>{hasFilters?<><Link className="text-link" href={contentCollectionPath(locale,type)}>{locale==="vi"?"Xóa bộ lọc":"Clear filters"}</Link><CopyLinkButton label={messages.copyLink} copiedLabel={messages.copied}/></>:null}</div>
    </UrlStateForm>
    <div className="collection-summary" aria-live="polite"><strong>{result.meta.total}</strong><span>{unit} {locale==="vi"?"đã xuất bản":"published"}</span></div>
    {result.data.length?<div className="content-grid collection-grid">{result.data.map((item,index)=><ContentCard item={item} locale={locale} priority={index<3} key={item.id}/>)}</div>:<section className="empty-state"><h2>{locale==="vi"?"Chưa có nội dung phù hợp":"No matching published entries"}</h2><p>{locale==="vi"?"Xóa bớt bộ lọc để xem lại danh mục đã xuất bản.":"Remove a filter to return to the published collection."}</p></section>}
    <Pagination meta={result.meta} locale={locale} path={contentCollectionPath(locale,type)} query={paginationQuery}/>
  </main></PublicShell>;
}
