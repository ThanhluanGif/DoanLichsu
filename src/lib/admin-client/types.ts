import type { AuthUser,Role } from "@/lib/auth/types";
import type { AssetProvenanceView,ClaimAssessment,ClaimEvidenceView,ClaimType,ContentType,DatePrecision,Locale,PageMeta,RightsStatus,SourceQualityTier,SourceType,VerificationStatus } from "@/lib/content/types";

export type { AuthUser,Role,AssetProvenanceView,ClaimAssessment,ClaimEvidenceView,ClaimType,ContentType,DatePrecision,Locale,PageMeta,RightsStatus,SourceQualityTier,SourceType,VerificationStatus };
export type WorkflowStatus="DRAFT"|"IN_REVIEW"|"REJECTED"|"APPROVED"|"PUBLISHED"|"ARCHIVED";
export type TranslationStatus="NOT_STARTED"|"TRANSLATING"|"READY_FOR_REVIEW"|"APPROVED"|"PUBLISHED";
export type EvidenceLocatorStatus="READY"|"MISSING_OR_UNVERIFIED";

export interface AdminTranslation { locale:Locale;id:string;version:number;title:string;slug:string;summary:string;body:string;seoTitle:string;seoDescription:string;translationStatus:TranslationStatus;updatedAt:string }
export interface AdminContentListItem { id:string;type:ContentType;status:WorkflowStatus;featured:boolean;version:number;titles:Partial<Record<Locale,string>>;updatedAt:string;updatedBy:string }
export interface AdminContentDetail extends AdminContentListItem { startDate:string|null;endDate:string|null;datePrecision:DatePrecision|null;periodId:string|null;location:string|null;result:string|null;role:string|null;artifactMeta:Record<string,string>|null;tagIds:string[];relatedIds:string[];sourceIds:string[];mediaIds:string[];translations:Partial<Record<Locale,AdminTranslation>> }
export interface PublishedHistoryQueueItem { id:string;type:ContentType;status:"PUBLISHED";version:number;titles:Partial<Record<Locale,string|null>>;translationStatuses:Partial<Record<Locale,TranslationStatus|null>>;sourceLocatorStatus:EvidenceLocatorStatus;claimLocatorStatus:EvidenceLocatorStatus;reviewedBy:string|null;reviewedAt:string|null;publishedAt:string|null;updatedAt:string }
export type CorrectionCategory="FACTUAL"|"SOURCE"|"TRANSLATION"|"ACCESSIBILITY"|"SAFETY"|"RIGHTS";
export type CorrectionUrgency="NORMAL"|"HIGH"|"CRITICAL";
export type CorrectionState="RECEIVED"|"TRIAGED"|"IN_REVIEW"|"NEEDS_COUNCIL"|"CORRECTED"|"DECLINED"|"ARCHIVED";
export interface AdminCorrectionView { id:string;contentId:string;contentTitle:string;category:CorrectionCategory;description:string;evidenceLocator:string;urgency:CorrectionUrgency;state:CorrectionState;slaHours:24|72;receivedAt:string;updatedAt:string;version:number;overdue:boolean }
export interface DashboardView { countsByStatus:Record<WorkflowStatus,number>;countsByType:Record<ContentType,number>;recentAudit:Array<{action:string;objectType:string;objectId:string|null;createdAt:string}> }
export interface AdminSourceView { id:string;title:string;author:string|null;publisher:string|null;year:number|null;url:string;accessedAt:string;citationNote:string|null;sourceType:SourceType;qualityTier:SourceQualityTier;institution:string|null;identifier:string|null;edition:string|null;archivedUrl:string|null;checksum:string|null;verificationStatus:VerificationStatus;verifiedBy:string|null;verifiedAt:string|null;verificationNote:string|null;version:number }
export interface AdminClaimView { id:string;contentId:string;claimType:ClaimType;assessment:ClaimAssessment;statementVi:string;statementEn:string;verificationStatus:VerificationStatus;version:number;verifiedBy:string|null;verifiedAt:string|null;verificationNote:string|null;evidence:ClaimEvidenceView[] }
export interface AdminMediaView { id:string;url:string;kind:"IMAGE"|"DOCUMENT";credit:string;license:string;alt:string;caption:string|null;width:number|null;height:number|null;provenance:AssetProvenanceView;version:number;altVi:string;altEn:string;captionVi:string|null;captionEn:string|null }
export interface UserView { id:string;email:string;displayName:string;role:Role;active:boolean;version:number;createdAt:string;updatedAt:string }
export interface AuditLogView { id:string;actor:AuthUser|null;action:string;objectType:string;objectId:string|null;metadata:Record<string,unknown>;createdAt:string }
export interface WorkflowResult { id:string;status:WorkflowStatus;version:number;translationStatuses:Partial<Record<Locale,TranslationStatus>>;reviewedBy:string|null;reviewedAt:string|null;publishedAt:string|null }
export interface ListResponse<T> { data:T[];meta:PageMeta }
export interface DataResponse<T> { data:T }
export interface ErrorDetails { fieldErrors?:Record<string,string[]>;violations?:string[] }
