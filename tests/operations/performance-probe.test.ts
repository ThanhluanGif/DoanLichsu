import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("performance probe", () => {
  it("rejects non-HTTPS origins", () => {
    const result = spawnSync(process.execPath, ["scripts/performance-probe.mjs", "--origin", "http://127.0.0.1:3000"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("requires an HTTPS origin");
  });

  it("rejects invalid request limits before making requests", () => {
    const result = spawnSync(process.execPath, ["scripts/performance-probe.mjs", "--origin", "https://example.test", "--requests", "0"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--requests must be an integer");
  });
});
