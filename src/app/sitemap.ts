import type { MetadataRoute } from "next";
import { contentTypes,type ContentListItem,type CurriculumCatalogView,type Locale } from "@/lib/content/types";
import { getPublicClient } from "@/lib/public-client/client";
import { absolutePublicUrl,contentCollectionPath,contentPath,homePath,learnByGradePath,sourcesPath,timelinePath } from "@/lib/public-client/paths";

export const dynamic = "force-dynamic";

export function buildSitemap(items:Record<Locale,ContentListItem[]>,curriculum?:Record<Locale,CurriculumCatalogView>):MetadataRoute.Sitemap {
  const entries:MetadataRoute.Sitemap=[];
  for(const locale of ["vi","en"] as const){
    entries.push({url:absolutePublicUrl(homePath(locale)),changeFrequency:"weekly",priority:1});
    entries.push({url:absolutePublicUrl(timelinePath(locale)),changeFrequency:"weekly",priority:.8});
    entries.push({url:absolutePublicUrl(sourcesPath(locale)),changeFrequency:"weekly",priority:.7});
    if(curriculum){
      entries.push({url:absolutePublicUrl(learnByGradePath(locale)),changeFrequency:"weekly",priority:.8});
      for(const grade of curriculum[locale].grades.filter((item)=>item.publishedRequirementCount>0 && item.publishedLessonCount>0))entries.push({url:absolutePublicUrl(learnByGradePath(locale,grade.grade)),changeFrequency:"monthly",priority:.7});
    }
    for(const type of contentTypes)entries.push({url:absolutePublicUrl(contentCollectionPath(locale,type)),changeFrequency:"weekly",priority:type==="EVENT"?.8:.7});
    for(const item of items[locale])entries.push({url:absolutePublicUrl(contentPath(locale,item.type,item.slug)),changeFrequency:"monthly",priority:item.type==="EVENT"?.7:.6});
  }
  return entries;
}

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const client=getPublicClient();
  const [vi,en,curriculumVi,curriculumEn]=await Promise.all([client.contents("vi",new URLSearchParams({page:"1",pageSize:"50"})),client.contents("en",new URLSearchParams({page:"1",pageSize:"50"})),client.curriculum("vi"),client.curriculum("en")]);
  return buildSitemap({vi:vi.data,en:en.data},{vi:curriculumVi,en:curriculumEn});
}
