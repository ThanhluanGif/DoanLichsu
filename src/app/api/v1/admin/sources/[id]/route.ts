import { withAdmin } from "@/lib/auth/http";
import { updateSource } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){const{id}=await context.params;return withAdmin(request,{mutation:true},async(database,user)=>updateSource(database,id,await readJsonObject(request),user));}

