import { contentTypes, locales, type ContentType, type Locale, type PageMeta } from "./types";

export class PublicApiError extends Error {
  constructor(
    public readonly status: 400 | 404,
    public readonly code: string,
    message: string,
    public readonly details?: { fieldErrors?: Record<string, string[]>; violations?: string[] },
  ) {
    super(message);
  }
}

export function parseLocale(value: string): Locale {
  if (!locales.includes(value as Locale)) {
    throw new PublicApiError(404, "LOCALE_NOT_FOUND", "Locale không được hỗ trợ.");
  }
  return value as Locale;
}

export function parseContentType(value: string): ContentType {
  if (!contentTypes.includes(value as ContentType)) {
    throw new PublicApiError(404, "CONTENT_TYPE_NOT_FOUND", "Loại nội dung không tồn tại.");
  }
  return value as ContentType;
}

function positiveInteger(value: string | null, fallback: number, field: string, maximum?: number) {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Tham số truy vấn không hợp lệ.", {
      fieldErrors: { [field]: ["Phải là số nguyên dương."] },
    });
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Tham số truy vấn không hợp lệ.", {
      fieldErrors: { [field]: [`Phải nằm trong khoảng 1–${maximum ?? "∞"}.`] },
    });
  }
  return parsed;
}

export function parsePage(search: URLSearchParams): { page: number; pageSize: number } {
  return {
    page: positiveInteger(search.get("page"), 1, "page"),
    pageSize: positiveInteger(search.get("pageSize"), 12, "pageSize", 50),
  };
}

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

export function optionalYear(search: URLSearchParams, field: "fromYear" | "toYear") {
  const value = search.get(field);
  if (value === null) return undefined;
  if (!/^-?\d{1,4}$/.test(value)) {
    throw new PublicApiError(400, "INVALID_QUERY", "Năm không hợp lệ.", {
      fieldErrors: { [field]: ["Phải là một năm gồm tối đa bốn chữ số."] },
    });
  }
  return Number(value);
}

export function parseBoolean(value: string | null, field: string, fallback = false): boolean {
  if (value === null) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new PublicApiError(400, "INVALID_QUERY", "Tham số truy vấn không hợp lệ.", {
    fieldErrors: { [field]: ["Chỉ nhận true hoặc false."] },
  });
}
