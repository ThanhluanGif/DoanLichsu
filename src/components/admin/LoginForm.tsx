"use client";

import { useState } from "react";
import { adminSend,data,loginFailureMessage } from "@/lib/admin-client/client";
import type { AuthUser,DataResponse } from "@/lib/admin-client/types";

export function LoginForm(){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  return <main className="login-page"><section className="login-card" aria-labelledby="login-title"><div className="login-brand"><span aria-hidden="true">QS</span><p>Quân Sử Việt</p></div><p className="eyebrow">Không gian biên tập</p><h1 id="login-title">Đăng nhập để tiếp tục</h1><p className="login-lead">Dùng tài khoản được phân quyền để soạn, kiểm duyệt hoặc quản trị kho tư liệu.</p>
    <form onSubmit={async(event)=>{
      event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget);
      try{const response=await adminSend<DataResponse<AuthUser>>("/api/v1/auth/login","POST",{email:String(form.get("email")||""),password:String(form.get("password")||"")});data(response);window.location.replace("/admin");}
      catch(error){setMessage(loginFailureMessage(error));setBusy(false);}
    }}>
      <label>Email<input name="email" type="email" autoComplete="username" required/></label>
      <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" minLength={12} required/></label>
      {message?<p className="form-alert" role="alert">{message}</p>:null}
      <button className="button primary" type="submit" disabled={busy}>{busy?"Đang đăng nhập…":"Đăng nhập"}</button>
    </form><p className="login-note">Thông báo lỗi không xác nhận một email có tồn tại hay không.</p></section></main>;
}
