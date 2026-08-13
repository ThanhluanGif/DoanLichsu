import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("public privacy notice", () => {
  it("ships bilingual route copy and footer entry point", () => {
    const page = readFileSync("src/app/[locale]/privacy/page.tsx", "utf8");
    const shell = readFileSync("src/components/public/PublicShell.tsx", "utf8");
    expect(page).toContain("DRAFT_PENDING_PRIVACY_REVIEW");
    expect(page).toContain("30 ngày");
    expect(page).toContain("Public AI is disabled");
    expect(page).toContain("Trợ giảng chỉ dành cho phiên được cấp quyền");
    expect(shell).toContain("/${locale}/privacy");
  });
});
