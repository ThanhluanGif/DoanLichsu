import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");const read=(path:string)=>readFileSync(resolve(root,path),"utf8");
describe("release hardening contract",()=>{
  it("runs the container non-root with a loopback-only port and persistent data",()=>{
    expect(read("Dockerfile")).toContain("USER node");expect(read("Dockerfile")).toContain("HEALTHCHECK");
    const compose=read("docker-compose.yml");expect(compose).toContain('127.0.0.1:${RELEASE_PORT:-3002}:3000');expect(compose).toContain("release-data:/data");expect(compose).toContain("no-new-privileges:true");expect(compose).toContain("cap_drop:");
  });
  it("keeps Playwright credentials in environment-only seams and failure-only artifacts",()=>{
    const config=read("playwright.config.ts");expect(config).toContain('screenshot:"only-on-failure"');expect(config).toContain('trace:"retain-on-failure"');
    const sources=read("tests/e2e/support.ts");expect(sources).not.toMatch(/Demo-2026|password:\s*["'][^"']+["']/);
  });
  it("declares the required browser security headers",()=>{
    const config=read("next.config.ts");for(const header of ["Content-Security-Policy","Strict-Transport-Security","X-Content-Type-Options","X-Frame-Options","Permissions-Policy","Referrer-Policy"])expect(config).toContain(header);
  });
});
