import { withAdmin } from "@/lib/auth/http";
import { dashboard } from "@/lib/content/editorial";
export const dynamic="force-dynamic";
export async function GET(request:Request){return withAdmin(request,{},(database)=>dashboard(database));}

