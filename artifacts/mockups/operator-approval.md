# C-001 operator approval

- Approved by: operator/user
- Approval message: `duyệt mock`
- Approval date: 2026-08-06 (Asia/Ho_Chi_Minh)
- Mock URL at approval: `http://127.0.0.1:4173`
- HTTP proof after final repairs: `index.html` returned `200 OK`, `Content-Length: 16781`;
  `hero-history.webp` returned `200 OK`, `Content-Length: 228206`; mobile WebP returned
  `200 OK`, `Content-Length: 77362`; PNG fallback remains 1536×1024.

The in-app browser runtime exposed no available browser, so automated screenshots were not
fabricated. Flow's required operator-viewed approval was received directly in the conversation.

## Review repairs applied after approval

- Preserved primary navigation on tablet/mobile.
- Added distinct submitted values for content-type filters.
- Added responsive WebP hero variants and intrinsic image dimensions.
- Locked extra surface colors as project tokens in `DESIGN.md`.
- Added Reviewer, rejection reason and blocked-publish states to the admin mock.
- Added accessible locale-tab state and a real static English-summary target.
