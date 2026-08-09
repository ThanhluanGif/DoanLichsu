import type { ContentDetail,ContentListItem,ContentType,Locale,PageMeta,PeriodView,PublicSourceItem,SearchResult,TimelineItem } from "@/lib/content/types";

export type { ContentDetail,ContentListItem,ContentType,Locale,PageMeta,PeriodView,PublicSourceItem,SearchResult,TimelineItem };

export interface HomeView {
  featured: ContentListItem[];
  periods: PeriodView[];
  latest: ContentListItem[];
  counts: Record<ContentType,number>;
}

export interface TaxonomyView {
  periods: Array<{id:string;title:string;slug:string}>;
  tags: Array<{id:string;name:string;slug:string}>;
  types: ContentType[];
}

export interface DataResponse<T> { data:T }
export interface ListResponse<T> { data:T[];meta:PageMeta }
export interface ApiErrorShape { code:string;message:string;details?:{fieldErrors?:Record<string,string[]>;violations?:string[]};requestId:string }
