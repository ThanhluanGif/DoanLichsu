import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as createMediaRoute } from "@/app/api/v1/admin/media/route";

const origin = "http://provenance.test";
const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-provenance-"));
const databasePath = join(directory, "provenance.db");

function request(method:string,path:string,body?:unknown,cookie?:string){
  const headers = new Headers({ Origin: origin });
  if(body!==undefined) headers.set("Content-Type","application/json");
  if(cookie) headers.set("Cookie",cookie);
  return new Request(`${origin}${path}`,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
}

async function adminCookie(){
  const response=await loginRoute(request("POST","/api/v1/auth/login",{email:"admin@quansuviet.local",password:"Admin-Demo-2026!"}));
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";",1)[0];
}

beforeAll(()=>{
  process.env.DATABASE_PATH=databasePath;
  process.env.APP_ORIGIN=origin;
  process.env.SESSION_SECRET="provenance-test-session-secret-at-least-thirty-two-characters";
  migrateDatabase(databasePath);
  const seed=spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),encoding:"utf8",env:{...process.env,DATABASE_PATH:databasePath}});
  if(seed.status!==0) throw new Error(seed.stderr);
});

afterAll(()=>rmSync(directory,{recursive:true,force:true}));

describe("media provenance rights gate",()=>{
  it("rejects permitted media without permission and returns provenance for allowed records",async()=>{
    const cookie=await adminCookie();
    const base={url:"https://archive.example/media/photo.jpg",kind:"IMAGE",credit:"Archive credit",license:"CC BY 4.0",altVi:"Ảnh lưu trữ",altEn:"Archive photo"};
    const missingPermission=await createMediaRoute(request("POST","/api/v1/admin/media",{...base,rightsStatus:"PERMITTED"},cookie));
    expect(missingPermission.status).toBe(400);
    expect((await missingPermission.json()).details.fieldErrors.permissionDocument).toBeDefined();

    const permitted=await createMediaRoute(request("POST","/api/v1/admin/media",{...base,holdingInstitution:"Archives",inventoryId:"INV-27",origin:"External archive; no binary copy",rightsStatus:"PERMITTED",permissionDocument:"https://archive.example/permission/27",creditLine:"Archives / INV-27",checksum:"a".repeat(64)},cookie));
    expect(permitted.status).toBe(201);
    expect((await permitted.json()).data.provenance).toEqual({holdingInstitution:"Archives",inventoryId:"INV-27",origin:"External archive; no binary copy",rightsStatus:"PERMITTED",permissionDocument:"https://archive.example/permission/27",creditLine:"Archives / INV-27",checksum:"a".repeat(64)});
  });
});
