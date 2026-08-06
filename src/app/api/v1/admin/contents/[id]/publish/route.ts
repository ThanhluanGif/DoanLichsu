import { withAdmin } from "@/lib/auth/http";
import { transitionWorkflow } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){const{id}=await context.params;return withAdmin(request,{roles:["ADMIN","REVIEWER"],mutation:true},async(database,user)=>transitionWorkflow(database,id,"publish",await readJsonObject(request),user));}

