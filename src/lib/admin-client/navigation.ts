import type { Role } from "./types";

export const adminNavigation=[
  {href:"/admin",label:"Tổng quan",roles:["ADMIN","EDITOR","REVIEWER"] as Role[]},
  {href:"/admin/contents",label:"Nội dung",roles:["ADMIN","EDITOR","REVIEWER"] as Role[]},
  {href:"/admin/review",label:"Chờ duyệt",roles:["ADMIN","REVIEWER"] as Role[]},
  {href:"/admin/sources",label:"Nguồn tư liệu",roles:["ADMIN","EDITOR","REVIEWER"] as Role[]},
  {href:"/admin/media",label:"Thư viện media",roles:["ADMIN","EDITOR","REVIEWER"] as Role[]},
  {href:"/admin/users",label:"Người dùng",roles:["ADMIN"] as Role[]},
  {href:"/admin/audit",label:"Nhật ký biên tập",roles:["ADMIN"] as Role[]},
];
export const navigationFor=(role:Role)=>adminNavigation.filter((item)=>item.roles.includes(role));
export const canReview=(role:Role)=>role==="ADMIN"||role==="REVIEWER";
export const navigationSelected=(pathname:string,href:string)=>pathname===href||(href!=="/admin"&&pathname.startsWith(`${href}/`));
