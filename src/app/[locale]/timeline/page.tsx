import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { Pagination } from "@/components/public/Pagination";
import { PublicShell } from "@/components/public/PublicShell";
import { UrlStateForm } from "@/components/public/SearchForm";
import { TimelineList } from "@/components/public/TimelineList";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath,timelinePath,withQuery } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";
type Query=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  if(!isPublicLocale(locale))return{};
  const copy=t(locale);
  const other=locale==="vi"?"en":"vi";
  return{title:copy.timelineTitlePage,description:copy.timelineLead,alternates:{canonical:timelinePath(locale),languages:{[locale]:timelinePath(locale),[other]:timelinePath(other)}}};
}

export default async function TimelinePage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Query>}){
  const {locale:raw}=await params;
  if(!isPublicLocale(raw))notFound();
  const locale=raw;
  const query=await searchParams;
  const copy=t(locale);
  const requestedPeriod=one(query.period)?.trim()||undefined;
  const requestedTag=one(query.tag)?.trim()||undefined;
  const page=Math.max(1,Number(one(query.page))||1);
  const other=locale==="vi"?"en":"vi";
  const client=getPublicClient();

  const facetParams=(period?:string,tag?:string)=>{
    const params=new URLSearchParams({scope:"timeline"});
    if(period)params.set("period",period);
    if(tag)params.set("tag",tag);
    return params;
  };
  let period=requestedPeriod;
  let tag=requestedTag;
  let facets=await client.taxonomies(locale,facetParams(period,tag));
  if(period&&!facets.periods.some((option)=>option.value===period))period=undefined;
  if(tag&&!facets.tags.some((option)=>option.value===tag))tag=undefined;
  if(period!==requestedPeriod||tag!==requestedTag)facets=await client.taxonomies(locale,facetParams(period,tag));

  const apiQuery=new URLSearchParams({page:String(page),pageSize:"12"});
  if(period)apiQuery.set("period",period);
  if(tag)apiQuery.set("tag",tag);
  const [timeline,periodMaps]=await Promise.all([
    client.timeline(locale,apiQuery),
    period?Promise.all([client.periods(locale,true),client.periods(other,true)]):Promise.resolve(null),
  ]);
  const selectedPeriod=periodMaps?.[0].data.find((item)=>item.slug===period);
  const otherPeriod=selectedPeriod?periodMaps?.[1].data.find((item)=>item.id===selectedPeriod.id)?.slug:undefined;
  const hasFilters=Boolean(period||tag);

  return <PublicShell locale={locale} localeHref={withQuery(timelinePath(other),{period:otherPeriod,tag,page:page>1?page:undefined})}><main id="noi-dung" className="listing-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.navTimeline}</span></nav>
    <header className="listing-header"><p className="eyebrow">{copy.timelineEyebrow}</p><h1>{copy.timelineTitlePage}</h1><p>{copy.timelineLead}</p></header>
    <UrlStateForm className="timeline-filter" action={timelinePath(locale)} defaults={{period:"",tag:""}}>
      {facets.periods.length?<label htmlFor="period-filter">{copy.filterPeriod}<select id="period-filter" name="period" defaultValue={period??""}><option value="">{copy.all}</option>{facets.periods.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      {facets.tags.length?<label htmlFor="timeline-tag">{locale==="vi"?"Thẻ chủ đề":"Tag"}<select id="timeline-tag" name="tag" defaultValue={tag??""}><option value="">{copy.all}</option>{facets.tags.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      <div className="collection-filter-actions"><button className="button secondary" type="submit">{locale==="vi"?"Áp dụng":"Apply"}</button>{hasFilters?<><Link className="text-link" href={timelinePath(locale)}>{locale==="vi"?"Xóa bộ lọc":"Clear filters"}</Link><CopyLinkButton label={copy.copyLink} copiedLabel={copy.copied}/></>:null}</div>
    </UrlStateForm>
    {timeline.data.length?<TimelineList items={timeline.data} locale={locale}/>:<div className="empty-state"><h2>{copy.emptyTimeline}</h2><p>{locale==="vi"?"Xóa bớt bộ lọc để trở lại dòng thời gian.":"Remove a filter to return to the timeline."}</p></div>}
    <Pagination meta={timeline.meta} locale={locale} path={timelinePath(locale)} query={{period,tag}}/>
  </main></PublicShell>;
}
