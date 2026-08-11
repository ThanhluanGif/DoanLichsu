import { mkdir,writeFile } from "node:fs/promises";
import { expect,test } from "@playwright/test";

type GradeSummary={grade:number;publishedRequirementCount:number;publishedLessonCount:number;requirementCount:number};
type GradeView={grade:number;summary:{requirementCount:number;publishedRequirementCount:number;verifiedRequirementCount:number;fullCoverage:boolean};requirements:Array<{id:string;track:"MANDATORY"|"ELECTIVE";publishedCount:number;verifiedCount:number;coverageStatus:string;lessons:Array<unknown>}>};

async function blockingAxe(page:import("@playwright/test").Page){
  await page.addScriptTag({path:"node_modules/axe-core/axe.min.js"});
  return page.evaluate(async()=>{const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");});
}

async function metrics(page:import("@playwright/test").Page){return page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,lcpMs:performance.getEntriesByType("largest-contentful-paint").at(-1)?.startTime??0}));}

test("curriculum catalogue keeps published grade journeys source-aware and shareable",async({browser,baseURL})=>{
  test.setTimeout(120_000);if(!baseURL)throw new Error("baseURL is required");await mkdir("artifacts/curriculum-catalog",{recursive:true});
  const requestContext=await browser.newContext();const request=requestContext.request;
  const catalogResponse=await request.get(`${baseURL}/api/v1/vi/curriculum`);expect(catalogResponse.ok()).toBe(true);const catalog=(await catalogResponse.json()).data as {grades:GradeSummary[]};
  const publishedGrades=catalog.grades.filter((grade)=>grade.publishedRequirementCount>0&&grade.publishedLessonCount>0);
  const sitemap=await (await request.get(`${baseURL}/sitemap.xml`)).text();
  for(const path of ["/vi/hoc-theo-lop","/en/learn-by-grade",...publishedGrades.map((grade)=>`/vi/hoc-theo-lop/${grade.grade}`),...publishedGrades.map((grade)=>`/en/learn-by-grade/${grade.grade}`)])expect(sitemap).toContain(`${baseURL}${path}`);
  await requestContext.close();

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},permissions:["clipboard-read","clipboard-write"],reducedMotion:"no-preference"});
  const desktop=await desktopContext.newPage();await desktop.goto(`${baseURL}/vi/hoc-theo-lop`,{waitUntil:"networkidle"});
  await expect(desktop.getByRole("heading",{level:1,name:"Học lịch sử theo lớp"})).toBeVisible();await expect(desktop.locator(".curriculum-grade-card")).toHaveCount(publishedGrades.length);
  await expect(desktop.locator(".site-header .primary-nav a",{hasText:"Học theo lớp"})).toHaveAttribute("href","/vi/hoc-theo-lop");
  const grade=publishedGrades.find((item)=>item.grade===12)??publishedGrades[0];const gradeApi=await (await desktop.request.get(`${baseURL}/api/v1/vi/curriculum/${grade.grade}`)).json() as {data:GradeView};const visibleRequirements=gradeApi.data.requirements.filter((item)=>item.publishedCount>0&&item.lessons.length>0);
  await desktop.locator(`[data-grade-card="${grade.grade}"] h2 a`).click();await expect(desktop).toHaveURL(`${baseURL}/vi/hoc-theo-lop/${grade.grade}`);await expect(desktop.getByRole("heading",{level:1,name:`Lớp ${grade.grade}`})).toBeVisible();
  await expect(desktop.locator(".curriculum-requirement")).toHaveCount(visibleRequirements.length);await expect(desktop.locator('.curriculum-requirement[data-coverage-status="MISSING"]')).toHaveCount(0);await expect(desktop.locator(".curriculum-requirement-source")).toHaveCount(visibleRequirements.length);
  const copy=desktop.locator(".curriculum-grade-actions .copy-link");await copy.click();await expect(copy).toHaveAttribute("data-copied","true");await desktop.goBack({waitUntil:"networkidle"});await expect(desktop).toHaveURL(`${baseURL}/vi/hoc-theo-lop`);await desktop.goForward({waitUntil:"networkidle"});await expect(desktop).toHaveURL(`${baseURL}/vi/hoc-theo-lop/${grade.grade}`);
  const desktopAxe=await blockingAxe(desktop);expect(desktopAxe).toEqual([]);const desktopMetrics=await metrics(desktop);expect(desktopMetrics.scrollWidth).toBe(desktopMetrics.clientWidth);expect(desktopMetrics.lcpMs).toBeLessThanOrEqual(2500);
  // Capture the complete lesson cards with motion reduced; view-timeline reveals are
  // intentionally disabled in this evidence frame so below-the-fold cards are not
  // mistaken for missing public content.
  await desktop.emulateMedia({reducedMotion:"reduce"});await desktop.screenshot({path:"artifacts/curriculum-catalog/curriculum-desktop.png",fullPage:true});await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},permissions:["clipboard-read","clipboard-write"],reducedMotion:"reduce"});const mobile=await mobileContext.newPage();await mobile.goto(`${baseURL}/en/learn-by-grade`,{waitUntil:"networkidle"});await expect(mobile.getByRole("heading",{level:1,name:"Learn history by grade"})).toBeVisible();const gradeLink=mobile.locator(`[data-grade-card="${grade.grade}"] h2 a`);await gradeLink.focus();await mobile.keyboard.press("Enter");await expect(mobile).toHaveURL(`${baseURL}/en/learn-by-grade/${grade.grade}`);const mobileCopy=mobile.locator(".curriculum-grade-actions .copy-link");await mobileCopy.focus();await mobile.keyboard.press("Enter");await expect(mobileCopy).toHaveAttribute("data-copied","true");await mobile.goBack({waitUntil:"networkidle"});await expect(mobile).toHaveURL(`${baseURL}/en/learn-by-grade`);await mobile.goForward({waitUntil:"networkidle"});await expect(mobile).toHaveURL(`${baseURL}/en/learn-by-grade/${grade.grade}`);const mobileAxe=await blockingAxe(mobile);expect(mobileAxe).toEqual([]);const mobileMetrics=await metrics(mobile);expect(mobileMetrics.scrollWidth).toBe(mobileMetrics.clientWidth);await mobile.screenshot({path:"artifacts/curriculum-catalog/curriculum-mobile.png",fullPage:true});await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,publishedGrades:publishedGrades.map((item)=>item.grade),gradeDetail:{grade:grade.grade,visibleRequirements:visibleRequirements.length,missingVisibleRequirements:0,copyLink:true,backForward:true},locales:{vi:"/vi/hoc-theo-lop",en:"/en/learn-by-grade"},accessibility:{desktopCriticalOrSerious:desktopAxe.length,mobileCriticalOrSerious:mobileAxe.length},desktopMetrics,mobileMetrics,screenshots:["artifacts/curriculum-catalog/curriculum-desktop.png","artifacts/curriculum-catalog/curriculum-mobile.png"]};await writeFile("artifacts/curriculum-catalog/curriculum-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
