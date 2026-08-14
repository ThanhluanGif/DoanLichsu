import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/production-uptime.yml"), "utf8");
const runbook = readFileSync(resolve("docs/operations/uptime-monitor.md"), "utf8");

describe("scheduled production uptime monitor", () => {
  it("has scheduled and manual entry points with fail-closed origin handling", () => {
    expect(workflow).toContain('cron: "*/15 * * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("PRODUCTION_ORIGIN: ${{ secrets.PRODUCTION_ORIGIN }}");
    expect(workflow).toContain("Missing production origin");
    expect(workflow).toContain("PRODUCTION_ORIGIN must use HTTPS");
    expect(workflow).toContain("Non-production origin");
    expect(workflow).toContain("trycloudflare.com");
    expect(workflow).toContain("node scripts/uptime-probe.mjs");
  });

  it("retains immutable run artifacts without changing release authority", () => {
    expect(workflow).toContain("name: uptime-observation-${{ github.run_id }}");
    expect(workflow).toContain("retention-days: 90");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("Public Beta: DISABLED");
    expect(workflow).toContain("External evidence ledger: NOT MUTATED");
    expect(runbook).toContain("PENDING OPERATOR REVIEW");
    expect(runbook).toContain("does not by itself prove official production");
  });
});
