import { mkdir,writeFile } from "node:fs/promises";
import { expect,test } from "@playwright/test";

type RuntimeImage={id:string;src:string;complete:boolean;naturalWidth:number;naturalHeight:number;renderedWidth:number;renderedHeight:number};

async function imageRuntime(locator:import("@playwright/test").Locator):Promise<RuntimeImage>{
  return locator.evaluate((element)=>{const image=element as HTMLImageElement;return{id:image.dataset.periodArt??"",src:new URL(image.currentSrc||image.src).pathname,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,renderedWidth:image.getBoundingClientRect().width,renderedHeight:image.getBoundingClientRect().height};});
}

test("all six period illustrations load responsively without shifting the public home",async({browser,baseURL})=>{
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/period-images",{recursive:true});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000}});
  const desktop=await desktopContext.newPage();
  await desktop.addInitScript(()=>{
    const state=globalThis as typeof globalThis&{__periodCls?:number;__periodLcp?:number};state.__periodCls=0;state.__periodLcp=0;
    new PerformanceObserver((list)=>{for(const entry of list.getEntries()){const shift=entry as PerformanceEntry&{hadRecentInput?:boolean;value?:number};if(!shift.hadRecentInput)state.__periodCls=(state.__periodCls??0)+(shift.value??0);}}).observe({type:"layout-shift",buffered:true});
    new PerformanceObserver((list)=>{for(const entry of list.getEntries())state.__periodLcp=Math.max(state.__periodLcp??0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});
  });
  await desktop.goto(`${baseURL}/vi`,{waitUntil:"networkidle"});
  await desktop.waitForTimeout(500);
  const initialLcpMs=await desktop.evaluate(()=>(globalThis as typeof globalThis&{__periodLcp?:number}).__periodLcp??0);
  expect(initialLcpMs).toBeLessThanOrEqual(2500);
  const desktopImages=desktop.locator("img[data-period-art]");
  await expect(desktopImages).toHaveCount(6);
  for(let index=0;index<6;index+=1){const image=desktopImages.nth(index);await image.scrollIntoViewIfNeeded();await expect.poll(async()=>(await imageRuntime(image)).naturalWidth).toBeGreaterThan(0);}
  const desktopRuntime=await desktopImages.evaluateAll((images)=>images.map((element)=>{const image=element as HTMLImageElement;return{id:image.dataset.periodArt??"",src:new URL(image.currentSrc||image.src).pathname,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,renderedWidth:image.getBoundingClientRect().width,renderedHeight:image.getBoundingClientRect().height};}));
  expect(new Set(desktopRuntime.map(({id})=>id)).size).toBe(6);
  for(const image of desktopRuntime){expect(image.complete).toBe(true);expect(image.naturalWidth).toBe(1280);expect(image.naturalHeight).toBe(853);expect(image.renderedWidth/image.renderedHeight).toBeCloseTo(1.6,1);}
  await expect(desktop.getByText("Các hình ảnh trong phần này là minh họa nguyên bản, không phải tư liệu lịch sử.",{exact:true})).toBeVisible();
  await desktop.waitForTimeout(500);
  const metrics=await desktop.evaluate((homeLcpMs)=>{const state=globalThis as typeof globalThis&{__periodCls?:number};return{cumulativeLayoutShift:state.__periodCls??0,homeLcpMs,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth};},initialLcpMs);
  expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(.1);expect(metrics.homeLcpMs).toBeLessThanOrEqual(2500);expect(metrics.scrollWidth).toBe(metrics.clientWidth);
  const transfers=[];for(const {src} of desktopRuntime){const response=await desktop.request.get(`${baseURL}${src}`);expect(response.ok()).toBe(true);transfers.push({src,bytes:(await response.body()).byteLength,contentType:response.headers()["content-type"]});}
  const totalTransferBytes=transfers.reduce((total,item)=>total+item.bytes,0);expect(totalTransferBytes).toBeLessThanOrEqual(1_800_000);for(const item of transfers)expect(item.contentType).toContain("image/webp");
  await desktop.locator("section[aria-labelledby='period-title']").screenshot({path:"artifacts/period-images/desktop.png"});
  await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844}});const mobile=await mobileContext.newPage();await mobile.goto(`${baseURL}/en`,{waitUntil:"networkidle"});
  const mobileImages=mobile.locator("img[data-period-art]");await expect(mobileImages).toHaveCount(6);for(let index=0;index<6;index+=1){const image=mobileImages.nth(index);await image.scrollIntoViewIfNeeded();await expect.poll(async()=>(await imageRuntime(image)).naturalWidth).toBeGreaterThan(0);}
  const mobileRuntime=[];for(let index=0;index<6;index+=1)mobileRuntime.push(await imageRuntime(mobileImages.nth(index)));
  for(const image of mobileRuntime){expect(image.complete).toBe(true);expect(image.naturalWidth).toBe(1280);expect(image.naturalHeight).toBe(853);expect(image.renderedWidth/image.renderedHeight).toBeCloseTo(1.6,1);}
  await expect(mobile.getByText("Images in this section are original illustrations, not historical documents.",{exact:true})).toBeVisible();
  const mobileViewport=await mobile.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));expect(mobileViewport.scrollWidth).toBe(mobileViewport.clientWidth);
  await mobile.locator("section[aria-labelledby='period-title']").screenshot({path:"artifacts/period-images/mobile.png"});await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,images:desktopRuntime,transfers,totalTransferBytes,metrics,mobileViewport,screenshots:["artifacts/period-images/desktop.png","artifacts/period-images/mobile.png"]};
  await writeFile("artifacts/period-images/period-images-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
