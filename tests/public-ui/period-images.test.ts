import { readFileSync,statSync } from "node:fs";
import { join,resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const page=readFileSync(join(root,"src/app/[locale]/page.tsx"),"utf8");
const css=readFileSync(join(root,"src/app/globals.css"),"utf8");
const design=readFileSync(join(root,"DESIGN.md"),"utf8");
const artwork={
  "period-early":"early-self-rule.webp",
  "period-dynasties":"dynastic-defense.webp",
  "period-colonial":"anti-colonial-resistance.webp",
  "period-independence-wars":"independence-reunification.webp",
  "period-border":"post-1975-border-defense.webp",
  "period-memory":"contemporary-memory.webp",
} as const;

describe("period artwork contract",()=>{
  it("ships one optimized non-placeholder WebP for every published period",()=>{
    let total=0;
    for(const [id,file] of Object.entries(artwork)){
      const size=statSync(join(root,"public/images/periods",file)).size;
      expect(size,`${id} should not be a placeholder`).toBeGreaterThan(100_000);
      expect(page).toContain(`\"${id}\":{src:\"/images/periods/${file}\"`);
      total+=size;
    }
    expect(total).toBeLessThanOrEqual(1_800_000);
  });

  it("reserves image geometry, lazy-loads and provides locale-specific descriptions",()=>{
    expect(page).toContain('width="1280" height="853" loading="lazy" decoding="async"');
    expect(page).toContain('fetchPriority="high" decoding="async"');
    expect(page).toContain("alt={artwork.alt[locale]}");
    expect(page.match(/alt:\{vi:\"/g)).toHaveLength(6);
    expect(page).toContain("minh họa nguyên bản, không phải tư liệu lịch sử");
    expect(page).toContain("original illustrations, not historical documents");
    expect(css).toMatch(/\.period-art\s*\{[^}]*aspect-ratio:\s*16\/10/);
    expect(css).toMatch(/\.period-art img\s*\{[^}]*object-fit:\s*cover/);
  });

  it("documents the non-documentary and runtime budget policy",()=>{
    expect(design).toContain("## Historical illustration policy");
    expect(design).toContain("never evidence");
    expect(design).toContain("at or below 1.8 MB");
  });
});
