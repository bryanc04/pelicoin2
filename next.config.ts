import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone", // Ensures the app can run dynamically
  trailingSlash: true,
};

export default nextConfig;
