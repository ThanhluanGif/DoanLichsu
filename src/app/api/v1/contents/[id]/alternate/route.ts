import { getAlternate } from "@/lib/content/public-repository";
import { parseLocale, PublicApiError } from "@/lib/content/validation";
import { withPublicDatabase } from "@/app/api/v1/public/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const localeValue = new URL(request.url).searchParams.get("locale");
  return withPublicDatabase((database) => {
    if (localeValue === null) {
      throw new PublicApiError(400, "INVALID_QUERY", "Locale là bắt buộc.", { fieldErrors: { locale: ["Không được để trống."] } });
    }
    return getAlternate(database, id, parseLocale(localeValue));
  });
}
