/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // Only to avoid "Module not found: Can't resolve 'pino-pretty' and 'encoding'" Use by wallet connect
    webpack: (config) => {
      config.externals.push("pino-pretty", "encoding");
      return config;
    },
  };

export default nextConfig;
