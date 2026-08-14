# HTTPS performance monitor handoff

`npm run operations:performance` is a bounded, read-only observation probe for a
fixed HTTPS origin. It alternates `/healthz` and public search requests, records
status/latency, and computes p50/p95/max under a capped concurrency.

The output sets `officialLoadEvidence:false` and `officialProductionEvidence:false`.
A local server or quick tunnel run is useful for smoke/performance regression only;
it is not an independent load test and does not satisfy the official production or
90-day uptime gate. The Operations owner must run this against the real domain with
an approved traffic budget and retain the export alongside incident acknowledgements.
