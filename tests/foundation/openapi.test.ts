import { describe, expect, it } from "vitest";

import { openApiDocument } from "@/lib/openapi/document";

describe("OpenAPI catalog", () => {
  it("is OpenAPI 3.1 and documents health", () => {
    expect(openApiDocument.openapi.startsWith("3.1.")).toBe(true);
    expect(openApiDocument.paths).toHaveProperty("/healthz");
    expect(openApiDocument.paths["/healthz"].get.responses).toHaveProperty("200");
    expect(openApiDocument.paths["/healthz"].get.responses).toHaveProperty("503");
  });
});
