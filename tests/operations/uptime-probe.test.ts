import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "qsv-uptime-probe-"));
let server: Server;
let origin: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === "/healthz") { response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ status: "ok", database: "ok" })); return; }
    if (request.url === "/openapi.json") { response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ openapi: "3.1.0", paths: {} })); return; }
    response.statusCode = 404; response.end("not found");
  });
  await new Promise<void>((resolvePromise) => server.listen({ port: 0, host: "127.0.0.1" }, resolvePromise));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not expose an address");
  origin = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

afterAll(() => { server?.close(); rmSync(temp, { recursive: true, force: true }); });

describe("uptime probe", () => {
  it("rejects non-HTTPS origins before making requests", () => {
    const result = spawnSync(process.execPath, ["scripts/uptime-probe.mjs", "--origin", origin], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("requires an HTTPS origin");
  });

  it("writes honest observation semantics for a failed HTTPS sample", () => {
    const output = join(temp, "failure.json");
    const result = spawnSync(process.execPath, ["scripts/uptime-probe.mjs", "--origin", "https://127.0.0.1:1", "--count", "1", "--interval-ms", "0", "--output", output], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report.status).toBe("FAIL_OBSERVATION");
    expect(report.officialProductionEvidence).toBe(false);
    expect(report.ninetyDayEvidence).toBe(false);
    expect(report.failedSamples).toBe(1);
  });
});
