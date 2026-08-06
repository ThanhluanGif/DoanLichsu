import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { openApiDocument } from "../../src/lib/openapi/document";
import { contractShapeDrift } from "../../scripts/contract-shape.mjs";

type MutableObject = Record<string,unknown>;

const contract = readFileSync(new URL("../../flow/05-contract.md",import.meta.url),"utf8");
const objectAt = (root:unknown,path:string[]) => path.reduce<unknown>((value,key) => (value as MutableObject)[key],root) as MutableObject;
const mutate = (change:(document:MutableObject)=>void) => {
  const document = structuredClone(openApiDocument) as unknown as MutableObject;
  change(document);
  return contractShapeDrift(contract,document);
};

describe("planning to OpenAPI deep-shape audit",() => {
  it("accepts the unmodified runtime document",() => {
    expect(contractShapeDrift(contract,openApiDocument)).toEqual([]);
  });

  it.each([
    ["missing optional field",(document:MutableObject) => { delete objectAt(document,["components","schemas","SourceInput","properties"]).author; }],
    ["extra secret field",(document:MutableObject) => { objectAt(document,["components","schemas","UserView","properties"]).passwordHash = { type:"string" }; }],
    ["aliased enum drift",(document:MutableObject) => { objectAt(document,["components","schemas","AuthUser","properties","role"]).enum = ["ADMIN","EDITOR"]; }],
    ["nested array item drift",(document:MutableObject) => { objectAt(document,["components","schemas","ContentListItem","properties","tags"]).items = { type:"number" }; }],
    ["Partial Omit inheritance drift",(document:MutableObject) => { delete objectAt(document,["components","schemas","ContentUpdateInput","properties"]).sourceIds; }],
    ["query requiredness drift",(document:MutableObject) => {
      const parameters = objectAt(document,["paths","/api/v1/{locale}/search","get"]).parameters as MutableObject[];
      const query = parameters.find((parameter) => parameter.name === "q");
      if (query) query.required = false;
    }],
    ["cookie security drift",(document:MutableObject) => { delete objectAt(document,["paths","/api/v1/admin/dashboard","get"]).security; }],
    ["role metadata drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get"])["x-allowed-roles"] = ["ADMIN"]; }],
    ["response wrapper drift",(document:MutableObject) => { objectAt(document,["paths","/api/v1/admin/dashboard","get","responses","200","content","application/json","schema","properties","data"]).$ref = "#/components/schemas/AuthUser"; }],
  ])("reports %s with a useful path",(_name,change) => {
    const drift = mutate(change);
    expect(drift.length).toBeGreaterThan(0);
    expect(drift.join("\n")).toMatch(/(?:request|response|query|roles|cookieAuth|shape)/);
  });
});
