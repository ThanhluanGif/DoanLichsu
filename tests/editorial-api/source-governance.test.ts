import { spawnSync } from "node:child_process";
import { mkdtempSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as createSourceRoute } from "@/app/api/v1/admin/sources/route";
import { PATCH as updateSourceRoute } from "@/app/api/v1/admin/sources/[id]/route";
import { POST as verifySourceRoute } from "@/app/api/v1/admin/sources/[id]/verification/route";
import { POST as createContentRoute } from "@/app/api/v1/admin/contents/route";
import { PATCH as updateContentRoute } from "@/app/api/v1/admin/contents/[id]/route";
import { GET as listClaimsRoute,POST as createClaimRoute } from "@/app/api/v1/admin/contents/[id]/claims/route";
import { POST as verifyClaimRoute } from "@/app/api/v1/admin/contents/[id]/claims/[claimId]/verification/route";
import { POST as submitContentRoute } from "@/app/api/v1/admin/contents/[id]/submit-review/route";
import { POST as approveContentRoute } from "@/app/api/v1/admin/contents/[id]/approve/route";
import { POST as publishContentRoute } from "@/app/api/v1/admin/contents/[id]/publish/route";
import { GET as publicDetailRoute } from "@/app/api/v1/[locale]/contents/[type]/[slug]/route";
import { GET as auditRoute } from "@/app/api/v1/admin/audit-logs/route";
import { openApiDocument } from "@/lib/openapi/document";

const origin="http://source-governance.test";
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-source-governance-"));
const databasePath=join(directory,"governance.db");
type Cookie=string;

function request(method:string,path:string,body?:unknown,cookie?:Cookie,requestOrigin=origin){const headers=new Headers({Origin:requestOrigin});if(body!==undefined)headers.set("Content-Type","application/json");if(cookie)headers.set("Cookie",cookie);return new Request(`${origin}${path}`,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});}
const contentContext=(id:string)=>({params:Promise.resolve({id})});
const claimContext=(id:string,claimId:string)=>({params:Promise.resolve({id,claimId})});
async function login(email:string,password:string){const response=await loginRoute(request("POST","/api/v1/auth/login",{email,password}));expect(response.status).toBe(200);return response.headers.get("set-cookie")!.split(";",1)[0];}
type TestData={id:string;version:number;verificationStatus:string;verifiedBy:string|null;verifiedAt:string|null;evidence:Array<{locator:string;source:{verificationStatus:string;verifiedBy:string|null}}>;claims:Array<{evidence:Array<{locator:string;source:{verificationStatus:string}}>}>};
type TestBody={data:TestData;details:{violations:string[]};code:string};
async function json(response:Response){return response.json() as Promise<TestBody>;}

beforeAll(()=>{process.env.DATABASE_PATH=databasePath;process.env.APP_ORIGIN=origin;process.env.SESSION_SECRET="source-governance-test-secret-at-least-32-characters";migrateDatabase(databasePath);const seed=spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),encoding:"utf8",env:{...process.env,DATABASE_PATH:databasePath}});if(seed.status!==0)throw new Error(seed.stderr);});
afterAll(()=>rmSync(directory,{recursive:true,force:true}));

describe("source governance and claim-level evidence",()=>{
  it("requires reviewer decisions, claim coverage and verified evidence before publish",async()=>{
    const admin=await login("admin@quansuviet.local","Admin-Demo-2026!");
    const editor=await login("editor@quansuviet.local","Editor-Demo-2026!");
    const reviewer=await login("reviewer@quansuviet.local","Reviewer-Demo-2026!");
    const createdSource=await createSourceRoute(request("POST","/api/v1/admin/sources",{
      title:"Hồ sơ kiểm chứng Điện Biên Phủ",publisher:"Cơ quan lưu trữ kiểm thử",institution:"Cơ quan lưu trữ kiểm thử",
      url:"https://example.test/archive/dien-bien-phu",accessedAt:"2026-08-09T00:00:00.000Z",
      sourceType:"ARCHIVE_CATALOG",qualityTier:"TIER_2_INSTITUTIONAL",identifier:"CAT-DBP-1954",
    },editor));
    expect(createdSource.status).toBe(201);
    const source=(await json(createdSource)).data;
    expect(source).toMatchObject({verificationStatus:"DRAFT",version:1,verifiedBy:null});

    const editorVerify=await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:1,status:"VERIFIED"},editor),contentContext(source.id));
    expect(editorVerify.status).toBe(403);
    expect((await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:1,status:"NEEDS_REVIEW"},editor),contentContext(source.id))).status).toBe(200);
    const verifiedSource=await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:2,status:"VERIFIED",note:"Đã đối chiếu catalog và metadata."},reviewer),contentContext(source.id));
    expect(verifiedSource.status).toBe(200);
    expect((await json(verifiedSource)).data).toMatchObject({verificationStatus:"VERIFIED",version:3,verifiedBy:"Kiểm duyệt viên",verifiedAt:expect.any(String)});

    const contentResponse=await createContentRoute(request("POST","/api/v1/admin/contents",{
      type:"EVENT",startDate:"1954-03-13",endDate:"1954-05-07",datePrecision:"DAY",location:"Điện Biên",result:"Kết thúc chiến dịch",
      sourceIds:[source.id],translations:{vi:{title:"Sự kiện kiểm chứng C-020",slug:"su-kien-kiem-chung-c-020",summary:"Kiểm chứng claim-level.",body:"Nội dung chỉ được xuất bản khi mọi claim bắt buộc đã được duyệt.",seoTitle:"Kiểm chứng C-020",seoDescription:"Kiểm chứng quản trị nguồn và luận điểm.",translationStatus:"TRANSLATING"}},
    },editor));
    expect(contentResponse.status).toBe(201);
    const content=(await json(contentResponse)).data;

    async function createAndVerifyClaim(claimType:string,statementVi:string,statementEn:string){
      const created=await createClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims`,{claimType,assessment:"CONFIRMED",statementVi,statementEn,evidence:[{sourceId:source.id,locator:`Mục ${claimType}`,quote:`Trích đoạn kiểm chứng ${claimType}.`}]},editor),contentContext(content.id));
      expect(created.status).toBe(201);const claim=(await json(created)).data;
      const direct=await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:1,status:"VERIFIED"},reviewer),claimContext(content.id,claim.id));
      expect(direct.status).toBe(422);
      expect((await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:1,status:"NEEDS_REVIEW"},editor),claimContext(content.id,claim.id))).status).toBe(200);
      const editorDecision=await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:2,status:"VERIFIED"},editor),claimContext(content.id,claim.id));
      expect(editorDecision.status).toBe(403);
      const verified=await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:2,status:"VERIFIED",note:"Đã đối chiếu evidence."},reviewer),claimContext(content.id,claim.id));
      expect(verified.status).toBe(200);return(await json(verified)).data;
    }

    const contextClaim=await createAndVerifyClaim("CONTEXT","Chiến dịch diễn ra trong năm 1954.","The campaign took place in 1954.");
    expect(contextClaim.evidence[0]).toMatchObject({locator:"Mục CONTEXT",source:{verificationStatus:"VERIFIED",verifiedBy:"Kiểm duyệt viên"}});
    expect((await listClaimsRoute(request("GET",`/api/v1/admin/contents/${content.id}/claims?verificationStatus=VERIFIED`,undefined,reviewer),contentContext(content.id))).status).toBe(200);

    expect((await submitContentRoute(request("POST",`/api/v1/admin/contents/${content.id}/submit-review`,{version:1,locales:["vi"]},editor),contentContext(content.id))).status).toBe(200);
    expect((await approveContentRoute(request("POST",`/api/v1/admin/contents/${content.id}/approve`,{version:2,locales:["vi"]},reviewer),contentContext(content.id))).status).toBe(200);
    const detachEvidenceSource=await updateContentRoute(request("PATCH",`/api/v1/admin/contents/${content.id}`,{version:3,sourceIds:[]},editor),contentContext(content.id));
    expect(detachEvidenceSource.status).toBe(400);
    const incompleteCoverage=await publishContentRoute(request("POST",`/api/v1/admin/contents/${content.id}/publish`,{version:3,locales:["vi"]},reviewer),contentContext(content.id));
    expect(incompleteCoverage.status).toBe(422);
    expect((await json(incompleteCoverage)).details.violations).toEqual(expect.arrayContaining([
      "DATE: VERIFIED claim coverage is required","PLACE: VERIFIED claim coverage is required","OUTCOME: VERIFIED claim coverage is required",
    ]));

    await createAndVerifyClaim("DATE","Chiến dịch kết thúc ngày 7 tháng 5 năm 1954.","The campaign ended on 7 May 1954.");
    await createAndVerifyClaim("PLACE","Chiến dịch diễn ra tại Điện Biên.","The campaign took place at Dien Bien.");
    await createAndVerifyClaim("OUTCOME","Chiến dịch kết thúc với thắng lợi của lực lượng Việt Nam.","The campaign ended in a Vietnamese victory.");
    const published=await publishContentRoute(request("POST",`/api/v1/admin/contents/${content.id}/publish`,{version:3,locales:["vi"]},reviewer),contentContext(content.id));
    expect(published.status).toBe(200);

    const publicBefore=await publicDetailRoute(new Request(`${origin}/api/v1/vi/contents/EVENT/su-kien-kiem-chung-c-020`),{params:Promise.resolve({locale:"vi",type:"EVENT",slug:"su-kien-kiem-chung-c-020"})});
    expect(publicBefore.status).toBe(200);
    const publicData=(await json(publicBefore)).data;
    expect(publicData.claims).toHaveLength(4);
    expect(publicData.claims[0].evidence[0]).toEqual(expect.objectContaining({locator:expect.any(String),source:expect.objectContaining({verificationStatus:"VERIFIED"})}));

    const rejected=await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:3,status:"REJECTED",note:"Nguồn cần tái kiểm tra."},reviewer),contentContext(source.id));
    expect(rejected.status).toBe(200);
    const publicAfter=await publicDetailRoute(new Request(`${origin}/api/v1/vi/contents/EVENT/su-kien-kiem-chung-c-020`),{params:Promise.resolve({locale:"vi",type:"EVENT",slug:"su-kien-kiem-chung-c-020"})});
    expect((await json(publicAfter)).data.claims).toEqual([]);
    const claimsAfter=await listClaimsRoute(request("GET",`/api/v1/admin/contents/${content.id}/claims?verificationStatus=NEEDS_REVIEW`,undefined,reviewer),contentContext(content.id));
    expect((await json(claimsAfter)).data).toHaveLength(4);

    const immutable=await updateSourceRoute(request("PATCH",`/api/v1/admin/sources/${source.id}`,{version:4,title:"Không được sửa",publisher:"Cơ quan lưu trữ kiểm thử",url:"https://example.test/archive/dien-bien-phu",accessedAt:"2026-08-09T00:00:00.000Z",sourceType:"ARCHIVE_CATALOG",qualityTier:"TIER_2_INSTITUTIONAL"},editor),contentContext(source.id));
    expect(immutable.status).toBe(422);
    const audit=await auditRoute(request("GET","/api/v1/admin/audit-logs?pageSize=100",undefined,admin));
    const auditText=JSON.stringify(await json(audit));
    for(const action of["source.submit-review","source.verify","claim.create","claim.submit-review","claim.verify","source.reject"])expect(auditText).toContain(action);
  });

  it("never verifies discovery-only sources or claims backed by unverified evidence",async()=>{
    const editor=await login("editor@quansuviet.local","Editor-Demo-2026!");const reviewer=await login("reviewer@quansuviet.local","Reviewer-Demo-2026!");
    const sourceResponse=await createSourceRoute(request("POST","/api/v1/admin/sources",{title:"Link khám phá",publisher:"Blog chưa kiểm chứng",url:"https://example.test/discovery",accessedAt:"2026-08-09T00:00:00.000Z",sourceType:"DISCOVERY_ONLY",qualityTier:"TIER_5_DISCOVERY"},editor));
    const source=(await json(sourceResponse)).data;
    await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:1,status:"NEEDS_REVIEW"},editor),contentContext(source.id));
    const sourceDenied=await verifySourceRoute(request("POST",`/api/v1/admin/sources/${source.id}/verification`,{version:2,status:"VERIFIED"},reviewer),contentContext(source.id));
    expect(sourceDenied.status).toBe(422);expect((await json(sourceDenied)).code).toBe("SOURCE_NOT_VERIFIABLE");
    const contentResponse=await createContentRoute(request("POST","/api/v1/admin/contents",{type:"TOPIC",sourceIds:[source.id],translations:{vi:{title:"Chủ đề discovery",slug:"chu-de-discovery",summary:"Chưa kiểm chứng.",body:"Không được công khai như bằng chứng đã xác minh.",seoTitle:"Discovery",seoDescription:"Discovery source test.",translationStatus:"TRANSLATING"}}},editor));
    const content=(await json(contentResponse)).data;
    const claimResponse=await createClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims`,{claimType:"CONTEXT",assessment:"CONFIRMED",statementVi:"Luận điểm chưa kiểm chứng.",statementEn:"Unverified claim.",evidence:[{sourceId:source.id,locator:"Trang chủ"}]},editor),contentContext(content.id));
    const claim=(await json(claimResponse)).data;
    await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:1,status:"NEEDS_REVIEW"},editor),claimContext(content.id,claim.id));
    const claimDenied=await verifyClaimRoute(request("POST",`/api/v1/admin/contents/${content.id}/claims/${claim.id}/verification`,{version:2,status:"VERIFIED"},reviewer),claimContext(content.id,claim.id));
    expect(claimDenied.status).toBe(422);expect((await json(claimDenied)).code).toBe("CLAIM_EVIDENCE_UNVERIFIED");
  });

  it("publishes the exact governance seam in OpenAPI",()=>{
    for(const path of["/api/v1/admin/sources/{id}/verification","/api/v1/admin/contents/{id}/claims","/api/v1/admin/contents/{id}/claims/{claimId}","/api/v1/admin/contents/{id}/claims/{claimId}/verification"])expect(openApiDocument.paths).toHaveProperty(path);
    expect(openApiDocument.components.schemas.SourceView.required).toEqual(expect.arrayContaining(["sourceType","qualityTier","verificationStatus","verifiedBy","verifiedAt"]));
    expect(openApiDocument.components.schemas.ContentDetail.required).toContain("claims");
    expect(openApiDocument.components.schemas.AdminClaimView.additionalProperties).toBe(false);
  });
});
