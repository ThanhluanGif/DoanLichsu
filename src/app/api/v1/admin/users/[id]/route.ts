import { withAdmin } from "@/lib/auth/http";
import { updateUser } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){const{id}=await context.params;return withAdmin(request,{roles:["ADMIN"],mutation:true},async(database,user)=>updateUser(database,id,await readJsonObject(request),user));}

