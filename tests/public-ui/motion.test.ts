import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const css=readFileSync(resolve(root,"src/app/globals.css"),"utf8");
const template=readFileSync(resolve(root,"src/app/[locale]/template.tsx"),"utf8");

function keyframes(name:string){
  const match=css.match(new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`,"m"));
  expect(match,`${name} keyframes should exist`).not.toBeNull();
  return match?.[1]??"";
}

describe("public motion contract",()=>{
  it("remounts a route-transition wrapper for locale navigation",()=>{
    expect(template).toContain('className="route-transition"');
    expect(css).toMatch(/\.route-transition\s*\{[^}]*animation:\s*route-enter/);
  });

  it("limits motion keyframes to opacity and individual translate",()=>{
    for(const name of ["route-enter","content-reveal"]){
      const body=keyframes(name);
      expect(body).toContain("opacity:");
      expect(body).toContain("translate:");
      expect(body).not.toMatch(/\btransform\s*:/);
      expect(body).not.toMatch(/\b(?:top|right|bottom|left|width|height|margin|padding)\s*:/);
    }
    expect(keyframes("route-enter")).toContain("opacity: .01");
  });

  it("uses view timelines only as progressive enhancement",()=>{
    expect(css).toContain("@supports (animation-timeline: view())");
    expect(css).toMatch(/\.period-card,\.content-card,\.timeline-entry,\.source-promise\s*\{/);
    expect(css).toContain("animation-timeline: view()");
    expect(css).not.toMatch(/(?:\.period-card|\.content-card|\.timeline-entry|\.source-promise)[^{]*\{[^}]*opacity:\s*0[^}]*\}(?![\s\S]*@supports)/);
  });

  it("fully disables public motion when reduced motion is requested",()=>{
    const reduced=css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1]??"";
    expect(reduced).toContain("animation: none!important");
    expect(reduced).toContain("opacity: 1!important");
    expect(reduced).toContain("translate: none!important");
  });
});
