import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const mark=readFileSync(new URL("../../src/components/BrandMark.tsx",import.meta.url),"utf8");
const favicon=readFileSync(new URL("../../src/app/icon.svg",import.meta.url),"utf8");
const surfaces=["PublicShell.tsx","../admin/AdminShell.tsx","../admin/LoginForm.tsx"].map((file)=>readFileSync(new URL(`../../src/components/public/${file}`,import.meta.url),"utf8"));
const docs=readFileSync(new URL("../../src/app/docs/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("shared brand system",()=>{
  it("uses one stroke-only SVG mark on every product surface",()=>{
    for(const surface of [...surfaces,docs])expect(surface).toContain("<BrandMark/>");
    expect(mark).toContain('viewBox="0 0 48 48"');expect(mark).toContain('stroke="currentColor"');expect(mark).toContain('strokeWidth="1.8"');expect(mark).toContain('aria-hidden="true"');
    expect(mark).not.toMatch(/<text|>QS</);expect(css).not.toContain("letter-spacing: -0.05em");
  });

  it("keeps the favicon on the same geometry without a network asset",()=>{
    for(const geometry of ['cx="24" cy="24" r="21"','M10 31c4.7-3.8','M12 36c4-2.7']){expect(mark).toContain(geometry);expect(favicon).toContain(geometry);}
    expect(favicon).toContain('stroke="currentColor"');expect(favicon).not.toMatch(/(?:href|src)=["']https?:|data:|<image/);
  });
});
