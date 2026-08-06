#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

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
const cleanupDatabasePath = argument("--cleanup-database", process.env.CONTRACT_DATABASE_PATH);
const runId = randomUUID().slice(0, 8);
const origin = new URL(baseUrl).origin;
const runStartedAt = new Date().toISOString();
const isLocalTarget = ["127.0.0.1","localhost","::1"].includes(new URL(baseUrl).hostname);
if (!isLocalTarget && ["CONTRACT_ADMIN_PASSWORD","CONTRACT_EDITOR_PASSWORD","CONTRACT_REVIEWER_PASSWORD"].some((name)=>!process.env[name])) {
  throw new Error("Remote contract checks require injected CONTRACT_ADMIN_PASSWORD, CONTRACT_EDITOR_PASSWORD and CONTRACT_REVIEWER_PASSWORD.");
}
const credentials = {
  ADMIN: { email:"admin@quansuviet.local", password:process.env.CONTRACT_ADMIN_PASSWORD ?? "Admin-Demo-2026!" },
  EDITOR: { email:"editor@quansuviet.local", password:process.env.CONTRACT_EDITOR_PASSWORD ?? "Editor-Demo-2026!" },
  REVIEWER: { email:"reviewer@quansuviet.local", password:process.env.CONTRACT_REVIEWER_PASSWORD ?? "Reviewer-Demo-2026!" },
};
const cases = [];
const requestTimeoutMs = 10_000;
const ajv = new Ajv2020({ allErrors:true,strict:false });
addFormats(ajv);
const responseValidators = new Map();
let liveOpenApi = null;
let validatedResponseCount = 0;

function planningOperations(markdown) {
  const operations = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^\|\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\|\s*`([^`]+)`/.exec(line);
    if (match) operations.push(`${match[1].toLowerCase()} ${match[2]}`);
  }
  return [...new Set(operations)].sort();
}

function planningRows(markdown) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const match = /^\|\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\|\s*`([^`]+)`/.exec(line);
    if (!match) return [];
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    return [{ method:match[1].toLowerCase(),path:match[2],input:cells[3] ?? "",output:cells[4] ?? "" }];
  });
}

function interfaceContracts(markdown) {
  const contracts = new Map();
  const pattern = /interface\s+(\w+)(?:\s+extends\s+([^\{]+))?\s*\{/g;
  let match;
  while ((match = pattern.exec(markdown))) {
    let depth = 1;
    let cursor = pattern.lastIndex;
    while (cursor < markdown.length && depth > 0) {
      if (markdown[cursor] === "{") depth += 1;
      if (markdown[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    const body = markdown.slice(pattern.lastIndex, cursor - 1);
    const segments = [];
    let segment = "";
    let nested = 0;
    for (const character of body) {
      if ("{[(<".includes(character)) nested += 1;
      if ("}])>".includes(character)) nested = Math.max(0, nested - 1);
      if (character === ";" && nested === 0) { segments.push(segment); segment = ""; }
      else segment += character;
    }
    if (segment.trim()) segments.push(segment);
    const properties = segments.flatMap((entry) => {
      const property = /^\s*(\w+)(\?)?\s*:\s*([\s\S]+)$/.exec(entry);
      return property ? [{ name:property[1],required:!property[2],contractType:property[3].trim() }] : [];
    });
    const rawExtends = match[2]?.trim() ?? "";
    const parents = rawExtends && !rawExtends.includes("<") ? rawExtends.split(",").map((value)=>value.trim()).filter(Boolean) : [];
    contracts.set(match[1], { name:match[1],parents,properties });
    pattern.lastIndex = cursor;
  }
  return contracts;
}

function interfaceProperties(name, contracts, seen = new Set()) {
  if (seen.has(name) || !contracts.has(name)) return [];
  seen.add(name);
  const contract = contracts.get(name);
  const inherited = contract.parents.flatMap((parent) => interfaceProperties(parent, contracts, seen));
  return [...new Map([...inherited, ...contract.properties].map((property)=>[property.name, property])).values()];
}

function referencedInterface(cell, names) {
  return [...names].sort((left,right)=>right.length-left.length).find((name)=>new RegExp(`\\b${name}\\b`).test(cell)) ?? null;
}

function successSchema(operation) {
  const status = Object.keys(operation.responses ?? {}).filter((value)=>/^2\d\d$/.test(value)).sort()[0];
  return status ? operation.responses[status]?.content?.["application/json"]?.schema : null;
}

function responseShape(schema) {
  if (!schema) return null;
  if (schema.$ref) return { kind:"single",name:schema.$ref.split("/").at(-1) };
  const data = schema.properties?.data;
  if (data?.$ref) return { kind:"data",name:data.$ref.split("/").at(-1) };
  if (data?.type === "array" && data.items?.$ref) return { kind:"list",name:data.items.$ref.split("/").at(-1) };
  return null;
}

function expectedPropertyShape(contractType, interfaceNames) {
  if (/\[\]\s*(?:\||$)|\bArray\s*</.test(contractType)) return { category:"array" };
  if (/\bRecord\s*<|^\{/.test(contractType)) return { category:"object" };
  const reference = [...interfaceNames].find((name)=>new RegExp(`\\b${name}\\b`).test(contractType));
  if (reference) return { category:`ref:${reference}` };
  const literals = [...contractType.matchAll(/"([^"]+)"/g)].map((match)=>match[1]);
  if (literals.length) return { category:"string",enum:literals.sort() };
  if (/\bboolean\b/.test(contractType)) return { category:"boolean" };
  if (/\bnumber\b/.test(contractType)) return { category:"number" };
  if (/\bstring\b/.test(contractType)) return { category:"string" };
  return null;
}

function actualPropertyShape(schema) {
  if (!schema) return null;
  if (schema.$ref) return { category:`ref:${schema.$ref.split("/").at(-1)}` };
  if (schema.anyOf) {
    const concrete = schema.anyOf.find((item)=>item.type !== "null");
    return actualPropertyShape(concrete);
  }
  return { category:schema.type ?? "unknown",...(schema.enum ? { enum:[...schema.enum].sort() } : schema.const !== undefined ? { enum:[schema.const] } : {}) };
}

function contractShapeDrift(markdown, document) {
  const rows = planningRows(markdown);
  const interfaces = interfaceContracts(markdown);
  const names = new Set(interfaces.keys());
  const drift = [];
  for (const row of rows) {
    const operation = document.paths?.[row.path]?.[row.method];
    if (!operation) continue;
    const pathNames = [...row.path.matchAll(/\{(\w+)\}/g)].map((match)=>match[1]);
    const actualPathNames = new Set((operation.parameters ?? []).filter((parameter)=>parameter.in === "path").map((parameter)=>parameter.name));
    for (const name of pathNames) if (!actualPathNames.has(name)) drift.push(`${row.method} ${row.path}: missing OpenAPI path parameter ${name}`);

    const inputShape = referencedInterface(row.input, names);
    if (["post","put","patch","delete"].includes(row.method) && inputShape) {
      const actual = operation.requestBody?.content?.["application/json"]?.schema?.$ref?.split("/").at(-1);
      if (actual !== inputShape) drift.push(`${row.method} ${row.path}: request ${inputShape}, OpenAPI ${actual ?? "none"}`);
    }
    if (["get","head"].includes(row.method) && inputShape) {
      const expected = interfaceProperties(inputShape, interfaces).map((property)=>property.name);
      const actual = new Set((operation.parameters ?? []).filter((parameter)=>parameter.in === "query").map((parameter)=>parameter.name));
      for (const name of expected) if (!actual.has(name)) drift.push(`${row.method} ${row.path}: ${inputShape} query field ${name} absent from OpenAPI`);
    }

    const generic = /(DataResponse|ListResponse)<\s*(\w+)/.exec(row.output);
    const direct = generic || /(?:DataResponse|ListResponse)</.test(row.output) ? null : referencedInterface(row.output, names);
    const expected = generic ? { kind:generic[1] === "DataResponse" ? "data" : "list",name:generic[2] } : direct ? { kind:"single",name:direct } : null;
    const actual = responseShape(successSchema(operation));
    if (expected && (!actual || expected.kind !== actual.kind || expected.name !== actual.name)) {
      drift.push(`${row.method} ${row.path}: response ${expected.kind}<${expected.name}>, OpenAPI ${actual ? `${actual.kind}<${actual.name}>` : "untyped"}`);
    }
  }

  for (const [name, schema] of Object.entries(document.components?.schemas ?? {})) {
    if (!interfaces.has(name)) continue;
    const expectedRequired = interfaceProperties(name, interfaces).filter((property)=>property.required).map((property)=>property.name).sort();
    const actualRequired = [...(schema.required ?? [])].sort();
    const missing = expectedRequired.filter((property)=>!actualRequired.includes(property));
    const extra = actualRequired.filter((property)=>!expectedRequired.includes(property));
    if (missing.length || extra.length) drift.push(`schema ${name}: required mismatch missing=[${missing.join(",")}] extra=[${extra.join(",")}]`);
    if (schema.type === "object" && schema.additionalProperties !== false) drift.push(`schema ${name}: additionalProperties must be false for an interface shape`);
    for (const property of interfaceProperties(name, interfaces)) {
      const expected = expectedPropertyShape(property.contractType, names);
      const actual = actualPropertyShape(schema.properties?.[property.name]);
      if (!expected || !actual) continue;
      const categoryMatches = expected.category === "number" ? ["number","integer"].includes(actual.category) : expected.category === actual.category;
      const enumMatches = !expected.enum || JSON.stringify(expected.enum) === JSON.stringify(actual.enum ?? []);
      if (!categoryMatches || !enumMatches) drift.push(`schema ${name}.${property.name}: contract ${expected.category}${expected.enum?` enum=${expected.enum.join(",")}`:""}, OpenAPI ${actual.category}${actual.enum?` enum=${actual.enum.join(",")}`:""}`);
    }
  }
  return drift;
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
  const wildcard = Object.entries(content).find(([mediaType]) => mediaType.endsWith("/*") && normalized.startsWith(mediaType.slice(0, -1)));
  return wildcard ? { mediaType:wildcard[0],schema:wildcard[1].schema } : null;
}

function validateLiveResponse(result) {
  if (!liveOpenApi) return;
  const template = matchingPathTemplate(result.path, liveOpenApi);
  const operation = template ? liveOpenApi.paths?.[template]?.[result.method.toLowerCase()] : null;
  if (!operation) throw new Error(`OpenAPI has no ${result.method} operation matching ${result.path}`);
  const declared = operation.responses?.[String(result.response.status)] ?? operation.responses?.default;
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
  try {
    const result = await action();
    validateLiveResponse(result);
    if (result.response.status !== expectedStatus) {
      throw new Error(`expected HTTP ${expectedStatus}, received ${result.response.status}: ${result.text.slice(0, 300)}`);
    }
    if (requiredPaths.length) assertShape(result.body, requiredPaths);
    if (typeof result.body === "object") {
      if (name !== "plumbing.openapi") assertNoSecrets(result.body);
      if (name !== "plumbing.openapi") assertIsoTimestamps(result.body);
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
liveOpenApi = openApiResult ? openApi : null;
const runtime = runtimeOperations(openApi);
const missingOperations = planned.filter((operation) => !runtime.includes(operation));
const extraOperations = runtime.filter((operation) => !planned.includes(operation));
const shapeDrift = contractShapeDrift(contractMarkdown, openApi);

await check("plumbing.health", 200, () => http("/healthz"), ["status","version","database","timestamp"]);
await check("plumbing.docs", 200, () => http("/docs"));
const sitemapResult = await check("plumbing.sitemap", 200, () => http("/sitemap.xml"));
if (sitemapResult) {
  const locations = [...sitemapResult.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
  let linked = 0;
  for (const [index, location] of locations.entries()) {
    const result = await check(`plumbing.sitemap-link.${index + 1}`, 200, () => http(location));
    if (result) linked += 1;
  }
  const passed = locations.length > 2 && linked === locations.length;
  cases.push({ name:"plumbing.sitemap-live-links",passed,status:passed?200:null,durationMs:0,...(passed?{}:{diff:`${linked}/${locations.length} sitemap locations returned schema-valid HTTP 200`}) });
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

let cleanupState = "not-run";
if (!cleanupDatabasePath) {
  cases.push({ name:"cleanup.database",passed:false,status:null,durationMs:0,diff:"set --cleanup-database or CONTRACT_DATABASE_PATH to a dedicated local test database" });
} else if (!isLocalTarget) {
  cases.push({ name:"cleanup.database",passed:false,status:null,durationMs:0,diff:"direct database cleanup is allowed only for a local dedicated target" });
} else {
  const cleanupStarted = performance.now();
  try {
    const { default:Database } = await import("better-sqlite3");
    const database = new Database(resolve(cleanupDatabasePath));
    database.pragma("foreign_keys=ON");
    database.transaction(() => {
      database.prepare(`DELETE FROM audit_logs WHERE created_at >= ? OR id IN (
        SELECT id FROM audit_logs
        WHERE action='auth.login_failed' AND json_extract(metadata,'$.email') LIKE 'contract-rate-%@example.test'
      ) OR object_id IN (
        SELECT node_id FROM content_translations WHERE slug LIKE 'contract-live-%' OR slug LIKE 'contract-en-%'
        UNION SELECT id FROM users WHERE email LIKE 'contract-%@example.test'
        UNION SELECT id FROM sources WHERE url LIKE 'https://example.test/source/%'
        UNION SELECT id FROM media WHERE url LIKE 'https://example.test/media/%'
      )`).run(runStartedAt);
      database.prepare("DELETE FROM login_rate_limits WHERE bucket LIKE 'email:contract-rate-%@example.test'").run();
      database.prepare("DELETE FROM content_nodes WHERE id IN (SELECT node_id FROM content_translations WHERE slug LIKE 'contract-live-%' OR slug LIKE 'contract-en-%')").run();
      database.prepare("DELETE FROM users WHERE email LIKE 'contract-%@example.test'").run();
      database.prepare("DELETE FROM sources WHERE url LIKE 'https://example.test/source/%'").run();
      database.prepare("DELETE FROM media WHERE url LIKE 'https://example.test/media/%'").run();
    }).immediate();
    const leftovers = [
      database.prepare("SELECT 1 FROM content_translations WHERE slug LIKE 'contract-live-%' OR slug LIKE 'contract-en-%' LIMIT 1").get(),
      database.prepare("SELECT 1 FROM users WHERE email LIKE 'contract-%@example.test' LIMIT 1").get(),
      database.prepare("SELECT 1 FROM sources WHERE url LIKE 'https://example.test/source/%' LIMIT 1").get(),
      database.prepare("SELECT 1 FROM media WHERE url LIKE 'https://example.test/media/%' LIMIT 1").get(),
      database.prepare("SELECT 1 FROM audit_logs WHERE created_at >= ? LIMIT 1").get(runStartedAt),
      database.prepare("SELECT 1 FROM login_rate_limits WHERE bucket LIKE 'email:contract-rate-%@example.test' LIMIT 1").get(),
    ].filter(Boolean);
    const counts = {
      contentNodes:database.prepare("SELECT count(*) AS count FROM content_nodes").get().count,
      translations:database.prepare("SELECT count(*) AS count FROM content_translations").get().count,
      sources:database.prepare("SELECT count(*) AS count FROM sources").get().count,
      media:database.prepare("SELECT count(*) AS count FROM media").get().count,
      users:database.prepare("SELECT count(*) AS count FROM users").get().count,
      auditLogs:database.prepare("SELECT count(*) AS count FROM audit_logs").get().count,
      rateLimits:database.prepare("SELECT count(*) AS count FROM login_rate_limits").get().count,
    };
    database.close();
    if (leftovers.length) throw new Error(`${leftovers.length} test-owned row groups remain`);
    const expectedCounts = { contentNodes:50,translations:100,sources:50,media:10,users:3,auditLogs:0,rateLimits:0 };
    const countDrift = Object.entries(expectedCounts).filter(([name,count]) => counts[name] !== count).map(([name,count]) => `${name}=${counts[name]} expected ${count}`);
    if (countDrift.length) throw new Error(`database did not return to exact seed state: ${countDrift.join(", ")}`);
    cleanupState = `verified exact seed counts: ${Object.entries(counts).map(([name,count]) => `${name}=${count}`).join(", ")}`;
    cases.push({ name:"cleanup.database",passed:true,status:null,durationMs:Math.round(performance.now()-cleanupStarted) });
  } catch (error) {
    cleanupState = "failed";
    cases.push({ name:"cleanup.database",passed:false,status:null,durationMs:Math.round(performance.now()-cleanupStarted),diff:error instanceof Error?error.message:String(error) });
  }
}

if (missingOperations.length) cases.push({ name:"openapi.planning-coverage",passed:false,status:200,durationMs:0,diff:`missing operations: ${missingOperations.join(", ")}` });
else cases.push({ name:"openapi.planning-coverage",passed:true,status:200,durationMs:0 });
if (extraOperations.length) cases.push({ name:"openapi.no-extra-operations",passed:false,status:200,durationMs:0,diff:`runtime-only operations: ${extraOperations.join(", ")}` });
else cases.push({ name:"openapi.no-extra-operations",passed:true,status:200,durationMs:0 });
if (shapeDrift.length) cases.push({ name:"openapi.request-response-shapes",passed:false,status:200,durationMs:0,diff:shapeDrift.join(" | ") });
else cases.push({ name:"openapi.request-response-shapes",passed:true,status:200,durationMs:0 });

const passed = cases.filter((item) => item.passed).length;
const failed = cases.length - passed;
const report = {
  schemaVersion:1,generatedAt:new Date().toISOString(),baseUrl,
  planning:{operationCount:planned.length,operations:planned},runtime:{operationCount:runtime.length,operations:runtime},
  drift:{missingOperations,extraOperations,shapeDrift},summary:{total:cases.length,passed,failed,responseSchemasValidated:validatedResponseCount},
  cleanup:{preTeardown:{content:contentId ? "archived" : "not-created",testUser:userId ? "disabled" : "not-created"},database:cleanupState},
  cases,
};

function markdown(value) {
  const rows = value.cases.map((item) => `| ${item.passed ? "PASS" : "FAIL"} | ${item.name} | ${item.status ?? "—"} | ${item.diff ?? item.sampleDiff ?? ""} |`).join("\n");
  return `# Contract report\n\n- Generated: ${value.generatedAt}\n- Base URL: ${value.baseUrl}\n- Planning operations: ${value.planning.operationCount}\n- Runtime operations: ${value.runtime.operationCount}\n- Cases: ${value.summary.passed}/${value.summary.total} passed\n- Live response schemas validated: ${value.summary.responseSchemasValidated}\n- Drift: ${value.drift.missingOperations.length} missing, ${value.drift.extraOperations.length} extra, ${value.drift.shapeDrift.length} shape\n- Cleanup: ${value.cleanup.database}\n\n| Result | Case | HTTP | Diff |\n|---|---|---:|---|\n${rows}\n`;
}

await mkdir(reportDirectory, { recursive:true });
await writeFile(resolve(reportDirectory, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(resolve(reportDirectory, "latest.md"), markdown(report), "utf8");
console.log(JSON.stringify({ report:resolve(reportDirectory,"latest.json"),markdown:resolve(reportDirectory,"latest.md"),operations:`${runtime.length}/${planned.length}`,cases:`${passed}/${cases.length}`,failed }));
if (failed) process.exitCode = 1;
