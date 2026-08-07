"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentType,Locale,PeriodView } from "@/lib/public-client/types";
import { contentTypeLabels,t } from "@/lib/i18n/config";
import { searchPath } from "@/lib/public-client/paths";
import { SearchIcon } from "@/components/icons";

export function SearchForm({locale,periods,state}:{locale:Locale;periods:PeriodView[];state:{q?:string;type?:ContentType;period?:string;sort?:string}}) {
  const copy=t(locale);
  const router=useRouter();
  const [values,setValues]=useState(()=>({q:state.q??"",type:state.type??"",period:state.period??"",sort:state.sort??""}));
  useEffect(()=>{
    const syncFromUrl=()=>{const search=new URLSearchParams(window.location.search);setValues({q:search.get("q")??"",type:search.get("type")??"",period:search.get("period")??"",sort:search.get("sort")??""});};
    window.addEventListener("pageshow",syncFromUrl);window.addEventListener("popstate",syncFromUrl);
    return()=>{window.removeEventListener("pageshow",syncFromUrl);window.removeEventListener("popstate",syncFromUrl);};
  },[]);
  return <form className="search-form" action={searchPath(locale)} method="get" role="search" onSubmit={(event)=>{event.preventDefault();const params=new URLSearchParams();new FormData(event.currentTarget).forEach((value,key)=>params.set(key,String(value)));router.push(`${searchPath(locale)}?${params}`);}}>
    <label className="search-label" htmlFor="public-search">{copy.search}</label>
    <div className="search-input-row"><SearchIcon/><input id="public-search" name="q" value={values.q} onChange={(event)=>setValues({...values,q:event.target.value})} placeholder={copy.searchPlaceholder}/><button className="button primary" type="submit">{copy.search}</button></div>
    <div className="filter-grid">
      <label>{copy.filterType}<select name="type" value={values.type} onChange={(event)=>setValues({...values,type:event.target.value})}><option value="">{copy.all}</option>{(["EVENT","PERSON","ARTIFACT","TOPIC","PERIOD"] as ContentType[]).map((type)=><option value={type} key={type}>{contentTypeLabels[locale][type]}</option>)}</select></label>
      <label>{copy.filterPeriod}<select name="period" value={values.period} onChange={(event)=>setValues({...values,period:event.target.value})}><option value="">{copy.all}</option>{periods.map((period)=><option value={period.slug} key={period.id}>{period.title}</option>)}</select></label>
      <label>{copy.sort}<select name="sort" value={values.sort} onChange={(event)=>setValues({...values,sort:event.target.value})}><option value="">{copy.sortRelevance}</option><option value="chronology">{copy.sortChronology}</option><option value="updated">{copy.sortUpdated}</option><option value="title">{copy.sortTitle}</option></select></label>
    </div>
  </form>;
}
