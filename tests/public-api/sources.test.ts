import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { mkdtempSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { GET as sources } from "@/app/api/v1/[locale]/sources/route";
import { migrateDatabase } from "@/lib/db/migrate";
import { openApiDocument } from "@/lib/openapi/document";

const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-public-sources-"));
const databasePath=join(directory,"sources.db");
const context=(locale:string)=>({params:Promise.resolve({locale})});

beforeAll(()=>{
  process.env.DATABASE_PATH=databasePath;migrateDatabase(databasePath);
  execFileSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),env:{...process.env,DATABASE_PATH:databasePath},stdio:"pipe"});
  const database=new Database(databasePath);const original=database.prepare("SELECT * FROM sources WHERE id = ?").get("source-event-dien-bien-phu") as Record<string,unknown>;
  database.prepare(`INSERT INTO sources (id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run("source-duplicate-url","Duplicate metadata",null,null,null,original.url,original.accessed_at,null,original.created_at,original.updated_at);
  database.prepare("INSERT INTO content_sources (content_id,source_id,sort_order) VALUES (?,?,?)").run("event-bach-dang-938","source-duplicate-url",9);
  database.prepare(`INSERT INTO sources (id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run("source-locale-only","Locale-only source",null,"Example archive",2026,"https://example.org/locale-only",original.accessed_at,null,original.created_at,original.updated_at);
  database.prepare("INSERT INTO content_sources (content_id,source_id,sort_order) VALUES (?,?,?)").run("artifact-mig21-4324","source-locale-only",9);
  database.close();
});

afterAll(()=>{delete process.env.DATABASE_PATH;rmSync(directory,{recursive:true,force:true});});

describe("public source directory API",()=>{
  it("returns exact paginated shape with one row per URL and deterministic ordering",async()=>{
    const first=await sources(new Request("http://local/api/v1/vi/sources?page=1&pageSize=5"),context("vi"));const body=await first.json();
    expect(first.status).toBe(200);expect(Object.keys(body)).toEqual(["data","meta"]);expect(body.meta).toEqual({page:1,pageSize:5,total:9,totalPages:2});
    expect(Object.keys(body.data[0])).toEqual(["id","title","author","publisher","year","url","accessedAt","citationNote","contentCount"]);
    const all=await (await sources(new Request("http://local/api/v1/vi/sources?page=1&pageSize=50"),context("vi"))).json();
    expect(new Set(all.data.map((item:{url:string})=>item.url)).size).toBe(all.data.length);
    const repeated=await (await sources(new Request("http://local/api/v1/vi/sources?page=1&pageSize=5"),context("vi"))).json();expect(repeated.data.map((item:{id:string})=>item.id)).toEqual(body.data.map((item:{id:string})=>item.id));
    expect(all.data.find((item:{url:string})=>item.url==="https://www.britannica.com/event/Battle-of-Dien-Bien-Phu").contentCount).toBeGreaterThanOrEqual(2);
  });

  it("excludes a source when the requested-locale translation is not published",async()=>{
    const vi=await (await sources(new Request("http://local/api/v1/vi/sources?pageSize=50"),context("vi"))).json();
    const en=await (await sources(new Request("http://local/api/v1/en/sources?pageSize=50"),context("en"))).json();
    expect(vi.data.some((item:{id:string})=>item.id==="source-locale-only")).toBe(true);
    expect(en.data.some((item:{id:string})=>item.id==="source-locale-only")).toBe(false);
    expect(en.meta.total).toBe(8);
  });

  it("validates locale and pagination and publishes the runtime contract",async()=>{
    for(const [request,locale,status,code] of [
      ["http://local/api/v1/fr/sources","fr",404,"LOCALE_NOT_FOUND"],
      ["http://local/api/v1/vi/sources?page=0","vi",400,"INVALID_QUERY"],
      ["http://local/api/v1/vi/sources?pageSize=51","vi",400,"INVALID_QUERY"],
    ] as const){const response=await sources(new Request(request),context(locale));expect(response.status).toBe(status);expect(await response.json()).toMatchObject({code,requestId:expect.any(String)});}
    const endpoint=openApiDocument.paths["/api/v1/{locale}/sources"].get;
    const responseSchema=endpoint.responses["200"].content["application/json"].schema as {properties:{data:{items:{$ref:string}}}};
    expect(endpoint.operationId).toBe("listPublicSources");expect(responseSchema.properties.data.items.$ref).toBe("#/components/schemas/PublicSourceItem");
    expect(openApiDocument.components.schemas.PublicSourceItem.required).toContain("contentCount");
  });
});
