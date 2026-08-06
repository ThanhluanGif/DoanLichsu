# Contract report

- Run: 07542013
- Generated: 2026-08-06T17:38:54.593Z
- Base URL: http://127.0.0.1:3000
- Planning operations: 37
- Runtime operations: 37
- Cases: 114/114 passed
- Live response schemas validated: 98
- Protected operations probed without a session: 23
- Drift: 0 missing, 0 extra, 0 shape
- Identity: verified marker over en/ARTIFACT/bach-dang-wooden-stakes; baseline sha256=db3b3f875e281565fce6cd5ea5f716f4bf715fd02d829dfac0bb8a683cf621e2
- Cleanup: verified exact run-owned teardown and baseline sha256=db3b3f875e281565fce6cd5ea5f716f4bf715fd02d829dfac0bb8a683cf621e2: contentNodes=50, translations=100, sources=50, media=10, users=3, auditLogs=0, rateLimits=0, schemaVersion=3
- Live URLs:
  - http://127.0.0.1:3000/healthz
  - http://127.0.0.1:3000/openapi.json
  - http://127.0.0.1:3000/docs
  - http://127.0.0.1:3000/sitemap.xml
  - http://127.0.0.1:3000/robots.txt
  - http://127.0.0.1:3000/api/v1/vi/home

| Result | Case | HTTP | Diff |
|---|---|---:|---|
| PASS | preflight.database-identity | 200 |  |
| PASS | plumbing.openapi | 200 |  |
| PASS | plumbing.health | 200 |  |
| PASS | plumbing.docs | 200 |  |
| PASS | plumbing.sitemap | 200 |  |
| PASS | plumbing.sitemap-empty-until-c006 | 200 |  |
| PASS | plumbing.robots | 200 |  |
| PASS | plumbing.robots-policy | 200 |  |
| PASS | public.home | 200 |  |
| PASS | public.periods | 200 |  |
| PASS | public.timeline | 200 |  |
| PASS | public.contents.first | 200 |  |
| PASS | public.contents.deterministic | 200 |  |
| PASS | public.pagination.stable | 200 |  |
| PASS | public.contents.title-order | 200 |  |
| PASS | public.pagination.title-order | 200 |  |
| PASS | public.detail | 200 |  |
| PASS | public.search | 200 |  |
| PASS | public.taxonomies | 200 |  |
| PASS | public.alternate | 200 |  |
| PASS | error.400.invalid-query | 400 |  |
| PASS | error.404.not-found | 404 |  |
| PASS | error.404.unknown-locale | 404 |  |
| PASS | error.404.unknown-type | 404 |  |
| PASS | error.401.no-session | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/auth/logout | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/auth/me | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/dashboard | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/contents | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/contents/{id} | 401 |  |
| PASS | rbac.unauthenticated.patch./api/v1/admin/contents/{id} | 401 |  |
| PASS | rbac.unauthenticated.put./api/v1/admin/contents/{id}/translations/{locale} | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/sources | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/sources | 401 |  |
| PASS | rbac.unauthenticated.patch./api/v1/admin/sources/{id} | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/media | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/media | 401 |  |
| PASS | rbac.unauthenticated.patch./api/v1/admin/media/{id} | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents/{id}/submit-review | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents/{id}/approve | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents/{id}/reject | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents/{id}/publish | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/contents/{id}/archive | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/users | 401 |  |
| PASS | rbac.unauthenticated.post./api/v1/admin/users | 401 |  |
| PASS | rbac.unauthenticated.patch./api/v1/admin/users/{id} | 401 |  |
| PASS | rbac.unauthenticated.get./api/v1/admin/audit-logs | 401 |  |
| PASS | auth.rate-limit.failure-1 | 401 |  |
| PASS | auth.rate-limit.failure-2 | 401 |  |
| PASS | auth.rate-limit.failure-3 | 401 |  |
| PASS | auth.rate-limit.failure-4 | 401 |  |
| PASS | auth.rate-limit.failure-5 | 401 |  |
| PASS | error.429.rate-limit | 429 |  |
| PASS | auth.login.admin | 200 |  |
| PASS | auth.cookie.admin | 200 |  |
| PASS | auth.login.editor | 200 |  |
| PASS | auth.cookie.editor | 200 |  |
| PASS | auth.login.reviewer | 200 |  |
| PASS | auth.cookie.reviewer | 200 |  |
| PASS | auth.me | 200 |  |
| PASS | error.403.editor-users | 403 |  |
| PASS | error.403.reviewer-users | 403 |  |
| PASS | error.403.editor-user-create | 403 |  |
| PASS | error.403.reviewer-user-create | 403 |  |
| PASS | error.403.editor-audit | 403 |  |
| PASS | error.403.reviewer-audit | 403 |  |
| PASS | error.403.invalid-origin | 403 |  |
| PASS | admin.dashboard | 200 |  |
| PASS | admin.contents.list | 200 |  |
| PASS | admin.sources.list | 200 |  |
| PASS | admin.media.list | 200 |  |
| PASS | admin.users.list | 200 |  |
| PASS | admin.audit.list | 200 |  |
| PASS | admin.source.create | 201 |  |
| PASS | admin.source.patch | 200 |  |
| PASS | admin.media.create | 201 |  |
| PASS | admin.media.patch | 200 |  |
| PASS | admin.user.create | 201 |  |
| PASS | auth.login.test-user | 200 |  |
| PASS | auth.cookie.test-user | 200 |  |
| PASS | auth.logout.test-user | 200 |  |
| PASS | admin.user.patch | 200 |  |
| PASS | error.403.editor-user-patch | 403 |  |
| PASS | error.403.reviewer-user-patch | 403 |  |
| PASS | admin.content.create | 201 |  |
| PASS | admin.content.get | 200 |  |
| PASS | admin.translation.put | 200 |  |
| PASS | error.409.stale-version | 409 |  |
| PASS | workflow.submit | 200 |  |
| PASS | workflow.reject-reason-required | 400 |  |
| PASS | workflow.editor-approve-forbidden | 403 |  |
| PASS | workflow.editor-reject-forbidden | 403 |  |
| PASS | workflow.editor-archive-forbidden | 403 |  |
| PASS | workflow.reject | 200 |  |
| PASS | workflow.resubmit | 200 |  |
| PASS | workflow.approve | 200 |  |
| PASS | error.422.publish-source | 422 |  |
| PASS | admin.content.patch | 200 |  |
| PASS | workflow.editor-publish-forbidden | 403 |  |
| PASS | workflow.publish | 200 |  |
| PASS | public.created-detail | 200 |  |
| PASS | public.created-alternate | 200 |  |
| PASS | workflow.published-source-immutable | 422 |  |
| PASS | workflow.published-media-immutable | 422 |  |
| PASS | admin.audit.object | 200 |  |
| PASS | cleanup.content.archive | 200 |  |
| PASS | cleanup.public-hidden | 404 |  |
| PASS | diagnostic.intentional-openapi-mutation | — | post /api/v1/admin/sources request: property mismatch expected=[accessedAt,author,citationNote,publisher,title,url,year] OpenAPI=[accessedAt,citationNote,publisher,title,url,year] |
| PASS | cleanup.database | — |  |
| PASS | openapi.planning-coverage | 200 |  |
| PASS | openapi.no-extra-operations | 200 |  |
| PASS | openapi.request-response-shapes | 200 |  |
| PASS | report.no-secrets | — |  |
