import { withPublicWriteDatabase } from "@/app/api/v1/public/response";
import { createCorrection } from "@/lib/corrections/repository";
import { apiErrorResponse, readJsonObject } from "@/lib/validation/api-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await readJsonObject(request);
    return withPublicWriteDatabase((database) => createCorrection(database, input));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
