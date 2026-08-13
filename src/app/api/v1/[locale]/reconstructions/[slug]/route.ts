import { getReconstruction } from "@/lib/content/public-repository";
import { parseLocale } from "@/lib/content/validation";
import { withPublicDatabase } from "@/app/api/v1/public/response";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ locale: string; slug: string }> }) { const { locale: rawLocale, slug } = await context.params; return withPublicDatabase((database) => getReconstruction(database, parseLocale(rawLocale), slug)); }
