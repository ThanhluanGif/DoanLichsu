import { mkdir,writeFile } from "node:fs/promises";
import { expect,test } from "@playwright/test";

async function lcp(page:import("@playwright/test").Page,path:string){
  await page.addInitScript(()=>{(globalThis as typeof globalThis&{__releaseLcp?:number}).__releaseLcp=0;new PerformanceObserver((list)=>{for(const entry of list.getEntries())(globalThis as typeof globalThis&{__releaseLcp?:number}).__releaseLcp=Math.max((globalThis as typeof globalThis&{__releaseLcp?:number}).__releaseLcp||0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});});
  await page.goto(path,{waitUntil:"networkidle"});await page.waitForTimeout(500);return page.evaluate(()=>(globalThis as typeof globalThis&{__releaseLcp?:number}).__releaseLcp||0);
}

test("production-like performance budgets stay green",async({page,request})=>{
  const homeLcpMs=await lcp(page,"/vi");const detailLcpMs=await lcp(page,"/vi/su-kien/chien-dich-dien-bien-phu");const searchDurations=[];
  for(let index=0;index<25;index+=1){const started=performance.now();const response=await request.get("/api/v1/vi/search?q=dien%20bien%20phu&pageSize=20");expect(response.ok()).toBe(true);searchDurations.push(performance.now()-started);}
  const sorted=[...searchDurations].sort((a,b)=>a-b);const p95SearchMs=sorted[Math.ceil(sorted.length*.95)-1];const report={generatedAt:new Date().toISOString(),homeLcpMs,detailLcpMs,p95SearchMs,samples:searchDurations.length,budgets:{lcpMs:2500,p95SearchMs:1000}};
  await mkdir("artifacts/release",{recursive:true});await writeFile("artifacts/release/performance.json",`${JSON.stringify(report,null,2)}\n`);
  expect(homeLcpMs).toBeLessThanOrEqual(2500);expect(detailLcpMs).toBeLessThanOrEqual(2500);expect(p95SearchMs).toBeLessThanOrEqual(1000);
});
