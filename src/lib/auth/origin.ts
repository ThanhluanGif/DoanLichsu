import { ApiError } from "@/lib/validation/api-error";

export function requireSameOrigin(request: Request): void {
  const supplied = request.headers.get("origin");
  const configured = process.env.APP_ORIGIN?.trim();
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("APP_ORIGIN is required in production.");
  }
  const expected = new URL(configured || request.url).origin;
  if (!supplied || supplied !== expected) {
    throw new ApiError(403, "INVALID_ORIGIN", "Origin không hợp lệ.");
  }
}

