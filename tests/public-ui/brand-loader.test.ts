import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const loading=readFileSync(new URL("../../src/app/[locale]/loading.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");
const design=readFileSync(new URL("../../DESIGN.md",import.meta.url),"utf8");

describe("brand route loader",()=>{
  it("replaces visible copy and skeletons with the shared accessible mark",()=>{
    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-label="Đang tải nội dung / Loading content"');
    expect(loading).toContain("<title>Quân Sử Việt — Đang tải / Loading</title>");
    expect(loading).toContain('<BrandMark className="brand-loading-mark"/>');
    expect(loading).toContain("data-brand-loader");
    expect(loading).not.toContain("loading-line");
    expect(loading).not.toMatch(/<p>|Loading published content|Đang tải nội dung đã xuất bản/);
  });

  it("uses fixed-geometry brand motion and an explicit static fallback",()=>{
    expect(css).toContain("--motion-duration-loader: 1400ms");
    expect(css).toContain("@keyframes brand-loader-orbit");
    expect(css).toContain("@keyframes brand-loader-breathe");
    expect(css).toContain("@keyframes brand-loader-ripple");
    expect(css).toMatch(/\.brand-loading-emblem::before,[^}]+\.brand-loading-ripple \{ animation: none!important;/s);
    expect(css).not.toContain(".loading-line");
    expect(design).toContain("The route loader reuses the shared stroke-only `BrandMark`");
  });
});
