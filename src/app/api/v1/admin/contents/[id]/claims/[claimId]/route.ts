import { withAdmin } from "@/lib/auth/http";
import { updateClaim } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; claimId: string }> }) {
  const { id, claimId } = await context.params;
  return withAdmin(request, { mutation: true }, async (database, user) =>
    updateClaim(database, id, claimId, await readJsonObject(request), user));
}
