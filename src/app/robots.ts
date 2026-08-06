import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (!configuredOrigin) throw new Error("APP_ORIGIN is required to generate robots.txt.");
  const origin = new URL(configuredOrigin).origin;
  return {
    rules: { userAgent:"*",allow:"/",disallow:["/admin","/api/v1/admin"] },
    sitemap:`${origin}/sitemap.xml`,
  };
}
