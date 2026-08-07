import type { DataResponse,ErrorDetails,ListResponse } from "./types";

export class AdminRequestError extends Error {
  constructor(readonly status:number,readonly code:string,message:string,readonly details?:ErrorDetails,readonly requestId?:string){super(message);}
}

async function parse<T>(response:Response):Promise<T>{
  const body=await response.json().catch(()=>({}));
  if(!response.ok){const value=body as {code?:string;message?:string;details?:ErrorDetails;requestId?:string};throw new AdminRequestError(response.status,value.code??"REQUEST_FAILED",value.message??"Không thể xử lý yêu cầu.",value.details,value.requestId);}
  return body as T;
}

export async function adminGet<T>(path:string):Promise<T>{
  return parse<T>(await fetch(path,{credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}}));
}

export async function adminSend<T>(path:string,method:"POST"|"PATCH"|"PUT",body?:unknown):Promise<T>{
  return parse<T>(await fetch(path,{method,credentials:"same-origin",cache:"no-store",headers:{accept:"application/json",...(body===undefined?{}:{"content-type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
}

export const data=<T>(value:DataResponse<T>)=>value.data;
export const list=<T>(value:ListResponse<T>)=>value.data;
export function fieldError(error:unknown,name:string):string|undefined{
  if(!(error instanceof AdminRequestError))return undefined;
  const entries=Object.entries(error.details?.fieldErrors??{});return entries.find(([path])=>path===name||path.endsWith(`.${name}`))?.[1]?.[0];
}
export function adminErrorMessage(error:unknown):string{
  if(!(error instanceof AdminRequestError))return "Không thể kết nối tới không gian biên tập.";
  if(error.status===401)return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if(error.status===403)return "Tài khoản này không có quyền thực hiện thao tác.";
  if(error.status===409)return "Nội dung đã được cập nhật ở nơi khác. Hãy tải bản mới trước khi tiếp tục.";
  if(error.status===422&&error.details?.violations?.length)return `Chưa thể hoàn tất: ${error.details.violations.join("; ")}`;
  return error.message;
}
export function loginFailureMessage(error:unknown):string{
  if(error instanceof AdminRequestError&&[401,403,429].includes(error.status))return "Thông tin đăng nhập không đúng hoặc tài khoản chưa sẵn sàng.";
  return adminErrorMessage(error);
}
