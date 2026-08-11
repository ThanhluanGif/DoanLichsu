import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const detail=readFileSync(new URL("../../src/app/[locale]/[kind]/[slug]/page.tsx",import.meta.url),"utf8");
const repository=readFileSync(new URL("../../src/lib/content/public-repository.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../../migrations/0006_lessons.sql",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("lesson detail source-aware contract",()=>{
  it("keeps lesson sections separate from the existing generic detail body",()=>{
    expect(detail).toContain("detail.lesson?");
    for(const section of ["lesson-objectives","lesson-summary","lesson-analysis","lesson-debates","lesson-claims","nguon-tu-lieu"])expect(detail).toContain(section);
    expect(detail).toContain("detail.claims.length?");
    expect(detail).toContain("lessonNoClaims");
    expect(repository).toContain("lesson_translations");
    expect(repository).toContain("lesson:lessonData?.lesson ?? null");
    expect(repository).toContain("asOf:lessonData?.asOf ?? null");
  });

  it("requires bilingual objectives, analysis, debates and UTC review time in storage",()=>{
    expect(migration).toContain("CREATE TABLE lesson_translations");
    expect(migration).toContain("learning_objectives TEXT NOT NULL");
    expect(migration).toContain("json_type(learning_objectives) = 'array'");
    expect(migration).toContain("json_type(debates) = 'array'");
    expect(migration).toContain("as_of TEXT NOT NULL");
    expect(migration).toContain("lesson_seed_dien_bien_phu_translation");
    expect(css).toContain(".lesson-content");
    expect(css).toContain(".lesson-intro-grid");
  });
});
