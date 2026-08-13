import { readFileSync,statSync } from "node:fs";
import { join,resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const read=(path:string)=>readFileSync(join(root,path),"utf8");

describe("admin UI contract",()=>{
  it("ships every editorial journey route",()=>{
    for(const path of ["src/app/admin/login/page.tsx","src/app/admin/page.tsx","src/app/admin/contents/page.tsx","src/app/admin/contents/new/page.tsx","src/app/admin/contents/[id]/page.tsx","src/app/admin/review/page.tsx","src/app/admin/sources/page.tsx","src/app/admin/media/page.tsx","src/app/admin/users/page.tsx","src/app/admin/audit/page.tsx","src/app/admin/published-history/page.tsx"])expect(()=>statSync(join(root,path))).not.toThrow();
  });
  it("keeps the create and translation surfaces within six primary fields",()=>{
    const source=read("src/components/admin/ContentEditor.tsx");const [creation,editor]=source.split("export function ContentEditorPage");
    expect(creation.match(/data-primary-field/g)).toHaveLength(5);
    expect(editor.match(/data-primary-field/g)).toHaveLength(4);
    expect(source).toContain("Tùy chọn thêm");
  });
  it("uses every workflow endpoint and exposes stale/unsaved handling",()=>{
    const source=read("src/components/admin/ContentEditor.tsx");
    for(const action of ["submit-review","reject","approve","publish"])expect(source).toContain(`/\${id}/${action}`);
    expect(source).toContain("beforeunload");expect(source).toContain("window.confirm");expect(source).toContain('document.addEventListener("click",guard,true)');
    expect(read("src/lib/admin-client/client.ts")).toContain("error.status===409");
  });
  it("defaults hidden SEO fields instead of blocking a new translation",()=>{
    const source=read("src/components/admin/ContentEditor.tsx");
    expect(source).toContain("seoTitle:translation.seoTitle||translation.title");
    expect(source).toContain("seoDescription:translation.seoDescription||translation.summary");
  });
  it("offers every audit filter from the planning contract",()=>{
    const source=read("src/components/admin/AuditLogPage.tsx");
    for(const field of ["actorId","action","objectType","objectId","from","to"])expect(source).toContain(field);
  });
  it("contains no raw HTML surface or emoji glyphs",()=>{
    const source=[read("src/components/admin/AdminShell.tsx"),read("src/components/admin/LoginForm.tsx"),read("src/components/admin/AdminPages.tsx"),read("src/components/admin/ContentEditor.tsx")].join("\n");
    expect(source).not.toContain("dangerouslySetInnerHTML");
    expect(source).not.toMatch(/[😀-🙏🌀-🫿]/u);
  });
});
