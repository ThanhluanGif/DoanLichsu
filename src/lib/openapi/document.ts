import packageJson from "../../../package.json";
import { publicOpenApiPaths, publicOpenApiSchemas } from "./public-catalog";

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
    ...publicOpenApiPaths,
  },
  components: {
    schemas: {
      HealthResponse: healthResponseSchema,
      ...publicOpenApiSchemas,
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
