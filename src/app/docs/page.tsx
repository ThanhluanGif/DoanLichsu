import type { Metadata } from "next";
import Link from "next/link";
import { openApiDocument } from "@/lib/openapi/document";

export const metadata: Metadata = {
  title: "Tài liệu API | Quân Sử Việt",
  description: "Tài liệu hợp đồng HTTP của Quân Sử Việt.",
};

type OperationDoc = {
  summary: string;
  description: string;
  parameters?: ReadonlyArray<{
    name: string;
    in: string;
    required?: boolean;
    schema?: { type?: string; enum?: readonly string[] };
  }>;
  responses: Record<string, unknown>;
};

function successSchema(operation: OperationDoc): string {
  const response = operation.responses["200"] as {
    content?: { "application/json"?: { schema?: {
      $ref?: string;
      properties?: { data?: { $ref?: string; items?: { $ref?: string } } };
    } } };
  } | undefined;
  const schema = response?.content?.["application/json"]?.schema;
  const direct = schema?.$ref?.split("/").at(-1);
  const data = schema?.properties?.data;
  const dataName = data?.$ref?.split("/").at(-1);
  const itemName = data?.items?.$ref?.split("/").at(-1);
  if (direct) return direct;
  if (dataName) return `DataResponse<${dataName}>`;
  if (itemName) return `ListResponse<${itemName}>`;
  return "JSON theo schema OpenAPI";
}

export default function ApiDocsPage() {
  const operations = Object.entries(openApiDocument.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).map(([method, operation]) => ({
      path,
      method: method.toUpperCase(),
      operation: operation as OperationDoc,
    })),
  );

  return (
    <main className="docs-shell" id="noi-dung">
      <header className="docs-header">
        <Link className="brand" href="/" aria-label="Quân Sử Việt, trang chủ">
          <span className="brand-mark" aria-hidden="true">QS</span>
          <span>
            <strong>Quân Sử Việt</strong>
            <small>Tài liệu API</small>
          </span>
        </Link>
        <Link className="text-link" href="/openapi.json">
          Mở đặc tả OpenAPI
        </Link>
      </header>

      <section className="docs-intro" aria-labelledby="docs-title">
        <p className="eyebrow">OpenAPI {openApiDocument.openapi}</p>
        <h1 id="docs-title">{openApiDocument.info.title}</h1>
        <p>{openApiDocument.info.description}</p>
        <p className="version-label">Phiên bản {openApiDocument.info.version}</p>
      </section>

      <section className="endpoint-list" aria-labelledby="endpoints-title">
        <h2 id="endpoints-title">Điểm truy cập</h2>
        {operations.map(({ path, method, operation }) => (
          <article className="endpoint-card" key={`${method}-${path}`}>
            <div className="endpoint-heading">
              <span className="method-badge">{method}</span>
              <code>{path}</code>
            </div>
            <h3>{operation.summary}</h3>
            <p>{operation.description}</p>
            <dl>
              <div>
                <dt>Phản hồi thành công</dt>
                <dd><code>200 · {successSchema(operation)}</code></dd>
              </div>
              <div>
                <dt>Tham số</dt>
                <dd>
                  <code>
                    {operation.parameters?.map((parameter) =>
                      `${parameter.in}:${parameter.name}${parameter.required ? "*" : ""}`,
                    ).join(", ") || "none"}
                  </code>
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}
