# Independent security handoff protocol

`artifacts/security/security-review-pack.json` is local static/security
workflow evidence. It is not a penetration test or independent approval. The
handoff validator is the structural seam for a future authorised security
owner.

Run:

```bash
npm run security:handoff:check
```

The packet must name the tested commit, tool/version, review timestamp, the
auth/RBAC, source-ingestion and AI-safety scope, findings counts, remediation
state, a repository report artifact/hash and the reviewer's organisation and
authority. Critical and High findings are fail-closed. The checked-in example
is intentionally empty and returns `BLOCKED_EXTERNAL`. A structurally complete
synthetic packet returns `PASS_SECURITY_PACKET`, but
`officialSecurityEvidence=false`, `releaseAllowed=false` and `publicBeta=false`
remain immutable until the external evidence ledger receives a real independent
report and owner verification.
