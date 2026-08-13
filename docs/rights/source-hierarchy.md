# Source hierarchy và rights/legal playbook v1.0

Status: `DRAFT_PENDING_COUNSEL_REVIEW`  
Owner: Archivist/Rights  
Last reviewed: 2026-08-13

## Phạm vi và giới hạn

Đây là checklist vận hành cho kho giáo dục, không phải tư vấn pháp lý. Legal/IP reviewer
phải quyết định các trường hợp tranh chấp, quyền liên quan, điều khoản đối tác và luật
áp dụng theo quốc gia. Không coi URL công khai, tuổi của hiện vật hay nhãn “free” là
bằng chứng đủ để sao chép và phục vụ file.

## Tầng nguồn

| Tier | Nguồn | Quyết định dùng |
|---|---|---|
| T1 | Văn kiện gốc, văn bản nhà nước, lưu trữ | Căn cứ claim khi có locator/phiên bản |
| T2 | Bảo tàng, thư viện, viện nghiên cứu, chuyên khảo | Diễn giải, catalog, đối chiếu |
| T3 | UNESCO, kho quốc tế, nghiên cứu phản biện | Bổ sung và so sánh |
| T4 | Wikimedia Commons/Wikidata/Wikipedia | Discovery, identifier, media có license; không là căn cứ duy nhất cho claim nhạy cảm |
| T5 | Báo/blog/mạng xã hội | Chỉ tạo lead/câu hỏi; không auto-publish |

## Rights decision matrix

- `PERMITTED`: license/permission cụ thể, URL license, attribution và điều kiện sửa đổi
  đã được reviewer kiểm tra; có ngày re-check.
- `PUBLIC_DOMAIN`: có căn cứ public-domain theo jurisdiction và rationale được ghi lại;
  ảnh chụp/catalog vẫn phải kiểm tra quyền liên quan.
- `LINK_ONLY`: chỉ hiển thị metadata và liên kết nguồn gốc; không tải, không serve binary.
- `BLOCKED`: không phục vụ và không gắn vào bài cho tới khi có quyết định mới.
- `PENDING_REVIEW`: nằm trong queue, không xuất hiện trên public.

Chỉ `PERMITTED` và `PUBLIC_DOMAIN` được serve binary. Mọi record đều có provider,
canonical/source URL, revision/checksum, licenseShortName/licenseUrl, creator/artist,
creditLine, reviewer, decidedAt, takedownContact và recheckAt. Permission document
được lưu bằng ID/hash ở kho hạn chế quyền, không commit bí mật cá nhân.

## Wikimedia workflow

Server-side connector dùng User-Agent có liên hệ, batch/cache/backoff/maxlag và lưu
revisionId/revisionTimestamp. Import metadata vào review queue; không hotlink mặc định,
không gọi API ở mỗi page view, không import nguyên văn Wikipedia và không coi metadata
license là bảo đảm tuyệt đối. Reviewer mở trang file gốc, kiểm tra license từng file,
attribution, ShareAlike/derivative conditions, source history và thay đổi revision.

## Derivative, attribution và takedown

Derivative phải có input URL, input checksum, transform, output checksum, kích thước,
credit line và link license. Crediting hiển thị cạnh asset, không ẩn trong log.

Takedown nhận `receivedAt`, claimant/contact tối thiểu, asset IDs, lý do, mức khẩn cấp,
temporaryAction, reviewer, decision, decidedAt và public changelog entry. Rights/safety
request đáng tin cậy được unpublish tạm thời trong một ngày làm việc; không xóa audit
trail. Sau khi đóng case phải re-check mọi derivative cùng source.

## Release gate

Không release collection nếu validator còn record `SERVED` thiếu trường bắt buộc, hoặc
chưa có chủ sở hữu takedown. Trường hợp quyền không rõ dùng `LINK_ONLY`/`BLOCKED` và
chuyển legal/IP reviewer.
