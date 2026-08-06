#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const httpMethods = new Set(["get","post","put","patch","delete","head","options"]);
const argv = process.argv.slice(2);
function argument(name, fallback) {
  const exact = argv.indexOf(name);
  if (exact >= 0 && argv[exact + 1]) return argv[exact + 1];
  const inline = argv.find((value) => value.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
}

const baseUrl = new URL(argument("--base-url", "http://127.0.0.1:3000")).origin;
const reportDirectory = resolve(argument("--report-dir", "artifacts/contract"));
const runId = randomUUID().slice(0, 8);
const origin = new URL(baseUrl).origin;
const credentials = {
  ADMIN: { email:"admin@quansuviet.local", password:process.env.CONTRACT_ADMIN_PASSWORD ?? "Admin-Demo-2026!" },
  EDITOR: { email:"editor@quansuviet.local", password:process.env.CONTRACT_EDITOR_PASSWORD ?? "Editor-Demo-2026!" },
  REVIEWER: { email:"reviewer@quansuviet.local", password:process.env.CONTRACT_REVIEWER_PASSWORD ?? "Reviewer-Demo-2026!" },
};
const cases = [];

function planningOperations(markdown) {
  const operations = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^\|\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\|\s*`([^`]+)`/.exec(line);
    if (match) operations.push(`${match[1].toLowerCase()} ${match[2]}`);
  }
  return [...new Set(operations)].sort();
}

function runtimeOperations(document) {
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    Object.keys(item).filter((method) => httpMethods.has(method)).map((method) => `${method} ${path}`),
  ).sort();
}

export function shapeDiff(value, requiredPaths) {
  const missing = requiredPaths.filter((path) => {
    let current = value;
    for (const part of path.split(".")) {
      if (current === null || typeof current !== "object" || !(part in current)) return true;
      current = current[part];
    }
    return false;
  });
  return missing.length ? `missing required field(s): ${missing.join(", ")}` : null;
}

function assertShape(body, requiredPaths) {
  const diff = shapeDiff(body, requiredPaths);
  if (diff) throw new Error(diff);
}

function assertNoSecrets(body) {
  const serialized = JSON.stringify(body);
  if (/password_hash|session_secret|qsv_session|temporaryPassword|resetPassword|"token"/i.test(serialized)) {
    throw new Error("response leaked a password/session/token field");
  }
}

function assertIsoTimestamps(value, path = "response") {
  if (Array.isArray(value)) return value.forEach((entry, index) => assertIsoTimestamps(entry, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if ((key === "timestamp" || /(?:At|Date)$/.test(key)) && typeof nested === "string" && Number.isNaN(Date.parse(nested))) {
      throw new Error(`${path}.${key} is not an ISO timestamp: ${nested}`);
    }
    assertIsoTimestamps(nested, `${path}.${key}`);
  }
}

async function http(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.cookie) headers.set("Cookie", options.cookie);
  if (options.origin !== false && ["POST","PUT","PATCH","DELETE"].includes(options.method ?? "GET")) {
    headers.set("Origin", options.origin ?? origin);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method:options.method ?? "GET",headers,redirect:"manual",
    ...(options.body === undefined ? {} : { body:JSON.stringify(options.body) }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let body = text;
  if (contentType.includes("json") && text) body = JSON.parse(text);
  return { response, body, text };
}

async function check(name, expectedStatus, action, requiredPaths = []) {
  const started = performance.now();
  try {
    const result = await action();
    if (result.response.status !== expectedStatus) {
      throw new Error(`expected HTTP ${expectedStatus}, received ${result.response.status}: ${result.text.slice(0, 300)}`);
    }
    if (requiredPaths.length) assertShape(result.body, requiredPaths);
    if (typeof result.body === "object") {
      if (name !== "plumbing.openapi") assertNoSecrets(result.body);
      assertIsoTimestamps(result.body);
    }
    cases.push({ name,passed:true,status:result.response.status,durationMs:Math.round(performance.now()-started) });
    return result;
  } catch (error) {
    cases.push({ name,passed:false,status:null,durationMs:Math.round(performance.now()-started),diff:error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function login(role) {
  const result = await check(`auth.login.${role.toLowerCase()}`, 200, () => http("/api/v1/auth/login", { method:"POST",body:credentials[role] }), ["data.id","data.email","data.displayName","data.role"]);
  if (!result) return null;
  const setCookie = result.response.headers.get("set-cookie");
  if (!setCookie?.includes("HttpOnly") || !setCookie.includes("SameSite=Lax")) {
    cases.push({ name:`auth.cookie.${role.toLowerCase()}`,passed:false,status:200,durationMs:0,diff:"missing HttpOnly or SameSite=Lax" });
    return null;
  }
  cases.push({ name:`auth.cookie.${role.toLowerCase()}`,passed:true,status:200,durationMs:0 });
  return setCookie.split(";", 1)[0];
}

const contractMarkdown = await readFile(resolve("flow/05-contract.md"), "utf8");
const planned = planningOperations(contractMarkdown);
const openApiResult = await check("plumbing.openapi", 200, () => http("/openapi.json"), ["openapi","info.title","paths","components.schemas.ApiError"]);
const openApi = openApiResult?.body && typeof openApiResult.body === "object" ? openApiResult.body : { paths:{} };
const runtime = runtimeOperations(openApi);
const missingOperations = planned.filter((operation) => !runtime.includes(operation));
const extraOperations = runtime.filter((operation) => !planned.includes(operation));

await check("plumbing.health", 200, () => http("/healthz"), ["status","version","database","timestamp"]);
await check("plumbing.docs", 200, () => http("/docs"));
await check("plumbing.sitemap", 200, () => http("/sitemap.xml"));
await check("plumbing.robots", 200, () => http("/robots.txt"));

await check("public.home", 200, () => http("/api/v1/vi/home"), ["data.featured","data.periods","data.latest","data.counts"]);
await check("public.periods", 200, () => http("/api/v1/vi/periods"), ["data","meta.page","meta.pageSize","meta.total","meta.totalPages"]);
await check("public.timeline", 200, () => http("/api/v1/vi/timeline?page=1&pageSize=3"), ["data","meta.total"]);
const firstList = await check("public.contents.first", 200, () => http("/api/v1/vi/contents?page=1&pageSize=3"), ["data","meta.page","meta.total"]);
const secondList = await check("public.contents.deterministic", 200, () => http("/api/v1/vi/contents?page=1&pageSize=3"), ["data","meta.page","meta.total"]);
if (firstList && secondList) {
  const firstIds = firstList.body.data.map((item) => item.id);
  const secondIds = secondList.body.data.map((item) => item.id);
  const passed = JSON.stringify(firstIds) === JSON.stringify(secondIds);
  cases.push({ name:"public.pagination.stable",passed,status:200,durationMs:0,...(passed?{}:{diff:`order changed: ${JSON.stringify(firstIds)} -> ${JSON.stringify(secondIds)}`}) });
}
await check("public.detail", 200, () => http("/api/v1/vi/contents/EVENT/chien-dich-dien-bien-phu"), ["data.id","data.title","data.body","data.sources","data.alternate","data.reviewedBy","data.publishedAt"]);
await check("public.search", 200, () => http("/api/v1/vi/search?q=dien%20bien%20phu"), ["data","meta.total"]);
await check("public.taxonomies", 200, () => http("/api/v1/vi/taxonomies"), ["data.periods","data.tags","data.types"]);
await check("public.alternate", 200, () => http("/api/v1/contents/event-dien-bien-phu/alternate?locale=vi"), ["data.id","data.current","data.alternate"]);
await check("error.400.invalid-query", 400, () => http("/api/v1/vi/search?q="), ["code","message","requestId"]);
await check("error.404.not-found", 404, () => http("/api/v1/vi/contents/EVENT/not-a-real-slug"), ["code","message","requestId"]);
await check("error.401.no-session", 401, () => http("/api/v1/auth/me"), ["code","message","requestId"]);

const rateEmail = `contract-rate-${runId}@example.test`;
for (let attempt = 1; attempt <= 5; attempt += 1) {
  await check(`auth.rate-limit.failure-${attempt}`, 401, () => http("/api/v1/auth/login", { method:"POST",body:{ email:rateEmail,password:"Wrong-Password-2026!" } }), ["code","requestId"]);
}
await check("error.429.rate-limit", 429, () => http("/api/v1/auth/login", { method:"POST",body:{ email:rateEmail,password:"Wrong-Password-2026!" } }), ["code","requestId"]);

const adminCookie = await login("ADMIN");
const editorCookie = await login("EDITOR");
const reviewerCookie = await login("REVIEWER");
if (adminCookie) await check("auth.me", 200, () => http("/api/v1/auth/me", { cookie:adminCookie }), ["data.id","data.role"]);
await check("error.403.editor-users", 403, () => http("/api/v1/admin/users", { cookie:editorCookie }), ["code","requestId"]);
await check("error.403.reviewer-users", 403, () => http("/api/v1/admin/users", { cookie:reviewerCookie }), ["code","requestId"]);
await check("error.403.invalid-origin", 403, () => http("/api/v1/admin/contents", { method:"POST",cookie:editorCookie,origin:"https://invalid-origin.example",body:{ type:"EVENT",sourceIds:[],translations:{} } }), ["code","requestId"]);

await check("admin.dashboard", 200, () => http("/api/v1/admin/dashboard", { cookie:editorCookie }), ["data.countsByStatus","data.countsByType","data.recentAudit"]);
await check("admin.contents.list", 200, () => http("/api/v1/admin/contents?page=1&pageSize=5", { cookie:editorCookie }), ["data","meta.total"]);
await check("admin.sources.list", 200, () => http("/api/v1/admin/sources?page=1&pageSize=5", { cookie:editorCookie }), ["data","meta.total"]);
await check("admin.media.list", 200, () => http("/api/v1/admin/media?page=1&pageSize=5", { cookie:editorCookie }), ["data","meta.total"]);
await check("admin.users.list", 200, () => http("/api/v1/admin/users?page=1&pageSize=5", { cookie:adminCookie }), ["data","meta.total"]);
await check("admin.audit.list", 200, () => http("/api/v1/admin/audit-logs?page=1&pageSize=10", { cookie:adminCookie }), ["data","meta.total"]);

const sourceCreated = await check("admin.source.create", 201, () => http("/api/v1/admin/sources", { method:"POST",cookie:editorCookie,body:{ title:`Contract source ${runId}`,url:`https://example.test/source/${runId}`,accessedAt:new Date().toISOString() } }), ["data.id","data.version","data.url"]);
const sourceId = sourceCreated?.body.data.id;
const sourcePatched = sourceId ? await check("admin.source.patch", 200, () => http(`/api/v1/admin/sources/${sourceId}`, { method:"PATCH",cookie:editorCookie,body:{ version:1,title:`Contract source updated ${runId}`,url:`https://example.test/source/${runId}`,accessedAt:new Date().toISOString() } }), ["data.id","data.version"]) : null;

const mediaCreated = await check("admin.media.create", 201, () => http("/api/v1/admin/media", { method:"POST",cookie:editorCookie,body:{ url:`https://example.test/media/${runId}.jpg`,kind:"IMAGE",credit:"Contract suite",license:"CC BY 4.0",altVi:"Ảnh kiểm thử contract",altEn:"Contract test image" } }), ["data.id","data.version","data.credit"]);
const mediaId = mediaCreated?.body.data.id;
const mediaPatched = mediaId ? await check("admin.media.patch", 200, () => http(`/api/v1/admin/media/${mediaId}`, { method:"PATCH",cookie:editorCookie,body:{ version:1,url:`https://example.test/media/${runId}.jpg`,kind:"IMAGE",credit:"Contract suite updated",license:"CC BY 4.0",altVi:"Ảnh kiểm thử contract",altEn:"Contract test image" } }), ["data.id","data.version"]) : null;

const testUser = await check("admin.user.create", 201, () => http("/api/v1/admin/users", { method:"POST",cookie:adminCookie,body:{ email:`contract-${runId}@example.test`,displayName:`Contract ${runId}`,role:"EDITOR",temporaryPassword:`Contract-${runId}-Password!` } }), ["data.id","data.active","data.version"]);
const userId = testUser?.body.data.id;
if (userId) await check("admin.user.patch", 200, () => http(`/api/v1/admin/users/${userId}`, { method:"PATCH",cookie:adminCookie,body:{ version:1,displayName:`Contract cleaned ${runId}`,active:false } }), ["data.id","data.version","data.active"]);
await check("admin.user.last-admin", 422, () => http("/api/v1/admin/users/user-admin", { method:"PATCH",cookie:adminCookie,body:{ version:1,role:"EDITOR" } }), ["code","requestId"]);

let contentId = null;
let viSlug = `contract-live-${runId}`;
if (mediaId) {
  const created = await check("admin.content.create", 201, () => http("/api/v1/admin/contents", { method:"POST",cookie:editorCookie,body:{
    type:"EVENT",sourceIds:[],mediaIds:[mediaId],translations:{vi:{title:`Contract live ${runId}`,slug:viSlug,summary:"Contract summary",body:"Contract body",seoTitle:`Contract ${runId}`,seoDescription:"Contract description",translationStatus:"TRANSLATING"}},
  } }), ["data.id","data.status","data.version","data.translations.vi"]);
  contentId = created?.body.data.id ?? null;
}

if (contentId) {
  await check("admin.content.get", 200, () => http(`/api/v1/admin/contents/${contentId}`, { cookie:editorCookie }), ["data.id","data.version","data.translations"]);
  await check("admin.translation.put", 200, () => http(`/api/v1/admin/contents/${contentId}/translations/en`, { method:"PUT",cookie:editorCookie,body:{ version:0,title:`Contract EN ${runId}`,slug:`contract-en-${runId}`,summary:"English summary",body:"English body",seoTitle:`Contract EN ${runId}`,seoDescription:"English description",translationStatus:"TRANSLATING" } }), ["data.id","data.locale","data.version"]);
  await check("error.409.stale-version", 409, () => http(`/api/v1/admin/contents/${contentId}`, { method:"PATCH",cookie:editorCookie,body:{ version:1,featured:true } }), ["code","requestId"]);
  await check("workflow.submit", 200, () => http(`/api/v1/admin/contents/${contentId}/submit-review`, { method:"POST",cookie:editorCookie,body:{ version:2,locales:["vi","en"] } }), ["data.status","data.version","data.translationStatuses"]);
  await check("workflow.reject-reason-required", 400, () => http(`/api/v1/admin/contents/${contentId}/reject`, { method:"POST",cookie:reviewerCookie,body:{ version:3,locales:["vi","en"] } }), ["code","details.fieldErrors.reason","requestId"]);
  await check("workflow.editor-approve-forbidden", 403, () => http(`/api/v1/admin/contents/${contentId}/approve`, { method:"POST",cookie:editorCookie,body:{ version:3,locales:["vi","en"] } }), ["code","requestId"]);
  await check("workflow.reject", 200, () => http(`/api/v1/admin/contents/${contentId}/reject`, { method:"POST",cookie:reviewerCookie,body:{ version:3,locales:["vi","en"],reason:"Contract rejection" } }), ["data.status","data.version"]);
  await check("workflow.resubmit", 200, () => http(`/api/v1/admin/contents/${contentId}/submit-review`, { method:"POST",cookie:editorCookie,body:{ version:4,locales:["vi","en"] } }), ["data.status","data.version"]);
  await check("workflow.approve", 200, () => http(`/api/v1/admin/contents/${contentId}/approve`, { method:"POST",cookie:reviewerCookie,body:{ version:5,locales:["vi","en"] } }), ["data.status","data.version","data.reviewedAt"]);
  await check("error.422.publish-source", 422, () => http(`/api/v1/admin/contents/${contentId}/publish`, { method:"POST",cookie:reviewerCookie,body:{ version:6,locales:["vi","en"] } }), ["code","details.violations","requestId"]);
  if (sourceId) await check("admin.content.patch", 200, () => http(`/api/v1/admin/contents/${contentId}`, { method:"PATCH",cookie:editorCookie,body:{ version:6,sourceIds:[sourceId],mediaIds:[mediaId] } }), ["data.id","data.version","data.sourceIds"]);
  await check("workflow.editor-publish-forbidden", 403, () => http(`/api/v1/admin/contents/${contentId}/publish`, { method:"POST",cookie:editorCookie,body:{ version:7,locales:["vi","en"] } }), ["code","requestId"]);
  await check("workflow.publish", 200, () => http(`/api/v1/admin/contents/${contentId}/publish`, { method:"POST",cookie:reviewerCookie,body:{ version:7,locales:["vi","en"] } }), ["data.status","data.version","data.publishedAt"]);
  await check("public.created-detail", 200, () => http(`/api/v1/vi/contents/EVENT/${viSlug}`), ["data.id","data.sources","data.media","data.alternate"]);
  await check("public.created-alternate", 200, () => http(`/api/v1/contents/${contentId}/alternate?locale=vi`), ["data.current","data.alternate"]);
  if (sourceId) await check("workflow.published-source-immutable", 422, () => http(`/api/v1/admin/sources/${sourceId}`, { method:"PATCH",cookie:editorCookie,body:{ version:sourcePatched?.body.data.version ?? 2,title:"Must not mutate",url:`https://example.test/source/${runId}`,accessedAt:new Date().toISOString() } }), ["code","requestId"]);
  if (mediaId) await check("workflow.published-media-immutable", 422, () => http(`/api/v1/admin/media/${mediaId}`, { method:"PATCH",cookie:editorCookie,body:{ version:mediaPatched?.body.data.version ?? 2,url:`https://example.test/media/${runId}.jpg`,kind:"IMAGE",credit:"Must not mutate",license:"CC BY 4.0",altVi:"Không đổi",altEn:"No change" } }), ["code","requestId"]);
  await check("admin.audit.object", 200, () => http(`/api/v1/admin/audit-logs?objectId=${contentId}&pageSize=100`, { cookie:adminCookie }), ["data","meta.total"]);
  await check("cleanup.content.archive", 200, () => http(`/api/v1/admin/contents/${contentId}/archive`, { method:"POST",cookie:reviewerCookie,body:{ version:8 } }), ["data.status","data.version"]);
  await check("cleanup.public-hidden", 404, () => http(`/api/v1/vi/contents/EVENT/${viSlug}`), ["code","requestId"]);
}

const diagnostic = shapeDiff({ data:{} }, ["data.id","data.status"]);
cases.push({ name:"diagnostic.shape-diff",passed:diagnostic === "missing required field(s): data.id, data.status",status:null,durationMs:0,...(diagnostic?{sampleDiff:diagnostic}:{diff:"shape diff did not identify missing fields"}) });

if (adminCookie) await check("auth.logout", 200, () => http("/api/v1/auth/logout", { method:"POST",cookie:adminCookie }), ["data.loggedOut"]);

if (missingOperations.length) cases.push({ name:"openapi.planning-coverage",passed:false,status:200,durationMs:0,diff:`missing operations: ${missingOperations.join(", ")}` });
else cases.push({ name:"openapi.planning-coverage",passed:true,status:200,durationMs:0 });
if (extraOperations.length) cases.push({ name:"openapi.no-extra-operations",passed:false,status:200,durationMs:0,diff:`runtime-only operations: ${extraOperations.join(", ")}` });
else cases.push({ name:"openapi.no-extra-operations",passed:true,status:200,durationMs:0 });

const passed = cases.filter((item) => item.passed).length;
const failed = cases.length - passed;
const report = {
  schemaVersion:1,generatedAt:new Date().toISOString(),baseUrl,
  planning:{operationCount:planned.length,operations:planned},runtime:{operationCount:runtime.length,operations:runtime},
  drift:{missingOperations,extraOperations},summary:{total:cases.length,passed,failed},
  cleanup:{content:contentId ? "archived" : "not-created",testUser:userId ? "disabled" : "not-created",databaseTeardown:"caller-owned dedicated database"},
  cases,
};

function markdown(value) {
  const rows = value.cases.map((item) => `| ${item.passed ? "PASS" : "FAIL"} | ${item.name} | ${item.status ?? "—"} | ${item.diff ?? item.sampleDiff ?? ""} |`).join("\n");
  return `# Contract report\n\n- Generated: ${value.generatedAt}\n- Base URL: ${value.baseUrl}\n- Planning operations: ${value.planning.operationCount}\n- Runtime operations: ${value.runtime.operationCount}\n- Cases: ${value.summary.passed}/${value.summary.total} passed\n- Drift: ${value.drift.missingOperations.length} missing, ${value.drift.extraOperations.length} extra\n- Cleanup: content ${value.cleanup.content}; test user ${value.cleanup.testUser}; database teardown ${value.cleanup.databaseTeardown}\n\n| Result | Case | HTTP | Diff |\n|---|---|---:|---|\n${rows}\n`;
}

await mkdir(reportDirectory, { recursive:true });
await writeFile(resolve(reportDirectory, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(resolve(reportDirectory, "latest.md"), markdown(report), "utf8");
console.log(JSON.stringify({ report:resolve(reportDirectory,"latest.json"),markdown:resolve(reportDirectory,"latest.md"),operations:`${runtime.length}/${planned.length}`,cases:`${passed}/${cases.length}`,failed }));
if (failed) process.exitCode = 1;
