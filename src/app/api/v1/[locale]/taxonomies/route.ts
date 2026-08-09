import { getTaxonomies } from "@/lib/content/public-repository";
import { parseLocale } from "@/lib/content/validation";
import { withPublicDatabase } from "@/app/api/v1/public/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await context.params;
  const search = new URL(request.url).searchParams;
  return withPublicDatabase((database) => getTaxonomies(database, parseLocale(rawLocale), search));
}
