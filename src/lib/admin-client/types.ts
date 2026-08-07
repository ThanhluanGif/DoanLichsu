import type { AuthUser,Role } from "@/lib/auth/types";
import type { ContentType,DatePrecision,Locale,PageMeta } from "@/lib/content/types";

export type { AuthUser,Role,ContentType,DatePrecision,Locale,PageMeta };
export type WorkflowStatus="DRAFT"|"IN_REVIEW"|"REJECTED"|"APPROVED"|"PUBLISHED"|"ARCHIVED";
export type TranslationStatus="NOT_STARTED"|"TRANSLATING"|"READY_FOR_REVIEW"|"APPROVED"|"PUBLISHED";

export interface AdminTranslation { locale:Locale;id:string;version:number;title:string;slug:string;summary:string;body:string;seoTitle:string;seoDescription:string;translationStatus:TranslationStatus;updatedAt:string }
export interface AdminContentListItem { id:string;type:ContentType;status:WorkflowStatus;featured:boolean;version:number;titles:Partial<Record<Locale,string>>;updatedAt:string;updatedBy:string }
export interface AdminContentDetail extends AdminContentListItem { startDate:string|null;endDate:string|null;datePrecision:DatePrecision|null;periodId:string|null;location:string|null;result:string|null;role:string|null;artifactMeta:Record<string,string>|null;tagIds:string[];relatedIds:string[];sourceIds:string[];mediaIds:string[];translations:Partial<Record<Locale,AdminTranslation>> }
export interface DashboardView { countsByStatus:Record<WorkflowStatus,number>;countsByType:Record<ContentType,number>;recentAudit:Array<{action:string;objectType:string;objectId:string|null;createdAt:string}> }
export interface AdminSourceView { id:string;title:string;author:string|null;publisher:string|null;year:number|null;url:string;accessedAt:string;citationNote:string|null;version:number }
export interface AdminMediaView { id:string;url:string;kind:"IMAGE"|"DOCUMENT";credit:string;license:string;alt:string;caption:string|null;width:number|null;height:number|null;version:number;altVi:string;altEn:string;captionVi:string|null;captionEn:string|null }
export interface UserView { id:string;email:string;displayName:string;role:Role;active:boolean;version:number;createdAt:string;updatedAt:string }
export interface AuditLogView { id:string;actor:AuthUser|null;action:string;objectType:string;objectId:string|null;metadata:Record<string,unknown>;createdAt:string }
export interface WorkflowResult { id:string;status:WorkflowStatus;version:number;translationStatuses:Partial<Record<Locale,TranslationStatus>>;reviewedBy:string|null;reviewedAt:string|null;publishedAt:string|null }
export interface ListResponse<T> { data:T[];meta:PageMeta }
export interface DataResponse<T> { data:T }
export interface ErrorDetails { fieldErrors?:Record<string,string[]>;violations?:string[] }
