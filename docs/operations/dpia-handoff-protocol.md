# DPIA/privacy handoff protocol

`docs/privacy/dpia.md` is a working DPIA and child-safety policy. Its local
marker check is not legal approval. The handoff validator binds any packet to
the exact policy SHA-256, verifies the eight required controls, and requires a
named owner, authority scope and timestamp for the handoff record.

Run:

```bash
npm run privacy:handoff:check
```

The checked-in example intentionally has no policy hash or owner and fails
closed. A complete controls packet returns
`PASS_DPIA_CONTROLS_PENDING_REVIEW`, but always keeps `approved=false`,
`releaseAllowed=false` and `publicBeta=false`. The decision field must remain
`PENDING_EXTERNAL_REVIEW`; self-asserted approval and attached approval
artifacts are rejected. A real privacy/legal reviewer must provide the external
evidence through the canonical external-evidence ledger before the `dpia-approval`
gate can pass.
