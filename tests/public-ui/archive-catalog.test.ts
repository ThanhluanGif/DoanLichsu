import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const page=readFileSync(new URL("../../src/app/[locale]/tu-lieu/page.tsx",import.meta.url),"utf8");
const paths=readFileSync(new URL("../../src/lib/public-client/paths.ts",import.meta.url),"utf8");
const shell=readFileSync(new URL("../../src/components/public/PublicShell.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("source archive entry",()=>{
  it("uses the existing public sources API and only offers non-empty institutions",()=>{
    expect(page).toContain("client.sources");
    expect(page).toContain("new URLSearchParams({page:\"1\",pageSize:\"50\"})");
    expect(page).toContain("first.meta.totalPages");
    expect(page).toContain("page:String(index+2)");
    expect(page).toContain("institution");
    expect(page).toContain("target=\"_blank\"");
    expect(paths).toContain("archivePath");
    expect(shell).toContain("archivePath(locale)");
    expect(css).toContain(".archive-filter");
  });
});
