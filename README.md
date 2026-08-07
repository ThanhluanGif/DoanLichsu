# Quân Sử Việt

Runtime Next.js 16/TypeScript cho kho tư liệu song ngữ về lịch sử quân sự Việt Nam. Bản
nền tảng phục vụ health check, OpenAPI và tài liệu API; các public/admin feature được bổ
sung theo từng build card sau.

## Chạy cục bộ

Yêu cầu Node.js 22+ và npm 10+; CI dùng Node.js 22.

```bash
cp .env.example .env.local
npm ci
npm run db:migrate
npm run dev
```

Mở `http://127.0.0.1:3000`, `/healthz`, `/openapi.json` hoặc `/docs`.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI chạy migration và toàn bộ chuỗi kiểm tra trên mỗi pull request và push vào `main`.

## Database và deploy

`DATABASE_PATH` trỏ tới file SQLite. Production phải đặt file này trên persistent volume;
filesystem tạm của serverless không phù hợp. Migration SQL trong `migrations/` được áp
dụng theo số phiên bản, ghi checksum và thời điểm vào `schema_migrations`. Có thể chạy lại
`npm run db:migrate` an toàn; migration đã áp dụng sẽ không chạy lần hai và checksum drift
sẽ làm lệnh thất bại.

Build deployable unit:

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

`next.config.ts` bật standalone output cho Node host/container. Bản build chép static assets,
migration runner và SQL migrations vào `.next/standalone`. Có thể smoke-test đúng artifact
độc lập (dùng đường dẫn database tuyệt đối trong production):

```bash
cd .next/standalone
DATABASE_PATH=/absolute/path/to/quan-su-viet.db node scripts/migrate.mjs
DATABASE_PATH=/absolute/path/to/quan-su-viet.db HOSTNAME=127.0.0.1 PORT=3000 node server.js
```

Reverse proxy chịu trách nhiệm cung cấp HTTPS; file SQLite và các file `-wal`/`-shm` phải
cùng nằm trên persistent volume. `APP_VERSION` có thể ghi đè phiên bản hiển thị ở
`/healthz` cho từng release. Health probe mở SQLite read-only, trả `503` không body nếu
file/schema chưa sẵn sàng và không tự tạo database ở một đường dẫn cấu hình sai.

## Release v1 và phục hồi

Release container chạy non-root, chỉ publish cổng loopback và giữ SQLite trong named
volume. Sao chép `.env.example` thành một file env riêng, điền `APP_ORIGIN`,
`SESSION_SECRET` và ba mật khẩu seed production không trùng nhau, rồi chạy:

```bash
docker compose --env-file /path/to/release.env build --pull
docker compose --env-file /path/to/release.env run --rm -e ALLOW_DEMO_SEED=1 app \
  sh -c 'node scripts/migrate.mjs && node scripts/seed.mjs'
docker compose --env-file /path/to/release.env up -d
```

Backup/restore không ghi đè file nguồn hoặc đích có sẵn:

```bash
npm run db:backup
npm run db:restore -- /absolute/path/to/snapshot.sqlite
```

Quy trình HTTPS, restart, release gate, rollback và restore rehearsal chi tiết nằm tại
[`docs/release-runbook.md`](docs/release-runbook.md).
