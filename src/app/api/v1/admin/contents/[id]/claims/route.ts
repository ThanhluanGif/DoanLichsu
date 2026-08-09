import { dataResponse, listResponse, withAdmin } from "@/lib/auth/http";
import { createClaim, listClaims } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  return withAdmin(request, {}, (database) =>
    listResponse(listClaims(database, id, new URL(request.url).searchParams)));
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  return withAdmin(request, { mutation: true }, async (database, user) =>
    dataResponse(createClaim(database, id, await readJsonObject(request), user), 201));
}
