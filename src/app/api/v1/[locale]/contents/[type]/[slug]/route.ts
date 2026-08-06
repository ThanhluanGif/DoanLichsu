import { getDetail } from "@/lib/content/public-repository";
import { parseLocale } from "@/lib/content/validation";
import { withPublicDatabase } from "@/app/api/v1/public/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ locale: string; type: string; slug: string }> }) {
  const { locale: rawLocale, type, slug } = await context.params;
  return withPublicDatabase((database) => getDetail(database, parseLocale(rawLocale), type, slug));
}
