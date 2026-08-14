# Published-history reviewer packet protocol

The canonical packet contains 105 published content rows that need a real
history attestation. The packet generator is read-only; the existing
`/api/v1/admin/contents/{id}/history-review` endpoint is the only write path
for an authorised Reviewer/Admin after source/history comparison.

The generator reconstructs each completed attestation from the corresponding
`content.editorial_history.review` audit row and actor record: reviewer display
name, role, evidence locator, note and ISO timestamp are preserved. Pending rows
keep every attestation field null. If an audit row is incomplete, the packet
validator fails closed instead of filling a default identity or approval.

Run:

```bash
npm run content:history:packet
npm run content:history:packet:check
```

The validator checks the packet hash, 105 unique IDs, VI/EN shape, source/claim
readiness labels and complete reviewer fields for any `HUMAN_REVIEWED` row. A
pending row must have every attestation field blank. The canonical result is
`PASS_PACKET_PENDING_HUMAN`; a packet with some completed rows is
`PASS_WITH_HUMAN_ROWS`. Both states keep `databaseMutation=false` and
`publicBeta=false`. It never creates a reviewer, Council decision or approval;
the external gate remains pending until all rows carry real evidence and the
release process verifies it.
