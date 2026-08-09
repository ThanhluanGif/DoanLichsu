# Stage 04 — ADR (architecture decisions)

Short. The most valuable section is what you are NOT doing and why.

## Gate — check ALL before `/flow next`
- [x] Each decision has a one-line "why" and a one-line "what I rejected"
- [x] The NOT-doing list is written
- [x] Decisions cover: data storage, auth approach, deploy target
- [x] No FILL placeholders remain in this file

## Decisions

| # | Decision | Why | Rejected alternative |
|---|---|---|---|
| 1 | Một **Next.js 16 App Router full-stack deployable unit** cho public UI, admin UI và Route Handlers `/api/v1` | Một sinh viên có một build/deploy, shared TypeScript/Zod và không tạo seam mạng nội bộ giả khi quy mô chỉ 50 records | Tách `apps/web` Next.js + `apps/api` NestJS ngay v1: kiến trúc tốt khi có hai team/scale độc lập nhưng tăng gấp đôi config, auth/CORS/deploy và rủi ro field drift mà chưa tạo giá trị người dùng |
| 2 | **SQLite WAL + better-sqlite3 13 + SQL migrations**; file DB nằm trên persistent volume, khóa/foreign key/index được khai báo rõ | Bộ dữ liệu nhỏ, single-region/single-writer; cho phép seed/backup/restore và demo offline có bằng chứng mà không phụ thuộc tài khoản cloud | PostgreSQL + Prisma: phù hợp v2/multi-writer và tìm kiếm lớn, nhưng cần service/secrets/migration runtime; JSON/static files bị loại vì không bảo đảm transaction, RBAC workflow và audit query |
| 3 | Mô hình `content_nodes` + `content_translations` + subtype details + source/media/relation; `content_claims` song ngữ và `claim_evidence` nối claim tới source bằng locator/quote; source và claim có workflow kiểm chứng riêng | Giữ một thực thể lịch sử ổn định khi slug/bản dịch thay đổi, phân biệt dữ kiện với diễn giải tranh luận và chứng minh từng luận điểm thay vì chỉ đặt danh mục nguồn cuối bài | Một bảng bài viết JSON khổng lồ hoặc citation note toàn bài: CRUD nhanh nhưng không constraint được claim–evidence, trạng thái xác minh, quan hệ, subtype, alternate locale và audit; một bảng riêng hoàn toàn cho từng type gây lặp translation/source logic |
| 4 | Auth quản trị không public signup: **Argon2id qua @node-rs/argon2 + encrypted/signed HttpOnly cookie bằng iron-session 8**, role lưu DB, RBAC kiểm tra ở mọi mutation, login rate-limit trong datastore | Dùng primitive/library đã kiểm chứng, không phát minh password hashing/session format; session có thể revoke bằng `sessionVersion` | JWT trong `localStorage` (XSS/revoke khó), tự viết crypto, OAuth ngoài (thêm provider/secrets và không cần cho ba tài khoản nội bộ), chỉ ẩn nút ở client (không phải authorization) |
| 5 | REST `/api/v1` với shape JSON cố định, Zod validation và **OpenAPI 3.1 runtime tại `/openapi.json`** sinh từ cùng catalog | Hợp đồng đọc được bởi frontend/test/giảng viên; error chung `{code,message,details?,requestId}` giảm drift | tRPC/Server Actions-only: type-safe nội bộ nhưng không tạo contract HTTP độc lập theo yêu cầu đồ án; viết OpenAPI rời code mà không contract-test dễ stale |
| 6 | Search v1 chuẩn hóa Unicode NFD, bỏ dấu/`đ`, lowercase và lưu `search_text`; query token + filter type/period/tag, pagination deterministic | Với 50 records, cách này đáp ứng có/không dấu, dễ test và không cần extension DB | PostgreSQL `unaccent`/`pg_trgm` và search service riêng: mạnh hơn nhưng là chi phí vận hành chưa cần; fuzzy/semantic search bị hoãn vì dễ trả sai ngữ cảnh lịch sử |
| 7 | Nội dung body là plain text/đoạn văn được escape; media v1 là URL đã kiểm tra cùng `credit`, `license`, `altVi`, `altEn` | Loại surface XSS/upload lớn nhưng vẫn chứng minh source/media workflow | Raw HTML/WYSIWYG và upload binary trực tiếp: cần sanitizer, object storage, MIME scanning, quota và quyền ảnh phức tạp |
| 8 | CSS Modules + design tokens trong `DESIGN.md`, responsive/object-first; không phụ thuộc UI kit nặng | Kiểm soát typography lịch sử, accessibility và bundle; component states được xây theo đúng domain | Tailwind/plugin stack lớn hoặc template admin có sẵn: nhanh ban đầu nhưng dễ tạo UI generic và token drift; canvas-only timeline bị loại vì accessibility |
| 9 | Vitest cho domain/API integration, Playwright cho public/admin E2E, backup-restore smoke; CI chạy lint/typecheck/test/build | Các rủi ro chính là quyền, workflow, locale/contract và recovery nên phải có negative/world-state checks | Chỉ unit test hoặc “build xanh”: không chứng minh integration, UI, quyền và restore |
| 10 | Deploy dưới dạng **Node standalone/Docker trên host có persistent volume**, HTTPS qua reverse proxy/Cloudflare Tunnel; `/healthz` và version được công khai | SQLite cần filesystem bền; một container dễ demo, backup và rollback, tunnel cung cấp URL HTTPS để verify như người dùng | Vercel/serverless filesystem tạm (mất mutation), GitHub Pages (không có API/admin), Kubernetes (quá mức); production-scale Postgres host là migration v2 |

## NOT doing in v1 (and why it's safe to skip)

- Không tách NestJS/PostgreSQL/microservice trong v1; contract/data model giữ đường nâng cấp nhưng deploy đơn khối giảm failure surface.
- Không public signup, social login, password reset email hoặc tài khoản người học; ba role quản trị được seed/rotate qua lệnh vận hành.
- Không upload file binary, WYSIWYG HTML, realtime autosave/collaboration; v1 dùng media URL rights-cleared và form có unsaved warning.
- Không AI/RAG/auto-translation, VR/AR/3D/GIS hoặc mô phỏng trận đánh; đây là C-feature không cần cho core promise.
- Không comments, correction inbox, saved lists, notifications, payments hoặc mobile native; đều nằm ngoài ba journey và tạo auth/moderation mới.
- Không claim dữ liệu demo là chuyên khảo học thuật hoàn tất chỉ vì seed chạy; UI luôn hiển thị source/reviewer/update và nội dung phải qua workflow trước publish.
- Không dùng ảnh bên thứ ba không rõ license; thiếu media hợp lệ thì dùng layout chữ/minh họa nguyên bản thay vì vi phạm quyền.
