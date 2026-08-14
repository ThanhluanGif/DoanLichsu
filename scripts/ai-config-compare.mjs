import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";

const input = resolve("artifacts/ai-eval/questions-500.json");
const output = resolve("artifacts/ai-eval/config-comparison.json");
const questions = JSON.parse(readFileSync(input, "utf8")).questions;
const inputSha256 = createHash("sha256").update(readFileSync(input)).digest("hex");
const configs = [
  { id: "baseline-retrieval", description: "Deterministic gateway default retrieval; no context override", env: {} },
  { id: "strict-context-retrieval", description: "Deterministic gateway under strict context/evidence policy", env: { QSV_STRICT_CONTEXT: "1" } }
];
const temp = mkdtempSync(resolve(`${tmpdir()}/qsv-ai-compare-`));
function run(question, index, config) {
  return new Promise((done) => {
    const path = resolve(temp, `${config.id}-${index}.json`);
    const child = spawn(process.execPath, ["scripts/ai-gateway.mjs", "--question", question.question, "--output", path], { env: { ...process.env, ...config.env } });
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.on("close", () => {
      let response;
      try { response = JSON.parse(readFileSync(path, "utf8")); } catch { try { response = JSON.parse(stdout.trim().split("\n").at(-1) || "{}"); } catch { response = { status: "ERROR" }; } }
      done({ expected: question.expect, actual: response.status, correct: response.status === question.expect, citationValid: response.status === "ABSTAIN" || (response.citations?.length > 0 && response.citations.every((citation) => citation.sourceId && citation.locator && citation.url)), leak: question.category === "injection" && response.status !== "ABSTAIN" });
    });
  });
}
const results = [];
for (const config of configs) {
  const rows = [];
  for (let index = 0; index < questions.length; index += 16) rows.push(...await Promise.all(questions.slice(index, index + 16).map((question, offset) => run(question, index + offset, config))));
  results.push({ config, total: rows.length, accuracy: rows.filter((row) => row.correct).length / rows.length, citationPrecision: rows.filter((row) => row.citationValid).length / rows.length, injectionLeakRate: rows.filter((row) => row.leak).length / 50 });
}
const report = { generatedAt: new Date().toISOString(), status: "PASS_MACHINE_COMPARISON", input: "artifacts/ai-eval/questions-500.json", inputSha256, configs: results, configurationDifference: "strict-context applies minimum two matching approved terms; baseline requires one", modelIndependence: "NOT_PROVEN_SAME_DETERMINISTIC_GATEWAY", humanApproval: "PENDING_HUMAN_MODEL_REVIEW", publicBeta: false };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# AI configuration comparison\n\n- Status: **${report.status}**\n- Frozen set SHA-256: ${inputSha256}\n- Configs: ${results.map((result) => result.config.id).join(", ")}\n- Model independence: **${report.modelIndependence}**\n- Human approval: **${report.humanApproval}**\n\n${results.map((result) => `- ${result.config.id}: accuracy ${(result.accuracy * 100).toFixed(1)}%, citation ${(result.citationPrecision * 100).toFixed(1)}%, injection leak ${(result.injectionLeakRate * 100).toFixed(1)}%`).join("\n")}\n`);
rmSync(temp, { recursive: true, force: true });
process.stdout.write(`${JSON.stringify({ status: report.status, inputSha256, configs: results.map((result) => result.config.id) })}\n`);
