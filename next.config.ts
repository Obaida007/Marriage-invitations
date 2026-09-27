import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Files read from disk at runtime must be traced into serverless bundles.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
    "/i/[slug]/opengraph-image": ["./src/assets/fonts/**/*"],
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
