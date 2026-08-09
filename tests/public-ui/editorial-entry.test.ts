import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const shell=readFileSync(new URL("../../src/components/public/PublicShell.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../src/app/globals.css",import.meta.url),"utf8");

describe("public editorial entry",()=>{
  it("keeps one localized internal sign-in entry in the public footer",()=>{
    expect(shell.match(/href="\/admin\/login"/g)).toHaveLength(1);
    expect(shell).toContain("Đăng nhập không gian biên tập");expect(shell).toContain("Sign in to the editorial workspace");
    expect(shell).toContain("Tài khoản do quản trị viên cấp; không có đăng ký công khai.");
    expect(shell).toContain("Accounts are issued by an administrator; public registration is not available.");
  });

  it("does not add public registration or change the primary navigation",()=>{
    expect(shell).not.toMatch(/href=["'{`]\/?(?:admin\/)?(?:register|signup|sign-up)/i);
    expect(shell).toContain('<nav className="primary-nav"');
    const navigation=shell.slice(shell.indexOf('<nav className="primary-nav"'),shell.indexOf("</nav>")+6);expect(navigation).not.toContain("/admin/login");
    expect(css).toContain(".footer-editorial");expect(css).toContain("border-top: 1px solid var(--border)");
    expect(css).not.toMatch(/\.footer-editorial[^}]*gradient/);
  });
});
