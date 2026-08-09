"use client";

import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { createContext,useCallback,useContext,useEffect,useState } from "react";
import { adminGet,adminSend,AdminRequestError,data } from "@/lib/admin-client/client";
import { navigationFor,navigationSelected } from "@/lib/admin-client/navigation";
import type { AuthUser,DataResponse } from "@/lib/admin-client/types";
import { BrandMark } from "@/components/BrandMark";

type AdminContextValue={user:AuthUser;refreshUser:()=>Promise<void>};
const AdminContext=createContext<AdminContextValue|null>(null);
export function useAdmin(){const value=useContext(AdminContext);if(!value)throw new Error("Admin context is unavailable");return value;}

export function AdminShell({children}:{children:React.ReactNode}){
  const pathname=usePathname();const router=useRouter();const login=pathname==="/admin/login";
  const [user,setUser]=useState<AuthUser|null>(null);const [loading,setLoading]=useState(!login);const [message,setMessage]=useState("");
  const refreshUser=useCallback(async()=>{try{const next=data(await adminGet<DataResponse<AuthUser>>("/api/v1/auth/me"));setUser(next);setMessage("");if(login)router.replace("/admin");}catch(error){setUser(null);if(!login){if(error instanceof AdminRequestError&&error.status===401)router.replace("/admin/login");else setMessage("Không thể mở không gian biên tập.");}}finally{setLoading(false);}},[login,router]);
  useEffect(()=>{const timer=window.setTimeout(()=>{if(!login)void refreshUser();},0);const verify=()=>{if(!login)void refreshUser();};window.addEventListener("pageshow",verify);return()=>{window.clearTimeout(timer);window.removeEventListener("pageshow",verify);};},[login,refreshUser]);
  if(login)return <>{children}</>;
  if(loading)return <main className="admin-state" aria-live="polite"><p>Đang kiểm tra phiên đăng nhập…</p></main>;
  if(!user)return <main className="admin-state" aria-live="assertive"><p>{message||"Đang chuyển tới trang đăng nhập…"}</p></main>;
  const links=navigationFor(user.role);
  return <AdminContext.Provider value={{user,refreshUser}}><div className="admin-app">
    <a className="skip-link" href="#admin-main">Chuyển đến nội dung</a>
    <aside className="admin-sidebar"><Link className="admin-logo" href="/admin"><BrandMark/><strong>Không gian biên tập</strong></Link>
      <nav aria-label="Điều hướng biên tập">{links.map((item)=><Link className={navigationSelected(pathname,item.href)?"selected":""} href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      <div className="admin-account"><span className="admin-avatar" aria-hidden="true">{user.displayName.split(/\s+/).map((part)=>part[0]).slice(-2).join("")}</span><span><strong>{user.displayName}</strong><small>{user.role}</small></span><button type="button" onClick={async()=>{try{await adminSend("/api/v1/auth/logout","POST");}finally{window.location.replace("/admin/login");}}}>Đăng xuất</button></div>
    </aside>
    <div className="admin-workspace"><header className="admin-mobile-header"><strong>Quân Sử Việt</strong><span>{user.role}</span></header><main id="admin-main">{children}</main></div>
  </div></AdminContext.Provider>;
}
