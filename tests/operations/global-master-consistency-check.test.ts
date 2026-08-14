import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-global-master-"));
const canonical = readFileSync(resolve(root, "KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md"), "utf8");
const run = (plan: string) => {
  const planPath = join(temp, `${Math.random().toString(36).slice(2)}.md`);
  const outputPath = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(planPath, plan);
  const result = spawnSync(process.execPath, ["scripts/global-master-consistency-check.mjs", "--plan", planPath, "--output", outputPath], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(outputPath, "utf8")) };
};

describe("Global Master consistency gate", () => {
  it("accepts the merged 12-month plan and current release snapshot", () => {
    const { result, report } = run(canonical);
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_GLOBAL_MASTER_CONSISTENT", flowCards: 168, flowDoneCards: 168, latestCard: "C-168", inFlightCards: 0, roadmapPosition: "M11_HARDENING_PREPARE_M12", publicBeta: false, externalBlockers: 11, historyPacket: { publishedContent: 105, rowsRequiringHumanReview: 105, rowsAlreadyReviewed: 0 } });
    expect(report.errors).toEqual([]);
  });

  it("fails closed on stale card counts or a Public Beta claim", () => {
    const stale = canonical.replace("168 card đã tạo, 168 done, C-168 hiện tại", "167 card đã tạo, 167 done, C-167 hiện tại").replace("Public Beta `false`", "Public Beta `true`");
    const { result, report } = run(stale);
    expect(result.status).toBe(1);
    expect(report.status).toBe("BLOCKED_INTERNAL");
    expect(report.errors).toEqual(expect.arrayContaining(["FLOW_PLAN_SNAPSHOT_MISMATCH", "GLOBAL_MASTER_PROGRESS_SENTENCE_MISSING", "GLOBAL_MASTER_PUBLIC_BETA_FALSE_MISSING"]));
    expect(report.publicBeta).toBe(false);
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
