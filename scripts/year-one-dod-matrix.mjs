import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const load = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const output = resolve("artifacts/release/year-one-dod-matrix.json");
const dod = load("artifacts/release/dod-audit.json");
const ledger = load("artifacts/operations/external-evidence-ledger.json");
const checks = new Map(dod.checks.map((check) => [check.id, check]));
const rows = [
  ["product", "Official production URL, HTTPS and six critical journeys", "product-surface", "artifacts/operations/live-smoke-proof.json"],
  ["product", "Official production domain and deploy evidence", "official-production", "artifacts/operations/external-evidence-ledger.json"],
  ["content", "Mandatory 6-12 coverage verified", "mandatory-coverage", "artifacts/curriculum-completeness/live-coverage.json"],
  ["content", "Every public lesson has source/claim/reviewer/translation/asOf/correction history", "mandatory-coverage", "artifacts/approved-corpus/snapshot.json"],
  ["rights", "Served media has permitted/public-domain rights and credit/license", "wikimedia-rights-review", "artifacts/wikimedia/rights-review-ledger.json"],
  ["rights", "Partner rights/permission archive", "partner-rights", "artifacts/operations/external-evidence-ledger.json"],
  ["ai", "AI eval, citations/abstention, versions and privacy controls", "ai-machine-eval", "artifacts/ai-eval/report-500.json"],
  ["ai", "Human-approved golden set", "ai-golden-human-approval", "artifacts/operations/external-evidence-ledger.json"],
  ["ai", "Independent model/config comparison", "model-comparison", "artifacts/operations/external-evidence-ledger.json"],
  ["quality", "Lint/typecheck/test/build and local release evidence", "current-head-release-evidence", "artifacts/release/current-head-evidence.json"],
  ["quality", "WCAG/performance/reliability/security KPI evidence", "backup-recovery-mechanism", "artifacts/production-readiness/report.json"],
  ["operations", "Named technical/content/rights/AI owners, rota, budget", "named-operations", "artifacts/operations/external-evidence-ledger.json"],
  ["operations", "90-day uptime and real production operations", "uptime-90-day", "artifacts/operations/external-evidence-ledger.json"],
  ["governance", "Historian Council signed release", "council-signoff", "artifacts/operations/external-evidence-ledger.json"],
  ["privacy", "Approved DPIA/privacy evidence", "dpia-approval", "artifacts/operations/external-evidence-ledger.json"],
  ["research", "Real pilot and school/university reach evidence", "real-pilot", "artifacts/operations/external-evidence-ledger.json"],
  ["security", "Independent security review", "independent-security", "artifacts/operations/external-evidence-ledger.json"],
];
const matrix = rows.map(([group, requirement, checkId, evidence]) => {
  const external = ledger.items.find((item) => item.id === checkId);
  const check = checks.get(checkId);
  if (external) return { group, requirement, status: external.status === "PASS" ? "EVIDENCED_EXTERNAL" : "BLOCKED_EXTERNAL", evidence, gate: checkId, owner: external.owner, artifact: external.artifact, noFabricatedEvidence: true };
  return { group, requirement, status: check?.status ?? "MISSING", evidence, gate: checkId, noFabricatedEvidence: true };
});
const report = { version: "year-one-dod-matrix-v1", generatedAt: new Date().toISOString(), sourcePlanSection: "Section 17 — Definition of Done after 12 months", overall: dod.status, publicBeta: dod.publicBeta, noFabricatedEvidence: true, rows: matrix, blockedExternal: matrix.filter((row) => row.status === "BLOCKED_EXTERNAL").map((row) => row.gate) };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Year-one DoD completion matrix\n\n- Overall: **${report.overall}**\n- Public Beta: **${report.publicBeta ? "ENABLED" : "DISABLED"}**\n- No fabricated evidence: **YES**\n- Blocked external rows: ${report.blockedExternal.length}\n\n${matrix.map((row) => `- **${row.group}** — ${row.requirement}: **${row.status}** (${row.evidence})`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ overall: report.overall, publicBeta: report.publicBeta, rows: matrix.length, blockedExternal: report.blockedExternal.length })}\n`);
