# HTTPS uptime monitor handoff

`npm run operations:uptime` is a fail-closed observation probe for a fixed HTTPS
origin. It checks `/healthz` and `/openapi.json`, records status/content type/latency
for each sample, and writes JSON plus Markdown evidence.

## Scheduled GitHub Actions monitor

`.github/workflows/production-uptime.yml` runs the same probe every 15 minutes
and supports `workflow_dispatch`. Before enabling it, an authorised Operations
owner must add a repository secret named `PRODUCTION_ORIGIN` containing the fixed
HTTPS production origin. The workflow rejects missing, local, tunnel and example
origins before making a request, uploads each run under
`uptime-observation-<run_id>` with a 90-day retention target, and writes a safe
summary without mutating the external evidence ledger.

An absent secret is an intentional fail-closed state. A green workflow run proves
the monitor executed; it does not by itself prove official production, 90-day
availability, incident review, or Public Beta approval. The Operations owner must
retain the run history and incident acknowledgements, then submit the immutable
export through the external evidence intake process; the release state remains
**PENDING OPERATOR REVIEW** until that handoff is accepted.

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
