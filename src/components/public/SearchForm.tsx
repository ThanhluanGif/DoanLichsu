"use client";

import { useEffect,useRef,useState,type ReactNode } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { t } from "@/lib/i18n/config";
import { searchPath } from "@/lib/public-client/paths";
import type { ContentType,FacetView,Locale } from "@/lib/public-client/types";

type SearchState={q?:string;type?:ContentType;period?:string;tag?:string;sort?:string};

export function UrlStateForm({className,action,defaults,children}:{className:string;action:string;defaults:Record<string,string>;children:ReactNode}){
  const formRef=useRef<HTMLFormElement>(null);
  const searchParams=useSearchParams();
  const serializedQuery=searchParams.toString();
  const previousQuery=useRef(serializedQuery);
  useEffect(()=>{
    let syncVersion=0;
    const syncFromUrl=()=>{
      const search=new URLSearchParams(window.location.search);
      for(const [name,fallback] of Object.entries(defaults)){
        const field=formRef.current?.elements.namedItem(name);
        if(field instanceof HTMLSelectElement||field instanceof HTMLInputElement)field.value=search.get(name)??fallback;
      }
    };
    const syncAfterRestore=()=>{
      const version=++syncVersion;
      const syncIfCurrent=()=>{if(version===syncVersion)syncFromUrl();};
      syncIfCurrent();
      window.requestAnimationFrame(syncIfCurrent);
      window.setTimeout(syncIfCurrent,50);
    };
    const cancelPendingSync=()=>{syncVersion+=1;};
    const navigationType=()=>((performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming|undefined)?.type);
    const syncHistoryPage=(event:PageTransitionEvent)=>{if(event.persisted||navigationType()==="back_forward")syncAfterRestore();};
    const form=formRef.current;
    form?.addEventListener("input",cancelPendingSync);
    form?.addEventListener("change",cancelPendingSync);
    window.addEventListener("pageshow",syncHistoryPage);
    window.addEventListener("popstate",syncAfterRestore);
    if(previousQuery.current!==serializedQuery){previousQuery.current=serializedQuery;syncFromUrl();}
    else if(navigationType()==="back_forward")syncAfterRestore();
    return()=>{form?.removeEventListener("input",cancelPendingSync);form?.removeEventListener("change",cancelPendingSync);window.removeEventListener("pageshow",syncHistoryPage);window.removeEventListener("popstate",syncAfterRestore);};
  },[defaults,serializedQuery]);
  return <form ref={formRef} className={className} action={action} method="get">{children}</form>;
}

export function SearchForm({locale,facets,state}:{locale:Locale;facets:Pick<FacetView,"types"|"periods"|"tags">;state:SearchState}) {
  const copy=t(locale);
  const router=useRouter();
  const [values,setValues]=useState(()=>({q:state.q??"",type:state.type??"",period:state.period??"",tag:state.tag??"",sort:state.sort??""}));
  useEffect(()=>{
    const syncFromUrl=()=>{
      const search=new URLSearchParams(window.location.search);
      setValues({q:search.get("q")??"",type:search.get("type")??"",period:search.get("period")??"",tag:search.get("tag")??"",sort:search.get("sort")??""});
    };
    window.addEventListener("pageshow",syncFromUrl);
    window.addEventListener("popstate",syncFromUrl);
    return()=>{window.removeEventListener("pageshow",syncFromUrl);window.removeEventListener("popstate",syncFromUrl);};
  },[]);
  return <form className="search-form" action={searchPath(locale)} method="get" role="search" onSubmit={(event)=>{
    event.preventDefault();
    const params=new URLSearchParams();
    new FormData(event.currentTarget).forEach((value,key)=>{const normalized=String(value).trim();if(normalized)params.set(key,normalized);});
    const query=params.toString();
    router.push(`${searchPath(locale)}${query?`?${query}`:""}`);
  }}>
    <label className="search-label" htmlFor="public-search">{copy.search}</label>
    <div className="search-input-row"><SearchIcon/><input id="public-search" name="q" value={values.q} onChange={(event)=>setValues({...values,q:event.target.value})} placeholder={copy.searchPlaceholder}/><button className="button primary" type="submit">{copy.search}</button></div>
    <div className="filter-grid">
      {facets.types.length?<label>{copy.filterType}<select name="type" value={values.type} onChange={(event)=>setValues({...values,type:event.target.value})}><option value="">{copy.all}</option>{facets.types.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      {facets.periods.length?<label>{copy.filterPeriod}<select name="period" value={values.period} onChange={(event)=>setValues({...values,period:event.target.value})}><option value="">{copy.all}</option>{facets.periods.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      {facets.tags.length?<label>{locale==="vi"?"Thẻ chủ đề":"Tag"}<select name="tag" value={values.tag} onChange={(event)=>setValues({...values,tag:event.target.value})}><option value="">{copy.all}</option>{facets.tags.map((option)=><option value={option.value} key={option.value}>{option.label} ({option.publishedCount})</option>)}</select></label>:null}
      <label>{copy.sort}<select name="sort" value={values.sort} onChange={(event)=>setValues({...values,sort:event.target.value})}><option value="">{copy.sortRelevance}</option><option value="chronology">{copy.sortChronology}</option><option value="updated">{copy.sortUpdated}</option><option value="title">{copy.sortTitle}</option></select></label>
    </div>
  </form>;
}
