import {withAdmin} from "@/lib/auth/http";
import {getAdminCurriculumCoverage} from "@/lib/content/curriculum";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  return withAdmin(request,{},(database)=>getAdminCurriculumCoverage(database,new URL(request.url).searchParams));
}
