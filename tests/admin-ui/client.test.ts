import { describe,expect,it } from "vitest";
import { AdminRequestError,adminErrorMessage,fieldError,loginFailureMessage } from "@/lib/admin-client/client";
import { canReview,navigationFor,navigationSelected } from "@/lib/admin-client/navigation";

describe("admin client copy and role navigation",()=>{
  it("keeps failed login copy non-enumerating",()=>{
    expect(loginFailureMessage(new AdminRequestError(401,"INVALID_CREDENTIALS","Sai mật khẩu"))).toBe("Thông tin đăng nhập không đúng hoặc tài khoản chưa sẵn sàng.");
    expect(loginFailureMessage(new AdminRequestError(403,"ACCOUNT_DISABLED","Tài khoản bị khóa"))).toBe("Thông tin đăng nhập không đúng hoặc tài khoản chưa sẵn sàng.");
  });
  it("turns stale and publish validation responses into actionable Vietnamese copy",()=>{
    expect(adminErrorMessage(new AdminRequestError(409,"STALE_VERSION","stale"))).toContain("đã được cập nhật ở nơi khác");
    expect(adminErrorMessage(new AdminRequestError(422,"PUBLISH_VALIDATION_FAILED","blocked",{violations:["content requires at least one source"]}))).toContain("content requires at least one source");
  });
  it("maps nested API validation paths back to their visible field",()=>{
    const error=new AdminRequestError(400,"INVALID_INPUT","Dữ liệu không hợp lệ.",{fieldErrors:{"body.translations.vi.title":["Không chấp nhận HTML thô."]}});
    expect(fieldError(error,"title")).toBe("Không chấp nhận HTML thô.");
  });
  it("shows only server-authorized navigation affordances",()=>{
    expect(navigationFor("EDITOR").map(({href})=>href)).not.toContain("/admin/users");
    expect(navigationFor("EDITOR").map(({href})=>href)).not.toContain("/admin/review");
    expect(navigationFor("REVIEWER").map(({href})=>href)).toContain("/admin/review");
    expect(navigationFor("REVIEWER").map(({href})=>href)).not.toContain("/admin/users");
    expect(navigationFor("ADMIN").map(({href})=>href)).toEqual(expect.arrayContaining(["/admin/users","/admin/audit","/admin/review"]));
    expect(canReview("EDITOR")).toBe(false);expect(canReview("REVIEWER")).toBe(true);
  });
  it("selects exactly the current navigation branch",()=>{
    expect(navigationSelected("/admin","/admin")).toBe(true);
    expect(navigationSelected("/admin/audit","/admin")).toBe(false);
    expect(navigationSelected("/admin/contents/example","/admin/contents")).toBe(true);
  });
});
