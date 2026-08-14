import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-history-packet-"));
const canonicalPath = "artifacts/curriculum-completeness/published-content-review-packet.json";
const source = JSON.parse(readFileSync(resolve(root, canonicalPath), "utf8"));
const packetHash = (packet: { rows: unknown[] }) => createHash("sha256").update(JSON.stringify(packet.rows)).digest("hex");
const run = (packet: Record<string, unknown>) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(input, `${JSON.stringify(packet)}\n`);
  const result = spawnSync(process.execPath, ["scripts/published-history-packet-check.mjs", "--input", input, "--output", output], { cwd: root, encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("published-history packet gate", () => {
  it("accepts the canonical 105-row pending packet without release", () => {
    const { result, report } = run(source);
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_PACKET_PENDING_HUMAN", publishedContent: 105, rowsRequiringHumanReview: 105, rowsAlreadyReviewed: 0, humanGateComplete: false, releaseAllowed: false, publicBeta: false, databaseMutation: false, errors: [] });
  });

  it("rejects duplicate/hash drift, readiness drift and partial reviewer fields", () => {
    const packet = structuredClone(source);
    packet.rows[1].id = packet.rows[0].id;
    packet.rows[0].reviewChecklist.sourceLocatorStatus = "BROKEN";
    packet.rows[0].history.reviewer = "unattributed";
    packet.packetSha256 = "0".repeat(64);
    const { result, report } = run(packet);
    expect(result.status).toBe(1);
    expect(report.errors).toEqual(expect.arrayContaining(["DUPLICATE_CONTENT_ID", "PACKET_SHA256_MISMATCH", "row[0]:INVALID_SOURCE_READINESS", "row[0]:PENDING_REVIEWER_MUST_BE_NULL"]));
  });

  it("accepts a complete single human row shape but keeps the gate open", () => {
    const packet = structuredClone(source);
    packet.rows[0].history = { status: "HUMAN_REVIEWED", reviewer: "Real Reviewer", reviewerRole: "HISTORIAN", attestation: "HUMAN_REVIEWED", evidenceLocator: "https://archive.example/review/1", note: "Đã đối chiếu hồ sơ.", reviewedAt: "2026-08-14T00:00:00Z" };
    packet.rowsRequiringHumanReview = 104;
    packet.rowsAlreadyReviewed = 1;
    packet.status = "PASS_WITH_HUMAN_ROWS";
    packet.packetSha256 = packetHash(packet);
    const { result, report } = run(packet);
    expect(result.status).toBe(0);
    expect(report).toMatchObject({ status: "PASS_WITH_HUMAN_ROWS", rowsRequiringHumanReview: 104, rowsAlreadyReviewed: 1, humanGateComplete: false, releaseAllowed: false, publicBeta: false });
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
