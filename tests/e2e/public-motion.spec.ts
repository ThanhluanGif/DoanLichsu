import { mkdir,writeFile } from "node:fs/promises";
import { expect,test } from "@playwright/test";

type MotionStyle={animationName:string;animationDuration:string;animationTimeline:string;opacity:string;translate:string};

async function motionStyle(locator:import("@playwright/test").Locator):Promise<MotionStyle>{
  return locator.evaluate((element)=>{const style=getComputedStyle(element);return{animationName:style.animationName,animationDuration:style.animationDuration,animationTimeline:style.getPropertyValue("animation-timeline"),opacity:style.opacity,translate:style.translate};});
}

async function openFirstEvent(page:import("@playwright/test").Page){
  const link=page.locator(".timeline-entry h2 a").first();
  const title=(await link.textContent())?.trim();
  const href=await link.getAttribute("href");
  expect(title).toBeTruthy();
  expect(href).toMatch(/^\/vi\/su-kien\//);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href?.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`));
  await expect(page.getByRole("heading",{level:1,name:title,exact:true})).toBeVisible();
  return {title,href};
}

async function lcp(page:import("@playwright/test").Page,url:string){
  await page.addInitScript(()=>{(globalThis as typeof globalThis&{__motionLcp?:number}).__motionLcp=0;new PerformanceObserver((list)=>{for(const entry of list.getEntries())(globalThis as typeof globalThis&{__motionLcp?:number}).__motionLcp=Math.max((globalThis as typeof globalThis&{__motionLcp?:number}).__motionLcp||0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});});
  await page.goto(url,{waitUntil:"networkidle"});
  await page.waitForTimeout(500);
  return page.evaluate(()=>(globalThis as typeof globalThis&{__motionLcp?:number}).__motionLcp||0);
}

test("public route and event motion respect user preference on desktop and mobile",async({browser,baseURL})=>{
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/motion",{recursive:true});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"no-preference"});
  const desktop=await desktopContext.newPage();
  await desktop.goto(`${baseURL}/vi`,{waitUntil:"networkidle"});
  const route=await motionStyle(desktop.locator(".route-transition"));
  const periodLocator=desktop.locator(".period-card").first();
  const periodBeforeReveal=await motionStyle(periodLocator);
  const contentCard=await motionStyle(desktop.locator(".content-card").first());
  const sourcePromise=await motionStyle(desktop.locator(".source-promise"));
  expect(route.animationName).toBe("route-enter");
  expect(route.animationDuration).toBe("0.32s");
  for(const style of [periodBeforeReveal,contentCard,sourcePromise]){
    expect(style.animationName).toBe("content-reveal");
    expect(style.animationTimeline).not.toBe("auto");
  }
  await periodLocator.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(350);
  const periodAfterReveal=await motionStyle(periodLocator);
  expect(Number(periodAfterReveal.opacity)).toBeGreaterThan(.99);
  await desktop.screenshot({path:"artifacts/motion/desktop.png"});

  await desktop.getByRole("link",{name:"Dòng thời gian",exact:true}).click();
  await expect(desktop).toHaveURL(/\/vi\/timeline/);
  const timelineEntry=await motionStyle(desktop.locator(".timeline-entry").first());
  expect(timelineEntry.animationName).toBe("content-reveal");
  expect(timelineEntry.animationTimeline).not.toBe("auto");
  const desktopEvent=await openFirstEvent(desktop);
  const performancePage=await desktopContext.newPage();
  const homeLcpMs=await lcp(performancePage,`${baseURL}/vi`);
  const detailLcpMs=await lcp(performancePage,`${baseURL}${desktopEvent.href}`);
  const searchDurations=[];
  for(let index=0;index<25;index+=1){const started=performance.now();const response=await performancePage.request.get(`${baseURL}/api/v1/vi/search?q=dien%20bien%20phu&pageSize=20`);expect(response.ok()).toBe(true);searchDurations.push(performance.now()-started);}
  const sorted=[...searchDurations].sort((a,b)=>a-b);
  const performanceProof={homeLcpMs,detailLcpMs,p95SearchMs:sorted[Math.ceil(sorted.length*.95)-1],samples:searchDurations.length,budgets:{lcpMs:2500,p95SearchMs:1000}};
  expect(performanceProof.homeLcpMs).toBeLessThanOrEqual(performanceProof.budgets.lcpMs);
  expect(performanceProof.detailLcpMs).toBeLessThanOrEqual(performanceProof.budgets.lcpMs);
  expect(performanceProof.p95SearchMs).toBeLessThanOrEqual(performanceProof.budgets.p95SearchMs);
  await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const mobile=await mobileContext.newPage();
  await mobile.goto(`${baseURL}/vi`,{waitUntil:"networkidle"});
  const reducedRoute=await motionStyle(mobile.locator(".route-transition"));
  const reducedPeriod=await motionStyle(mobile.locator(".period-card").first());
  for(const style of [reducedRoute,reducedPeriod]){
    expect(style.animationName).toBe("none");
    expect(style.opacity).toBe("1");
    expect(style.translate).toBe("none");
  }
  const viewport=await mobile.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  await mobile.locator(".period-card").first().scrollIntoViewIfNeeded();
  await mobile.screenshot({path:"artifacts/motion/mobile.png"});
  await mobile.getByRole("link",{name:"Dòng thời gian",exact:true}).click();
  await expect(mobile).toHaveURL(/\/vi\/timeline/);
  const reducedTimeline=await motionStyle(mobile.locator(".timeline-entry").first());
  expect(reducedTimeline.animationName).toBe("none");
  expect(reducedTimeline.opacity).toBe("1");
  expect(reducedTimeline.translate).toBe("none");
  const mobileEvent=await openFirstEvent(mobile);
  await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,journey:{desktop:["/vi","/vi/timeline",desktopEvent.href],mobile:["/vi","/vi/timeline",mobileEvent.href]},normal:{route,period:{beforeReveal:periodBeforeReveal,afterReveal:periodAfterReveal},contentCard,sourcePromise,timelineEntry},reducedMotion:{route:reducedRoute,period:reducedPeriod,timelineEntry:reducedTimeline},mobileViewport:viewport,performance:performanceProof,screenshots:["artifacts/motion/desktop.png","artifacts/motion/mobile.png"]};
  await writeFile("artifacts/motion/motion-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
