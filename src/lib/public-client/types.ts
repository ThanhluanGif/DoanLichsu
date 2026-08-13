import type { AssetProvenanceView,ContentDetail,ContentListItem,ContentType,CurriculumCatalogView,CurriculumGradeView,Locale,PageMeta,PeriodView,PublicSourceItem,RightsStatus,SearchResult,SourceContentRef,TimelineItem,PlaceView,ReconstructionListItem,ReconstructionView } from "@/lib/content/types";

export type { AssetProvenanceView,ContentDetail,ContentListItem,ContentType,CurriculumCatalogView,CurriculumGradeView,Locale,PageMeta,PeriodView,PublicSourceItem,RightsStatus,SearchResult,SourceContentRef,TimelineItem,PlaceView,ReconstructionListItem,ReconstructionView };

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
