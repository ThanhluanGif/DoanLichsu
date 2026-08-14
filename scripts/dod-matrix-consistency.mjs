import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const load = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const dod = load("artifacts/release/dod-audit.json");
const matrix = load("artifacts/release/year-one-dod-matrix.json");
const output = resolve("artifacts/release/dod-matrix-consistency.json");
const canonical = ["official-production", "uptime-90-day", "council-signoff", "ai-golden-human-approval", "model-comparison", "dpia-approval", "partner-rights", "real-pilot", "school-university-reach", "independent-security", "named-operations"];
const dodBlockers = [...dod.unmetExternal].sort();
const matrixBlockers = canonical.filter((id) => matrix.blockedExternal.includes(id)).sort();
const checks = { overall: dod.status === matrix.overall, publicBeta: dod.publicBeta === matrix.publicBeta, externalBlockers: JSON.stringify(dodBlockers) === JSON.stringify(matrixBlockers) && matrixBlockers.length === canonical.length };
const report = { version: "dod-matrix-consistency-v1", generatedAt: new Date().toISOString(), consistent: Object.values(checks).every(Boolean), checks, dodStatus: dod.status, matrixStatus: matrix.overall, publicBeta: dod.publicBeta, canonicalExternalBlockers: canonical, noFabricatedEvidence: true };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# DoD/matrix consistency\n\n- Consistent: **${report.consistent ? "YES" : "NO"}**\n- DoD: **${report.dodStatus}**\n- Matrix: **${report.matrixStatus}**\n- Public Beta: **${report.publicBeta ? "ENABLED" : "DISABLED"}**\n- Canonical blockers: ${canonical.length}\n`);
process.stdout.write(`${JSON.stringify({ consistent: report.consistent, checks: report.checks, blockers: canonical.length })}\n`);
if (!report.consistent) process.exitCode = 1;
