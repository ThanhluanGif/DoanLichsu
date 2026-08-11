import {withPublicDatabase} from "@/app/api/v1/public/response";
import {getCurriculumGrade} from "@/lib/content/public-repository";
import {parseLocale} from "@/lib/content/validation";

export const dynamic="force-dynamic";

export async function GET(request:Request,context:{params:Promise<{locale:string;grade:string}>}){
  const{locale:rawLocale,grade}=await context.params;
  return withPublicDatabase((database)=>getCurriculumGrade(database,parseLocale(rawLocale),grade,new URL(request.url).searchParams));
}
