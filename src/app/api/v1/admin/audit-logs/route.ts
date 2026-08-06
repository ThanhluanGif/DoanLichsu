import { listResponse,withAdmin } from "@/lib/auth/http";
import { listAuditLogs } from "@/lib/content/editorial";
export const dynamic="force-dynamic";
export async function GET(request:Request){return withAdmin(request,{roles:["ADMIN"]},(database)=>listResponse(listAuditLogs(database,new URL(request.url).searchParams)));}

