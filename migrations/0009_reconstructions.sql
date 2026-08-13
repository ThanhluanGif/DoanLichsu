CREATE TABLE reconstructions (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL CHECK (label = 'EDUCATIONAL_RECONSTRUCTION'),
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  summary_vi TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE RESTRICT,
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  assumptions_vi TEXT NOT NULL CHECK (json_valid(assumptions_vi) AND json_type(assumptions_vi) = 'array'),
  assumptions_en TEXT NOT NULL CHECK (json_valid(assumptions_en) AND json_type(assumptions_en) = 'array'),
  fallback_narrative_vi TEXT NOT NULL,
  fallback_narrative_en TEXT NOT NULL,
  fallback_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE reconstruction_sources (
  reconstruction_id TEXT NOT NULL REFERENCES reconstructions(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (reconstruction_id, source_id)
) STRICT;

CREATE TABLE reconstruction_phases (
  id TEXT PRIMARY KEY NOT NULL,
  reconstruction_id TEXT NOT NULL REFERENCES reconstructions(id) ON DELETE CASCADE,
  phase_order INTEGER NOT NULL CHECK (phase_order > 0),
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  date_label_vi TEXT NOT NULL,
  date_label_en TEXT NOT NULL,
  narrative_vi TEXT NOT NULL,
  narrative_en TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  assumptions_vi TEXT NOT NULL CHECK (json_valid(assumptions_vi) AND json_type(assumptions_vi) = 'array'),
  assumptions_en TEXT NOT NULL CHECK (json_valid(assumptions_en) AND json_type(assumptions_en) = 'array'),
  UNIQUE (reconstruction_id, phase_order)
) STRICT;

CREATE TABLE reconstruction_moves (
  id TEXT PRIMARY KEY NOT NULL,
  phase_id TEXT NOT NULL REFERENCES reconstruction_phases(id) ON DELETE CASCADE,
  side TEXT NOT NULL,
  label_vi TEXT NOT NULL,
  label_en TEXT NOT NULL,
  from_longitude REAL NOT NULL CHECK (from_longitude >= -180 AND from_longitude <= 180),
  from_latitude REAL NOT NULL CHECK (from_latitude >= -90 AND from_latitude <= 90),
  to_longitude REAL NOT NULL CHECK (to_longitude >= -180 AND to_longitude <= 180),
  to_latitude REAL NOT NULL CHECK (to_latitude >= -90 AND to_latitude <= 90),
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  source_ids TEXT NOT NULL CHECK (json_valid(source_ids) AND json_type(source_ids) = 'array')
) STRICT;

CREATE TABLE reconstruction_places (
  reconstruction_id TEXT NOT NULL REFERENCES reconstructions(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL REFERENCES historical_places(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (reconstruction_id, place_id)
) STRICT;

CREATE INDEX reconstructions_public ON reconstructions(status, slug);
CREATE INDEX reconstruction_phases_order ON reconstruction_phases(reconstruction_id, phase_order);
CREATE INDEX reconstruction_moves_phase ON reconstruction_moves(phase_id);
