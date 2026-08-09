import { withAdmin } from "@/lib/auth/http";
import { transitionClaimVerification } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; claimId: string }> }) {
  const { id, claimId } = await context.params;
  return withAdmin(request, { mutation: true }, async (database, user) =>
    transitionClaimVerification(database, id, claimId, await readJsonObject(request), user));
}
