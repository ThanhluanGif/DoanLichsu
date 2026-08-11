import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect,test,type Page } from "@playwright/test";

type FacetOption={value:string;label:string;publishedCount:number;verifiedCount:number};
type FacetView={grades:FacetOption[];topics:FacetOption[];periods:FacetOption[];tags:FacetOption[];types:FacetOption[]};
type ListEnvelope={data:Array<{id:string}>;meta:{page:number;pageSize:number;total:number;totalPages:number}};
const axePath=resolve("node_modules/axe-core/axe.min.js");

async function json<T>(page:Page,url:string):Promise<T>{
  const response=await page.request.get(url);
  expect(response.ok(),`${url} returned ${response.status()}`).toBe(true);
  return response.json() as Promise<T>;
}

async function facetView(page:Page,baseURL:string,locale:"vi"|"en",values:Record<string,string>){
  const query=new URLSearchParams(values);
  return (await json<{data:FacetView}>(page,`${baseURL}/api/v1/${locale}/taxonomies?${query}`)).data;
}

function assertPositiveFacets(facets:FacetView,curriculum:boolean){
  if(curriculum){expect(facets.grades.length).toBeGreaterThan(0);expect(facets.topics.length).toBeGreaterThan(0);}
  else{expect(facets.grades).toEqual([]);expect(facets.topics).toEqual([]);}
  for(const group of [facets.grades,facets.topics,facets.periods,facets.tags,facets.types]){
    expect(group.every((option)=>option.publishedCount>0&&option.verifiedCount===0)).toBe(true);
  }
}

async function blockingAxe(page:Page){
  await page.addScriptTag({path:axePath});
  return page.evaluate(async()=>{
    const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:Array<{id:string;impact:string|null}>}>}}).axe;
    const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});
    return result.violations.filter(({impact})=>impact==="critical"||impact==="serious");
  });
}

async function viewport(page:Page){
  return page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
}

async function tabTo(page:Page,selector:string){
  for(let step=0;step<120;step+=1){
    await page.keyboard.press("Tab");
    if(await page.evaluate((candidate)=>document.activeElement instanceof HTMLElement&&document.activeElement.matches(candidate),selector))return;
  }
  throw new Error(`Keyboard could not reach ${selector}`);
}

async function chooseFirstOptionByKeyboard(page:Page,selector:string){
  await tabTo(page,selector);
  const label=(await page.locator(`${selector} option:not([value=''])`).first().textContent())?.trim();
  if(!label)throw new Error(`No public option for ${selector}`);
  await page.keyboard.press(label[0]);
  const value=await page.locator(selector).inputValue();
  expect(value).not.toBe("");
  return value;
}

async function chooseValueByKeyboard(page:Page,selector:string,value:string){
  const label=await page.locator(`${selector} option`).evaluateAll((options,target)=>{
    const option=options.find((candidate)=>(candidate as HTMLOptionElement).value===target);
    return option?.textContent?.trim()??"";
  },value);
  if(!label)throw new Error(`No ${value} option for ${selector}`);
  await tabTo(page,selector);
  await page.keyboard.press(label[0]);
  await expect(page.locator(selector)).toHaveValue(value);
}

async function copyCurrentUrl(page:Page,label:"Sao chép liên kết"|"Copy link"){
  await tabTo(page,"button.copy-link");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button",{name:label==="Copy link"?"Copied":"Đã sao chép",exact:true})).toBeVisible();
  const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
  expect(clipboard).toBe(page.url());
  return clipboard;
}

async function copyCurrentUrlByKeyboard(page:Page){
  return copyCurrentUrl(page,"Copy link");
}

test("contextual facets keep collection, timeline and search URLs restorable",async({browser,baseURL})=>{
  test.setTimeout(240_000);
  if(!baseURL)throw new Error("baseURL is required");
  await mkdir("artifacts/contextual-facets",{recursive:true});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},permissions:["clipboard-read","clipboard-write"]});
  const desktop=await desktopContext.newPage();

  const collectionFacets=await facetView(desktop,baseURL,"vi",{scope:"contents",type:"EVENT"});
  const timelineFacets=await facetView(desktop,baseURL,"vi",{scope:"timeline"});
  const searchFacets=await facetView(desktop,baseURL,"vi",{scope:"search",q:"dien bien phu"});
  assertPositiveFacets(collectionFacets,true);
  assertPositiveFacets(timelineFacets,false);
  assertPositiveFacets(searchFacets,true);
  expect(collectionFacets.periods.length).toBeGreaterThan(0);
  expect(timelineFacets.periods.length).toBeGreaterThan(0);
  expect(searchFacets.types.length).toBeGreaterThan(0);

  let selectedPeriod:FacetOption|undefined;
  let selectedTag:FacetOption|undefined;
  let selectedContextFacets:FacetView|undefined;
  for(const period of collectionFacets.periods){
    const context=await facetView(desktop,baseURL,"vi",{scope:"contents",type:"EVENT",period:period.value});
    if(context.tags.length){selectedPeriod=period;selectedTag=context.tags[0];selectedContextFacets=context;break;}
  }
  if(!selectedPeriod||!selectedTag||!selectedContextFacets)throw new Error("Seed needs one EVENT period with a tag");

  await desktop.goto(`${baseURL}/vi/su-kien`,{waitUntil:"networkidle"});
  const visiblePeriodValues=await desktop.locator("#collection-period option:not([value=''])").evaluateAll((options)=>options.map((option)=>(option as HTMLOptionElement).value));
  expect(visiblePeriodValues).toEqual(collectionFacets.periods.map((option)=>option.value));
  await chooseValueByKeyboard(desktop,"#collection-period",selectedPeriod.value);
  await tabTo(desktop,"form.collection-filter button[type='submit']");
  await desktop.keyboard.press("Enter");
  await desktop.waitForURL((url)=>url.searchParams.get("period")===selectedPeriod!.value);
  const periodUrl=desktop.url();
  await expect(desktop.locator(".collection-grid .content-card")).toHaveCount(Math.min(12,selectedPeriod.publishedCount));
  await chooseValueByKeyboard(desktop,"#collection-tag",selectedTag.value);
  await tabTo(desktop,"form.collection-filter button[type='submit']");
  await desktop.keyboard.press("Enter");
  await desktop.waitForURL((url)=>url.searchParams.get("period")===selectedPeriod!.value&&url.searchParams.get("tag")===selectedTag!.value);
  const collectionUrl=desktop.url();
  const collectionResult=await json<ListEnvelope>(desktop,`${baseURL}/api/v1/vi/contents?type=EVENT&period=${encodeURIComponent(selectedPeriod.value)}&tag=${encodeURIComponent(selectedTag.value)}&pageSize=12`);
  expect(collectionResult.meta.total).toBe(selectedTag.publishedCount);
  await expect(desktop.locator(".collection-grid .content-card")).toHaveCount(collectionResult.data.length);
  await desktop.goBack({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(periodUrl);
  await expect(desktop.locator("#collection-period")).toHaveValue(selectedPeriod.value);
  await expect(desktop.locator("#collection-tag")).toHaveValue("");
  await desktop.goForward({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(collectionUrl);
  await expect(desktop.locator("#collection-tag")).toHaveValue(selectedTag.value);
  const collectionClipboard=await copyCurrentUrl(desktop,"Sao chép liên kết");
  const restored=await desktopContext.newPage();
  await restored.goto(collectionClipboard,{waitUntil:"networkidle"});
  await expect(restored.locator("#collection-period")).toHaveValue(selectedPeriod.value);
  await expect(restored.locator("#collection-tag")).toHaveValue(selectedTag.value);
  await expect(restored.locator(".collection-grid .content-card")).toHaveCount(collectionResult.data.length);
  await restored.close();
  const desktopCollectionAxe=await blockingAxe(desktop);
  const desktopCollectionViewport=await viewport(desktop);
  await desktop.emulateMedia({reducedMotion:"reduce"});
  await desktop.screenshot({path:"artifacts/contextual-facets/contextual-facets-desktop.png",fullPage:true});

  const timelinePeriod=timelineFacets.periods[0];
  await desktop.goto(`${baseURL}/vi/timeline`,{waitUntil:"networkidle"});
  const timelineBaseUrl=desktop.url();
  await chooseValueByKeyboard(desktop,"#period-filter",timelinePeriod.value);
  await tabTo(desktop,"form.timeline-filter button[type='submit']");
  await desktop.keyboard.press("Enter");
  await desktop.waitForURL((url)=>url.searchParams.get("period")===timelinePeriod.value);
  const timelineUrl=desktop.url();
  const timelineResult=await json<ListEnvelope>(desktop,`${baseURL}/api/v1/vi/timeline?period=${encodeURIComponent(timelinePeriod.value)}&pageSize=12`);
  expect(timelineResult.meta.total).toBe(timelinePeriod.publishedCount);
  await expect(desktop.locator(".timeline-entry")).toHaveCount(timelineResult.data.length);
  await desktop.goBack({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(timelineBaseUrl);
  await expect(desktop.locator("#period-filter")).toHaveValue("");
  await desktop.goForward({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(timelineUrl);
  await expect(desktop.locator("#period-filter")).toHaveValue(timelinePeriod.value);
  const timelineClipboard=await copyCurrentUrl(desktop,"Sao chép liên kết");
  const restoredTimeline=await desktopContext.newPage();
  await restoredTimeline.goto(timelineClipboard,{waitUntil:"networkidle"});
  await expect(restoredTimeline.locator("#period-filter")).toHaveValue(timelinePeriod.value);
  await expect(restoredTimeline.locator(".timeline-entry")).toHaveCount(timelineResult.data.length);
  await restoredTimeline.close();
  const desktopTimelineAxe=await blockingAxe(desktop);
  const desktopTimelineViewport=await viewport(desktop);

  await desktop.goto(`${baseURL}/vi/tim-kiem`,{waitUntil:"networkidle"});
  const search=desktop.getByRole("search");
  await tabTo(desktop,"#public-search");
  await desktop.keyboard.type("dien bien phu");
  await tabTo(desktop,"form.search-form button[type='submit']");
  await desktop.keyboard.press("Enter");
  await desktop.waitForURL((url)=>url.searchParams.get("q")==="dien bien phu"&&!url.searchParams.has("type"));
  const queryOnlyUrl=desktop.url();
  const searchType=searchFacets.types[0];
  await chooseValueByKeyboard(desktop,"form.search-form select[name='type']",searchType.value);
  await tabTo(desktop,"form.search-form button[type='submit']");
  await desktop.keyboard.press("Enter");
  await desktop.waitForURL((url)=>url.searchParams.get("type")===searchType.value);
  const searchUrl=desktop.url();
  const searchResult=await json<ListEnvelope>(desktop,`${baseURL}/api/v1/vi/search?q=dien%20bien%20phu&type=${searchType.value}&pageSize=10`);
  expect(searchResult.meta.total).toBe(searchType.publishedCount);
  await expect(desktop.locator(".result-list .content-card")).toHaveCount(searchResult.data.length);
  await desktop.goBack({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(queryOnlyUrl);
  await expect(search.getByRole("combobox",{name:"Loại nội dung",exact:true})).toHaveValue("");
  await desktop.goForward({waitUntil:"networkidle"});
  expect(desktop.url()).toBe(searchUrl);
  await expect(search.getByRole("combobox",{name:"Loại nội dung",exact:true})).toHaveValue(searchType.value);
  const searchClipboard=await copyCurrentUrl(desktop,"Sao chép liên kết");
  const restoredSearch=await desktopContext.newPage();
  await restoredSearch.goto(searchClipboard,{waitUntil:"networkidle"});
  await expect(restoredSearch.locator("#public-search")).toHaveValue("dien bien phu");
  await expect(restoredSearch.locator("form.search-form select[name='type']")).toHaveValue(searchType.value);
  await expect(restoredSearch.locator(".result-list .content-card")).toHaveCount(searchResult.data.length);
  await restoredSearch.close();
  const desktopSearchAxe=await blockingAxe(desktop);
  const desktopSearchViewport=await viewport(desktop);
  await desktopContext.close();

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},permissions:["clipboard-read","clipboard-write"],reducedMotion:"reduce"});
  const mobile=await mobileContext.newPage();
  await mobile.goto(`${baseURL}/en/events`,{waitUntil:"networkidle"});
  const mobileCollectionBaseUrl=mobile.url();
  const mobileCollectionPeriod=await chooseFirstOptionByKeyboard(mobile,"#collection-period");
  await tabTo(mobile,"form.collection-filter button[type='submit']");
  await mobile.keyboard.press("Enter");
  await mobile.waitForURL((url)=>url.searchParams.get("period")===mobileCollectionPeriod);
  const mobileCollectionUrl=mobile.url();
  const mobileCollectionResult=await json<ListEnvelope>(mobile,`${baseURL}/api/v1/en/contents?type=EVENT&period=${encodeURIComponent(mobileCollectionPeriod)}&pageSize=12`);
  await expect(mobile.locator(".collection-grid .content-card")).toHaveCount(mobileCollectionResult.data.length);
  await mobile.goBack({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileCollectionBaseUrl);
  await expect(mobile.locator("#collection-period")).toHaveValue("");
  await mobile.goForward({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileCollectionUrl);
  await expect(mobile.locator("#collection-period")).toHaveValue(mobileCollectionPeriod);
  const mobileCollectionClipboard=await copyCurrentUrlByKeyboard(mobile);
  const restoredMobileCollection=await mobileContext.newPage();
  await restoredMobileCollection.goto(mobileCollectionClipboard,{waitUntil:"networkidle"});
  await expect(restoredMobileCollection.locator("#collection-period")).toHaveValue(mobileCollectionPeriod);
  await expect(restoredMobileCollection.locator(".collection-grid .content-card")).toHaveCount(mobileCollectionResult.data.length);
  await restoredMobileCollection.close();
  const mobileCollectionAxe=await blockingAxe(mobile);
  const mobileCollectionViewport=await viewport(mobile);

  await mobile.goto(`${baseURL}/en/timeline`,{waitUntil:"networkidle"});
  const mobileTimelineBaseUrl=mobile.url();
  const mobileTimelinePeriod=await chooseFirstOptionByKeyboard(mobile,"#period-filter");
  await tabTo(mobile,"form.timeline-filter button[type='submit']");
  await mobile.keyboard.press("Enter");
  await mobile.waitForURL((url)=>url.searchParams.get("period")===mobileTimelinePeriod);
  const mobileTimelineUrl=mobile.url();
  const mobileTimelineResult=await json<ListEnvelope>(mobile,`${baseURL}/api/v1/en/timeline?period=${encodeURIComponent(mobileTimelinePeriod)}&pageSize=12`);
  await expect(mobile.locator(".timeline-entry")).toHaveCount(mobileTimelineResult.data.length);
  await mobile.goBack({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileTimelineBaseUrl);
  await expect(mobile.locator("#period-filter")).toHaveValue("");
  await mobile.goForward({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileTimelineUrl);
  await expect(mobile.locator("#period-filter")).toHaveValue(mobileTimelinePeriod);
  const mobileTimelineClipboard=await copyCurrentUrlByKeyboard(mobile);
  const restoredMobileTimeline=await mobileContext.newPage();
  await restoredMobileTimeline.goto(mobileTimelineClipboard,{waitUntil:"networkidle"});
  await expect(restoredMobileTimeline.locator("#period-filter")).toHaveValue(mobileTimelinePeriod);
  await expect(restoredMobileTimeline.locator(".timeline-entry")).toHaveCount(mobileTimelineResult.data.length);
  await restoredMobileTimeline.close();
  const mobileTimelineAxe=await blockingAxe(mobile);
  const mobileTimelineViewport=await viewport(mobile);

  await mobile.goto(`${baseURL}/en/search`,{waitUntil:"networkidle"});
  await tabTo(mobile,"#public-search");
  await mobile.keyboard.type("dien bien phu");
  await tabTo(mobile,"form.search-form button[type='submit']");
  await mobile.keyboard.press("Enter");
  await mobile.waitForURL((url)=>url.searchParams.get("q")==="dien bien phu"&&!url.searchParams.has("type"));
  const mobileQueryUrl=mobile.url();
  const mobileType=await chooseFirstOptionByKeyboard(mobile,"form.search-form select[name='type']");
  await tabTo(mobile,"form.search-form button[type='submit']");
  await mobile.keyboard.press("Enter");
  await mobile.waitForURL((url)=>url.searchParams.get("type")===mobileType);
  const mobileSearchUrl=mobile.url();
  await mobile.goBack({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileQueryUrl);
  await expect(mobile.locator("form.search-form select[name='type']")).toHaveValue("");
  await mobile.goForward({waitUntil:"networkidle"});
  expect(mobile.url()).toBe(mobileSearchUrl);
  await expect(mobile.locator("form.search-form select[name='type']")).toHaveValue(mobileType);
  await tabTo(mobile,"button.copy-link");
  await mobile.keyboard.press("Enter");
  await expect(mobile.getByRole("button",{name:"Copied",exact:true})).toBeVisible();
  const mobileClipboard=await mobile.evaluate(()=>navigator.clipboard.readText());
  expect(mobileClipboard).toBe(mobile.url());
  const mobileSearchResult=await json<ListEnvelope>(mobile,`${baseURL}/api/v1/en/search?q=dien%20bien%20phu&type=${encodeURIComponent(mobileType)}&pageSize=10`);
  const restoredMobileSearch=await mobileContext.newPage();
  await restoredMobileSearch.goto(mobileClipboard,{waitUntil:"networkidle"});
  await expect(restoredMobileSearch.locator("#public-search")).toHaveValue("dien bien phu");
  await expect(restoredMobileSearch.locator("form.search-form select[name='type']")).toHaveValue(mobileType);
  await expect(restoredMobileSearch.locator(".result-list .content-card")).toHaveCount(mobileSearchResult.data.length);
  await restoredMobileSearch.close();
  const mobileCardLayout=await mobile.locator(".result-list .content-card").first().evaluate((card)=>{
    const art=card.querySelector<HTMLElement>(".content-card-art")?.getBoundingClientRect();
    const copy=card.querySelector<HTMLElement>(".content-card-copy")?.getBoundingClientRect();
    const bounds=card.getBoundingClientRect();
    if(!art||!copy)throw new Error("Search result card layout is incomplete");
    return{artRight:art.right,copyLeft:copy.left,copyRight:copy.right,cardRight:bounds.right};
  });
  expect(mobileCardLayout.artRight).toBeLessThanOrEqual(mobileCardLayout.copyLeft+1);
  expect(mobileCardLayout.copyRight).toBeLessThanOrEqual(mobileCardLayout.cardRight+1);
  const mobileSearchAxe=await blockingAxe(mobile);
  const mobileSearchViewport=await viewport(mobile);
  await mobile.screenshot({path:"artifacts/contextual-facets/contextual-facets-mobile.png",fullPage:true});
  await mobileContext.close();

  for(const axe of [desktopCollectionAxe,desktopTimelineAxe,desktopSearchAxe,mobileCollectionAxe,mobileTimelineAxe,mobileSearchAxe])expect(axe).toEqual([]);
  for(const measured of [desktopCollectionViewport,desktopTimelineViewport,desktopSearchViewport,mobileCollectionViewport,mobileTimelineViewport,mobileSearchViewport])expect(measured.scrollWidth).toBe(measured.clientWidth);
  const proof={
    generatedAt:new Date().toISOString(),url:new URL(baseURL).origin,
    api:{collection:{periods:collectionFacets.periods,tags:collectionFacets.tags,types:collectionFacets.types,selectedContext:{period:selectedPeriod.value,tags:selectedContextFacets.tags,selectedTag,consumerTotal:collectionResult.meta.total}},timeline:{periods:timelineFacets.periods,selected:{option:timelinePeriod,consumerTotal:timelineResult.meta.total}},search:{types:searchFacets.types,selected:{option:searchType,consumerTotal:searchResult.meta.total}},gradeTopicStub:{grades:collectionFacets.grades,topics:collectionFacets.topics}},
    desktopKeyboardOnly:{collection:{periodUrl,filteredUrl:collectionUrl,clipboard:collectionClipboard,backForward:true,restored:true,axeCriticalOrSerious:desktopCollectionAxe.length,viewport:desktopCollectionViewport},timeline:{baseUrl:timelineBaseUrl,filteredUrl:timelineUrl,clipboard:timelineClipboard,backForward:true,restored:true,axeCriticalOrSerious:desktopTimelineAxe.length,viewport:desktopTimelineViewport},search:{queryOnlyUrl,filteredUrl:searchUrl,clipboard:searchClipboard,backForward:true,restored:true,axeCriticalOrSerious:desktopSearchAxe.length,viewport:desktopSearchViewport},journey:"Tab, native type-to-select, Enter only"},
    mobileKeyboardOnly:{collection:{baseUrl:mobileCollectionBaseUrl,filteredUrl:mobileCollectionUrl,clipboard:mobileCollectionClipboard,backForward:true,restored:true,axeCriticalOrSerious:mobileCollectionAxe.length,viewport:mobileCollectionViewport},timeline:{baseUrl:mobileTimelineBaseUrl,filteredUrl:mobileTimelineUrl,clipboard:mobileTimelineClipboard,backForward:true,restored:true,axeCriticalOrSerious:mobileTimelineAxe.length,viewport:mobileTimelineViewport},search:{queryOnlyUrl:mobileQueryUrl,filteredUrl:mobileSearchUrl,type:mobileType,backForward:true,clipboard:mobileClipboard,restored:true,cardLayout:mobileCardLayout,axeCriticalOrSerious:mobileSearchAxe.length,viewport:mobileSearchViewport},journey:"Tab, native type-to-select, Enter only"},
    screenshots:["artifacts/contextual-facets/contextual-facets-desktop.png","artifacts/contextual-facets/contextual-facets-mobile.png"],
  };
  await writeFile("artifacts/contextual-facets/contextual-facets-proof.json",`${JSON.stringify(proof,null,2)}\n`);
});
