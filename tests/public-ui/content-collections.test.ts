import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const route=readFileSync(new URL("../../src/app/[locale]/[kind]/page.tsx",import.meta.url),"utf8");
const home=readFileSync(new URL("../../src/app/[locale]/page.tsx",import.meta.url),"utf8");
const detail=readFileSync(new URL("../../src/app/[locale]/[kind]/[slug]/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("public content collections",()=>{
  it("maps locale kind to the existing published content contract",()=>{
    expect(route).toContain("contentTypeFromLocaleSegment(locale,kind)");
    expect(route).toContain("const client=getPublicClient()");
    expect(route).toContain("client.taxonomies(locale,facetParams(period,tag))");
    expect(route).toContain("client.contents(locale,apiQuery)");
    expect(route).toContain('new URLSearchParams({type,sort,page:String(page),pageSize:"12"})');
    expect(route).toContain('apiQuery.set("tag",tag)');
    expect(route).toContain("<Pagination");
    expect(route).not.toContain('"use client"');
  });

  it("keeps collection controls in native URL state and maps period locale by id",()=>{
    expect(route).toContain("<UrlStateForm");
    expect(route).toContain('name="sort"');
    expect(route).toContain('name="period"');
    expect(route).toContain('name="tag"');
    expect(route).toContain("if(period&&!facets.periods.some((option)=>option.value===period))period=undefined");
    expect(route).toContain("const otherPeriod=selectedPeriod?periodMaps?.[1].data.find((item)=>item.id===selectedPeriod.id)?.slug:undefined");
    expect(route).toContain("<CopyLinkButton");
    expect(route).toContain("query={paginationQuery}");
    expect(route).not.toMatch(/useState|useEffect|useRouter|addEventListener/);
    expect(css).toContain(".collection-filter");
    expect(css).not.toMatch(/\.collection-filter[^}]*gradient/);
  });

  it("links home counts and detail breadcrumbs to canonical collections",()=>{
    expect(home).toContain('(["PERIOD","EVENT","PERSON","ARTIFACT"] as const).map');
    expect(home).toContain("contentCollectionPath(locale,type)");
    expect(detail).toContain('href={contentCollectionPath(locale,type)}');
    expect(css).toContain(".pulse-strip > a");
    expect(css).toContain(".collection-summary");
  });
});
