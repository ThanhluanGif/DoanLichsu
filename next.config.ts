import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./migrations/**/*.sql", "./scripts/migrate.mjs", "./src/lib/db/migration-engine.mjs"],
  },
};

export default nextConfig;
