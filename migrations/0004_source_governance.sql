ALTER TABLE sources ADD COLUMN source_type TEXT NOT NULL DEFAULT 'DISCOVERY_ONLY'
  CHECK (source_type IN (
    'PRIMARY_RECORD', 'ARCHIVE_CATALOG', 'MUSEUM_CATALOG', 'SCHOLARLY_BOOK',
    'PEER_REVIEWED_ARTICLE', 'REFERENCE_WORK', 'CONTEMPORARY_PRESS',
    'ORAL_HISTORY', 'DISCOVERY_ONLY'
  ));
ALTER TABLE sources ADD COLUMN quality_tier TEXT NOT NULL DEFAULT 'TIER_5_DISCOVERY'
  CHECK (quality_tier IN (
    'TIER_1_PRIMARY', 'TIER_2_INSTITUTIONAL', 'TIER_3_SCHOLARLY',
    'TIER_4_CONTEXTUAL', 'TIER_5_DISCOVERY'
  ));
ALTER TABLE sources ADD COLUMN institution TEXT;
ALTER TABLE sources ADD COLUMN identifier TEXT;
ALTER TABLE sources ADD COLUMN edition TEXT;
ALTER TABLE sources ADD COLUMN archived_url TEXT CHECK (archived_url IS NULL OR archived_url LIKE 'https://%');
ALTER TABLE sources ADD COLUMN checksum TEXT
  CHECK (checksum IS NULL OR (length(checksum) = 64 AND lower(checksum) = checksum));
ALTER TABLE sources ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW'
  CHECK (verification_status IN ('DRAFT', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED'));
ALTER TABLE sources ADD COLUMN verified_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sources ADD COLUMN verified_at TEXT;
ALTER TABLE sources ADD COLUMN verification_note TEXT;

-- Classification is descriptive and can be inferred from the existing publisher URL.
-- No legacy source is promoted to VERIFIED: each still requires a human reviewer decision.
UPDATE sources
SET source_type = CASE
      WHEN url LIKE '%btlsqsvn.mod.gov.vn/%' OR url LIKE '%vnmh.com.vn/%' THEN 'MUSEUM_CATALOG'
      WHEN url LIKE '%whc.unesco.org/%' THEN 'ARCHIVE_CATALOG'
      WHEN url LIKE '%britannica.com/%' OR url LIKE '%iwm.org.uk/%' THEN 'REFERENCE_WORK'
      ELSE 'DISCOVERY_ONLY'
    END,
    quality_tier = CASE
      WHEN url LIKE '%btlsqsvn.mod.gov.vn/%' OR url LIKE '%vnmh.com.vn/%'
        OR url LIKE '%whc.unesco.org/%' OR url LIKE '%iwm.org.uk/%'
        THEN 'TIER_2_INSTITUTIONAL'
      WHEN url LIKE '%britannica.com/%' THEN 'TIER_4_CONTEXTUAL'
      ELSE 'TIER_5_DISCOVERY'
    END,
    institution = COALESCE(institution, publisher);

CREATE INDEX sources_verification_filter
  ON sources(verification_status, source_type, quality_tier, updated_at DESC, id);

CREATE TABLE content_claims (
  id TEXT PRIMARY KEY NOT NULL,
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'DATE', 'PLACE', 'PERSON_ROLE', 'OUTCOME', 'INTERPRETATION', 'CONTEXT'
  )),
  assessment TEXT NOT NULL CHECK (assessment IN ('CONFIRMED', 'DISPUTED')),
  statement_vi TEXT NOT NULL,
  statement_en TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (verification_status IN ('DRAFT', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  verification_note TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (id, content_id),
  CHECK (length(trim(statement_vi)) > 0),
  CHECK (length(trim(statement_en)) > 0),
  CHECK (
    (verification_status = 'VERIFIED' AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    OR verification_status <> 'VERIFIED'
  )
) STRICT;

CREATE INDEX content_claims_public
  ON content_claims(content_id, verification_status, claim_type, id);
CREATE INDEX content_claims_review_queue
  ON content_claims(verification_status, updated_at DESC, id);

CREATE TABLE claim_evidence (
  claim_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  locator TEXT NOT NULL,
  quote TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (claim_id, source_id),
  FOREIGN KEY (claim_id, content_id) REFERENCES content_claims(id, content_id) ON DELETE CASCADE,
  FOREIGN KEY (content_id, source_id) REFERENCES content_sources(content_id, source_id) ON DELETE RESTRICT,
  CHECK (length(trim(locator)) > 0)
) STRICT;

CREATE INDEX claim_evidence_source
  ON claim_evidence(source_id, claim_id);
