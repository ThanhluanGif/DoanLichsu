import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const collection=readFileSync(new URL("../../src/app/[locale]/[kind]/page.tsx",import.meta.url),"utf8");
const timeline=readFileSync(new URL("../../src/app/[locale]/timeline/page.tsx",import.meta.url),"utf8");
const searchPage=readFileSync(new URL("../../src/components/public/SearchResultsPage.tsx",import.meta.url),"utf8");
const searchForm=readFileSync(new URL("../../src/components/public/SearchForm.tsx",import.meta.url),"utf8");
const copyButton=readFileSync(new URL("../../src/components/public/CopyLinkButton.tsx",import.meta.url),"utf8");

describe("contextual public facets",()=>{
  it("uses the contracted consumer scope on every public surface",()=>{
    expect(collection).toContain('scope:"contents"');
    expect(timeline).toContain('scope:"timeline"');
    expect(searchPage).toContain('scope:q?"search":"contents"');
    for(const source of [collection,timeline,searchPage]){
      expect(source).toContain("client.taxonomies(locale");
      expect(source).toContain("facets.periods.some");
      expect(source).toContain("facets.tags.some");
      expect(source).toContain("<CopyLinkButton");
    }
  });

  it("keeps search state canonical and restores tag on browser history",()=>{
    expect(searchForm).toContain('search.get("tag")??""');
    expect(searchForm).toContain('window.addEventListener("popstate",syncFromUrl)');
    expect(searchForm).toContain("if(normalized)params.set(key,normalized)");
    expect(searchForm).toContain("facets.types.map");
    expect(searchForm).toContain("facets.periods.map");
    expect(searchForm).toContain("facets.tags.map");
    expect(searchForm).not.toContain("as ContentType[]).map");
    expect(searchForm).toContain("export function UrlStateForm");
    expect(searchForm).toContain("const searchParams=useSearchParams()");
    expect(searchForm).toContain('window.addEventListener("pageshow",syncHistoryPage)');
    expect(searchForm).toContain('navigationType()==="back_forward"');
    expect(searchForm).toContain("window.requestAnimationFrame(syncIfCurrent)");
    expect(searchForm).toContain('form?.addEventListener("change",cancelPendingSync)');
    expect(searchForm).toContain("previousQuery.current!==serializedQuery");
    expect(collection).toContain("<UrlStateForm");
    expect(timeline).toContain("<UrlStateForm");
    expect(collection).toContain("page:page>1?page:undefined");
    expect(timeline).toContain("page:page>1?page:undefined");
    expect(copyButton).toContain("navigator.clipboard?.writeText");
    expect(copyButton).toContain('document.execCommand("copy")');
  });
});
