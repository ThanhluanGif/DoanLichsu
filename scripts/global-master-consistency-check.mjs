import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const planPath = resolve(option("--plan", "KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md"));
const outputPath = resolve(option("--output", "artifacts/release/global-master-consistency.json"));
const plan = readFileSync(planPath, "utf8");
const errors = [];
const requireText = (needle, code) => {
  if (!plan.includes(needle)) errors.push(code);
};
const cards = [...new Set(readdirSync(resolve("cards")))].filter((file) => /^C-\d+\.md$/.test(file));
const doneCards = cards.filter((file) => /^status:\s*done\s*$/m.test(readFileSync(resolve("cards", file), "utf8"))).length;
const flowCount = doneCards;
const inFlightCards = cards.length - doneCards;
const latestDoneCard = cards.filter((file) => /^status:\s*done\s*$/m.test(readFileSync(resolve("cards", file), "utf8"))).map((file) => Number(file.match(/^C-(\d+)\.md$/)[1])).sort((a, b) => a - b).at(-1) ?? 0;
const planSnapshot = plan.match(/(\d+) card đã tạo, \1 done, C-\1 hiện tại/);
const expectedCompletedCards = planSnapshot ? Number(planSnapshot[1]) : null;
const snapshotMatchesDoneCards = expectedCompletedCards !== null && flowCount === expectedCompletedCards && latestDoneCard === expectedCompletedCards && inFlightCards === 0;
const snapshotMatchesOneInFlightCard = expectedCompletedCards !== null && inFlightCards === 1 && expectedCompletedCards === flowCount + 1 && latestDoneCard === flowCount;
if (expectedCompletedCards === null || (!snapshotMatchesDoneCards && !snapshotMatchesOneInFlightCard) || inFlightCards > 1) errors.push("FLOW_PLAN_SNAPSHOT_MISMATCH");

const packet = JSON.parse(readFileSync(resolve("artifacts/curriculum-completeness/published-history-packet-readiness.json"), "utf8"));
const dod = JSON.parse(readFileSync(resolve("artifacts/release/dod-audit.json"), "utf8"));
if (packet.status !== "PASS_PACKET_PENDING_HUMAN" || packet.publishedContent !== 105 || packet.rowsRequiringHumanReview !== 105 || packet.rowsAlreadyReviewed !== 0 || packet.publicBeta !== false || packet.databaseMutation !== false) errors.push("HISTORY_PACKET_STATE_MISMATCH");
if (dod.status !== "NOT_READY" || dod.publicBeta !== false || dod.unmetExternal?.length !== 11) errors.push("DOD_EXTERNAL_STATE_MISMATCH");

if (!/^> Phiên bản: \d+\.\d+ — \*\*GLOBAL BUILD MASTER/m.test(plan)) errors.push("GLOBAL_MASTER_VERSION_MARKER_MISSING");
if (!planSnapshot) errors.push("GLOBAL_MASTER_CARD_SNAPSHOT_MISSING");
if (expectedCompletedCards !== null) requireText(`${expectedCompletedCards}/${expectedCompletedCards} card đang hoàn tất`, "GLOBAL_MASTER_PROGRESS_SENTENCE_MISSING");
requireText("**Cuối M11 / chuẩn bị M12**", "GLOBAL_MASTER_ROADMAP_POSITION_MISSING");
requireText("M12 NOT_READY / Public Beta false", "GLOBAL_MASTER_RELEASE_POSITION_MISSING");
requireText("105 pending/0 reviewed", "GLOBAL_MASTER_HISTORY_PACKET_MISSING");
requireText("11 external gates", "GLOBAL_MASTER_EXTERNAL_BLOCKER_COUNT_MISSING");
requireText("Public Beta `false`", "GLOBAL_MASTER_PUBLIC_BETA_FALSE_MISSING");

const evidencePaths = [
  "cards/C-159.md",
  "scripts/published-history-packet-check.mjs",
  "artifacts/curriculum-completeness/published-history-packet-readiness.json",
  "artifacts/release/dod-audit.json",
  "artifacts/release/current-head-evidence.json",
  "artifacts/release/year-one-dod-matrix.json",
  "artifacts/transparency/dashboard.json",
];
for (const path of evidencePaths) if (!existsSync(resolve(path))) errors.push(`MISSING_EVIDENCE:${path}`);

const report = {
  version: "global-master-consistency-v1",
  generatedAt: new Date().toISOString(),
  plan: planPath === resolve("KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md") ? "KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md" : planPath,
  flowCards: flowCount,
  flowDoneCards: doneCards,
  latestCard: `C-${latestDoneCard}`,
  inFlightCards,
  roadmapPosition: "M11_HARDENING_PREPARE_M12",
  publicBeta: false,
  historyPacket: { publishedContent: packet.publishedContent, rowsRequiringHumanReview: packet.rowsRequiringHumanReview, rowsAlreadyReviewed: packet.rowsAlreadyReviewed, status: packet.status },
  externalBlockers: dod.unmetExternal?.length ?? null,
  status: errors.length ? "BLOCKED_INTERNAL" : "PASS_GLOBAL_MASTER_CONSISTENT",
  releaseAllowed: false,
  databaseMutation: false,
  errors,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outputPath.replace(/\.json$/, ".md"), `# Global Master consistency\n\n- Status: **${report.status}**\n- Flow: ${report.flowDoneCards}/${report.flowCards} done (${report.latestCard}); in-flight cards: ${report.inFlightCards}\n- Roadmap: **M11 hardening / prepare M12**\n- History packet: ${report.historyPacket.publishedContent} rows; ${report.historyPacket.rowsRequiringHumanReview} pending; ${report.historyPacket.rowsAlreadyReviewed} reviewed\n- External blockers: ${report.externalBlockers}\n- Public Beta: **DISABLED**\n- Release allowed: **NO**\n- Database mutation: **NO**\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, flow: `${report.flowDoneCards}/${report.flowCards}`, latestCard: report.latestCard, inFlightCards: report.inFlightCards, roadmapPosition: report.roadmapPosition, historyPending: report.historyPacket.rowsRequiringHumanReview, historyReviewed: report.historyPacket.rowsAlreadyReviewed, externalBlockers: report.externalBlockers, publicBeta: false, releaseAllowed: false, databaseMutation: false, errors: errors.length })}\n`);
if (errors.length) process.exitCode = 1;
