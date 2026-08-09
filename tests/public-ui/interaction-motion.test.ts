import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const css=readFileSync(resolve(root,"src/app/globals.css"),"utf8");
const copyButton=readFileSync(resolve(root,"src/components/public/CopyLinkButton.tsx"),"utf8");

describe("public interaction motion contract",()=>{
  it("uses a bounded allowlist instead of transitioning layout or all properties",()=>{
    const declarations=[...css.matchAll(/transition-property:\s*([^;]+);/g)].map((match)=>match[1].split(",").map((property)=>property.trim())).flat();
    const allowed=new Set(["color","background-color","border-color","box-shadow","opacity","translate"]);
    expect(declarations.length).toBeGreaterThan(0);
    for(const property of declarations)expect(allowed.has(property),`unexpected transition property: ${property}`).toBe(true);
    expect(css).not.toMatch(/transition(?:-property)?:\s*all\b/);
  });

  it("guards hover movement and caps feedback at one pixel",()=>{
    expect(css).toContain("@media (hover: hover)");
    expect(css).toMatch(/:not\(\.disabled\):hover\s*\{[^}]*translate:\s*0 -1px/);
    expect(css).toMatch(/:not\(\.disabled\):active\s*\{[^}]*translate:\s*0 1px/);
  });

  it("exposes copied state for visual and browser verification",()=>{
    expect(copyButton).toContain("data-copied={copied}");
    expect(copyButton).toContain('aria-live="polite"');
    expect(css).toMatch(/\.copy-link\s*\{[^}]*min-width:\s*156px/);
    expect(css).toContain('.copy-link[data-copied="true"]');
    expect(css).toMatch(/@keyframes\s+copy-confirm\s*\{[\s\S]*opacity:[\s\S]*translate:/);
  });

  it("fully disables public animation and transition for reduced motion",()=>{
    const reduced=css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1]??"";
    expect(reduced).toContain("animation: none!important");
    expect(reduced).toContain("transition-duration: 0s!important");
  });
});
