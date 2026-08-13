import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("reconstruction public surface", () => { it("keeps narrative and fallback as first-class content", () => { const source = readFileSync("src/components/public/reconstruction/ReconstructionScene.tsx", "utf8"); expect(source).toContain("reconstruction-fallback"); expect(source).toContain("reconstruction-phase-button"); expect(source).toContain("Educational reconstruction"); expect(source).not.toMatch(/physics|casualt/); }); });
