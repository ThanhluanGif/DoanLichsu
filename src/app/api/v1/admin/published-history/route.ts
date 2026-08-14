import { listResponse, withAdmin } from "@/lib/auth/http";
import { listPublishedHistoryQueue } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return withAdmin(request, { roles: ["ADMIN", "REVIEWER"] }, (database) => listResponse(listPublishedHistoryQueue(database, new URL(request.url).searchParams)));
}
