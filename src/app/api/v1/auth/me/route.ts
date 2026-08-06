import { withAdmin } from "@/lib/auth/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return withAdmin(request, {}, (_database, user) => user);
}

