import { afterEach,describe,expect,it } from "vitest";
import { readFileSync } from "node:fs";
import type { ContentListItem } from "@/lib/content/types";
import { buildSitemap } from "@/app/sitemap";

const item=(locale:"vi"|"en",slug:string):ContentListItem=>({id:`event-${locale}`,type:"EVENT",locale,title:slug,slug,summary:"summary",thumbnail:null,startDate:"1954-03-13",endDate:"1954-05-07",datePrecision:"DAY",period:null,tags:[]});

describe("public sitemap",()=>{
  const prior=process.env.APP_ORIGIN;
  afterEach(()=>{if(prior===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=prior;});
  it("contains canonical pages only, never JSON or admin URLs",()=>{
    process.env.APP_ORIGIN="https://history.example";
    const entries=buildSitemap({vi:[item("vi","chien-dich-dien-bien-phu")],en:[item("en","battle-of-dien-bien-phu")]});
    const urls=entries.map(({url})=>url);
    expect(urls).toEqual(expect.arrayContaining([
      "https://history.example/vi","https://history.example/en","https://history.example/vi/timeline","https://history.example/en/timeline",
      "https://history.example/vi/su-kien/chien-dich-dien-bien-phu","https://history.example/en/events/battle-of-dien-bien-phu",
    ]));
    expect(urls.join("\n")).not.toMatch(/\/api\/|\/admin|\.json/);
  });

  it("keeps the live contents request within the API page-size limit",()=>{
    const source=readFileSync(new URL("../../src/app/sitemap.ts",import.meta.url),"utf8");
    expect(source).toContain('pageSize:"50"');
    expect(source).not.toContain('pageSize:"100"');
  });
});
