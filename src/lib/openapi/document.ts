import packageJson from "../../../package.json";
import { publicOpenApiPaths, publicOpenApiSchemas } from "./public-catalog";
import { editorialOpenApiPaths, editorialOpenApiSchemas } from "./editorial-catalog";

const healthResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "version", "database", "timestamp"],
  properties: {
    status: { type: "string", const: "ok", description: "Trạng thái của ứng dụng." },
    version: { type: "string", description: "Phiên bản đang được phục vụ." },
    database: { type: "string", const: "ok", description: "Trạng thái kết nối SQLite." },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "Thời điểm kiểm tra theo ISO-8601 UTC.",
    },
  },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Quân Sử Việt API",
    version: packageJson.version,
    description: "Hợp đồng HTTP của kho tư liệu lịch sử quân sự Việt Nam.",
  },
  paths: {
    "/healthz": {
      get: {
        operationId: "getHealth",
        summary: "Kiểm tra trạng thái runtime",
        description: "Xác nhận ứng dụng và SQLite sẵn sàng phục vụ.",
        tags: ["Hạ tầng"],
        responses: {
          "200": {
            description: "Runtime sẵn sàng.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          "503": {
            description: "SQLite chưa sẵn sàng; phản hồi không có body.",
          },
        },
      },
    },
    "/openapi.json": {
      get: {
        operationId:"getOpenApi",summary:"Đọc đặc tả OpenAPI",description:"Trả planning contract ở dạng OpenAPI 3.1.",tags:["Hạ tầng"],
        responses:{"200":{description:"Đặc tả OpenAPI.",content:{"application/json":{schema:{type:"object"}}}}},
      },
    },
    "/docs": {
      get: {
        operationId:"getApiDocs",summary:"Đọc tài liệu API",description:"Trả tài liệu HTML sinh từ OpenAPI.",tags:["Hạ tầng"],
        responses:{"200":{description:"Tài liệu API.",content:{"text/html":{schema:{type:"string"}}}}},
      },
    },
    "/sitemap.xml": {
      get: {
        operationId:"getSitemap",summary:"Đọc sitemap",description:"Trả URL VI/EN đã xuất bản.",tags:["SEO"],
        responses:{"200":{description:"Sitemap XML.",content:{"application/xml":{schema:{type:"string"}}}}},
      },
    },
    "/robots.txt": {
      get: {
        operationId:"getRobots",summary:"Đọc robots",description:"Cho phép public routes và chặn admin.",tags:["SEO"],
        responses:{"200":{description:"Robots text.",content:{"text/plain":{schema:{type:"string"}}}}},
      },
    },
    ...publicOpenApiPaths,
    ...editorialOpenApiPaths,
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "qsv_session" },
    },
    schemas: {
      HealthResponse: healthResponseSchema,
      ...publicOpenApiSchemas,
      ...editorialOpenApiSchemas,
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
