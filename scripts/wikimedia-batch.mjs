import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const titlesInput = option("--titles", "artifacts/wikimedia/batch-titles.json");
const output = resolve(option("--output", "artifacts/wikimedia/batch-300-report.json"));
const api = option("--api", "https://commons.wikimedia.org/w/api.php");
const userAgent = option("--user-agent", "QuanSuViet/0.1 (Wikimedia metadata pilot; contact required)");
const requestedTitles = JSON.parse(readFileSync(resolve(titlesInput), "utf8"));
let titles = [...new Set(requestedTitles)];
if (titles.length < 300) {
  const searchUrl = new URL(api);
  searchUrl.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", list: "search", srsearch: option("--search", "Vietnam"), srnamespace: "6", srlimit: "300" }).toString();
  const searchResponse = await fetch(searchUrl, { headers: { accept: "application/json", "user-agent": userAgent }, signal: AbortSignal.timeout(30000) });
  if (!searchResponse.ok) throw new Error(`Wikimedia search HTTP ${searchResponse.status}`);
  const searchPayload = await searchResponse.json();
  titles = [...new Set([...titles, ...(searchPayload.query?.search ?? []).map((item) => item.title)])];
}
titles = titles.slice(0, 300);
const records = [];
const errors = [];
const startedAt = new Date().toISOString();
for (let index = 0; index < titles.length; index += 50) {
  const batch = titles.slice(index, index + 50);
  try {
    const url = new URL(api);
    url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", titles: batch.join("|"), prop: "imageinfo|revisions", iiprop: "url|extmetadata|timestamp", rvprop: "ids|timestamp" }).toString();
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": userAgent }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Wikimedia API HTTP ${response.status}`);
    const payload = await response.json();
    const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : Object.values(payload?.query?.pages ?? {});
    for (const page of pages) {
      const info = page.imageinfo?.[0] ?? {};
      const meta = info.extmetadata ?? {};
      const value = (key) => meta[key]?.value?.trim?.() || null;
      records.push({ id: `wikimedia-${page.pageid}`, provider: "WIKIMEDIA_COMMONS", pageId: page.pageid ?? null, fileTitle: page.title ?? null, revisionId: page.lastrevid ?? page.revisions?.[0]?.revid ?? null, revisionTimestamp: page.touched ?? page.revisions?.[0]?.timestamp ?? info.timestamp ?? null, originalUrl: info.url ?? null, descriptionUrl: info.descriptionurl ?? null, artist: value("Artist"), creditLine: value("Credit"), licenseShortName: value("LicenseShortName"), licenseUrl: value("LicenseUrl"), restrictions: value("Restrictions"), rightsStatus: "LINK_ONLY", reviewStatus: "PENDING_REVIEW", importedAt: new Date().toISOString(), binaryDownloaded: false, autoPublished: false });
    }
  } catch (error) { errors.push({ batchStart: index, titles: batch, error: String(error) }); }
}
const report = { generatedAt: startedAt, provider: "WIKIMEDIA_COMMONS", status: records.length === 300 && errors.length === 0 ? "PASS" : "FAIL", requested: titles.length, imported: records.length, batches: Math.ceil(titles.length / 50), errors, binaryDownloaded: false, autoPublished: false, rightsStatus: "LINK_ONLY", reviewStatus: "PENDING_REVIEW", records };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Wikimedia 300-record metadata pilot\n\n- Status: **${report.status}**\n- Requested/imported: ${report.requested}/${report.imported}\n- Batches: ${report.batches}\n- Errors: ${report.errors.length}\n- Binary downloaded: **NO**\n- Auto-published: **NO**\n- Rights: **LINK_ONLY**\n- Review: **PENDING_REVIEW**\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, requested: report.requested, imported: report.imported, errors: report.errors.length })}\n`);
if (report.status !== "PASS") process.exitCode = 1;
