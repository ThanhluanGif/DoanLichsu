import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { createPublicClient } from "@/lib/public-client/client";
import { homePath,sourcesPath } from "@/lib/public-client/paths";

describe("public sources navigation",()=>{
  it("gives sources a standalone bilingual canonical path",()=>{
    expect(sourcesPath("vi")).toBe("/vi/sources");expect(sourcesPath("en","?page=2")).toBe("/en/sources?page=2");expect(homePath("vi")).toBe("/vi");
  });

  it("links primary navigation and the home teaser to the directory instead of a home anchor",()=>{
    const shell=readFileSync(new URL("../../src/components/public/PublicShell.tsx",import.meta.url),"utf8");
    const home=readFileSync(new URL("../../src/app/[locale]/page.tsx",import.meta.url),"utf8");
    const page=readFileSync(new URL("../../src/app/[locale]/sources/page.tsx",import.meta.url),"utf8");
    expect(shell).toContain("<Link href={homePath(locale)}>{copy.home}</Link>");expect(shell).toContain("<Link href={sourcesPath(locale)}>{copy.navSources}</Link>");expect(shell).not.toContain("#nguon-tu-lieu`}>{copy.navSources}");
    expect(home).toContain('href={sourcesPath(locale)}');expect(page).toContain('href={homePath(locale)}');expect(page).toContain('localeHref={sourcesPath(other)}');
  });

  it("requests the public sources endpoint without client-side shape drift",async()=>{
    const fetcher=async(input:RequestInfo|URL)=>{expect(String(input)).toBe("https://history.example/api/v1/vi/sources?page=2&pageSize=20");return new Response(JSON.stringify({data:[],meta:{page:2,pageSize:20,total:20,totalPages:1}}));};
    const result=await createPublicClient({origin:"https://history.example",fetcher}).sources("vi",new URLSearchParams({page:"2",pageSize:"20"}));
    expect(result.meta.page).toBe(2);
  });
});
