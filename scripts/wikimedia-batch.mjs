import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const titlesInput = option("--titles", "artifacts/wikimedia/batch-titles.json");
const output = resolve(option("--output", "artifacts/wikimedia/batch-300-report.json"));
const api = option("--api", "https://commons.wikimedia.org/w/api.php");
const userAgent = option("--user-agent", "QuanSuViet/0.1 (Wikimedia metadata pilot; contact required)");
const responseFixture = option("--response-fixture", null);
const targetCount = Number(option("--target-count", "300"));
if (!Number.isInteger(targetCount) || targetCount < 1) throw new Error("--target-count must be a positive integer");
const requestedTitles = JSON.parse(readFileSync(resolve(titlesInput), "utf8"));
let titles = [...new Set(requestedTitles)];
if (titles.length < targetCount) {
  const searchUrl = new URL(api);
  searchUrl.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", list: "search", srsearch: option("--search", "Vietnam"), srnamespace: "6", srlimit: String(Math.min(500, targetCount + 50)) }).toString();
  const searchResponse = await fetch(searchUrl, { headers: { accept: "application/json", "user-agent": userAgent }, signal: AbortSignal.timeout(30000) });
  if (!searchResponse.ok) throw new Error(`Wikimedia search HTTP ${searchResponse.status}`);
  const searchPayload = await searchResponse.json();
  titles = [...new Set([...titles, ...(searchPayload.query?.search ?? []).map((item) => item.title)])];
}
// Keep a bounded candidate pool, but leave room to replace missing/nonexistent titles.
titles = titles.slice(0, targetCount + 50);
const records = [];
const errors = [];
const seenPageIds = new Set();
let skippedMissingMetadata = 0;
const startedAt = new Date().toISOString();
let batches = 0;
for (let index = 0; index < titles.length && records.length < targetCount; index += 50) {
  const batch = titles.slice(index, index + 50);
  batches += 1;
  try {
    let payload;
    if (responseFixture) payload = JSON.parse(readFileSync(resolve(responseFixture), "utf8"));
    else {
      const url = new URL(api);
      url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", titles: batch.join("|"), prop: "imageinfo|revisions", iiprop: "url|extmetadata|timestamp", rvprop: "ids|timestamp" }).toString();
      const response = await fetch(url, { headers: { accept: "application/json", "user-agent": userAgent }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Wikimedia API HTTP ${response.status}`);
      payload = await response.json();
    }
    const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : Object.values(payload?.query?.pages ?? {});
    for (const page of pages) {
      const info = page.imageinfo?.[0] ?? {};
      const revisionId = page.lastrevid ?? page.revisions?.[0]?.revid ?? null;
      const revisionTimestamp = page.touched ?? page.revisions?.[0]?.timestamp ?? info.timestamp ?? null;
      const completeIdentity = Number.isInteger(page.pageid) && Boolean(page.title) && Boolean(info.descriptionurl) && Boolean(revisionId) && Boolean(revisionTimestamp);
      if (!completeIdentity || seenPageIds.has(page.pageid)) {
        skippedMissingMetadata += 1;
        continue;
      }
      const meta = info.extmetadata ?? {};
      const value = (key) => meta[key]?.value?.trim?.() || null;
      seenPageIds.add(page.pageid);
      records.push({ id: `wikimedia-${page.pageid}`, provider: "WIKIMEDIA_COMMONS", pageId: page.pageid, fileTitle: page.title, revisionId, revisionTimestamp, originalUrl: info.url ?? null, descriptionUrl: info.descriptionurl, artist: value("Artist"), creditLine: value("Credit"), licenseShortName: value("LicenseShortName"), licenseUrl: value("LicenseUrl"), restrictions: value("Restrictions"), rightsStatus: "LINK_ONLY", reviewStatus: "PENDING_REVIEW", importedAt: new Date().toISOString(), binaryDownloaded: false, autoPublished: false });
      if (records.length === targetCount) break;
    }
  } catch (error) { errors.push({ batchStart: index, titles: batch, error: String(error) }); }
}
const selectedRecords = records.slice(0, targetCount);
const report = { generatedAt: startedAt, provider: "WIKIMEDIA_COMMONS", status: selectedRecords.length === targetCount && errors.length === 0 ? "PASS" : "FAIL", targetCount, requested: titles.length, imported: selectedRecords.length, batches, skippedMissingMetadata, errors, binaryDownloaded: false, autoPublished: false, rightsStatus: "LINK_ONLY", reviewStatus: "PENDING_REVIEW", records: selectedRecords };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Wikimedia metadata pilot\n\n- Status: **${report.status}**\n- Target/requested/imported: ${report.targetCount}/${report.requested}/${report.imported}\n- Batches: ${report.batches}\n- Skipped missing/duplicate metadata: ${report.skippedMissingMetadata}\n- Errors: ${report.errors.length}\n- Binary downloaded: **NO**\n- Auto-published: **NO**\n- Rights: **LINK_ONLY**\n- Review: **PENDING_REVIEW**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, targetCount: report.targetCount, requested: report.requested, imported: report.imported, skippedMissingMetadata: report.skippedMissingMetadata, errors: report.errors.length })}\n`);
if (report.status !== "PASS") process.exitCode = 1;
