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
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
