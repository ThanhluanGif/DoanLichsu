import { readFileSync,statSync } from "node:fs";
import { join,resolve } from "node:path";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
const mapping=readFileSync(join(root,"src/lib/public-client/artwork.ts"),"utf8");
const client=readFileSync(join(root,"src/lib/public-client/client.ts"),"utf8");
const compose=readFileSync(join(root,"docker-compose.yml"),"utf8");
const detail=readFileSync(join(root,"src/app/[locale]/[kind]/[slug]/page.tsx"),"utf8");
const collection=readFileSync(join(root,"src/app/[locale]/[kind]/page.tsx"),"utf8");
const card=readFileSync(join(root,"src/components/public/ContentCard.tsx"),"utf8");
const css=readFileSync(join(root,"src/app/globals.css"),"utf8");
const seed=readFileSync(join(root,"src/data/demo-content.ts"),"utf8");

const portraits={
  "person-trung-sisters":"trung-sisters-relief-v1.webp",
  "person-ngo-quyen":"ngo-quyen-relief-v1.webp",
  "person-tran-hung-dao":"tran-hung-dao-relief-v1.webp",
  "person-le-loi":"le-loi-relief-v1.webp",
  "person-quang-trung":"quang-trung-relief-v1.webp",
  "person-truong-dinh":"truong-dinh-relief-v1.webp",
  "person-phan-dinh-phung":"phan-dinh-phung-relief-v1.webp",
  "person-ho-chi-minh":"ho-chi-minh-relief-v1.webp",
  "person-vo-nguyen-giap":"vo-nguyen-giap-relief-v1.webp",
  "person-nguyen-thi-dinh":"nguyen-thi-dinh-relief-v1.webp",
} as const;

describe("immersive historical portrait contract",()=>{
  it("maps every seeded person to one optimized and unique WebP",()=>{
    const seededIds=[...seed.matchAll(/content\("(person-[^"]+)",\s*"PERSON"/g)].map((match)=>match[1]);
    expect(seededIds).toEqual(Object.keys(portraits));
    expect(new Set(Object.values(portraits)).size).toBe(10);
    let totalBytes=0;
    for(const [id,file] of Object.entries(portraits)){
      const size=statSync(join(root,"public/images/people",file)).size;
      expect(size,`${id} should be a real illustration`).toBeGreaterThan(100_000);
      expect(mapping).toContain(`"${id}":{`);
      expect(mapping).toContain(`src:"/images/people/${file}"`);
      totalBytes+=size;
    }
    expect(totalBytes).toBeLessThanOrEqual(2_500_000);
  });

  it("labels portraits as interpretations and reuses the shared artwork seam",()=>{
    expect(mapping.match(/alt:portraitAlt\(/g)).toHaveLength(10);
    expect(mapping).toContain("Minh họa diễn giải dạng phù điêu");
    expect(mapping).toContain("Interpretive bas-relief illustration");
    expect(detail).toContain('type==="PERSON"');
    expect(detail).toContain("không phải ảnh tư liệu hay phục dựng khuôn mặt có thẩm quyền");
    expect(detail).toContain("not a documentary photograph or authoritative facial reconstruction");
    expect(detail).toContain("<figcaption>{artworkCaption}</figcaption>");
  });

  it("uses progressive CSS depth without a client-side parallax controller",()=>{
    expect(css).toMatch(/@keyframes route-enter\s*\{[\s\S]*translate:\s*0 var\(--motion-route-distance\) -28px;[\s\S]*rotate:\s*x 1\.4deg/);
    expect(css).toMatch(/@keyframes content-reveal\s*\{[\s\S]*translate:\s*0 var\(--motion-reveal-distance\) -36px;[\s\S]*rotate:\s*x 2\.6deg/);
    expect(css).toMatch(/\.hero\s*\{[^}]*perspective:\s*1500px/);
    expect(css).toMatch(/\.content-grid\s*\{[^}]*perspective:\s*1300px/);
    expect(css).toContain("@media (hover: hover) and (prefers-reduced-motion: no-preference)");
    expect(css).toContain("translate3d(0,-6px,22px) rotateX(1.25deg)");
  });

  it("keeps canonical HTTPS public while server-side REST uses container loopback",()=>{
    expect(client).toContain("source.INTERNAL_API_ORIGIN?.trim() || source.APP_ORIGIN?.trim()");
    expect(compose).toContain("APP_ORIGIN: ${APP_ORIGIN:?APP_ORIGIN is required}");
    expect(compose).toContain("INTERNAL_API_ORIGIN: http://127.0.0.1:3000");
  });

  it("eager-loads only the three collection images that can become desktop LCP",()=>{
    expect(collection).toContain("priority={index<3}");
    expect(card).toContain('priority?{loading:"eager" as const,fetchPriority:"high" as const}:{}');
    expect(card).toContain('loading="lazy" decoding="async" {...imageLoading}');
  });

  it("removes every depth transform in reduced-motion mode",()=>{
    const reduced=css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1]??"";
    expect(reduced).toContain("animation: none!important");
    expect(reduced).toContain("translate: none!important");
    expect(reduced).toContain("rotate: none!important");
    expect(reduced).toContain("transform: none!important");
    expect(reduced).toContain(".content-card-art span");
  });
});
