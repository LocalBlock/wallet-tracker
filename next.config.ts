import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  // Only to avoid "Module not found: Can't resolve 'pino-pretty' and 'encoding'" Use by wallet connect with webpack
  // webpack: (config) => {
  //   config.externals.push("pino-pretty", "encoding");
  //   return config;
  // },
  serverExternalPackages:['pino'], //fix build error with turbopack
};

export default nextConfig;
