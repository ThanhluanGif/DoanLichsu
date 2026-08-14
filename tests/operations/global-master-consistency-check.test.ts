import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-global-master-"));
const canonical = readFileSync(resolve(root, "KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md"), "utf8");
const cardFiles = readdirSync(resolve(root, "cards")).filter((file) => /^C-\d+\.md$/.test(file));
const doneCardNumbers = cardFiles
  .filter((file) => /^status:\s*done\s*$/m.test(readFileSync(resolve(root, "cards", file), "utf8")))
  .map((file) => Number(file.match(/^C-(\d+)\.md$/)?.[1]));
const expectedDoneCards = doneCardNumbers.length;
const expectedLatestCard = Math.max(...doneCardNumbers);
const expectedInFlightCards = cardFiles.length - expectedDoneCards;
const planSnapshot = canonical.match(/(\d+) card đã tạo, \1 done, C-\1 hiện tại/);
const run = (plan: string, packetPath?: string) => {
  const planPath = join(temp, `${Math.random().toString(36).slice(2)}.md`);
  const outputPath = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(planPath, plan);
  const args = ["scripts/global-master-consistency-check.mjs", "--plan", planPath, "--output", outputPath];
  if (packetPath) args.push("--packet", packetPath);
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(outputPath, "utf8")) };
};

describe("Global Master consistency gate", () => {
  it("accepts the merged 12-month plan and current release snapshot", () => {
    const { result, report } = run(canonical);
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_GLOBAL_MASTER_CONSISTENT", flowCards: expectedDoneCards, flowDoneCards: expectedDoneCards, latestCard: `C-${expectedLatestCard}`, inFlightCards: expectedInFlightCards, roadmapPosition: "M11_HARDENING_PREPARE_M12", publicBeta: false, externalBlockers: 11, historyPacket: { publishedContent: 105, rowsRequiringHumanReview: 105, rowsAlreadyReviewed: 0 } });
    expect(report.errors).toEqual([]);
  });

  it("fails closed on stale card counts or a Public Beta claim", () => {
    const currentSnapshot = planSnapshot?.[0] ?? "";
    const currentCount = Number(planSnapshot?.[1] ?? expectedDoneCards);
    const staleCount = currentCount - (expectedInFlightCards > 0 ? 2 : 1);
    const stale = canonical.replace(currentSnapshot, `${staleCount} card đã tạo, ${staleCount} done, C-${staleCount} hiện tại`).replace("Public Beta `false`", "Public Beta `true`");
    const { result, report } = run(stale);
    expect(result.status).toBe(1);
    expect(report.status).toBe("BLOCKED_INTERNAL");
    expect(report.errors).toEqual(expect.arrayContaining(["FLOW_PLAN_SNAPSHOT_MISMATCH", "GLOBAL_MASTER_PROGRESS_SENTENCE_MISSING", "GLOBAL_MASTER_PUBLIC_BETA_FALSE_MISSING"]));
    expect(report.publicBeta).toBe(false);
  });

  it("accepts a partial human packet without opening release", () => {
    const packetPath = join(temp, "partial-history-readiness.json");
    const packet = JSON.parse(readFileSync(resolve(root, "artifacts/curriculum-completeness/published-history-packet-readiness.json"), "utf8"));
    packet.status = "PASS_WITH_HUMAN_ROWS";
    packet.rowsRequiringHumanReview = 104;
    packet.rowsAlreadyReviewed = 1;
    writeFileSync(packetPath, JSON.stringify(packet));
    const { result, report } = run(canonical, packetPath);
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_GLOBAL_MASTER_CONSISTENT", historyPacket: { rowsRequiringHumanReview: 104, rowsAlreadyReviewed: 1 }, publicBeta: false, releaseAllowed: false, databaseMutation: false });
    expect(report.errors).toEqual([]);
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
