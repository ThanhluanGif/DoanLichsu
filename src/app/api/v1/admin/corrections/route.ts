import { listResponse, withAdmin } from "@/lib/auth/http";
import { listCorrections } from "@/lib/corrections/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, { roles: ["ADMIN", "EDITOR", "REVIEWER"] }, (database) => listResponse(listCorrections(database, new URL(request.url).searchParams)));
}
