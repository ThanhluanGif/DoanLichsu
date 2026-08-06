import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export type ErrorDetails = {
  fieldErrors?: Record<string, string[]>;
  violations?: string[];
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        requestId: randomUUID(),
      },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("admin-api-error", error instanceof Error ? error.message : "unknown");
  return NextResponse.json(
    { code: "INTERNAL_ERROR", message: "Không thể xử lý yêu cầu.", requestId: randomUUID() },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(400, "INVALID_CONTENT_TYPE", "Yêu cầu phải dùng application/json.");
  }
  let value: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 1_048_576) {
      throw new ApiError(400, "PAYLOAD_TOO_LARGE", "JSON vượt quá giới hạn 1 MiB.");
    }
    value = JSON.parse(raw);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "INVALID_JSON", "JSON không hợp lệ.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_INPUT", "Nội dung yêu cầu phải là object JSON.");
  }
  rejectUnsafeJson(value as Record<string, unknown>);
  return value as Record<string, unknown>;
}

function rejectUnsafeJson(value: unknown, path = "body"): void {
  if (typeof value === "string") {
    if (/<\/?[a-z][^>]*>/i.test(value)) invalidField(path, "Không chấp nhận HTML thô.");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectUnsafeJson(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) invalidField(path, "Tên thuộc tính không an toàn.");
    rejectUnsafeJson(nested, `${path}.${key}`);
  }
}

export function stringField(
  input: Record<string, unknown>,
  name: string,
  options: { required?: boolean; max?: number; allowEmpty?: boolean } = {},
): string | undefined {
  const value = input[name];
  if (value === undefined) {
    if (options.required) invalidField(name, "Bắt buộc.");
    return undefined;
  }
  if (typeof value !== "string") invalidField(name, "Phải là chuỗi.");
  const normalized = value.trim();
  if (!options.allowEmpty && !normalized) invalidField(name, "Không được để trống.");
  if (normalized.length > (options.max ?? 20_000)) invalidField(name, `Tối đa ${options.max ?? 20_000} ký tự.`);
  return normalized;
}

export function secretField(input: Record<string, unknown>, name: string, required = false): string | undefined {
  const value = input[name];
  if (value === undefined) {
    if (required) invalidField(name, "Bắt buộc.");
    return undefined;
  }
  if (typeof value !== "string" || value.length < 1 || value.length > 256) invalidField(name, "Phải có 1-256 ký tự.");
  return value;
}

export function numberField(input: Record<string, unknown>, name: string, required = false): number | undefined {
  const value = input[name];
  if (value === undefined) {
    if (required) invalidField(name, "Bắt buộc.");
    return undefined;
  }
  if (!Number.isInteger(value) || (value as number) < 0) invalidField(name, "Phải là số nguyên không âm.");
  return value as number;
}

export function booleanField(input: Record<string, unknown>, name: string): boolean | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") invalidField(name, "Phải là boolean.");
  return value;
}

export function stringArrayField(input: Record<string, unknown>, name: string): string[] | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    invalidField(name, "Phải là mảng chuỗi không rỗng.");
  }
  return [...new Set((value as string[]).map((entry) => entry.trim()))];
}

export function invalidField(name: string, message: string): never {
  throw new ApiError(400, "INVALID_INPUT", "Dữ liệu không hợp lệ.", { fieldErrors: { [name]: [message] } });
}

export function rejectMarkup(value: string, field: string): void {
  if (/<\/?[a-z][^>]*>/i.test(value)) invalidField(field, "Không chấp nhận HTML thô.");
}
