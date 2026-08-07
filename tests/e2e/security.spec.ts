import { expect,test } from "@playwright/test";

test("HTTPS responses expose the release security headers",async({request,baseURL})=>{
  expect(new URL(baseURL!).protocol).toBe(process.env.ALLOW_HTTP_E2E==="1"?"http:":"https:");
  for(const path of ["/vi","/admin/login","/api/v1/vi/search?q=dien%20bien%20phu"]){const response=await request.get(path);expect(response.ok()).toBe(true);const headers=response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");expect(headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(headers["x-content-type-options"]).toBe("nosniff");expect(headers["x-frame-options"]).toBe("DENY");expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");expect(headers["permissions-policy"]).toContain("camera=()");
  }
});
