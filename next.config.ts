import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-8bdfb114-3a7c-44a1-91a0-29142d98c976.space-z.ai",
  ],
};

export default nextConfig;
