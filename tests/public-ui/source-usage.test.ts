import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const page=readFileSync(new URL("../../src/app/[locale]/sources/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("source usage disclosure",()=>{
  it("uses a native disclosure with canonical public content links",()=>{
    expect(page).toContain('<details className="source-usage"><summary>');
    expect(page).toContain("contentPath(locale,item.type,item.slug)");
    expect(page).toContain("source.contents.map");
  });

  it("stays server-rendered and keyboard-native without a client observer",()=>{
    expect(page).not.toContain('"use client"');expect(page).not.toMatch(/useEffect|IntersectionObserver|addEventListener/);
    expect(css).toContain(".source-usage summary");expect(css).toContain(".source-usage[open] summary::after");expect(css).not.toMatch(/\.source-usage[^}]*background:\s*var\(--grad-/);
  });
});
