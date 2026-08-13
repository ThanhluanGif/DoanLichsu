import type { ContentType, Grade, Locale } from "@/lib/content/types";

const typeSegments: Record<Locale, Record<ContentType,string>> = {
  vi:{ PERIOD:"thoi-ky",EVENT:"su-kien",PERSON:"nhan-vat",ARTIFACT:"hien-vat",TOPIC:"chu-de" },
  en:{ PERIOD:"periods",EVENT:"events",PERSON:"people",ARTIFACT:"artifacts",TOPIC:"topics" },
};

const segmentTypes = new Map<string,ContentType>(Object.values(typeSegments).flatMap((mapping) =>
  Object.entries(mapping).map(([type,segment]) => [segment,type as ContentType] as const),
));

export function homePath(locale: Locale) { return `/${locale}`; }
export function timelinePath(locale: Locale, query = "") { return `/${locale}/timeline${query}`; }
export function mapPath(locale: Locale, query = "") { return `/${locale}/ban-do${query}`; }
export function searchPath(locale: Locale, query = "") { return `/${locale}/${locale === "vi" ? "tim-kiem" : "search"}${query}`; }
export function sourcesPath(locale: Locale, query = "") { return `/${locale}/sources${query}`; }
export function archivePath(locale: Locale, query = "") { return `/${locale}/tu-lieu${query}`; }
export function learnByGradePath(locale: Locale, grade?: Grade) { return `/${locale}/${locale === "vi" ? "hoc-theo-lop" : "learn-by-grade"}${grade === undefined ? "" : `/${grade}`}`; }
export function contentCollectionPath(locale: Locale, type: ContentType, query = "") { return `/${locale}/${typeSegments[locale][type]}${query}`; }
export function contentPath(locale: Locale, type: ContentType, slug: string) { return `${contentCollectionPath(locale,type)}/${encodeURIComponent(slug)}`; }

export function contentTypeFromSegment(segment: string): ContentType | null {
  return segmentTypes.get(segment) ?? null;
}

export function contentTypeFromLocaleSegment(locale:Locale,segment:string):ContentType|null {
  return (Object.entries(typeSegments[locale]).find(([,value])=>value===segment)?.[0] as ContentType|undefined) ?? null;
}

export function alternateApiToPublicPath(url: string): string | null {
  const match = /^\/api\/v1\/(vi|en)\/contents\/(PERIOD|EVENT|PERSON|ARTIFACT|TOPIC)\/([^/?#]+)$/.exec(url);
  return match ? contentPath(match[1] as Locale,match[2] as ContentType,decodeURIComponent(match[3])) : null;
}

export function withQuery(path: string, values: Record<string,string|number|undefined|null>) {
  const query = new URLSearchParams();
  for (const [key,value] of Object.entries(values)) if (value !== undefined && value !== null && value !== "") query.set(key,String(value));
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function absolutePublicUrl(path: string, origin = process.env.APP_ORIGIN) {
  if (!origin) throw new Error("APP_ORIGIN is required to build canonical public URLs.");
  return new URL(path,new URL(origin).origin).toString();
}
