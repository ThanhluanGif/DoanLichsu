import Database from "better-sqlite3";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {migrateDatabase} from "@/lib/db/migrate";
import {POST as loginRoute} from "@/app/api/v1/auth/login/route";
import {GET as coverageRoute} from "@/app/api/v1/admin/curriculum/coverage/route";
import {PUT as mappingRoute} from "@/app/api/v1/admin/contents/[id]/curriculum/route";
import {POST as createContentRoute} from "@/app/api/v1/admin/contents/route";
import {POST as verifySourceRoute} from "@/app/api/v1/admin/sources/[id]/verification/route";
import {POST as createClaimRoute} from "@/app/api/v1/admin/contents/[id]/claims/route";
import {POST as verifyClaimRoute} from "@/app/api/v1/admin/contents/[id]/claims/[claimId]/verification/route";
import {GET as publicCurriculumGrade} from "@/app/api/v1/[locale]/curriculum/[grade]/route";
import {GET as taxonomiesRoute} from "@/app/api/v1/[locale]/taxonomies/route";

const origin="http://curriculum.test";
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-curriculum-"));
const databasePath=join(directory,"curriculum.db");
const idContext=(id:string)=>({params:Promise.resolve({id})});
const claimContext=(id:string,claimId:string)=>({params:Promise.resolve({id,claimId})});

function request(method:string,path:string,body?:unknown,cookie?:string){
  const headers=new Headers({Origin:origin});if(body!==undefined)headers.set("Content-Type","application/json");if(cookie)headers.set("Cookie",cookie);
  return new Request(`${origin}${path}`,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
}

async function login(email:string,password:string){
  const response=await loginRoute(request("POST","/api/v1/auth/login",{email,password}));
  expect(response.status).toBe(200);return response.headers.get("set-cookie")!.split(";",1)[0];
}

beforeAll(()=>{
  process.env.DATABASE_PATH=databasePath;process.env.APP_ORIGIN=origin;process.env.SESSION_SECRET="curriculum-test-session-secret-at-least-thirty-two";
  migrateDatabase(databasePath);
  const seed=spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),encoding:"utf8",env:{...process.env,DATABASE_PATH:databasePath}});
  if(seed.status!==0)throw new Error(seed.stderr);
});

afterAll(()=>{delete process.env.DATABASE_PATH;rmSync(directory,{recursive:true,force:true});});

describe("curriculum coverage governance",()=>{
  it("keeps mapping, publication and verification as separate audited states",async()=>{
    const editor=await login("editor@quansuviet.local","Editor-Demo-2026!");
    const reviewer=await login("reviewer@quansuviet.local","Reviewer-Demo-2026!");

    expect((await coverageRoute(request("GET","/api/v1/admin/curriculum/coverage"))).status).toBe(401);
    const initial=await coverageRoute(request("GET","/api/v1/admin/curriculum/coverage?grade=6",undefined,editor));
    const initialGrade=(await initial.json()).data.grades[0];
    expect(initialGrade).toMatchObject({grade:6,requirementCount:8,publishedRequirementCount:1,verifiedRequirementCount:0,fullCoverage:false,publishedLessonCount:2});
    expect(initialGrade.requirements.find((item:{id:string})=>item.id==="g6-human-origins")).toMatchObject({publishedCount:0,verifiedCount:0,coverageStatus:"MISSING"});

    const mapped=await mappingRoute(request("PUT","/api/v1/admin/contents/event-trung-sisters/curriculum",{
      version:1,requirementIds:["g6-northern-rule-resistance","g6-human-origins"],asOf:"2026-08-10T00:00:00.000Z",
    },editor),idContext("event-trung-sisters"));
    expect(mapped.status).toBe(200);
    expect((await mapped.clone().json()).data).toMatchObject({version:2,curriculumRequirementIds:["g6-human-origins","g6-northern-rule-resistance"]});

    const afterMapping=await coverageRoute(request("GET","/api/v1/admin/curriculum/coverage?grade=6",undefined,editor));
    const mappedGrade=(await afterMapping.json()).data.grades[0];
    expect(mappedGrade).toMatchObject({publishedRequirementCount:2,verifiedRequirementCount:0,fullCoverage:false});
    expect(mappedGrade.requirements.find((item:{id:string})=>item.id==="g6-human-origins")).toMatchObject({publishedCount:1,verifiedCount:0,coverageStatus:"PUBLISHED"});
    expect((await mappingRoute(request("PUT","/api/v1/admin/contents/event-trung-sisters/curriculum",{version:1,requirementIds:[]},editor),idContext("event-trung-sisters"))).status).toBe(409);
    expect((await mappingRoute(request("PUT","/api/v1/admin/contents/event-trung-sisters/curriculum",{version:2,requirementIds:["missing-requirement"]},editor),idContext("event-trung-sisters"))).status).toBe(400);

    const draftResponse=await createContentRoute(request("POST","/api/v1/admin/contents",{type:"TOPIC",sourceIds:[],translations:{vi:{
      title:"Bản nháp phương pháp sử học",slug:"ban-nhap-phuong-phap-su-hoc",summary:"Bản nháp coverage.",body:"Nội dung chưa xuất bản.",seoTitle:"Bản nháp sử học",seoDescription:"Kiểm tra coverage draft.",translationStatus:"TRANSLATING",
    }}},editor));
    const draft=(await draftResponse.json()).data;
    expect((await mappingRoute(request("PUT",`/api/v1/admin/contents/${draft.id}/curriculum`,{version:1,requirementIds:["g10-history-and-historiography"]},editor),idContext(draft.id))).status).toBe(200);
    const draftCoverage=await coverageRoute(request("GET","/api/v1/admin/curriculum/coverage?grade=10&status=DRAFT",undefined,editor));
    expect((await draftCoverage.json()).data.grades[0].requirements).toEqual([expect.objectContaining({id:"g10-history-and-historiography",coverageStatus:"DRAFT",publishedCount:0,verifiedCount:0})]);

    expect((await verifySourceRoute(request("POST","/api/v1/admin/sources/source-event-trung-sisters/verification",{version:1,status:"VERIFIED",note:"Nguồn dùng cho proof curriculum."},reviewer),idContext("source-event-trung-sisters"))).status).toBe(200);
    const claimResponse=await createClaimRoute(request("POST","/api/v1/admin/contents/event-trung-sisters/claims",{
      claimType:"CONTEXT",assessment:"CONFIRMED",statementVi:"Khởi nghĩa thuộc mạch đấu tranh thời Bắc thuộc.",statementEn:"The uprising belongs to the resistance-under-northern-rule strand.",evidence:[{sourceId:"source-event-trung-sisters",locator:"Overview"}],
    },editor),idContext("event-trung-sisters"));
    const claim=(await claimResponse.json()).data;
    expect((await verifyClaimRoute(request("POST",`/api/v1/admin/contents/event-trung-sisters/claims/${claim.id}/verification`,{version:1,status:"NEEDS_REVIEW"},editor),claimContext("event-trung-sisters",claim.id))).status).toBe(200);
    expect((await verifyClaimRoute(request("POST",`/api/v1/admin/contents/event-trung-sisters/claims/${claim.id}/verification`,{version:2,status:"VERIFIED",note:"Đối chiếu nguồn."},reviewer),claimContext("event-trung-sisters",claim.id))).status).toBe(200);

    const verified=await coverageRoute(request("GET","/api/v1/admin/curriculum/coverage?grade=6&status=VERIFIED",undefined,reviewer));
    const verifiedRequirements=(await verified.json()).data.grades[0].requirements;
    expect(verifiedRequirements.map((item:{id:string})=>item.id)).toEqual(["g6-human-origins","g6-northern-rule-resistance"]);
    expect(verifiedRequirements.every((item:{verifiedCount:number;coverageStatus:string})=>item.verifiedCount===1&&item.coverageStatus==="VERIFIED")).toBe(true);

    const publicGrade=await publicCurriculumGrade(new Request(`${origin}/api/v1/vi/curriculum/6?pageSize=50`),{params:Promise.resolve({locale:"vi",grade:"6"})});
    expect((await publicGrade.json()).data.summary).toMatchObject({publishedRequirementCount:2,verifiedRequirementCount:2,fullCoverage:false});
    const facets=await taxonomiesRoute(new Request(`${origin}/api/v1/vi/taxonomies?scope=contents&grade=6`),{params:Promise.resolve({locale:"vi"})});
    expect((await facets.json()).data.grades.find((item:{value:string})=>item.value==="6")).toMatchObject({publishedCount:2,verifiedCount:1});

    const auditDatabase=new Database(databasePath,{readonly:true});
    try{
      expect(auditDatabase.prepare("SELECT action,object_id AS objectId FROM audit_logs WHERE action='content.curriculum.replace' AND object_id='event-trung-sisters'").get()).toEqual({action:"content.curriculum.replace",objectId:"event-trung-sisters"});
    }finally{auditDatabase.close();}
  });
});
