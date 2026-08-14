import { afterAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const temp = mkdtempSync(join(tmpdir(), "qsv-ai-human-review-"));
const run = (output: string, extra: string[] = []) => spawnSync(process.execPath, ["scripts/ai-human-review-ledger.mjs", "--output", output, ...extra], { cwd: process.cwd(), encoding: "utf8" });
const blank = () => {
  const output = join(temp, `blank-${Date.now()}-${Math.random()}.json`);
  const result = run(output);
  expect(result.status).toBe(0);
  return { output, ledger: JSON.parse(readFileSync(output, "utf8")) };
};
const completeReview = (row: Record<string, unknown>, prefix: string, verdict: string) => ({
  ...row,
  [`${prefix}`]: `${prefix}-person`,
  [`${prefix}Role`]: "HISTORIAN",
  [`${prefix}Authority`]: "Golden-set review authority",
  [`${prefix}Evidence`]: "artifacts/ai-eval/review-notes/row-001.md",
  [`${prefix}Verdict`]: verdict,
  [`${prefix}At`]: "2026-08-14T06:00:00.000Z",
});

describe("AI human golden-set ledger v2", () => {
  it("keeps the blank 500-row fixture pending but structurally valid", () => {
    const { output, ledger } = blank();
    expect(ledger).toMatchObject({ version: "ai-human-review-v2", status: "PENDING_HUMAN_REVIEW", total: 500, dualApproved: 0, violations: [], noFabricatedReviewers: true, publicBeta: false });
    expect(ledger.rows[0]).toMatchObject({ reviewer1Role: null, reviewer1Authority: null, reviewer1Evidence: null, reviewer2Role: null, reviewer2Authority: null, reviewer2Evidence: null });
    expect(run(output, ["--validate"]).status).toBe(0);
    expect(run(output, ["--require-approved"]).status).toBe(1);
  });

  it("rejects malformed approvals, duplicate reviewers and unresolved conflicts", () => {
    const { ledger } = blank();
    const cases = [
      { name: "missing-evidence", row: { ...completeReview(ledger.rows[0], "reviewer1", "APPROVE"), reviewer1Evidence: null }, code: "VERDICT_MISSING_IDENTITY_ROLE_AUTHORITY_TIMESTAMP_OR_EVIDENCE_1" },
      { name: "invalid-role", row: { ...completeReview(ledger.rows[0], "reviewer1", "APPROVE"), reviewer1Role: "EDITOR" }, code: "INVALID_REVIEWER_ROLE_1" },
      { name: "same-person", row: { ...completeReview(completeReview(ledger.rows[0], "reviewer1", "APPROVE"), "reviewer2", "APPROVE"), reviewer2: "reviewer1-person" }, code: "SAME_REVIEWER_DUAL_APPROVAL" },
      { name: "conflict", row: completeReview(completeReview(ledger.rows[0], "reviewer1", "APPROVE"), "reviewer2", "REJECT"), code: "UNRESOLVED_VERDICT_CONFLICT" },
    ];
    for (const testCase of cases) {
      const output = join(temp, `${testCase.name}.json`);
      const candidate = { ...ledger, rows: ledger.rows.map((row: Record<string, unknown>, index: number) => index === 0 ? testCase.row : row) };
      writeFileSync(output, `${JSON.stringify(candidate)}\n`);
      const result = run(output, ["--validate"]);
      expect(result.status, testCase.name).toBe(1);
      expect(JSON.parse(readFileSync(output, "utf8")).violations.some((violation: string) => violation.includes(testCase.code))).toBe(true);
    }
  });

  it("accepts one complete pair without counting the rest as approved", () => {
    const { ledger } = blank();
    const output = join(temp, "one-complete-pair.json");
    const row = completeReview(completeReview(ledger.rows[0], "reviewer1", "APPROVE"), "reviewer2", "APPROVE");
    row.reviewer2 = "reviewer2-person";
    writeFileSync(output, `${JSON.stringify({ ...ledger, rows: ledger.rows.map((entry: Record<string, unknown>, index: number) => index === 0 ? row : entry) })}\n`);
    const result = run(output, ["--validate"]);
    const next = JSON.parse(readFileSync(output, "utf8"));
    expect(result.status).toBe(0);
    expect(next).toMatchObject({ status: "PENDING_HUMAN_REVIEW", dualApproved: 1, violations: [] });
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
