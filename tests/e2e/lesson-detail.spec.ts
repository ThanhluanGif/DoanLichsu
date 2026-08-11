import { mkdir,writeFile } from "node:fs/promises";
import { expect,test,type Page } from "@playwright/test";

async function blockingAxe(page:Page){
  await page.addScriptTag({path:"node_modules/axe-core/axe.min.js"});
  return page.evaluate(async()=>{const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");});
}

async function viewport(page:Page){return page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));}

test("lesson detail separates analysis, debate, claims and sources across locales",async({browser,baseURL})=>{
  test.setTimeout(120_000);if(!baseURL)throw new Error("baseURL is required");await mkdir("artifacts/lesson-detail",{recursive:true});
  const requestContext=await browser.newContext();
  const viApi=await (await requestContext.request.get(`${baseURL}/api/v1/vi/contents/EVENT/chien-dich-dien-bien-phu`)).json() as {data:{lesson:{learningObjectives:string[];originalSummary:string;analysis:string;debates:Array<{claimIds:string[]}>}|null;asOf:string|null;claims:Array<{evidence:unknown[]}>;sources:unknown[]}};
  const enApi=await (await requestContext.request.get(`${baseURL}/api/v1/en/contents/EVENT/battle-of-dien-bien-phu`)).json() as {data:typeof viApi.data};
  const nonLessonApi=await (await requestContext.request.get(`${baseURL}/api/v1/en/contents/PERSON/vo-nguyen-giap-en`)).json() as {data:{lesson:unknown;asOf:string|null}};
  for(const response of [viApi,enApi]){
    expect(response.data.lesson).not.toBeNull();expect(response.data.lesson?.learningObjectives.length).toBeGreaterThanOrEqual(3);expect(response.data.lesson?.originalSummary.length).toBeGreaterThan(80);expect(response.data.lesson?.analysis.length).toBeGreaterThan(200);expect(response.data.lesson?.debates.length).toBeGreaterThanOrEqual(2);expect(response.data.asOf).toBe("2026-08-10T00:00:00.000Z");
    expect(response.data.claims.every((claim)=>claim.evidence.length>0)).toBe(true);
  }
  expect(nonLessonApi.data.lesson).toBeNull();expect(nonLessonApi.data.asOf).toBeNull();
  await requestContext.close();

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},permissions:["clipboard-read","clipboard-write"],reducedMotion:"reduce"});
  const desktop=await desktopContext.newPage();await desktop.goto(`${baseURL}/vi/su-kien`,{waitUntil:"networkidle"});await desktop.goto(`${baseURL}/vi/su-kien/chien-dich-dien-bien-phu`,{waitUntil:"networkidle"});
  await expect(desktop.getByRole("heading",{level:1,name:"Chiến dịch Điện Biên Phủ",exact:true})).toBeVisible();
  for(const name of ["Mục tiêu học tập","Tóm tắt biên tập","Phân tích","Góc nhìn còn tranh luận","Luận điểm đã kiểm chứng","Nguồn tham khảo"])await expect(desktop.getByRole("heading",{name,exact:true})).toBeVisible();
  await expect(desktop.locator(".lesson-debate-list article")).toHaveCount(2);await expect(desktop.locator(".lesson-empty")).toBeVisible();await expect(desktop.locator(".sources li")).toHaveCount(1);
  const desktopCopy=desktop.locator(".detail-actions .copy-link");await desktopCopy.click();await expect(desktopCopy).toHaveAttribute("data-copied","true");await desktopCopy.focus();await expect(desktopCopy).toBeFocused();await desktop.keyboard.press("Enter");await expect(desktopCopy).toHaveAttribute("data-copied","true");await desktop.goBack({waitUntil:"networkidle"});await expect(desktop).toHaveURL(`${baseURL}/vi/su-kien`);await desktop.goForward({waitUntil:"networkidle"});await expect(desktop).toHaveURL(`${baseURL}/vi/su-kien/chien-dich-dien-bien-phu`);
  const desktopAxe=await blockingAxe(desktop);expect(desktopAxe).toEqual([]);const desktopViewport=await viewport(desktop);expect(desktopViewport.scrollWidth).toBe(desktopViewport.clientWidth);await desktop.screenshot({path:"artifacts/lesson-detail/lesson-desktop.png",fullPage:true});await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},permissions:["clipboard-read","clipboard-write"],reducedMotion:"reduce"});const mobile=await mobileContext.newPage();await mobile.goto(`${baseURL}/en/events/battle-of-dien-bien-phu`,{waitUntil:"networkidle"});
  await expect(mobile.getByRole("heading",{level:1,name:"Battle of Điện Biên Phủ",exact:true})).toBeVisible();for(const name of ["Learning objectives","Editorial summary","Analysis","Interpretations still debated","Verified claims","References"])await expect(mobile.getByRole("heading",{name,exact:true})).toBeVisible();const mobileCopy=mobile.locator(".detail-actions .copy-link");await mobileCopy.focus();await expect(mobileCopy).toBeFocused();await mobile.keyboard.press("Enter");await expect(mobileCopy).toHaveAttribute("data-copied","true");const mobileAxe=await blockingAxe(mobile);expect(mobileAxe).toEqual([]);const mobileViewport=await viewport(mobile);expect(mobileViewport.scrollWidth).toBe(mobileViewport.clientWidth);await mobile.screenshot({path:"artifacts/lesson-detail/lesson-mobile.png",fullPage:true});await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,lesson:{vi:"/vi/su-kien/chien-dich-dien-bien-phu",en:"/en/events/battle-of-dien-bien-phu",objectives:3,debates:2,asOf:"2026-08-10T00:00:00.000Z",claimsPublished:0,sources:1,copyLink:true,backForward:true,keyboard:true},nonLesson:{path:"/en/people/vo-nguyen-giap-en",lesson:null},accessibility:{desktopCriticalOrSerious:desktopAxe.length,mobileCriticalOrSerious:mobileAxe.length},desktopViewport,mobileViewport,screenshots:["artifacts/lesson-detail/lesson-desktop.png","artifacts/lesson-detail/lesson-mobile.png"]};await writeFile("artifacts/lesson-detail/lesson-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
