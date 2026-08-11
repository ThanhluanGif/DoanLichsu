import { readFileSync,statSync } from "node:fs";
import { describe,expect,it } from "vitest";

const root=new URL("../..",import.meta.url);
const read=(path:string)=>readFileSync(new URL(path,root),"utf8");

describe("public curriculum catalogue",()=>{
  it("ships both canonical locale routes and a shared grade presentation",()=>{
    expect(()=>statSync(new URL("src/app/[locale]/hoc-theo-lop/page.tsx",root))).not.toThrow();
    expect(()=>statSync(new URL("src/app/[locale]/learn-by-grade/page.tsx",root))).not.toThrow();
    expect(()=>statSync(new URL("src/app/[locale]/hoc-theo-lop/[grade]/page.tsx",root))).not.toThrow();
    expect(()=>statSync(new URL("src/app/[locale]/learn-by-grade/[grade]/page.tsx",root))).not.toThrow();
    const catalog=read("src/components/public/CurriculumCatalogPage.tsx");
    const grade=read("src/components/public/CurriculumGradePage.tsx");
    expect(catalog).toContain("data.grades.filter((grade)=>grade.publishedRequirementCount>0");
    expect(grade).toContain("requirement.publishedCount>0 && requirement.lessons.length>0");
    expect(grade).toContain("requirement.track === \"MANDATORY\"");
    expect(grade).toContain("requirement.track === \"ELECTIVE\"");
    expect(grade).toContain("curriculumCoveragePending");
    expect(grade).not.toContain('"Đầy đủ"');
  });

  it("keeps source and outcome disclosures separate from lesson cards",()=>{
    const source=read("src/components/public/CurriculumGradePage.tsx");
    expect(source).toContain("curriculum-requirement-source");
    expect(source).toContain("curriculum-requirement-outcomes");
    expect(source).toContain("<ContentCard");
    const shell=read("src/components/public/PublicShell.tsx");
    expect(shell).toContain("learnByGradePath(locale)");
  });

  it("adds curriculum routes to the sitemap only when the API reports published lessons",()=>{
    const source=read("src/app/sitemap.ts");
    expect(source).toContain("client.curriculum(\"vi\")");
    expect(source).toContain("publishedRequirementCount>0 && item.publishedLessonCount>0");
    expect(source).toContain("learnByGradePath(locale,grade.grade)");
  });
});
