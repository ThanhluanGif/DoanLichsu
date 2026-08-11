import {withAdmin} from "@/lib/auth/http";
import {replaceCurriculumMappings} from "@/lib/content/editorial";
import {readJsonObject} from "@/lib/validation/api-error";

export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};

export async function PUT(request:Request,context:Context){
  const{id}=await context.params;
  return withAdmin(request,{mutation:true},async(database,user)=>replaceCurriculumMappings(database,id,await readJsonObject(request),user));
}
