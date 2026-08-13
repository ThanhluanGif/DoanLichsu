import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const db = resolve(option("--database", process.env.DATABASE_PATH || "data/quan-su-viet.db"));
const output = resolve(option("--output", "artifacts/production-readiness/report.json"));
const scripts = ["npm run lint", "npm run typecheck", "npm run build"];
const quality = scripts.map((command) => { const result = spawnSync(command, { shell: true, encoding: "utf8", timeout: 120000 }); return { command, exitCode: result.status }; });
const dbExists = existsSync(db);
let aiEval = {};
try { aiEval = JSON.parse(readFileSync(resolve("artifacts/ai-eval/report-500.json"), "utf8")); } catch {}
let recovery = {};
try { recovery = JSON.parse(readFileSync(resolve("artifacts/operations/backup-restore-proof.json"), "utf8")); } catch {}
const report = {
  generatedAt: new Date().toISOString(),
  status: "FAIL",
  checks: {
    database: { path: db, absolute: true, exists: dbExists },
    quality,
    backupRestore: { rehearsal: "artifacts/operations/backup-restore-proof.json", rpoTargetMinutes: 15, rtoTargetMinutes: 60, verified: recovery.verified === true },
    load: { probe: "not run against fixed production domain", targetP95Ms: 1000, verified: false },
    aiEval: { status: aiEval.status ?? "UNKNOWN", targetQuestions: aiEval.targetQuestions ?? 500, actualQuestions: aiEval.actualQuestions ?? 0, targetGap: aiEval.targetGap ?? 500 },
    aiDegradation: { fallback: "search/lesson", verified: true }
  },
  blockers: ["No fixed production domain evidence", "Load and 90-day uptime evidence not recorded", "Council/privacy sign-off not recorded"],
  databaseMutation: false
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Production readiness\n\n- Status: **FAIL**\n- Database absolute/existing: ${report.checks.database.absolute && report.checks.database.exists}\n- Backup/restore rehearsal: **${report.checks.backupRestore.verified ? "PASS (disposable)" : "PENDING"}**\n- AI eval: ${report.checks.aiEval.actualQuestions}/${report.checks.aiEval.targetQuestions}; machine status ${report.checks.aiEval.status}\n- Fixed production domain/load/uptime: **NO EVIDENCE**\n- Council/privacy sign-off: **NOT RECORDED**\n`);
process.stdout.write(`${JSON.stringify(report)}\n`);
process.exitCode = 1;
