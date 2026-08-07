import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { TimelineList } from "@/components/public/TimelineList";
import { Pagination } from "@/components/public/Pagination";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath,timelinePath,withQuery } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";
type Query=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;if(!isPublicLocale(locale))return{};const copy=t(locale);const other=locale==="vi"?"en":"vi";return{title:copy.timelineTitlePage,description:copy.timelineLead,alternates:{canonical:timelinePath(locale),languages:{[locale]:timelinePath(locale),[other]:timelinePath(other)}}};}

export default async function TimelinePage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Query>}){
  const {locale:raw}=await params;if(!isPublicLocale(raw))notFound();const locale=raw;const query=await searchParams;const copy=t(locale);
  const period=one(query.period);const page=Math.max(1,Number(one(query.page))||1);const apiQuery=new URLSearchParams({page:String(page),pageSize:"12"});if(period)apiQuery.set("period",period);
  const client=getPublicClient();const [timeline,periods]=await Promise.all([client.timeline(locale,apiQuery),client.periods(locale,true)]);const other=locale==="vi"?"en":"vi";
  const switchQuery=withQuery("",{period,page:page>1?page:undefined});
  return <PublicShell locale={locale} localeHref={timelinePath(other,switchQuery)}><main id="noi-dung" className="listing-main">
    <nav className="breadcrumbs" aria-label={locale==="vi"?"Đường dẫn":"Breadcrumb"}><Link href={homePath(locale)}>{copy.home}</Link><span>/</span><span aria-current="page">{copy.navTimeline}</span></nav>
    <header className="listing-header"><p className="eyebrow">{copy.timelineEyebrow}</p><h1>{copy.timelineTitlePage}</h1><p>{copy.timelineLead}</p></header>
    <form className="timeline-filter" action={timelinePath(locale)} method="get"><label htmlFor="period-filter">{copy.filterPeriod}</label><select id="period-filter" name="period" defaultValue={period??""}><option value="">{copy.all}</option>{periods.data.map((item)=><option value={item.slug} key={item.id}>{item.title}</option>)}</select><button className="button secondary" type="submit">{locale==="vi"?"Áp dụng":"Apply"}</button></form>
    {timeline.data.length?<TimelineList items={timeline.data} locale={locale}/>:<div className="empty-state"><h2>{copy.emptyTimeline}</h2><p>{locale==="vi"?"Chọn “Tất cả” để trở lại toàn bộ dòng thời gian.":"Choose “All” to return to the full timeline."}</p></div>}
    <Pagination meta={timeline.meta} locale={locale} path={timelinePath(locale)} query={{period}}/>
  </main></PublicShell>;
}
