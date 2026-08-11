CREATE TABLE lesson_translations (
  content_id TEXT NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('vi', 'en')),
  learning_objectives TEXT NOT NULL CHECK (
    json_valid(learning_objectives) AND json_type(learning_objectives) = 'array'
  ),
  original_summary TEXT NOT NULL CHECK (length(trim(original_summary)) > 0),
  analysis TEXT NOT NULL CHECK (length(trim(analysis)) > 0),
  debates TEXT NOT NULL CHECK (
    json_valid(debates) AND json_type(debates) = 'array'
  ),
  as_of TEXT NOT NULL CHECK (
    length(as_of) = 24 AND substr(as_of, 11, 1) = 'T' AND substr(as_of, -1) = 'Z'
  ),
  reviewed_by TEXT NOT NULL CHECK (length(trim(reviewed_by)) > 0),
  reviewed_at TEXT NOT NULL CHECK (
    length(reviewed_at) = 24 AND substr(reviewed_at, 11, 1) = 'T' AND substr(reviewed_at, -1) = 'Z'
  ),
  PRIMARY KEY (content_id, locale)
) STRICT;

CREATE INDEX lesson_translations_locale ON lesson_translations(locale, content_id);

-- The release includes one deliberately source-aware lesson fixture. The trigger
-- keeps fresh demo databases and existing releases consistent without elevating
-- any source or claim to VERIFIED.
CREATE TRIGGER lesson_seed_dien_bien_phu_translation
AFTER INSERT ON content_translations
WHEN NEW.node_id = 'event-dien-bien-phu'
  AND NEW.translation_status = 'PUBLISHED'
BEGIN
  INSERT OR IGNORE INTO lesson_translations(
    content_id,locale,learning_objectives,original_summary,analysis,debates,
    as_of,reviewed_by,reviewed_at
  )
  SELECT NEW.node_id,'vi',
    json_array(
      'Xác định diễn biến chính của chiến dịch từ ngày 13 tháng 3 đến ngày 7 tháng 5 năm 1954.',
      'Phân tích cách địa hình, hậu cần và sự thay đổi phương châm tác chiến ảnh hưởng đến kết quả.',
      'Đọc tư liệu với phân biệt rõ dữ kiện đã kiểm chứng và diễn giải còn tranh luận.'
    ),
    'Chiến dịch Điện Biên Phủ là trận quyết chiến chiến lược trong cuộc kháng chiến chống Pháp, diễn ra từ ngày 13 tháng 3 đến ngày 7 tháng 5 năm 1954.',
    'Ở cấp độ chiến dịch, kết quả không chỉ đến từ hỏa lực mà còn từ khả năng tổ chức hậu cần trên địa hình phức tạp. Việc chuyển từ ý định đánh nhanh sang đánh chắc, tiến chắc kéo theo một chu kỳ chuẩn bị, kéo pháo và bảo đảm tiếp tế dài hơn. Khi đọc các con số và hồi ức, cần đối chiếu thời điểm công bố, vị trí người kể và loại tư liệu thay vì xem một lời kể là toàn bộ sự thật. Phần phân tích này là diễn giải biên tập; các luận điểm chỉ xuất hiện khi có nguồn bằng chứng đã được kiểm chứng.',
    json_array(
      json_object('title','Đánh nhanh, giải quyết nhanh hay đánh chắc, tiến chắc?','summary','Sự thay đổi phương châm tác chiến thường được giải thích qua yêu cầu giảm rủi ro trước hệ thống cứ điểm và điều kiện hậu cần. Cần đọc hồi ký cùng tài liệu tác chiến, không tách riêng một lời kể.','claimIds',json_array()),
      json_object('title','Mức độ quyết định của chiến thắng','summary','Chiến thắng làm thay đổi tương quan đàm phán, nhưng cách gán nguyên nhân và mức độ quyết định cần được đặt trong toàn bộ chiến tranh và các nguồn khác nhau.','claimIds',json_array())
    ),
    '2026-08-10T00:00:00.000Z','Ban biên tập Quân Sử Việt','2026-08-10T00:00:00.000Z'
  WHERE NEW.locale = 'vi';

  INSERT OR IGNORE INTO lesson_translations(
    content_id,locale,learning_objectives,original_summary,analysis,debates,
    as_of,reviewed_by,reviewed_at
  )
  SELECT NEW.node_id,'en',
    json_array(
      'Identify the campaign''s main phases from 13 March to 7 May 1954.',
      'Analyse how terrain, logistics, and the change in operational method shaped the result.',
      'Read sources while separating checked facts from interpretations that remain debated.'
    ),
    'The Battle of Điện Biên Phủ was the decisive campaign of the war against France, fought from 13 March to 7 May 1954.',
    'At campaign level, the result depended on more than firepower: it also depended on organizing logistics across difficult terrain. The shift from a quick strike to a careful, methodical approach brought a longer cycle of preparation, artillery movement, and supply. Dates and memoirs should be read with attention to when a source was produced, who was speaking, and what kind of record it is. This analysis is an editorial interpretation; claims appear only after their evidence has been verified.',
    json_array(
      json_object('title','A quick strike or a careful, methodical approach?','summary','The change in operational method is often explained through the risks posed by the fortified position and the logistics available to each side. Memoirs should be read alongside operational records rather than treated as the whole account.','claimIds',json_array()),
      json_object('title','How decisive was the victory?','summary','The victory changed the diplomatic balance, but its degree of decisiveness should be located within the wider war and compared across sources.','claimIds',json_array())
    ),
    '2026-08-10T00:00:00.000Z','Quân Sử Việt editorial board','2026-08-10T00:00:00.000Z'
  WHERE NEW.locale = 'en';
END;

-- Populate a database that already contains the public demo rows when this
-- migration is applied during a rolling deployment.
INSERT OR IGNORE INTO lesson_translations(
  content_id,locale,learning_objectives,original_summary,analysis,debates,
  as_of,reviewed_by,reviewed_at
)
SELECT 'event-dien-bien-phu','vi',
  json_array(
    'Xác định diễn biến chính của chiến dịch từ ngày 13 tháng 3 đến ngày 7 tháng 5 năm 1954.',
    'Phân tích cách địa hình, hậu cần và sự thay đổi phương châm tác chiến ảnh hưởng đến kết quả.',
    'Đọc tư liệu với phân biệt rõ dữ kiện đã kiểm chứng và diễn giải còn tranh luận.'
  ),
  'Chiến dịch Điện Biên Phủ là trận quyết chiến chiến lược trong cuộc kháng chiến chống Pháp, diễn ra từ ngày 13 tháng 3 đến ngày 7 tháng 5 năm 1954.',
  'Ở cấp độ chiến dịch, kết quả không chỉ đến từ hỏa lực mà còn từ khả năng tổ chức hậu cần trên địa hình phức tạp. Việc chuyển từ ý định đánh nhanh sang đánh chắc, tiến chắc kéo theo một chu kỳ chuẩn bị, kéo pháo và bảo đảm tiếp tế dài hơn. Khi đọc các con số và hồi ức, cần đối chiếu thời điểm công bố, vị trí người kể và loại tư liệu thay vì xem một lời kể là toàn bộ sự thật. Phần phân tích này là diễn giải biên tập; các luận điểm chỉ xuất hiện khi có nguồn bằng chứng đã được kiểm chứng.',
  json_array(
    json_object('title','Đánh nhanh, giải quyết nhanh hay đánh chắc, tiến chắc?','summary','Sự thay đổi phương châm tác chiến thường được giải thích qua yêu cầu giảm rủi ro trước hệ thống cứ điểm và điều kiện hậu cần. Cần đọc hồi ký cùng tài liệu tác chiến, không tách riêng một lời kể.','claimIds',json_array()),
    json_object('title','Mức độ quyết định của chiến thắng','summary','Chiến thắng làm thay đổi tương quan đàm phán, nhưng cách gán nguyên nhân và mức độ quyết định cần được đặt trong toàn bộ chiến tranh và các nguồn khác nhau.','claimIds',json_array())
  ),
  '2026-08-10T00:00:00.000Z','Ban biên tập Quân Sử Việt','2026-08-10T00:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM content_nodes WHERE id='event-dien-bien-phu' AND status='PUBLISHED')
  AND EXISTS (SELECT 1 FROM content_translations WHERE node_id='event-dien-bien-phu' AND locale='vi' AND translation_status='PUBLISHED');

INSERT OR IGNORE INTO lesson_translations(
  content_id,locale,learning_objectives,original_summary,analysis,debates,
  as_of,reviewed_by,reviewed_at
)
SELECT 'event-dien-bien-phu','en',
  json_array(
    'Identify the campaign''s main phases from 13 March to 7 May 1954.',
    'Analyse how terrain, logistics, and the change in operational method shaped the result.',
    'Read sources while separating checked facts from interpretations that remain debated.'
  ),
  'The Battle of Điện Biên Phủ was the decisive campaign of the war against France, fought from 13 March to 7 May 1954.',
  'At campaign level, the result depended on more than firepower: it also depended on organizing logistics across difficult terrain. The shift from a quick strike to a careful, methodical approach brought a longer cycle of preparation, artillery movement, and supply. Dates and memoirs should be read with attention to when a source was produced, who was speaking, and what kind of record it is. This analysis is an editorial interpretation; claims appear only after their evidence has been verified.',
  json_array(
    json_object('title','A quick strike or a careful, methodical approach?','summary','The change in operational method is often explained through the risks posed by the fortified position and the logistics available to each side. Memoirs should be read alongside operational records rather than treated as the whole account.','claimIds',json_array()),
    json_object('title','How decisive was the victory?','summary','The victory changed the diplomatic balance, but its degree of decisiveness should be located within the wider war and compared across sources.','claimIds',json_array())
  ),
  '2026-08-10T00:00:00.000Z','Quân Sử Việt editorial board','2026-08-10T00:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM content_nodes WHERE id='event-dien-bien-phu' AND status='PUBLISHED')
  AND EXISTS (SELECT 1 FROM content_translations WHERE node_id='event-dien-bien-phu' AND locale='en' AND translation_status='PUBLISHED');
