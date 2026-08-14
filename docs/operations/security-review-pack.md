# Security review pack handoff

`npm run security:review-pack` runs the repository's release-contract and
auth/RBAC workflow checks and a production dependency audit. It writes a hashed,
timestamped report to `artifacts/security/security-review-pack.json`.

The pack is deliberately scoped:

- `PASS_LOCAL_SECURITY_EVIDENCE` means the checked repository controls and the
  production dependency audit passed at that run.
- `independentReview: PENDING_EXTERNAL` means no independent security reviewer has
  signed the result.
- `penTest: NOT_PERFORMED` means this artifact must never be used as a pen-test
  substitute.
- `publicBetaAllowed: false` remains true until the external ledger contains a
  real, named, independently reviewed security report with matching hash.

The future security owner should attach the signed report, scope, date, tool/version,
findings and remediation status to the external evidence ledger. Local checks and
dependency audit output are retained for context, not as independent approval.
