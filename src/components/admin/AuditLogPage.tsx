"use client";

/* eslint-disable react-hooks/set-state-in-effect -- effect schedules the authenticated initial load */
import { useCallback,useEffect,useState } from "react";
import { adminErrorMessage,adminGet,list } from "@/lib/admin-client/client";
import type { AuditLogView,ListResponse } from "@/lib/admin-client/types";
import { useAdmin } from "./AdminShell";

const displayDate=(value:string)=>new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
export function AuditLogPage(){
  const {user}=useAdmin();const [items,setItems]=useState<AuditLogView[]>([]);const [message,setMessage]=useState("");
  const [filters,setFilters]=useState({actorId:"",action:"",objectType:"",objectId:"",from:"",to:""});
  const load=useCallback(async()=>{try{const values=Object.entries(filters).filter(([,value])=>value).map(([key,value])=>[key,["from","to"].includes(key)?new Date(value).toISOString():value]);const query=new URLSearchParams([["pageSize","50"],...values]);setItems(list(await adminGet<ListResponse<AuditLogView>>(`/api/v1/admin/audit-logs?${query}`)));setMessage("");}catch(error){setMessage(adminErrorMessage(error));}},[filters]);
  useEffect(()=>{if(user.role==="ADMIN")void load();},[load,user.role]);
  if(user.role!=="ADMIN")return <div className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Không có quyền</p><h1>Khu vực được giới hạn</h1><p>Quyền truy cập do máy chủ kiểm tra. Hãy dùng tài khoản phù hợp.</p></div></header></div>;
  return <div className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Nhật ký biên tập</p><h1>Dấu vết thao tác</h1><p>Theo dõi người thực hiện, thao tác, đối tượng và thời gian mà không hiển thị dữ liệu nhạy cảm.</p></div></header>
    <form className="admin-filter audit-filter" onSubmit={(event)=>{event.preventDefault();void load();}}>
      <label>Người thực hiện<input value={filters.actorId} onChange={(event)=>setFilters({...filters,actorId:event.target.value})} placeholder="user-editor"/></label><label>Thao tác<input value={filters.action} onChange={(event)=>setFilters({...filters,action:event.target.value})} placeholder="content.publish"/></label><label>Loại đối tượng<input value={filters.objectType} onChange={(event)=>setFilters({...filters,objectType:event.target.value})} placeholder="content"/></label><label>Mã đối tượng<input value={filters.objectId} onChange={(event)=>setFilters({...filters,objectId:event.target.value})}/></label><label>Từ thời điểm<input type="datetime-local" value={filters.from} onChange={(event)=>setFilters({...filters,from:event.target.value})}/></label><label>Đến thời điểm<input type="datetime-local" value={filters.to} onChange={(event)=>setFilters({...filters,to:event.target.value})}/></label><button className="button secondary" type="submit">Lọc nhật ký</button>
    </form>{message?<p className="form-alert" role="alert">{message}</p>:null}<div className="admin-table audit-table" role="table" aria-label="Nhật ký biên tập">{items.map((item)=><div role="row" key={item.id}><span role="cell"><strong>{item.action}</strong><small>{item.actor?.displayName||"Hệ thống"}</small></span><span role="cell">{item.objectType}{item.objectId?` · ${item.objectId}`:""}</span><time role="cell">{displayDate(item.createdAt)}</time></div>)}</div>
  </div>;
}
