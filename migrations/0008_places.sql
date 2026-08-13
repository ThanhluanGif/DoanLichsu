CREATE TABLE historical_places (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  summary_vi TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  precision TEXT NOT NULL CHECK (precision IN ('EXACT', 'APPROXIMATE')),
  locator_note_vi TEXT NOT NULL,
  locator_note_en TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE historical_place_content (
  place_id TEXT NOT NULL REFERENCES historical_places(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (place_id, content_id)
) STRICT;

CREATE INDEX historical_places_precision ON historical_places(precision, slug);
CREATE INDEX historical_place_content_content ON historical_place_content(content_id, place_id);
