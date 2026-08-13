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
- Protected operations declare `cookieAuth` plus exact `x-allowed-roles`: authenticated or Editor/Reviewer/Admin = all three roles; Reviewer/Admin = `ADMIN,REVIEWER`; Admin only = `ADMIN`. Public operations declare neither.

## Interfaces  (web: endpoints · cli: commands · library: functions · skill: commands)

Adapt the columns to your project type. Web: Method/Path/Access(=auth: public/token/admin)/
Request/Response. CLI: Command/Flags/Access(=side-effects)/Input/Output+exit. Library:
Function/—/Access(=none)/Args/Return. The shared column below is "Access/Effects".

| Method/Interface | Path/Name | Access/Effects | Input shape | Output shape |
|---|---|---|---|---|
| GET | `/healthz` | Public; read DB health, no write | none | application/json 200 `HealthResponse`; no-body 503 |
| GET | `/openapi.json` | Public; no write | none | application/json 200 object containing the OpenAPI 3.1 document for every HTTP row in this table |
| GET | `/docs` | Public; no write | none | text/html 200 string API reference generated from `/openapi.json` |
| GET | `/api/v1/{locale}/home` | Public; published rows only | path `{ locale: Locale }` | application/json 200 `DataResponse<HomeView>`; errors application/json 404,500 `ApiError` |
| GET | `/api/v1/{locale}/periods` | Public; published rows only | path `{ locale: Locale }`; query `{ includeEmpty?: boolean }` | application/json 200 `ListResponse<PeriodView>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/timeline` | Public; published rows only | path `{ locale: Locale }`; query `TimelineQuery` | application/json 200 `ListResponse<TimelineItem>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/contents` | Public; published rows only | path `{ locale: Locale }`; query `ContentListQuery` | application/json 200 `ListResponse<ContentListItem>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/contents/{type}/{slug}` | Public; published row only | path `{ locale: Locale; type: ContentType; slug: string }` | application/json 200 `DataResponse<ContentDetail>`; errors application/json 404,500 `ApiError` |
| GET | `/api/v1/{locale}/search` | Public; published rows only | path `{ locale: Locale }`; query `SearchQuery` | application/json 200 `ListResponse<SearchResult>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/taxonomies` | Public; published-used contextual facets only; no write | path `{ locale: Locale }`; query `FacetQuery` | application/json 200 `DataResponse<FacetView>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/curriculum` | Public; grades with published lessons only | path `{ locale: Locale }`; query `{ track?: CurriculumTrack }` | application/json 200 `DataResponse<CurriculumCatalogView>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/curriculum/{grade}` | Public; published lessons/requirements only | path `{ locale: Locale; grade: Grade }`; query `{ track?: CurriculumTrack; topic?: string; page?: number; pageSize?: number }` | application/json 200 `DataResponse<CurriculumGradeView>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/places` | Public; places attached to published content only | path `{ locale: Locale }`; query `PlaceQuery` | application/json 200 `ListResponse<PlaceView>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/reconstructions` | Public; reviewed/published reconstruction summaries only | path `{ locale: Locale }`; query `PageQuery` | application/json 200 `ListResponse<ReconstructionListItem>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/{locale}/reconstructions/{slug}` | Public; one reviewed/published scene; no write | path `{ locale: Locale; slug: string }` | application/json 200 `DataResponse<ReconstructionView>`; errors application/json 404,500 `ApiError` |
| GET | `/api/v1/{locale}/sources` | Public; sources used by published content with a published requested-locale translation only; unique by URL | path `{ locale: Locale }`; query `PageQuery` | application/json 200 `ListResponse<PublicSourceItem>`; errors application/json 400,404,500 `ApiError` |
| GET | `/api/v1/contents/{id}/alternate` | Public; published translations only | path `{ id: string }`; query `{ locale: Locale }` | application/json 200 `DataResponse<AlternateView>` where `alternate` may be `null`; errors application/json 400,404,500 `ApiError` |
| GET | `/sitemap.xml` | Public; no write | none | application/xml 200 string URL set, empty through C-005 because canonical published VI/EN HTML routes ship in C-006, then populated only with those canonical pages |
| GET | `/robots.txt` | Public; no write | none | text/plain 200 string allowing public routes and disallowing `/admin` and `/api/v1/admin` |
| POST | `/api/v1/auth/login` | Public, rate-limited; sets encrypted HttpOnly session cookie; writes login audit | `LoginInput` | application/json 200 `DataResponse<AuthUser>`; errors application/json 400,401,403,429,500 `ApiError` |
| POST | `/api/v1/auth/logout` | Authenticated; clears cookie; writes logout audit | none | application/json 200 `DataResponse<{loggedOut:true}>`; errors application/json 401,403,500 `ApiError` |
| GET | `/api/v1/auth/me` | Authenticated; no write | session cookie | application/json 200 `DataResponse<AuthUser>`; errors application/json 401,500 `ApiError` |
| GET | `/api/v1/admin/dashboard` | Editor/Reviewer/Admin; no write | session cookie | application/json 200 `DataResponse<DashboardView>`; errors application/json 401,500 `ApiError` |
| GET | `/api/v1/admin/contents` | Editor/Reviewer/Admin; no write | query `AdminContentListQuery` | application/json 200 `ListResponse<AdminContentListItem>`; errors application/json 400,401,500 `ApiError` |
| POST | `/api/v1/admin/contents` | Editor/Reviewer/Admin; creates DRAFT + audit | `ContentCreateInput` | application/json 201 `DataResponse<AdminContentDetail>`; errors application/json 400,401,403,500 `ApiError` |
| GET | `/api/v1/admin/contents/{id}` | Editor/Reviewer/Admin; no write | path `{ id: string }` | application/json 200 `DataResponse<AdminContentDetail>`; errors application/json 401,404,500 `ApiError` |
| PATCH | `/api/v1/admin/contents/{id}` | Editor/Reviewer/Admin; update allowed fields + audit; cannot publish | path `{ id: string }`; `ContentUpdateInput` | application/json 200 `DataResponse<AdminContentDetail>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| PUT | `/api/v1/admin/contents/{id}/translations/{locale}` | Editor/Reviewer/Admin; upsert translation + audit | path `{ id: string; locale: Locale }`; `TranslationInput` | application/json 200 `DataResponse<AdminTranslation>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| PUT | `/api/v1/admin/contents/{id}/curriculum` | Editor/Reviewer/Admin; replace curriculum mappings + audit; no verification effect by itself | path `{ id: string }`; `CurriculumMappingInput` | application/json 200 `DataResponse<AdminContentDetail>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| GET | `/api/v1/admin/curriculum/coverage` | Editor/Reviewer/Admin; all requirements including missing/draft; no write | query `{ grade?: Grade; track?: CurriculumTrack; status?: CoverageStatus }` | application/json 200 `DataResponse<AdminCurriculumCoverageView>`; errors application/json 400,401,500 `ApiError` |
| GET | `/api/v1/admin/contents/{id}/claims` | Editor/Reviewer/Admin; no write | path `{ id: string }`; query `ClaimListQuery` | application/json 200 `ListResponse<AdminClaimView>`; errors application/json 400,401,404,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/claims` | Editor/Reviewer/Admin; create DRAFT claim/evidence + audit | path `{ id: string }`; `ClaimInput` | application/json 201 `DataResponse<AdminClaimView>`; errors application/json 400,401,403,404,422,500 `ApiError` |
| PATCH | `/api/v1/admin/contents/{id}/claims/{claimId}` | Editor/Reviewer/Admin; replace claim/evidence, reset verification to DRAFT + audit | path `{ id: string; claimId: string }`; `ClaimUpdateInput` | application/json 200 `DataResponse<AdminClaimView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/claims/{claimId}/verification` | Editor/Reviewer/Admin; any role may submit DRAFT/REJECTED as NEEDS_REVIEW; only Reviewer/Admin may set VERIFIED/REJECTED; VERIFIED requires all evidence sources VERIFIED + audit | path `{ id: string; claimId: string }`; `VerificationInput` | application/json 200 `DataResponse<AdminClaimView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| GET | `/api/v1/admin/sources` | Editor/Reviewer/Admin; no write | query `SourceListQuery` | application/json 200 `ListResponse<AdminSourceView>`; errors application/json 400,401,500 `ApiError` |
| POST | `/api/v1/admin/sources` | Editor/Reviewer/Admin; create source + audit | `SourceInput` | application/json 201 `DataResponse<AdminSourceView>`; errors application/json 400,401,403,500 `ApiError` |
| PATCH | `/api/v1/admin/sources/{id}` | Editor/Reviewer/Admin; update source + audit only while not attached to PUBLISHED content; reset verification to DRAFT and demote dependent verified claims | path `{ id: string }`; `SourceUpdateInput` | application/json 200 `DataResponse<AdminSourceView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/sources/{id}/verification` | Editor/Reviewer/Admin; any role may submit DRAFT/REJECTED as NEEDS_REVIEW; only Reviewer/Admin may set VERIFIED/REJECTED; discovery-only sources cannot be VERIFIED; rejection demotes dependent verified claims + audit | path `{ id: string }`; `VerificationInput` | application/json 200 `DataResponse<AdminSourceView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| GET | `/api/v1/admin/media` | Editor/Reviewer/Admin; no write | query `MediaListQuery` | application/json 200 `ListResponse<AdminMediaView>`; errors application/json 400,401,500 `ApiError` |
| POST | `/api/v1/admin/media` | Editor/Reviewer/Admin; metadata-only create + audit | `MediaInput` | application/json 201 `DataResponse<AdminMediaView>`; errors application/json 400,401,403,500 `ApiError` |
| PATCH | `/api/v1/admin/media/{id}` | Editor/Reviewer/Admin; metadata-only update + audit only while not attached to any PUBLISHED content; published media are immutable | path `{ id: string }`; `MediaUpdateInput` | application/json 200 `DataResponse<AdminMediaView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/submit-review` | Editor/Reviewer/Admin; selected translations must be TRANSLATING and become READY_FOR_REVIEW; node → IN_REVIEW unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | path `{ id: string }`; `LocaleWorkflowInput` | application/json 200 `DataResponse<WorkflowResult>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/approve` | Reviewer/Admin; selected READY_FOR_REVIEW locales → APPROVED + reviewer/time; node → APPROVED unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | path `{ id: string }`; `ReviewInput` | application/json 200 `DataResponse<WorkflowResult>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/reject` | Reviewer/Admin; selected READY_FOR_REVIEW locales → TRANSLATING + required reason; node → REJECTED unless another locale is already PUBLISHED, in which case node remains PUBLISHED + audit | path `{ id: string }`; `RejectInput` | application/json 200 `DataResponse<WorkflowResult>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| POST | `/api/v1/admin/contents/{id}/publish` | Reviewer/Admin; publish selected approved locales only when every attached source is VERIFIED, ≥1 claim is VERIFIED, verified claim types cover every populated date/place/person-role/outcome field, and translation/media validation passes; node becomes PUBLISHED when ≥1 locale is published; audit | path `{ id: string }`; `LocaleWorkflowInput` | application/json 200 `DataResponse<WorkflowResult>`; errors application/json 400,401,403,404,409,422,500 `ApiError` with optional `details.violations` |
| POST | `/api/v1/admin/contents/{id}/archive` | Reviewer/Admin; non-deleted row → ARCHIVED + audit | path `{ id: string }`; `VersionInput` | application/json 200 `DataResponse<WorkflowResult>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| GET | `/api/v1/admin/users` | Admin only; no password hash returned | query `UserListQuery` | application/json 200 `ListResponse<UserView>`; errors application/json 400,401,403,500 `ApiError` |
| POST | `/api/v1/admin/users` | Admin only; create disabled/public-login-free user + audit | `UserCreateInput` | application/json 201 `DataResponse<UserView>`; errors application/json 400,401,403,409,500 `ApiError` |
| PATCH | `/api/v1/admin/users/{id}` | Admin only; update role/active/sessionVersion + audit; cannot disable last active Admin | path `{ id: string }`; `UserUpdateInput` | application/json 200 `DataResponse<UserView>`; errors application/json 400,401,403,404,409,422,500 `ApiError` |
| GET | `/api/v1/admin/audit-logs` | Admin only; no write | query `AuditListQuery` | application/json 200 `ListResponse<AuditLogView>`; errors application/json 400,401,403,500 `ApiError` |
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
type TaxonomyKind = "grade" | "topic" | "period" | "tag" | "type";
type FacetScope = "contents" | "timeline" | "search";
type VerificationStatus = "DRAFT" | "NEEDS_REVIEW" | "VERIFIED" | "REJECTED";
type SourceType = "PRIMARY_RECORD" | "ARCHIVE_CATALOG" | "MUSEUM_CATALOG" | "SCHOLARLY_BOOK" | "PEER_REVIEWED_ARTICLE" | "REFERENCE_WORK" | "CONTEMPORARY_PRESS" | "ORAL_HISTORY" | "DISCOVERY_ONLY";
type SourceQualityTier = "TIER_1_PRIMARY" | "TIER_2_INSTITUTIONAL" | "TIER_3_SCHOLARLY" | "TIER_4_CONTEXTUAL" | "TIER_5_DISCOVERY";
type ClaimType = "DATE" | "PLACE" | "PERSON_ROLE" | "OUTCOME" | "INTERPRETATION" | "CONTEXT";
type ClaimAssessment = "CONFIRMED" | "DISPUTED";
type Grade = 6 | 7 | 8 | 9 | 10 | 11 | 12;
type CurriculumTrack = "MANDATORY" | "ELECTIVE";
type CoverageStatus = "MISSING" | "DRAFT" | "PUBLISHED" | "VERIFIED";
type RightsStatus = "UNKNOWN" | "LINK_ONLY" | "PERMITTED" | "PUBLIC_DOMAIN";
type ReconstructionConfidence = "HIGH" | "MEDIUM" | "LOW";

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
  provenance: AssetProvenanceView;
}
interface AssetProvenanceView {
  holdingInstitution: string; inventoryId: string | null; origin: string;
  rightsStatus: RightsStatus; permissionDocument: string | null;
  creditLine: string; checksum: string | null;
}
interface SourceView {
  id: string; title: string; author: string | null; publisher: string | null;
  year: number | null; url: string; accessedAt: string; citationNote: string | null;
  sourceType: SourceType; qualityTier: SourceQualityTier; institution: string | null;
  identifier: string | null; edition: string | null; archivedUrl: string | null;
  checksum: string | null; verificationStatus: VerificationStatus;
  verifiedBy: string | null; verifiedAt: string | null; verificationNote: string | null;
}
interface ClaimEvidenceView { source: SourceView; locator: string; quote: string | null; note: string | null }
interface ClaimView { id: string; claimType: ClaimType; assessment: ClaimAssessment; statement: string; evidence: ClaimEvidenceView[] }
interface SourceContentRef { id: string; type: ContentType; title: string; slug: string }
interface PublicSourceItem extends SourceView { contentCount: number; contents: SourceContentRef[] }
interface PeriodRef { id: string; title: string; slug: string }
interface ContentListItem {
  id: string; type: ContentType; locale: Locale; title: string; slug: string; summary: string;
  thumbnail: MediaView | null; startDate: string | null; endDate: string | null;
  datePrecision: DatePrecision | null; period: PeriodRef | null; tags: string[];
}
interface ContentDetail extends ContentListItem {
  body: string; location: string | null; result: string | null; role: string | null;
  artifactMeta: Record<string, string> | null; media: MediaView[]; sources: SourceView[]; claims: ClaimView[];
  related: ContentListItem[]; alternate: { locale: Locale; url: string } | null;
  curriculum: CurriculumRequirementRef[]; lesson: LessonView | null; asOf: string | null;
  reviewedBy: string; publishedAt: string; updatedAt: string;
}
interface TimelineItem { id: string; title: string; slug: string; startDate: string | null; endDate: string | null; datePrecision: DatePrecision; period: PeriodRef | null; summary: string }
interface SearchResult extends ContentListItem { matchedOn: "title" | "summary" | "body" }
interface HomeView { featured: ContentListItem[]; periods: PeriodView[]; latest: ContentListItem[]; counts: Record<ContentType, number> }
interface PeriodView extends PeriodRef { summary: string; startYear: number; endYear: number; contentCount: number }
interface FacetOption { value: string; label: string; publishedCount: number; verifiedCount: number }
interface FacetView {
  grades: FacetOption[]; topics: FacetOption[]; periods: FacetOption[];
  tags: FacetOption[]; types: FacetOption[];
}
interface AlternateView { id: string; current: { locale: Locale; url: string }; alternate: { locale: Locale; url: string } | null }

interface CurriculumRequirementRef {
  id: string; grade: Grade; track: CurriculumTrack; topic: string; slug: string;
  officialProgramRef: string; publishedCount: number; verifiedCount: number;
  coverageStatus: CoverageStatus;
}
interface CurriculumRequirementView extends CurriculumRequirementRef {
  periodStart: number | null; periodEnd: number | null; requiredOutcomes: string[];
  lessons: ContentListItem[];
}
interface GradeCoverageSummary {
  requirementCount: number; publishedRequirementCount: number;
  verifiedRequirementCount: number; fullCoverage: boolean;
}
interface CurriculumGradeSummary extends GradeCoverageSummary {
  grade: Grade; label: string; publishedLessonCount: number;
}
interface CurriculumCatalogView { asOf: string; grades: CurriculumGradeSummary[] }
interface CurriculumGradeView {
  grade: Grade; label: string; summary: GradeCoverageSummary;
  requirements: CurriculumRequirementView[];
}
interface LessonView {
  learningObjectives: string[]; originalSummary: string; analysis: string;
  debates: { title: string; summary: string; claimIds: string[] }[];
}
interface AdminCurriculumGradeCoverageView extends CurriculumGradeSummary {
  requirements: CurriculumRequirementRef[];
}
interface AdminCurriculumCoverageView {
  asOf: string; grades: AdminCurriculumGradeCoverageView[];
}

interface GeoPoint { longitude: number; latitude: number }
interface PlaceView {
  id: string; slug: string; title: string; summary: string; point: GeoPoint;
  precision: "EXACT" | "APPROXIMATE"; locatorNote: string; related: ContentListItem[];
}
interface ReconstructionListItem {
  id: string; slug: string; title: string; summary: string;
  label: "EDUCATIONAL_RECONSTRUCTION"; confidence: ReconstructionConfidence;
  thumbnail: MediaView | null;
}
interface ReconstructionMove {
  id: string; side: string; label: string; from: GeoPoint; to: GeoPoint;
  confidence: ReconstructionConfidence; sourceIds: string[];
}
interface ReconstructionPhase {
  id: string; order: number; title: string; narrative: string;
  dateLabel: string; confidence: ReconstructionConfidence; assumptions: string[];
  focusPlaceIds: string[]; moves: ReconstructionMove[];
}
interface ReconstructionView extends ReconstructionListItem {
  content: ContentListItem; assumptions: string[]; sources: SourceView[];
  places: PlaceView[]; phases: ReconstructionPhase[];
  fallback: { image: string | null; narrative: string };
}

interface PageQuery { page?: number; pageSize?: number }
interface ContentListQuery extends PageQuery { type?: ContentType; period?: string; tag?: string; grade?: Grade; topic?: string; sort?: "chronology" | "updated" | "title" }
interface TimelineQuery extends PageQuery { period?: string; tag?: string; fromYear?: number; toYear?: number }
interface SearchQuery extends ContentListQuery { q: string }
interface FacetQuery {
  kind?: TaxonomyKind; scope?: FacetScope; q?: string; type?: ContentType;
  period?: string; tag?: string; grade?: Grade; topic?: string;
  fromYear?: number; toYear?: number;
}
interface PlaceQuery extends PageQuery { q?: string; precision?: "EXACT" | "APPROXIMATE" }

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
interface SourceInput {
  title: string; author?: string; publisher?: string; year?: number; url: string;
  accessedAt: string; citationNote?: string; sourceType: SourceType;
  qualityTier: SourceQualityTier; institution?: string; identifier?: string;
  edition?: string; archivedUrl?: string; checksum?: string;
}
interface MediaInput {
  url: string; kind: "IMAGE" | "DOCUMENT"; credit: string; license: string;
  altVi: string; altEn: string; captionVi?: string; captionEn?: string;
  holdingInstitution?: string; inventoryId?: string; origin?: string;
  rightsStatus?: RightsStatus; permissionDocument?: string; creditLine?: string; checksum?: string;
}
interface AdminSourceView extends SourceView { version: number }
interface AdminMediaView extends MediaView { version: number; altVi: string; altEn: string; captionVi: string | null; captionEn: string | null }
interface SourceUpdateInput extends SourceInput { version: number }
interface MediaUpdateInput extends MediaInput { version: number }
interface VerificationInput { version: number; status: "NEEDS_REVIEW" | "VERIFIED" | "REJECTED"; note?: string }
interface ClaimEvidenceInput { sourceId: string; locator: string; quote?: string; note?: string }
interface ClaimInput { claimType: ClaimType; assessment: ClaimAssessment; statementVi: string; statementEn: string; evidence: ClaimEvidenceInput[] }
interface ClaimUpdateInput extends ClaimInput { version: number }
interface AdminClaimView {
  id: string; contentId: string; claimType: ClaimType; assessment: ClaimAssessment;
  statementVi: string; statementEn: string; verificationStatus: VerificationStatus;
  version: number; verifiedBy: string | null; verifiedAt: string | null;
  verificationNote: string | null; evidence: ClaimEvidenceView[];
}
interface ContentCreateInput {
  type: ContentType; featured?: boolean; startDate?: string; endDate?: string; datePrecision?: DatePrecision;
  periodId?: string; location?: string; result?: string; role?: string; artifactMeta?: Record<string, string>;
  tagIds?: string[]; relatedIds?: string[]; sourceIds: string[]; mediaIds?: string[];
  translations: Partial<Record<Locale, Omit<TranslationInput, "version">>>;
}
interface ContentUpdateInput extends Partial<Omit<ContentCreateInput, "type" | "translations">> { version: number }
interface CurriculumMappingInput { version: number; requirementIds: string[]; asOf?: string }
interface AdminTranslation {
  locale: Locale; id: string; version: number; title: string; slug: string; summary: string; body: string;
  seoTitle: string; seoDescription: string; translationStatus: TranslationStatus; updatedAt: string;
}
interface AdminContentListItem { id: string; type: ContentType; status: WorkflowStatus; featured: boolean; version: number; titles: Partial<Record<Locale, string>>; updatedAt: string; updatedBy: string }
interface AdminContentDetail extends AdminContentListItem {
  startDate: string | null; endDate: string | null; datePrecision: DatePrecision | null;
  periodId: string | null; location: string | null; result: string | null; role: string | null;
  artifactMeta: Record<string, string> | null; tagIds: string[]; relatedIds: string[];
  sourceIds: string[]; mediaIds: string[]; curriculumRequirementIds: string[];
  translations: Partial<Record<Locale, AdminTranslation>>;
}
interface AdminContentListQuery extends PageQuery { type?: ContentType; status?: WorkflowStatus; locale?: Locale; q?: string }
interface RecentActivityView { action: string; objectType: string; objectId: string | null; createdAt: string }
interface DashboardView { countsByStatus: Record<WorkflowStatus, number>; countsByType: Record<ContentType, number>; recentAudit: RecentActivityView[] }
interface SourceListQuery extends PageQuery { q?: string; sourceType?: SourceType; qualityTier?: SourceQualityTier; verificationStatus?: VerificationStatus }
interface ClaimListQuery extends PageQuery { claimType?: ClaimType; verificationStatus?: VerificationStatus }
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
- Public source metadata exposes its verification status for transparency, but public `claims` includes only `VERIFIED` claims whose every evidence row points to a `VERIFIED` source. `verifiedBy` is a display name, never a user id.
- Existing sources migrated into this model remain `NEEDS_REVIEW`; migration or seed may classify type/tier but never manufacture a reviewer decision. A source or claim mutation clears its prior verification; rejecting/updating a source demotes dependent verified claims.
- Mutation bodies use JSON and require same-origin session plus Origin check; no endpoint accepts raw HTML or binary upload in v1.
- Public curriculum/facet arrays omit entries whose `publishedCount` is 0. `verifiedCount`
  counts only lessons having at least one `VERIFIED` claim backed exclusively by `VERIFIED`
  sources; mapping or publishing alone never increments it. Missing requirements remain
  available through the protected coverage interface, not as dead public controls.
- Curriculum requirements are an editorial index of the Ministry programme, not a copied
  textbook. Rows cite the consolidated programme and its effective amendments through
  `17/2025/TT-BGDĐT`; `officialProgramRef` identifies that authority and section, while
  localized outcomes are concise indexing summaries. `MISSING` means no mapping, `DRAFT`
  means mapped content exists but no requested-locale lesson is public, `PUBLISHED` means at
  least one lesson is public but none qualifies as verified, and `VERIFIED` means at least
  one public lesson satisfies the verified-claim/evidence rule. `fullCoverage` requires every
  requirement in the selected grade/track to be `VERIFIED`.
- Facets are disjunctive: each array applies every active filter except its own dimension.
  `scope=contents` (the default) uses the public contents candidate set; `scope=timeline`
  additionally requires `EVENT` plus non-null date precision and applies `fromYear/toYear`;
  `scope=search` uses the same normalized-token predicate as public search; `q` is ignored
  outside search scope because the contents/timeline consumers do not accept it. `kind` is a
  compatibility projection: unrequested arrays remain present but empty. Options are
  deterministic (grade, topic slug, period chronology, tag slug, then declared content-type
  order), and public HTML never keeps an unknown filter selected. Grade/topic filters use
  curriculum mappings on contents/search; timeline leaves those two arrays empty because
  `TimelineQuery` does not accept them. Content detail returns mapped curriculum refs and a
  `LessonView` only when a requested-locale lesson translation is published; non-lesson detail
  keeps `lesson=null` and `asOf=null`. A published lesson always carries non-empty objectives,
  original summary, analysis, debates and an ISO-8601 UTC `asOf`; public claims still obey the
  verified-claim/evidence rule independently of the lesson text.
- `track=ELECTIVE` is always labelled as a selected specialism; it is never combined with
  mandatory coverage. `asOf` is ISO-8601 and required for post-programme current updates.
- A reconstruction is an educational interpretation, never documentary fact. Every phase
  carries sources and assumptions/confidence; consumers must render the HTML/image fallback
  when WebGL is unavailable or reduced motion is requested.
- Media with `rightsStatus=UNKNOWN|LINK_ONLY` may expose citation metadata and the original
  source link but the app must not proxy, copy or serve the referenced binary. Only
  `PERMITTED|PUBLIC_DOMAIN` assets may be served by this project.
- Media provenance is required at the metadata seam: holding institution, optional inventory
  id, origin, rights status, permission-document link, credit line and optional SHA-256
  checksum. A link-only record is a writing/reference input and must remain visibly distinct
  from an asset that the project is allowed to serve.

## Feature → interface map

Reference each PRD feature by its `FRn` id so the mapping is machine-checkable
(`/flow consistency` flags any `FRn` with no interface here).

- FR1 → `GET /api/v1/{locale}/home`
- FR2 → `GET /api/v1/{locale}/periods`, `GET /api/v1/{locale}/timeline`
- FR3 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=EVENT` including verified claim/evidence shape
- FR4 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=PERSON`
- FR5 → `GET /api/v1/{locale}/contents`, `GET /api/v1/{locale}/contents/{type}/{slug}` with `type=ARTIFACT`
- FR6 → `GET /api/v1/{locale}/search`, `GET /api/v1/{locale}/taxonomies`
- FR7 → `GET /api/v1/contents/{id}/alternate`, public detail routes
- FR8 → `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` plus access rules on every admin interface
- FR9 → admin content list/create/get/patch and translation PUT interfaces
- FR10 → submit-review, approve, reject, publish and archive interfaces
- FR11 → admin source GET/POST/PATCH/verification, admin claim GET/POST/PATCH/verification, admin media GET/POST/PATCH and publish validation contract; public detail claims and `GET /api/v1/{locale}/sources`
- FR12 → public home/detail/source interfaces, `GET /sitemap.xml`, `GET /robots.txt`, metadata generated by public page routes
- FR13 → `GET /api/v1/admin/audit-logs`; every listed mutation writes the named audit event
- FR14 → `npm run db:seed`, `npm run db:backup`, `npm run db:restore -- <snapshot>`
- FR15 → `GET /api/v1/{locale}/curriculum`, `GET /api/v1/{locale}/curriculum/{grade}`, `GET /api/v1/admin/curriculum/coverage`, `PUT /api/v1/admin/contents/{id}/curriculum`
- FR16 → contextual `GET /api/v1/{locale}/taxonomies`, public collection/search/timeline routes consuming `FacetView`
- FR17 → `GET /api/v1/{locale}/contents/{type}/{slug}` fields `lesson`, `curriculum`, `asOf`, `claims` and `sources`
- FR18 → admin content/translation/source/claim/workflow interfaces plus curriculum mapping and protected coverage interface
- FR19 → `GET /api/v1/{locale}/places`, content detail related place links and public HTML map routes
- FR20 → reconstruction list/detail interfaces and public HTML/WebGL-enhanced reconstruction routes
- FR21 → Next.js `/{locale}/loading` and public HTML route/template interfaces; no API mutation
- FR22 → public sources/content detail, `MediaView.provenance`, admin source/media interfaces and rights-serving rule
