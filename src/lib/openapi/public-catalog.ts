const localeParameter = {
  name: "locale", in: "path", required: true,
  schema: { type: "string", enum: ["vi", "en"] },
} as const;
const pageParameters = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 12 } },
] as const;
const contentTypes = ["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"] as const;
const curriculumTracks=["MANDATORY","ELECTIVE"] as const;
const coverageStatuses=["MISSING","DRAFT","PUBLISHED","VERIFIED"] as const;
const rightsStatuses=["UNKNOWN","LINK_ONLY","PERMITTED","PUBLIC_DOMAIN"] as const;
const gradeSchema={anyOf:[6,7,8,9,10,11,12].map((grade)=>({type:"integer",const:grade}))} as const;

const jsonResponse = (schema: object, description = "Thành công.") => ({
  description,
  content: { "application/json": { schema } },
});
const dataRef = (name: string) => ({
  type: "object", additionalProperties: false, required: ["data"],
  properties: { data: { $ref: `#/components/schemas/${name}` } },
});
const listRef = (name: string) => ({
  type: "object", additionalProperties: false, required: ["data", "meta"],
  properties: {
    data: { type: "array", items: { $ref: `#/components/schemas/${name}` } },
    meta: { $ref: "#/components/schemas/PageMeta" },
  },
});
const errorResponses = {
  "400": jsonResponse({ $ref: "#/components/schemas/ApiError" }, "Dữ liệu đầu vào không hợp lệ."),
  "404": jsonResponse({ $ref: "#/components/schemas/ApiError" }, "Locale, loại hoặc nội dung không tồn tại."),
  "500": jsonResponse({ $ref: "#/components/schemas/ApiError" }, "Không thể đọc dữ liệu công khai."),
};
const errors = (...statuses: Array<keyof typeof errorResponses>) =>
  Object.fromEntries(statuses.map((status) => [status,errorResponses[status]]));

export const publicOpenApiPaths = {
  "/api/v1/{locale}/places": { get: {
    operationId: "listPublicPlaces", summary: "Liệt kê địa danh lịch sử", description: "Trả các địa danh gắn với nội dung đã xuất bản; điểm APPROXIMATE là locator giáo dục, không phải ranh giới pháp lý.", tags: ["Public"],
    parameters: [localeParameter, ...pageParameters, { name: "precision", in: "query", schema: { type: "string", enum: ["EXACT", "APPROXIMATE"] } }, { name: "q", in: "query", schema: { type: "string", maxLength: 200 } }],
    responses: { "200": jsonResponse(listRef("PlaceView")), ...errors("400", "404", "500") },
  } },
  "/api/v1/{locale}/home": { get: {
    operationId: "getPublicHome", summary: "Đọc trang chủ công khai", description: "Trả nội dung nổi bật, thời kỳ, nội dung mới và số lượng đã xuất bản.", tags: ["Public"], parameters: [localeParameter],
    responses: { "200": jsonResponse(dataRef("HomeView")), ...errors("404","500") },
  } },
  "/api/v1/{locale}/periods": { get: {
    operationId: "listPublicPeriods", summary: "Liệt kê thời kỳ", description: "Trả các thời kỳ đã xuất bản và số nội dung thuộc từng thời kỳ.", tags: ["Public"],
    parameters: [localeParameter, { name: "includeEmpty", in: "query", schema: { type: "boolean", default: false } }],
    responses: { "200": jsonResponse(listRef("PeriodView")), ...errors("400","404","500") },
  } },
  "/api/v1/{locale}/timeline": { get: {
    operationId: "getPublicTimeline", summary: "Đọc dòng thời gian", description: "Trả các sự kiện đã xuất bản theo chronology và id làm tie-breaker.", tags: ["Public"],
    parameters: [localeParameter, ...pageParameters, { name: "period", in: "query", schema: { type: "string" } }, { name: "tag", in: "query", schema: { type: "string" } }, { name: "fromYear", in: "query", schema: { type: "integer" } }, { name: "toYear", in: "query", schema: { type: "integer" } }],
    responses: { "200": jsonResponse(listRef("TimelineItem")), ...errors("400","404","500") },
  } },
  "/api/v1/{locale}/contents": { get: {
    operationId: "listPublicContents", summary: "Liệt kê nội dung", description: "Lọc và phân trang nội dung có translation đã xuất bản.", tags: ["Public"],
    parameters: [localeParameter, ...pageParameters, { name: "type", in: "query", schema: { type: "string", enum: contentTypes } }, { name: "period", in: "query", schema: { type: "string" } }, { name: "tag", in: "query", schema: { type: "string" } },{name:"grade",in:"query",schema:gradeSchema},{name:"topic",in:"query",schema:{type:"string"}}, { name: "sort", in: "query", schema: { type: "string", enum: ["chronology", "updated", "title"], default: "chronology" } }],
    responses: { "200": jsonResponse(listRef("ContentListItem")), ...errors("400","404","500") },
  } },
  "/api/v1/{locale}/contents/{type}/{slug}": { get: {
    operationId: "getPublicContentDetail", summary: "Đọc chi tiết nội dung", description: "Trả detail, source, media, quan hệ và alternate của một translation đã xuất bản.", tags: ["Public"],
    parameters: [localeParameter, { name: "type", in: "path", required: true, schema: { type: "string", enum: contentTypes } }, { name: "slug", in: "path", required: true, schema: { type: "string" } }],
    responses: { "200": jsonResponse(dataRef("ContentDetail")), ...errors("404","500") },
  } },
  "/api/v1/{locale}/search": { get: {
    operationId: "searchPublicContents", summary: "Tìm kiếm nội dung", description: "Tìm không phân biệt dấu tiếng Việt, lọc và phân trang ổn định.", tags: ["Public"],
    parameters: [localeParameter, { name: "q", in: "query", required: true, schema: { type: "string", minLength: 1, maxLength: 200 } }, ...pageParameters, { name: "type", in: "query", schema: { type: "string", enum: contentTypes } }, { name: "period", in: "query", schema: { type: "string" } }, { name: "tag", in: "query", schema: { type: "string" } },{name:"grade",in:"query",schema:gradeSchema},{name:"topic",in:"query",schema:{type:"string"}}, { name: "sort", in: "query", schema: { type: "string", enum: ["chronology", "updated", "title"] } }],
    responses: { "200": jsonResponse(listRef("SearchResult")), ...errors("400","404","500") },
  } },
  "/api/v1/{locale}/taxonomies": { get: {
    operationId: "getPublicTaxonomies", summary: "Đọc facet theo ngữ cảnh", description: "Trả grade, topic, period, tag và type có publishedCount dương trong đúng tập kết quả của consumer.", tags: ["Public"],
    parameters: [
      localeParameter,
      { name: "kind", in: "query", schema: { type: "string", enum: ["grade","topic","period", "tag", "type"] } },
      { name: "scope", in: "query", schema: { type: "string", enum: ["contents", "timeline", "search"], default: "contents" } },
      { name: "q", in: "query", schema: { type: "string", minLength: 1, maxLength: 200 } },
      { name: "type", in: "query", schema: { type: "string", enum: contentTypes } },
      { name: "period", in: "query", schema: { type: "string" } },
      { name: "tag", in: "query", schema: { type: "string" } },
      { name: "grade", in: "query", schema: gradeSchema },
      { name: "topic", in: "query", schema: { type: "string" } },
      { name: "fromYear", in: "query", schema: { type: "integer" } },
      { name: "toYear", in: "query", schema: { type: "integer" } },
    ],
    responses: { "200": jsonResponse(dataRef("FacetView")), ...errors("400","404","500") },
  } },
  "/api/v1/{locale}/curriculum":{get:{
    operationId:"getPublicCurriculum",summary:"Đọc chương trình theo lớp",description:"Chỉ trả lớp có ít nhất một bài public; coverage vẫn tính trên toàn bộ requirement chính thức.",tags:["Public"],
    parameters:[localeParameter,{name:"track",in:"query",schema:{type:"string",enum:curriculumTracks}}],
    responses:{"200":jsonResponse(dataRef("CurriculumCatalogView")),...errors("400","404","500")},
  }},
  "/api/v1/{locale}/curriculum/{grade}":{get:{
    operationId:"getPublicCurriculumGrade",summary:"Đọc chương trình một lớp",description:"Trả requirement có bài public, bài liên quan và summary coverage trung thực.",tags:["Public"],
    parameters:[localeParameter,{name:"grade",in:"path",required:true,schema:gradeSchema},{name:"track",in:"query",schema:{type:"string",enum:curriculumTracks}},{name:"topic",in:"query",schema:{type:"string"}},...pageParameters],
    responses:{"200":jsonResponse(dataRef("CurriculumGradeView")),...errors("400","404","500")},
  }},
  "/api/v1/{locale}/sources": { get: {
    operationId: "listPublicSources", summary: "Liệt kê nguồn tư liệu", description: "Trả nguồn được nội dung và bản dịch đã xuất bản sử dụng, khử trùng theo URL và phân trang ổn định.", tags: ["Public"],
    parameters: [localeParameter, ...pageParameters],
    responses: { "200": jsonResponse(listRef("PublicSourceItem")), ...errors("400","404","500") },
  } },
  "/api/v1/contents/{id}/alternate": { get: {
    operationId: "getPublicAlternate", summary: "Đọc locale thay thế", description: "Giữ cùng content id và trả null khi translation còn lại chưa được xuất bản.", tags: ["Public"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "locale", in: "query", required: true, schema: { type: "string", enum: ["vi", "en"] } }],
    responses: { "200": jsonResponse(dataRef("AlternateView")), ...errors("400","404","500") },
  } },
} as const;

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const periodRef = {
  type: "object", additionalProperties: false, required: ["id", "title", "slug"],
  properties: { id: { type: "string" }, title: { type: "string" }, slug: { type: "string" } },
} as const;
const contentListProperties = {
  id: { type: "string" }, type: { type: "string", enum: contentTypes }, locale: { type: "string", enum: ["vi", "en"] }, title: { type: "string" }, slug: { type: "string" }, summary: { type: "string" },
  thumbnail: { anyOf: [{ $ref: "#/components/schemas/MediaView" }, { type: "null" }] }, startDate: nullableString, endDate: nullableString,
  datePrecision: { anyOf: [{ type: "string", enum: ["DAY", "MONTH", "YEAR", "APPROXIMATE"] }, { type: "null" }] },
  period: { anyOf: [{ $ref: "#/components/schemas/PeriodRef" }, { type: "null" }] }, tags: { type: "array", items: { type: "string" } },
} as const;
const contentListRequired = ["id", "type", "locale", "title", "slug", "summary", "thumbnail", "startDate", "endDate", "datePrecision", "period", "tags"] as const;
const sourceProperties = {
  id:{type:"string"},title:{type:"string"},author:nullableString,publisher:nullableString,
  year:{anyOf:[{type:"integer"},{type:"null"}]},url:{type:"string",format:"uri"},
  accessedAt:{type:"string",format:"date-time"},citationNote:nullableString,
  sourceType:{type:"string",enum:sourceTypes},qualityTier:{type:"string",enum:sourceQualityTiers},
  institution:nullableString,identifier:nullableString,edition:nullableString,
  archivedUrl:{anyOf:[{type:"string",format:"uri",pattern:"^https://"},{type:"null"}]},
  checksum:nullableString,verificationStatus:{type:"string",enum:verificationStatuses},
  verifiedBy:nullableString,verifiedAt:nullableString,verificationNote:nullableString,
} as const;
const sourceRequired = Object.keys(sourceProperties);

export const publicOpenApiSchemas = {
  PlaceView: { type: "object", additionalProperties: false, required: ["id", "slug", "title", "summary", "point", "precision", "locatorNote", "related"], properties: { id: { type: "string" }, slug: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, point: { type: "object", additionalProperties: false, required: ["longitude", "latitude"], properties: { longitude: { type: "number", minimum: -180, maximum: 180 }, latitude: { type: "number", minimum: -90, maximum: 90 } } }, precision: { type: "string", enum: ["EXACT", "APPROXIMATE"] }, locatorNote: { type: "string" }, related: { type: "array", items: { $ref: "#/components/schemas/ContentListItem" } } } },
  PageMeta: { type: "object", additionalProperties: false, required: ["page", "pageSize", "total", "totalPages"], properties: { page: { type: "integer" }, pageSize: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } } },
  ApiError: { type: "object", additionalProperties: false, required: ["code", "message", "requestId"], properties: { code: { type: "string" }, message: { type: "string" }, details: { type: "object", additionalProperties: false, properties: { fieldErrors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } }, violations: { type: "array", items: { type: "string" } } } }, requestId: { type: "string", format: "uuid" } } },
  AssetProvenanceView:{type:"object",additionalProperties:false,required:["holdingInstitution","inventoryId","origin","rightsStatus","permissionDocument","creditLine","checksum"],properties:{holdingInstitution:{type:"string"},inventoryId:nullableString,origin:{type:"string"},rightsStatus:{type:"string",enum:rightsStatuses},permissionDocument:{anyOf:[{type:"string",format:"uri",pattern:"^https://"},{type:"null"}]},creditLine:{type:"string"},checksum:nullableString}},
  MediaView: { type: "object", additionalProperties: false, required: ["id", "url", "kind", "credit", "license", "alt", "caption", "width", "height","provenance"], properties: { id: { type: "string" }, url: { type: "string", format: "uri" }, kind: { type: "string", enum: ["IMAGE", "DOCUMENT"] }, credit: { type: "string" }, license: { type: "string" }, alt: { type: "string" }, caption: nullableString, width: { anyOf: [{ type: "integer" }, { type: "null" }] }, height: { anyOf: [{ type: "integer" }, { type: "null" }] },provenance:{$ref:"#/components/schemas/AssetProvenanceView"} } },
  SourceView: { type: "object", additionalProperties: false, required: sourceRequired, properties: sourceProperties },
  ClaimEvidenceView: { type:"object",additionalProperties:false,required:["source","locator","quote","note"],properties:{source:{$ref:"#/components/schemas/SourceView"},locator:{type:"string"},quote:nullableString,note:nullableString} },
  ClaimView: { type:"object",additionalProperties:false,required:["id","claimType","assessment","statement","evidence"],properties:{id:{type:"string"},claimType:{type:"string",enum:claimTypes},assessment:{type:"string",enum:claimAssessments},statement:{type:"string"},evidence:{type:"array",items:{$ref:"#/components/schemas/ClaimEvidenceView"}}} },
  SourceContentRef: { type: "object", additionalProperties: false, required: ["id", "type", "title", "slug"], properties: { id: { type: "string" }, type: { type: "string", enum: contentTypes }, title: { type: "string" }, slug: { type: "string" } } },
  PublicSourceItem: { type: "object", additionalProperties: false, required: [...sourceRequired,"contentCount","contents"], properties: { ...sourceProperties,contentCount: { type: "integer", minimum: 1 }, contents: { type: "array", items: { $ref: "#/components/schemas/SourceContentRef" } } } },
  PeriodRef: periodRef,
  ContentListItem: { type: "object", additionalProperties: false, required: contentListRequired, properties: contentListProperties },
  ContentDetail: { type: "object", additionalProperties: false, required: [...contentListRequired, "body", "location", "result", "role", "artifactMeta", "media", "sources", "claims", "related", "alternate","curriculum","lesson","asOf", "reviewedBy", "publishedAt", "updatedAt"], properties: { ...contentListProperties, body: { type: "string" }, location: nullableString, result: nullableString, role: nullableString, artifactMeta: { anyOf: [{ type: "object", additionalProperties: { type: "string" } }, { type: "null" }] }, media: { type: "array", items: { $ref: "#/components/schemas/MediaView" } }, sources: { type: "array", items: { $ref: "#/components/schemas/SourceView" } }, claims:{type:"array",items:{$ref:"#/components/schemas/ClaimView"}}, related: { type: "array", items: { $ref: "#/components/schemas/ContentListItem" } }, alternate: { anyOf: [{ type: "object", additionalProperties: false, required: ["locale", "url"], properties: { locale: { type: "string", enum: ["vi", "en"] }, url: { type: "string" } } }, { type: "null" }] },curriculum:{type:"array",items:{$ref:"#/components/schemas/CurriculumRequirementRef"}},lesson:{anyOf:[{$ref:"#/components/schemas/LessonView"},{type:"null"}]},asOf:nullableString, reviewedBy: { type: "string" }, publishedAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
  TimelineItem: { type: "object", additionalProperties: false, required: ["id", "title", "slug", "startDate", "endDate", "datePrecision", "period", "summary"], properties: { id: { type: "string" }, title: { type: "string" }, slug: { type: "string" }, startDate: nullableString, endDate: nullableString, datePrecision: { type: "string", enum: ["DAY", "MONTH", "YEAR", "APPROXIMATE"] }, period: { anyOf: [{ $ref: "#/components/schemas/PeriodRef" }, { type: "null" }] }, summary: { type: "string" } } },
  SearchResult: { type: "object", additionalProperties: false, required: [...contentListRequired, "matchedOn"], properties: { ...contentListProperties, matchedOn: { type: "string", enum: ["title", "summary", "body"] } } },
  PeriodView: { type: "object", additionalProperties: false, required: ["id", "title", "slug", "summary", "startYear", "endYear", "contentCount"], properties: { ...periodRef.properties, summary: { type: "string" }, startYear: { type: "integer" }, endYear: { type: "integer" }, contentCount: { type: "integer", minimum: 0 } } },
  HomeView: { type: "object", additionalProperties: false, required: ["featured", "periods", "latest", "counts"], properties: { featured: { type: "array", items: { $ref: "#/components/schemas/ContentListItem" } }, periods: { type: "array", items: { $ref: "#/components/schemas/PeriodView" } }, latest: { type: "array", items: { $ref: "#/components/schemas/ContentListItem" } }, counts: { type: "object", additionalProperties: false, required: contentTypes, properties: Object.fromEntries(contentTypes.map((type) => [type, { type: "integer", minimum: 0 }])) } } },
  FacetOption: { type: "object", additionalProperties: false, required: ["value", "label", "publishedCount", "verifiedCount"], properties: { value: { type: "string" }, label: { type: "string" }, publishedCount: { type: "integer", minimum: 1 }, verifiedCount: { type: "integer", minimum: 0 } } },
  FacetView: { type: "object", additionalProperties: false, required: ["grades", "topics", "periods", "tags", "types"], properties: {
    grades: { type: "array", items: { $ref: "#/components/schemas/FacetOption" } },
    topics: { type: "array", items: { $ref: "#/components/schemas/FacetOption" } },
    periods: { type: "array", items: { $ref: "#/components/schemas/FacetOption" } },
    tags: { type: "array", items: { $ref: "#/components/schemas/FacetOption" } },
    types: { type: "array", items: { $ref: "#/components/schemas/FacetOption" } },
  } },
  CurriculumRequirementRef:{type:"object",additionalProperties:false,required:["id","grade","track","topic","slug","officialProgramRef","publishedCount","verifiedCount","coverageStatus"],properties:{id:{type:"string"},grade:gradeSchema,track:{type:"string",enum:curriculumTracks},topic:{type:"string"},slug:{type:"string"},officialProgramRef:{type:"string"},publishedCount:{type:"integer",minimum:0},verifiedCount:{type:"integer",minimum:0},coverageStatus:{type:"string",enum:coverageStatuses}}},
  CurriculumRequirementView:{type:"object",additionalProperties:false,required:["id","grade","track","topic","slug","officialProgramRef","publishedCount","verifiedCount","coverageStatus","periodStart","periodEnd","requiredOutcomes","lessons"],properties:{id:{type:"string"},grade:gradeSchema,track:{type:"string",enum:curriculumTracks},topic:{type:"string"},slug:{type:"string"},officialProgramRef:{type:"string"},publishedCount:{type:"integer",minimum:0},verifiedCount:{type:"integer",minimum:0},coverageStatus:{type:"string",enum:coverageStatuses},periodStart:{anyOf:[{type:"integer"},{type:"null"}]},periodEnd:{anyOf:[{type:"integer"},{type:"null"}]},requiredOutcomes:{type:"array",items:{type:"string"}},lessons:{type:"array",items:{$ref:"#/components/schemas/ContentListItem"}}}},
  GradeCoverageSummary:{type:"object",additionalProperties:false,required:["requirementCount","publishedRequirementCount","verifiedRequirementCount","fullCoverage"],properties:{requirementCount:{type:"integer",minimum:0},publishedRequirementCount:{type:"integer",minimum:0},verifiedRequirementCount:{type:"integer",minimum:0},fullCoverage:{type:"boolean"}}},
  CurriculumGradeSummary:{type:"object",additionalProperties:false,required:["grade","label","requirementCount","publishedRequirementCount","verifiedRequirementCount","fullCoverage","publishedLessonCount"],properties:{grade:gradeSchema,label:{type:"string"},requirementCount:{type:"integer",minimum:0},publishedRequirementCount:{type:"integer",minimum:0},verifiedRequirementCount:{type:"integer",minimum:0},fullCoverage:{type:"boolean"},publishedLessonCount:{type:"integer",minimum:0}}},
  CurriculumCatalogView:{type:"object",additionalProperties:false,required:["asOf","grades"],properties:{asOf:{type:"string",format:"date-time"},grades:{type:"array",items:{$ref:"#/components/schemas/CurriculumGradeSummary"}}}},
  CurriculumGradeView:{type:"object",additionalProperties:false,required:["grade","label","summary","requirements"],properties:{grade:gradeSchema,label:{type:"string"},summary:{$ref:"#/components/schemas/GradeCoverageSummary"},requirements:{type:"array",items:{$ref:"#/components/schemas/CurriculumRequirementView"}}}},
  LessonView:{type:"object",additionalProperties:false,required:["learningObjectives","originalSummary","analysis","debates"],properties:{learningObjectives:{type:"array",items:{type:"string"}},originalSummary:{type:"string"},analysis:{type:"string"},debates:{type:"array",items:{type:"object",additionalProperties:false,required:["title","summary","claimIds"],properties:{title:{type:"string"},summary:{type:"string"},claimIds:{type:"array",items:{type:"string"}}}}}}},
  AlternateView: { type: "object", additionalProperties: false, required: ["id", "current", "alternate"], properties: { id: { type: "string" }, current: { type: "object", additionalProperties: false, required: ["locale", "url"], properties: { locale: { type: "string", enum: ["vi", "en"] }, url: { type: "string" } } }, alternate: { anyOf: [{ type: "object", additionalProperties: false, required: ["locale", "url"], properties: { locale: { type: "string", enum: ["vi", "en"] }, url: { type: "string" } } }, { type: "null" }] } } },
} as const;
import { claimAssessments,claimTypes,sourceQualityTiers,sourceTypes,verificationStatuses } from "@/lib/content/types";
