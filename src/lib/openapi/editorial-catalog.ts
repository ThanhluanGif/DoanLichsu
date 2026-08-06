const json = (schema: object, description = "Thành công.") => ({ description, content: { "application/json": { schema } } });
const data = (name: string) => ({ type: "object", additionalProperties: false, required: ["data"], properties: { data: { $ref: `#/components/schemas/${name}` } } });
const list = (name: string) => ({ type: "object", additionalProperties: false, required: ["data", "meta"], properties: { data: { type: "array", items: { $ref: `#/components/schemas/${name}` } }, meta: { $ref: "#/components/schemas/PageMeta" } } });
const body = (name: string) => ({ required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } } });
const auth = [{ cookieAuth: [] }];
const id = { name: "id", in: "path", required: true, schema: { type: "string" } } as const;
const locale = { name: "locale", in: "path", required: true, schema: { type: "string", enum: ["vi", "en"] } } as const;
const page = [{ name: "page", in: "query", schema: { type: "integer", minimum: 1 } }, { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }] as const;
const errors = {
  "400": json({ $ref: "#/components/schemas/ApiError" }, "Dữ liệu không hợp lệ."),
  "401": json({ $ref: "#/components/schemas/ApiError" }, "Chưa đăng nhập."),
  "403": json({ $ref: "#/components/schemas/ApiError" }, "Sai quyền hoặc Origin."),
  "409": json({ $ref: "#/components/schemas/ApiError" }, "Xung đột phiên bản hoặc slug."),
  "422": json({ $ref: "#/components/schemas/ApiError" }, "Workflow hoặc publish validation thất bại."),
};
const operation = (operationId: string, summary: string, options: { method?: "get"; request?: string; response: string; parameters?: readonly object[]; admin?: boolean; status?: "200"|"201" }) => ({
  operationId, summary, tags: [options.admin === false ? "Auth" : "Editorial"],
  ...(options.admin === false && operationId === "login" ? {} : { security: auth }),
  ...(options.parameters ? { parameters: options.parameters } : {}),
  ...(options.request ? { requestBody: body(options.request) } : {}),
  responses: { [options.status ?? "200"]: json(options.response.startsWith("List:") ? list(options.response.slice(5)) : data(options.response), "Thành công."), ...errors },
});

export const editorialOpenApiPaths = {
  "/api/v1/auth/login": { post: operation("login", "Đăng nhập", { request: "LoginInput", response: "AuthUser", admin: false }) },
  "/api/v1/auth/logout": { post: operation("logout", "Đăng xuất", { response: "LogoutResult", admin: false }) },
  "/api/v1/auth/me": { get: operation("me", "Đọc người dùng hiện tại", { response: "AuthUser", admin: false }) },
  "/api/v1/admin/dashboard": { get: operation("adminDashboard", "Đọc dashboard biên tập", { response: "DashboardView" }) },
  "/api/v1/admin/contents": {
    get: operation("listAdminContents", "Liệt kê nội dung biên tập", { response: "List:AdminContentListItem", parameters: page }),
    post: operation("createContent", "Tạo draft", { request: "ContentCreateInput", response: "AdminContentDetail", status: "201" }),
  },
  "/api/v1/admin/contents/{id}": {
    get: operation("getAdminContent", "Đọc nội dung biên tập", { response: "AdminContentDetail", parameters: [id] }),
    patch: operation("updateContent", "Cập nhật nội dung", { request: "ContentUpdateInput", response: "AdminContentDetail", parameters: [id] }),
  },
  "/api/v1/admin/contents/{id}/translations/{locale}": { put: operation("putTranslation", "Upsert bản dịch", { request: "TranslationInput", response: "AdminTranslation", parameters: [id, locale] }) },
  "/api/v1/admin/sources": {
    get: operation("listAdminSources", "Liệt kê nguồn", { response: "List:AdminSourceView", parameters: page }),
    post: operation("createSource", "Tạo nguồn", { request: "SourceInput", response: "AdminSourceView", status: "201" }),
  },
  "/api/v1/admin/sources/{id}": { patch: operation("updateSource", "Cập nhật nguồn", { request: "SourceUpdateInput", response: "AdminSourceView", parameters: [id] }) },
  "/api/v1/admin/media": {
    get: operation("listAdminMedia", "Liệt kê media", { response: "List:AdminMediaView", parameters: page }),
    post: operation("createMedia", "Tạo metadata media", { request: "MediaInput", response: "AdminMediaView", status: "201" }),
  },
  "/api/v1/admin/media/{id}": { patch: operation("updateMedia", "Cập nhật metadata media", { request: "MediaUpdateInput", response: "AdminMediaView", parameters: [id] }) },
  "/api/v1/admin/contents/{id}/submit-review": { post: operation("submitReview", "Gửi duyệt locale", { request: "LocaleWorkflowInput", response: "WorkflowResult", parameters: [id] }) },
  "/api/v1/admin/contents/{id}/approve": { post: operation("approveContent", "Duyệt locale", { request: "ReviewInput", response: "WorkflowResult", parameters: [id] }) },
  "/api/v1/admin/contents/{id}/reject": { post: operation("rejectContent", "Từ chối locale", { request: "RejectInput", response: "WorkflowResult", parameters: [id] }) },
  "/api/v1/admin/contents/{id}/publish": { post: operation("publishContent", "Xuất bản locale", { request: "LocaleWorkflowInput", response: "WorkflowResult", parameters: [id] }) },
  "/api/v1/admin/contents/{id}/archive": { post: operation("archiveContent", "Lưu trữ nội dung", { request: "VersionInput", response: "WorkflowResult", parameters: [id] }) },
  "/api/v1/admin/users": {
    get: operation("listUsers", "Liệt kê người dùng", { response: "List:UserView", parameters: page }),
    post: operation("createUser", "Tạo người dùng", { request: "UserCreateInput", response: "UserView", status: "201" }),
  },
  "/api/v1/admin/users/{id}": { patch: operation("updateUser", "Cập nhật người dùng", { request: "UserUpdateInput", response: "UserView", parameters: [id] }) },
  "/api/v1/admin/audit-logs": { get: operation("listAuditLogs", "Liệt kê audit log", { response: "List:AuditLogView", parameters: page }) },
} as const;

const string = { type: "string" } as const;
const nullableString = { anyOf: [string, { type: "null" }] } as const;
const version = { type: "integer", minimum: 0 } as const;
const roles = ["ADMIN", "EDITOR", "REVIEWER"] as const;
const types = ["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"] as const;
const workflow = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const translationStatuses = ["NOT_STARTED", "TRANSLATING", "READY_FOR_REVIEW", "APPROVED", "PUBLISHED"] as const;
const object = (required: readonly string[], properties: Record<string, object>) => ({ type: "object", additionalProperties: false, required, properties });
const sourceProperties = { id:string,title:string,author:nullableString,publisher:nullableString,year:{anyOf:[{type:"integer"},{type:"null"}]},url:{type:"string",format:"uri"},accessedAt:{type:"string",format:"date-time"},citationNote:nullableString,version };
const mediaProperties = { id:string,url:{type:"string",format:"uri"},kind:{type:"string",enum:["IMAGE","DOCUMENT"]},credit:string,license:string,alt:string,caption:nullableString,width:{anyOf:[{type:"integer"},{type:"null"}]},height:{anyOf:[{type:"integer"},{type:"null"}]},version,altVi:string,altEn:string,captionVi:nullableString,captionEn:nullableString };

export const editorialOpenApiSchemas = {
  AuthUser: object(["id","email","displayName","role"], { id:string,email:{type:"string",format:"email"},displayName:string,role:{type:"string",enum:roles} }),
  LoginInput: object(["email","password"], { email:{type:"string",format:"email"},password:{type:"string",minLength:12,maxLength:256,writeOnly:true} }),
  LogoutResult: object(["loggedOut"], { loggedOut:{type:"boolean",const:true} }),
  VersionInput: object(["version"], { version }),
  LocaleWorkflowInput: object(["version","locales"], { version,locales:{type:"array",minItems:1,uniqueItems:true,items:{type:"string",enum:["vi","en"]}} }),
  ReviewInput: object(["version","locales"], { version,locales:{type:"array",minItems:1,items:{type:"string",enum:["vi","en"]}},note:string }),
  RejectInput: object(["version","locales","reason"], { version,locales:{type:"array",minItems:1,items:{type:"string",enum:["vi","en"]}},reason:{type:"string",minLength:1} }),
  WorkflowResult: object(["id","status","version","translationStatuses","reviewedBy","reviewedAt","publishedAt"], { id:string,status:{type:"string",enum:workflow},version,translationStatuses:{type:"object",additionalProperties:{type:"string",enum:translationStatuses}},reviewedBy:nullableString,reviewedAt:nullableString,publishedAt:nullableString }),
  TranslationInput: object(["version","title","slug","summary","body","seoTitle","seoDescription","translationStatus"], { version,title:string,slug:string,summary:string,body:string,seoTitle:string,seoDescription:string,translationStatus:{type:"string",enum:["NOT_STARTED","TRANSLATING","READY_FOR_REVIEW"]} }),
  AdminTranslation: object(["id","locale","version","title","slug","summary","body","seoTitle","seoDescription","translationStatus","updatedAt"], { id:string,locale:{type:"string",enum:["vi","en"]},version,title:string,slug:string,summary:string,body:string,seoTitle:string,seoDescription:string,translationStatus:{type:"string",enum:translationStatuses},updatedAt:string }),
  ContentCreateInput: object(["type","sourceIds","translations"], { type:{type:"string",enum:types},featured:{type:"boolean"},sourceIds:{type:"array",items:string},mediaIds:{type:"array",items:string},tagIds:{type:"array",items:string},relatedIds:{type:"array",items:string},translations:{type:"object",additionalProperties:{type:"object"}} }),
  ContentUpdateInput: object(["version"], { version,featured:{type:"boolean"},sourceIds:{type:"array",items:string},mediaIds:{type:"array",items:string},tagIds:{type:"array",items:string},relatedIds:{type:"array",items:string} }),
  AdminContentListItem: object(["id","type","status","featured","version","titles","updatedAt","updatedBy"], { id:string,type:{type:"string",enum:types},status:{type:"string",enum:workflow},featured:{type:"boolean"},version,titles:{type:"object",additionalProperties:string},updatedAt:string,updatedBy:string }),
  AdminContentDetail: { type:"object", additionalProperties:true, required:["id","type","status","version","translations"], properties:{id:string,type:{type:"string",enum:types},status:{type:"string",enum:workflow},version,translations:{type:"object",additionalProperties:{$ref:"#/components/schemas/AdminTranslation"}}} },
  SourceInput: object(["title","url","accessedAt"], { title:string,author:string,publisher:string,year:{type:"integer"},url:{type:"string",format:"uri"},accessedAt:{type:"string",format:"date-time"},citationNote:string }),
  SourceUpdateInput: object(["version","title","url","accessedAt"], { version,title:string,author:string,publisher:string,year:{type:"integer"},url:{type:"string",format:"uri"},accessedAt:{type:"string",format:"date-time"},citationNote:string }),
  AdminSourceView: object(["id","title","author","publisher","year","url","accessedAt","citationNote","version"],sourceProperties),
  MediaInput: object(["url","kind","credit","license","altVi","altEn"], { url:{type:"string",format:"uri"},kind:{type:"string",enum:["IMAGE","DOCUMENT"]},credit:string,license:string,altVi:string,altEn:string,captionVi:string,captionEn:string }),
  MediaUpdateInput: object(["version","url","kind","credit","license","altVi","altEn"], { version,url:{type:"string",format:"uri"},kind:{type:"string",enum:["IMAGE","DOCUMENT"]},credit:string,license:string,altVi:string,altEn:string,captionVi:string,captionEn:string }),
  AdminMediaView: object(["id","url","kind","credit","license","alt","caption","width","height","version","altVi","altEn","captionVi","captionEn"],mediaProperties),
  UserView: object(["id","email","displayName","role","active","version","createdAt","updatedAt"], { id:string,email:{type:"string",format:"email"},displayName:string,role:{type:"string",enum:roles},active:{type:"boolean"},version,createdAt:string,updatedAt:string }),
  UserCreateInput: object(["email","displayName","role","temporaryPassword"], { email:{type:"string",format:"email"},displayName:string,role:{type:"string",enum:roles},temporaryPassword:{type:"string",minLength:12,maxLength:256,writeOnly:true},active:{type:"boolean"} }),
  UserUpdateInput: object(["version"], { version,displayName:string,role:{type:"string",enum:roles},active:{type:"boolean"},resetPassword:{type:"string",minLength:12,maxLength:256,writeOnly:true} }),
  AuditLogView: object(["id","actor","action","objectType","objectId","metadata","createdAt"], { id:string,actor:{anyOf:[{$ref:"#/components/schemas/AuthUser"},{type:"null"}]},action:string,objectType:string,objectId:nullableString,metadata:{type:"object"},createdAt:string }),
  DashboardView: object(["countsByStatus","countsByType","recentAudit"], { countsByStatus:{type:"object",additionalProperties:{type:"integer"}},countsByType:{type:"object",additionalProperties:{type:"integer"}},recentAudit:{type:"array",items:{$ref:"#/components/schemas/AuditLogView"}} }),
} as const;
