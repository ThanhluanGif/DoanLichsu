import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect,test,type Locator,type Page } from "@playwright/test";

const axePath=resolve("node_modules/axe-core/axe.min.js");
type RuntimeImage={id:string;src:string;alt:string;naturalWidth:number;naturalHeight:number};

async function imageRuntime(locator:Locator):Promise<RuntimeImage>{return locator.evaluate((element)=>{const image=element as HTMLImageElement;return{id:image.dataset.featuredArt??image.dataset.detailArt??"",src:new URL(image.currentSrc||image.src).pathname,alt:image.alt,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight};});}
async function blockingAxe(page:Page){await page.addScriptTag({path:axePath});return page.evaluate(async()=>{const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");});}
async function addLcp(page:Page){await page.addInitScript(()=>{(globalThis as typeof globalThis&{__immersiveLcp?:number}).__immersiveLcp=0;new PerformanceObserver((list)=>{for(const entry of list.getEntries())(globalThis as typeof globalThis&{__immersiveLcp?:number}).__immersiveLcp=Math.max((globalThis as typeof globalThis&{__immersiveLcp?:number}).__immersiveLcp??0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});});}
async function viewport(page:Page){return page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));}
async function motionStyle(locator:Locator){return locator.evaluate((element)=>{const style=getComputedStyle(element);return{animationName:style.animationName,perspective:style.perspective,transformStyle:style.transformStyle,translate:style.translate,rotate:style.rotate,transform:style.transform};});}

test("ten interpretive portraits share one depth system across collection and detail",async({browser,baseURL})=>{
  test.setTimeout(180_000);
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/immersive-visuals",{recursive:true});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"no-preference"});
  const desktop=await desktopContext.newPage();
  await addLcp(desktop);
  await desktop.goto(`${baseURL}/vi/nhan-vat`,{waitUntil:"networkidle"});
  const routeStyle=await motionStyle(desktop.locator(".route-transition"));
  const gridStyle=await motionStyle(desktop.locator(".content-grid"));
  expect(routeStyle.animationName).toBe("route-enter");
  expect(routeStyle.perspective).toBe("1400px");
  expect(gridStyle.perspective).toBe("1300px");
  await desktop.waitForTimeout(500);
  const lcpMs=await desktop.evaluate(()=>(globalThis as typeof globalThis&{__immersiveLcp?:number}).__immersiveLcp??0);
  expect(lcpMs).toBeGreaterThan(0);
  expect(lcpMs).toBeLessThanOrEqual(2500);

  const images=desktop.locator("img[data-featured-art]");
  await expect(images).toHaveCount(10);
  const desktopImages:RuntimeImage[]=[];
  for(let index=0;index<10;index+=1){const image=images.nth(index);await image.scrollIntoViewIfNeeded();await expect.poll(async()=>(await imageRuntime(image)).naturalWidth).toBe(1280);const runtime=await imageRuntime(image);expect(runtime.naturalHeight).toBe(853);expect(runtime.src).toMatch(/^\/images\/people\/.+-relief-v1\.webp$/);desktopImages.push(runtime);}
  expect(new Set(desktopImages.map(({id})=>id)).size).toBe(10);
  expect(new Set(desktopImages.map(({src})=>src)).size).toBe(10);

  const firstCard=desktop.locator(".content-card").first();
  await firstCard.hover();
  const hoverStyle=await motionStyle(firstCard);
  expect(hoverStyle.transform).not.toBe("none");
  const desktopViewport=await viewport(desktop);
  expect(desktopViewport.scrollWidth).toBe(desktopViewport.clientWidth);
  expect(await blockingAxe(desktop)).toEqual([]);
  await desktop.screenshot({path:"artifacts/immersive-visuals/immersive-visuals-desktop.png",fullPage:true});

  const firstLink=firstCard.locator("h3 a");
  const firstHref=await firstLink.getAttribute("href");
  const firstTitle=(await firstLink.textContent())?.trim();
  expect(firstHref).toMatch(/^\/vi\/nhan-vat\//);
  await firstLink.focus();
  await expect(firstLink).toBeFocused();
  await firstLink.press("Enter");
  await expect(desktop).toHaveURL(new RegExp(`${firstHref?.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`));
  await expect(desktop.getByRole("heading",{level:1,name:firstTitle,exact:true})).toBeVisible();
  const detailImage=desktop.locator("img[data-detail-art]");
  await expect(detailImage).toBeVisible();
  await expect.poll(async()=>(await imageRuntime(detailImage)).naturalWidth).toBe(1280);
  const detailRuntime=await imageRuntime(detailImage);
  expect(detailRuntime.src).toBe(desktopImages[0].src);
  expect(detailRuntime.alt).toContain("Minh họa diễn giải dạng phù điêu");
  await expect(desktop.getByText("Chân dung minh họa diễn giải, không phải ảnh tư liệu hay phục dựng khuôn mặt có thẩm quyền.",{exact:true})).toBeVisible();
  expect(await blockingAxe(desktop)).toEqual([]);
  await desktop.goBack({waitUntil:"networkidle"});
  await expect(desktop).toHaveURL(/\/vi\/nhan-vat$/);

  const transfers=[];
  for(const {src} of desktopImages){const response=await desktop.request.get(`${baseURL}${src}`);expect(response.ok()).toBe(true);const bytes=(await response.body()).byteLength;expect(response.headers()["content-type"]).toContain("image/webp");transfers.push({src,bytes});}
  const totalTransferBytes=transfers.reduce((sum,item)=>sum+item.bytes,0);
  expect(totalTransferBytes).toBeLessThanOrEqual(2_500_000);
  await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const mobile=await mobileContext.newPage();
  await mobile.goto(`${baseURL}/en/people`,{waitUntil:"networkidle"});
  const mobileImages=mobile.locator("img[data-featured-art]");
  await expect(mobileImages).toHaveCount(10);
  for(let index=0;index<10;index+=1){const image=mobileImages.nth(index);await image.scrollIntoViewIfNeeded();await expect.poll(async()=>(await imageRuntime(image)).naturalWidth).toBe(1280);}
  const reduced={route:await motionStyle(mobile.locator(".route-transition")),card:await motionStyle(mobile.locator(".content-card").first()),image:await motionStyle(mobile.locator(".content-card-art img").first())};
  for(const style of Object.values(reduced)){expect(style.animationName).toBe("none");expect(style.translate).toBe("none");expect(style.rotate).toBe("none");expect(style.transform).toBe("none");}
  const mobileViewport=await viewport(mobile);
  expect(mobileViewport.scrollWidth).toBe(mobileViewport.clientWidth);
  expect(await blockingAxe(mobile)).toEqual([]);
  await mobile.screenshot({path:"artifacts/immersive-visuals/immersive-visuals-mobile.png",fullPage:true});
  await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,portraits:desktopImages,transfers,totalTransferBytes,budgetBytes:2_500_000,normalMotion:{route:routeStyle,grid:gridStyle,cardHover:hoverStyle},reducedMotion:reduced,journey:{collection:"/vi/nhan-vat",detail:firstHref,title:firstTitle,keyboard:true,back:true,reusedAsset:detailRuntime.src},accessibility:{criticalOrSerious:0},viewport:{desktop:desktopViewport,mobile:mobileViewport},lcpMs,screenshots:["artifacts/immersive-visuals/immersive-visuals-desktop.png","artifacts/immersive-visuals/immersive-visuals-mobile.png"]};
  await writeFile("artifacts/immersive-visuals/immersive-visuals-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
