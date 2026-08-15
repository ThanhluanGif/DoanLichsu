# External evidence submission kit

This is a blank, hash-bound handoff template. It is not a Council, legal, security, pilot, rights or Public Beta approval.

- Status: **PENDING_EXTERNAL_EVIDENCE**
- Ledger SHA-256: `d85b395290e9bbd3b4bdf78c79008423262ea54f923ff61f580d3dd57d93c51d`
- Pending gates: **11**
- Release allowed: **NO**
- Public Beta: **DISABLED**
- Database mutation: **NO**
- No fabricated evidence: **YES**

## Fields an authorised owner must provide

- `owner` (required for PASS): Named person or organisation responsible for this gate.
- `authority` (required for PASS): Role and scope that authorise the evidence.
- `verifiedAt` (required for PASS): ISO-8601 UTC timestamp of verification.
- `artifact` (required for PASS): Repository-relative path under artifacts/; never a URL with a secret.
- `sha256` (required for PASS): Exact SHA-256 of the submitted artifact.
- `note` (optional): Optional context; never include passwords, API keys or tokens.

## Gate checklist

| Gate | ID | Status | Required owner role | Required evidence |
|---|---|---|---|---|
| Production chính thức / Official production | `official-production` | PENDING | Operations owner | fixed HTTPS production origin, deployment record, health/openapi/search curl evidence |
| Uptime 90 ngày / 90-day uptime | `uptime-90-day` | PENDING | Operations owner | external-monitor export covering 90 days with incident review |
| Hội đồng ký duyệt / Historian Council sign-off | `council-signoff` | PENDING | Historian Council chair | signed review minutes covering curriculum, policy, rights and release |
| Duyệt người thật cho AI golden set / AI golden-set human approval | `ai-golden-human-approval` | PENDING | AI safety/editorial reviewers | dual human review ledger for the complete golden set |
| So sánh model độc lập / Independent model comparison | `model-comparison` | PENDING | AI owner | independent model/config comparison on the same frozen evaluation set |
| Phê duyệt DPIA/privacy / DPIA/privacy approval | `dpia-approval` | PENDING | Privacy owner | approved DPIA with retention, deletion, guardian and incident controls |
| Quyền Wikimedia/đối tác / Wikimedia/partner rights | `partner-rights` | PENDING | Archivist/Rights owner | signed permissions or rights decisions with takedown references |
| Pilot người dùng thật / Real-user pilot | `real-pilot` | PENDING | Research lead | consent/guardian process, dated anonymised participant evidence and AI/no-AI comparison |
| Tiếp cận trường/đại học / School/university reach | `school-university-reach` | PENDING | Curriculum/partnership owner | named school/university partner evidence and reach results |
| Security độc lập / Independent security review | `independent-security` | PENDING | Independent security owner | scoped pen-test/auth/RBAC/source/AI report with remediation |
| Vận hành có người phụ trách / Named operations | `named-operations` | PENDING | Operations owner | named rota, escalation, budget, rollback/game-day and measured RPO/RTO |

After filling an authorised packet, keep this kit unchanged and run `npm run operations:evidence:intake`. Never include passwords, API keys, access tokens or private credentials in the packet.
