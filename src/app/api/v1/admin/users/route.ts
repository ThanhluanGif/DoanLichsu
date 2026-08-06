import { dataResponse,listResponse,withAdmin } from "@/lib/auth/http";
import { createUser,listUsers } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
const admin=["ADMIN"] as const;
export async function GET(request:Request){return withAdmin(request,{roles:admin},(database)=>listResponse(listUsers(database,new URL(request.url).searchParams)));}
export async function POST(request:Request){return withAdmin(request,{roles:admin,mutation:true},async(database,user)=>dataResponse(await createUser(database,await readJsonObject(request),user),201));}

