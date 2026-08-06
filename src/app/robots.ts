import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = new URL(process.env.APP_ORIGIN?.trim() || "http://localhost:3000").origin;
  return {
    rules: { userAgent:"*",allow:"/",disallow:["/admin","/api/v1/admin"] },
    sitemap:`${origin}/sitemap.xml`,
  };
}
