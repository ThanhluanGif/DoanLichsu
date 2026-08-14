import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-wikimedia-batch-"));
const validPage = (pageid: number, title: string) => ({
  pageid,
  title,
  lastrevid: pageid + 100,
  touched: "2026-08-14T00:00:00Z",
  imageinfo: [{ url: `https://upload.wikimedia.org/${pageid}.jpg`, descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`, extmetadata: {} }],
});

describe("Wikimedia batch completeness", () => {
  it("skips a missing page and fills the target with valid records", () => {
    const titles = join(temp, "titles.json");
    const fixture = join(temp, "response.json");
    const output = join(temp, "report.json");
    writeFileSync(titles, JSON.stringify(["File:Missing.svg", "File:One.jpg", "File:Two.jpg"]));
    writeFileSync(fixture, JSON.stringify({ query: { pages: [{ title: "File:Missing.svg" }, validPage(1, "File:One.jpg"), validPage(2, "File:Two.jpg")] } }));
    const result = spawnSync(process.execPath, ["scripts/wikimedia-batch.mjs", "--titles", titles, "--response-fixture", fixture, "--target-count", "2", "--output", output], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report).toMatchObject({ status: "PASS", targetCount: 2, imported: 2, skippedMissingMetadata: 1, errors: [] });
    expect(report.records).toHaveLength(2);
    expect(report.records.every((record: { pageId: number | null; revisionId: number | null; revisionTimestamp: string | null; descriptionUrl: string | null }) => record.pageId && record.revisionId && record.revisionTimestamp && record.descriptionUrl)).toBe(true);
  });
});

afterAll(() => rmSync(temp, { recursive: true, force: true }));
