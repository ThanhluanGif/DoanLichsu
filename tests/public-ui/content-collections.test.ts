import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const route=readFileSync(new URL("../../src/app/[locale]/[kind]/page.tsx",import.meta.url),"utf8");
const home=readFileSync(new URL("../../src/app/[locale]/page.tsx",import.meta.url),"utf8");
const detail=readFileSync(new URL("../../src/app/[locale]/[kind]/[slug]/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("public content collections",()=>{
  it("maps locale kind to the existing published content contract",()=>{
    expect(route).toContain("contentTypeFromLocaleSegment(locale,kind)");
    expect(route).toContain("getPublicClient().contents");
    expect(route).toContain('new URLSearchParams({type,sort,page:String(page),pageSize:"12"})');
    expect(route).toContain("<Pagination");
    expect(route).not.toContain('"use client"');
  });

  it("links home counts and detail breadcrumbs to canonical collections",()=>{
    expect(home).toContain('(["PERIOD","EVENT","PERSON","ARTIFACT"] as const).map');
    expect(home).toContain("contentCollectionPath(locale,type)");
    expect(detail).toContain('href={contentCollectionPath(locale,type)}');
    expect(css).toContain(".pulse-strip > a");
    expect(css).toContain(".collection-summary");
  });
});
