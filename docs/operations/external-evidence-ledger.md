# External evidence ledger — release gate handoff

Status: `PENDING_EXTERNAL_EVIDENCE` (no invented people, signatures, participants, uptime or legal approvals).

| Gate | Required evidence | Acceptance test | Owner to name | Status |
|---|---|---|---|---|
| Official production | DNS/domain, HTTPS certificate, brand approval | Six critical journeys on stable origin | Product/Tech | PENDING |
| 90-day uptime | Monitor export with incident log | Target uptime and acknowledged alerts | SRE | PENDING |
| Council | Member list, COI, dual reviews, release minutes/signature | Sign-off artifact verifies identity/date/scope | Chief Historian | PENDING |
| AI golden set | 500 gold answers/citations and reviewer IDs | Human approval record on frozen set | AI safety + Council | PENDING |
| Model comparison | Two model/config reports on same set | Accuracy/citation/refusal/cost/latency comparison | AI owner | PENDING |
| Privacy/DPIA | Named privacy reviewer and approval/version | Retention/delete/incident controls tested | Privacy owner | PENDING |
| Wikimedia/partners | 300 media decisions; 2 collection permissions/MOU or link-only | Rights ledger and permission archive | Archivist/legal | PENDING |
| Real pilot | Consent/guardian process, dates, anonymised data, AI/no-AI comparison | Comprehension delta reproducible | Research lead | PENDING |
| Reach | 5–10 schools, 1–2 universities, ≥300 users | Partner confirmations and deduplicated count | Product/Research | PENDING |
| Security | Independent pen-test/auth/RBAC/AI/source report | Zero open Critical/High or exception | Security owner | PENDING |
| Operations | Named rota, escalation channels, budget, rollback/game-day | Owner acknowledgement and measured RPO/RTO | Ops owner | PENDING |

Existing machine evidence (500-question eval, disposable backup/restore, smoke, transparency)
does not substitute for these external approvals.

## Evidence packet intake schema

Before changing any row from `PENDING` to `PASS`, run:

```bash
npm run operations:evidence:intake
```

The command is read-only and writes only
`artifacts/operations/external-evidence-intake.json` plus its Markdown summary.
For a claimed `PASS`, the row must include all of the following:

- `owner`: named responsible person or organisation account;
- `authority`: the role/scope that authorises the evidence (for example,
  independent security reviewer or Historian Council chair);
- `verifiedAt`: an ISO-8601 timestamp;
- `artifact`: an existing repository-relative path under `artifacts/`;
- `sha256`: the exact SHA-256 of that artifact.

The validator also checks the gate ID, status, ledger flags and `READY` rule. A
green `PASS_INTAKE_SCHEMA` means only that the packet is structurally
verifiable; it does not mean the Council, production, rights, DPIA, pilot,
security or operations gate has been approved. `releaseAllowed` stays false
until every canonical gate is genuinely `PASS`.
