import type { ContentDetail,ContentListItem,DataResponse,FacetView,HomeView,ListResponse,Locale,PeriodView,PublicSourceItem,SearchResult,TimelineItem } from "./types";

export class PublicClientError extends Error {
  constructor(public readonly status:number,public readonly code:string,message:string) { super(message); }
}

type Fetcher = typeof fetch;

export function publicApiOrigin(source: NodeJS.ProcessEnv = process.env) {
  const configured = source.INTERNAL_API_ORIGIN?.trim() || source.APP_ORIGIN?.trim();
  if (configured) return new URL(configured).origin;
  if (source.NODE_ENV === "production") throw new Error("APP_ORIGIN is required for the public HTTP client in production.");
  return `http://127.0.0.1:${source.PORT?.trim() || "3000"}`;
}

export function createPublicClient(options: {origin?:string;fetcher?:Fetcher} = {}) {
  const origin = options.origin ? new URL(options.origin).origin : publicApiOrigin();
  const fetcher = options.fetcher ?? fetch;
  const request = async <T>(path:string):Promise<T> => {
    const response = await fetcher(new URL(path,origin),{cache:"no-store",headers:{accept:"application/json"}});
    const body = await response.json() as T | {code?:string;message?:string};
    if (!response.ok) {
      const error = body as {code?:string;message?:string};
      throw new PublicClientError(response.status,error.code ?? "PUBLIC_API_ERROR",error.message ?? `Public API returned ${response.status}`);
    }
    return body as T;
  };
  return {
    home:async(locale:Locale) => (await request<DataResponse<HomeView>>(`/api/v1/${locale}/home`)).data,
    periods:async(locale:Locale,includeEmpty=false) => request<ListResponse<PeriodView>>(`/api/v1/${locale}/periods?includeEmpty=${includeEmpty}`),
    timeline:async(locale:Locale,query:URLSearchParams) => request<ListResponse<TimelineItem>>(`/api/v1/${locale}/timeline?${query}`),
    contents:async(locale:Locale,query:URLSearchParams) => request<ListResponse<ContentListItem>>(`/api/v1/${locale}/contents?${query}`),
    search:async(locale:Locale,query:URLSearchParams) => request<ListResponse<SearchResult>>(`/api/v1/${locale}/search?${query}`),
    sources:async(locale:Locale,query:URLSearchParams) => request<ListResponse<PublicSourceItem>>(`/api/v1/${locale}/sources?${query}`),
    taxonomies:async(locale:Locale,query:URLSearchParams = new URLSearchParams()) => {
      const suffix=query.toString();
      return (await request<DataResponse<FacetView>>(`/api/v1/${locale}/taxonomies${suffix?`?${suffix}`:""}`)).data;
    },
    detail:async(locale:Locale,type:string,slug:string) => (await request<DataResponse<ContentDetail>>(`/api/v1/${locale}/contents/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`)).data,
  };
}

export function getPublicClient() {
  return createPublicClient();
}
