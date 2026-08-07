import { expect,type Page } from "@playwright/test";

type Role="ADMIN"|"EDITOR"|"REVIEWER";
function required(name:string){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is required for release E2E.`);return value;}
export function credentials(role:Role){return {email:required(`E2E_${role}_EMAIL`),password:required(`E2E_${role}_PASSWORD`)};}
export async function login(page:Page,role:Role){
  const account=credentials(role);await page.goto("/admin/login");
  await page.getByLabel("Email",{exact:true}).fill(account.email);await page.getByLabel("Mật khẩu",{exact:true}).fill(account.password);
  await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
}
export function releaseOrigin(){const value=required("E2E_BASE_URL");return new URL(value).origin;}
