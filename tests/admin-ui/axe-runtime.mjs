#!/usr/bin/env node
import { readFile,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import axe from "axe-core";

const directory=resolve(process.argv[2]??"artifacts/admin-ui");
const pages=["login","list","editor","review"];
const report={generatedAt:new Date().toISOString(),source:"hydrated browser DOM",pages:[]};
for(const name of pages){
  const html=await readFile(resolve(directory,`dom-${name}.html`),"utf8");const dom=new JSDOM(html,{url:`http://127.0.0.1:3001/admin/${name}`,runScripts:"outside-only"});dom.window.eval(axe.source);
  const result=await dom.window.axe.run(dom.window.document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]},rules:{"color-contrast":{enabled:false}}});
  const blocking=result.violations.filter(({impact})=>impact==="critical"||impact==="serious");report.pages.push({name,blocking:blocking.length,violations:result.violations.map(({id,impact,help})=>({id,impact,help}))});
}
await writeFile(resolve(directory,"axe-runtime.json"),`${JSON.stringify(report,null,2)}\n`);
const failures=report.pages.reduce((total,page)=>total+page.blocking,0);process.stdout.write(`${JSON.stringify({pages:pages.length,criticalOrSerious:failures})}\n`);if(failures)process.exitCode=1;
