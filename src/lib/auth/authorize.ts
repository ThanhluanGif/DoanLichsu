import type { SqliteDatabase } from "@/lib/db/connection";
import { ApiError } from "@/lib/validation/api-error";
import { readSession } from "./session";
import type { AuthUser, Role } from "./types";

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  active: number;
  session_version: number;
};

export async function requireUser(
  request: Request,
  database: SqliteDatabase,
  allowed: readonly Role[] = ["ADMIN", "EDITOR", "REVIEWER"],
): Promise<AuthUser> {
  const session = await readSession(request);
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Cần đăng nhập.");
  const row = database.prepare(`
    SELECT id, email, display_name, role, active, session_version FROM users WHERE id = ?
  `).get(session.userId) as UserRow | undefined;
  if (!row || row.active !== 1 || row.session_version !== session.sessionVersion) {
    throw new ApiError(401, "UNAUTHENTICATED", "Phiên đăng nhập không còn hợp lệ.");
  }
  if (!allowed.includes(row.role)) throw new ApiError(403, "FORBIDDEN", "Không đủ quyền thực hiện.");
  return { id: row.id, email: row.email, displayName: row.display_name, role: row.role };
}

