CREATE TABLE curriculum_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (6, 7, 8, 9, 10, 11, 12)),
  track TEXT NOT NULL CHECK (track IN ('MANDATORY', 'ELECTIVE')),
  topic_vi TEXT NOT NULL,
  topic_en TEXT NOT NULL,
  slug_vi TEXT NOT NULL,
  slug_en TEXT NOT NULL,
  official_program_ref TEXT NOT NULL,
  period_start INTEGER,
  period_end INTEGER,
  required_outcomes_vi TEXT NOT NULL CHECK (
    json_valid(required_outcomes_vi) AND json_type(required_outcomes_vi) = 'array'
  ),
  required_outcomes_en TEXT NOT NULL CHECK (
    json_valid(required_outcomes_en) AND json_type(required_outcomes_en) = 'array'
  ),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  programme_as_of TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (grade, track, slug_vi),
  UNIQUE (grade, track, slug_en),
  CHECK (length(trim(topic_vi)) > 0),
  CHECK (length(trim(topic_en)) > 0),
  CHECK (length(trim(slug_vi)) > 0),
  CHECK (length(trim(slug_en)) > 0),
  CHECK (length(trim(official_program_ref)) > 0),
  CHECK (period_end IS NULL OR period_start IS NOT NULL),
  CHECK (period_end IS NULL OR period_end >= period_start)
) STRICT;

CREATE INDEX curriculum_requirements_grade_order
  ON curriculum_requirements(grade, track, sort_order, id);

CREATE TABLE content_curriculum (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL REFERENCES curriculum_requirements(id) ON DELETE RESTRICT,
  as_of TEXT,
  mapped_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  mapped_at TEXT NOT NULL,
  PRIMARY KEY (content_id, requirement_id),
  CHECK (as_of IS NULL OR (
    length(as_of) >= 20 AND substr(as_of, 11, 1) = 'T' AND substr(as_of, -1) = 'Z'
  ))
) STRICT;

CREATE INDEX content_curriculum_requirement
  ON content_curriculum(requirement_id, content_id);
