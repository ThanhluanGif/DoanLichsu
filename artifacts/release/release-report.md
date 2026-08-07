# Release check
- Result: **PASS**
- Version: `0.1.0`
- Commit: `3013e1c4d9c6ffd192e977c05a75dd1278a6adf2`
- Started: 2026-08-07T16:48:45.705Z
- Finished: 2026-08-07T16:51:24.796Z

## Steps

- PASS `npm ci` — 24895 ms
- PASS `npm run db:migrate` — 1539 ms
- PASS `npm run db:seed` — 3318 ms
- PASS `npm run lint` — 12277 ms
- PASS `npm run typecheck` — 4429 ms
- PASS `npm test -- --testTimeout=15000` — 11355 ms
- PASS `npm run build` — 19946 ms
- PASS `npm run verify:standalone` — 655 ms
- PASS `npm run test:contract -- --base-url http://127.0.0.1:3218 --cleanup-database /var/folders/2w/pq4j4x216vb2d4k__dxwcy1c0000gn/T/quan-su-viet-release-check-oAHNL9/release.sqlite --report-dir artifacts/release/contract` — 6247 ms
- PASS `/usr/local/Cellar/node/26.4.0/bin/node scripts/backup.mjs` — 303 ms
- PASS `/usr/local/Cellar/node/26.4.0/bin/node scripts/restore.mjs /var/folders/2w/pq4j4x216vb2d4k__dxwcy1c0000gn/T/quan-su-viet-release-check-oAHNL9/backups/quan-su-viet-2026-08-07T16-50-12-603Z.sqlite` — 236 ms
- PASS `npm audit --omit=dev --audit-level=high --json` — 4278 ms
- PASS `npm run test:e2e` — 65041 ms

- Recovery: SHA-256 verified; 50 nodes / 100 translations / 50 sources / 3 users; restored HTTP health 200
- Dependency High/Critical: 0/0
- Sensitive log scan: PASS
