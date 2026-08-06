#!/usr/bin/env node
import { mkdir,open,readFile,rename,unlink,writeFile } from "node:fs/promises";
import { lstatSync,realpathSync } from "node:fs";
import { resolve,sep } from "node:path";
import { tmpdir } from "node:os";
import { createHash,randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { hash } from "@node-rs/argon2";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { contractShapeDrift,planningOperations,runtimeOperations } from "./contract-shape.mjs";

const argv = process.argv.slice(2);
function argument(name, fallback) {
  const exact = argv.indexOf(name);
  if (exact >= 0 && argv[exact + 1]) return argv[exact + 1];
  const inline = argv.find((value) => value.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
}

const baseUrl = new URL(argument("--base-url", "http://127.0.0.1:3000")).origin;
const reportDirectory = resolve(argument("--report-dir", "artifacts/contract"));
const cleanupDatabasePath = argument("--cleanup-database", process.env.CONTRACT_DATABASE_PATH);
const runId = randomUUID().slice(0, 8);
const origin = new URL(baseUrl).origin;
const isLocalTarget = ["127.0.0.1","localhost","::1"].includes(new URL(baseUrl).hostname);
const configurationErrors = [
  ...(!isLocalTarget ? ["contract checks that mutate data require a localhost target"] : []),
  ...(!cleanupDatabasePath ? ["set --cleanup-database or CONTRACT_DATABASE_PATH before the first HTTP request"] : []),
];
const authFixtures = {
  ADMIN:{ id:`contract-auth-admin-${runId}`,email:`contract-auth-admin-${runId}@example.test`,displayName:"Contract Admin",role:"ADMIN",password:`Contract-${runId}-Admin-Password!` },
  EDITOR:{ id:`contract-auth-editor-${runId}`,email:`contract-auth-editor-${runId}@example.test`,displayName:"Contract Editor",role:"EDITOR",password:`Contract-${runId}-Editor-Password!` },
  REVIEWER:{ id:`contract-auth-reviewer-${runId}`,email:`contract-auth-reviewer-${runId}@example.test`,displayName:"Contract Reviewer",role:"REVIEWER",password:`Contract-${runId}-Reviewer-Password!` },
};
const credentials = Object.fromEntries(Object.entries(authFixtures).map(([role,fixture]) => [role,{email:fixture.email,password:fixture.password}]));
const temporaryPassword = `Contract-${runId}-Password!`;
const resetPassword = `Contract-${runId}-Reset-Password!`;
const sensitiveValues = Object.values(credentials).map((credential) => credential.password).concat(["Wrong-Password-2026!",temporaryPassword,resetPassword]);
const cases = [];
const requestTimeoutMs = 10_000;
const ajv = new Ajv2020({ allErrors:true,strict:false });
addFormats(ajv);
const responseValidators = new Map();
let liveOpenApi = null;
let validatedResponseCount = 0;
let lockHandle = null;
let lockPath = null;
let identityBound = false;
let identityState = "not-run";
let baselineDigest = null;
let baselineCounts = null;
let cleanupState = "not-run";
let roleProbeIds = null;

const digestTables = [
  "schema_migrations","app_metadata","content_nodes","content_translations","sources","media","tags","content_sources","content_media","content_tags","content_relations","users","audit_logs","login_rate_limits",
];

function databaseCounts(database) {
  return {
    contentNodes:database.prepare("SELECT count(*) AS count FROM content_nodes").get().count,
    translations:database.prepare("SELECT count(*) AS count FROM content_translations").get().count,
    sources:database.prepare("SELECT count(*) AS count FROM sources").get().count,
    media:database.prepare("SELECT count(*) AS count FROM media").get().count,
    users:database.prepare("SELECT count(*) AS count FROM users").get().count,
    auditLogs:database.prepare("SELECT count(*) AS count FROM audit_logs").get().count,
    rateLimits:database.prepare("SELECT count(*) AS count FROM login_rate_limits").get().count,
    schemaVersion:database.prepare("SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations").get().version,
  };
}

function databaseDigest(database) {
  const hash = createHash("sha256");
  for (const table of digestTables) {
    hash.update(table);
    hash.update(JSON.stringify(database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()));
  }
  return hash.digest("hex");
}

function dedicatedDatabasePath(path) {
  const candidate = resolve(path);
  const metadata = lstatSync(candidate);
  if (metadata.isSymbolicLink()) throw new Error("cleanup database must not be a symlink");
  if (!metadata.isFile() || metadata.nlink !== 1) throw new Error("cleanup database must be a single-link regular file");
  const real = realpathSync(candidate);
  const temporaryRoots = [...new Set([realpathSync(tmpdir()),realpathSync("/tmp")])];
  if (!temporaryRoots.some((temporary) => real === temporary || real.startsWith(`${temporary}${sep}`))) throw new Error(`cleanup database must be beneath a system temporary directory: ${temporaryRoots.join(", ")}`);
  return real;
}

async function proveDatabaseIdentity() {
  const started = performance.now();
  const path = dedicatedDatabasePath(cleanupDatabasePath);
  const candidateLockPath = `${path}.contract-check.lock`;
  const acquiredLock = await open(candidateLockPath,"wx",0o600);
  lockPath = candidateLockPath;
  lockHandle = acquiredLock;
  const database = new Database(path);
  database.pragma("foreign_keys=ON");
  try {
    baselineCounts = databaseCounts(database);
    const expected = { contentNodes:50,translations:100,sources:50,media:10,users:3,auditLogs:0,rateLimits:0,schemaVersion:3 };
    const drift = Object.entries(expected).filter(([name,count]) => baselineCounts[name] !== count).map(([name,count]) => `${name}=${baselineCounts[name]} expected ${count}`);
    if (drift.length) throw new Error(`database is not a pristine disposable seed: ${drift.join(", ")}`);
    baselineDigest = databaseDigest(database);
    const row = database.prepare(`
      SELECT t.id,n.id AS node_id,n.type,t.locale,t.slug,t.summary
      FROM content_translations t JOIN content_nodes n ON n.id=t.node_id
      WHERE n.status='PUBLISHED' AND t.translation_status='PUBLISHED'
      ORDER BY t.id LIMIT 1
    `).get();
    if (!row) throw new Error("identity probe needs one published seed translation");
    const marker = `contract-identity-${runId}`;
    let observed = false;
    let probeError = null;
    database.prepare("UPDATE content_translations SET summary=? WHERE id=?").run(marker,row.id);
    try {
      const result = await http(`/api/v1/${row.locale}/contents/${row.type}/${row.slug}`);
      observed = result.response.status === 200 && result.body?.data?.summary === marker;
      if (!observed) throw new Error("HTTP target did not observe the reversible marker in CONTRACT_DATABASE_PATH");
    } catch (error) {
      probeError = error;
    } finally {
      database.prepare("UPDATE content_translations SET summary=? WHERE id=?").run(row.summary,row.id);
    }
    if (database.prepare("SELECT summary FROM content_translations WHERE id=?").get(row.id)?.summary !== row.summary) throw new Error("identity marker restoration failed");
    if (databaseDigest(database) !== baselineDigest) throw new Error("database digest changed during identity probe restoration");
    identityBound = true;
    if (probeError) throw probeError;
    const now = new Date().toISOString();
    const fixtures = await Promise.all(Object.values(authFixtures).map(async (fixture) => ({...fixture,passwordHash:await hash(fixture.password)})));
    database.transaction(() => {
      const insert = database.prepare("INSERT INTO users(id,email,display_name,role,password_hash,active,session_version,version,created_at,updated_at) VALUES(?,?,?,?,?,1,1,1,?,?)");
      for (const fixture of fixtures) insert.run(fixture.id,fixture.email,fixture.displayName,fixture.role,fixture.passwordHash,now,now);
    }).immediate();
    roleProbeIds = {
      content:row.node_id,
      source:database.prepare("SELECT id FROM sources ORDER BY id LIMIT 1").get().id,
      media:database.prepare("SELECT id FROM media ORDER BY id LIMIT 1").get().id,
      user:authFixtures.ADMIN.id,
    };
    identityState = `verified marker over ${row.locale}/${row.type}/${row.slug}; baseline sha256=${baselineDigest}`;
    cases.push({ name:"preflight.database-identity",passed:true,status:200,durationMs:Math.round(performance.now()-started),url:`${baseUrl}/api/v1/${row.locale}/contents/${row.type}/${row.slug}` });
  } catch (error) {
    identityState = "failed";
    cases.push({ name:"preflight.database-identity",passed:false,status:null,durationMs:Math.round(performance.now()-started),diff:error instanceof Error?error.message:String(error) });
    throw error;
  } finally {
    database.close();
  }
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

function assertNoSecrets(body, path = "response") {
  const blockedKey = /^(?:password|password_hash|passwordHash|temporaryPassword|resetPassword|session_secret|sessionSecret|sessionToken|accessToken|refreshToken|token|tokenHash|cookie|credentials?)$/i;
  if (Array.isArray(body)) return body.forEach((value,index) => assertNoSecrets(value,`${path}[${index}]`));
  if (body && typeof body === "object") {
    for (const [key,value] of Object.entries(body)) {
      if (blockedKey.test(key) || /(?:hash|token|secret)$/i.test(key)) throw new Error(`${path}.${key} is a forbidden secret-bearing response field`);
      assertNoSecrets(value,`${path}.${key}`);
    }
    return;
  }
  if (typeof body === "string") {
    if (sensitiveValues.some((secret) => secret && body.includes(secret)) || /\$argon2(?:id|i|d)\$|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(body)) {
      throw new Error(`${path} contains a credential, password hash or token value`);
    }
  }
}

function assertIsoTimestamps(value, path = "response") {
  if (Array.isArray(value)) return value.forEach((entry, index) => assertIsoTimestamps(entry, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if ((key === "timestamp" || /At$/.test(key)) && nested !== null) {
      const utcIso = typeof nested === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(nested) && !Number.isNaN(Date.parse(nested));
      if (!utcIso) throw new Error(`${path}.${key} must be an ISO-8601 UTC timestamp ending in Z: ${String(nested)}`);
    }
    assertIsoTimestamps(nested, `${path}.${key}`);
  }
}

function matchingPathTemplate(pathname, document) {
  const actual = pathname.split("/");
  return Object.keys(document.paths ?? {}).filter((template) => {
    const expected = template.split("/");
    return expected.length === actual.length && expected.every((segment,index) => (/^\{[^}]+\}$/.test(segment) || segment === actual[index]));
  }).sort((left,right) => {
    const specificity = (template) => template.split("/").filter((segment) => !/^\{[^}]+\}$/.test(segment)).length;
    return specificity(right) - specificity(left) || left.localeCompare(right);
  })[0] ?? null;
}

function responseContentSchema(content, contentType) {
  const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
  if (content[normalized]) return { mediaType:normalized,schema:content[normalized].schema };
  const wildcard = Object.entries(content).find(([mediaType]) => {
    if (mediaType.endsWith("/*")) return normalized.startsWith(mediaType.slice(0, -1));
    if (mediaType.includes("*+")) {
      const [prefix,suffix] = mediaType.split("*");
      return normalized.startsWith(prefix) && normalized.endsWith(suffix);
    }
    return false;
  });
  return wildcard ? { mediaType:wildcard[0],schema:wildcard[1].schema } : null;
}

function validateLiveResponse(result) {
  if (!liveOpenApi) return;
  const template = matchingPathTemplate(result.path, liveOpenApi);
  const operation = template ? liveOpenApi.paths?.[template]?.[result.method.toLowerCase()] : null;
  if (!operation) throw new Error(`OpenAPI has no ${result.method} operation matching ${result.path}`);
  const rangeStatus = `${Math.floor(result.response.status / 100)}XX`;
  const declared = operation.responses?.[String(result.response.status)] ?? operation.responses?.[rangeStatus] ?? operation.responses?.[rangeStatus.toLowerCase()] ?? operation.responses?.default;
  if (!declared) throw new Error(`OpenAPI has no response schema for ${result.method} ${template} HTTP ${result.response.status}`);
  const content = declared.content ?? {};
  if (!Object.keys(content).length) {
    if (result.text.length) throw new Error(`OpenAPI declares no body for ${result.method} ${template} HTTP ${result.response.status}`);
    validatedResponseCount += 1;
    return;
  }
  const selected = responseContentSchema(content, result.contentType);
  if (!selected?.schema) throw new Error(`OpenAPI has no ${result.contentType || "unknown content-type"} schema for ${result.method} ${template} HTTP ${result.response.status}`);
  const cacheKey = `${result.method} ${template} ${result.response.status} ${selected.mediaType}`;
  let validate = responseValidators.get(cacheKey);
  if (!validate) {
    validate = ajv.compile({
      $schema:"https://json-schema.org/draft/2020-12/schema",
      ...selected.schema,
      components:liveOpenApi.components ?? {},
    });
    responseValidators.set(cacheKey, validate);
  }
  const value = selected.mediaType.includes("json") ? result.body : result.text;
  if (!validate(value)) {
    const details = (validate.errors ?? []).slice(0, 8).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
    throw new Error(`OpenAPI response mismatch for ${result.method} ${template} HTTP ${result.response.status}: ${details}`);
  }
  validatedResponseCount += 1;
}

async function http(path, options = {}) {
  const url = new URL(path, `${baseUrl}/`);
  if (url.origin !== origin) throw new Error(`refusing cross-origin contract request: ${url.origin}`);
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.cookie) headers.set("Cookie", options.cookie);
  if (options.origin !== false && ["POST","PUT","PATCH","DELETE"].includes(options.method ?? "GET")) {
    headers.set("Origin", options.origin ?? origin);
  }
  const method = options.method ?? "GET";
  const response = await fetch(url, {
    method,headers,redirect:"manual",signal:AbortSignal.timeout(requestTimeoutMs),
    ...(options.body === undefined ? {} : { body:JSON.stringify(options.body) }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let body = text;
  if (contentType.includes("json") && text) body = JSON.parse(text);
  return { response,body,text,contentType,path:url.pathname,method };
}

async function check(name, expectedStatus, action, requiredPaths = []) {
  const started = performance.now();
  let actualStatus = null;
  try {
    const result = await action();
    actualStatus = result.response.status;
    validateLiveResponse(result);
    if (result.response.status !== expectedStatus) {
      if (typeof result.body === "object") assertNoSecrets(result.body);
      throw new Error(`expected HTTP ${expectedStatus}, received ${result.response.status}`);
    }
    if (requiredPaths.length) assertShape(result.body, requiredPaths);
    if (typeof result.body === "object") {
      if (name !== "plumbing.openapi") assertNoSecrets(result.body);
      if (name !== "plumbing.openapi") assertIsoTimestamps(result.body);
    }
    cases.push({ name,passed:true,status:result.response.status,durationMs:Math.round(performance.now()-started) });
    return result;
  } catch (error) {
    cases.push({ name,passed:false,status:actualStatus,durationMs:Math.round(performance.now()-started),diff:error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function loginWithCredentials(name, credential) {
  const result = await check(`auth.login.${name}`, 200, () => http("/api/v1/auth/login", { method:"POST",body:credential }), ["data.id","data.email","data.displayName","data.role"]);
  if (!result) return null;
  const setCookie = result.response.headers.get("set-cookie");
  if (!setCookie?.includes("HttpOnly") || !setCookie.includes("SameSite=Lax")) {
    cases.push({ name:`auth.cookie.${name}`,passed:false,status:200,durationMs:0,diff:"missing HttpOnly or SameSite=Lax" });
    return null;
  }
  cases.push({ name:`auth.cookie.${name}`,passed:true,status:200,durationMs:0 });
  const cookie = setCookie.split(";", 1)[0];
  sensitiveValues.push(cookie);
  return cookie;
}

const login = (role) => loginWithCredentials(role.toLowerCase(),credentials[role]);

let planned = [];
let runtime = [];
let missingOperations = [];
let extraOperations = [];
let shapeDrift = [];
let contentId = null;
let userId = null;
const rateEmail = `contract-rate-${runId}@example.test`;

try {
if (configurationErrors.length) throw new Error(configurationErrors.join("; "));
await proveDatabaseIdentity();

const contractMarkdown = await readFile(resolve("flow/05-contract.md"), "utf8");
planned = planningOperations(contractMarkdown);
const openApiResult = await check("plumbing.openapi", 200, () => http("/openapi.json"), ["openapi","info.title","paths","components.schemas.ApiError"]);
const openApi = openApiResult?.body && typeof openApiResult.body === "object" ? openApiResult.body : { paths:{} };
liveOpenApi = openApiResult ? openApi : null;
runtime = runtimeOperations(openApi);
missingOperations = planned.filter((operation) => !runtime.includes(operation));
extraOperations = runtime.filter((operation) => !planned.includes(operation));
shapeDrift = contractShapeDrift(contractMarkdown, openApi);

await check("plumbing.health", 200, () => http("/healthz"), ["status","version","database","timestamp"]);
await check("plumbing.docs", 200, () => http("/docs"));
const sitemapResult = await check("plumbing.sitemap", 200, () => http("/sitemap.xml"));
if (sitemapResult) {
  const locations = [...sitemapResult.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
  const passed = /<urlset\b/.test(sitemapResult.text) && locations.length === 0 && !sitemapResult.text.includes("/api/");
  cases.push({ name:"plumbing.sitemap-empty-until-c006",passed,status:passed?200:null,durationMs:0,...(passed?{}:{diff:`C-005 sitemap must be a valid empty urlset without API URLs; found ${locations.length} locations`}) });
}
const robotsResult = await check("plumbing.robots", 200, () => http("/robots.txt"));
if (robotsResult) {
  const passed = robotsResult.text.includes("Disallow: /admin") && robotsResult.text.includes("Disallow: /api/v1/admin") && robotsResult.text.includes(`${origin}/sitemap.xml`);
  cases.push({ name:"plumbing.robots-policy",passed,status:passed?200:null,durationMs:0,...(passed?{}:{diff:"robots must disallow admin API/UI and name the runtime-origin sitemap"}) });
}

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
const titleList = await check("public.contents.title-order", 200, () => http("/api/v1/vi/contents?sort=title&page=1&pageSize=50"), ["data","meta.page","meta.total"]);
if (titleList) {
  const actualIds = titleList.body.data.map((item) => item.id);
  const expectedIds = [...titleList.body.data].sort((left,right) => left.title.localeCompare(right.title, "vi") || left.id.localeCompare(right.id, "en")).map((item) => item.id);
  const passed = actualIds.length > 1 && JSON.stringify(actualIds) === JSON.stringify(expectedIds);
  cases.push({ name:"public.pagination.title-order",passed,status:200,durationMs:0,...(passed?{}:{diff:`sort=title order differs from title(locale=vi),id: ${JSON.stringify(actualIds)}`}) });
}
await check("public.detail", 200, () => http("/api/v1/vi/contents/EVENT/chien-dich-dien-bien-phu"), ["data.id","data.title","data.body","data.sources","data.alternate","data.reviewedBy","data.publishedAt"]);
await check("public.search", 200, () => http("/api/v1/vi/search?q=dien%20bien%20phu"), ["data","meta.total"]);
await check("public.taxonomies", 200, () => http("/api/v1/vi/taxonomies"), ["data.periods","data.tags","data.types"]);
await check("public.alternate", 200, () => http("/api/v1/contents/event-dien-bien-phu/alternate?locale=vi"), ["data.id","data.current","data.alternate"]);
await check("error.400.invalid-query", 400, () => http("/api/v1/vi/search?q="), ["code","message","requestId"]);
await check("error.404.not-found", 404, () => http("/api/v1/vi/contents/EVENT/not-a-real-slug"), ["code","message","requestId"]);
await check("error.404.unknown-locale", 404, () => http("/api/v1/fr/home"), ["code","message","requestId"]);
await check("error.404.unknown-type", 404, () => http("/api/v1/vi/contents/UNKNOWN/not-a-real-slug"), ["code","message","requestId"]);
await check("error.401.no-session", 401, () => http("/api/v1/auth/me"), ["code","message","requestId"]);

const protectedOperations = Object.entries(openApi.paths ?? {}).flatMap(([path,item]) => Object.entries(item).filter(([method,operation]) => ["get","post","put","patch","delete"].includes(method) && Array.isArray(operation["x-allowed-roles"])).map(([method,operation]) => ({ method,path,roles:operation["x-allowed-roles"] })));
const materializePath = (path) => path.replaceAll("{locale}","vi").replaceAll("{type}","EVENT").replaceAll("{slug}","not-a-real-slug").replaceAll("{id}","not-a-real-id");
for (const operation of protectedOperations) {
  await check(`rbac.unauthenticated.${operation.method}.${operation.path}`,401,() => http(materializePath(operation.path),{
    method:operation.method.toUpperCase(),...(["post","put","patch","delete"].includes(operation.method)?{body:{}}:{}),
  }),["code","requestId"]);
}
for (let attempt = 1; attempt <= 5; attempt += 1) {
  await check(`auth.rate-limit.failure-${attempt}`, 401, () => http("/api/v1/auth/login", { method:"POST",body:{ email:rateEmail,password:"Wrong-Password-2026!" } }), ["code","requestId"]);
}
await check("error.429.rate-limit", 429, () => http("/api/v1/auth/login", { method:"POST",body:{ email:rateEmail,password:"Wrong-Password-2026!" } }), ["code","requestId"]);

const adminCookie = await login("ADMIN");
const editorCookie = await login("EDITOR");
const reviewerCookie = await login("REVIEWER");
const roleCookies = { ADMIN:adminCookie,EDITOR:editorCookie,REVIEWER:reviewerCookie };
const materializeAllowedPath = (path) => {
  let value = path.replaceAll("{locale}","vi").replaceAll("{type}","EVENT").replaceAll("{slug}","chien-dich-dien-bien-phu");
  const id = value.includes("/admin/contents/") ? roleProbeIds.content
    : value.includes("/admin/sources/") ? roleProbeIds.source
    : value.includes("/admin/media/") ? roleProbeIds.media
    : value.includes("/admin/users/") ? roleProbeIds.user
    : roleProbeIds.content;
  return value.replaceAll("{id}",id);
};
for (const operation of protectedOperations.filter((candidate) => candidate.path !== "/api/v1/auth/logout")) {
  for (const [role,cookie] of Object.entries(roleCookies)) {
    const options = {method:operation.method.toUpperCase(),cookie,...(["post","put","patch","delete"].includes(operation.method)?{body:{}}:{})};
    const name = `${operation.method}.${operation.path}.${role.toLowerCase()}`;
    if (operation.roles.includes(role)) await check(`rbac.allowed.${name}`,operation.method === "get" ? 200 : 400,() => http(materializeAllowedPath(operation.path),options));
    else await check(`rbac.denied.${name}`,403,() => http(materializePath(operation.path),options),["code","requestId"]);
  }
}
if (adminCookie) await check("auth.me", 200, () => http("/api/v1/auth/me", { cookie:adminCookie }), ["data.id","data.role"]);
await check("error.403.editor-users", 403, () => http("/api/v1/admin/users", { cookie:editorCookie }), ["code","requestId"]);
await check("error.403.reviewer-users", 403, () => http("/api/v1/admin/users", { cookie:reviewerCookie }), ["code","requestId"]);
await check("error.403.editor-user-create", 403, () => http("/api/v1/admin/users", { method:"POST",cookie:editorCookie,body:{} }), ["code","requestId"]);
await check("error.403.reviewer-user-create", 403, () => http("/api/v1/admin/users", { method:"POST",cookie:reviewerCookie,body:{} }), ["code","requestId"]);
await check("error.403.editor-audit", 403, () => http("/api/v1/admin/audit-logs", { cookie:editorCookie }), ["code","requestId"]);
await check("error.403.reviewer-audit", 403, () => http("/api/v1/admin/audit-logs", { cookie:reviewerCookie }), ["code","requestId"]);
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

const testUserEmail = `contract-${runId}@example.test`;
const testUser = await check("admin.user.create", 201, () => http("/api/v1/admin/users", { method:"POST",cookie:adminCookie,body:{ email:testUserEmail,displayName:`Contract ${runId}`,role:"EDITOR",temporaryPassword,active:true } }), ["data.id","data.active","data.version"]);
userId = testUser?.body.data.id ?? null;
const testUserCookie = userId ? await loginWithCredentials("test-user",{email:testUserEmail,password:temporaryPassword}) : null;
if (testUserCookie) await check("auth.logout.test-user",200,() => http("/api/v1/auth/logout",{method:"POST",cookie:testUserCookie}),["data.loggedOut"]);
if (userId) await check("admin.user.patch", 200, () => http(`/api/v1/admin/users/${userId}`, { method:"PATCH",cookie:adminCookie,body:{ version:1,displayName:`Contract cleaned ${runId}`,active:false,resetPassword } }), ["data.id","data.version","data.active"]);
if (userId) {
  await check("error.403.editor-user-patch",403,() => http(`/api/v1/admin/users/${userId}`,{ method:"PATCH",cookie:editorCookie,body:{version:2,active:true} }),["code","requestId"]);
  await check("error.403.reviewer-user-patch",403,() => http(`/api/v1/admin/users/${userId}`,{ method:"PATCH",cookie:reviewerCookie,body:{version:2,active:true} }),["code","requestId"]);
}

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
  await check("workflow.editor-reject-forbidden", 403, () => http(`/api/v1/admin/contents/${contentId}/reject`, { method:"POST",cookie:editorCookie,body:{ version:3,locales:["vi","en"],reason:"Must be forbidden" } }), ["code","requestId"]);
  await check("workflow.editor-archive-forbidden", 403, () => http(`/api/v1/admin/contents/${contentId}/archive`, { method:"POST",cookie:editorCookie,body:{ version:3 } }), ["code","requestId"]);
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

const mutatedOpenApi = structuredClone(openApi);
delete mutatedOpenApi.components.schemas.SourceInput.properties.author;
const mutationDrift = contractShapeDrift(contractMarkdown,mutatedOpenApi);
const mutationDiff = mutationDrift.find((difference) => difference.includes("SourceInput") || difference.includes("admin/sources"));
cases.push({ name:"diagnostic.intentional-openapi-mutation",passed:Boolean(mutationDiff),status:null,durationMs:0,...(mutationDiff?{sampleDiff:mutationDiff}:{diff:"deep shape audit missed an intentionally removed optional request field"}) });

for (const role of Object.keys(credentials)) {
  const logoutCookie = await loginWithCredentials(`${role.toLowerCase()}-logout-probe`,credentials[role]);
  if (logoutCookie) await check(`rbac.allowed.post./api/v1/auth/logout.${role.toLowerCase()}`,200,() => http("/api/v1/auth/logout",{method:"POST",cookie:logoutCookie}),["data.loggedOut"]);
}

} catch (error) {
  cases.push({ name:"suite.unhandled",passed:false,status:null,durationMs:0,diff:error instanceof Error?error.message:String(error) });
} finally {
if (identityBound) {
  const cleanupStarted = performance.now();
  let database = null;
  try {
    database = new Database(dedicatedDatabasePath(cleanupDatabasePath));
    database.pragma("foreign_keys=ON");
    const contentIds = database.prepare("SELECT DISTINCT node_id AS id FROM content_translations WHERE slug IN (?,?)").all(`contract-live-${runId}`,`contract-en-${runId}`).map((row) => row.id);
    const sourceIds = database.prepare("SELECT id FROM sources WHERE url=?").all(`https://example.test/source/${runId}`).map((row) => row.id);
    const mediaIds = database.prepare("SELECT id FROM media WHERE url=?").all(`https://example.test/media/${runId}.jpg`).map((row) => row.id);
    const fixtureIds = Object.values(authFixtures).map((fixture) => fixture.id);
    const userIds = database.prepare(`SELECT id FROM users WHERE email=? OR id IN (${fixtureIds.map(() => "?").join(",")})`).all(`contract-${runId}@example.test`,...fixtureIds).map((row) => row.id);
    const objectIds = new Set([...contentIds,...sourceIds,...mediaIds,...userIds]);
    const audits = database.prepare("SELECT id,action,object_id,metadata FROM audit_logs ORDER BY id").all();
    const ownedAuditIds = [];
    const unownedAudits = [];
    for (const audit of audits) {
      const metadata = JSON.parse(audit.metadata);
      const owned = objectIds.has(audit.object_id)
        || (audit.action === "auth.login_failed" && metadata.email === rateEmail);
      (owned ? ownedAuditIds : unownedAudits).push(audit.id);
    }
    const deleteIds = (table,ids) => {
      if (ids.length) database.prepare(`DELETE FROM ${table} WHERE id IN (${ids.map(() => "?").join(",")})`).run(...ids);
    };
    database.transaction(() => {
      deleteIds("audit_logs",ownedAuditIds);
      database.prepare("DELETE FROM login_rate_limits WHERE bucket=?").run(`email:${rateEmail}`);
      deleteIds("content_nodes",contentIds);
      deleteIds("users",userIds);
      deleteIds("sources",sourceIds);
      deleteIds("media",mediaIds);
    }).immediate();
    const leftovers = [
      database.prepare("SELECT 1 FROM content_translations WHERE slug IN (?,?) LIMIT 1").get(`contract-live-${runId}`,`contract-en-${runId}`),
      database.prepare("SELECT 1 FROM users WHERE email=? LIMIT 1").get(`contract-${runId}@example.test`),
      database.prepare("SELECT 1 FROM sources WHERE url=? LIMIT 1").get(`https://example.test/source/${runId}`),
      database.prepare("SELECT 1 FROM media WHERE url=? LIMIT 1").get(`https://example.test/media/${runId}.jpg`),
      database.prepare("SELECT 1 FROM login_rate_limits WHERE bucket=? LIMIT 1").get(`email:${rateEmail}`),
    ].filter(Boolean);
    if (leftovers.length) throw new Error(`${leftovers.length} exact run-owned row groups remain`);
    const counts = databaseCounts(database);
    const finalDigest = databaseDigest(database);
    if (unownedAudits.length) throw new Error(`refused to delete ${unownedAudits.length} audit row(s) not attributable to run ${runId}`);
    if (finalDigest !== baselineDigest) throw new Error(`database digest did not return to baseline: ${finalDigest}`);
    cleanupState = `verified exact run-owned teardown and baseline sha256=${finalDigest}: ${Object.entries(counts).map(([name,count]) => `${name}=${count}`).join(", ")}`;
    cases.push({ name:"cleanup.database",passed:true,status:null,durationMs:Math.round(performance.now()-cleanupStarted) });
  } catch (error) {
    cleanupState = "failed";
    cases.push({ name:"cleanup.database",passed:false,status:null,durationMs:Math.round(performance.now()-cleanupStarted),diff:error instanceof Error?error.message:String(error) });
  } finally {
    database?.close();
  }
} else {
  cleanupState = "not run because database identity was not established; no HTTP mutation phase entered";
  cases.push({ name:"cleanup.database",passed:false,status:null,durationMs:0,diff:cleanupState });
}

if (missingOperations.length) cases.push({ name:"openapi.planning-coverage",passed:false,status:200,durationMs:0,diff:`missing operations: ${missingOperations.join(", ")}` });
else cases.push({ name:"openapi.planning-coverage",passed:true,status:200,durationMs:0 });
if (extraOperations.length) cases.push({ name:"openapi.no-extra-operations",passed:false,status:200,durationMs:0,diff:`runtime-only operations: ${extraOperations.join(", ")}` });
else cases.push({ name:"openapi.no-extra-operations",passed:true,status:200,durationMs:0 });
if (shapeDrift.length) cases.push({ name:"openapi.request-response-shapes",passed:false,status:200,durationMs:0,diff:shapeDrift.join("; ") });
else cases.push({ name:"openapi.request-response-shapes",passed:true,status:200,durationMs:0 });

if (lockHandle) await lockHandle.close();
if (lockPath) await unlink(lockPath).catch(() => {});
lockHandle = null;
lockPath = null;

const leakedArtifactSecret = sensitiveValues.find((secret) => secret && JSON.stringify(cases).includes(secret));
if (leakedArtifactSecret) cases.push({ name:"report.no-secrets",passed:false,status:null,durationMs:0,diff:"a credential or cookie reached the report model" });
else cases.push({ name:"report.no-secrets",passed:true,status:null,durationMs:0 });

const passed = cases.filter((item) => item.passed).length;
const failed = cases.length - passed;
const report = {
  schemaVersion:2,runId,generatedAt:new Date().toISOString(),baseUrl,
  planning:{operationCount:planned.length,operations:planned},runtime:{operationCount:runtime.length,operations:runtime},
  liveUrls:[`${baseUrl}/healthz`,`${baseUrl}/openapi.json`,`${baseUrl}/docs`,`${baseUrl}/sitemap.xml`,`${baseUrl}/robots.txt`,`${baseUrl}/api/v1/vi/home`],
  drift:{missingOperations,extraOperations,shapeDrift},summary:{total:cases.length,passed,failed,responseSchemasValidated:validatedResponseCount,protectedOperations:cases.filter((item) => item.name.startsWith("rbac.unauthenticated.")).length,allowedRoleProbes:cases.filter((item) => item.name.startsWith("rbac.allowed.")).length,deniedRoleProbes:cases.filter((item) => item.name.startsWith("rbac.denied.")).length},
  cleanup:{identity:identityState,baselineCounts,database:cleanupState},
  cases,
};

function escapeMarkdown(value) {
  return String(value ?? "").replaceAll("\\","\\\\").replaceAll("|","\\|").replaceAll("\r"," ").replaceAll("\n","<br>");
}

function markdown(value) {
  const rows = value.cases.map((item) => `| ${item.passed ? "PASS" : "FAIL"} | ${escapeMarkdown(item.name)} | ${item.status ?? "—"} | ${escapeMarkdown(item.diff ?? item.sampleDiff ?? "")} |`).join("\n");
  const urls = value.liveUrls.map((url) => `  - ${url}`).join("\n");
  return `# Contract report\n\n- Run: ${value.runId}\n- Generated: ${value.generatedAt}\n- Base URL: ${value.baseUrl}\n- Planning operations: ${value.planning.operationCount}\n- Runtime operations: ${value.runtime.operationCount}\n- Cases: ${value.summary.passed}/${value.summary.total} passed\n- Live response schemas validated: ${value.summary.responseSchemasValidated}\n- Protected operations probed without a session: ${value.summary.protectedOperations}\n- Allowed-role probes: ${value.summary.allowedRoleProbes}\n- Denied-role probes: ${value.summary.deniedRoleProbes}\n- Drift: ${value.drift.missingOperations.length} missing, ${value.drift.extraOperations.length} extra, ${value.drift.shapeDrift.length} shape\n- Identity: ${value.cleanup.identity}\n- Cleanup: ${value.cleanup.database}\n- Live URLs:\n${urls}\n\n| Result | Case | HTTP | Diff |\n|---|---|---:|---|\n${rows}\n`;
}

await mkdir(reportDirectory,{recursive:true});
const jsonPath = resolve(reportDirectory,"latest.json");
const markdownPath = resolve(reportDirectory,"latest.md");
const jsonTemporary = resolve(reportDirectory,`.latest-${runId}.json.tmp`);
const markdownTemporary = resolve(reportDirectory,`.latest-${runId}.md.tmp`);
await writeFile(jsonTemporary,`${JSON.stringify(report,null,2)}\n`,"utf8");
await writeFile(markdownTemporary,markdown(report),"utf8");
await rename(jsonTemporary,jsonPath);
await rename(markdownTemporary,markdownPath);
console.log(JSON.stringify({ report:jsonPath,markdown:markdownPath,operations:`${runtime.length}/${planned.length}`,cases:`${passed}/${cases.length}`,failed }));
if (failed) process.exitCode = 1;
}
