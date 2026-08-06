# Stage 05 — Interface Contract (the seam)

The contract is whatever sits between your core and its consumer. For a web app that's
API endpoints (the table below). For a CLI it's commands + flags + output shapes; for a
plugin it's hooks + filters; for a pipeline it's input/output file schemas. Keep the
table's SPIRIT — every feature maps to an interface, every interface has its shapes
written before code — and adapt the columns to your project's shape.

Written BEFORE any code. Backend cards build TO this table; UI cards consume FROM it.
The #1 AI-build failure is producer/consumer drift — backend ships one shape, UI assumes
another, both look green. This file is the cheap fix.

## Gate — check ALL before `/flow next`
- [x] Every PRD feature maps to at least one INTERFACE below (web: endpoint · cli: command · library: public function · skill: command/file)
- [x] Every interface has its INPUT and OUTPUT shapes written (web: request+response · cli: flags+output/exit code · library: args+return)
- [x] Access/effects column filled for every interface (web: public/token/admin · non-web: writes/side-effects, or "none")
- [x] No FILL placeholders remain in this file

## OpenAPI / Swagger rule  (web only — N/A for cli/library/skill)

For non-web types there is no served spec; the equivalent "no producer/consumer drift" check
is the per-type done-evidence (the command runs / the API imports / the skill installs+runs).
For `web`:

This table is the PLANNING source of truth. If the framework serves a spec (FastAPI →
`/openapi.json` + `/docs`), the served spec is the RUNTIME artifact of this same contract:
- Path/method/shapes here and in the served spec must agree — the contract-test card
  asserts every endpoint in this table exists in the live `/openapi.json` with matching
  request/response shapes.
- Change flows ONE way: amend this file first, then the code, then the spec follows.
- **Docs land with the API, not after**: the served spec is live from the vertical-slice
  card onward, and every backend card's verify checks its endpoints appear in the live
  `/docs` with correct schemas. The contract-test card later asserts full agreement —
  but by then the docs have been growing card by card, never a catch-up task.
- Keep `/docs` enabled at least until v1 ships — it's the free human-readable contract.

## Interfaces  (web: endpoints · cli: commands · library: functions · skill: commands)

Adapt the columns to your project type. Web: Method/Path/Access(=auth: public/token/admin)/
Request/Response. CLI: Command/Flags/Access(=side-effects)/Input/Output+exit. Library:
Function/—/Access(=none)/Args/Return. The shared column below is "Access/Effects".

| Method/Interface | Path/Name | Access/Effects | Input shape | Output shape |
|---|---|---|---|---|
| GET | `/healthz` | Public; read DB health, no write | none | `HealthResponse` |
| GET | `/openapi.json` | Public; no write | none | OpenAPI 3.1 document describing every HTTP row in this table |
| GET | `/docs` | Public; no write | none | HTML API reference generated from `/openapi.json` |
| GET | `/api/v1/{locale}/home` | Public; published rows only | Path `locale: Locale` | `DataResponse<HomeView>` |
| GET | `/api/v1/{locale}/periods` | Public; published rows only | Path `locale`; query `{includeEmpty?: boolean}` | `ListResponse<PeriodView>` |
| GET | `/api/v1/{locale}/timeline` | Public; published rows only | Path `locale`; query `TimelineQuery` | `ListResponse<TimelineItem>` |
| GET | `/api/v1/{locale}/contents` | Public; published rows only | Path `locale`; query `ContentListQuery` | `ListResponse<ContentListItem>` |
| GET | `/api/v1/{locale}/contents/{type}/{slug}` | Public; published row only | Path `{locale,type,slug}` | `DataResponse<ContentDetail>` or `ApiError` 404 |
| GET | `/api/v1/{locale}/search` | Public; published rows only | Path `locale`; query `SearchQuery` | `ListResponse<SearchResult>` |
| GET | `/api/v1/{locale}/taxonomies` | Public; published-used terms only | Path `locale`; query `{kind?: TaxonomyKind}` | `DataResponse<TaxonomyView>` |
| GET | `/api/v1/contents/{id}/alternate` | Public; published translations only | Path `id`; query `{locale: Locale}` | `DataResponse<AlternateView>` where `alternate` may be `null` |
| GET | `/sitemap.xml` | Public; no write | none | XML URL set containing canonical published VI/EN routes |
| GET | `/robots.txt` | Public; no write | none | text/plain allowing public routes and disallowing `/admin` and `/api/v1/admin` |
| POST | `/api/v1/auth/login` | Public, rate-limited; sets encrypted HttpOnly session cookie; writes login audit | `LoginInput` | `DataResponse<AuthUser>` or `ApiError` 401/429 |
| POST | `/api/v1/auth/logout` | Authenticated; clears cookie; writes logout audit | none | `DataResponse<{loggedOut:true}>` |
| GET | `/api/v1/auth/me` | Authenticated; no write | session cookie | `DataResponse<AuthUser>` or `ApiError` 401 |
| GET | `/api/v1/admin/dashboard` | Editor/Reviewer/Admin; no write | session cookie | `DataResponse<DashboardView>` |
| GET | `/api/v1/admin/contents` | Editor/Reviewer/Admin; no write | query `AdminContentListQuery` | `ListResponse<AdminContentListItem>` |
| POST | `/api/v1/admin/contents` | Editor/Reviewer/Admin; creates DRAFT + audit | `ContentCreateInput` | `DataResponse<AdminContentDetail>` status 201 |
| GET | `/api/v1/admin/contents/{id}` | Editor/Reviewer/Admin; no write | Path `id` | `DataResponse<AdminContentDetail>` or `ApiError` 404 |
| PATCH | `/api/v1/admin/contents/{id}` | Editor/Reviewer/Admin; update allowed fields + audit; cannot publish | Path `id`; `ContentUpdateInput` | `DataResponse<AdminContentDetail>` or `ApiError` 409 on stale `version` |
| PUT | `/api/v1/admin/contents/{id}/translations/{locale}` | Editor/Reviewer/Admin; upsert translation + audit | Path `{id,locale}`; `TranslationInput` | `DataResponse<AdminTranslation>` or `ApiError` 409 on slug conflict |
| GET | `/api/v1/admin/sources` | Editor/Reviewer/Admin; no write | query `SourceListQuery` | `ListResponse<AdminSourceView>` |
| POST | `/api/v1/admin/sources` | Editor/Reviewer/Admin; create source + audit | `SourceInput` | `DataResponse<AdminSourceView>` status 201 |
| PATCH | `/api/v1/admin/sources/{id}` | Editor/Reviewer/Admin; update source + audit only while not attached to any PUBLISHED content; published references are immutable | Path `id`; `SourceUpdateInput` | `DataResponse<AdminSourceView>` or `ApiError` 409 on stale `version`, 422 when attached to published content |
| GET | `/api/v1/admin/media` | Editor/Reviewer/Admin; no write | query `MediaListQuery` | `ListResponse<AdminMediaView>` |
| POST | `/api/v1/admin/media` | Editor/Reviewer/Admin; metadata-only create + audit | `MediaInput` | `DataResponse<AdminMediaView>` status 201 |
| PATCH | `/api/v1/admin/media/{id}` | Editor/Reviewer/Admin; metadata-only update + audit only while not attached to any PUBLISHED content; published media are immutable | Path `id`; `MediaUpdateInput` | `DataResponse<AdminMediaView>` or `ApiError` 409 on stale `version`, 422 when attached to published content |
| POST | `/api/v1/admin/contents/{id}/submit-review` | Editor/Reviewer/Admin; selected translations must be TRANSLATING and become READY_FOR_REVIEW; node → IN_REVIEW unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | Path `id`; `LocaleWorkflowInput` | `DataResponse<WorkflowResult>` or `ApiError` 422 |
| POST | `/api/v1/admin/contents/{id}/approve` | Reviewer/Admin; selected READY_FOR_REVIEW locales → APPROVED + reviewer/time; node → APPROVED unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | Path `id`; `ReviewInput` | `DataResponse<WorkflowResult>` or `ApiError` 403/422 |
| POST | `/api/v1/admin/contents/{id}/reject` | Reviewer/Admin; selected READY_FOR_REVIEW locales → TRANSLATING + required reason; node → REJECTED unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | Path `id`; `RejectInput` | `DataResponse<WorkflowResult>` or `ApiError` 403/422 |
| POST | `/api/v1/admin/contents/{id}/publish` | Reviewer/Admin; publish selected approved locales after source/translation/media validation; node becomes PUBLISHED when ≥1 locale is published; audit | Path `id`; `LocaleWorkflowInput` | `DataResponse<WorkflowResult>` or `ApiError` 403/422 with `details.violations` |
| POST | `/api/v1/admin/contents/{id}/archive` | Reviewer/Admin; non-deleted row → ARCHIVED + audit | Path `id`; `VersionInput` | `DataResponse<WorkflowResult>` or `ApiError` 403/422 |
| GET | `/api/v1/admin/users` | Admin only; no password hash returned | query `UserListQuery` | `ListResponse<UserView>` |
| POST | `/api/v1/admin/users` | Admin only; create disabled/public-login-free user + audit | `UserCreateInput` | `DataResponse<UserView>` status 201 |
| PATCH | `/api/v1/admin/users/{id}` | Admin only; update role/active/sessionVersion + audit; cannot disable last active Admin | Path `id`; `UserUpdateInput` | `DataResponse<UserView>` or `ApiError` 422 |
| GET | `/api/v1/admin/audit-logs` | Admin only; no write | query `AuditListQuery` | `ListResponse<AuditLogView>` |
| CLI | `npm run db:seed` | Local operator; idempotently writes demo DB, never production-reset without explicit env | env `DATABASE_PATH`; no stdin | stdout `SeedResult`; exit 0 success, 1 validation/write failure |
| CLI | `npm run db:backup` | Local operator; reads DB and writes timestamped snapshot + SHA-256 manifest | env `DATABASE_PATH`, optional `BACKUP_DIR` | stdout `BackupResult`; exit 0 success, 1 failure |
| CLI | `npm run db:restore -- <snapshot>` | Local operator; validates manifest, writes a new restore target, never overwrites source by default | argv `snapshot`; env optional `RESTORE_DATABASE_PATH` | stdout `RestoreResult`; exit 0 verified, 1 checksum/schema/count failure |

## Shared shapes (objects used by multiple interfaces)

```ts
type Locale = "vi" | "en";
type ContentType = "PERIOD" | "EVENT" | "PERSON" | "ARTIFACT" | "TOPIC";
type WorkflowStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
type TranslationStatus = "NOT_STARTED" | "TRANSLATING" | "READY_FOR_REVIEW" | "APPROVED" | "PUBLISHED";
type Role = "ADMIN" | "EDITOR" | "REVIEWER";
type DatePrecision = "DAY" | "MONTH" | "YEAR" | "APPROXIMATE";
type TaxonomyKind = "period" | "tag" | "type";

interface DataResponse<T> { data: T }
interface PageMeta { page: number; pageSize: number; total: number; totalPages: number }
interface ListResponse<T> { data: T[]; meta: PageMeta }
interface ApiError {
  code: string;
  message: string;
  details?: { fieldErrors?: Record<string, string[]>; violations?: string[] };
  requestId: string;
}

interface HealthResponse { status: "ok"; version: string; database: "ok"; timestamp: string }
interface MediaView {
  id: string; url: string; kind: "IMAGE" | "DOCUMENT"; credit: string; license: string;
  alt: string; caption: string | null; width: number | null; height: number | null;
}
interface SourceView {
  id: string; title: string; author: string | null; publisher: string | null;
  year: number | null; url: string; accessedAt: string; citationNote: string | null;
}
interface PeriodRef { id: string; title: string; slug: string }
interface ContentListItem {
  id: string; type: ContentType; locale: Locale; title: string; slug: string; summary: string;
  thumbnail: MediaView | null; startDate: string | null; endDate: string | null;
  datePrecision: DatePrecision | null; period: PeriodRef | null; tags: string[];
}
interface ContentDetail extends ContentListItem {
  body: string; location: string | null; result: string | null; role: string | null;
  artifactMeta: Record<string, string> | null; media: MediaView[]; sources: SourceView[];
  related: ContentListItem[]; alternate: { locale: Locale; url: string } | null;
  reviewedBy: string; publishedAt: string; updatedAt: string;
}
interface TimelineItem { id: string; title: string; slug: string; startDate: string | null; endDate: string | null; datePrecision: DatePrecision; period: PeriodRef | null; summary: string }
interface SearchResult extends ContentListItem { matchedOn: "title" | "summary" | "body" }
interface HomeView { featured: ContentListItem[]; periods: PeriodView[]; latest: ContentListItem[]; counts: Record<ContentType, number> }
interface PeriodView extends PeriodRef { summary: string; startYear: number; endYear: number; contentCount: number }
interface TaxonomyView { periods: PeriodRef[]; tags: { id: string; name: string; slug: string }[]; types: ContentType[] }
interface AlternateView { id: string; current: { locale: Locale; url: string }; alternate: { locale: Locale; url: string } | null }

interface PageQuery { page?: number; pageSize?: number }
interface ContentListQuery extends PageQuery { type?: ContentType; period?: string; tag?: string; sort?: "chronology" | "updated" | "title" }
interface TimelineQuery extends PageQuery { period?: string; tag?: string; fromYear?: number; toYear?: number }
interface SearchQuery extends ContentListQuery { q: string }

interface LoginInput { email: string; password: string }
interface AuthUser { id: string; email: string; displayName: string; role: Role }
interface VersionInput { version: number }
interface LocaleWorkflowInput extends VersionInput { locales: Locale[] }
interface ReviewInput extends LocaleWorkflowInput { note?: string }
interface RejectInput extends LocaleWorkflowInput { reason: string }
interface WorkflowResult {
  id: string; status: WorkflowStatus; version: number;
  translationStatuses: Partial<Record<Locale, TranslationStatus>>;
  reviewedBy: string | null; reviewedAt: string | null; publishedAt: string | null;
}

interface TranslationInput {
  version: number; title: string; slug: string; summary: string; body: string;
  seoTitle: string; seoDescription: string;
  translationStatus: "NOT_STARTED" | "TRANSLATING" | "READY_FOR_REVIEW";
}
interface SourceInput { title: string; author?: string; publisher?: string; year?: number; url: string; accessedAt: string; citationNote?: string }
interface MediaInput { url: string; kind: "IMAGE" | "DOCUMENT"; credit: string; license: string; altVi: string; altEn: string; captionVi?: string; captionEn?: string }
interface AdminSourceView extends SourceView { version: number }
interface AdminMediaView extends MediaView { version: number; altVi: string; altEn: string; captionVi: string | null; captionEn: string | null }
interface SourceUpdateInput extends SourceInput { version: number }
interface MediaUpdateInput extends MediaInput { version: number }
interface ContentCreateInput {
  type: ContentType; featured?: boolean; startDate?: string; endDate?: string; datePrecision?: DatePrecision;
  periodId?: string; location?: string; result?: string; role?: string; artifactMeta?: Record<string, string>;
  tagIds?: string[]; relatedIds?: string[]; sourceIds: string[]; mediaIds?: string[];
  translations: Partial<Record<Locale, Omit<TranslationInput, "version">>>;
}
interface ContentUpdateInput extends Partial<Omit<ContentCreateInput, "type" | "translations">> { version: number }
interface AdminTranslation extends TranslationInput { locale: Locale; id: string; updatedAt: string }
interface AdminContentListItem { id: string; type: ContentType; status: WorkflowStatus; featured: boolean; version: number; titles: Partial<Record<Locale, string>>; updatedAt: string; updatedBy: string }
interface AdminContentDetail extends AdminContentListItem {
  startDate: string | null; endDate: string | null; datePrecision: DatePrecision | null;
  periodId: string | null; location: string | null; result: string | null; role: string | null;
  artifactMeta: Record<string, string> | null; tagIds: string[]; relatedIds: string[];
  sourceIds: string[]; mediaIds: string[]; translations: Partial<Record<Locale, AdminTranslation>>;
}
interface AdminContentListQuery extends PageQuery { type?: ContentType; status?: WorkflowStatus; locale?: Locale; q?: string }
interface RecentActivityView { action: string; objectType: string; objectId: string | null; createdAt: string }
interface DashboardView { countsByStatus: Record<WorkflowStatus, number>; countsByType: Record<ContentType, number>; recentAudit: RecentActivityView[] }
interface SourceListQuery extends PageQuery { q?: string }
interface MediaListQuery extends PageQuery { q?: string; kind?: "IMAGE" | "DOCUMENT" }
interface UserListQuery extends PageQuery { q?: string; role?: Role; active?: boolean }
interface UserView { id: string; email: string; displayName: string; role: Role; active: boolean; version: number; createdAt: string; updatedAt: string }
interface UserCreateInput { email: string; displayName: string; role: Role; temporaryPassword: string; active?: boolean }
interface UserUpdateInput { displayName?: string; role?: Role; active?: boolean; resetPassword?: string; version: number }
interface AuditListQuery extends PageQuery { actorId?: string; action?: string; objectType?: string; objectId?: string; from?: string; to?: string }
interface AuditLogView { id: string; actor: AuthUser | null; action: string; objectType: string; objectId: string | null; metadata: Record<string, unknown>; createdAt: string }

interface SeedResult { contentNodes: 50; translations: 100; sources: number; users: 3 }
interface BackupResult { snapshot: string; manifest: string; sha256: string; counts: Record<string, number> }
interface RestoreResult { database: string; sha256Verified: true; schemaVersion: number; counts: Record<string, number> }
```

Contract rules:

- All timestamps are ISO-8601 UTC strings; IDs are opaque strings; list ordering is deterministic with `id` as the final tie-breaker.
- Unknown locale/type returns `ApiError` 404; invalid input returns 400; unauthenticated 401; forbidden role 403; illegal workflow/validation 422; stale version 409.
- Public content reads only rows with node status `PUBLISHED` and the requested translation status `PUBLISHED`; a node may have one published locale, which is why alternate can be `null`. Admin responses never return password hashes or session secrets.
- Mutation bodies use JSON and require same-origin session plus Origin check; no endpoint accepts raw HTML or binary upload in v1.

## Feature → interface map

Reference each PRD feature by its `FRn` id so the mapping is machine-checkable
(`/flow consistency` flags any `FRn` with no interface here).

- FR1 → `GET /api/v1/{locale}/home`
- FR2 → `GET /api/v1/{locale}/periods`, `GET /api/v1/{locale}/timeline`
- FR3 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=EVENT`
- FR4 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=PERSON`
- FR5 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=ARTIFACT`
- FR6 → `GET /api/v1/{locale}/search`, `GET /api/v1/{locale}/taxonomies`
- FR7 → `GET /api/v1/contents/{id}/alternate`, public detail routes
- FR8 → `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` plus access rules on every admin interface
- FR9 → admin content list/create/get/patch and translation PUT interfaces
- FR10 → submit-review, approve, reject, publish and archive interfaces
- FR11 → admin source/media GET/POST/PATCH plus publish validation contract
- FR12 → public home/detail interfaces, `GET /sitemap.xml`, `GET /robots.txt`, metadata generated by public page routes
- FR13 → `GET /api/v1/admin/audit-logs`; every listed mutation writes the named audit event
- FR14 → `npm run db:seed`, `npm run db:backup`, `npm run db:restore -- <snapshot>`
