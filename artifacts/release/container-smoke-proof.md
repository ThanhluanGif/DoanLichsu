# Docker container smoke proof

- Status: **PASS_LOCAL_ONLY**
- Origin: `http://127.0.0.1:43146` (isolated local compose; not official production)
- Compose project: `qsv-c146`
- Image: `quan-su-viet:0.1.0`
- Image digest: `sha256:934899893a32415ed385636695a26a5e8ef45e3f7309630c8b169e5772688c04`
- Build context: 62,050 bytes; only `artifacts/transparency/dashboard.json` is re-included
- Seed: migration 10, 50 nodes, 100 translations, 50 sources, 3 users
- Before restart: health/OpenAPI/search/home = `200/200/200/200`
- After restart: container healthy; health/OpenAPI/search/home = `200/200/200/200`
- Search results: 4 before and 4 after restart
- Public Beta: **DISABLED**
- External approvals: **NOT CLAIMED**

The first build correctly exposed that `.dockerignore` excluded a build-time
dashboard import. The minimal exception fixed the image without copying the
whole evidence directory.
