import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect,test } from "@playwright/test";
import { login } from "./support";

const axePath=resolve("node_modules/axe-core/axe.min.js");
async function scan(page:import("@playwright/test").Page,name:string){
  await page.addScriptTag({path:axePath});
  const violations=await page.evaluate(async()=>{
    const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null;help:string;nodes:Array<{target:string[];html:string;failureSummary:string}>}>}>}}).axe;
    const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return result.violations.map(({id,impact,help,nodes})=>({id,impact,help,nodes:nodes.map(({target,html,failureSummary})=>({target,html,failureSummary}))}));
  });
  return {name,violations,blocking:violations.filter(({impact})=>impact==="critical"||impact==="serious")};
}

test("release surfaces have no Critical or Serious axe findings",async({browser,page})=>{
  const report=[];for(const [name,path] of [["home","/vi"],["search","/vi/tim-kiem?q=dien+bien+phu"],["detail","/vi/su-kien/chien-dich-dien-bien-phu"],["login","/admin/login"]]){await page.goto(path);report.push(await scan(page,name));}
  const editorContext=await browser.newContext();const editor=await editorContext.newPage();await login(editor,"EDITOR");await editor.goto("/admin/contents");report.push(await scan(editor,"admin-list"));await editorContext.close();
  const reviewerContext=await browser.newContext();const reviewer=await reviewerContext.newPage();await login(reviewer,"REVIEWER");await reviewer.goto("/admin/review");report.push(await scan(reviewer,"review-queue"));await reviewerContext.close();
  await mkdir("artifacts/release",{recursive:true});await writeFile("artifacts/release/accessibility.json",`${JSON.stringify({generatedAt:new Date().toISOString(),pages:report},null,2)}\n`);
  expect(report.flatMap(({blocking})=>blocking)).toEqual([]);
});
