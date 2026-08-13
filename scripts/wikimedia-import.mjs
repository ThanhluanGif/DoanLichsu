import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const input = option("--input", null);
const api = option("--api", "https://commons.wikimedia.org/w/api.php");
const title = option("--title", null);
const output = resolve(option("--output", "artifacts/wikimedia/review-queue.json"));
const userAgent = option("--user-agent", "QuanSuViet/0.1 (research contact required)");
const startedAt = new Date().toISOString();
let payload;
let origin;
try {
  if (input) payload = JSON.parse(readFileSync(resolve(input), "utf8"));
  else {
    if (!title) throw new Error("--title is required when --input is not used");
    const url = new URL(api);
    url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", titles: title, prop: "imageinfo|revisions", iiprop: "url|extmetadata|timestamp", rvprop: "ids|timestamp" }).toString();
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": userAgent }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Wikimedia API HTTP ${response.status}`);
    payload = await response.json();
  }
  const pages = payload?.query?.pages ?? (Array.isArray(payload?.query?.pages) ? payload.query.pages : []);
  const pageValues = Array.isArray(pages) ? pages : Object.values(pages);
  const records = pageValues.map((page) => {
    const info = page.imageinfo?.[0] ?? {};
    const meta = info.extmetadata ?? {};
    const value = (key) => meta[key]?.value?.trim?.() || null;
    return {
      id: `wikimedia-${page.pageid}`,
      provider: "WIKIMEDIA_COMMONS",
      pageId: page.pageid,
      fileTitle: page.title,
      revisionId: page.lastrevid ?? page.revisions?.[0]?.revid ?? null,
      revisionTimestamp: page.touched ?? page.revisions?.[0]?.timestamp ?? info.timestamp ?? null,
      originalUrl: info.url ?? null,
      descriptionUrl: info.descriptionurl ?? null,
      artist: value("Artist"),
      creditLine: value("Credit"),
      licenseShortName: value("LicenseShortName"),
      licenseUrl: value("LicenseUrl"),
      restrictions: value("Restrictions"),
      rightsStatus: "LINK_ONLY",
      reviewStatus: "PENDING_REVIEW",
      importedAt: startedAt,
      binaryDownloaded: false,
      autoPublished: false,
    };
  });
  if (!records.length) throw new Error("No Wikimedia pages returned");
  const report = { generatedAt: startedAt, provider: "WIKIMEDIA_COMMONS", status: "PASS", source: input ? `fixture:${resolve(input)}` : api, count: records.length, records };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [`# Wikimedia metadata review queue`, ``, `- Source: ${report.source}`, `- Status: **PASS**`, `- Records: ${records.length}`, `- Binary downloaded: **NO**`, `- Auto-published: **NO**`, ``, `| File | Revision | License | Review | Rights |`, `|---|---|---|---|---|`, ...records.map((record) => `| ${record.fileTitle} | ${record.revisionId ?? "—"} | ${record.licenseShortName ?? "—"} | ${record.reviewStatus} | ${record.rightsStatus} |`), ``].join("\n");
  writeFileSync(output.replace(/\.json$/, ".md"), `${markdown}\n`);
  process.stdout.write(`${JSON.stringify(report)}\n`);
} catch (error) {
  const report = { generatedAt: startedAt, provider: "WIKIMEDIA_COMMONS", status: "FAIL", source: input ? `fixture:${resolve(input)}` : api, error: String(error), binaryDownloaded: false, autoPublished: false, remediation: "Inspect API availability/rate limit and retry with a bounded batch; do not publish or serve binary." };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(output.replace(/\.json$/, ".md"), `# Wikimedia importer failure\n\n- Status: **FAIL**\n- Error: ${report.error}\n- Binary downloaded: **NO**\n- Auto-published: **NO**\n- Remediation: ${report.remediation}\n`);
  process.stderr.write(`${JSON.stringify(report)}\n`);
  process.exitCode = 1;
}
