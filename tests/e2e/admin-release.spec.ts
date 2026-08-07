import { expect,test } from "@playwright/test";
import { login,releaseOrigin } from "./support";

test("editor to reviewer to public release with negative RBAC",async({browser})=>{
  const suffix=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;const viSlug=`release-proof-${suffix}`;const enSlug=`release-proof-en-${suffix}`;
  const editorContext=await browser.newContext({baseURL:releaseOrigin()});const editor=await editorContext.newPage();await login(editor,"EDITOR");
  await editor.goto("/admin/contents/new");await editor.getByLabel("Tiêu đề",{exact:true}).fill(`Bằng chứng release ${suffix}`);
  await editor.getByLabel("Slug",{exact:true}).fill(viSlug);await editor.getByLabel("Tóm tắt",{exact:true}).fill("Bản ghi E2E cho release có thể phục hồi.");
  await editor.getByLabel("Nội dung",{exact:true}).fill("Nội dung được tạo, kiểm duyệt và xuất bản hoàn toàn qua trình duyệt trên HTTPS.");
  await editor.getByRole("button",{name:"Tạo bản nháp",exact:true}).click();await editor.waitForURL((url)=>url.pathname.startsWith("/admin/contents/")&&url.pathname!=="/admin/contents/new");const editorUrl=editor.url();const id=editorUrl.split("/").at(-1)!;
  await editor.getByRole("tab",{name:"English",exact:true}).click();await editor.getByLabel("Title",{exact:true}).fill(`Release proof ${suffix}`);
  await editor.getByLabel("Slug",{exact:true}).fill(enSlug);await editor.getByLabel("Summary",{exact:true}).fill("Recoverable release E2E record.");
  await editor.getByLabel("Body",{exact:true}).fill("Created, reviewed, and published through the HTTPS browser journey.");
  await editor.getByRole("button",{name:"Lưu bản EN",exact:true}).click();await expect(editor.getByText("Đã lưu bản EN.",{exact:false})).toBeVisible();
  const sourceColumn=editor.locator(".attachment-columns > div").first();await sourceColumn.getByText("+ Thêm nguồn",{exact:true}).click();
  await sourceColumn.getByLabel("Tiêu đề",{exact:true}).fill(`Nguồn release ${suffix}`);await sourceColumn.getByLabel("URL HTTPS",{exact:true}).fill(`https://example.com/${viSlug}`);
  await sourceColumn.getByLabel("Ngày truy cập",{exact:true}).fill("2026-08-07T12:00");await sourceColumn.getByRole("button",{name:"Tạo và gắn nguồn",exact:true}).click();await expect(editor.getByText("Đã tạo và gắn nguồn.",{exact:false})).toBeVisible();
  const mediaColumn=editor.locator(".attachment-columns > div").last();await mediaColumn.getByText("+ Thêm media",{exact:true}).click();
  await mediaColumn.getByLabel("URL HTTPS",{exact:true}).fill(`https://example.com/${viSlug}.jpg`);await mediaColumn.getByLabel("Ghi công",{exact:true}).fill("Release E2E");
  await mediaColumn.getByLabel("Giấy phép",{exact:true}).fill("CC BY 4.0");await mediaColumn.getByLabel("Alt VI",{exact:true}).fill("Ảnh kiểm tra release");await mediaColumn.getByLabel("Alt EN",{exact:true}).fill("Release proof image");
  await mediaColumn.getByRole("button",{name:"Tạo và gắn media",exact:true}).click();await expect(editor.getByText("Đã tạo và gắn media.",{exact:false})).toBeVisible();
  await editor.getByRole("button",{name:"Xem trước",exact:true}).click();await expect(editor.getByRole("dialog")).toBeVisible();await editor.getByRole("button",{name:"Đóng",exact:true}).click();
  const deniedPublish=await editor.evaluate(async({id,origin})=>(await fetch(`/api/v1/admin/contents/${id}/publish`,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json",origin},body:JSON.stringify({version:4,locales:["vi"]})})).status,{id,origin:releaseOrigin()});expect(deniedPublish).toBe(403);
  await editor.getByRole("button",{name:"Gửi duyệt",exact:true}).click();await expect(editor.getByText("Đã gửi nội dung tới danh sách chờ duyệt.",{exact:false})).toBeVisible();

  const reviewerContext=await browser.newContext({baseURL:releaseOrigin()});const reviewer=await reviewerContext.newPage();await login(reviewer,"REVIEWER");await expect(reviewer.getByText("REVIEWER",{exact:true}).first()).toBeVisible();
  const deniedUsers=await reviewer.evaluate(async()=>(await fetch("/api/v1/admin/users",{credentials:"same-origin"})).status);expect(deniedUsers).toBe(403);await reviewer.goto(new URL(editorUrl).pathname);await expect(reviewer.getByText("REVIEWER",{exact:true}).first()).toBeVisible();
  await reviewer.getByLabel("Lý do trả lại",{exact:true}).fill("Làm rõ kết luận trước khi phát hành.");await reviewer.getByRole("button",{name:"Trả lại",exact:true}).click();await expect(reviewer.getByText("Đã trả nội dung cho Editor.",{exact:false})).toBeVisible();
  await editor.reload();await editor.locator(".translation-form textarea").nth(1).fill("Nội dung E2E đã được sửa theo phản hồi kiểm duyệt trước khi xuất bản.");
  await editor.getByRole("button",{name:"Lưu bản VI",exact:true}).click();await expect(editor.getByText("Đã lưu bản VI.",{exact:false})).toBeVisible();await editor.getByRole("button",{name:"Gửi duyệt",exact:true}).click();await expect(editor.getByText("Đã gửi nội dung tới danh sách chờ duyệt.",{exact:false})).toBeVisible();
  await reviewer.reload();await reviewer.getByRole("button",{name:"Duyệt nội dung",exact:true}).click();await expect(reviewer.getByText("Đã duyệt nội dung.",{exact:false})).toBeVisible();
  await reviewer.getByRole("button",{name:"Xuất bản",exact:true}).click();await expect(reviewer.getByText("Đã xuất bản nội dung.",{exact:false})).toBeVisible();
  const publicHref=await reviewer.getByRole("link",{name:"Mở trang công khai",exact:true}).getAttribute("href");expect(publicHref).toBe(`/vi/su-kien/${viSlug}`);
  const publicPage=await reviewerContext.newPage();await publicPage.goto(publicHref!);await expect(publicPage.getByRole("heading",{name:`Bằng chứng release ${suffix}`,exact:true})).toBeVisible();
  await editorContext.close();await reviewerContext.close();
});
