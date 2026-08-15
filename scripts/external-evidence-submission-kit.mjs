import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ledgerPath = resolve("artifacts/operations/external-evidence-ledger.json");
const outputPath = resolve("artifacts/operations/external-evidence-submission-kit.json");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const ledgerSha256 = createHash("sha256").update(readFileSync(ledgerPath)).digest("hex");

const requiredIds = [
  "official-production",
  "uptime-90-day",
  "council-signoff",
  "ai-golden-human-approval",
  "model-comparison",
  "dpia-approval",
  "partner-rights",
  "real-pilot",
  "school-university-reach",
  "independent-security",
  "named-operations",
];

const definitions = {
  "official-production": {
    labelVi: "Production chính thức",
    labelEn: "Official production",
    role: "Operations owner",
    evidence: "fixed HTTPS production origin, deployment record, health/openapi/search curl evidence",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "uptime-90-day": {
    labelVi: "Uptime 90 ngày",
    labelEn: "90-day uptime",
    role: "Operations owner",
    evidence: "external-monitor export covering 90 days with incident review",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "council-signoff": {
    labelVi: "Hội đồng ký duyệt",
    labelEn: "Historian Council sign-off",
    role: "Historian Council chair",
    evidence: "signed review minutes covering curriculum, policy, rights and release",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "ai-golden-human-approval": {
    labelVi: "Duyệt người thật cho AI golden set",
    labelEn: "AI golden-set human approval",
    role: "AI safety/editorial reviewers",
    evidence: "dual human review ledger for the complete golden set",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "model-comparison": {
    labelVi: "So sánh model độc lập",
    labelEn: "Independent model comparison",
    role: "AI owner",
    evidence: "independent model/config comparison on the same frozen evaluation set",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "dpia-approval": {
    labelVi: "Phê duyệt DPIA/privacy",
    labelEn: "DPIA/privacy approval",
    role: "Privacy owner",
    evidence: "approved DPIA with retention, deletion, guardian and incident controls",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "partner-rights": {
    labelVi: "Quyền Wikimedia/đối tác",
    labelEn: "Wikimedia/partner rights",
    role: "Archivist/Rights owner",
    evidence: "signed permissions or rights decisions with takedown references",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "real-pilot": {
    labelVi: "Pilot người dùng thật",
    labelEn: "Real-user pilot",
    role: "Research lead",
    evidence: "consent/guardian process, dated anonymised participant evidence and AI/no-AI comparison",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "school-university-reach": {
    labelVi: "Tiếp cận trường/đại học",
    labelEn: "School/university reach",
    role: "Curriculum/partnership owner",
    evidence: "named school/university partner evidence and reach results",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "independent-security": {
    labelVi: "Security độc lập",
    labelEn: "Independent security review",
    role: "Independent security owner",
    evidence: "scoped pen-test/auth/RBAC/source/AI report with remediation",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
  "named-operations": {
    labelVi: "Vận hành có người phụ trách",
    labelEn: "Named operations",
    role: "Operations owner",
    evidence: "named rota, escalation, budget, rollback/game-day and measured RPO/RTO",
    nextAction: "Name the responsible owner and attach verifiable artifact; do not self-approve",
  },
};

const submissionFields = [
  { key: "owner", requiredForPass: true, description: "Named person or organisation responsible for this gate." },
  { key: "authority", requiredForPass: true, description: "Role and scope that authorise the evidence." },
  { key: "verifiedAt", requiredForPass: true, description: "ISO-8601 UTC timestamp of verification." },
  { key: "artifact", requiredForPass: true, description: "Repository-relative path under artifacts/; never a URL with a secret." },
  { key: "sha256", requiredForPass: true, description: "Exact SHA-256 of the submitted artifact." },
  { key: "note", requiredForPass: false, description: "Optional context; never include passwords, API keys or tokens." },
];

const sourceRows = Array.isArray(ledger.items) ? ledger.items : [];
const rows = requiredIds.map((id) => {
  const current = sourceRows.find((item) => item?.id === id) ?? {};
  const definition = definitions[id];
  return {
    id,
    status: current.status ?? "PENDING",
    labelVi: definition.labelVi,
    labelEn: definition.labelEn,
    requiredOwnerRole: definition.role,
    requiredEvidence: definition.evidence,
    nextAction: definition.nextAction,
    submission: {
      owner: null,
      authority: null,
      verifiedAt: null,
      artifact: null,
      sha256: null,
      note: null,
    },
  };
});

const report = {
  version: "external-evidence-submission-kit-v1",
  generatedAt: new Date().toISOString(),
  sourceLedger: "artifacts/operations/external-evidence-ledger.json",
  ledgerSha256,
  status: "PENDING_EXTERNAL_EVIDENCE",
  releaseAllowed: false,
  publicBeta: false,
  databaseMutation: false,
  noFabricatedEvidence: true,
  instructions: {
    vi: "Người có thẩm quyền điền submission fields, lưu artifact dưới artifacts/, tính SHA-256 rồi chạy operations:evidence:intake. Không sửa kit để tự phê duyệt và không gửi secret.",
    en: "An authorised owner fills the submission fields, stores the artifact under artifacts/, computes SHA-256, then runs operations:evidence:intake. Do not self-approve or submit secrets.",
    requiredFields: submissionFields,
    allowedStatuses: ["PENDING", "PASS", "REJECTED"],
  },
  pendingCount: rows.filter((row) => row.status === "PENDING").length,
  passedCount: rows.filter((row) => row.status === "PASS").length,
  rejectedCount: rows.filter((row) => row.status === "REJECTED").length,
  rows,
};

if (sourceRows.length !== requiredIds.length || rows.some((row) => !definitions[row.id])) {
  throw new Error("Canonical external evidence ledger does not contain the 11 required gates.");
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
const markdownRows = rows.map((row) => `| ${row.labelVi} / ${row.labelEn} | \`${row.id}\` | ${row.status} | ${row.requiredOwnerRole} | ${row.requiredEvidence} |`).join("\n");
const markdown = [
  "# External evidence submission kit",
  "",
  "This is a blank, hash-bound handoff template. It is not a Council, legal, security, pilot, rights or Public Beta approval.",
  "",
  `- Status: **${report.status}**`,
  `- Ledger SHA-256: \`${report.ledgerSha256}\``,
  `- Pending gates: **${report.pendingCount}**`,
  `- Release allowed: **NO**`,
  `- Public Beta: **DISABLED**`,
  `- Database mutation: **NO**`,
  `- No fabricated evidence: **YES**`,
  "",
  "## Fields an authorised owner must provide",
  "",
  ...submissionFields.map((field) => `- \`${field.key}\`${field.requiredForPass ? " (required for PASS)" : " (optional)"}: ${field.description}`),
  "",
  "## Gate checklist",
  "",
  "| Gate | ID | Status | Required owner role | Required evidence |",
  "|---|---|---|---|---|",
  markdownRows,
  "",
  "After filling an authorised packet, keep this kit unchanged and run `npm run operations:evidence:intake`. Never include passwords, API keys, access tokens or private credentials in the packet.",
  "",
].join("\n");
writeFileSync(outputPath.replace(/\.json$/, ".md"), markdown);
process.stdout.write(`${JSON.stringify({ status: report.status, gates: rows.length, pending: report.pendingCount, releaseAllowed: false, publicBeta: false, databaseMutation: false })}\n`);
