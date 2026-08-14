import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const output = resolve(option("--output", "artifacts/operations/production-config-preflight.json"));
const envFile = option("--env-file");
const loadEnvFile = (path) => {
  if (!path) return {};
  const values = {};
  for (const line of readFileSync(resolve(path), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
};
const source = { ...process.env, ...loadEnvFile(envFile) };
const errors = [];
const present = (name) => typeof source[name] === "string" && source[name].trim().length > 0;
const text = (name) => String(source[name] ?? "").trim();
const origin = text("APP_ORIGIN");
try {
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:") errors.push("APP_ORIGIN_MUST_USE_HTTPS");
  if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) || /example|trycloudflare|local/i.test(parsed.hostname)) errors.push("APP_ORIGIN_MUST_BE_OFFICIAL_HOST");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) errors.push("APP_ORIGIN_MUST_BE_ORIGIN_ONLY");
} catch {
  errors.push("APP_ORIGIN_MUST_BE_VALID_HTTPS_URL");
}
if (text("NODE_ENV") !== "production") errors.push("NODE_ENV_MUST_BE_PRODUCTION");
const databasePath = text("DATABASE_PATH");
if (!isAbsolute(databasePath)) errors.push("DATABASE_PATH_MUST_BE_ABSOLUTE");
const secret = text("SESSION_SECRET");
if (secret.length < 32) errors.push("SESSION_SECRET_MIN_LENGTH_32");
if (/replace-with|change-me|example|placeholder|demo/i.test(secret)) errors.push("SESSION_SECRET_MUST_NOT_BE_PLACEHOLDER");
if (!present("SESSION_SECRET")) errors.push("SESSION_SECRET_REQUIRED");
if (!new Set(["0", "false", "no", ""]).has(text("ALLOW_DEMO_SEED").toLowerCase())) errors.push("ALLOW_DEMO_SEED_MUST_BE_DISABLED");
if (present("TRUST_PROXY_HEADERS") && !new Set(["0", "1", "false", "true"]).has(text("TRUST_PROXY_HEADERS").toLowerCase())) errors.push("TRUST_PROXY_HEADERS_MUST_BE_BOOLEAN");
if (!present("APP_VERSION")) errors.push("APP_VERSION_REQUIRED");

const report = {
  version: "production-config-preflight-v1",
  generatedAt: new Date().toISOString(),
  input: envFile ? envFile : "process.env",
  status: errors.length ? "BLOCKED_EXTERNAL" : "PASS_PRODUCTION_CONFIG_SHAPE",
  checks: {
    nodeEnvProduction: text("NODE_ENV") === "production",
    officialHttpsOrigin: errors.every((error) => !error.startsWith("APP_ORIGIN_")),
    absoluteDatabasePath: isAbsolute(databasePath),
    sessionSecretPresentAndNonPlaceholder: secret.length >= 32 && !/replace-with|change-me|example|placeholder|demo/i.test(secret) && present("SESSION_SECRET"),
    demoSeedDisabled: new Set(["0", "false", "no", ""]).has(text("ALLOW_DEMO_SEED").toLowerCase()),
    appVersionPresent: present("APP_VERSION"),
  },
  acceptedSecretValues: false,
  databaseMutation: false,
  releaseAllowed: false,
  publicBeta: false,
  errors,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(output.replace(/\.json$/, ".md"), `# Production config preflight\n\n- Status: **${report.status}**\n- Official HTTPS origin shape: **${report.checks.officialHttpsOrigin ? "PASS" : "BLOCKED"}**\n- Absolute database path: **${report.checks.absoluteDatabasePath ? "PASS" : "BLOCKED"}**\n- Session secret: **${report.checks.sessionSecretPresentAndNonPlaceholder ? "PRESENT_AND_NON_PLACEHOLDER" : "BLOCKED"}**\n- Demo seed: **${report.checks.demoSeedDisabled ? "DISABLED" : "BLOCKED"}**\n- Accepted secret values: **NO**\n- Database mutation: **NO**\n- Release allowed: **NO**\n- Public Beta: **DISABLED**\n- Errors: ${errors.length}\n\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, errors: errors.length, acceptedSecretValues: false, databaseMutation: false, releaseAllowed: false, publicBeta: false })}\n`);
if (errors.length) process.exitCode = 1;
