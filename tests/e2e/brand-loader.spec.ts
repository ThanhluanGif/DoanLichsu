import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer,request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { mkdir,writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { expect,test } from "@playwright/test";

const axePath=resolve("node_modules/axe-core/axe.min.js");

type LoaderStyle={mark:string;orbit:string;ripple:string;rotate:string;scale:string};
type ProofApp={origin:string;release:()=>void;close:()=>Promise<void>};
type LayoutProof={cls:number;emblemCenter:{x:number;y:number};viewportCenter:{x:number;y:number};destinationTitle:string};

const wait=(duration:number)=>new Promise<void>((resolveWait)=>setTimeout(resolveWait,duration));

async function listen(server:ReturnType<typeof createServer>){
  await new Promise<void>((resolveListen,reject)=>{
    const failed=(error:Error)=>reject(error);
    server.once("error",failed);
    server.listen(0,"127.0.0.1",()=>{server.off("error",failed);resolveListen();});
  });
  return (server.address() as AddressInfo).port;
}

async function closeServer(server:ReturnType<typeof createServer>){
  if(!server.listening)return;
  await new Promise<void>((resolveClose,reject)=>server.close((error)=>error?reject(error):resolveClose()));
}

async function freePort(){
  const probe=createServer();
  const port=await listen(probe);
  await closeServer(probe);
  return port;
}

async function stopChild(child:ReturnType<typeof spawn>){
  if(child.exitCode!==null)return;
  child.kill("SIGTERM");
  await Promise.race([once(child,"exit"),wait(1500)]);
  if(child.exitCode===null){child.kill("SIGKILL");await once(child,"exit");}
}

async function createProofApp(upstreamOrigin:string):Promise<ProofApp>{
  const pending=new Set<()=>void>();
  const proxy=createServer((incoming,outgoing)=>{
    const target=new URL(incoming.url??"/",upstreamOrigin);
    const transport=target.protocol==="https:"?httpsRequest:httpRequest;
    const upstream=transport(target,{method:incoming.method,headers:{...incoming.headers,host:target.host}},(response)=>{
      const forward=()=>{
        if(outgoing.destroyed)return;
        outgoing.writeHead(response.statusCode??502,response.headers);
        response.pipe(outgoing);
      };
      if(/^\/api\/v1\/(?:vi|en)\/contents\/[^/]+\/[^/]+$/.test(target.pathname)){
        response.pause();
        pending.add(forward);
      }else forward();
    });
    upstream.on("error",(error)=>{if(!outgoing.headersSent)outgoing.writeHead(502);outgoing.end(error.message);});
    incoming.pipe(upstream);
  });
  const proxyPort=await listen(proxy);
  let child:ReturnType<typeof spawn>|undefined;
  try{
    const appPort=await freePort();
    const origin=`http://127.0.0.1:${appPort}`;
    child=spawn(process.execPath,[resolve(".next/standalone/server.js")],{
      cwd:process.cwd(),
      env:{...process.env,NODE_ENV:"production",HOSTNAME:"127.0.0.1",PORT:String(appPort),APP_ORIGIN:origin,INTERNAL_API_ORIGIN:`http://127.0.0.1:${proxyPort}`,DATABASE_PATH:resolve("data/quan-su-viet.db")},
      stdio:["ignore","pipe","pipe"],
    });
    const logs:string[]=[];
    child.stdout?.on("data",(chunk)=>logs.push(String(chunk)));
    child.stderr?.on("data",(chunk)=>logs.push(String(chunk)));
    for(let attempt=0;attempt<100;attempt+=1){
      if(child.exitCode!==null)throw new Error(`Proof app exited ${child.exitCode}: ${logs.join("")}`);
      try{const response=await fetch(origin,{redirect:"manual"});if(response.status<500)break;}catch{}
      if(attempt===99)throw new Error(`Proof app did not start: ${logs.join("")}`);
      await wait(100);
    }
    const release=()=>{for(const forward of pending)forward();pending.clear();};
    return{origin,release,close:async()=>{release();await stopChild(child!);await closeServer(proxy);}};
  }catch(error){
    if(child)await stopChild(child);
    await closeServer(proxy);
    throw error;
  }
}

async function loaderStyle(page:import("@playwright/test").Page):Promise<LoaderStyle>{
  return page.locator("[data-brand-loader]").evaluate((element)=>{
    const mark=getComputedStyle(element.querySelector(".brand-loading-mark")!);
    const orbit=getComputedStyle(element,"::before");
    const ripple=getComputedStyle(element.querySelector(".brand-loading-ripple")!);
    return{mark:mark.animationName,orbit:orbit.animationName,ripple:ripple.animationName,rotate:orbit.rotate,scale:mark.scale};
  });
}

async function axeBlocking(page:import("@playwright/test").Page){
  await page.addScriptTag({path:axePath});
  return page.evaluate(async()=>{
    const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;
    const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});
    return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");
  });
}

async function beginLayoutShiftMeasurement(page:import("@playwright/test").Page){
  await page.evaluate(()=>{
    const state=globalThis as typeof globalThis&{__brandLoaderCls?:number};
    state.__brandLoaderCls=0;
    new PerformanceObserver((list)=>{for(const entry of list.getEntries() as (PerformanceEntry&{hadRecentInput?:boolean;value?:number})[]){if(!entry.hadRecentInput)state.__brandLoaderCls=(state.__brandLoaderCls??0)+(entry.value??0);}}).observe({type:"layout-shift",buffered:true});
  });
}

async function focusByKeyboard(page:import("@playwright/test").Page,href:string){
  for(let step=0;step<120;step+=1){
    await page.keyboard.press("Tab");
    const activeHref=await page.evaluate(()=>document.activeElement instanceof HTMLAnchorElement?document.activeElement.getAttribute("href"):null);
    if(activeHref===href)return;
  }
  throw new Error(`Keyboard could not reach ${href}`);
}

async function layoutProof(page:import("@playwright/test").Page):Promise<Omit<LayoutProof,"destinationTitle">>{
  const box=await page.locator("[data-brand-loader]").boundingBox();
  if(!box)throw new Error("Loader has no bounding box");
  const viewport=page.viewportSize();
  if(!viewport)throw new Error("Viewport is required");
  const cls=await page.evaluate(()=>(globalThis as typeof globalThis&{__brandLoaderCls?:number}).__brandLoaderCls??0);
  return{cls,emblemCenter:{x:box.x+box.width/2,y:box.y+box.height/2},viewportCenter:{x:viewport.width/2,y:viewport.height/2}};
}

test("brand loader is visible, accessible and static for reduced motion",async({browser,baseURL})=>{
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/brand-loader",{recursive:true});
  const proofApp=await createProofApp(new URL(baseURL).origin);
  let desktopContext:import("@playwright/test").BrowserContext|undefined;
  let mobileContext:import("@playwright/test").BrowserContext|undefined;
  try{

  desktopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"no-preference"});
  const desktop=await desktopContext.newPage();
  await desktop.goto(`${proofApp.origin}/vi`,{waitUntil:"networkidle"});
  await beginLayoutShiftMeasurement(desktop);
  const desktopLink=desktop.locator(".content-card h3 a").first();
  const desktopPath=await desktopLink.getAttribute("href");
  expect(desktopPath).toMatch(/^\/vi\//);
  await focusByKeyboard(desktop,desktopPath!);
  await desktop.keyboard.press("Enter");
  const desktopLoader=desktop.locator("[data-brand-loader]");
  await expect(desktopLoader).toBeVisible();
  await expect(desktop).toHaveTitle("Quân Sử Việt — Đang tải / Loading");
  const desktopStyle=await loaderStyle(desktop);
  expect(desktopStyle.mark).toBe("brand-loader-breathe");
  expect(desktopStyle.orbit).toBe("brand-loader-orbit");
  expect(desktopStyle.ripple).toBe("brand-loader-ripple");
  const desktopViewport=await desktop.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  const desktopLayout=await layoutProof(desktop);
  const desktopBlocking=await axeBlocking(desktop);
  await desktop.screenshot({path:"artifacts/brand-loader/brand-loader-desktop.png"});
  proofApp.release();
  await expect(desktop).toHaveURL(new RegExp(`${desktopPath}$`));
  await expect(desktopLoader).toHaveCount(0);
  await expect(desktop).not.toHaveTitle("Quân Sử Việt — Đang tải / Loading");
  const desktopDestinationTitle=await desktop.title();
  desktopLayout.cls=await desktop.evaluate(()=>(globalThis as typeof globalThis&{__brandLoaderCls?:number}).__brandLoaderCls??0);
  await desktop.keyboard.press("Tab");
  await expect(desktop.locator(".skip-link")).toBeFocused();
  await desktop.keyboard.press("Tab");
  await expect(desktop.locator(".site-header .brand")).toBeFocused();
  await desktopContext.close();desktopContext=undefined;

  mobileContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const mobile=await mobileContext.newPage();
  await mobile.goto(`${proofApp.origin}/vi`,{waitUntil:"networkidle"});
  await beginLayoutShiftMeasurement(mobile);
  const mobileLink=mobile.locator(".content-card h3 a").first();
  const mobilePath=await mobileLink.getAttribute("href");
  expect(mobilePath).toMatch(/^\/vi\//);
  await focusByKeyboard(mobile,mobilePath!);
  await mobile.keyboard.press("Enter");
  const mobileLoader=mobile.locator("[data-brand-loader]");
  await expect(mobileLoader).toBeVisible();
  await expect(mobile).toHaveTitle("Quân Sử Việt — Đang tải / Loading");
  const mobileStyle=await loaderStyle(mobile);
  expect(mobileStyle.mark).toBe("none");
  expect(mobileStyle.orbit).toBe("none");
  expect(mobileStyle.ripple).toBe("none");
  expect(mobileStyle.rotate).toBe("none");
  expect(mobileStyle.scale).toBe("1");
  const mobileViewport=await mobile.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  const mobileLayout=await layoutProof(mobile);
  const mobileBlocking=await axeBlocking(mobile);
  await mobile.screenshot({path:"artifacts/brand-loader/brand-loader-mobile.png"});
  proofApp.release();
  await expect(mobile).toHaveURL(new RegExp(`${mobilePath}$`));
  await expect(mobileLoader).toHaveCount(0);
  await expect(mobile).not.toHaveTitle("Quân Sử Việt — Đang tải / Loading");
  const mobileDestinationTitle=await mobile.title();
  mobileLayout.cls=await mobile.evaluate(()=>(globalThis as typeof globalThis&{__brandLoaderCls?:number}).__brandLoaderCls??0);
  await mobile.keyboard.press("Tab");
  await expect(mobile.locator(".skip-link")).toBeFocused();
  await mobile.keyboard.press("Tab");
  await expect(mobile.locator(".site-header .brand")).toBeFocused();
  await mobileContext.close();mobileContext=undefined;

  expect(desktopViewport.scrollWidth).toBe(desktopViewport.clientWidth);
  expect(mobileViewport.scrollWidth).toBe(mobileViewport.clientWidth);
  expect(desktopLayout.cls).toBeLessThanOrEqual(.1);
  expect(mobileLayout.cls).toBeLessThanOrEqual(.1);
  expect(Math.abs(desktopLayout.emblemCenter.x-desktopLayout.viewportCenter.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktopLayout.emblemCenter.y-desktopLayout.viewportCenter.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileLayout.emblemCenter.x-mobileLayout.viewportCenter.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileLayout.emblemCenter.y-mobileLayout.viewportCenter.y)).toBeLessThanOrEqual(1);
  expect([...desktopBlocking,...mobileBlocking]).toEqual([]);
  const proof={generatedAt:new Date().toISOString(),url:proofApp.origin,upstream:new URL(baseURL).origin,desktop:{style:desktopStyle,viewport:desktopViewport,layout:{...desktopLayout,destinationTitle:desktopDestinationTitle},blocking:desktopBlocking},mobileReducedMotion:{style:mobileStyle,viewport:mobileViewport,layout:{...mobileLayout,destinationTitle:mobileDestinationTitle},blocking:mobileBlocking},keyboard:"Tab reached the content link, Enter activated it, then skip-link and header brand received focus in order after loader removal",screenshots:["artifacts/brand-loader/brand-loader-desktop.png","artifacts/brand-loader/brand-loader-mobile.png"]};
  await writeFile("artifacts/brand-loader/brand-loader-proof.json",`${JSON.stringify(proof,null,2)}\n`);
  }finally{
    await desktopContext?.close();
    await mobileContext?.close();
    await proofApp.close();
  }
});
