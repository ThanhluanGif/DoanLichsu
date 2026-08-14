import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const temp = mkdtempSync(join(tmpdir(), "qsv-wikimedia-rights-"));
const run = (records: unknown[]) => {
  const input = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const output = join(temp, `${Math.random().toString(36).slice(2)}.json`);
  const batch = join(temp, `${Math.random().toString(36).slice(2)}-batch.json`);
  writeFileSync(batch, JSON.stringify({ records }));
  const result = spawnSync(process.execPath, ["scripts/wikimedia-rights-ledger.mjs", "--input", batch, "--output", output], { cwd: process.cwd(), encoding: "utf8" });
  return { result, report: JSON.parse(readFileSync(output, "utf8")) };
};

describe("Wikimedia rights metadata gate", () => {
  it("keeps a complete metadata row reviewable but link-only", () => {
    const { result, report } = run([{ id: "w-1", pageId: 1, fileTitle: "File:One.jpg", descriptionUrl: "https://commons.wikimedia.org/wiki/File:One.jpg", revisionId: 2, revisionTimestamp: "2026-08-13T00:00:00Z" }]);
    expect(result.status).toBe(1);
    expect(report.invalidMetadataCount).toBe(0);
    expect(report.rows[0]).toMatchObject({ reviewStatus: "PENDING_REVIEW", serveBinary: false });
  });

  it("marks missing page identity or revision metadata invalid", () => {
    const { result, report } = run([{ id: "w-2", pageId: null, fileTitle: "File:Two.jpg", descriptionUrl: "https://commons.wikimedia.org/wiki/File:Two.jpg", revisionId: null, revisionTimestamp: null }]);
    expect(result.status).toBe(1);
    expect(report.invalidMetadataCount).toBe(1);
    expect(report.rows[0]).toMatchObject({ reviewStatus: "INVALID_METADATA", serveBinary: false, missingMetadata: ["pageId", "revisionId", "revisionTimestamp"] });
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
