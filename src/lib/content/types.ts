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
export const claimTypes = ["DATE", "PLACE", "PERSON_ROLE", "OUTCOME", "INTERPRETATION", "CONTEXT"] as const;
export type ClaimType = (typeof claimTypes)[number];
export const claimAssessments = ["CONFIRMED", "DISPUTED"] as const;
export type ClaimAssessment = (typeof claimAssessments)[number];

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
