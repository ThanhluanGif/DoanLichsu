CREATE TABLE content_nodes (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PERIOD', 'EVENT', 'PERSON', 'ARTIFACT', 'TOPIC')),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  start_date TEXT,
  end_date TEXT,
  date_precision TEXT CHECK (date_precision IS NULL OR date_precision IN ('DAY', 'MONTH', 'YEAR', 'APPROXIMATE')),
  period_id TEXT REFERENCES content_nodes(id) ON DELETE SET NULL,
  location TEXT,
  location_en TEXT,
  result TEXT,
  result_en TEXT,
  role TEXT,
  role_en TEXT,
  artifact_meta TEXT CHECK (artifact_meta IS NULL OR json_valid(artifact_meta)),
  artifact_meta_en TEXT CHECK (artifact_meta_en IS NULL OR json_valid(artifact_meta_en)),
  reviewed_by TEXT NOT NULL,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (end_date IS NULL OR start_date IS NOT NULL),
  CHECK (start_date IS NULL OR (length(start_date) = 10 AND strftime('%Y-%m-%d', start_date) = start_date)),
  CHECK (end_date IS NULL OR (length(end_date) = 10 AND strftime('%Y-%m-%d', end_date) = end_date)),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (date_precision IS NULL OR start_date IS NOT NULL),
  CHECK (type <> 'PERIOD' OR status <> 'PUBLISHED' OR (start_date IS NOT NULL AND end_date IS NOT NULL AND date_precision IS NOT NULL)),
  CHECK (period_id IS NULL OR period_id <> id)
) STRICT;

CREATE INDEX content_nodes_public_order
  ON content_nodes(status, type, start_date, updated_at, id);
CREATE INDEX content_nodes_period ON content_nodes(period_id, status, type);

CREATE TABLE content_translations (
  id TEXT PRIMARY KEY NOT NULL,
  node_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('vi', 'en')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  translation_status TEXT NOT NULL CHECK (translation_status IN ('NOT_STARTED', 'TRANSLATING', 'READY_FOR_REVIEW', 'APPROVED', 'PUBLISHED')),
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (node_id, locale),
  CHECK (length(trim(title)) > 0),
  CHECK (length(trim(slug)) > 0),
  CHECK (length(trim(summary)) > 0),
  CHECK (length(trim(body)) > 0)
) STRICT;

CREATE INDEX content_translations_public_slug
  ON content_translations(locale, translation_status, slug, node_id);
CREATE INDEX content_translations_public_title
  ON content_translations(locale, translation_status, title, node_id);

CREATE TRIGGER content_translation_slug_type_insert
BEFORE INSERT ON content_translations
WHEN EXISTS (
  SELECT 1
  FROM content_translations existing
  JOIN content_nodes existing_node ON existing_node.id = existing.node_id
  JOIN content_nodes new_node ON new_node.id = NEW.node_id
  WHERE existing.locale = NEW.locale
    AND existing.slug = NEW.slug
    AND existing_node.type = new_node.type
    AND existing.node_id <> NEW.node_id
)
BEGIN
  SELECT RAISE(ABORT, 'translation slug conflicts within locale and content type');
END;

CREATE TRIGGER content_translation_slug_type_update
BEFORE UPDATE OF locale, slug, node_id ON content_translations
WHEN EXISTS (
  SELECT 1
  FROM content_translations existing
  JOIN content_nodes existing_node ON existing_node.id = existing.node_id
  JOIN content_nodes new_node ON new_node.id = NEW.node_id
  WHERE existing.locale = NEW.locale
    AND existing.slug = NEW.slug
    AND existing_node.type = new_node.type
    AND existing.node_id <> NEW.node_id
)
BEGIN
  SELECT RAISE(ABORT, 'translation slug conflicts within locale and content type');
END;

CREATE TABLE sources (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  year INTEGER,
  url TEXT NOT NULL,
  accessed_at TEXT NOT NULL,
  citation_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (url LIKE 'https://%')
) STRICT;

CREATE TABLE content_sources (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (content_id, source_id)
) STRICT;

CREATE TABLE media (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('IMAGE', 'DOCUMENT')),
  credit TEXT NOT NULL,
  license TEXT NOT NULL,
  alt_vi TEXT NOT NULL,
  alt_en TEXT NOT NULL,
  caption_vi TEXT,
  caption_en TEXT,
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (url LIKE 'https://%')
) STRICT;

CREATE TABLE content_media (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_thumbnail INTEGER NOT NULL DEFAULT 0 CHECK (is_thumbnail IN (0, 1)),
  PRIMARY KEY (content_id, media_id)
) STRICT;

CREATE TABLE tags (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL
) STRICT;

CREATE TABLE content_tags (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
) STRICT;

CREATE TABLE content_relations (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  related_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (content_id, related_id),
  CHECK (content_id <> related_id)
) STRICT;

CREATE INDEX content_relations_lookup ON content_relations(content_id, sort_order, related_id);
