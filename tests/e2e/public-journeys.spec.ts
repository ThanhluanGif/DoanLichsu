import { expect,test } from "@playwright/test";

test("home to timeline preserves a usable Vietnamese journey",async({page})=>{
  await page.goto("/vi");await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await page.getByRole("link",{name:"Dòng thời gian",exact:true}).click();await expect(page).toHaveURL(/\/vi\/timeline/);
  await expect(page.getByRole("heading",{level:1})).toContainText("Dòng thời gian");
  await page.getByLabel("Thời kỳ",{exact:true}).selectOption("chien-tranh-gianh-doc-lap-va-thong-nhat");
  await page.getByRole("button",{name:"Áp dụng",exact:true}).click();await expect(page).toHaveURL(/period=chien-tranh/);
  await expect(page.getByText("Chiến dịch Điện Biên Phủ",{exact:true}).first()).toBeVisible();
});

test("search state survives history navigation",async({page})=>{
  await page.goto("/vi/tim-kiem");const search=page.getByRole("search");
  await search.getByRole("textbox",{name:"Tìm kiếm",exact:true}).fill("dien bien phu");
  await search.getByRole("combobox",{name:"Loại nội dung",exact:true}).selectOption("EVENT");
  await search.getByRole("combobox",{name:"Thời kỳ",exact:true}).selectOption("chien-tranh-gianh-doc-lap-va-thong-nhat");
  await search.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await page.waitForURL((url)=>url.searchParams.get("q")==="dien bien phu"&&url.searchParams.get("period")==="chien-tranh-gianh-doc-lap-va-thong-nhat");
  await expect(page.getByText("Chiến dịch Điện Biên Phủ",{exact:true}).first()).toBeVisible();
  await search.getByRole("combobox",{name:"Thời kỳ",exact:true}).selectOption("");await search.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await page.waitForURL((url)=>url.searchParams.get("q")==="dien bien phu"&&url.searchParams.get("period")==="");
  await page.goBack();await page.waitForURL((url)=>url.searchParams.get("period")==="chien-tranh-gianh-doc-lap-va-thong-nhat");await expect(search.getByRole("combobox",{name:"Thời kỳ",exact:true})).toHaveValue("chien-tranh-gianh-doc-lap-va-thong-nhat");
  await page.goForward();await page.waitForURL((url)=>url.searchParams.get("period")==="");await expect(search.getByRole("combobox",{name:"Thời kỳ",exact:true})).toHaveValue("");
});

test("detail copies canonical URL, switches locale and fits mobile",async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},permissions:["clipboard-read","clipboard-write"]});const page=await context.newPage();
  await page.goto(`${baseURL}/vi/su-kien/chien-dich-dien-bien-phu`);await expect(page.getByRole("heading",{name:"Chiến dịch Điện Biên Phủ",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Sao chép liên kết",exact:true}).click();await expect(page.getByRole("button",{name:"Đã sao chép",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(page.url());
  expect(await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}))).toEqual({client:390,scroll:390});
  await page.getByRole("link",{name:"Đọc bản tiếng Anh",exact:true}).first().click();await expect(page).toHaveURL(/\/en\/events\/battle-of-dien-bien-phu$/);
  await context.close();
});
