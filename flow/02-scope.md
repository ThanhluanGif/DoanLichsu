# Stage 02 — Scope (go/no-go)

Scope = features chosen by IMPACT × COST, inside your time budget.
KILL here is cheap and smart. Killing a weak idea at this gate is a SUCCESS outcome.

## Impact rubric (business value — score BEFORE looking at cost)

| Impact | Meaning |
|---|---|
| H | moves money or the core promise: gets users in (acquisition), gets them paying (revenue), or delivers the one job they came for |
| M | keeps users / saves real time weekly (retention, operations) |
| L | nice-to-have; nobody would pay for or switch over it |

Decision matrix: **H-impact features justify B/C cost** (via the C-paths below).
**L-impact features must be grade A or they're cut** — and even grade-A L-features are
cut when the budget is tight. The classic failure is a v1 full of A-grade L-impact
features: cheap to build, worthless to sell.

## AI coding grade rubric

| Grade | Meaning | Examples |
|---|---|---|
| A | cheap for AI | CRUD, forms, dashboards, content sites, API wrappers |
| B | moderate | file processing, 3rd-party integrations, auth via library, single LLM call, HITL AI drafts |
| C | expensive | realtime, payments from scratch, custom auth, autonomous agentic AI pipelines, heavy concurrency |

**Grade is a COST estimate, not a permission.** The gate is fit(grades, budget), not "no C allowed."
When a C feature is the real need, three honest paths:
1. **The C feature IS the product** → invert the cut: C goes FIRST (riskiest assumption first),
   everything else is minimized to serve it, and the budget is renegotiated against reality.
   But: one C proves the value prop — its siblings are v2 cards, not v1 scope.
2. **Re-architect C down to B** (highest-leverage move): multi-step agent → single LLM call;
   auto-send → human-approves-draft; custom pipeline → managed service / library.
   Same user value, one grade cheaper.
3. **Irreducible C that doesn't fit the budget** → KILL or re-budget. Both are honest.

## Gate — check ALL before `/flow next`
- [x] Every feature below has an IMPACT (H/M/L with the business reason) AND a grade (A/B/C)
- [x] No L-impact feature above grade A survives in v1
- [x] The suggested-features section was actually considered (each suggestion has an in/out decision)
- [x] fit(grades, budget) holds — every C in scope is justified as path 1, 2, or 3 above (written next to the feature)
- [x] If the product IS a C feature: it is FIRST in build order, and its sibling C features are on the cut list
- [x] The cut list is written (what I am NOT building in v1)
- [x] GO / KILL decision is written below
- [x] No FILL placeholders remain in this file

## Time budget

16 tuần cho một sinh viên theo kế hoạch gốc; trong phiên Flow này ưu tiên một bản thesis-MVP triển khai được, có đủ đường dọc public + admin + dữ liệu demo, rồi mới tăng độ sâu nội dung. Các hạng mục chỉ đẹp khi có quy mô lớn bị cắt trước các luật nguồn, song ngữ, RBAC và kiểm thử.

## Features in v1 (each with impact AND grade)

- **FR01 Trang chủ song ngữ và nội dung nổi bật** — Impact H (điểm vào và lời hứa cốt lõi) — Grade A (render dữ liệu, responsive, CTA).
- **FR02 Timeline/thời kỳ** — Impact H (giúp hiểu quan hệ thời gian, lý do chính để chuyển khỏi bài rời) — Grade B (date precision, filter và UI responsive).
- **FR03 Sự kiện/chiến dịch có nguồn và quan hệ** — Impact H (đơn vị kiến thức cốt lõi) — Grade B (data model + detail API/UI).
- **FR04 Nhân vật có nguồn và nội dung liên quan** — Impact M (giữ người học khám phá sâu hơn) — Grade A (dùng lại mô hình/content UI).
- **FR05 Hiện vật/tư liệu có metadata quyền sử dụng** — Impact M (bằng chứng trực quan và giá trị học tập) — Grade B (media/source rules; v1 quản lý metadata URL, không upload binary tùy ý).
- **FR06 Tìm kiếm không dấu/có dấu và bộ lọc** — Impact H (job tra cứu trực tiếp) — Grade B (normalization, ranking vừa đủ, URL state, pagination).
- **FR07 Chuyển Việt–Anh giữ đúng thực thể** — Impact H (lời hứa song ngữ) — Grade B (route-key/slug pair và trạng thái thiếu bản dịch).
- **FR08 Đăng nhập quản trị và RBAC Admin/Editor/Reviewer** — Impact H (ngăn thao tác trái phép, bắt buộc cho vận hành) — Grade B theo path 2: dùng thư viện hash/session đã kiểm chứng và middleware/guard phía server, không tự thiết kế giao thức auth hay OAuth server.
- **FR09 CRUD nội dung và bản dịch** — Impact H (cho phép duy trì không sửa code) — Grade B (form, validation, quan hệ và preview).
- **FR10 Workflow Draft → In review → Published/Rejected** — Impact H (ngăn nội dung chưa kiểm chứng xuất hiện) — Grade B (state machine hữu hạn, human-in-the-loop; không realtime/concurrency phức tạp).
- **FR11 Quản lý nguồn và media metadata** — Impact H (độ tin cậy học thuật và quyền sử dụng) — Grade B (publish validation + metadata editor; upload nhị phân/object-storage trực tiếp được cắt khỏi v1).
- **FR12 SEO song ngữ, sitemap, canonical/hreflang/OG** — Impact M (đưa người dùng quốc tế vào và tránh URL locale sai) — Grade A (framework metadata + generated sitemap).
- **FR13 Audit log thao tác quan trọng** — Impact M (truy vết review/publish và vận hành) — Grade B (append-only event records + admin filter).
- **FR14 Backup/restore có diễn tập** — Impact M (giảm rủi ro mất dữ liệu trước bảo vệ) — Grade B (script snapshot/restore chuẩn của datastore, checksum và smoke verification).
- **50 bản ghi demo Việt–Anh có ít nhất một nguồn** — Impact H (không có dữ liệu thì toàn bộ trải nghiệm rỗng) — Grade B (seed có cấu trúc + kiểm tra tự động; nội dung ngắn và nguồn rõ, không viết 50 chuyên khảo dài).

## Suggested features (impact-first — proposed, not decided)

Up to 3 features NOT in the original idea, each chosen for business impact (how does this
get users in / get money in / keep users?). Grounded in the stage-01 GTM findings — e.g.
the first-10-users channel often implies a share/invite/referral surface; the pricing
research often implies an upsell or a paid tier. Default is OUT; each needs an explicit
decision.

- **Nút sao chép/chia sẻ URL đúng locale của nội dung** — Impact M (giúp 10 người test gửi đúng trang cho nhau và hỗ trợ acquisition) — Grade A — **IN**, vì bám trực tiếp kênh Zalo lớp và không mở thêm mô hình dữ liệu.
- **Form báo lỗi lịch sử/bản dịch công khai** — Impact M (tạo vòng phản hồi chất lượng) — Grade B — **OUT v1**, vì cần chống spam, triage, PII policy và workflow mới; 10 người đầu dùng form khảo sát ngoài hệ thống.
- **Danh sách học tập đã lưu** — Impact L (retention tiềm năng nhưng không giúp hoàn thành tra cứu đầu tiên) — Grade B — **OUT v1**, vì kéo theo tài khoản công khai và vi phạm quy tắc không giữ L-above-A.

## Cut list (NOT in v1 — deferred, not deleted)

- AI chatbot/RAG, tự dịch rồi tự xuất bản — rủi ro sai sử liệu và là C; không cần để chứng minh promise.
- VR/AR, tour 3D, GIS nâng cao, mô phỏng trận đánh realtime — các C sibling bị cắt để giữ timeline/search thực dụng.
- Tài khoản công chúng, bình luận, đóng góp, danh sách đã lưu, thông báo — không cần cho ba journey cốt lõi và làm rộng auth/moderation.
- Thanh toán, bán vé, thương mại điện tử và ứng dụng mobile native — ngoài đề tài tra cứu.
- Upload file binary tùy ý và xử lý ảnh trên object storage — v1 chỉ nhận media URL đã được kiểm tra cùng credit/license/alt; tránh surface upload bảo mật cao.
- Autosave realtime, collaborative editing, revision diff toàn văn — thay bằng cảnh báo unsaved changes, updated timestamp và audit log.
- Animation timeline nâng cao, bản đồ chiến thuật, dashboard analytics đẹp — chỉ làm sau khi nội dung, source, locale và quyền hoạt động đúng.
- Nội dung học thuật dài và quyền ảnh bên thứ ba không rõ — seed v1 dùng mô tả ngắn, nguồn công khai rõ; không giả vờ có giấy phép ảnh.

## Decision

**GO** — nghiên cứu xác nhận nhu cầu rõ về nguồn đáng tin, chronology và bản tiếng Anh nhất quán; phạm vi v1 giữ các feature H-impact, re-architect auth/media về B và cắt toàn bộ C không phục vụ trực tiếp ba user journey.
