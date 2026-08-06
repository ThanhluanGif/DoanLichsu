import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";
import { openReadOnlyDatabase } from "@/lib/db/connection";

export const dynamic = "force-dynamic";

type PublishedRoute = { type:string;locale:"vi"|"en";slug:string;updated_at:string };

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = new URL(process.env.APP_ORIGIN?.trim() || "http://localhost:3000").origin;
  const database = openReadOnlyDatabase(getEnv().databasePath);
  try {
    const rows = database.prepare(`
      SELECT n.type,t.locale,t.slug,n.updated_at
      FROM content_nodes n JOIN content_translations t ON t.node_id=n.id
      WHERE n.status='PUBLISHED' AND t.translation_status='PUBLISHED'
      ORDER BY t.locale,n.type,t.slug,n.id
    `).all() as PublishedRoute[];
    const entries: MetadataRoute.Sitemap = ["vi","en"].map((locale)=>({url:`${origin}/api/v1/${locale}/home`,changeFrequency:"weekly",priority:1}));
    entries.push(...rows.map<MetadataRoute.Sitemap[number]>((row)=>({
        url:`${origin}/api/v1/${row.locale}/contents/${row.type}/${row.slug}`,
        lastModified:new Date(row.updated_at),changeFrequency:"monthly",priority:0.7,
      })));
    return entries;
  } finally {
    database.close();
  }
}
