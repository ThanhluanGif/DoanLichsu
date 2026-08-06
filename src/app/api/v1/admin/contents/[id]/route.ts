import { withAdmin } from "@/lib/auth/http";
import { adminContentDetail, updateContent } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){const{id}=await context.params;return withAdmin(request,{},(database)=>adminContentDetail(database,id));}
export async function PATCH(request:Request,context:Context){const{id}=await context.params;return withAdmin(request,{mutation:true},async(database,user)=>updateContent(database,id,await readJsonObject(request),user));}

