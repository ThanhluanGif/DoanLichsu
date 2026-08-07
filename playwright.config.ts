import { defineConfig,devices } from "@playwright/test";

const baseURL=process.env.E2E_BASE_URL;
if(!baseURL)throw new Error("E2E_BASE_URL is required.");
const target=new URL(baseURL);
if(target.protocol!=="https:"&&process.env.ALLOW_HTTP_E2E!=="1")throw new Error("E2E_BASE_URL must use HTTPS.");
const outputDirectory=process.env.E2E_OUTPUT_DIR??"artifacts/release/playwright-output";
const reportDirectory=process.env.E2E_REPORT_DIR??"artifacts/release/playwright-report";

export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:false,
  workers:1,
  timeout:90_000,
  expect:{timeout:15_000},
  forbidOnly:true,
  retries:0,
  outputDir:outputDirectory,
  reporter:[["list"],["html",{outputFolder:reportDirectory,open:"never"}]],
  use:{
    ...devices["Desktop Chrome"],
    baseURL:target.origin,
    ignoreHTTPSErrors:process.env.E2E_IGNORE_HTTPS_ERRORS==="1",
    screenshot:"only-on-failure",
    trace:"retain-on-failure",
    video:"off",
  },
});
