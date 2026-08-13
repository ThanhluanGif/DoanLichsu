export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export const contentTypes = ["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"] as const;
export type ContentType = (typeof contentTypes)[number];
export type DatePrecision = "DAY" | "MONTH" | "YEAR" | "APPROXIMATE";
export const verificationStatuses = ["DRAFT", "NEEDS_REVIEW", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];
export const sourceTypes = [
  "PRIMARY_RECORD", "ARCHIVE_CATALOG", "MUSEUM_CATALOG", "SCHOLARLY_BOOK",
  "PEER_REVIEWED_ARTICLE", "REFERENCE_WORK", "CONTEMPORARY_PRESS", "ORAL_HISTORY",
  "DISCOVERY_ONLY",
] as const;
export type SourceType = (typeof sourceTypes)[number];
export const sourceQualityTiers = [
  "TIER_1_PRIMARY", "TIER_2_INSTITUTIONAL", "TIER_3_SCHOLARLY",
  "TIER_4_CONTEXTUAL", "TIER_5_DISCOVERY",
] as const;
export type SourceQualityTier = (typeof sourceQualityTiers)[number];
export const rightsStatuses = ["UNKNOWN", "LINK_ONLY", "PERMITTED", "PUBLIC_DOMAIN"] as const;
export type RightsStatus = (typeof rightsStatuses)[number];
export const claimTypes = ["DATE", "PLACE", "PERSON_ROLE", "OUTCOME", "INTERPRETATION", "CONTEXT"] as const;
export type ClaimType = (typeof claimTypes)[number];
export const claimAssessments = ["CONFIRMED", "DISPUTED"] as const;
export type ClaimAssessment = (typeof claimAssessments)[number];
export const grades = [6,7,8,9,10,11,12] as const;
export type Grade = (typeof grades)[number];
export const curriculumTracks = ["MANDATORY","ELECTIVE"] as const;
export type CurriculumTrack = (typeof curriculumTracks)[number];
export const coverageStatuses = ["MISSING","DRAFT","PUBLISHED","VERIFIED"] as const;
export type CoverageStatus = (typeof coverageStatuses)[number];
export type PlacePrecision = "EXACT" | "APPROXIMATE";

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MediaView {
  id: string;
  url: string;
  kind: "IMAGE" | "DOCUMENT";
  credit: string;
  license: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  provenance: AssetProvenanceView;
}

export interface AssetProvenanceView {
  holdingInstitution: string;
  inventoryId: string | null;
  origin: string;
  rightsStatus: RightsStatus;
  permissionDocument: string | null;
  creditLine: string;
  checksum: string | null;
}

export interface SourceView {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  url: string;
  accessedAt: string;
  citationNote: string | null;
  sourceType: SourceType;
  qualityTier: SourceQualityTier;
  institution: string | null;
  identifier: string | null;
  edition: string | null;
  archivedUrl: string | null;
  checksum: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNote: string | null;
}

export interface ClaimEvidenceView {
  source: SourceView;
  locator: string;
  quote: string | null;
  note: string | null;
}

export interface ClaimView {
  id: string;
  claimType: ClaimType;
  assessment: ClaimAssessment;
  statement: string;
  evidence: ClaimEvidenceView[];
}

export interface SourceContentRef {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
}

export interface PublicSourceItem extends SourceView {
  contentCount: number;
  contents: SourceContentRef[];
}

export interface PeriodRef { id: string; title: string; slug: string }

export interface ContentListItem {
  id: string;
  type: ContentType;
  locale: Locale;
  title: string;
  slug: string;
  summary: string;
  thumbnail: MediaView | null;
  startDate: string | null;
  endDate: string | null;
  datePrecision: DatePrecision | null;
  period: PeriodRef | null;
  tags: string[];
}

export interface GeoPoint { longitude: number; latitude: number; }
export interface PlaceView {
  id: string; slug: string; title: string; summary: string; point: GeoPoint;
  precision: PlacePrecision; locatorNote: string; related: ContentListItem[];
}
export type ReconstructionConfidence = "HIGH" | "MEDIUM" | "LOW";
export interface ReconstructionListItem { id:string; slug:string; title:string; summary:string; label:"EDUCATIONAL_RECONSTRUCTION"; confidence:ReconstructionConfidence; thumbnail:MediaView|null; }
export interface ReconstructionMove { id:string; side:string; label:string; from:GeoPoint; to:GeoPoint; confidence:ReconstructionConfidence; sourceIds:string[]; }
export interface ReconstructionPhase { id:string; order:number; title:string; narrative:string; dateLabel:string; confidence:ReconstructionConfidence; assumptions:string[]; focusPlaceIds:string[]; moves:ReconstructionMove[]; }
export interface ReconstructionView extends ReconstructionListItem { content:ContentListItem; assumptions:string[]; sources:SourceView[]; places:PlaceView[]; phases:ReconstructionPhase[]; fallback:{image:string|null;narrative:string}; }

export interface ContentDetail extends ContentListItem {
  body: string;
  location: string | null;
  result: string | null;
  role: string | null;
  artifactMeta: Record<string, string> | null;
  media: MediaView[];
  sources: SourceView[];
  claims: ClaimView[];
  related: ContentListItem[];
  alternate: { locale: Locale; url: string } | null;
  curriculum: CurriculumRequirementRef[];
  lesson: LessonView | null;
  asOf: string | null;
  reviewedBy: string;
  publishedAt: string;
  updatedAt: string;
}

export interface PeriodView extends PeriodRef {
  summary: string;
  startYear: number;
  endYear: number;
  contentCount: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  slug: string;
  startDate: string | null;
  endDate: string | null;
  datePrecision: DatePrecision;
  period: PeriodRef | null;
  summary: string;
}

export interface SearchResult extends ContentListItem {
  matchedOn: "title" | "summary" | "body";
}

export interface CurriculumRequirementRef {
  id:string;
  grade:Grade;
  track:CurriculumTrack;
  topic:string;
  slug:string;
  officialProgramRef:string;
  publishedCount:number;
  verifiedCount:number;
  coverageStatus:CoverageStatus;
}

export interface CurriculumRequirementView extends CurriculumRequirementRef {
  periodStart:number|null;
  periodEnd:number|null;
  requiredOutcomes:string[];
  lessons:ContentListItem[];
}

export interface GradeCoverageSummary {
  requirementCount:number;
  publishedRequirementCount:number;
  verifiedRequirementCount:number;
  fullCoverage:boolean;
}

export interface CurriculumGradeSummary extends GradeCoverageSummary {
  grade:Grade;
  label:string;
  publishedLessonCount:number;
}

export interface CurriculumCatalogView { asOf:string;grades:CurriculumGradeSummary[] }

export interface CurriculumGradeView {
  grade:Grade;
  label:string;
  summary:GradeCoverageSummary;
  requirements:CurriculumRequirementView[];
}

export interface LessonView {
  learningObjectives:string[];
  originalSummary:string;
  analysis:string;
  debates:Array<{title:string;summary:string;claimIds:string[]}>;
}

export interface AdminCurriculumGradeCoverageView extends CurriculumGradeSummary {
  requirements:CurriculumRequirementRef[];
}
export interface AdminCurriculumCoverageView { asOf:string;grades:AdminCurriculumGradeCoverageView[] }
