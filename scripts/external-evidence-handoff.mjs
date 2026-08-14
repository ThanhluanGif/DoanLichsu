import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ledgerPath = resolve("artifacts/operations/external-evidence-ledger.json");
const output = resolve("artifacts/operations/external-evidence-handoff.json");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const requirements = {
  "official-production": ["Operations owner", "fixed HTTPS production origin, deployment record, health/openapi/search curl evidence"],
  "uptime-90-day": ["Operations owner", "external-monitor export covering 90 days with incident review"],
  "council-signoff": ["Historian Council chair", "signed review minutes covering curriculum, policy, rights and release"],
  "ai-golden-human-approval": ["AI safety/editorial reviewers", "dual human review ledger for the complete golden set"],
  "model-comparison": ["AI owner", "independent model/config comparison on the same frozen evaluation set"],
  "dpia-approval": ["Privacy owner", "approved DPIA with retention, deletion, guardian and incident controls"],
  "partner-rights": ["Archivist/Rights owner", "signed permissions or rights decisions with takedown references"],
  "real-pilot": ["Research lead", "consent/guardian process, dated anonymised participant evidence and AI/no-AI comparison"],
  "school-university-reach": ["Curriculum/partnership owner", "named school/university partner evidence and reach results"],
  "independent-security": ["Independent security owner", "scoped pen-test/auth/RBAC/source/AI report with remediation"],
  "named-operations": ["Operations owner", "named rota, escalation, budget, rollback/game-day and measured RPO/RTO"],
};
const rows = ledger.items.map((item) => ({
  id: item.id,
  status: item.status,
  owner: item.owner,
  artifact: item.artifact,
  requiredOwnerRole: requirements[item.id]?.[0] ?? "Unmapped owner role",
  requiredEvidence: requirements[item.id]?.[1] ?? "Define acceptance evidence before review",
  nextAction: item.status === "PASS" ? "Re-verify artifact SHA and retain audit trail" : "Name the responsible owner and attach verifiable artifact; do not self-approve",
}));
const report = { version: "external-evidence-handoff-v1", generatedAt: new Date().toISOString(), sourceLedger: "artifacts/operations/external-evidence-ledger.json", ledgerSha256: createHash("sha256").update(readFileSync(ledgerPath)).digest("hex"), pendingCount: rows.filter((row) => row.status !== "PASS").length, noFabricatedEvidence: true, publicBetaAllowed: false, rows };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# External evidence handoff\n\n- Pending gates: **${report.pendingCount}**\n- Ledger SHA-256: ${report.ledgerSha256}\n- Public Beta allowed: **NO**\n- No fabricated evidence: **YES**\n\n${rows.map((row) => `- **${row.id}** — ${row.status}; owner role: ${row.requiredOwnerRole}; next: ${row.nextAction}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ pendingCount: report.pendingCount, ledgerSha256: report.ledgerSha256, noFabricatedEvidence: true })}\n`);
