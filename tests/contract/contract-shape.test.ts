import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { openApiDocument } from "../../src/lib/openapi/document";
import { contractShapeDrift } from "../../scripts/contract-shape.mjs";

type MutableObject = Record<string,unknown>;

const contract = readFileSync(new URL("../../flow/05-contract.md",import.meta.url),"utf8");
const objectAt = (root:unknown,path:string[]) => path.reduce<unknown>((value,key) => (value as MutableObject)[key],root) as MutableObject;
const cardStatus = (card:string) => /^status:\s*(\w+)/m.exec(readFileSync(new URL(`../../cards/${card}.md`,import.meta.url),"utf8"))?.[1] ?? "missing";
const futureContractStages = [
  {card:"C-024",edits:[
    [
      'interface ContentListQuery extends PageQuery { type?: ContentType; period?: string; tag?: string; grade?: Grade; topic?: string; sort?: "chronology" | "updated" | "title" }',
      'interface ContentListQuery extends PageQuery { type?: ContentType; period?: string; tag?: string; sort?: "chronology" | "updated" | "title" }',
    ],
    [
      '  sourceIds: string[]; mediaIds: string[]; curriculumRequirementIds: string[];\n',
      '  sourceIds: string[]; mediaIds: string[];\n',
    ],
  ]},
  {card:"C-026",edits:[[
    '  curriculum: CurriculumRequirementRef[]; lesson: LessonView | null; asOf: string | null;\n',
    '',
  ]]},
  {card:"C-027",edits:[
    ['  provenance: AssetProvenanceView | null;\n',''],
    [
      'interface MediaInput { url: string; kind: "IMAGE" | "DOCUMENT"; credit: string; license: string; altVi: string; altEn: string; captionVi?: string; captionEn?: string; provenance?: AssetProvenanceInput }',
      'interface MediaInput { url: string; kind: "IMAGE" | "DOCUMENT"; credit: string; license: string; altVi: string; altEn: string; captionVi?: string; captionEn?: string }',
    ],
  ]},
] as const;
const replaceExactly=(source:string,before:string,after:string,owner:string)=>{
  const index=source.indexOf(before);
  if(index<0||source.indexOf(before,index+before.length)>=0)throw new Error(`${owner} staged contract edit is missing or ambiguous`);
  return `${source.slice(0,index)}${after}${source.slice(index+before.length)}`;
};
const stagedContract=(source:string,statuses:Record<string,string>={})=>{
  let staged=source;
  for(const {card,edits} of futureContractStages){
    if((statuses[card]??cardStatus(card))!=="todo")continue;
    for(const [before,after] of edits)staged=replaceExactly(staged,before,after,card);
  }
  return staged;
};
const actionableDrift = (contractSource:string,document:unknown,statuses:Record<string,string>={}) =>
  contractShapeDrift(stagedContract(contractSource,statuses),document);
const mutate = (change:(document:MutableObject)=>void) => {
  const document = structuredClone(openApiDocument) as unknown as MutableObject;
  change(document);
  return actionableDrift(contract,document);
};

describe("planning to OpenAPI deep-shape audit",() => {
  it("accepts the unmodified runtime document",() => {
    expect(actionableDrift(contract,openApiDocument)).toEqual([]);
  });

  it.each(["done","missing","in_progress","malformed"])("fails closed when a future-card owner is %s",(status) => {
    expect(actionableDrift(contract,openApiDocument,{"C-024":status})).toEqual(expect.arrayContaining([
      expect.stringMatching(/AdminContentDetail|contents query|search query/),
    ]));
  });

  it("keeps existing fields audited within a staged C-024 shape",() => {
    const drift = mutate((document) => {
      const detail = objectAt(document,["components","schemas","AdminContentDetail"]);
      const properties = detail.properties as MutableObject;
      (properties.type as MutableObject).type = "number";
    });
    expect(drift).toContain("schema AdminContentDetail.type: expected string, OpenAPI number");
  });

  it("does not let a staged C-024 query field hide an existing query drift",() => {
    const drift=mutate((document)=>{
      const parameters=objectAt(document,["paths","/api/v1/{locale}/contents","get"]).parameters as MutableObject[];
      const period=parameters.find((parameter)=>parameter.name==="period");
      if(period)(period.schema as MutableObject).type="number";
    });
    expect(drift.join("\n")).toMatch(/contents query\.period: expected string, OpenAPI number/);
  });

  it("keeps existing C-026 and C-027 fields audited while their additions are staged",() => {
    const drift=mutate((document)=>{
      (objectAt(document,["components","schemas","ContentDetail","properties","body"])).type="number";
      (objectAt(document,["components","schemas","MediaView","properties","url"])).type="number";
    });
    expect(drift).toEqual(expect.arrayContaining([
      "schema ContentDetail.body: expected string, OpenAPI number",
      "schema MediaView.url: expected string, OpenAPI number",
    ]));
  });

  it.each([
    ["missing optional field",(document:MutableObject) => { delete objectAt(document,["components","schemas","SourceInput","properties"]).author; }],
    ["missing source governance field",(document:MutableObject) => { delete objectAt(document,["components","schemas","SourceInput","properties"]).sourceType; }],
    ["missing public claim statement field",(document:MutableObject) => { delete objectAt(document,["components","schemas","ClaimView","properties"]).statement; }],
    ["claim evidence item drift",(document:MutableObject) => { objectAt(document,["components","schemas","ClaimInput","properties","evidence"]).items = { type:"string" }; }],
    ["extra secret field",(document:MutableObject) => { objectAt(document,["components","schemas","UserView","properties"]).passwordHash = { type:"string" }; }],
    ["aliased enum drift",(document:MutableObject) => { objectAt(document,["components","schemas","AuthUser","properties","role"]).enum = ["ADMIN","EDITOR"]; }],
    ["nested array item drift",(document:MutableObject) => { objectAt(document,["components","schemas","ContentListItem","properties","tags"]).items = { type:"number" }; }],
    ["Partial Omit inheritance drift",(document:MutableObject) => { delete objectAt(document,["components","schemas","ContentUpdateInput","properties"]).sourceIds; }],
    ["query requiredness drift",(document:MutableObject) => {
      const parameters = objectAt(document,["paths","/api/v1/{locale}/taxonomies","get"]).parameters as MutableObject[];
      const query = parameters.find((parameter) => parameter.name === "q");
      if (query) query.required = true;
    }],
    ["cookie security drift",(document:MutableObject) => { delete objectAt(document,["paths","/api/v1/admin/dashboard","get"]).security; }],
    ["optional cookie security alternative",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get"]).security = [{},{cookieAuth:[]}]; }],
    ["cookie scope drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get"]).security = [{cookieAuth:["admin"]}]; }],
    ["public security drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/{locale}/home","get"]).security = [{otherAuth:[]}]; }],
    ["public role metadata drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/{locale}/home","get"])["x-allowed-roles"] = ["ADMIN"]; }],
    ["role metadata drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get"])["x-allowed-roles"] = ["ADMIN"]; }],
    ["optional request body",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/sources","post","requestBody"]).required = false; }],
    ["extra request media type",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/sources","post","requestBody","content"])["application/xml"] = {schema:{type:"string"}}; }],
    ["undocumented request body",(document:MutableObject) => { objectAt(document,["paths","/api/v1/auth/logout","post"]).requestBody = {required:true,content:{"text/plain":{schema:{type:"string"}}}}; }],
    ["GET request body",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get"]).requestBody = {required:true,content:{"application/json":{schema:{type:"object"}}}}; }],
    ["header parameter",(document:MutableObject) => { (objectAt(document,["paths","/api/v1/admin/dashboard","get"]).parameters = [{name:"x-debug",in:"header",required:true,schema:{type:"string"}}]); }],
    ["cookie parameter",(document:MutableObject) => { (objectAt(document,["paths","/api/v1/admin/dashboard","get"]).parameters = [{name:"debug",in:"cookie",schema:{type:"string"}}]); }],
    ["planned success status drift",(document:MutableObject) => {
      const responses = objectAt(document,["paths","/api/v1/admin/sources","post","responses"]);
      responses["202"] = responses["201"];
      delete responses["201"];
    }],
    ["extra success status",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/sources","post","responses"])["202"] = {description:"extra"}; }],
    ["extra error status",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get","responses"])["418"] = {description:"extra"}; }],
    ["default response",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get","responses"]).default = {description:"extra"}; }],
    ["response range",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get","responses"])["4XX"] = {description:"extra"}; }],
    ["plumbing media drift",(document:MutableObject) => {
      const response = objectAt(document,["paths","/docs","get","responses","200"]);
      response.content = {"application/json":{schema:{type:"string"}}};
    }],
    ["missing planned error status",(document:MutableObject) => { delete objectAt(document,["paths","/api/v1/{locale}/contents/{type}/{slug}","get","responses"])["404"]; }],
    ["error response shape drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/{locale}/contents/{type}/{slug}","get","responses","404","content","application/json"]).schema = {type:"string"}; }],
    ["response wrapper drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get","responses","200","content","application/json","schema","properties","data"]).$ref = "#/components/schemas/AuthUser"; }],
  ])("reports %s with a useful path",(_name,change) => {
    const drift = mutate(change);
    expect(drift.length).toBeGreaterThan(0);
    expect(drift.join("\n")).toMatch(/(?:schema|request|response|query|roles|security|cookieAuth|shape|status|parameters)/);
  });

  it("resolves a generic response type alias instead of accepting it as any",() => {
    const aliased = contract.replace("interface DataResponse<T> { data: T }","type DataResponse<T> = { data: T };");
    const document = structuredClone(openApiDocument) as unknown as MutableObject;
    objectAt(document,["paths","/api/v1/admin/dashboard","get","responses","200","content","application/json","schema","properties"]).data = {type:"string"};
    expect(actionableDrift(aliased,document).join("\n")).toContain("dashboard response.200.data");
  });

  it("fails closed on an unresolved planning type",() => {
    const unresolved = contract.replace("interface AuthUser { id: string; email: string; displayName: string; role: Role }","interface AuthUser { id: string; email: string; displayName: string; role: MissingRole }");
    expect(actionableDrift(unresolved,openApiDocument).join("\n")).toContain("unresolved");
  });

  it("fails closed on unrecognized access prose",() => {
    const unknownAccess = contract.replace("Editor/Reviewer/Admin; no write","Editor/Admin; no write");
    expect(actionableDrift(unknownAccess,openApiDocument).join("\n")).toContain("unrecognized access grammar");
  });

  it("fails closed on an unrecognized response descriptor",() => {
    const unknownResponse = contract.replace("application/json 200 object containing the OpenAPI","application/json 200 mystery containing the OpenAPI");
    expect(actionableDrift(unknownResponse,openApiDocument).join("\n")).toContain("unrecognized planned response descriptor");
  });
});
