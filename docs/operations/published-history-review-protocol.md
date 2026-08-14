# Published-history reviewer packet protocol

The canonical packet contains 105 published content rows that need a real
history attestation. The packet generator is read-only; the existing
`/api/v1/admin/contents/{id}/history-review` endpoint is the only write path
for an authorised Reviewer/Admin after source/history comparison.

Run:

```bash
npm run content:history:packet
npm run content:history:packet:check
```

The validator checks the packet hash, 105 unique IDs, VI/EN shape, source/claim
readiness labels and complete reviewer fields for any `HUMAN_REVIEWED` row. A
pending row must have every attestation field blank. The canonical result is
`PASS_PACKET_PENDING_HUMAN`, `databaseMutation=false` and `publicBeta=false`.
It never creates a reviewer, Council decision or approval; the external gate
remains pending until all rows carry real evidence and the release process
verifies it.
