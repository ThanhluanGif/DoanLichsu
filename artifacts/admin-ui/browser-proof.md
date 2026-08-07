# C-007 browser proof

- Target: production standalone at `http://127.0.0.1:3001`, SQLite proof database `/tmp/quan-su-viet-c007-proof-20260807.sqlite`.
- Published object: `3f0b04c6-4edd-4001-af17-98196d79cd57`.
- Admin editor: `http://127.0.0.1:3001/admin/contents/3f0b04c6-4edd-4001-af17-98196d79cd57`.
- Public VI: `http://127.0.0.1:3001/vi/su-kien/chien-dich-kiem-chung-c-007-lan-hai` (HTTP 200, title `Chiến dịch kiểm chứng C-007 lần hai · Quân Sử Việt`).
- Public EN alternate: `http://127.0.0.1:3001/en/events/c-007-verification-campaign-second-run`.

## Browser journey

1. Editor created the VI draft, added and saved EN, opened preview, created and attached source `https://example.com/c-007-proof`, created and attached licensed media (`CC BY 4.0`, VI/EN alt), then submitted both locales.
2. Reviewer opened the review queue and rejected both locales with `Bổ sung câu kết luận rõ ràng trước khi xuất bản.`
3. Editor revised the VI body and resubmitted.
4. Reviewer approved and published both locales. The public VI detail opened in a fresh browser tab and exposed the EN alternate.
5. Admin filtered audit by object ID. Visible rows included `content.submit-review`, `content.reject`, `content.approve`, and `content.publish`, with Editor/Reviewer actors.

## Roles and session

- Editor navigation omitted review/users/audit. Editor calling publish returned 403 `FORBIDDEN` with only `code`, `message`, `requestId`.
- Reviewer navigation exposed review but omitted users/audit. Reviewer calling users returned the same safe 403 shape.
- Admin navigation exposed review/users/audit. Audit UI contains actor, action, object type, object ID, from, and to filters.
- Refresh retained the Editor session. Logout returned to `/admin/login`; browser Back remained on login and did not reveal admin data.
- Failed login for a known and unknown email returned identical 401 `INVALID_CREDENTIALS` copy: `Email hoặc mật khẩu không đúng.`
- Stale-version and nested field-validation browser probes rendered the conflict warning and the field-level title error without overwriting data or leaking a stack/secret.

## Accessibility and responsive proof

- Hydrated DOM snapshots: `dom-login.html`, `dom-list.html`, `dom-editor.html`, `dom-review.html`.
- `node tests/admin-ui/axe-runtime.mjs artifacts/admin-ui` returned `{"pages":4,"criticalOrSerious":0}` on the final hydrated DOM recapture.
- Keyboard-only probe reached the skip link and showed a `3px solid` focus outline.
- Mobile viewport: 390 × 844; `clientWidth=390`, `scrollWidth=390`. The nearest editable field was 142 px above the sticky savebar, so the save CTA did not cover it.
- Screenshots: `admin-audit-desktop.png`, `reviewer-desktop.png`, `editor-mobile.png`.
- Mechanical DESIGN checks passed on all four hydrated DOMs. The broad token runner also scanned generated/dependency CSS and reported framework `--accent`/`--border` values already present on `main`; a source-only comparison resolved that advisory with all 12 project tokens defined and matching `DESIGN.md` (`missing=[]`, `mismatch=[]`).

## Database proof

- Node state: `PUBLISHED`, version 10, `updated_by=user-reviewer`.
- VI and EN translations: both `PUBLISHED`.
- Audit order: Editor submit → Reviewer reject → Editor resubmit → Reviewer approve → Reviewer publish.

## Final repair verification

Semantic review found that `/admin` and the current nested navigation item were both styled selected, internal links could bypass the dirty-state warning, and a new EN translation silently depended on hidden SEO fields. Final browser verification on draft `2374a306-ae3e-4168-8a89-321ad7c357c4` proved:

- EN saved while its SEO disclosure stayed closed; the response hydrated SEO title from Title and SEO description from Summary.
- Clicking a sidebar link after editing Body opened a native `confirm` dialog before navigation.
- Editor, Reviewer queue, and Admin audit each had exactly one selected navigation item.
- Final desktop/mobile screenshots and all four hydrated DOM artefacts were recaptured after these fixes.
