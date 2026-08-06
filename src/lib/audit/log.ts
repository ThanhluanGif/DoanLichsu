import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@/lib/db/connection";

const forbiddenKeys = /password|secret|token|cookie|authorization/i;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !forbiddenKeys.test(key))
      .map(([key, nested]) => [key, sanitize(nested)]),
  );
}

export function writeAudit(
  database: SqliteDatabase,
  input: { actorId: string | null; action: string; objectType: string; objectId?: string | null; metadata?: Record<string, unknown> },
): void {
  database.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, object_type, object_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), input.actorId, input.action, input.objectType, input.objectId ?? null,
    JSON.stringify(sanitize(input.metadata ?? {})), new Date().toISOString(),
  );
}

export { sanitize as sanitizeAuditMetadata };

