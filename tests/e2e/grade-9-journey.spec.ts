import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {expect,test,type Page} from "@playwright/test";

type Lesson={id:string;type:"TOPIC";title:string;slug:string};
type Requirement={id:string;topic:string;coverageStatus:string;publishedCount:number;verifiedCount:number;lessons:Lesson[]};
type GradeView={grade:number;label:string;summary:{requirementCount:number;publishedRequirementCount:number;verifiedRequirementCount:number;fullCoverage:boolean};requirements:Requirement[]};
type DetailView={id:string;title:string;asOf:string;reviewedBy:string;claims:Array<{id:string;statement:string;evidence:Array<{locator:string;source:{id:string;url:string;verificationStatus:string}}>} >;sources:Array<{id:string;title:string;url:string;year:number|null;accessedAt:string;verificationStatus:string}>};

const axePath=resolve("node_modules/axe-core/axe.min.js");

async function trackLcp(page:Page){
  await page.addInitScript(()=>{const state=globalThis as typeof globalThis&{__grade9Lcp?:number};state.__grade9Lcp=0;new PerformanceObserver((list)=>{for(const entry of list.getEntries())state.__grade9Lcp=Math.max(state.__grade9Lcp??0,entry.startTime);}).observe({type:"largest-contentful-paint",buffered:true});});
}

async function blockingAxe(page:Page){
  await page.addScriptTag({path:axePath});
  return page.evaluate(async()=>{const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");});
}

async function metrics(page:Page){
  await page.waitForTimeout(400);
  return page.evaluate(()=>{const state=globalThis as typeof globalThis&{__grade9Lcp?:number};return{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,lcpMs:state.__grade9Lcp??0};});
}

async function openLessonByKeyboard(page:Page,lesson:Lesson){
  const card=page.locator(".curriculum-lessons .content-card").filter({hasText:lesson.title}).first();await expect(card).toBeVisible();const link=card.getByRole("link",{name:lesson.title,exact:true});await link.focus();await expect(link).toBeFocused();await page.keyboard.press("Enter");
}

test("Grade 9 reaches 6/6 verified coverage with dated current updates on desktop and mobile",async({browser,baseURL})=>{
  test.setTimeout(120_000);if(!baseURL)throw new Error("baseURL is required");await mkdir("artifacts/curriculum/grade-9",{recursive:true});
  const requestContext=await browser.newContext();
  const viResponse=await requestContext.request.get(`${baseURL}/api/v1/vi/curriculum/9?track=MANDATORY&pageSize=50`);const enResponse=await requestContext.request.get(`${baseURL}/api/v1/en/curriculum/9?track=MANDATORY&pageSize=50`);
  expect(viResponse.ok()).toBe(true);expect(enResponse.ok()).toBe(true);
  const viEnvelope=await viResponse.json() as {data:GradeView};const enEnvelope=await enResponse.json() as {data:GradeView};
  for(const grade of [viEnvelope.data,enEnvelope.data]){expect(grade.summary).toEqual({requirementCount:6,publishedRequirementCount:6,verifiedRequirementCount:6,fullCoverage:true});expect(grade.requirements).toHaveLength(6);expect(grade.requirements.every((item)=>item.coverageStatus==="VERIFIED"&&item.publishedCount>0&&item.verifiedCount>0)).toBe(true);}
  await writeFile("artifacts/curriculum/grade-9/grade-9-api-vi.json",`${JSON.stringify(viEnvelope,null,2)}\n`);await writeFile("artifacts/curriculum/grade-9/grade-9-api-en.json",`${JSON.stringify(enEnvelope,null,2)}\n`);await requestContext.close();

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});const desktop=await desktopContext.newPage();await trackLcp(desktop);
  await desktop.goto(`${baseURL}/vi/hoc-theo-lop/9`,{waitUntil:"networkidle"});await expect(desktop.getByRole("heading",{level:1,name:"Lớp 9",exact:true})).toBeVisible();await expect(desktop.locator('.curriculum-requirement[data-coverage-status="VERIFIED"]')).toHaveCount(6);expect(await desktop.locator(".curriculum-coverage-strip strong").allTextContents()).toEqual(["6","6","6"]);
  for(const requirement of viEnvelope.data.requirements)await expect(desktop.locator(".curriculum-requirement-heading").getByRole("heading",{level:3,name:requirement.topic,exact:true})).toBeVisible();
  await desktop.screenshot({path:"artifacts/curriculum/grade-9/grade-9-coverage-desktop.png",fullPage:true});
  const viLesson=viEnvelope.data.requirements.find(({id})=>id==="g9-vietnam-since-1991")!.lessons.find(({id})=>id==="lesson-g9-vietnam-since-1991")!;await openLessonByKeyboard(desktop,viLesson);await expect(desktop).toHaveURL(`${baseURL}/vi/chu-de/${viLesson.slug}`);await expect(desktop.getByRole("heading",{level:1,name:viLesson.title,exact:true})).toBeVisible();await expect(desktop.getByText("11/08/2026",{exact:false}).first()).toBeVisible();await expect(desktop.getByRole("heading",{name:"Luận điểm đã kiểm chứng",exact:true})).toBeVisible();
  const viDetailResponse=await desktop.request.get(`${baseURL}/api/v1/vi/contents/TOPIC/${viLesson.slug}`);expect(viDetailResponse.ok()).toBe(true);const viDetail=(await viDetailResponse.json()).data as DetailView;expect(viDetail).toMatchObject({id:viLesson.id,asOf:"2026-08-11T00:00:00.000Z",reviewedBy:expect.stringContaining("C-031")});expect(viDetail.claims).toHaveLength(2);expect(viDetail.claims.every((claim)=>claim.evidence.length===1&&claim.evidence[0].locator.length>0&&claim.evidence[0].source.verificationStatus==="VERIFIED")).toBe(true);expect(viDetail.sources.some(({year})=>(year??0)>=2025)).toBe(true);expect(viDetail.sources.every(({accessedAt})=>accessedAt==="2026-08-11T00:00:00.000Z")).toBe(true);
  const viSourceLink=desktop.locator(".sources li").first().getByRole("link");await viSourceLink.focus();await expect(viSourceLink).toBeFocused();await expect(viSourceLink).toHaveAttribute("href",viDetail.sources[0].url);const desktopAxe=await blockingAxe(desktop);expect(desktopAxe).toEqual([]);const desktopMetrics=await metrics(desktop);expect(desktopMetrics.scrollWidth).toBe(desktopMetrics.clientWidth);expect(desktopMetrics.lcpMs).toBeGreaterThan(0);expect(desktopMetrics.lcpMs).toBeLessThanOrEqual(2500);await desktop.screenshot({path:"artifacts/curriculum/grade-9/grade-9-desktop.png",fullPage:true});await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});const mobile=await mobileContext.newPage();await trackLcp(mobile);
  await mobile.goto(`${baseURL}/en/learn-by-grade/9`,{waitUntil:"networkidle"});await expect(mobile.getByRole("heading",{level:1,name:"Grade 9",exact:true})).toBeVisible();await expect(mobile.locator('.curriculum-requirement[data-coverage-status="VERIFIED"]')).toHaveCount(6);for(const requirement of enEnvelope.data.requirements)await expect(mobile.locator(".curriculum-requirement-heading").getByRole("heading",{level:3,name:requirement.topic,exact:true})).toBeVisible();await mobile.screenshot({path:"artifacts/curriculum/grade-9/grade-9-coverage-mobile.png",fullPage:true});
  const enLesson=enEnvelope.data.requirements.find(({id})=>id==="g9-world-since-1991")!.lessons.find(({id})=>id==="lesson-g9-world-since-1991")!;await openLessonByKeyboard(mobile,enLesson);await expect(mobile).toHaveURL(`${baseURL}/en/topics/${enLesson.slug}`);await expect(mobile.getByRole("heading",{level:1,name:enLesson.title,exact:true})).toBeVisible();await expect(mobile.getByText("11 August 2026",{exact:false}).first()).toBeVisible();await expect(mobile.getByRole("heading",{name:"Verified claims",exact:true})).toBeVisible();
  const enDetailResponse=await mobile.request.get(`${baseURL}/api/v1/en/contents/TOPIC/${enLesson.slug}`);expect(enDetailResponse.ok()).toBe(true);const enDetail=(await enDetailResponse.json()).data as DetailView;expect(enDetail).toMatchObject({asOf:"2026-08-11T00:00:00.000Z",reviewedBy:expect.stringContaining("C-031")});expect(enDetail.claims).toHaveLength(2);expect(enDetail.sources.every(({verificationStatus})=>verificationStatus==="VERIFIED")).toBe(true);const enSourceLink=mobile.locator(".sources li").first().getByRole("link");await enSourceLink.focus();await expect(enSourceLink).toBeFocused();await expect(enSourceLink).toHaveAttribute("href",enDetail.sources[0].url);const mobileAxe=await blockingAxe(mobile);expect(mobileAxe).toEqual([]);const mobileMetrics=await metrics(mobile);expect(mobileMetrics.scrollWidth).toBe(mobileMetrics.clientWidth);expect(mobileMetrics.lcpMs).toBeGreaterThan(0);expect(mobileMetrics.lcpMs).toBeLessThanOrEqual(2500);await mobile.screenshot({path:"artifacts/curriculum/grade-9/grade-9-mobile.png",fullPage:true});await mobileContext.close();

  const proof={generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,asOf:"2026-08-11T00:00:00.000Z",coverage:{requirements:6,published:6,verified:6,fullCoverage:true,locales:["vi","en"]},desktop:{path:`/vi/chu-de/${viLesson.slug}`,lesson:viLesson.title,claims:viDetail.claims.length,sources:viDetail.sources.length,keyboard:true,metrics:desktopMetrics},mobile:{path:`/en/topics/${enLesson.slug}`,lesson:enLesson.title,claims:enDetail.claims.length,sources:enDetail.sources.length,keyboard:true,metrics:mobileMetrics},accessibility:{desktopCriticalOrSerious:desktopAxe.length,mobileCriticalOrSerious:mobileAxe.length},screenshots:["artifacts/curriculum/grade-9/grade-9-coverage-desktop.png","artifacts/curriculum/grade-9/grade-9-desktop.png","artifacts/curriculum/grade-9/grade-9-coverage-mobile.png","artifacts/curriculum/grade-9/grade-9-mobile.png"]};await writeFile("artifacts/curriculum/grade-9/grade-9-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
