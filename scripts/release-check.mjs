#!/usr/bin/env node

import { createHash,randomBytes } from "node:crypto";
import { execFileSync,spawn,spawnSync } from "node:child_process";
import { copyFile,mkdir,mkdtemp,readFile,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";

const root=resolve(import.meta.dirname,"..");const artifactDirectory=resolve(root,"artifacts/release");await mkdir(artifactDirectory,{recursive:true});
const startedAt=new Date().toISOString();const version=JSON.parse(await readFile(resolve(root,"package.json"),"utf8")).version;
const commit=execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();const steps=[];const captured=[];
const secrets=["E2E_ADMIN_PASSWORD","E2E_EDITOR_PASSWORD","E2E_REVIEWER_PASSWORD","SESSION_SECRET"].map((name)=>process.env[name]).filter(Boolean);
const redact=(value)=>{let result=String(value);for(const secret of secrets)result=result.split(secret).join("[REDACTED]");return result;};
const digest=(value)=>createHash("sha256").update(value).digest("hex");

function run(name,command,args,{env={},unset=[],allowFailure=false}={}){
  const childEnvironment={...process.env,...env};
  // npm exposes package.json's allowScripts field as npm_config_allow_scripts to
  // nested commands. npm ci rejects that project-scoped environment form, even
  // though the same allowlist is valid in package.json.
  delete childEnvironment.npm_config_allow_scripts;
  delete childEnvironment.NPM_CONFIG_ALLOW_SCRIPTS;
  for(const name of unset)delete childEnvironment[name];
  const started=performance.now();const result=spawnSync(command,args,{cwd:root,env:childEnvironment,encoding:"utf8",maxBuffer:32*1024*1024});const output=`${result.stdout||""}\n${result.stderr||""}`;captured.push(output);
  const entry={name,command:[command,...args].join(" "),durationMs:Math.round(performance.now()-started),exitCode:result.status??1,outputSha256:digest(output)};steps.push(entry);
  if(entry.exitCode!==0&&!allowFailure)throw new Error(`${name} failed: ${redact(output.slice(-1600))}`);return {entry,stdout:result.stdout||"",stderr:result.stderr||""};
}

async function waitFor(url,timeoutMs=30_000){const deadline=Date.now()+timeoutMs;let last="";while(Date.now()<deadline){try{const response=await fetch(url);if(response.ok)return response;}catch(error){last=String(error);}await new Promise((resolveWait)=>setTimeout(resolveWait,250));}throw new Error(`Timed out waiting for ${url}: ${last}`);}
async function withServer({databasePath,port},action){
  const origin=`http://127.0.0.1:${port}`;const child=spawn(process.execPath,["server.js"],{cwd:resolve(root,".next/standalone"),env:{...process.env,NODE_ENV:"production",DATABASE_PATH:databasePath,APP_ORIGIN:origin,SESSION_SECRET:randomBytes(32).toString("hex"),HOSTNAME:"127.0.0.1",PORT:String(port)},stdio:["ignore","pipe","pipe"]});
  let output="";child.stdout.on("data",(chunk)=>{output+=chunk;});child.stderr.on("data",(chunk)=>{output+=chunk;});
  try{await waitFor(`${origin}/healthz`);return await action(origin);}finally{child.kill("SIGTERM");await Promise.race([new Promise((resolveExit)=>child.once("exit",resolveExit)),new Promise((resolveWait)=>setTimeout(resolveWait,3000))]);captured.push(output);}
}

let failure=null;let recoveryProof=null;let dependencyAudit=null;let liveProof=null;
try{
  run("clean-install","npm",["ci"]);
  const temporary=await mkdtemp(join(tmpdir(),"quan-su-viet-release-check-"));const databasePath=join(temporary,"release.sqlite");
  run("migrate","npm",["run","db:migrate"],{env:{DATABASE_PATH:databasePath}});run("seed","npm",["run","db:seed"],{env:{DATABASE_PATH:databasePath}});
  run("lint","npm",["run","lint"]);run("typecheck","npm",["run","typecheck"]);run("unit-integration","npm",["test","--","--testTimeout=15000"],{unset:["ALLOW_DEMO_SEED","SEED_ADMIN_PASSWORD","SEED_EDITOR_PASSWORD","SEED_REVIEWER_PASSWORD"]});run("build","npm",["run","build"]);run("standalone-artifact","npm",["run","verify:standalone"]);
  await withServer({databasePath,port:3218},async(origin)=>{run("contract","npm",["run","test:contract","--","--base-url",origin,"--cleanup-database",databasePath,"--report-dir","artifacts/release/contract"],{env:{CONTRACT_DATABASE_PATH:databasePath}});});
  const backup=JSON.parse(run("backup",process.execPath,["scripts/backup.mjs"],{env:{DATABASE_PATH:databasePath,BACKUP_DIR:join(temporary,"backups")}}).stdout.trim());const restoredPath=join(temporary,"restored.sqlite");
  const restore=JSON.parse(run("restore",process.execPath,["scripts/restore.mjs",backup.snapshot],{env:{RESTORE_DATABASE_PATH:restoredPath}}).stdout.trim());
  const restoredHttp=await withServer({databasePath:restoredPath,port:3219},async(origin)=>{const health=await fetch(`${origin}/healthz`);const search=await fetch(`${origin}/api/v1/vi/search?q=dien%20bien%20phu`);return {health:health.status,search:search.status,searchItems:(await search.json()).data?.length??0};});
  recoveryProof={backup:{sha256:backup.sha256,counts:backup.counts},restore,restoredHttp};await copyFile(backup.manifest,resolve(artifactDirectory,"restore-manifest.json"));await writeFile(resolve(artifactDirectory,"restore-proof.json"),`${JSON.stringify(recoveryProof,null,2)}\n`);
  const audit=run("dependency-audit","npm",["audit","--omit=dev","--audit-level=high","--json"],{allowFailure:true});dependencyAudit=JSON.parse(audit.stdout||"{}");await writeFile(resolve(artifactDirectory,"dependency-audit.json"),`${JSON.stringify(dependencyAudit,null,2)}\n`);
  const vulnerabilities=dependencyAudit.metadata?.vulnerabilities??{};if((vulnerabilities.high??0)>0||(vulnerabilities.critical??0)>0||audit.entry.exitCode!==0)throw new Error(`Dependency audit failed: high=${vulnerabilities.high??"unknown"} critical=${vulnerabilities.critical??"unknown"}`);
  const target=process.env.E2E_BASE_URL;if(!target||new URL(target).protocol!=="https:")throw new Error("E2E_BASE_URL must be a deployed HTTPS origin.");
  run("https-e2e","npm",["run","test:e2e"]);
  const endpoints=["/healthz","/openapi.json","/api/v1/vi/search?q=dien%20bien%20phu"];
  liveProof={origin:new URL(target).origin,endpoints:[]};for(const path of endpoints){const before=performance.now();const response=await fetch(new URL(path,target));liveProof.endpoints.push({path,status:response.status,durationMs:Math.round(performance.now()-before)});if(!response.ok)throw new Error(`Live check failed: ${path} -> ${response.status}`);}
  await writeFile(resolve(artifactDirectory,"live-proof.json"),`${JSON.stringify(liveProof,null,2)}\n`);
  const log=captured.join("\n");const exposedSecret=secrets.find((secret)=>log.includes(secret));const sensitivePattern=/(?:set-cookie\s*:|qsv_session=|password_hash|session_secret|authorization\s*:)/i;const sensitiveMatch=log.match(sensitivePattern);
  if(exposedSecret||sensitiveMatch)throw new Error(`Sensitive release log material detected: ${exposedSecret?"configured secret value":sensitiveMatch[0]}`);
}catch(error){failure=error instanceof Error?error.message:String(error);}

const report={startedAt,finishedAt:new Date().toISOString(),version,commit,passed:failure===null,steps,recoveryProof,dependencyAuditSummary:dependencyAudit?.metadata?.vulnerabilities??null,liveProof,logScan:{configuredSecrets:secrets.length,exposed:false,patterns:["set-cookie:","qsv_session=","password_hash","session_secret","authorization:"]},failure:failure?redact(failure):null};
await writeFile(resolve(artifactDirectory,"release-report.json"),`${JSON.stringify(report,null,2)}\n`);
const markdown=["# Release check",`- Result: **${report.passed?"PASS":"FAIL"}**`,`- Version: \`${version}\``,`- Commit: \`${commit}\``,`- Started: ${startedAt}`,`- Finished: ${report.finishedAt}`,"","## Steps","",...steps.map((step)=>`- ${step.exitCode===0?"PASS":"FAIL"} \`${step.command}\` — ${step.durationMs} ms`),"",`- Recovery: ${recoveryProof?`SHA-256 verified; ${recoveryProof.restore.counts.contentNodes} nodes / ${recoveryProof.restore.counts.translations} translations / ${recoveryProof.restore.counts.sources} sources / ${recoveryProof.restore.counts.users} users; restored HTTP health ${recoveryProof.restoredHttp.health}`:"not completed"}`,`- Dependency High/Critical: ${report.dependencyAuditSummary?`${report.dependencyAuditSummary.high}/${report.dependencyAuditSummary.critical}`:"not completed"}`,`- Sensitive log scan: ${report.logScan.exposed?"FAIL":"PASS"}`,failure?`- Failure: ${report.failure}`:"",""].filter((line)=>line!==null);
await writeFile(resolve(artifactDirectory,"release-report.md"),`${markdown.join("\n").trimEnd()}\n`);
if(failure){process.stderr.write(`${report.failure}\n`);process.exit(1);}process.stdout.write(`${JSON.stringify({passed:true,report:resolve(artifactDirectory,"release-report.json"),steps:steps.length})}\n`);
