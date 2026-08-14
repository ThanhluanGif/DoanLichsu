import { dataResponse, withAdmin } from "@/lib/auth/http";
import { transitionCorrection } from "@/lib/corrections/repository";
import { readJsonObject } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAdmin(request, { roles: ["ADMIN", "EDITOR", "REVIEWER"], mutation: true }, async (database, user) => dataResponse(transitionCorrection(database, id, await readJsonObject(request), user)));
}
