# HTTPS uptime monitor handoff

`npm run operations:uptime` is a fail-closed observation probe for a fixed HTTPS
origin. It checks `/healthz` and `/openapi.json`, records status/content type/latency
for each sample, and writes JSON plus Markdown evidence.

Example operator invocation:

```bash
npm run operations:uptime -- \
  --origin https://production.example.vn \
  --count 2 \
  --interval-ms 0 \
  --output artifacts/operations/uptime-observations.json
```

The output intentionally contains `officialProductionEvidence: false` and
`ninetyDayEvidence: false` unless a future evidence-review process replaces those
fields after a real named operator verifies the origin and monitoring export. A
short local or tunnel run is useful smoke evidence only; it cannot satisfy the
90-day uptime gate.

For production, schedule the command from an external monitor at the desired
interval, retain immutable reports, include incident acknowledgements, and attach
the export to `artifacts/operations/external-evidence-ledger.json` only after the
Operations owner has reviewed it.
