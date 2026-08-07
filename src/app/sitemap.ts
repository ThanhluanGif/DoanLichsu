import type { MetadataRoute } from "next";
import type { ContentListItem,Locale } from "@/lib/content/types";
import { getPublicClient } from "@/lib/public-client/client";
import { absolutePublicUrl,contentPath,homePath,timelinePath } from "@/lib/public-client/paths";

export const dynamic = "force-dynamic";

export function buildSitemap(items:Record<Locale,ContentListItem[]>):MetadataRoute.Sitemap {
  const entries:MetadataRoute.Sitemap=[];
  for(const locale of ["vi","en"] as const){
    entries.push({url:absolutePublicUrl(homePath(locale)),changeFrequency:"weekly",priority:1});
    entries.push({url:absolutePublicUrl(timelinePath(locale)),changeFrequency:"weekly",priority:.8});
    for(const item of items[locale])entries.push({url:absolutePublicUrl(contentPath(locale,item.type,item.slug)),changeFrequency:"monthly",priority:item.type==="EVENT"?.7:.6});
  }
  return entries;
}

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const client=getPublicClient();
  const [vi,en]=await Promise.all([client.contents("vi",new URLSearchParams({page:"1",pageSize:"50"})),client.contents("en",new URLSearchParams({page:"1",pageSize:"50"}))]);
  return buildSitemap({vi:vi.data,en:en.data});
}
