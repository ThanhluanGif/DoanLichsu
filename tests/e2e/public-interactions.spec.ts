import { mkdir,writeFile } from "node:fs/promises";
import { expect,test } from "@playwright/test";

type InteractionStyle={animationName:string;transitionDuration:string;transitionProperty:string;opacity:string;translate:string};

async function styleOf(locator:import("@playwright/test").Locator):Promise<InteractionStyle>{
  return locator.evaluate((element)=>{const style=getComputedStyle(element);return{animationName:style.animationName,transitionDuration:style.transitionDuration,transitionProperty:style.transitionProperty,opacity:style.opacity,translate:style.translate};});
}

async function keyboardFocus(page:import("@playwright/test").Page,selector:string){
  await page.locator("body").click({position:{x:2,y:2}});
  for(let index=0;index<30;index+=1){await page.keyboard.press("Tab");if(await page.evaluate((target)=>document.activeElement?.matches(target)??false,selector))return index+1;}
  throw new Error(`Keyboard focus did not reach ${selector}`);
}

async function lcp(page:import("@playwright/test").Page,url:string){
  await page.addInitScript(()=>{(globalThis as typeof globalThis&{__interactionLcp?:number}).__interactionLcp=0;new PerformanceObserver((list)=>{for(const entry of list.getEntries())(globalThis as typeof globalThis&{__interactionLcp?:number}).__interactionLcp=Math.max((globalThis as typeof globalThis&{__interactionLcp?:number}).__interactionLcp||0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});});
  await page.goto(url,{waitUntil:"networkidle"});await page.waitForTimeout(500);
  return page.evaluate(()=>(globalThis as typeof globalThis&{__interactionLcp?:number}).__interactionLcp||0);
}

test("public controls provide pointer, keyboard and reduced-motion feedback",async({browser,baseURL})=>{
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/interactions",{recursive:true});
  const detailPath="/vi/su-kien/chien-dich-dien-bien-phu";

  const desktopContext=await browser.newContext({viewport:{width:1440,height:900},permissions:["clipboard-read","clipboard-write"],reducedMotion:"no-preference"});
  const desktop=await desktopContext.newPage();
  await desktop.goto(`${baseURL}${detailPath}`,{waitUntil:"networkidle"});
  const copy=desktop.locator(".copy-link");
  const layoutBefore=await copy.evaluate((element)=>({offsetTop:(element as HTMLElement).offsetTop,offsetLeft:(element as HTMLElement).offsetLeft,offsetWidth:(element as HTMLElement).offsetWidth,offsetHeight:(element as HTMLElement).offsetHeight}));
  await copy.hover();
  await desktop.waitForTimeout(220);
  const hoverStyle=await styleOf(copy);
  expect(hoverStyle.translate).toBe("0px -1px");
  const box=await copy.boundingBox();
  if(!box)throw new Error("Copy control has no pointer target");
  await desktop.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await desktop.mouse.down();
  await desktop.waitForTimeout(100);
  const pressStyle=await styleOf(copy);
  expect(pressStyle.translate).toBe("0px 1px");
  await desktop.mouse.up();
  const layoutAfter=await copy.evaluate((element)=>({offsetTop:(element as HTMLElement).offsetTop,offsetLeft:(element as HTMLElement).offsetLeft,offsetWidth:(element as HTMLElement).offsetWidth,offsetHeight:(element as HTMLElement).offsetHeight}));
  expect(layoutAfter).toEqual(layoutBefore);
  expect(hoverStyle.transitionDuration).toBe("0.16s");
  expect(hoverStyle.transitionProperty).toContain("translate");
  await copy.click();
  await expect(copy).toHaveAttribute("data-copied","true");
  await expect(copy).toContainText("Đã sao chép");
  const confirmStyle=await styleOf(copy.locator("span"));
  expect(confirmStyle.animationName).toBe("copy-confirm");
  await desktop.screenshot({path:"artifacts/interactions/desktop.png"});

  await desktop.reload({waitUntil:"networkidle"});
  const tabPresses=await keyboardFocus(desktop,".copy-link");
  await desktop.keyboard.press("Enter");
  await expect(desktop.locator(".copy-link")).toHaveAttribute("data-copied","true");
  await expect(desktop.locator(".copy-link")).toContainText("Đã sao chép");
  await desktop.goto(`${baseURL}/vi/timeline`,{waitUntil:"networkidle"});
  const filterStyle=await styleOf(desktop.locator(".timeline-filter select"));
  expect(filterStyle.transitionDuration).toBe("0.16s");

  const performancePage=await desktopContext.newPage();
  const homeLcpMs=await lcp(performancePage,`${baseURL}/vi`);
  const detailLcpMs=await lcp(performancePage,`${baseURL}${detailPath}`);
  const searchDurations=[];
  for(let index=0;index<25;index+=1){const started=performance.now();const response=await performancePage.request.get(`${baseURL}/api/v1/vi/search?q=dien%20bien%20phu&pageSize=20`);expect(response.ok()).toBe(true);searchDurations.push(performance.now()-started);}
  const sorted=[...searchDurations].sort((a,b)=>a-b);
  const performanceProof={homeLcpMs,detailLcpMs,p95SearchMs:sorted[Math.ceil(sorted.length*.95)-1],samples:searchDurations.length,budgets:{lcpMs:2500,p95SearchMs:1000}};
  expect(performanceProof.homeLcpMs).toBeLessThanOrEqual(performanceProof.budgets.lcpMs);
  expect(performanceProof.detailLcpMs).toBeLessThanOrEqual(performanceProof.budgets.lcpMs);
  expect(performanceProof.p95SearchMs).toBeLessThanOrEqual(performanceProof.budgets.p95SearchMs);
  await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},permissions:["clipboard-read","clipboard-write"],reducedMotion:"reduce"});
  const mobile=await mobileContext.newPage();
  await mobile.goto(`${baseURL}${detailPath}`,{waitUntil:"networkidle"});
  const reducedCopy=mobile.locator(".copy-link");
  const reducedStyle=await styleOf(reducedCopy);
  expect(reducedStyle.animationName).toBe("none");
  expect(reducedStyle.transitionDuration).toBe("0s");
  expect(reducedStyle.opacity).toBe("1");
  expect(reducedStyle.translate).toBe("none");
  await reducedCopy.click();
  await expect(reducedCopy).toHaveAttribute("data-copied","true");
  const reducedConfirmStyle=await styleOf(reducedCopy.locator("span"));
  expect(reducedConfirmStyle.animationName).toBe("none");
  expect(reducedConfirmStyle.transitionDuration).toBe("0s");
  const viewport=await mobile.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  await mobile.screenshot({path:"artifacts/interactions/mobile.png"});
  await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,detailPath,pointer:{layoutBefore,layoutAfter,hoverStyle,pressStyle,confirmStyle},keyboard:{tabPresses,copied:true},filter:filterStyle,reducedMotion:{control:reducedStyle,confirmation:reducedConfirmStyle},mobileViewport:viewport,performance:performanceProof,screenshots:["artifacts/interactions/desktop.png","artifacts/interactions/mobile.png"]};
  await writeFile("artifacts/interactions/interaction-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
