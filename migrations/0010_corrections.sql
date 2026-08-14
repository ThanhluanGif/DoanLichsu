CREATE TABLE correction_reports (
  id TEXT PRIMARY KEY NOT NULL,
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('FACTUAL', 'SOURCE', 'TRANSLATION', 'ACCESSIBILITY', 'SAFETY', 'RIGHTS')),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 2_000),
  evidence_locator TEXT NOT NULL CHECK (length(trim(evidence_locator)) BETWEEN 1 AND 2_000),
  urgency TEXT NOT NULL CHECK (urgency IN ('NORMAL', 'HIGH', 'CRITICAL')),
  consent TEXT NOT NULL CHECK (consent = 'yes'),
  state TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (state IN ('RECEIVED', 'TRIAGED', 'IN_REVIEW', 'NEEDS_COUNCIL', 'CORRECTED', 'DECLINED', 'ARCHIVED')),
  sla_hours INTEGER NOT NULL CHECK (sla_hours IN (24, 72)),
  received_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
) STRICT;

CREATE INDEX correction_reports_queue ON correction_reports(state, urgency, received_at, id);
CREATE INDEX correction_reports_content ON correction_reports(content_id, received_at DESC, id DESC);
