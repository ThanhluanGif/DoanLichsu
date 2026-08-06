ALTER TABLE content_nodes ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE content_nodes ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE content_nodes ADD COLUMN reviewed_at TEXT;
ALTER TABLE content_nodes ADD COLUMN rejection_reason TEXT;

ALTER TABLE content_translations ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE sources ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE media ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EDITOR', 'REVIEWER')),
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  session_version INTEGER NOT NULL DEFAULT 1 CHECK (session_version > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(email)) > 3),
  CHECK (length(trim(display_name)) > 0),
  CHECK (length(password_hash) > 20)
) STRICT;

CREATE INDEX users_role_active ON users(role, active, id);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX audit_logs_created ON audit_logs(created_at DESC, id DESC);
CREATE INDEX audit_logs_object ON audit_logs(object_type, object_id, created_at DESC);

CREATE TABLE login_rate_limits (
  bucket TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts >= 0),
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
) STRICT;

