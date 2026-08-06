# Stage 03 — PRD

1-2 pages max. Test: could a stranger build v1 from this without asking you anything?

## Gate — check ALL before `/flow next`
- [x] Every section below is filled from MY scope decision (stage 02), not re-expanded
- [x] Success metric is a NUMBER, not vibes ("save time" fails; "first response < 2h" passes)
- [x] Each feature names the user action and the observable result, tagged with a stable `FRn:` id
- [x] Pain & gain is a MAPPING TABLE: every pain cites evidence (a stage-01 quote or a named observation), and names the v1 feature that kills it; every v1 feature kills at least one pain
- [x] A stranger could build v1 from this without asking me anything
- [x] No FILL placeholders remain in this file

## Context

Người muốn học Lịch sử Quân sự Việt Nam đang phải ghép thông tin từ bài viết, trang bảo tàng, sách và kết quả tìm kiếm có độ tin cậy không đồng đều. Nghiên cứu cho thấy người dùng gặp giờ mở cửa mâu thuẫn, bản dịch tiếng Anh thiếu nhất quán và thiếu một narrative theo thời gian. Website bước vào khoảng trống đó bằng một kho dữ liệu nhỏ nhưng có cấu trúc, song ngữ, có nguồn và có quy trình duyệt. V1 phục vụ đồ án và 10 người dùng thử đầu tiên, không cạnh tranh bằng quy mô dữ liệu hay công nghệ trình diễn.

## Target users

- **Sinh viên Việt Nam (persona chính):** 18–24 tuổi, dùng điện thoại/laptop, bắt đầu bằng từ khóa, cần nguồn để học/làm bài và có thể nhập không dấu.
- **Người đọc quốc tế:** đọc tiếng Anh, vào từ URL tìm kiếm/chia sẻ, cần chronology, thuật ngữ nhất quán và chuyển locale không mất ngữ cảnh.
- **Editor/Reviewer/Admin:** người duy trì bộ dữ liệu demo; Editor soạn, Reviewer kiểm tra nguồn/bản dịch và Admin quản lý quyền, cần mọi thay đổi quan trọng có audit trail.

## Pain & gain (mapping table — the traceability spine of the PRD)

Every row: a concrete pain, the evidence it's real, what people do about it today, the
ONE v1 feature that kills it, and the observable gain. If a feature kills no pain, cut
it; if a pain has no feature, it goes to the "not addressed" list — honestly.

| # | Persona | Pain (concrete) | Evidence (stage-01 quote/source or named observation) | Today's workaround | V1 feature that kills it | Observable gain |
|---|---|---|---|---|---|---|
| P1 | Sinh viên | Không biết bắt đầu từ đâu trong kho bài rời | Tripadvisor: thiếu “overall narrative”; Stage 01 | Google rồi mở nhiều tab | FR01 | Thấy nội dung nổi bật và đi vào timeline trong 1 lần chọn |
| P2 | Sinh viên | Khó thấy quan hệ trước–sau giữa các mốc | Tripadvisor: thiếu chronology; Stage 01 | Tự ghi chép mốc | FR02 | Chọn thời kỳ và mở đúng sự kiện trên cùng chronology |
| P3 | Sinh viên | Trang sự kiện thiếu nguồn/quan hệ | AskHistorians: nguồn phổ thông “dubious”; Stage 01 | Đối chiếu thủ công | FR03 | Một detail hiển thị ngày, nguồn và nội dung liên quan |
| P4 | Sinh viên | Tên nhân vật tách khỏi sự kiện | Quan sát kế hoạch gốc của Nguyễn Đức Nam | Tìm từng tên riêng | FR04 | Detail nhân vật dẫn tới vai trò và sự kiện liên quan |
| P5 | Người học | Ảnh/hiện vật thiếu credit và bối cảnh | Quan sát yêu cầu phiếu giao đề tài/kế hoạch gốc | Dùng ảnh không rõ quyền | FR05 | Detail hiện vật có source, credit, license và alt |
| P6 | Sinh viên | Từ khóa không dấu hoặc filter khó dùng | Quan sát user journey số 2 trong kế hoạch gốc | Thử nhiều biến thể Google | FR06 | “dien bien phu” và “Điện Biên Phủ” trả cùng nhóm kết quả, filter nằm trong URL |
| P7 | Người quốc tế | Đổi ngôn ngữ dẫn sai bài hoặc bản dịch mâu thuẫn | Tripadvisor: bản dịch “contradicting”; Stage 01 | Dịch máy trang hiện tại | FR07 | Locale switch mở đúng cùng content id hoặc báo chưa có bản dịch |
| P8 | Admin | Khu quản trị có thể bị dùng trái quyền | Risk register kế hoạch gốc | Chia sẻ một tài khoản chung | FR08 | Mỗi role chỉ thấy và gọi được action được phép, deny ở server |
| P9 | Editor | Sửa nội dung phải chạm code/hai bản dịch dễ lệch | Quan sát biên tập trong kế hoạch gốc | Sửa file thủ công | FR09 | Form lưu VI/EN, source, media và preview với validation rõ |
| P10 | Reviewer | Nội dung chưa kiểm chứng có thể xuất hiện công khai | Yêu cầu cốt lõi trong phiếu/kế hoạch | Duyệt qua tin nhắn | FR10 | Chỉ transition hợp lệ mới publish; reject bắt buộc lý do |
| P11 | Reviewer | Không biết bài/ảnh đã có nguồn và quyền chưa | AskHistorians + checklist học thuật kế hoạch | Kiểm tra bằng bảng tính | FR11 | Publish bị chặn nếu thiếu source hoặc metadata media bắt buộc |
| P12 | Người quốc tế | Khó tìm website/chọn đúng bản locale | Reddit: “I couldn't find the official site”; Stage 01 | Dò nhiều trang/kết quả | FR12 | Sitemap, canonical và hreflang chỉ tới URL VI/EN hợp lệ |
| P13 | Admin | Không biết ai đã duyệt/xuất bản | Quan sát workflow kế hoạch gốc | Hỏi trong nhóm chat | FR13 | Audit log trả actor, action, object và timestamp |
| P14 | Sinh viên thực hiện | Sợ mất dữ liệu ngay trước demo | Risk register kế hoạch gốc | Copy file không kiểm chứng | FR14 | Tạo snapshot, restore sang file sạch và kiểm tra count/checksum |

### Pains NOT addressed in v1 (deliberate — tie to the scope cut list)

- Người đọc muốn gửi sửa lỗi ngay trên trang → hoãn form feedback để tránh spam/PII; v1 dùng form khảo sát của nhóm test.
- Người học muốn lưu danh sách cá nhân → hoãn tài khoản công chúng/saved list vì Impact L, Grade B.
- Editor muốn upload file lớn và cùng sửa realtime → hoãn object-storage upload/collaboration; v1 nhập URL media đã được kiểm tra và cảnh báo thay đổi chưa lưu.
- Người học muốn bản đồ/VR/AI giải đáp → hoãn các hạng mục C cho sau khi nguồn và workflow được chứng minh.

## Problem statement

Website lịch sử hiện có chưa đồng thời cho người học Việt Nam/quốc tế tra cứu theo chronology, giữ đúng ngữ cảnh song ngữ và kiểm tra nguồn. V1 phải biến 50 bản ghi demo thành một đường tra cứu có thể kiểm chứng, trong khi chỉ nội dung đã qua workflow theo vai trò được công khai.

## Features (user-centric — action → observable result)

Tag each v1 feature with a stable id `FRn:` (functional requirement) — the traceability
anchor. Every `FRn` must later be claimed by a card (`implements: FRn`) and served by an
interface in the contract (`FRn →`); `/flow consistency` checks this mechanically.

- **FR1:** Là người đọc, tôi mở `/{locale}` và thấy giới thiệu, nội dung nổi bật cùng CTA tới timeline lấy từ dữ liệu thật.
- **FR2:** Là người đọc, tôi chọn một thời kỳ trên timeline và thấy các sự kiện được sắp theo mốc có date precision, mở được detail liên quan.
- **FR3:** Là người đọc, tôi duyệt/lọc sự kiện rồi mở detail và thấy thời gian, địa điểm, body, source, media, quan hệ và ngày cập nhật.
- **FR4:** Là người đọc, tôi duyệt/lọc nhân vật rồi mở detail và thấy tiểu sử ngắn, vai trò, source và nội dung liên quan.
- **FR5:** Là người đọc, tôi duyệt/lọc hiện vật rồi mở detail và thấy metadata, nơi lưu giữ, source, credit/license/alt của media.
- **FR6:** Là người đọc, tôi tìm bằng chuỗi có/không dấu, chọn type/period/tag/page và thấy kết quả phân trang ổn định; filter tồn tại trong URL.
- **FR7:** Là người đọc, tôi đổi `vi↔en` trên detail và tới đúng cùng thực thể; nếu locale kia chưa published tôi thấy thông báo rõ, không nhận 404 sai nghĩa.
- **FR8:** Là Admin/Editor/Reviewer, tôi đăng nhập/đăng xuất và chỉ gọi được endpoint/action thuộc quyền server-side của role mình.
- **FR9:** Là Editor, tôi tạo/sửa content, hai translation, source, media metadata và quan hệ; validation lỗi nằm cạnh trường và preview dùng cùng dữ liệu public.
- **FR10:** Là Editor/Reviewer, tôi gửi duyệt, approve/reject/publish theo state machine; chỉ Reviewer/Admin publish và reject phải có lý do.
- **FR11:** Là Reviewer, tôi quản lý source/media metadata và bị chặn publish khi thiếu source, translation bắt buộc hoặc credit/license/alt của media đã gắn.
- **FR12:** Là máy tìm kiếm/người chia sẻ, tôi nhận title/description/canonical/hreflang/Open Graph/JSON-LD, sitemap và robots đúng theo locale/content.
- **FR13:** Là Admin, tôi lọc audit log theo actor/action/date/object và thấy login, create/update, review, publish, archive, role change mà không thấy secret/token.
- **FR14:** Là người vận hành, tôi chạy lệnh backup/restore và nhận snapshot có checksum; bản restore mở được, giữ nguyên số content/translation/source/user.

## Non-functional requirements

- Responsive từ 360 px; keyboard/focus/label/heading/contrast theo WCAG 2.2 AA cho luồng chính; không dùng ảnh thiếu alt.
- LCP production-like ≤ 2,5 giây cho home/detail; p95 API đọc ≤ 500 ms và search ≤ 1 giây với 50 records.
- Public API chỉ trả `PUBLISHED`; 100% published translations có title/summary/body/SEO và ≥1 source.
- Password dùng Argon2id qua thư viện; session cookie HttpOnly/SameSite/Secure khi HTTPS; login rate-limit; mọi RBAC check ở server; 0 Critical/High issue còn mở.
- Không log password/token; validation schema ở mọi mutation; HTML nội dung được render dưới dạng text/Markdown an toàn, không chèn script tùy ý.
- `vi` và `en` là locale duy nhất; slug duy nhất theo `(locale,type)`; ngày có precision `DAY|MONTH|YEAR|APPROXIMATE`.
- Seed lặp lại an toàn gồm đúng 50 content nodes, 100 translations và ít nhất 50 source links; không dùng ảnh bên thứ ba thiếu license.

## Tech stack

Next.js App Router + TypeScript cho public/admin/API trong một deployable unit; React server/client components và CSS Modules/design tokens cho UI. SQLite dùng `better-sqlite3` + SQL migration để bản demo chạy/backup/restore độc lập; Zod validation; Argon2id + encrypted signed cookie session bằng thư viện; Vitest cho unit/integration và Playwright cho E2E. Deploy target là Node standalone/Docker sau HTTPS; OpenAPI 3.1 tại `/openapi.json` là runtime seam của REST `/api/v1`.

## Success metric (numbers only)

10/10 người trong nhóm test hoàn thành “tìm một sự kiện → mở source → đổi locale” trong ≤3 phút; 50/50 content nodes có 2 translation và ≥1 source; 100% test RBAC negative bị từ chối; 0 Critical/High issue; LCP ≤2,5 giây và p95 search ≤1 giây trên bộ seed 50 records.
