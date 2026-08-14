import { afterAll, describe, expect, it } from "vitest";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";

const temp = mkdtempSync(join(tmpdir(), "qsv-history-packet-"));

describe("published content review packet", () => {
  it("exports the complete read-only handoff without fabricating approval", () => {
    const databasePath = join(temp, "packet.db");
    const output = join(temp, "packet.json");
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
    const beforeDatabase = new Database(databasePath, { readonly: true });
    const before = beforeDatabase.prepare("SELECT COUNT(*) AS count FROM audit_logs").get() as { count: number };
    beforeDatabase.close();
    const result = spawnSync(process.execPath, ["scripts/published-content-review-packet.mjs"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath, OUTPUT: output }, encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report).toMatchObject({
      status: "REQUIRES_HUMAN_REVIEW",
      publishedContent: 105,
      publishedTranslations: 209,
      translationRows: 210,
      rowsWithUnpublishedTranslations: 1,
      rowsRequiringHumanReview: 105,
      rowsAlreadyReviewed: 0,
      databaseWrites: 0,
      fabricatedReviewers: false,
      councilApproval: "NOT_EVALUATED",
      publicBeta: false,
    });
    expect(report.packetSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.rows).toHaveLength(105);
    expect(report.rows.every((row: { version: number; translations: unknown[]; history: Record<string, unknown>; reviewChecklist: Record<string, unknown> }) => row.version > 0 && row.translations.length === 2 && row.history.status === "REQUIRES_HUMAN_REVIEW" && row.history.reviewer === null && row.history.attestation === null && row.reviewChecklist.reviewer === null && row.reviewChecklist.attestation === null && ["READY", "MISSING_OR_UNVERIFIED"].includes(String(row.reviewChecklist.sourceLocatorStatus)) && ["READY", "MISSING_OR_UNVERIFIED"].includes(String(row.reviewChecklist.claimLocatorStatus)))).toBe(true);
    const afterDatabase = new Database(databasePath, { readonly: true });
    try {
      const after = afterDatabase.prepare("SELECT COUNT(*) AS count FROM audit_logs").get() as { count: number };
      expect(after).toEqual(before);
    } finally {
      afterDatabase.close();
    }
  });

  it("round-trips a real-shaped review audit into the packet and validator", () => {
    const databasePath = join(temp, "reviewed-packet.db");
    const output = join(temp, "reviewed-packet.json");
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
    const initial = spawnSync(process.execPath, ["scripts/published-content-review-packet.mjs"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath, OUTPUT: output }, encoding: "utf8",
    });
    expect(initial.status).toBe(0);
    const before = JSON.parse(readFileSync(output, "utf8"));
    const contentId = before.rows[0].id as string;
    const reviewedAt = "2026-08-14T13:00:00.000Z";
    const database = new Database(databasePath);
    database.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, object_type, object_id, metadata, created_at)
      VALUES (?, ?, 'content.editorial_history.review', 'content', ?, ?, ?)
    `).run("audit-history-roundtrip", "user-reviewer", contentId, JSON.stringify({ attestation: "HUMAN_REVIEWED", evidenceLocator: "https://archive.example.test/review/roundtrip-001", note: "Đã đối chiếu nguồn và lịch sử biên tập.", reviewedAt, contentVersion: 1 }), reviewedAt);
    database.close();

    const result = spawnSync(process.execPath, ["scripts/published-content-review-packet.mjs"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath, OUTPUT: output }, encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(output, "utf8"));
    const row = report.rows.find((item: { id: string }) => item.id === contentId);
    expect(report).toMatchObject({ status: "PASS_WITH_HUMAN_ROWS", rowsRequiringHumanReview: 104, rowsAlreadyReviewed: 1, databaseWrites: 0, fabricatedReviewers: false, publicBeta: false });
    expect(row.history).toEqual({ status: "HUMAN_REVIEWED", reviewer: "Kiểm duyệt viên", reviewerRole: "REVIEWER", attestation: "HUMAN_REVIEWED", evidenceLocator: "https://archive.example.test/review/roundtrip-001", note: "Đã đối chiếu nguồn và lịch sử biên tập.", reviewedAt });
    expect(row.reviewChecklist).toMatchObject({ reviewer: "Kiểm duyệt viên", reviewerRole: "REVIEWER", attestation: "HUMAN_REVIEWED", evidenceLocator: "https://archive.example.test/review/roundtrip-001" });

    const readinessOutput = join(temp, "reviewed-readiness.json");
    const readiness = spawnSync(process.execPath, ["scripts/published-history-packet-check.mjs", "--input", output, "--output", readinessOutput], { cwd: process.cwd(), encoding: "utf8" });
    expect(readiness.status).toBe(0);
    expect(JSON.parse(readFileSync(readinessOutput, "utf8"))).toMatchObject({ status: "PASS_WITH_HUMAN_ROWS", rowsRequiringHumanReview: 104, rowsAlreadyReviewed: 1, releaseAllowed: false, publicBeta: false, databaseMutation: false });
  });

  it("keeps incomplete audit metadata fail-closed", () => {
    const databasePath = join(temp, "incomplete-reviewed-packet.db");
    const output = join(temp, "incomplete-reviewed-packet.json");
    copyFileSync(resolve("data/quan-su-viet.db"), databasePath);
    const initial = spawnSync(process.execPath, ["scripts/published-content-review-packet.mjs"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath, OUTPUT: output }, encoding: "utf8",
    });
    expect(initial.status).toBe(0);
    const contentId = JSON.parse(readFileSync(output, "utf8")).rows[0].id as string;
    const database = new Database(databasePath);
    database.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, object_type, object_id, metadata, created_at)
      VALUES (?, ?, 'content.editorial_history.review', 'content', ?, ?, ?)
    `).run("audit-history-incomplete", "user-reviewer", contentId, JSON.stringify({ attestation: "HUMAN_REVIEWED" }), "2026-08-14T13:01:00.000Z");
    database.close();
    const result = spawnSync(process.execPath, ["scripts/published-content-review-packet.mjs"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath, OUTPUT: output }, encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const readinessOutput = join(temp, "incomplete-readiness.json");
    const readiness = spawnSync(process.execPath, ["scripts/published-history-packet-check.mjs", "--input", output, "--output", readinessOutput], { cwd: process.cwd(), encoding: "utf8" });
    expect(readiness.status).toBe(1);
    expect(JSON.parse(readFileSync(readinessOutput, "utf8")).errors).toContain("row[0]:PARTIAL_HUMAN_ATTESTATION");
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
