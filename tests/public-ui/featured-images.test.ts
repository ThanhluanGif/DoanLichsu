import { readFileSync,statSync } from "node:fs";
import { join,resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const mapping=readFileSync(join(root,"src/lib/public-client/artwork.ts"),"utf8");
const card=readFileSync(join(root,"src/components/public/ContentCard.tsx"),"utf8");
const detail=readFileSync(join(root,"src/app/[locale]/[kind]/[slug]/page.tsx"),"utf8");
const css=readFileSync(join(root,"src/app/globals.css"),"utf8");
const design=readFileSync(join(root,"DESIGN.md"),"utf8");
const artwork={
  "artifact-bach-dang-stakes":"bach-dang-stakes.webp",
  "artifact-dien-bien-flag":"dien-bien-victory-flag.webp",
  "event-august-revolution":"august-revolution.webp",
  "event-bach-dang-1288":"bach-dang-1288.webp",
  "event-bach-dang-938":"bach-dang-938.webp",
  "event-dien-bien-phu":"dien-bien-phu.webp",
} as const;

describe("featured content artwork contract",()=>{
  it("ships one optimized WebP per featured content id within the runtime budget",()=>{
    let total=0;
    for(const [id,file] of Object.entries(artwork)){
      const size=statSync(join(root,"public/images/featured",file)).size;
      expect(size,`${id} should not be a placeholder`).toBeGreaterThan(100_000);
      expect(mapping).toContain(`\"${id}\":{`);
      expect(mapping).toContain(`src:\"/images/featured/${file}\"`);
      total+=size;
    }
    expect(total).toBeLessThanOrEqual(1_800_000);
  });

  it("keeps locale-specific alt text and a safe fallback for unmapped content",()=>{
    expect(mapping.match(/alt:\{vi:\"/g)).toHaveLength(6);
    expect(mapping).toContain("artwork.alt[locale]");
    expect(mapping).toContain(":null;");
    expect(card).toContain('artwork?<Image unoptimized src={artwork.src} alt=""');
    expect(card).toContain('loading="lazy" decoding="async"');
    expect(card).toContain('artwork?" has-image":""');
    expect(css).toMatch(/\.content-card-art\.type-event\s*\{\s*background:\s*var\(--grad-peach\)/);
  });

  it("reuses the same mapping for detail display and Open Graph fallback",()=>{
    expect(card).toContain("contentArtwork(item.id,locale)");
    expect(detail.match(/contentArtwork\(detail\.id,locale\)/g)).toHaveLength(2);
    expect(detail).toContain("artwork?[{url:artwork.src,alt:artwork.alt}]");
    expect(detail).toContain("priority decoding=\"async\" data-detail-art={detail.id}");
    expect(detail).toContain("alt={artwork.alt}");
    expect(detail).toContain("không phải ảnh tư liệu lịch sử hay bản sao hiện vật");
    expect(detail).toContain("not a historical photograph or artifact reproduction");
    expect(css).toMatch(/\.detail-art img\s*\{[^}]*aspect-ratio:\s*3\/2[^}]*object-fit:\s*cover/);
  });

  it("documents decorative-card, disclosure, reuse and transfer rules",()=>{
    expect(design).toContain("card, detail page and\n  Open Graph fallback");
    expect(design).toContain("card image is decorative");
    expect(design).toContain("not a historical photograph or artifact reproduction");
    expect(design).toContain("The six mapped assets stay\n  at or below 1.8 MB");
  });
});
