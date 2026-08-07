# Runbook release và phục hồi v1

## 1. Chuẩn bị bí mật và persistent database

Không commit file env. Tạo `SESSION_SECRET` tối thiểu 32 ký tự và ba mật khẩu seed riêng
biệt, tối thiểu 16 ký tự, không dùng giá trị demo. `APP_ORIGIN` phải là origin HTTPS cuối
cùng vì mutation admin kiểm tra Origin. Cổng container chỉ bind `127.0.0.1`; reverse proxy
hoặc tunnel là lớp duy nhất công khai.

```bash
cp .env.example /tmp/quan-su-viet-release.env
chmod 600 /tmp/quan-su-viet-release.env
```

## 2. Build, seed và chạy container

Dockerfile copy lockfile trước source để cache dependency nhưng luôn rebuild layer source.
Sau deploy, kiểm tra route trong OpenAPI trước khi chẩn đoán code để phát hiện stale image.
Base image dùng Docker Official Library mirror trên Amazon ECR Public để tránh Docker Hub
TLS/metadata timeout; có thể ghi đè build arg `NODE_IMAGE` nếu hạ tầng dùng registry nội bộ.

```bash
docker compose --env-file /tmp/quan-su-viet-release.env build --pull
docker compose --env-file /tmp/quan-su-viet-release.env run --rm -e ALLOW_DEMO_SEED=1 app \
  sh -c 'node scripts/migrate.mjs && node scripts/seed.mjs'
docker compose --env-file /tmp/quan-su-viet-release.env up -d
curl -fsS http://127.0.0.1:3002/openapi.json | jq -e '.paths["/api/v1/admin/contents"]'
```

Đặt HTTPS proxy/tunnel trước cổng loopback, cập nhật `APP_ORIGIN` thành URL HTTPS rồi
`docker compose up -d --force-recreate`. Named volume `release-data` phải còn nguyên qua
recreate/restart.

## 3. Backup và restore rehearsal

```bash
DATABASE_PATH=/absolute/persistent/quan-su-viet.db BACKUP_DIR=/secure/backups npm run db:backup
RESTORE_DATABASE_PATH=/tmp/restore-proof.sqlite npm run db:restore -- /secure/backups/quan-su-viet-....sqlite
DATABASE_PATH=/tmp/restore-proof.sqlite npm run db:migrate
```

Lệnh backup chạy SQLite online backup, integrity check và tạo manifest SHA-256. Restore
từ chối checksum/schema/count sai và không bao giờ ghi đè destination. Sau restore, chạy
app với `DATABASE_PATH` mới rồi kiểm tra `/healthz`, search và một public detail trước khi
đổi volume/path production.

## 4. Release gate

```bash
E2E_BASE_URL=https://release.example.com \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
E2E_EDITOR_EMAIL=... E2E_EDITOR_PASSWORD=... \
E2E_REVIEWER_EMAIL=... E2E_REVIEWER_PASSWORD=... \
npm run release:check
```

Gate ghi report JSON/Markdown vào `artifacts/release/`, giữ screenshot/trace chỉ khi test
thất bại, quét log để không chứa credential/cookie/token và fail nếu dependency audit còn
High/Critical. Không đổi `status: done` nếu HTTPS, restart hoặc restore proof chưa tồn tại.
Khi chạy riêng proof sau restart, đặt `E2E_OUTPUT_DIR` và `E2E_REPORT_DIR` sang thư mục
`artifacts/release/restart-*` để không ghi đè full-suite report của release gate.

## 5. Restart, rollback và sự cố

- Restart proof: ghi ID/slug public, `docker compose restart app`, đợi healthy rồi curl lại
  health/OpenAPI/search/detail và đăng nhập qua browser.
- Rollback code: chạy image tag trước với cùng volume; migration v1 chỉ additive. Không hạ
  schema bằng cách chép file cũ đè lên DB.
- Rollback data: dừng writer, restore snapshot vào file mới, smoke-test file mới, rồi đổi
  volume/path. Giữ snapshot lỗi để điều tra; không sửa manifest.
- Route mới 404 sau deploy: kiểm tra live `/openapi.json`. Route vắng mặt nghĩa là image
  stale; rebuild source layer hoặc dùng `--no-cache` một lần.
- Health 503: xác nhận absolute `DATABASE_PATH`, quyền volume, migration checksum và
  `PRAGMA integrity_check`; không để app tự tạo DB rỗng ở path khác.
