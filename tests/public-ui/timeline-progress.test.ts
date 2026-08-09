import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const css=readFileSync(resolve(root,"src/app/globals.css"),"utf8");
const design=readFileSync(resolve(root,"DESIGN.md"),"utf8");

function keyframes(name:string){const match=css.match(new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`));expect(match,`${name} keyframes should exist`).not.toBeNull();return match?.[1]??"";}

describe("timeline reading progress contract",()=>{
  it("keeps a static chronology as the unsupported-browser baseline",()=>{
    expect(css).toMatch(/\.timeline-list::before\s*\{[^}]*background:\s*var\(--border\)[^}]*content:\s*""/);
    expect(css).toMatch(/\.timeline-list::after\s*\{[^}]*opacity:\s*0[^}]*scale:\s*1 0/);
    expect(css).toContain("@supports (animation-timeline: view())");
  });

  it("attaches progress and dot focus only as view-timeline enhancement",()=>{
    const support=css.match(/@supports\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/)?.[1]??"";
    expect(support).toMatch(/\.timeline-list::after\s*\{[^}]*animation-name:\s*timeline-progress[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*entry 0% exit 100%/);
    expect(support).toMatch(/\.timeline-dot\s*\{[^}]*animation-name:\s*timeline-focus[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*entry 0% exit 100%/);
  });

  it("uses paint-only individual properties and never scales event content",()=>{
    for(const name of ["timeline-progress","timeline-focus"]){const body=keyframes(name);expect(body).toContain("opacity:");expect(body).toContain("scale:");expect(body).not.toMatch(/\btransform\s*:/);expect(body).not.toMatch(/\b(?:top|right|bottom|left|width|height|margin|padding)\s*:/);}
    expect(keyframes("timeline-focus")).toContain("scale: 1.45");
    expect(css).not.toMatch(/\.timeline-entry-copy[^}]*\bscale\s*:/);
    expect(css).not.toContain("IntersectionObserver");
  });

  it("fully removes dynamic progress for reduced motion",()=>{
    const reduced=css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1]??"";
    expect(reduced).toContain("animation: none!important");
    expect(reduced).toMatch(/\.timeline-list::after\s*\{\s*opacity:\s*0!important;\s*scale:\s*none!important/);
    expect(reduced).toMatch(/\.timeline-dot\s*\{\s*opacity:\s*1!important;\s*scale:\s*none!important/);
    expect(design).toContain("decorative\n  progress line and dots only");
    expect(design).toContain("original static chronology line remains visible");
  });
});
