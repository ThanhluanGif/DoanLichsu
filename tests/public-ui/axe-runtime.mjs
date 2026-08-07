#!/usr/bin/env node
import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import axe from "axe-core";

const baseUrl=new URL(process.argv[2]??"http://127.0.0.1:3006").origin;
const reportDirectory=resolve(process.argv[3]??"artifacts/public-ui");
const pages=[
  {name:"home-vi",path:"/vi"},
  {name:"home-en",path:"/en"},
  {name:"search",path:"/vi/tim-kiem?q=dien+Bien+phu&type=EVENT"},
  {name:"detail-vi",path:"/vi/su-kien/chien-dich-dien-bien-phu"},
  {name:"detail-en",path:"/en/events/battle-of-dien-bien-phu"},
];

const report={generatedAt:new Date().toISOString(),baseUrl,pages:[],limitations:["JSDOM has no layout engine, so color-contrast is excluded; keyboard, responsive layout, and focus order still require a real browser."]};
for(const page of pages){
  const url=new URL(page.path,baseUrl).toString();
  const response=await fetch(url,{headers:{accept:"text/html"}});
  if(!response.ok)throw new Error(`${page.name} returned ${response.status}`);
  const html=await response.text();
  const dom=new JSDOM(html,{url,runScripts:"outside-only"});
  const streamedTitle=/<title>([^<]+)<\/title>/.exec(html)?.[1];
  const roots=[...dom.window.document.querySelectorAll(".public-site")];
  const publicRoot=roots.at(-1);
  if(!publicRoot)throw new Error(`${page.name} has no rendered .public-site root`);
  dom.window.document.body.replaceChildren(publicRoot);
  if(streamedTitle)dom.window.document.title=streamedTitle;
  dom.window.eval(axe.source);
  const result=await dom.window.axe.run(dom.window.document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]},rules:{"color-contrast":{enabled:false}}});
  const blocking=result.violations.filter(({impact})=>impact==="critical"||impact==="serious");
  const metadata=[
    ...[...html.matchAll(/<title>[^<]+<\/title>/gi)].map((match)=>match[0]),
    ...[...html.matchAll(/<link[^>]+rel="(?:canonical|alternate)"[^>]*>/gi)].map((match)=>match[0]),
    ...[...html.matchAll(/<meta[^>]+(?:name="description"|property="og:[^"]+")[^>]*>/gi)].map((match)=>match[0]),
  ];
  report.pages.push({name:page.name,url,httpStatus:response.status,htmlBytes:Buffer.byteLength(html),metadata,hasJsonLd:html.includes('type="application/ld+json"'),passes:result.passes.length,incomplete:result.incomplete.length,violations:result.violations.map(({id,impact,help,nodes})=>({id,impact,help,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))})),blocking:blocking.length});
}
await mkdir(reportDirectory,{recursive:true});
await writeFile(resolve(reportDirectory,"axe-runtime.json"),`${JSON.stringify(report,null,2)}\n`);
const markdown=["# Public UI runtime proof","",`- Generated: ${report.generatedAt}`,`- Base URL: ${baseUrl}`,`- Limitation: ${report.limitations[0]}`,"","| Page | HTTP | HTML bytes | Axe Critical/Serious | JSON-LD |","|---|---:|---:|---:|---|",...report.pages.map((page)=>`| ${page.name} | ${page.httpStatus} | ${page.htmlBytes} | ${page.blocking} | ${page.hasJsonLd?"yes":"no"} |`),"",...report.pages.flatMap((page)=>[`## ${page.name}`,"",`- URL: ${page.url}`,"","```html",...page.metadata,"```",""])].join("\n");
await writeFile(resolve(reportDirectory,"runtime-proof.md"),`${markdown}\n`);
const failures=report.pages.reduce((total,page)=>total+page.blocking,0);
process.stdout.write(`${JSON.stringify({report:resolve(reportDirectory,"axe-runtime.json"),pages:report.pages.length,criticalOrSerious:failures})}\n`);
if(failures)process.exitCode=1;
