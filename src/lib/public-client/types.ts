import type { ContentDetail,ContentListItem,ContentType,Locale,PageMeta,PeriodView,PublicSourceItem,SearchResult,SourceContentRef,TimelineItem } from "@/lib/content/types";

export type { ContentDetail,ContentListItem,ContentType,Locale,PageMeta,PeriodView,PublicSourceItem,SearchResult,SourceContentRef,TimelineItem };

export interface HomeView {
  featured: ContentListItem[];
  periods: PeriodView[];
  latest: ContentListItem[];
  counts: Record<ContentType,number>;
}

export interface FacetOption { value:string;label:string;publishedCount:number;verifiedCount:number }
export interface FacetView {
  grades:FacetOption[];
  topics:FacetOption[];
  periods:FacetOption[];
  tags:FacetOption[];
  types:FacetOption[];
}

export interface DataResponse<T> { data:T }
export interface ListResponse<T> { data:T[];meta:PageMeta }
export interface ApiErrorShape { code:string;message:string;details?:{fieldErrors?:Record<string,string[]>;violations?:string[]};requestId:string }
