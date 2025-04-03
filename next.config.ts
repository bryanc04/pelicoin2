import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/home",
        destination: "/home", // Ensures Next.js handles it properly
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  output: "export",
};

export default nextConfig;
