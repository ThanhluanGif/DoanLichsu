import type { SqliteDatabase } from "@/lib/db/connection";
import { ApiError } from "@/lib/validation/api-error";

const windowMs = 15 * 60 * 1000;
type LimitRow = { attempts: number; window_started_at: string; blocked_until: string | null };
type Bucket = { key: string; maximum: number };

function rateLimited(retryAfter: number): ApiError {
  return new ApiError(429, "RATE_LIMITED", `Thử lại sau ${retryAfter} giây.`, undefined, retryAfter);
}

/** Reserve an attempt before password verification so parallel Argon2 work cannot bypass the cap. */
export function reserveLoginAttempt(database: SqliteDatabase, email: string, ip: string | null): void {
  const now = new Date();
  const buckets: Bucket[] = [{ key: `email:${email.toLowerCase()}`, maximum: 5 }];
  if (ip) buckets.push({ key: `ip:${ip}`, maximum: 20 });
  const reserve = database.transaction((): { retryAfter?: number } => {
    database.prepare("DELETE FROM login_rate_limits WHERE window_started_at < ? AND (blocked_until IS NULL OR blocked_until < ?)")
      .run(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), now.toISOString());
    for (const bucket of buckets) {
      let row = database.prepare("SELECT attempts, window_started_at, blocked_until FROM login_rate_limits WHERE bucket=?").get(bucket.key) as LimitRow | undefined;
      if (row && now.getTime() - Date.parse(row.window_started_at) >= windowMs) {
        database.prepare("DELETE FROM login_rate_limits WHERE bucket=?").run(bucket.key);
        row = undefined;
      }
      if (row?.blocked_until && Date.parse(row.blocked_until) > now.getTime()) {
        return { retryAfter: Math.max(1, Math.ceil((Date.parse(row.blocked_until) - now.getTime()) / 1000)) };
      }
      if (row && row.attempts >= bucket.maximum) {
        const blockedUntil = new Date(now.getTime() + windowMs).toISOString();
        database.prepare("UPDATE login_rate_limits SET blocked_until=? WHERE bucket=?").run(blockedUntil, bucket.key);
        return { retryAfter: windowMs / 1000 };
      }
    }
    for (const bucket of buckets) {
      database.prepare(`
        INSERT INTO login_rate_limits (bucket,attempts,window_started_at,blocked_until)
        VALUES (?,1,?,NULL)
        ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1
      `).run(bucket.key, now.toISOString());
    }
    return {};
  });
  const result = reserve.immediate();
  if (result.retryAfter) throw rateLimited(result.retryAfter);
}

/** Release only the successful request's reservation; concurrent failures remain counted. */
export function releaseSuccessfulLogin(database: SqliteDatabase, email: string, ip: string | null): void {
  const release = database.transaction(() => {
    const buckets = [`email:${email.toLowerCase()}`, ...(ip ? [`ip:${ip}`] : [])];
    for (const bucket of buckets) {
      database.prepare("UPDATE login_rate_limits SET attempts=MAX(0,attempts-1),blocked_until=NULL WHERE bucket=?").run(bucket);
      database.prepare("DELETE FROM login_rate_limits WHERE bucket=? AND attempts=0").run(bucket);
    }
  });
  release.immediate();
}
