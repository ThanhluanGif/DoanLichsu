import { readFileSync,readdirSync,statSync } from "node:fs";
import { join,resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
function filesBelow(path:string):string[]{return readdirSync(path).flatMap((name)=>{const absolute=join(path,name);return statSync(absolute).isDirectory()?filesBelow(absolute):[absolute];});}
const publicFiles=filesBelow(join(root,"src/app/[locale]")).concat(filesBelow(join(root,"src/components/public")));
const source=publicFiles.map((file)=>readFileSync(file,"utf8")).join("\n");

describe("approved public visual and semantic contract",()=>{
  it("ships required journey surfaces and explicit loading/error states",()=>{
    for(const path of [
      "src/app/[locale]/page.tsx","src/app/[locale]/timeline/page.tsx","src/app/[locale]/tim-kiem/page.tsx","src/app/[locale]/search/page.tsx",
      "src/app/[locale]/[kind]/[slug]/page.tsx","src/app/[locale]/loading.tsx","src/app/[locale]/error.tsx","src/app/[locale]/not-found.tsx",
    ])expect(()=>statSync(join(root,path))).not.toThrow();
  });

  it("contains accessibility and metadata seams without admin surface logic",()=>{
    expect(source).toContain("skip-link");
    expect(source).toContain("aria-live");
    expect(source).toContain("generateMetadata");
    expect(source).toContain("application/ld+json");
    expect(source).toContain("alternateApiToPublicPath");
    expect(source).not.toMatch(/href=[{\"]?[`\"]?\/api\/v1\//);
    expect(source).not.toMatch(/\/api\/v1\/admin|admin\/dashboard|submit-review/);
  });

  it("uses the approved hero assets and no emoji glyphs",()=>{
    for(const asset of ["hero-history.png","hero-history.webp","hero-history-mobile.webp"])expect(statSync(join(root,"public/images",asset)).size).toBeGreaterThan(10_000);
    expect(source).not.toMatch(/[😀-🙏🌀-🫿]/u);
  });
});
