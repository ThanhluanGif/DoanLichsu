import { withAdmin } from "@/lib/auth/http";
import { putTranslation } from "@/lib/content/editorial";
import { readJsonObject } from "@/lib/validation/api-error";
export const dynamic="force-dynamic";
export async function PUT(request:Request,context:{params:Promise<{id:string;locale:string}>}){const{id,locale}=await context.params;return withAdmin(request,{mutation:true},async(database,user)=>putTranslation(database,id,locale,await readJsonObject(request),user));}

