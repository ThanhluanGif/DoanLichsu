import type { SqliteDatabase } from "@/lib/db/connection";
import { ApiError } from "@/lib/validation/api-error";

const windowMs = 15 * 60 * 1000;

type LimitRow = { attempts: number; window_started_at: string; blocked_until: string | null };

function bucketState(database: SqliteDatabase, bucket: string, maxAttempts: number, now: Date): void {
  const row = database.prepare("SELECT attempts, window_started_at, blocked_until FROM login_rate_limits WHERE bucket = ?").get(bucket) as LimitRow | undefined;
  if (row?.blocked_until && Date.parse(row.blocked_until) > now.getTime()) {
    const retryAfter = Math.max(1, Math.ceil((Date.parse(row.blocked_until) - now.getTime()) / 1000));
    const error = new ApiError(429, "RATE_LIMITED", `Thử lại sau ${retryAfter} giây.`);
    Object.defineProperty(error, "retryAfter", { value: retryAfter });
    throw error;
  }
  if (row && now.getTime() - Date.parse(row.window_started_at) >= windowMs) {
    database.prepare("DELETE FROM login_rate_limits WHERE bucket = ?").run(bucket);
  } else if (row && row.attempts >= maxAttempts) {
    const blockedUntil = new Date(now.getTime() + windowMs).toISOString();
    database.prepare("UPDATE login_rate_limits SET blocked_until = ? WHERE bucket = ?").run(blockedUntil, bucket);
    throw new ApiError(429, "RATE_LIMITED", "Đăng nhập bị tạm khoá trong 15 phút.");
  }
}

export function assertLoginAllowed(database: SqliteDatabase, email: string, ip: string): void {
  const now = new Date();
  bucketState(database, `email:${email.toLowerCase()}`, 5, now);
  bucketState(database, `ip:${ip}`, 20, now);
}

export function recordLoginFailure(database: SqliteDatabase, email: string, ip: string): void {
  const now = new Date().toISOString();
  for (const bucket of [`email:${email.toLowerCase()}`, `ip:${ip}`]) {
    database.prepare(`
      INSERT INTO login_rate_limits (bucket, attempts, window_started_at, blocked_until)
      VALUES (?, 1, ?, NULL)
      ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1
    `).run(bucket, now);
  }
}

export function clearLoginFailures(database: SqliteDatabase, email: string): void {
  database.prepare("DELETE FROM login_rate_limits WHERE bucket = ?").run(`email:${email.toLowerCase()}`);
}

