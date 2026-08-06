import { dataResponse,listResponse,withAdmin } from "@/lib/auth/http";
import { createSource,listSources } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
export async function GET(request:Request){return withAdmin(request,{},(database)=>listResponse(listSources(database,new URL(request.url).searchParams)));}
export async function POST(request:Request){return withAdmin(request,{mutation:true},async(database,user)=>dataResponse(createSource(database,await readJsonObject(request),user),201));}

