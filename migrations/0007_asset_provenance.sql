ALTER TABLE media ADD COLUMN holding_institution TEXT NOT NULL DEFAULT 'Chưa xác định'
  CHECK (length(trim(holding_institution)) > 0);
ALTER TABLE media ADD COLUMN inventory_id TEXT;
ALTER TABLE media ADD COLUMN origin TEXT NOT NULL DEFAULT 'Tài liệu tham chiếu bên ngoài; dự án không lưu bản sao.'
  CHECK (length(trim(origin)) > 0);
ALTER TABLE media ADD COLUMN rights_status TEXT NOT NULL DEFAULT 'LINK_ONLY'
  CHECK (rights_status IN ('UNKNOWN', 'LINK_ONLY', 'PERMITTED', 'PUBLIC_DOMAIN'));
ALTER TABLE media ADD COLUMN permission_document TEXT
  CHECK (permission_document IS NULL OR permission_document LIKE 'https://%');
ALTER TABLE media ADD COLUMN credit_line TEXT NOT NULL DEFAULT 'Chưa khai báo dòng ghi công'
  CHECK (length(trim(credit_line)) > 0);
ALTER TABLE media ADD COLUMN checksum TEXT
  CHECK (checksum IS NULL OR (length(checksum) = 64 AND lower(checksum) = checksum));

-- Existing external documents are citation-only until an operator records a
-- permission document or public-domain determination. No binary is copied or
-- promoted by this migration.
UPDATE media
SET holding_institution = CASE WHEN trim(holding_institution) = 'Chưa xác định' THEN credit ELSE holding_institution END,
    origin = CASE WHEN trim(origin) = 'Tài liệu tham chiếu bên ngoài; dự án không lưu bản sao.' THEN url ELSE origin END,
    credit_line = CASE WHEN trim(credit_line) = 'Chưa khai báo dòng ghi công' THEN credit ELSE credit_line END,
    rights_status = 'LINK_ONLY'
WHERE rights_status = 'LINK_ONLY';

CREATE INDEX media_provenance_filter
  ON media(holding_institution, rights_status, updated_at DESC, id);
