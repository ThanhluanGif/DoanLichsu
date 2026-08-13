import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
describe("historical map public surface", () => {
  it("ships bilingual route, local SVG narrative and accessible list fallback", () => {
    expect(() => statSync(join(root, "src/app/[locale]/ban-do/page.tsx"))).not.toThrow();
    const source = readFileSync(join(root, "src/components/public/map/HistoricalMap.tsx"), "utf8");
    expect(source).toContain("role=\"img\"");
    expect(source).toContain("aria-label");
    expect(source).toContain("Approximate location");
    expect(source).toContain("historical-map");
    expect(source).not.toMatch(/leaflet|mapbox|openstreetmap|tile/i);
  });
});
