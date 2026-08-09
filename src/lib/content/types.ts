export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export const contentTypes = ["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"] as const;
export type ContentType = (typeof contentTypes)[number];
export type DatePrecision = "DAY" | "MONTH" | "YEAR" | "APPROXIMATE";

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
}

export interface PublicSourceItem extends SourceView {
  contentCount: number;
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
