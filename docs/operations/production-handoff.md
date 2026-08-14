# Production handoff protocol v1

The checked-in example manifest is intentionally incomplete. An authorised
operations owner must copy it to a controlled handoff packet and fill the real
production target, release/image identity, rollback, monitoring, database,
owner/on-call and RPO/RTO fields.

Run:

```bash
npm run production:handoff -- --manifest <manifest.json>
```

The validator requires an official HTTPS hostname, six critical route checks,
SHA-256-matched repository artifacts for deployment/rollback/monitoring and no
secret values. It accepts secret names only. `PASS_HANDOFF_READY` means the
packet is structurally ready for external evidence intake; it never means the
site is deployed, monitored for 90 days, independently secured or approved for
Public Beta. The external ledger and `operations:evidence:intake` remain the
only release authority.
