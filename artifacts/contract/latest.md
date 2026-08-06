# Contract report

- Generated: 2026-08-06T13:44:50.064Z
- Base URL: http://127.0.0.1:3000
- Planning operations: 37
- Runtime operations: 37
- Cases: 72/72 passed
- Drift: 0 missing, 0 extra
- Cleanup: content archived; test user disabled; database teardown caller-owned dedicated database

| Result | Case | HTTP | Diff |
|---|---|---:|---|
| PASS | plumbing.openapi | 200 |  |
| PASS | plumbing.health | 200 |  |
| PASS | plumbing.docs | 200 |  |
| PASS | plumbing.sitemap | 200 |  |
| PASS | plumbing.robots | 200 |  |
| PASS | public.home | 200 |  |
| PASS | public.periods | 200 |  |
| PASS | public.timeline | 200 |  |
| PASS | public.contents.first | 200 |  |
| PASS | public.contents.deterministic | 200 |  |
| PASS | public.pagination.stable | 200 |  |
| PASS | public.detail | 200 |  |
| PASS | public.search | 200 |  |
| PASS | public.taxonomies | 200 |  |
| PASS | public.alternate | 200 |  |
| PASS | error.400.invalid-query | 400 |  |
| PASS | error.404.not-found | 404 |  |
| PASS | error.401.no-session | 401 |  |
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
| PASS | admin.user.patch | 200 |  |
| PASS | admin.user.last-admin | 422 |  |
| PASS | admin.content.create | 201 |  |
| PASS | admin.content.get | 200 |  |
| PASS | admin.translation.put | 200 |  |
| PASS | error.409.stale-version | 409 |  |
| PASS | workflow.submit | 200 |  |
| PASS | workflow.reject-reason-required | 400 |  |
| PASS | workflow.editor-approve-forbidden | 403 |  |
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
| PASS | diagnostic.shape-diff | — | missing required field(s): data.id, data.status |
| PASS | auth.logout | 200 |  |
| PASS | openapi.planning-coverage | 200 |  |
| PASS | openapi.no-extra-operations | 200 |  |
